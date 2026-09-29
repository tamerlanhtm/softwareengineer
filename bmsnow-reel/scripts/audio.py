#!/usr/bin/env python3
"""BMSNow by ineed.now: 30 s Reel soundtrack, synthesized from scratch (numpy/scipy only).

Reads the visual cue sheet (out/cues.json) at runtime and renders:
  out/audio.wav        48 kHz, 16-bit PCM, stereo, exactly 1,440,000 samples (30.000 s)
  out/stems/music.wav  pre-master music bus (same format)
  out/stems/sfx.wav    pre-master SFX bus (same format)
  out/audio_report/    spectrograms, waveform, cue timeline, metrics.json (with --report)

Music: 120 BPM, F minor (i-VI-III-VII loop: Fm Db Ab Eb), 15 bars, arranged to the
visual timeline (hook, drop 1, feature groove, build, drop 2, CTA ending on Ab at 29.0).
SFX: 18 cue types, each placed sample-accurately at its `t` (risers and reverse swells
peak at t+dur). The music ducks 2-4 dB around impacts and whooshes.
Master: low-end mono-ing, glue compression, soft clip, look-ahead true-peak limiter,
loudness normalised to -14 LUFS integrated with true peak <= -1 dBTP.

Deterministic: fixed seeds everywhere; each cue's randomness is seeded from its own
(type, time, occurrence), so adding cues never changes how the existing ones sound.

Usage:
  python3 scripts/audio.py                       # render with the default balance
  python3 scripts/audio.py --sfx-gain 2 --music-gain -1
  python3 scripts/audio.py --report              # also write images + metrics
"""
from __future__ import annotations

import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import time
import zlib

import numpy as np
from scipy import signal
from scipy.io import wavfile
from scipy.ndimage import maximum_filter1d, uniform_filter1d

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SR = 48_000
BPM = 120
BEAT = 60.0 / BPM            # 0.5 s
BAR = 4 * BEAT               # 2.0 s
STEP = BEAT / 4              # 16th note = 0.125 s
N_BARS = 15
DURATION = N_BARS * BAR      # 30.0 s
N = int(round(DURATION * SR))  # 1,440,000
SEED = 20260929
FINAL_T = 29.0               # last music hit (Ab add9); tail decays to 30.0
FADE_IN = 0.005
FADE_OUT = 0.30
MUSIC_REF_LUFS = -18.0       # music bus level before the master (SFX levels are set against it)

# ----------------------------------------------------------------------------------------
# small helpers
# ----------------------------------------------------------------------------------------


def S(t: float) -> int:
    """seconds -> nearest sample index"""
    return int(round(t * SR))


def tv(n: int) -> np.ndarray:
    return np.arange(n) / SR


def db(x):
    return 10.0 ** (np.asarray(x, float) / 20.0)


def lin2db(x):
    return 20.0 * np.log10(np.maximum(np.abs(x), 1e-12))


def seed_of(*parts) -> int:
    return zlib.crc32("|".join(str(p) for p in parts).encode()) & 0xFFFFFFFF


def rng_for(*parts) -> np.random.Generator:
    return np.random.default_rng(seed_of(SEED, *parts))


def mtof(m):
    return 440.0 * 2.0 ** ((np.asarray(m, float) - 69.0) / 12.0)


def peak(x) -> float:
    return float(np.max(np.abs(x))) + 1e-12


def norm(x):
    return x / peak(x)


def st(x):
    """mono -> dual-mono stereo"""
    return np.stack([x, x], axis=1)


def smoothstep(e0, e1, x):
    s = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return s * s * (3.0 - 2.0 * s)


def add_at(buf, sig, start: int, gain: float = 1.0):
    """Add `sig` into `buf` starting at sample `start` (clipped to the buffer)."""
    n, m = buf.shape[0], sig.shape[0]
    s0, s1 = max(start, 0), min(start + m, n)
    if s1 <= s0:
        return
    seg = sig[s0 - start:s1 - start]
    if buf.ndim == 2 and seg.ndim == 1:
        seg = seg[:, None]
    buf[s0:s1] += gain * seg


def fade_tail(x, secs=0.01):
    k = min(x.shape[0], S(secs))
    if k > 1:
        w = 0.5 * (1.0 + np.cos(np.linspace(0.0, np.pi, k)))
        x[-k:] *= w if x.ndim == 1 else w[:, None]
    return x


def fade_head(x, secs=0.002):
    k = min(x.shape[0], S(secs))
    if k > 1:
        w = 0.5 * (1.0 - np.cos(np.linspace(0.0, np.pi, k)))
        x[:k] *= w if x.ndim == 1 else w[:, None]
    return x


def automation(points, n=N, exp=False):
    """Piecewise-linear (or exponential) automation curve sampled per audio sample."""
    ts = np.array([p[0] for p in points], float)
    vs = np.array([p[1] for p in points], float)
    t = np.arange(n) / SR
    if exp:
        return np.exp(np.interp(t, ts, np.log(vs)))
    return np.interp(t, ts, vs)


def curve(points, exp=True):
    """Callable automation curve evaluated at arbitrary times (used for STFT frame times)."""
    ts = np.array([p[0] for p in points], float)
    vs = np.array([p[1] for p in points], float)
    if exp:
        lv = np.log(vs)
        return lambda t: np.exp(np.interp(t, ts, lv))
    return lambda t: np.interp(t, ts, vs)


def pan(x, p):
    """Constant-power pan; centre = unity in both channels. `p` scalar or per-sample array."""
    a = (np.clip(p, -1.0, 1.0) + 1.0) * (np.pi / 4.0)
    g = math.sqrt(2.0)
    return np.stack([x * np.cos(a) * g, x * np.sin(a) * g], axis=1)


def stereo_noise(rng, n, corr=0.5):
    c = rng.standard_normal(n)
    a, b = math.sqrt(corr), math.sqrt(1.0 - corr)
    return np.stack([a * c + b * rng.standard_normal(n), a * c + b * rng.standard_normal(n)], axis=1)


# ----------------------------------------------------------------------------------------
# filters
# ----------------------------------------------------------------------------------------
_SOS: dict = {}


def _sos(kind, f, order):
    key = (kind, f if np.isscalar(f) else tuple(f), order)
    s = _SOS.get(key)
    if s is None:
        lim = 0.47 * SR
        ff = min(f, lim) if np.isscalar(f) else tuple(min(v, lim) for v in f)
        s = signal.butter(order, ff, btype=kind, fs=SR, output="sos")
        _SOS[key] = s
    return s


def lpf(x, f, order=2):
    return signal.sosfilt(_sos("lowpass", float(f), order), x, axis=0)


def hpf(x, f, order=2):
    return signal.sosfilt(_sos("highpass", float(f), order), x, axis=0)


def bpf(x, lo, hi, order=2):
    return signal.sosfilt(_sos("bandpass", (float(lo), float(hi)), order), x, axis=0)


def one_pole(x, tau):
    a = math.exp(-1.0 / (tau * SR))
    return signal.lfilter([1.0 - a], [1.0, -a], x, axis=0)


def glide(x, tau):
    """one-pole smoothing that starts settled on x[0] (for pitch glides)"""
    a = math.exp(-1.0 / (tau * SR))
    y, _ = signal.lfilter([1.0 - a], [1.0, -a], x, zi=[a * x[0]])
    return y


def tv_filter(x, fc, kind="lp", order=2, q=1.0, nper=1024):
    """Time-varying filter applied in the STFT domain (zero-phase magnitude response).

    fc: callable(frame_times)->Hz, a scalar, or a per-sample array of cutoffs (Hz).
    kind: 'lp' | 'hp' | 'bp' (Butterworth-shaped magnitude; bp is a resonant 2-pole band).
    """
    x = np.asarray(x, float)
    mono = x.ndim == 1
    X = x[None, :] if mono else x.T
    n = X.shape[-1]
    hop = nper // 4
    f, tt, Z = signal.stft(X, fs=SR, window="hann", nperseg=nper, noverlap=nper - hop,
                           boundary="zeros", padded=True)
    if callable(fc):
        fcs = np.asarray(fc(tt), float)
    else:
        fca = np.asarray(fc, float)
        fcs = np.full(tt.size, float(fca)) if fca.ndim == 0 else np.interp(tt, np.arange(fca.size) / SR, fca)
    fcs = np.clip(fcs, 10.0, 0.49 * SR)
    r = np.maximum(f, 1.0)[:, None] / fcs[None, :]
    if kind == "lp":
        H = (1.0 + r ** (2 * order)) ** -0.5
    elif kind == "hp":
        H = (1.0 + r ** (-2 * order)) ** -0.5
    else:
        H = (1.0 + (q * (r - 1.0 / r)) ** 2) ** (-0.5 * order)
    _, y = signal.istft(Z * H[None], fs=SR, window="hann", nperseg=nper, noverlap=nper - hop, boundary=True)
    y = y[..., :n]
    if y.shape[-1] < n:
        y = np.pad(y, [(0, 0), (0, n - y.shape[-1])])
    return y[0] if mono else y.T


# ----------------------------------------------------------------------------------------
# oscillators
# ----------------------------------------------------------------------------------------


def phase_of(f, phase0=0.0):
    """Per-sample phase (cycles) from a per-sample frequency array; first sample = phase0."""
    f = np.asarray(f, float)
    return phase0 + (np.cumsum(f) - f) / SR


def saw(f, phase0=0.0):
    """PolyBLEP band-limited sawtooth for a per-sample frequency array."""
    f = np.asarray(f, float)
    dt = f / SR
    ph = np.mod(phase_of(f, phase0), 1.0)
    y = 2.0 * ph - 1.0
    m = ph < dt
    x = ph[m] / dt[m]
    y[m] -= x + x - x * x - 1.0
    m = ph > 1.0 - dt
    x = (ph[m] - 1.0) / dt[m]
    y[m] -= x * x + x + x + 1.0
    return y


def tri_from_phase(ph):
    return 1.0 - 4.0 * np.abs(np.mod(ph, 1.0) - 0.5)


# ----------------------------------------------------------------------------------------
# reverb
# ----------------------------------------------------------------------------------------
_IR: dict = {}


def make_ir(rt60, seed, predelay=0.012, lo_cut=200.0, hi_cut=9000.0, damp=0.45, length=None):
    """Synthetic stereo IR: decorrelated noise, exponential decay, faster decay for highs."""
    length = length or min(3.5, rt60 * 1.15 + predelay)
    n = S(length)
    rng = np.random.default_rng(seed)
    t = tv(n)
    w = rng.standard_normal((n, 2))
    low = lpf(w, 1800.0)
    high = w - low
    ir = low * np.exp(-6.9078 * t / rt60)[:, None] + high * np.exp(-6.9078 * t / (rt60 * damp))[:, None]
    ir *= (1.0 - np.exp(-t / 0.006))[:, None]
    ir = hpf(lpf(ir, hi_cut), lo_cut)
    pd = S(predelay)
    ir = np.concatenate([np.zeros((pd, 2)), ir[: n - pd]])
    for k in range(8):  # a few early reflections
        i = S(rng.uniform(0.003, 0.035))
        ir[i, k % 2] += rng.choice([-1.0, 1.0]) * 0.55 * 0.8 ** k * float(np.max(np.abs(ir)))
    fade_tail(ir, 0.05)
    ir /= math.sqrt(float(np.sum(ir ** 2)) / 2.0)
    return ir


def get_ir(name):
    if name not in _IR:
        cfg = {
            "hall": dict(rt60=1.5, predelay=0.022, lo_cut=260.0, hi_cut=7500.0, damp=0.5),
            "room": dict(rt60=0.45, predelay=0.004, lo_cut=300.0, hi_cut=9000.0, damp=0.55),
            "plate": dict(rt60=0.9, predelay=0.010, lo_cut=350.0, hi_cut=8000.0, damp=0.5),
            "impact": dict(rt60=1.4, predelay=0.008, lo_cut=90.0, hi_cut=6000.0, damp=0.45),
            "final": dict(rt60=1.0, predelay=0.018, lo_cut=260.0, hi_cut=7000.0, damp=0.45),
        }[name]
        _IR[name] = make_ir(seed=seed_of(SEED, "ir", name), **cfg)
    return _IR[name]


def convolve_stereo(x, ir):
    m = x if x.ndim == 1 else 0.5 * (x[:, 0] + x[:, 1])
    n = m.shape[0]
    return np.stack([signal.oaconvolve(m, ir[:, c])[:n] for c in range(2)], axis=1)


# ----------------------------------------------------------------------------------------
# drum one-shots (mono, peak-normalised)
# ----------------------------------------------------------------------------------------


def kick_sample(rng, f0=160.0, f1=44.0, ptau=0.03, tau=0.2, hold=0.035, length=0.46, click=1.0, drive=1.7):
    n = S(length)
    t = tv(n)
    f = f1 + (f0 - f1) * np.exp(-t / ptau)
    amp = np.exp(-np.maximum(t - hold, 0.0) / tau)
    body = np.tanh(drive * np.sin(2 * np.pi * phase_of(f)) * amp) / np.tanh(drive)
    nz = norm(bpf(rng.standard_normal(n), 1400.0, 8000.0) * np.exp(-t / 0.003))
    tick = np.sin(2 * np.pi * 2900.0 * t) * np.exp(-t / 0.0016)
    y = body + click * (0.22 * nz + 0.2 * tick)
    y *= np.clip(t / 0.0004, 0.0, 1.0)
    return norm(fade_tail(y, 0.05))


def clap_sample(rng, length=0.5):
    n = S(length)
    t = tv(n)
    band = bpf(rng.standard_normal(n), 950.0, 5200.0)
    env = np.zeros(n)
    offs = (0.0, 0.0105, 0.0215, 0.033)
    for k, o in enumerate(offs):
        i = S(o)
        env[i:] += (0.62 if k < 3 else 1.0) * np.exp(-t[: n - i] / (0.0045 if k < 3 else 0.011))
    i = S(offs[-1])
    env[i:] += 0.42 * np.exp(-t[: n - i] / 0.12)
    y = lpf(band * env, 11000.0)
    return norm(fade_tail(y, 0.06))


def snare_sample(rng, tune=1.0, length=0.42, ntau=0.13):
    n = S(length)
    t = tv(n)
    f = 188.0 * tune * (1.0 + 0.45 * np.exp(-t / 0.008))
    body = np.sin(2 * np.pi * phase_of(f)) * np.exp(-t / 0.075)
    body += 0.35 * np.sin(2 * np.pi * phase_of(f * 1.62)) * np.exp(-t / 0.045)
    nz = norm(hpf(lpf(rng.standard_normal(n), 10500.0), 1600.0) * np.exp(-t / ntau))
    y = 0.75 * body + nz
    y *= np.clip(t / 0.0004, 0.0, 1.0)
    return norm(fade_tail(y, 0.05))


HAT_F = np.array([205.3, 304.4, 369.6, 522.7, 540.0, 800.0])


def metal(rng, n, mult=1.0):
    t = tv(n)
    y = np.zeros(n)
    for f in HAT_F * mult:
        y += np.sign(np.sin(2 * np.pi * (f * t + rng.uniform())))
    return y / len(HAT_F)


def hat_sample(rng, tau=0.034, length=0.2):
    n = S(length)
    t = tv(n)
    y = 0.55 * metal(rng, n) + 0.3 * rng.standard_normal(n)
    y = hpf(y, 6800.0, order=3)
    y = y + 0.6 * bpf(y, 8500.0, 11500.0)
    y = lpf(y, 14500.0, order=2)
    y *= np.clip(t / 0.0006, 0.0, 1.0) * np.exp(-t / tau)
    return norm(fade_tail(y, 0.02))


def crash_sample(rng, tau=0.9, length=2.8):
    n = S(length)
    t = tv(n)
    out = np.zeros((n, 2))
    for c in range(2):
        y = 0.45 * metal(rng, n, 1.77 + 0.03 * c) + 0.5 * rng.standard_normal(n)
        y = lpf(hpf(y, 3400.0, order=3), 13500.0, order=2)
        out[:, c] = y
    env = np.clip(t / 0.0012, 0.0, 1.0) * (0.5 * np.exp(-t / 0.07) + 0.5 * np.exp(-t / tau))
    out *= env[:, None]
    return norm(fade_tail(out, 0.2))


def tom_sample(rng, f0, length=0.42):
    n = S(length)
    t = tv(n)
    f = f0 * (1.0 + 0.55 * np.exp(-t / 0.025))
    y = np.tanh(1.4 * np.sin(2 * np.pi * phase_of(f)) * np.exp(-t / 0.16)) / np.tanh(1.4)
    y += 0.3 * norm(bpf(rng.standard_normal(n), 900.0, 5000.0) * np.exp(-t / 0.005))
    return norm(fade_tail(y, 0.05))


def shaker_sample(rng, length=0.07):
    n = S(length)
    t = tv(n)
    y = bpf(rng.standard_normal(n), 5200.0, 12000.0)
    y *= np.clip(t / 0.005, 0.0, 1.0) * np.exp(-np.maximum(t - 0.005, 0.0) / 0.016)
    return norm(fade_tail(y, 0.01))


# ----------------------------------------------------------------------------------------
# tonal instruments
# ----------------------------------------------------------------------------------------
_PLUCK: dict = {}


def pluck(midi, length=0.42, bright=1.0):
    """Additive pluck: harmonic k decays faster the higher it is (bright attack, mellow tail)."""
    key = (int(midi), round(length, 3), round(bright, 3))
    if key in _PLUCK:
        return _PLUCK[key]
    f0 = float(mtof(midi))
    n = S(length)
    t = tv(n)
    rng = np.random.default_rng(seed_of(SEED, "pluck", *key))
    y = np.zeros(n)
    for k in range(1, int(min(28, 14000.0 / f0)) + 1):
        amp = (1.0 / k) * 0.94 ** (k - 1)
        rate = 5.5 + 3.2 * (k - 1) ** 1.35 / bright
        y += amp * np.exp(-rate * t) * np.sin(2 * np.pi * k * f0 * t + rng.uniform(0, 2 * np.pi))
    y += 0.3 * np.sin(2 * np.pi * f0 * t) * np.exp(-t / 0.12)
    y *= np.clip(t / 0.0012, 0.0, 1.0)
    y = norm(fade_tail(y, 0.04))
    _PLUCK[key] = y
    return y


def supersaw_chord(rng, midis, length, tau, voices=7, spread=18.0, attack=0.003):
    n = S(length)
    t = tv(n)
    out = np.zeros((n, 2))
    det = np.linspace(-1.0, 1.0, voices)
    for m in midis:
        f = float(mtof(m))
        for d in det:
            v = saw(np.full(n, f * 2.0 ** (d * spread / 1200.0)), phase0=rng.uniform())
            out += pan(v, 0.8 * d) / voices
    out *= (np.clip(t / attack, 0.0, 1.0) * np.exp(-t / tau))[:, None]
    return fade_tail(out, 0.06)


# ----------------------------------------------------------------------------------------
# arrangement data
# ----------------------------------------------------------------------------------------
#             sub midi, mid-bass midi, pad voicing (4 voices), arp root, third (3=minor)
CHORDS = {
    "Fm": dict(sub=29, mid=41, pad=(53, 60, 63, 68), arp=65, third=3),   # Fm7   F C Eb Ab
    "Db": dict(sub=37, mid=49, pad=(49, 60, 65, 68), arp=61, third=4),   # Dbmaj7
    "Ab": dict(sub=32, mid=44, pad=(56, 60, 63, 67), arp=68, third=4),   # Abmaj7
    "Eb": dict(sub=39, mid=51, pad=(51, 58, 65, 67), arp=63, third=4),   # Eb add9
}
FINAL = dict(sub=32, mid=44, pad=(56, 60, 63, 70), stab=(56, 63, 68, 70, 72, 75), arp=80)  # Ab add9
PROG = ["Eb", "Fm", "Db", "Ab", "Eb", "Fm", "Db", "Ab", "Eb", "Fm", "Db", "Eb", "Fm", "Db", "Eb"]
SECTION = ["intro", "drop1", "A1", "A1", "A2", "A2", "B1", "B1", "B2", "B2", "C", "build", "drop2", "cta", "end"]
SECTIONS_REPORT = [  # (name, t0, t1) for the printed report
    ("hook", 0, 2), ("drop 1", 2, 4), ("groove A", 4, 8), ("groove A2", 8, 12), ("groove B", 12, 16),
    ("groove B2", 16, 20), ("groove C", 20, 22), ("build", 22, 24), ("drop 2", 24, 26),
    ("CTA", 26, 28), ("end", 28, 30),
]
ARP_A = ["R", "5", "8", "R", "5", "8", "R", "5", "8", "R", "5", "8", "T", "8", "5", "8"]
ARP_B = ["8", "T", "12", "8", "T", "12", "8", "T", "12", "8", "T", "12", "15", "12", "T", "12"]
GAP = (23.935, 23.995)  # music breath right before drop 2


def arp_offset(tok, third):
    return {"R": 0, "5": 7, "8": 12, "T": 12 + third, "12": 19, "15": 24}[tok]


def bar_of(t):
    return min(int(t // BAR), N_BARS - 1)


def sidechain(kick_times, depth, release=0.13, hold=0.012, length=0.42):
    k = S(length)
    t = tv(k)
    shape = np.where(t < hold, 1.0, np.exp(-(t - hold) / release)) * (1.0 - smoothstep(length - 0.1, length, t))
    pre = S(0.003)
    kernel = np.concatenate([np.linspace(0.0, 1.0, pre, endpoint=False), shape])
    g = np.zeros(N)
    for tk in kick_times:
        add_at(g, kernel, S(tk) - pre)
    return 1.0 - depth * np.minimum(g, 1.0)


def render_music(verbose=False):
    """Returns (music (N,2) normalised to MUSIC_REF_LUFS, info dict)."""
    t_all = np.arange(N) / SR
    bar_idx = np.minimum((np.arange(N) // S(BAR)), N_BARS - 1)
    iF = S(FINAL_T)

    # ---------------- drums ----------------
    kick = kick_sample(rng_for("kick"))
    kick_final = kick_sample(rng_for("kick-final"), f0=175.0, tau=0.32, length=1.0, drive=2.0)
    clap = clap_sample(rng_for("clap"))
    snare = snare_sample(rng_for("snare"))
    roll_snares = [snare_sample(rng_for("roll", i), tune=1.0 + 0.05 * i, ntau=0.09) for i in range(8)]
    hats = [hat_sample(rng_for("hat", i), tau=0.028 + 0.005 * i) for i in range(4)]
    ohats = [hat_sample(rng_for("ohat", i), tau=0.085, length=0.34) for i in range(2)]
    crash = crash_sample(rng_for("crash"))
    crash_final = crash_sample(rng_for("crash-final"), tau=0.3, length=1.0)
    toms = {k: tom_sample(rng_for("tom", k), f) for k, f in (("hi", 196.0), ("mid", 147.0), ("lo", 110.0))}
    shakers = [shaker_sample(rng_for("shaker", i)) for i in range(3)]
    hrng = rng_for("humanize")

    kick_bus = np.zeros((N, 2))
    intro_bus = np.zeros((N, 2))
    perc = np.zeros((N, 2))       # clap/snare/toms/rolls
    hat_bus = np.zeros((N, 2))
    cym_bus = np.zeros((N, 2))
    room_send = np.zeros(N)

    kick_times = []
    for bar in range(N_BARS):
        sec = SECTION[bar]
        beats = (0, 1, 2) if sec == "intro" else (0, 1) if sec == "end" else (0, 1, 2, 3)
        for b in beats:
            tk = bar * BAR + b * BEAT
            kick_times.append(tk)
            add_at(intro_bus if sec == "intro" else kick_bus, st(kick), S(tk), 1.0)
    add_at(kick_bus, st(kick_final), iF, 1.05)
    kick_times.append(FINAL_T)

    def perc_hit(sample, t, g, p=0.0, send=0.9):
        add_at(perc, pan(sample, p), S(t), g)
        add_at(room_send, sample, S(t), g * send)

    for bar in range(N_BARS):
        sec = SECTION[bar]
        if sec in ("intro", "build"):
            continue
        v = 1.0 if sec in ("drop1", "drop2") else 0.92
        for b in ((1,) if sec == "end" else (1, 3)):
            t = bar * BAR + b * BEAT
            perc_hit(clap, t, 0.62 * v, 0.0)
            perc_hit(snare, t, 0.3 * v, 0.0)

    # 16th hats with a humanised velocity groove, slight swing; open hats on the "and" when busy
    busy = {"A2", "B1", "B2", "C", "drop2", "cta", "end"}
    for bar in range(N_BARS):
        sec = SECTION[bar]
        if sec == "intro":
            continue
        for s in range(16):
            if sec in ("build", "end") and s >= 8:
                break
            pos = s % 4
            t = bar * BAR + s * STEP
            if sec in busy and pos == 2:
                add_at(hat_bus, pan(ohats[s // 4 % 2], -0.18), S(t + hrng.normal(0, 0.001)), 0.2 * (1 + 0.05 * hrng.standard_normal()))
                continue
            vel = (0.8, 0.42, 0.95, 0.55)[pos] * (1.0 + 0.08 * hrng.standard_normal()) * (1.0 + 0.06 * math.sin(2 * math.pi * s / 16))
            if sec == "build":
                vel *= 1.0 - s / 11.0
            dt = (0.006 if pos in (1, 3) else 0.0) + hrng.normal(0, 0.0012)
            add_at(hat_bus, pan(hats[(s + bar) % 4], 0.16), S(t + dt), 0.22 * vel)
    for bar in range(N_BARS):
        sec = SECTION[bar]
        if sec not in ("B1", "B2", "C", "drop2", "cta", "end"):
            continue
        for s in range(8 if sec == "end" else 16):
            vel = (0.35, 0.62, 0.42, 0.72)[s % 4] * (1.0 + 0.1 * hrng.standard_normal())
            add_at(hat_bus, pan(shakers[s % 3], 0.4), S(bar * BAR + s * STEP + 0.004 * (s % 2) + hrng.normal(0, 0.0015)), 0.13 * vel)

    for t, g, smp in ((2.0, 1.0, crash), (24.0, 1.0, crash), (12.0, 0.4, crash), (16.0, 0.4, crash),
                      (20.0, 0.4, crash), (26.0, 0.45, crash), (FINAL_T, 0.9, crash_final)):
        add_at(cym_bus, smp, S(t), 0.3 * g)

    # fills at phrase ends (12, 16, 20) and into the final hit
    for k in range(1, 4):
        perc_hit(snare, 11.5 + k * STEP, 0.26 + 0.07 * k, 0.1 * (k - 2))
    for (t, tom, p) in ((15.5, "hi", 0.35), (15.625, "hi", 0.3), (15.75, "mid", 0.0), (15.875, "lo", -0.35)):
        perc_hit(toms[tom], t, 0.5, p, send=1.0)
    for k in range(6):
        perc_hit(roll_snares[min(k, 7)], 19.625 + k * STEP / 2, 0.2 + 0.05 * k, 0.0)
    for k in range(4):
        perc_hit(roll_snares[k + 2], 28.5 + k * STEP, 0.3 + 0.08 * k, 0.0)
    perc_hit(toms["lo"], 28.875, 0.35, -0.2, send=1.0)

    # build: 8ths -> 16ths -> 32nds snare roll, rising pitch and level
    roll_t = [22.0 + i * 0.25 for i in range(4)] + [23.0 + i * STEP for i in range(4)] + [23.5 + i * STEP / 2 for i in range(7)]
    for i, t in enumerate(roll_t):
        x = i / (len(roll_t) - 1)
        smp = roll_snares[min(7, int(x * 7.99))]
        perc_hit(smp, t, 0.2 + 0.32 * x ** 1.3, 0.0, send=1.1)
        if i >= 8:
            perc_hit(clap, t, 0.12 + 0.15 * x, 0.0, send=0.5)

    intro_bus = lpf(intro_bus, 320.0, order=2)
    room = convolve_stereo(room_send, get_ir("room"))
    drums = kick_bus * 0.92 + intro_bus * 0.9 + perc + hat_bus + cym_bus + room * 0.22

    # ---------------- bass: mono sub + saturated mid layer, both sidechained ----------------
    sub_m = np.array([CHORDS[c]["sub"] for c in PROG], float)[bar_idx]
    sub_m[iF:] = FINAL["sub"]
    sub = np.sin(2 * np.pi * phase_of(glide(mtof(sub_m), 0.008)))
    sub_amp = automation([(0, 0), (BAR - 0.004, 0), (BAR, 1), (22.8, 1), (23.0, 0), (24.0 - 0.004, 0), (24.0, 1), (DURATION, 1)])
    sub_amp[iF:] *= np.exp(-(t_all[iF:] - FINAL_T) / 0.4)
    sub *= sub_amp * sidechain(kick_times, 0.82, release=0.12)

    mid_m = np.array([CHORDS[c]["mid"] for c in PROG], float)[bar_idx]
    mid_m[iF:] = FINAL["mid"]
    fm = glide(mtof(mid_m), 0.004)
    osc = 0.6 * saw(fm, 0.1) + 0.4 * saw(fm * 1.0045, 0.6)
    dark, bright = lpf(osc, 650.0), lpf(osc, 2600.0)
    gate, gate_fast = np.zeros(N), np.zeros(N)

    def bass_note(t0, length, vel, tau=0.06, floor=0.7):
        n = S(length + 0.025)
        t = tv(n)
        e = np.clip(t / 0.003, 0, 1) * (floor + (1 - floor) * np.exp(-t / tau))
        e *= 1.0 - smoothstep(length, length + 0.025, t)
        add_at(gate, e, S(t0), vel)
        add_at(gate_fast, e * np.exp(-t / 0.045), S(t0), vel)

    for bar in range(N_BARS):
        sec = SECTION[bar]
        if sec == "intro":
            continue
        if sec in ("B1", "B2", "drop2", "cta"):
            notes = [(s, 0.8, 1.0 if s % 4 == 2 else 0.72) for s in range(16) if s % 4]
        elif sec in ("build", "end"):
            notes = [(2, 1.5, 1.0), (6, 1.5, 1.0)]
        else:
            notes = [(s, 1.5, 1.0) for s in (2, 6, 10, 14)]
        for s, ln, v in notes:
            bass_note(bar * BAR + s * STEP, ln * STEP, v)
    bass_note(FINAL_T, 0.9, 1.0, tau=0.3, floor=0.0)
    mid = dark * gate + 0.55 * bright * gate_fast
    mid = np.tanh(1.8 * mid) / np.tanh(1.8)
    mid = lpf(hpf(mid, 75.0), 4200.0) * sidechain(kick_times, 0.55, release=0.1)
    bass = st(0.5 * sub + 0.2 * mid)

    # ---------------- pad: 4 voices x 5 detuned saws, voice-led, glides between chords -----
    prng = rng_for("pad")
    pad = np.zeros((N, 2))
    for j in range(4):
        vm = np.array([CHORDS[c]["pad"][j] for c in PROG], float)[bar_idx]
        vm[iF:] = FINAL["pad"][j]
        f = glide(mtof(vm), 0.02)
        for d, p in zip((-11, -5, 0, 5, 11), (-0.75, -0.35, 0.0, 0.35, 0.75)):
            pad += pan(saw(f * 2.0 ** (d / 1200.0), prng.uniform()), p) * 0.2
    pad = lpf(pad, 6000.0)
    pad = tv_filter(pad, curve([(0, 450), (1.95, 1600), (2.0, 3500), (3.99, 3500), (4.0, 2200), (11.99, 2200), (12.0, 2800),
                                (19.99, 2800), (20.0, 2400), (22.0, 1300), (23.93, 8000), (24.0, 5000), (25.99, 5000),
                                (26.0, 4000), (29.0, 4000), (30.0, 2200)]), "lp", order=2)
    pad_amp = automation([(0, 0.0), (0.3, 0.45), (1.95, 0.75), (2.0, 1.0), (3.99, 1.0), (4.0, 0.72), (11.99, 0.72), (12.0, 0.8),
                          (22.0, 0.8), (23.93, 1.05), (24.0, 1.0), (25.99, 1.0), (26.0, 0.9), (DURATION, 0.9)])
    pad_amp[iF:] *= np.exp(-(t_all[iF:] - FINAL_T) / 0.35)
    pad *= (pad_amp * sidechain(kick_times, 0.45, release=0.16))[:, None]

    # ---------------- pluck arp (16ths), ping-pong delay ----------------
    arng = rng_for("arp")
    arp = np.zeros((N, 2))
    lvl = {"intro": 0.55, "drop1": 0.9, "A1": 0.8, "A2": 0.85, "B1": 0.85, "B2": 0.9, "C": 0.85,
           "build": 0.9, "drop2": 1.0, "cta": 0.9, "end": 0.9}
    for bar in range(N_BARS):
        sec, ch = SECTION[bar], CHORDS[PROG[bar]]
        pat = ARP_B if sec in ("B1", "B2", "drop2") else ARP_A
        steps = range(0, 16, 2) if sec == "intro" else range(8) if sec == "end" else range(16)
        for s in steps:
            midi = ch["arp"] + arp_offset(pat[s], ch["third"])
            note = pluck(midi, 0.34 if pat is ARP_B else 0.42)
            vel = (1.0, 0.62, 0.78, 0.62)[s % 4] * lvl[sec] * (1.0 + 0.05 * arng.standard_normal())
            add_at(arp, pan(note, 0.22 if s % 2 else -0.22), S(bar * BAR + s * STEP), vel)
            if sec == "drop2":  # octave doubling for the biggest section
                add_at(arp, pan(pluck(midi - 12, 0.3), -0.1), S(bar * BAR + s * STEP), 0.35 * vel)
    add_at(arp, st(pluck(FINAL["arp"], 1.0, bright=0.8)), iF, 0.9)
    add_at(arp, st(pluck(FINAL["arp"] - 5, 1.0, bright=0.8)), iF, 0.6)
    arp = tv_filter(arp, curve([(0, 900), (1.95, 4200), (2.0, 7000), (21.99, 7000), (22.0, 1800), (23.93, 11000),
                                (24.0, 8000), (DURATION, 8000)]), "lp", order=2)
    delay_src = hpf(lpf(0.5 * (arp[:, 0] + arp[:, 1]), 4500.0), 350.0)
    delay = np.zeros((N, 2))
    for k in range(1, 5):  # dotted-8th ping-pong
        add_at(delay[:, (k - 1) % 2], delay_src, S(0.375 * k), 0.36 ** k)
    arp = (arp + delay) * sidechain(kick_times, 0.3, release=0.1)[:, None]

    # ---------------- supersaw stabs ----------------
    srng = rng_for("stabs")
    stabs = np.zeros((N, 2))
    fm_st = (60, 65, 68, 72, 75)
    db_st = (61, 65, 68, 72, 77)
    for t, v, ch, tau, ln in ((2.0, 1.0, fm_st, 0.22, 0.9), (24.0, 1.0, fm_st, 0.2, 0.5), (24.5, 0.85, fm_st, 0.2, 0.5),
                              (25.0, 1.0, fm_st, 0.2, 0.5), (25.75, 0.55, fm_st, 0.09, 0.25), (26.0, 0.8, db_st, 0.25, 0.9)):
        add_at(stabs, supersaw_chord(srng, ch, ln, tau), S(t), v)
    final_stab = supersaw_chord(srng, FINAL["stab"], DURATION - FINAL_T, 0.42, attack=0.004)
    add_at(stabs, final_stab, iF, 1.0)
    stabs = lpf(hpf(stabs, 180.0), 6000.0)

    # ---------------- music FX: build riser + reverse cymbal into the final hit -------------
    frng = rng_for("musicfx")
    fx = np.zeros((N, 2))
    r0, r1 = 22.0, GAP[0]
    n = S(r1) - S(r0)
    x = np.linspace(0.0, 1.0, n)
    nz = tv_filter(stereo_noise(frng, n, 0.4), 500.0 * (14.0 ** x), "bp", q=1.4, order=1, nper=1024)
    tone = sum(saw(mtof(53) * 2.0 ** (2.0 * x ** 1.3) * 2.0 ** (c / 1200.0), frng.uniform()) for c in (-9, 0, 9)) / 3.0
    tone = tv_filter(tone, 600.0 * (12.0 ** x), "lp", order=2)
    riser = (norm(nz) * 0.8 + st(norm(tone)) * 0.35) * (x ** 2.2)[:, None]
    add_at(fx, fade_tail(riser, 0.004), S(r0), 1.0)
    rv = crash_sample(frng, tau=0.2, length=0.5)[::-1].copy()
    add_at(fx, fade_tail(fade_head(rv, 0.05), 0.004), iF - rv.shape[0], 0.35)

    # ---------------- build: tonal high-pass sweep, then mix ----------------
    tonal = bass + pad * 0.15 + arp * 0.2
    tonal = tv_filter(tonal, curve([(0, 18), (22.0, 18), (GAP[0], 650), (23.999, 650), (24.0, 18), (DURATION, 18)]), "hp", order=2)
    hall_send = pad * 0.15 * 0.25 + arp * 0.2 * 0.3 + stabs * 0.45 + st(room_send) * 0.0
    hall = convolve_stereo(hall_send, get_ir("hall"))
    fin = np.zeros((N, 2))
    add_at(fin, convolve_stereo(final_stab * 0.5, get_ir("final")), iF)

    dry = drums + tonal + stabs * 0.3 + fx * 0.1
    gap = automation([(0, 1), (GAP[0] - 0.004, 1), (GAP[0], 0), (GAP[1], 0), (GAP[1] + 0.004, 1), (DURATION, 1)])
    dry *= gap[:, None]
    music = dry + hall * 0.35 + fin * 0.1
    sect_db = automation([(0, -3.0), (1.99, -3.0), (2.0, 0.5), (3.99, 0.5), (4.0, -1.0), (11.99, -1.0), (12.0, -0.5), (21.99, -0.5),
                          (22.0, -2.0), (23.99, 0.0), (24.0, 1.0), (25.99, 1.0), (26.0, 0.0), (DURATION, 0.0)])
    music *= db(sect_db)[:, None]
    g = db(MUSIC_REF_LUFS - integrated_lufs(music))
    music *= g
    info = dict(kick_times=kick_times, norm_gain_db=float(lin2db(g)))
    if verbose:
        parts = dict(kick=kick_bus * 0.92 + intro_bus * 0.9, perc=perc + room * 0.22, hats=hat_bus, cymbals=cym_bus,
                     bass=bass, pad=pad * 0.15, arp=arp * 0.2, stabs=stabs * 0.3, hall=hall * 0.35, fx=fx * 0.1)
        print("  music parts (LUFS, section 24-26 / whole, after normalisation):")
        for k, v in parts.items():
            v = v * g * db(sect_db)[:, None]
            print(f"    {k:8s} {integrated_lufs(v[S(24):S(26)]):7.1f} / {integrated_lufs(v):7.1f}")
    return music, info


# ----------------------------------------------------------------------------------------
# SFX generators: gen(rng, pitch, dur, n_len) -> stereo (n, 2), peak ~1.
#   n_len = exact sample count for sustained cues (so the end lands on t+dur exactly).
# ----------------------------------------------------------------------------------------


def g_impact(rng, p, dur, n_len):
    n = S(2.4)
    t = tv(n)
    f = 34.0 + (120.0 * p - 34.0) * np.exp(-t / 0.08)
    sub = np.sin(2 * np.pi * phase_of(f)) * np.clip(t / 0.0015, 0, 1) * np.exp(-t / 0.55)
    sub = lpf(np.tanh(2.0 * sub) / np.tanh(2.0), 700.0)
    body = norm(lpf(rng.standard_normal(n), 380.0) * np.exp(-t / 0.09))
    crack = stereo_noise(rng, n, 0.4)
    crack = norm(hpf(lpf(crack, 11000.0), 1200.0) * (np.clip(t / 0.0006, 0, 1) * np.exp(-t / 0.035))[:, None])
    rumble = norm(lpf(rng.standard_normal((n, 2)), 150.0) * np.exp(-t / 0.5)[:, None])
    dry = st(sub) + st(body) * 0.5 + crack * 0.45 + rumble * 0.22
    wet = convolve_stereo(crack * 0.7 + st(body) * 0.5, get_ir("impact"))
    return fade_tail(dry + wet * 0.4, 0.4)


def g_burst(rng, p, dur, n_len):
    n = S(1.6)
    t = tv(n)
    air = stereo_noise(rng, n, 0.2)
    air = norm(lpf(hpf(air, 2800.0 * p), 13500.0) * (np.clip(t / 0.002, 0, 1) * (np.exp(-t / 0.09) + 0.2 * np.exp(-t / 0.45)))[:, None])
    f = (55.0 + 60.0 * np.exp(-t / 0.02)) * p
    whump = np.sin(2 * np.pi * phase_of(f)) * np.clip(t / 0.002, 0, 1) * np.exp(-t / 0.12)
    shimmer = np.zeros((n, 2))
    notes = mtof(np.array([89, 92, 94, 96, 99, 101, 104, 108])) * p   # F minor pentatonic, 6th-8th octave
    for k in range(70):
        on = min(rng.exponential(0.16), 1.0)
        gl = rng.uniform(0.03, 0.11)
        m = S(gl * 4)
        tt = tv(m)
        grain = np.sin(2 * np.pi * rng.choice(notes) * tt) * np.clip(tt / 0.002, 0, 1) * np.exp(-tt / gl)
        add_at(shimmer, pan(grain, rng.uniform(-0.9, 0.9)), S(on), math.exp(-on / 0.35) * rng.uniform(0.4, 1.0))
    y = air * 0.8 + st(whump) * 0.45 + norm(shimmer) * 0.5
    return fade_tail(y, 0.2)


def g_thump(rng, p, dur, n_len):
    n = S(0.4)
    t = tv(n)
    f = (52.0 + 50.0 * np.exp(-t / 0.025)) * p
    y = np.sin(2 * np.pi * phase_of(f)) * np.clip(t / 0.0015, 0, 1) * np.exp(-t / 0.085)
    y = np.tanh(1.6 * y) / np.tanh(1.6)
    y += 0.3 * norm(lpf(rng.standard_normal(n), 500.0) * np.exp(-t / 0.02))
    return st(fade_tail(y, 0.05))


def g_pop(rng, p, dur, n_len):
    n = S(0.13)
    t = tv(n)
    f0 = 560.0 * p
    ph = phase_of(f0 * (1.0 + 1.3 * np.exp(-t / 0.011)))
    y = 0.85 * np.sin(2 * np.pi * ph) + 0.15 * tri_from_phase(ph)
    y *= np.clip(t / 0.001, 0, 1) * np.exp(-t / 0.032)
    y += 0.1 * norm(hpf(rng.standard_normal(n), 3000.0)) * np.exp(-t / 0.0007)
    return st(fade_tail(y, 0.015))


def g_tick(rng, p, dur, n_len):
    n = S(0.035)
    t = tv(n)
    y = 0.7 * np.sin(2 * np.pi * 3400.0 * p * t) * np.exp(-t / 0.0035)
    y += 0.45 * norm(hpf(rng.standard_normal(n), 4500.0)) * np.exp(-t / 0.0012)
    y *= np.clip(t / 0.0002, 0, 1)
    return st(fade_tail(lpf(y, 15000.0), 0.006))


def _click(rng, n, t0, p, g):
    t = tv(n) - t0
    on = t >= 0
    tt = np.where(on, t, 0.0)
    y = norm(bpf(rng.standard_normal(n), 1500.0, 7000.0)) * np.exp(-tt / 0.0018)
    y += 0.45 * np.sin(2 * np.pi * 1900.0 * p * tt) * np.exp(-tt / 0.006)
    y += 0.3 * np.sin(2 * np.pi * 190.0 * p * tt) * np.exp(-tt / 0.012)
    return g * y * on * np.clip(tt / 0.0002, 0, 1)


def g_click(rng, p, dur, n_len):
    n = S(0.09)
    y = _click(rng, n, 0.0, p, 1.0) + _click(rng, n, 0.042, p * 1.15, 0.45)
    return st(fade_tail(y, 0.008))


def _swoosh(rng, n, dur, p, f_lo, f_hi, peak_at, q, pan_w, rumble, corr=0.6):
    t = tv(n)
    x = t / dur
    tail_end = n / SR / dur
    env = np.where(x < peak_at, (np.clip(x, 0, None) / peak_at) ** 2.2,
                   np.cos(np.clip((x - peak_at) / (tail_end - peak_at), 0, 1) * np.pi / 2) ** 2)
    fc = f_lo * p * (f_hi / f_lo) ** env
    band = tv_filter(stereo_noise(rng, n, corr), fc, "bp", q=q, order=1, nper=512 if n > 4096 else 256)
    y = band * env[:, None]
    if rumble:
        y += st(norm(lpf(rng.standard_normal(n), 180.0)) * env) * rumble
    y += norm(hpf(stereo_noise(rng, n, 0.3), 6000.0)) * (env ** 2)[:, None] * 0.12
    pp = np.clip(-pan_w + 2 * pan_w * x, -pan_w, pan_w)
    a = (pp + 1.0) * (np.pi / 4.0)
    y = y * np.stack([np.cos(a), np.sin(a)], axis=1) * math.sqrt(2.0)
    return fade_tail(fade_head(y, 0.003), 0.01)


def g_swish(rng, p, dur, n_len):
    d = dur or 0.22
    n = S(d + 0.03)
    return _swoosh(rng, n, d, p, 900.0, 6000.0, 0.42, 1.3, 0.3, 0.0)


def g_whoosh(rng, p, dur, n_len):
    d = dur or 0.5
    n = (n_len or S(d)) + S(0.12)
    return _swoosh(rng, n, d, p, 250.0, 3200.0, 0.72, 0.8, 0.55, 0.55)


def g_riser(rng, p, dur, n_len):
    d = dur or 1.0
    n = n_len or S(d)
    x = np.linspace(0.0, 1.0, n)
    nz = norm(tv_filter(stereo_noise(rng, n, 0.4), 350.0 * p * 22.0 ** x, "bp", q=1.6, order=1, nper=512))
    octs = 2.0 if d >= 0.8 else 1.0
    f = mtof(53) * p * 2.0 ** (octs * x ** 1.4)
    tone = np.stack([saw(f * 2 ** (-8 / 1200), 0.1) + 0.6 * saw(f * 2.0, 0.3), saw(f * 2 ** (8 / 1200), 0.7) + 0.6 * saw(f * 2.0 * 1.003, 0.9)], axis=1)
    tone = norm(tv_filter(tone, 800.0 * 10.0 ** x, "lp", order=2, nper=512))
    y = (nz * 0.75 + tone * 0.4) * (x ** 2.2)[:, None]
    return fade_tail(fade_head(y, 0.003), 0.003)


def g_ding(rng, p, dur, n_len):
    n = S(1.4)
    t = tv(n)
    out = np.zeros((n, 2))
    partials = ((1.0, 1.0, 0.85), (2.0, 0.32, 0.45), (3.01, 0.12, 0.22), (4.21, 0.07, 0.12), (5.43, 0.04, 0.07))
    for (m, off, pn) in ((80, 0.0, -0.25), (84, 0.075, 0.25)):  # Ab5 + C6: major third
        f0 = float(mtof(m)) * p
        i = S(off)
        tt = t[: n - i]
        y = sum(a * np.sin(2 * np.pi * f0 * r * tt) * np.exp(-tt / tau) for r, a, tau in partials if f0 * r < 16000)
        y *= np.clip(tt / 0.002, 0, 1)
        add_at(out, pan(y, pn), i, 1.0 if off == 0 else 0.85)
    return fade_tail(out, 0.2)


def g_type(rng, p, dur, n_len):
    d = dur or 0.6
    n = (n_len or S(d)) + S(0.05)
    out = np.zeros((n, 2))
    t0 = 0.0
    while t0 < d:
        m = S(0.03)
        tt = tv(m)
        k = norm(bpf(rng.standard_normal(m), rng.uniform(1800, 3000) * p, rng.uniform(4500, 7000) * p)) * np.exp(-tt / 0.0025)
        k += 0.35 * np.sin(2 * np.pi * rng.uniform(250, 450) * p * tt) * np.exp(-tt / 0.007)
        add_at(out, pan(k * np.clip(tt / 0.0002, 0, 1), rng.uniform(-0.25, 0.25)), S(t0), rng.uniform(0.55, 1.0))
        t0 += float(np.clip(rng.normal(0.075, 0.022), 0.04, 0.14))
    return fade_tail(out, 0.01)


def g_stamp(rng, p, dur, n_len):
    n = S(0.6)
    t = tv(n)
    f = (48.0 + 77.0 * np.exp(-t / 0.018)) * p
    thud = np.tanh(1.8 * np.sin(2 * np.pi * phase_of(f)) * np.clip(t / 0.001, 0, 1) * np.exp(-t / 0.11)) / np.tanh(1.8)
    slap = norm(bpf(rng.standard_normal(n), 220.0, 2200.0) * np.clip(t / 0.0005, 0, 1) * np.exp(-t / 0.022))
    crack = norm(hpf(rng.standard_normal(n), 2500.0) * np.exp(-t / 0.006))
    dry = st(0.9 * thud + 0.8 * slap + 0.3 * crack)
    wet = convolve_stereo(dry[:, 0] * 0.5, get_ir("room"))
    return fade_tail(dry + wet * 0.25, 0.08)


def _metal_click(n, t0, p, g):
    t = tv(n) - t0
    on = t >= 0
    tt = np.where(on, t, 0.0)
    y = sum(a * np.sin(2 * np.pi * f * p * tt) * np.exp(-tt / tau)
            for f, a, tau in ((2150.0, 1.0, 0.025), (3420.0, 0.7, 0.018), (5180.0, 0.5, 0.012), (7730.0, 0.35, 0.008)))
    return g * y * on * np.clip(tt / 0.0002, 0, 1)


def g_lock(rng, p, dur, n_len):
    n = S(0.2)
    t = tv(n)
    y = _metal_click(n, 0.0, p, 1.0) + _metal_click(n, 0.065, p * 1.22, 0.85)
    tt = np.maximum(t - 0.065, 0.0)
    y += 0.9 * np.sin(2 * np.pi * 240.0 * p * tt) * np.exp(-tt / 0.018) * (t >= 0.065)
    nz = norm(hpf(rng.standard_normal(n), 3000.0))
    y += 0.5 * nz * (np.exp(-t / 0.0015) + 0.8 * np.exp(-tt / 0.0015) * (t >= 0.065))
    return st(fade_tail(y, 0.02))


def g_count(rng, p, dur, n_len):
    d = dur or 0.8
    n = (n_len or S(d)) + S(0.04)
    out = np.zeros((n, 2))
    # tick rate eases out (fast -> slower), like a number counter settling
    tt = np.linspace(0.0, d, 2000)
    rate = 30.0 - 18.0 * (tt / d) ** 1.5
    cum = np.cumsum(rate) * (tt[1] - tt[0])
    k_times = [tt[np.searchsorted(cum, k)] for k in range(int(cum[-1]) + 1) if np.searchsorted(cum, k) < tt.size]
    m = S(0.025)
    tk = tv(m)
    for i, t0 in enumerate(k_times):
        x = i / max(1, len(k_times) - 1)
        pitch = p * (1.0 + 0.15 * x)
        y = np.sin(2 * np.pi * 2600.0 * pitch * tk) * np.exp(-tk / 0.003) + 0.35 * norm(hpf(rng.standard_normal(m), 5000.0)) * np.exp(-tk / 0.001)
        add_at(out, st(y * np.clip(tk / 0.0002, 0, 1)), S(t0), 1.0 if i == len(k_times) - 1 else 0.6)
    return fade_tail(out, 0.01)


def g_glitch(rng, p, dur, n_len):
    d = dur or 0.26
    n = n_len or S(d)
    out = np.zeros((n, 2))
    pos = 0
    while pos < n:
        m = S(rng.uniform(0.012, 0.04))
        tt = tv(m)
        kind = rng.integers(0, 4)
        if kind == 0:
            y = np.sign(np.sin(2 * np.pi * rng.uniform(300, 2400) * p * tt))
        elif kind == 1:
            y = bpf(rng.standard_normal(m), 800.0, 6000.0) * 2.0
        elif kind == 2:
            y = saw(np.full(m, rng.uniform(150, 900) * p), rng.uniform())
        else:
            y = np.zeros(m)
        hold = int(rng.integers(3, 12))
        y = y[(np.arange(m) // hold) * hold]            # sample-and-hold decimation
        y = np.round(y * 6.0) / 6.0                       # bit-crush
        reps = int(rng.integers(1, 4)) if kind != 3 else 1
        seg = fade_tail(fade_head(np.tile(y, reps), 0.001), 0.001)
        add_at(out, pan(seg, rng.uniform(-0.6, 0.6)), pos, rng.uniform(0.5, 1.0))
        pos += seg.shape[0]
    out = lpf(hpf(out, 180.0), 12000.0)
    return fade_tail(fade_head(out, 0.001), 0.004)


def g_sub(rng, p, dur, n_len):
    n = S(1.4)
    t = tv(n)
    f = (41.0 + 57.0 * np.exp(-t / 0.22)) * p
    f *= 1.0 + 0.9 * np.exp(-t / 0.012)
    y = np.sin(2 * np.pi * phase_of(f)) * np.clip(t / 0.002, 0, 1) * np.exp(-t / 0.5)
    y = lpf(np.tanh(2.2 * y) / np.tanh(2.2), 1200.0)
    return st(fade_tail(y, 0.15))


def g_reverse(rng, p, dur, n_len):
    d = dur or 1.0
    n = n_len or S(d)
    t = tv(n)
    cym = np.zeros((n, 2))
    for c in range(2):
        y = 0.45 * metal(rng, n, (1.8 + 0.03 * c) * p) + 0.5 * rng.standard_normal(n)
        cym[:, c] = lpf(hpf(y, 3000.0, order=3), 13000.0)
    cym *= np.exp(-t / (0.38 * d))[:, None]
    y = cym[::-1].copy()
    return fade_tail(fade_head(y, 0.05 * d), 0.003)


def g_shutter(rng, p, dur, n_len):
    n = S(0.12)
    t = tv(n)
    c1 = norm(bpf(rng.standard_normal(n), 2500.0, 8000.0)) * np.exp(-t / 0.0015) + 0.4 * np.sin(2 * np.pi * 1150.0 * p * t) * np.exp(-t / 0.004)
    flap = norm(bpf(rng.standard_normal(n), 600.0, 2600.0)) * np.exp(-0.5 * ((t - 0.017) / 0.007) ** 2) * 0.45
    tt = np.maximum(t - 0.036, 0.0)
    c2 = (norm(bpf(rng.standard_normal(n), 2000.0, 6500.0)) * np.exp(-tt / 0.0013) + 0.35 * np.sin(2 * np.pi * 950.0 * p * tt) * np.exp(-tt / 0.004)) * (t >= 0.036)
    y = (c1 + flap + 0.75 * c2) * np.clip(t / 0.0002, 0, 1)
    return st(fade_tail(y, 0.01))


# type: (generator, level dBFS at gain 1, plate send, music duck (dB, hold s, release s) or None, sustained?)
SFX = {
    "impact":  (g_impact,  -3.0, 0.00, (4.0, 0.15, 0.45), False),
    "burst":   (g_burst,   -9.0, 0.25, (2.0, 0.10, 0.30), False),
    "thump":   (g_thump,   -8.0, 0.05, None, False),
    "pop":     (g_pop,    -11.0, 0.12, None, False),
    "tick":    (g_tick,   -14.0, 0.06, None, False),
    "click":   (g_click,  -12.0, 0.05, None, False),
    "swish":   (g_swish,  -13.0, 0.10, None, False),
    "whoosh":  (g_whoosh, -10.0, 0.12, (3.0, 0.0, 0.20), True),
    "riser":   (g_riser,   -9.0, 0.10, (1.5, 0.0, 0.10), True),
    "ding":    (g_ding,   -13.0, 0.35, None, False),
    "type":    (g_type,   -15.0, 0.04, None, True),
    "stamp":   (g_stamp,   -5.0, 0.08, (2.5, 0.08, 0.25), False),
    "lock":    (g_lock,   -12.0, 0.10, None, False),
    "count":   (g_count,  -15.0, 0.05, None, True),
    "glitch":  (g_glitch, -12.0, 0.12, None, True),
    "sub":     (g_sub,     -5.0, 0.00, (2.5, 0.20, 0.40), False),
    "reverse": (g_reverse, -11.0, 0.10, (1.5, 0.0, 0.10), True),
    "shutter": (g_shutter, -13.0, 0.08, None, False),
}
DEFAULT_DUR = {"whoosh": 0.5, "riser": 1.0, "type": 0.6, "count": 0.8, "glitch": 0.26, "reverse": 1.0}


def load_cues(path):
    if not os.path.exists(path):
        print(f"WARNING: cue sheet {path} not found; rendering music only", file=sys.stderr)
        return []
    with open(path) as fh:
        data = json.load(fh)
    cues = data.get("cues", []) if isinstance(data, dict) else data
    if isinstance(data, dict) and data.get("duration") not in (None, 30, 30.0):
        print(f"WARNING: cue sheet duration {data.get('duration')} != 30; rendering 30.000 s anyway", file=sys.stderr)
    out, unknown, skipped = [], {}, 0
    for c in cues:
        try:
            t = float(c["t"])
            typ = str(c["type"])
        except (KeyError, TypeError, ValueError):
            skipped += 1
            continue
        if typ not in SFX:
            unknown[typ] = unknown.get(typ, 0) + 1
            continue
        if not (0.0 <= t < DURATION) or not math.isfinite(t):
            skipped += 1
            continue
        gain = float(np.clip(float(c.get("gain", 1.0) or 0.0), 0.0, 1.5))
        pitch = float(np.clip(float(c.get("pitch", 1.0) or 1.0), 0.25, 4.0))
        dur = c.get("dur")
        dur = float(np.clip(float(dur), 0.02, 10.0)) if dur is not None else DEFAULT_DUR.get(typ)
        out.append(dict(t=t, type=typ, gain=gain, pitch=pitch, dur=dur))
    for typ, k in sorted(unknown.items()):
        print(f"WARNING: ignoring {k} cue(s) of unknown type '{typ}'", file=sys.stderr)
    if skipped:
        print(f"WARNING: skipped {skipped} malformed/out-of-range cue(s)", file=sys.stderr)
    out.sort(key=lambda c: (c["t"], c["type"]))
    return out


def render_sfx(cues):
    """Returns (sfx (N,2), music duck gain (N,), per-cue placement list)."""
    bus = np.zeros((N, 2))
    plate_send = np.zeros((N, 2))
    duck_db = np.zeros(N)
    seen: dict = {}
    placed = []
    for c in cues:
        gen, lvl, send, duck, sustained = SFX[c["type"]]
        key = (c["type"], round(c["t"], 3))
        occ = seen.get(key, 0)
        seen[key] = occ + 1
        rng = rng_for("cue", c["type"], f"{c['t']:.3f}", occ)
        i0 = S(c["t"])
        n_len = S(c["t"] + c["dur"]) - i0 if (sustained and c["dur"]) else None
        y = gen(rng, c["pitch"], c["dur"], n_len)
        y = norm(y) * db(lvl) * c["gain"]
        add_at(bus, y, i0)
        if send:
            add_at(plate_send, y, i0, send)
        if duck and c["gain"] > 0:
            amount = min(duck[0] * c["gain"], 4.0)
            if c["type"] in ("riser", "reverse"):
                a0, a1 = c["t"] + 0.6 * c["dur"], c["t"] + c["dur"]
            elif c["type"] == "whoosh":
                a0, a1 = c["t"] + 0.1 * c["dur"], c["t"] + c["dur"]
                amount = min(amount, 2.5)
            else:
                a0, a1 = c["t"], c["t"] + duck[1]
            att, rel = 0.012 if c["type"] not in ("riser", "reverse", "whoosh") else 0.1, duck[2]
            s0, s1 = max(0, S(a0 - att)), min(N, S(a1 + rel))
            if s1 > s0:
                tt = np.arange(s0, s1) / SR
                shape = np.interp(tt, [a0 - att, a0, a1, a1 + rel], [0.0, 1.0, 1.0, 0.0])
                shape = shape * shape * (3 - 2 * shape)
                duck_db[s0:s1] = np.maximum(duck_db[s0:s1], amount * shape)
        placed.append(dict(c, start_sample=i0, len=int(y.shape[0])))
    bus += convolve_stereo(plate_send, get_ir("plate")) * 0.5
    return bus, db(-duck_db), placed


# ----------------------------------------------------------------------------------------
# loudness / analysis (ITU-R BS.1770-4)
# ----------------------------------------------------------------------------------------
_KW_B1, _KW_A1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
_KW_B2, _KW_A2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]


def _block_ms(x, block=0.4, hop=0.1):
    x = x if x.ndim == 2 else x[:, None]
    y = signal.lfilter(_KW_B2, _KW_A2, signal.lfilter(_KW_B1, _KW_A1, x, axis=0), axis=0)
    p = np.sum(y * y, axis=1)
    cs = np.concatenate([[0.0], np.cumsum(p)])
    B, H = S(block), S(hop)
    if len(p) < B:
        return np.array([np.mean(p) if len(p) else 0.0]), np.array([0.0])
    starts = np.arange(0, len(p) - B + 1, H)
    return (cs[starts + B] - cs[starts]) / B, starts / SR


def integrated_lufs(x):
    ms, _ = _block_ms(x)
    lk = -0.691 + 10 * np.log10(ms + 1e-20)
    m = lk > -70.0
    if not np.any(m):
        return -70.0
    rel = -0.691 + 10 * np.log10(np.mean(ms[m])) - 10.0
    m2 = m & (lk > rel)
    return float(-0.691 + 10 * np.log10(np.mean(ms[m2])))


def momentary(x):
    ms, t0 = _block_ms(x)
    return t0 + 0.2, -0.691 + 10 * np.log10(ms + 1e-20)


def tp_envelope(x, os=4):
    up = signal.resample_poly(x, os, 1, axis=0)
    a = np.max(np.abs(up), axis=1)[: x.shape[0] * os].reshape(x.shape[0], os).max(axis=1)
    return np.maximum(a, np.max(np.abs(x), axis=1))


def true_peak_db(x):
    return float(lin2db(np.max(tp_envelope(x))))


def correlation(x):
    l, r = x[:, 0], x[:, 1]
    den = math.sqrt(float(np.sum(l * l) * np.sum(r * r))) + 1e-20
    return float(np.sum(l * r) / den)


# ----------------------------------------------------------------------------------------
# master chain
# ----------------------------------------------------------------------------------------


def release_env(gr, rel):
    """y[n] = max(gr[n], y[n-1] * exp(-1/(rel*SR))) without a Python loop (max-plus in log domain)."""
    c = 1.0 / (rel * SR)
    idx = np.arange(gr.size) * c
    acc = np.maximum.accumulate(np.log(np.maximum(gr, 1e-9)) + idx)
    return np.exp(acc - idx)


def mono_below(x, fc=120.0):
    mid, side = 0.5 * (x[:, 0] + x[:, 1]), 0.5 * (x[:, 0] - x[:, 1])
    side = signal.sosfiltfilt(_sos("highpass", fc, 2), side)
    return np.stack([mid + side, mid - side], axis=1)


def glue(x, thr_db=-11.0, ratio=1.8, knee=8.0, attack=0.012, release=0.16):
    lvl = 10 * np.log10(one_pole(0.5 * (x[:, 0] ** 2 + x[:, 1] ** 2), 0.012) + 1e-12)
    over = lvl - thr_db
    s = 1.0 - 1.0 / ratio
    gr = np.where(over <= -knee / 2, 0.0, np.where(over >= knee / 2, s * over, s * (over + knee / 2) ** 2 / (2 * knee)))
    gr = one_pole(release_env(gr, release), attack)
    return x * db(-gr)[:, None], gr


def soft_clip(x, knee=0.88):
    a = np.abs(x)
    y = np.where(a <= knee, a, knee + (1.0 - knee) * np.tanh((a - knee) / (1.0 - knee)))
    return np.sign(x) * y


def limiter(x, ceiling_db, lookahead=0.004, release=0.09):
    req = np.maximum(0.0, lin2db(tp_envelope(x)) - ceiling_db)
    L = S(lookahead) | 1
    m = L // 2
    ahead = maximum_filter1d(req, size=L, origin=-m, mode="constant")   # max over [n, n+L-1]
    ramp = uniform_filter1d(ahead, size=L, origin=m, mode="constant")   # mean over [n-L+1, n]
    gr = release_env(ramp, release)
    return x * db(-gr)[:, None], gr


def edge_fades(n=N):
    g = np.ones(n)
    k = S(FADE_IN)
    g[:k] = 0.5 * (1 - np.cos(np.linspace(0, np.pi, k)))
    k = S(FADE_OUT)
    g[-k:] = 0.5 * (1 + np.cos(np.linspace(0, np.pi, k)))
    return g


def master(mix, target_lufs, tp_ceiling):
    x = mono_below(mix, 120.0)
    x = hpf(x, 22.0, order=2)
    x -= x.mean(axis=0)
    fades = edge_fades()[:, None]
    g = db(target_lufs - integrated_lufs(x))
    ceil = tp_ceiling - 0.3
    for _ in range(8):
        y, gr_glue = glue(x * g)
        y = soft_clip(y)
        y, gr_lim = limiter(y, ceil)
        y *= fades
        L = integrated_lufs(y)
        tp = true_peak_db(y)
        if tp > tp_ceiling - 0.1:
            ceil -= tp - (tp_ceiling - 0.15)
        if abs(L - target_lufs) < 0.05 and tp <= tp_ceiling - 0.1:
            break
        g *= db(target_lufs - L)
    stats = dict(master_gain_db=float(lin2db(g)), glue_max_gr_db=float(np.max(gr_glue)),
                 limiter_max_gr_db=float(np.max(gr_lim)), limiter_ceiling_db=float(ceil))
    return y, stats


def write_wav(path, x, seed_tag):
    """TPDF-dithered 16-bit write; dither scaled by the edge fades so both ends are exact silence."""
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    rng = rng_for("dither", seed_tag)
    d = (rng.random(x.shape) - rng.random(x.shape)) * edge_fades()[:, None]
    q = np.clip(np.round(x * 32767.0 + d), -32768, 32767).astype(np.int16)
    assert q.shape == (N, 2)
    wavfile.write(path, SR, q)
    return q


# ----------------------------------------------------------------------------------------
# report
# ----------------------------------------------------------------------------------------


def section_table(x):
    rows = []
    low = lpf(x, 150.0, order=4)
    for name, t0, t1 in SECTIONS_REPORT:
        seg = x[S(t0):S(t1)]
        rms = float(lin2db(math.sqrt(float(np.mean(seg ** 2)))))
        rows.append(dict(section=name, t0=t0, t1=t1, rms_dbfs=rms, lufs=integrated_lufs(seg),
                         peak_dbfs=float(lin2db(peak(seg))), corr=correlation(seg),
                         corr_low=correlation(low[S(t0):S(t1)])))
    return rows


def ffmpeg_ebur128(path):
    ff = shutil.which("ffmpeg")
    if not ff:
        return None
    r = subprocess.run([ff, "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    txt = r.stderr
    summ = txt[txt.rfind("Summary:"):] if "Summary:" in txt else txt

    def grab(pat):
        m = re.search(pat, summ)
        return float(m.group(1)) if m else None
    return dict(I=grab(r"I:\s+(-?[\d.]+) LUFS"), LRA=grab(r"LRA:\s+(-?[\d.]+) LU"),
                true_peak=grab(r"True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS"))


def render_images(report_dir, master_path, music, sfx, y, cues, sections):
    ff = shutil.which("ffmpeg")
    if ff:
        jobs = [("spectrum.png", "showspectrumpic=s=1600x800:legend=1"),
                ("spectrum_log.png", "showspectrumpic=s=1600x800:legend=1:fscale=log"),
                ("waveform.png", "showwavespic=s=1600x400:split_channels=1:colors=0x3a3a3a|0x3a3a3a")]
        for name, flt in jobs:
            subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", "-i", master_path, "-lavfi", flt,
                            "-frames:v", "1", os.path.join(report_dir, name)], check=False)
    try:
        timeline_png(os.path.join(report_dir, "timeline.png"), music, sfx, y, cues)
    except Exception as e:  # the plot is a diagnostic; never fail the render over it
        print(f"WARNING: timeline plot failed: {e}", file=sys.stderr)


def timeline_png(path, music, sfx, y, cues):
    """Static diagnostic: master waveform, music vs SFX momentary loudness, cue rug by class."""
    from PIL import Image, ImageDraw, ImageFont
    W, H = 1800, 980
    L, R = 120, 40
    surf, ink, ink2, muted, grid = "#fcfcfb", "#0b0b0b", "#52514e", "#8a8984", "#e6e5e1"
    c_music, c_sfx = "#2a78d6", "#eb6834"
    try:
        fnt = ImageFont.truetype("DejaVuSans.ttf", 15)
        fb = ImageFont.truetype("DejaVuSans-Bold.ttf", 19)
        fs = ImageFont.truetype("DejaVuSans.ttf", 13)
    except OSError:
        fnt = fb = fs = ImageFont.load_default()
    im = Image.new("RGB", (W, H), surf)
    d = ImageDraw.Draw(im)
    X = lambda t: L + (W - L - R) * t / DURATION
    d.text((L, 18), "BMSNow reel audio: timeline check (master, stems, cue sheet)", fill=ink, font=fb)
    panels = [(70, 330, "Master waveform"), (380, 700, "Momentary loudness (LUFS, 400 ms)"), (750, 930, "Cues")]
    for y0, y1, title in panels:
        d.text((L, y0 - 24), title, fill=ink2, font=fnt)
        for tt in range(0, 31):
            d.line([(X(tt), y0), (X(tt), y1)], fill=grid if tt % 2 else "#d6d5d0", width=1)
        d.line([(L, y1), (W - R, y1)], fill="#c9c8c3", width=1)
    for tt in range(0, 31, 2):
        d.text((X(tt) - 6, 936), f"{tt}", fill=ink2, font=fs)
    d.text((W - R - 60, 952), "seconds", fill=muted, font=fs)
    for name, t0, t1 in SECTIONS_REPORT:
        d.text((X(t0) + 4, 74), name, fill=muted, font=fs)
    # waveform (min/max per pixel column)
    y0, y1 = 90, 330
    mid = (y0 + y1) / 2
    cols = W - L - R
    mono = 0.5 * (y[:, 0] + y[:, 1])
    idx = np.linspace(0, N, cols + 1).astype(int)
    for i in range(cols):
        seg = mono[idx[i]:idx[i + 1]]
        lo, hi = float(seg.min()), float(seg.max())
        d.line([(L + i, mid - hi * (y1 - y0) / 2), (L + i, mid - lo * (y1 - y0) / 2)], fill="#6b6a66")
    for v in (-1.0, 1.0):
        d.line([(L, mid - v * (y1 - y0) / 2), (W - R, mid - v * (y1 - y0) / 2)], fill=grid)
    d.text((L - 50, y0 - 8), "0 dBFS", fill=muted, font=fs)
    # loudness curves
    y0, y1, lo_db, hi_db = 380, 700, -45.0, -5.0
    Yl = lambda v: y1 - (np.clip(v, lo_db, hi_db) - lo_db) / (hi_db - lo_db) * (y1 - y0)
    for v in range(-40, -4, 5):
        d.line([(L, Yl(v)), (W - R, Yl(v))], fill=grid)
        d.text((L - 44, Yl(v) - 8), f"{v}", fill=muted, font=fs)
    for sig, col, lab in ((music, c_music, "music (post-duck)"), (sfx, c_sfx, "SFX")):
        tt, lk = momentary(sig)
        pts = [(X(a), float(Yl(b))) for a, b in zip(tt, lk)]
        d.line(pts, fill=col, width=2)
    lx = W - R - 330
    for k, (col, lab) in enumerate(((c_music, "music bus (pre-master, after ducking)"), (c_sfx, "SFX bus (pre-master)"))):
        d.line([(lx, 392 + 20 * k), (lx + 24, 392 + 20 * k)], fill=col, width=3)
        d.text((lx + 32, 384 + 20 * k), lab, fill=ink2, font=fs)
    # cue rug
    classes = [("hits", {"impact", "burst", "stamp", "sub", "thump"}),
               ("transitions", {"whoosh", "swish", "riser", "reverse"}),
               ("UI", {"pop", "tick", "click", "ding", "type", "lock", "count", "glitch", "shutter"})]
    for k, (lab, types) in enumerate(classes):
        yc = 775 + 55 * k
        d.text((20, yc - 8), lab, fill=ink2, font=fnt)
        d.line([(L, yc), (W - R, yc)], fill=grid)
        for c in cues:
            if c["type"] not in types:
                continue
            h = 8 + 14 * min(c["gain"], 1.2)
            if c["type"] in ("whoosh", "riser", "reverse", "type", "count") and c["dur"]:
                d.rectangle([X(c["t"]), yc - 3, X(c["t"] + c["dur"]), yc + 3], fill="#b9b8b2")
            d.line([(X(c["t"]), yc - h), (X(c["t"]), yc + h)], fill=ink, width=2)
    im.save(path)


# ----------------------------------------------------------------------------------------
# main
# ----------------------------------------------------------------------------------------


def main(argv=None):
    ap = argparse.ArgumentParser(description="Synthesize the BMSNow reel soundtrack (music + cue-synced SFX).")
    ap.add_argument("--cues", default=os.path.join(ROOT, "out", "cues.json"), help="cue sheet JSON (default out/cues.json)")
    ap.add_argument("--out", default=os.path.join(ROOT, "out", "audio.wav"), help="master WAV path")
    ap.add_argument("--stems-dir", default=os.path.join(ROOT, "out", "stems"))
    ap.add_argument("--report-dir", default=os.path.join(ROOT, "out", "audio_report"))
    ap.add_argument("--music-gain", type=float, default=0.0, help="music bus trim in dB (default 0 = house balance)")
    ap.add_argument("--sfx-gain", type=float, default=0.0, help="SFX bus trim in dB (default 0 = house balance)")
    ap.add_argument("--target-lufs", type=float, default=-14.0, help="integrated loudness target (default -14)")
    ap.add_argument("--true-peak", type=float, default=-1.0, help="true-peak ceiling in dBTP (default -1.0)")
    ap.add_argument("--report", action="store_true", help="write spectrograms, waveform, timeline and metrics.json")
    ap.add_argument("--verbose", action="store_true", help="print per-part music loudness and per-cue SFX levels")
    a = ap.parse_args(argv)

    t_start = time.time()
    cues = load_cues(a.cues)
    counts: dict = {}
    for c in cues:
        counts[c["type"]] = counts.get(c["type"], 0) + 1
    print(f"cues: {len(cues)} from {os.path.relpath(a.cues, ROOT) if a.cues.startswith(ROOT) else a.cues} {counts}")

    music, minfo = render_music(verbose=a.verbose)
    sfx, duck, placed = render_sfx(cues)
    music = music * duck[:, None] * db(a.music_gain)
    sfx = sfx * db(a.sfx_gain)

    # stems: pre-master buses (post trim), i.e. music + sfx == master input
    fades = edge_fades()[:, None]
    stem_peak = max(peak(music), peak(sfx))
    stem_scale = min(1.0, db(-0.3) / stem_peak)
    if stem_scale < 1.0:
        print(f"note: stems scaled by {lin2db(stem_scale):.2f} dB to avoid clipping (same for both stems)")
    os.makedirs(a.stems_dir, exist_ok=True)
    write_wav(os.path.join(a.stems_dir, "music.wav"), music * fades * stem_scale, "music")
    write_wav(os.path.join(a.stems_dir, "sfx.wav"), sfx * fades * stem_scale, "sfx")

    y, mstats = master(music + sfx, a.target_lufs, a.true_peak)
    q = write_wav(a.out, y, "master")
    yq = q.astype(float) / 32767.0

    lufs = integrated_lufs(yq)
    tp = true_peak_db(yq)
    print(f"rendered {q.shape[0]} samples ({q.shape[0] / SR:.3f} s) @ {SR} Hz stereo 16-bit -> {a.out}")
    print(f"master: {lufs:.2f} LUFS integrated, true peak {tp:.2f} dBTP (4x), sample peak {lin2db(peak(yq)):.2f} dBFS, "
          f"DC L/R {np.mean(yq[:, 0]):.1e}/{np.mean(yq[:, 1]):.1e}, corr {correlation(yq):.2f}")
    print(f"chain: master gain {mstats['master_gain_db']:+.1f} dB, glue max GR {mstats['glue_max_gr_db']:.1f} dB, "
          f"limiter max GR {mstats['limiter_max_gr_db']:.1f} dB (ceiling {mstats['limiter_ceiling_db']:.2f})")
    print(f"stems: music {integrated_lufs(music):.1f} LUFS, sfx {integrated_lufs(sfx):.1f} LUFS (pre-master)")
    rows = section_table(yq)
    print(f"  {'section':10s} {'time':>7s} {'RMS dBFS':>9s} {'LUFS':>7s} {'peak':>7s} {'corr':>5s} {'corr<150':>8s}")
    for r in rows:
        print(f"  {r['section']:10s} {r['t0']:>3.0f}-{r['t1']:<3.0f} {r['rms_dbfs']:9.1f} {r['lufs']:7.1f} "
              f"{r['peak_dbfs']:7.1f} {r['corr']:5.2f} {r['corr_low']:8.2f}")
    tt, lk = momentary(yq)
    build = [(t0, float(np.interp(t0, tt, lk))) for t0 in (22.2, 22.6, 23.0, 23.4, 23.8)]
    print("  build momentary LUFS: " + ", ".join(f"{t0:.1f}s {v:.1f}" for t0, v in build))

    if a.verbose:
        print("  per-cue SFX vs music (K-weighted energy over the cue's first 60 ms or its duration):")
        for c in placed:
            i0 = c["start_sample"]
            span = S(c["dur"]) if c["dur"] and SFX[c["type"]][4] else S(0.06)
            s0, s1 = i0 if c["type"] not in ("riser", "reverse") else max(0, i0 + span - S(0.1)), min(N, i0 + span)
            if c["type"] in ("riser", "reverse"):
                s1 = min(N, i0 + span)
            e_s = integrated_energy(sfx[s0:s1])
            e_m = integrated_energy(music[s0:s1])
            print(f"    {c['t']:6.3f} {c['type']:8s} g={c['gain']:.2f}  sfx-music {10 * np.log10((e_s + 1e-20) / (e_m + 1e-20)):+6.1f} dB")

    metrics = dict(samples=int(q.shape[0]), sample_rate=SR, integrated_lufs=lufs, true_peak_dbtp=tp,
                   sample_peak_dbfs=float(lin2db(peak(yq))), correlation=correlation(yq),
                   music_stem_lufs=integrated_lufs(music), sfx_stem_lufs=integrated_lufs(sfx),
                   stem_scale_db=float(lin2db(stem_scale)), music_gain_db=a.music_gain, sfx_gain_db=a.sfx_gain,
                   cues=len(cues), cue_counts=counts, sections=rows, build_momentary=build, **mstats)
    if a.report:
        os.makedirs(a.report_dir, exist_ok=True)
        eb = ffmpeg_ebur128(a.out)
        if eb:
            metrics["ffmpeg_ebur128"] = eb
            print(f"ffmpeg ebur128: I = {eb['I']} LUFS, LRA = {eb['LRA']} LU, true peak = {eb['true_peak']} dBFS")
        render_images(a.report_dir, a.out, music, sfx, yq, cues, rows)
        with open(os.path.join(a.report_dir, "metrics.json"), "w") as fh:
            json.dump(metrics, fh, indent=1)
        print(f"report -> {a.report_dir}")
    print(f"done in {time.time() - t_start:.1f} s")
    return 0


def integrated_energy(x):
    ms, _ = _block_ms(x, block=min(0.4, max(0.01, x.shape[0] / SR)), hop=0.01)
    return float(np.mean(ms)) if ms.size else 0.0


if __name__ == "__main__":
    sys.exit(main())
