#!/usr/bin/env python3
"""Soundtrack for the CRMNow reel, synthesized from scratch (no samples) and locked to the picture.

    python3 scripts/soundtrack.py [out/cues.json] [out/soundtrack.wav]

Music: 128 BPM, 16 bars = 30.0 s. Filtered build -> drop on the logo -> house groove (Am F C G)
under the product scenes -> stop + hit when the mark forms -> F G -> C resolution on the end card.
Sound effects are placed on the cue list exported by the composition (window.__cues), so every
click, pop, stamp and whoosh lands on its frame.
"""
import json
import sys

import numpy as np
from scipy import signal

SR = 48000
BPM = 128
BEAT = 60 / BPM
DUR = 30.0
N = int(round(DUR * SR))
TAIL = int(3.0 * SR)
RNG = np.random.default_rng(7)


def b(n):
    return n * BEAT


def ns(sec):
    return int(round(sec * SR))


def tt(dur):
    return np.arange(ns(dur)) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}


def hz(name):
    """'A4' -> 440.0"""
    pitch, octave = name[:-1], int(name[-1])
    return midi(12 * (octave + 1) + NOTE[pitch])


# ------------------------------------------------------------------ buses
class Bus:
    def __init__(self):
        self.x = np.zeros((2, N + TAIL))

    def add(self, sig, t0, gain=1.0, pan=0.0):
        sig = np.asarray(sig, dtype=np.float64)
        if sig.ndim == 1:
            a = (pan + 1) * np.pi / 4
            sig = np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
        i0 = ns(t0)
        if i0 < 0:
            sig = sig[:, -i0:]
            i0 = 0
        n = min(sig.shape[1], self.x.shape[1] - i0)
        if n > 0:
            self.x[:, i0:i0 + n] += gain * sig[:, :n]


# ------------------------------------------------------------------ oscillators
def _f(freq, n):
    return np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,)).copy()


def sine(freq, dur, ph0=0.0):
    n = ns(dur)
    return np.sin(2 * np.pi * (np.cumsum(_f(freq, n)) / SR + ph0))


def saw(freq, dur, ph0=None):
    """Band-limited (polyBLEP) sawtooth."""
    n = ns(dur)
    dt = _f(freq, n) / SR
    ph = (np.cumsum(dt) + (RNG.random() if ph0 is None else ph0)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    t = ph[m] / dt[m]
    y[m] -= t + t - t * t - 1
    m = ph > 1 - dt
    t = (ph[m] - 1) / dt[m]
    y[m] -= t * t + t + t + 1
    return y


def square(freq, dur, pw=0.5):
    ph = RNG.random()
    return 0.5 * (saw(freq, dur, ph) - saw(freq, dur, (ph + pw) % 1.0))


def noise(dur):
    return RNG.standard_normal(ns(dur))


# ------------------------------------------------------------------ filters
def biquad(kind, f0, q=0.707, gain_db=0.0):
    f0 = float(np.clip(f0, 10, SR * 0.45))
    w0 = 2 * np.pi * f0 / SR
    cw, sw = np.cos(w0), np.sin(w0)
    alpha = sw / (2 * q)
    A = 10 ** (gain_db / 40)
    if kind == 'lp':
        bb, aa = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2], [1 + alpha, -2 * cw, 1 - alpha]
    elif kind == 'hp':
        bb, aa = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2], [1 + alpha, -2 * cw, 1 - alpha]
    elif kind == 'bp':
        bb, aa = [alpha, 0, -alpha], [1 + alpha, -2 * cw, 1 - alpha]
    elif kind == 'peak':
        bb, aa = [1 + alpha * A, -2 * cw, 1 - alpha * A], [1 + alpha / A, -2 * cw, 1 - alpha / A]
    elif kind in ('ls', 'hs'):
        s = 1 if kind == 'ls' else -1
        sq = 2 * np.sqrt(A) * alpha
        bb = [A * ((A + 1) - s * (A - 1) * cw + sq), s * 2 * A * ((A - 1) - s * (A + 1) * cw), A * ((A + 1) - s * (A - 1) * cw - sq)]
        aa = [(A + 1) + s * (A - 1) * cw + sq, -s * 2 * ((A - 1) + s * (A + 1) * cw), (A + 1) + s * (A - 1) * cw - sq]
    else:
        raise ValueError(kind)
    return np.array(bb) / aa[0], np.array(aa) / aa[0]


def filt(x, kind, f0, q=0.707, gain_db=0.0):
    bb, aa = biquad(kind, f0, q, gain_db)
    return signal.lfilter(bb, aa, x, axis=-1)


def tvfilt(x, kind, f_arr, q=0.707, block=64):
    """Time-varying biquad (coefficients updated every `block` samples)."""
    f_arr = _f(f_arr, len(x)) if np.ndim(f_arr) == 0 else f_arr
    y = np.zeros_like(x)
    zi = np.zeros(2)
    for i in range(0, len(x), block):
        bb, aa = biquad(kind, f_arr[min(i, len(f_arr) - 1)], q)
        y[i:i + block], zi = signal.lfilter(bb, aa, x[i:i + block], zi=zi)
    return y


# ------------------------------------------------------------------ envelopes / helpers
def edecay(dur, tau, hold=0.0):
    t = tt(dur)
    return np.where(t < hold, 1.0, np.exp(-(t - hold) / tau))


def adsr(dur, a=0.005, d=0.1, s=0.7, r=0.08):
    """Envelope for a note of `dur` seconds (+ release)."""
    t = tt(dur + r)
    e = np.where(t < a, t / max(a, 1e-6), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-6)))
    rel = t > dur
    e[rel] = e[ns(dur) - 1 if ns(dur) > 0 else 0] * np.exp(-(t[rel] - dur) / (r / 4))
    return e


def fades(x, fin=0.002, fout=0.01):
    x = x.copy()
    a, z = ns(fin), ns(fout)
    if a:
        x[..., :a] *= np.linspace(0, 1, a)
    if z:
        x[..., -z:] *= np.linspace(1, 0, z)
    return x


def pan_st(x, pan):
    a = (pan + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)]) * np.sqrt(2)


def glide(f0, f1, dur, curve=1.0):
    k = np.linspace(0, 1, ns(dur)) ** curve
    return f0 * (f1 / f0) ** k


# ------------------------------------------------------------------ reverb / delay
def make_ir(length=2.6, predelay=0.018, rt60=1.8, damp=0.45, seed=3):
    R = np.random.default_rng(seed)
    n = ns(length)
    t = np.arange(n) / SR
    ir = np.zeros((2, n))
    for ch in range(2):
        nz = R.standard_normal(n)
        lo = filt(nz, 'lp', 1800)
        hi = nz - lo
        ir[ch] = lo * np.exp(-t * 6.91 / rt60) + hi * np.exp(-t * 6.91 / (rt60 * damp))
        ir[ch, :ns(0.004)] *= np.linspace(0, 1, ns(0.004))
    er = np.zeros((2, n))
    for d, g, p in [(0.007, 0.6, -0.6), (0.013, 0.5, 0.5), (0.021, 0.42, -0.3), (0.029, 0.36, 0.7), (0.043, 0.3, -0.8)]:
        er[0, ns(d)] += g * (1 - p) / 2
        er[1, ns(d)] += g * (1 + p) / 2
    ir = ir / np.sqrt(np.sum(ir ** 2) / 2) + er * 0.5
    return np.concatenate([np.zeros((2, ns(predelay))), ir], axis=1)


def convolve(x, ir):
    out = np.zeros((2, x.shape[1]))
    for ch in range(2):
        out[ch] = signal.fftconvolve(x[ch], ir[ch])[:x.shape[1]]
    return out


def pingpong(x, delay, fb=0.35, taps=6, damp=3500):
    """Stereo ping-pong delay (wet only) of a stereo buffer."""
    out = np.zeros_like(x)
    src = (x[0] + x[1]) * 0.5
    d = ns(delay)
    g = 1.0
    cur = src
    for k in range(1, taps + 1):
        g *= fb
        cur = filt(cur, 'lp', damp)
        ch = k % 2
        out[ch, d * k:] += g * cur[:out.shape[1] - d * k]
    return out


# ------------------------------------------------------------------ drums
def kick(vel=1.0, thin=False, dur=0.5):
    t = tt(dur)
    f = 54 + 170 * np.exp(-t / 0.03) + 60 * np.exp(-t / 0.004)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * edecay(dur, 0.15, hold=0.025)
    body += np.sin(2 * np.pi * 172 * t) * np.exp(-t / 0.035) * 0.35     # knock (audible on phones)
    click = filt(filt(noise(0.015), 'hp', 2500), 'lp', 9000) * edecay(0.015, 0.0025) * 0.5
    y = body
    y[:len(click)] += click
    y = np.tanh(y * 1.8) / np.tanh(1.8)
    if thin:
        y = filt(filt(y, 'hp', 220), 'hp', 220)
    return fades(y * vel, 0.0005, 0.02)


def clap(vel=1.0):
    dur = 0.45
    t = tt(dur)
    env = np.zeros(ns(dur))
    for off, g in [(0.0, 0.7), (0.012, 0.8), (0.024, 1.0)]:
        i = ns(off)
        env[i:] += g * np.exp(-t[:len(env) - i] / 0.0055)
    i = ns(0.024)
    env[i:] += 0.45 * np.exp(-t[:len(env) - i] / 0.075)
    n = noise(dur)
    y = filt(n * env, 'bp', 1250, 0.8) * 2.2 + filt(filt(n * env, 'hp', 3500), 'lp', 10000) * 0.5
    return y * vel


def snare(vel=1.0, dur=0.22):
    t = tt(dur)
    tone = np.sin(2 * np.pi * np.cumsum(185 + 60 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.05)
    n = noise(dur)
    nz = filt(n, 'bp', 3200, 0.6) * np.exp(-t / 0.075) * 1.8 + filt(filt(n, 'hp', 6000), 'lp', 12000) * np.exp(-t / 0.05) * 0.4
    return (tone * 0.6 + nz) * vel


def hat(open_=False, vel=1.0):
    dur = 0.32 if open_ else 0.06
    t = tt(dur)
    metal = sum(np.sign(np.sin(2 * np.pi * f * t + RNG.random() * 6)) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0))
    y = filt(metal * 0.35 + noise(dur) * 0.65, 'hp', 7200)
    y = filt(filt(y, 'peak', 10000, 1.0, 3), 'lp', 14000)
    return y * np.exp(-t / (0.085 if open_ else 0.013)) * vel


def crash(vel=1.0, dur=2.4):
    t = tt(dur)
    n = noise(dur)
    metal = sum(np.sign(np.sin(2 * np.pi * f * t + RNG.random() * 6)) for f in (313, 412.7, 523.1, 667.3, 801.9, 1030.4))
    y = filt(n * 0.8 + metal * 0.2, 'hp', 4200)
    y = filt(filt(y, 'hs', 9000, 0.7, 2), 'lp', 12500)
    return fades(y * np.exp(-t / 0.55) * vel, 0.001, 0.3)


# ------------------------------------------------------------------ tonal instruments
def bass_note(f, dur, vel=1.0):
    t = tt(dur)
    s = saw(f, dur) * 0.55 + saw(f * 1.004, dur) * 0.35 + np.sin(2 * np.pi * f * t) * 0.9 + np.sin(np.pi * f * t) * 0.5
    cut = 240 + 1400 * np.exp(-t / 0.06)
    y = tvfilt(s, 'lp', cut, 1.2)
    e = adsr(dur, 0.003, 0.09, 0.7, 0.03)
    y = np.concatenate([y, np.zeros(len(e) - len(y))]) * e
    return np.tanh(y * 2.0) * vel


def supersaw(freqs, dur, voices=5, detune=0.16, cutoff=2600, a=0.02, r=0.25, vel=1.0):
    out = np.zeros((2, ns(dur + r)))
    for f in freqs:
        for v in range(voices):
            k = (v - (voices - 1) / 2) / ((voices - 1) / 2)
            s = saw(f * 2 ** (k * detune / 12), dur + r)
            out += pan_st(s, k * 0.85)
    out /= len(freqs) * voices ** 0.5
    for ch in range(2):
        out[ch] = filt(filt(out[ch], 'lp', cutoff, 0.6), 'hp', 150)
    e = adsr(dur, a, 0.4, 0.8, r)
    return out * e * vel


def pluck(f, dur=0.3, bright=1.0, vel=1.0):
    t = tt(dur)
    s = saw(f, dur) * 0.6 + square(f * 2.0, dur) * 0.25 + np.sin(2 * np.pi * f * t) * 0.4
    cut = 350 + 5200 * bright * np.exp(-t / 0.045)
    y = tvfilt(s, 'lp', cut, 1.6) * np.exp(-t / 0.11)
    return fades(y * vel, 0.001, 0.02)


def bell(f, dur=1.2, vel=1.0, bright=1.0):
    """FM-ish bell: inharmonic partials with individual decays."""
    t = tt(dur)
    y = np.zeros(len(t))
    for ratio, amp, tau in [(1, 1.0, 0.9), (2.0, 0.45, 0.5), (2.76, 0.35 * bright, 0.3), (5.4, 0.2 * bright, 0.12), (8.93, 0.1 * bright, 0.06)]:
        y += amp * np.sin(2 * np.pi * f * ratio * t + RNG.random()) * np.exp(-t / (tau * dur))
    return fades(y * vel * 0.5, 0.001, 0.05)


# ------------------------------------------------------------------ sound effects
def fx_tick(i=0):
    f = [2600, 2900, 3200, 3500, 3900, 4200, 2400, 2800, 3000, 3300, 3600, 4000][i % 12]
    t = tt(0.03)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.004) + filt(filt(noise(0.03), 'hp', 5000), 'lp', 12000) * np.exp(-t / 0.0015) * 0.6
    return y * 0.5


def fx_blip(i=0):
    notes = ['A5', 'C6', 'E6', 'G5', 'D6', 'E5', 'A6', 'C6', 'E6', 'G5', 'D6', 'A5']
    f = hz(notes[i % len(notes)])
    t = tt(0.12)
    y = np.sin(2 * np.pi * np.cumsum(glide(f * 0.94, f, 0.12, 0.3)) / SR) * adsr(0.07, 0.004, 0.03, 0.4, 0.05)[:len(t)]
    return y * 0.35


def fx_whoosh(dur=0.4, f0=500, f1=5000, f2=900, peak=0.55, vel=1.0, q=1.4):
    n = ns(dur)
    k = np.linspace(0, 1, n)
    f = np.where(k < peak, f0 * (f1 / f0) ** (k / peak), f1 * (f2 / f1) ** ((k - peak) / (1 - peak)))
    y = filt(tvfilt(noise(dur), 'bp', f, q) * 2.2, 'lp', 9000)
    env = np.where(k < peak, (k / peak) ** 2, ((1 - k) / (1 - peak)) ** 1.5)
    return y * env * vel


def fx_riser(dur, f0=300, f1=6000, vel=1.0, tonal=True):
    n = ns(dur)
    k = np.linspace(0, 1, n)
    y = tvfilt(noise(dur), 'bp', f0 * (f1 / f0) ** (k ** 1.6), 2.0) * 2.0
    if tonal:
        y += saw(glide(hz('A3'), hz('A5'), dur, 1.8), dur) * 0.18 + saw(glide(hz('E4'), hz('E6'), dur, 1.8), dur) * 0.12
    return y * (k ** 2.2) * vel


def fx_impact(vel=1.0, sub=True, dur=2.2):
    t = tt(dur)
    boom = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t / 0.09)) / SR) * np.exp(-t / 0.55)
    boom = np.tanh(boom * 2.2) * (0.6 if sub else 0.0)
    body = filt(noise(dur), 'lp', 900) * np.exp(-t / 0.18) * 1.6
    body += np.sin(2 * np.pi * np.cumsum(110 + 90 * np.exp(-t / 0.05)) / SR) * np.exp(-t / 0.25) * 0.7
    snap = filt(noise(dur), 'bp', 2500, 0.8) * np.exp(-t / 0.035) * 1.8
    return fades((boom + body + snap) * vel, 0.0005, 0.2)


def fx_pop(f=600, vel=1.0):
    t = tt(0.09)
    y = np.sin(2 * np.pi * np.cumsum(glide(f * 0.6, f * 1.5, 0.09, 0.25)) / SR) * np.exp(-t / 0.028)
    return y * vel * 0.6


def fx_click(vel=1.0):
    y = np.zeros(ns(0.08))
    for off, f, g in [(0.0, 1900, 1.0), (0.055, 2600, 0.55)]:
        t = tt(0.02)
        c = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.0022) + filt(filt(noise(0.02), 'hp', 4000), 'lp', 11000) * np.exp(-t / 0.0012)
        y[ns(off):ns(off) + len(c)] += c * g
    return y * vel * 0.55


def fx_chime(notes, gap=0.06, vel=1.0, dur=1.4):
    y = np.zeros(ns(dur + gap * len(notes)))
    for i, nm in enumerate(notes):
        bl = bell(hz(nm), dur, 1.0)
        y[ns(i * gap):ns(i * gap) + len(bl)] += bl
    return y * vel


def fx_thump(vel=1.0):
    t = tt(0.35)
    y = np.sin(2 * np.pi * np.cumsum(70 + 90 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.09)
    y += filt(noise(0.35), 'bp', 900, 0.7) * np.exp(-t / 0.03) * 1.2
    return np.tanh(y * 1.5) * vel


def fx_ratchet(times, vel=1.0):
    y = np.zeros(ns(max(times) + 0.05))
    for i, tk in enumerate(times):
        c = fx_tick(i)
        y[ns(tk):ns(tk) + len(c)] += c
    return y * vel


def fx_reverse_swell(dur, vel=1.0):
    t = tt(dur)
    c = filt(filt(noise(dur), 'hp', 2500), 'lp', 10000) * np.exp(-t / (dur * 0.35))
    tone = sum(np.sin(2 * np.pi * hz(n) * t) for n in ('A4', 'E5', 'A5')) * np.exp(-t / (dur * 0.4)) * 0.12
    return (c + tone)[::-1] * vel


# ------------------------------------------------------------------ composition
CHORDS = {
    'Am': ['A3', 'C4', 'E4', 'A4'],
    'F': ['A3', 'C4', 'F4', 'A4'],
    'C': ['G3', 'C4', 'E4', 'G4'],
    'G': ['G3', 'B3', 'D4', 'G4'],
    'Fmaj7': ['A3', 'C4', 'E4', 'F4'],
    'Gsus': ['G3', 'C4', 'D4', 'G4'],
    'Cadd9': ['G3', 'C4', 'D4', 'E4', 'G4'],
}
ROOT = {'Am': 'A2', 'F': 'F2', 'C': 'C3', 'G': 'G2', 'Fmaj7': 'F2', 'Gsus': 'G2', 'Cadd9': 'C3'}
ARP = {  # 16th-note arpeggio cells
    'Am': ['A4', 'C5', 'E5', 'A5', 'E5', 'C5', 'E5', 'C5'],
    'F': ['A4', 'C5', 'F5', 'A5', 'F5', 'C5', 'F5', 'C5'],
    'C': ['G4', 'C5', 'E5', 'G5', 'E5', 'C5', 'E5', 'C5'],
    'G': ['G4', 'B4', 'D5', 'G5', 'D5', 'B4', 'D5', 'B4'],
}
# (start beat, end beat, chord)
PROG = [(0, 4, 'Fmaj7'), (4, 8, 'G'),
        (8, 12, 'Am'), (12, 16, 'F'), (16, 20, 'C'), (20, 24, 'G'),
        (24, 28, 'Am'), (28, 32, 'F'), (32, 36, 'C'), (36, 40, 'G'),
        (40, 44, 'Am'), (44, 48, 'F'), (48, 52, 'C'), (52, 56, 'G'),
        (56, 58, 'F'), (58, 60, 'G'), (60, 64, 'Cadd9')]


def chord_at(beat):
    for s, e, c in PROG:
        if s <= beat < e:
            return c
    return 'Cadd9'


def build_music(drums, bass, keys, arp, lead):
    kicks = []
    # ---------------- drums
    for beat in range(64):
        t = b(beat)
        if beat < 8:                                    # filtered intro kick, half time then straight
            if beat < 4 and beat % 2 == 0 or beat >= 4:
                drums.add(kick(0.55 if beat < 4 else 0.7, thin=True), t)
            continue
        if 52 <= beat < 53 or beat >= 60:              # stop before the mark lands / outro
            continue
        drums.add(kick(1.0), t)
        kicks.append(t)
        if beat % 2 == 1:
            drums.add(clap(0.8), t, pan=0.0)
    kicks.append(b(60))                                  # final downbeat
    drums.add(kick(1.05), b(60))
    # hats
    for s16 in range(64 * 4):
        beat = s16 / 4
        t = b(beat)
        if beat >= 60 or 52 <= beat < 53:
            continue
        if beat < 4:
            continue
        pos = s16 % 4
        if beat < 8:
            if pos == 2:
                drums.add(hat(False, 0.35 + 0.25 * (beat - 4) / 4), t, pan=0.25)
            continue
        if pos == 2:
            drums.add(hat(True, 0.26), t, pan=-0.35)
        else:
            drums.add(hat(False, 0.17 if pos else 0.12), t, pan=0.4)
    # snare roll into the drop and into the mark
    for start, end in [(4, 8), (50, 52.5)]:
        k = start
        while k < end - 0.01:
            p = (k - start) / (end - start)
            step = 0.5 if p < 0.5 else 0.25 if p < 0.8 else 0.125
            drums.add(filt(snare(0.25 + 0.6 * p), 'hp', 200 + 800 * (1 - p)), b(k), pan=0.1)
            k += step
    # crashes on the big moments
    for beat, v in [(8, 1.0), (24, 0.5), (36, 0.5), (43, 0.8), (53, 1.0), (56, 0.6), (60, 0.8)]:
        drums.add(crash(v), b(beat), pan=0.1)

    # ---------------- bass: off-beat pumping 8ths (+ sub on the downbeat after the drop)
    for beat8 in range(16, 128):
        beat = beat8 / 2
        if 52 <= beat < 53 or beat >= 60:
            continue
        c = chord_at(beat)
        f = hz(ROOT[c])
        if beat8 % 2 == 1:
            bass.add(bass_note(f, BEAT * 0.42, 0.9), b(beat))
        elif beat in (53,):
            bass.add(bass_note(f / 2, BEAT * 0.9, 1.0), b(beat))
    # final low C under the outro
    bass.add(bass_note(hz('C2'), 1.6, 0.8) * 0.8, b(60))

    # ---------------- chords
    for s, e, c in PROG:
        dur = b(e) - b(s)
        if s < 8:          # intro pad, darker
            keys.add(supersaw([hz(n) for n in CHORDS[c]], dur, cutoff=900 + 500 * (s / 4), a=0.4, r=0.3, vel=0.55), b(s))
        elif s >= 60:      # outro: long, open chord
            keys.add(supersaw([hz(n) for n in CHORDS[c]] + [hz('C5')], 3.2, cutoff=3000, a=0.01, r=1.2, vel=0.9), b(s))
        else:
            keys.add(supersaw([hz(n) for n in CHORDS[c]], dur, cutoff=2800 if s >= 56 else 2300, a=0.01, r=0.2, vel=0.75), b(s))

    # ---------------- arp (16ths) with an opening filter in the intro
    for s16 in range(0, 60 * 4):
        beat = s16 / 4
        if 8 <= beat < 12 or 52 <= beat < 53:
            continue                                     # let the logo breathe / stop
        c = chord_at(beat)
        base = {'Fmaj7': 'F', 'Gsus': 'G', 'Cadd9': 'C'}.get(c, c)
        cell = ARP[base]
        note = cell[s16 % 8]
        if beat < 8:
            bright = 0.15 + 0.85 * (beat / 8) ** 1.5
            vel = 0.35 + 0.25 * beat / 8
        else:
            bright = 0.7 if s16 % 4 else 1.0
            vel = 0.42 if s16 % 4 else 0.55
            if 28 <= beat < 36:                              # billing: lighter, higher
                note = note[:-1] + str(int(note[-1]) + (1 if s16 % 2 else 0))
                vel *= 0.8
        arp.add(pluck(hz(note), 0.26, bright, vel), b(beat), pan=0.2 if s16 % 2 else -0.2)

    # ---------------- lead motif on the end card (F -> G -> C)
    motif = [(56, 'C6', 0.5), (56.5, 'A5', 0.5), (57, 'C6', 0.5), (57.5, 'F6', 1.0),
             (58.5, 'D6', 0.5), (59, 'B5', 0.5), (59.5, 'D6', 0.5), (60, 'E6', 3.0)]
    for beat, nm, d in motif:
        lead.add(bell(hz(nm), max(0.8, b(d) * 1.6), 0.7, 0.8), b(beat), pan=0.0)
    return kicks


def build_fx(fx, cues):
    last = {}
    for c in cues:
        t, ty, i, v = c['t'], c['type'], c.get('i', 0), c.get('v', 1.0)
        if ty == 'tick':
            fx.add(fx_tick(i), t, 0.9, pan=0.1)
        elif ty == 'blip':
            fx.add(fx_blip(i), t, 0.55, pan=[-0.6, 0.5, -0.3, 0.7, -0.7, 0.4, -0.5, 0.6, -0.2, 0.3, 0.0, 0.2][i % 12])
        elif ty == 'spin':
            times = np.cumsum(np.linspace(0.012, 0.05, 13)) - 0.012
            fx.add(fx_ratchet(list(times), 0.9), t)
            fx.add(fx_whoosh(0.3, 800, 4000, 1500, 0.5, 0.35), t)
        elif ty == 'land':
            fx.add(fx_thump(0.6), t)
            fx.add(fx_tick(5), t, 0.8)
        elif ty == 'slam':
            fx.add(fx_impact(0.9 * v, sub=True, dur=1.2), t)
            fx.add(snare(0.7), t)
        elif ty == 'morph':
            fx.add(fx_whoosh(0.3, 700, 3800, 1200, 0.5, 0.5), t, pan=-0.2)
        elif ty == 'suck':
            fx.add(fx_reverse_swell(3.72 - t, 0.9), t)
        elif ty == 'drop':
            fx.add(fx_impact(1.25, True, 2.6), t)
        elif ty == 'whoosh':
            fx.add(fx_whoosh(0.42, 400, 5200, 900, 0.6, 0.75 * v), t - 0.1)
        elif ty == 'pop':
            fx.add(fx_pop([520, 660, 780, 880][i % 4], 0.8), t, pan=[-0.3, 0.3, 0.0, 0.2][i % 4])
        elif ty == 'draw':
            d = 0.36 if v == 1.0 else 1.0
            y = sine(glide(700, 1500, d, 0.8), d) * np.sin(np.linspace(0, np.pi, ns(d))) * 0.12
            fx.add(y + fx_whoosh(d, 1200, 5000, 3000, 0.7, 0.25), t)
        elif ty == 'rise':
            fx.add(fx_whoosh(0.45, 300, 2500, 1800, 0.8, 0.35 * v), t)
        elif ty == 'zoom':
            d = 0.49
            y = fx_riser(d, 200, 7000, 0.8, tonal=False) + sine(glide(180, 900, d, 2.0), d) * (np.linspace(0, 1, ns(d)) ** 2) * 0.25
            fx.add(y, t)
        elif ty == 'card':
            fx.add(fx_whoosh(0.1, 1500, 6000, 3000, 0.5, 0.25), t - 0.03, pan=0.4)
            fx.add(pluck(hz(['A5', 'C6', 'E6', 'A6', 'C7'][i % 5]), 0.2, 1.0, 0.35), t, pan=0.2)
        elif ty == 'expand':
            fx.add(fx_whoosh(0.35, 400, 2200, 1500, 0.7, 0.3), t)
        elif ty == 'star':
            for k in range(5):
                fx.add(bell(hz(['C6', 'E6', 'G6', 'A6', 'C7'][k]), 0.35, 0.18), t + k * 0.05, pan=-0.4 + k * 0.2)
        elif ty == 'click':
            fx.add(fx_click(1.0), t - 0.01, pan=0.25)
        elif ty == 'split':
            fx.add(fx_pop(900, 0.9), t)
            fx.add(fx_whoosh(0.3, 900, 5000, 2000, 0.4, 0.45), t)
            fx.add(fx_chime(['G6', 'C7', 'E7'], 0.035, 0.25, 0.6), t + 0.05)
        elif ty == 'confirm':
            fx.add(fx_chime(['E6', 'A6'], 0.07, 0.45, 0.9), t)
        elif ty == 'grab':
            fx.add(fx_whoosh(0.16, 600, 2400, 1500, 0.6, 0.25), t, pan=0.3)
        elif ty == 'place':
            f = hz(['C5', 'D5', 'E5', 'G5'][i % 4])
            tk = tt(0.16)
            y = np.sin(2 * np.pi * f * tk) * np.exp(-tk / 0.035) + np.sin(2 * np.pi * f * 2.01 * tk) * np.exp(-tk / 0.02) * 0.4
            fx.add(y * 0.5 + fx_thump(0.25)[:len(tk)], t, pan=-0.1)
        elif ty == 'win':
            fx.add(fx_impact(0.8, True, 1.4), t)
            fx.add(fx_chime(['C6', 'E6', 'G6', 'C7'], 0.045, 0.5, 1.4), t + 0.02)
        elif ty == 'whip':
            fx.add(fx_whoosh(0.75, 350, 6500, 700, 0.5, 1.0, q=1.1), t, pan=0.0)
        elif ty == 'row':
            fx.add(fx_tick(i + 3), t, 0.6, pan=-0.2)
        elif ty == 'count':
            n = 12 if v == 1.0 else 6
            for k in range(n):
                fx.add(fx_tick(k), t + k * 0.03, 0.35 * (1 - k / (n + 2)), pan=0.3)
        elif ty == 'stamp':
            fx.add(fx_thump(0.8 * v), t)
            fx.add(snare(0.35), t)
        elif ty == 'flip':
            fx.add(fx_whoosh(0.3, 1200, 5500, 2500, 0.45, 0.55), t + 0.08)
        elif ty == 'coin':
            fx.add(fx_chime([['G6', 'C7'], ['C7', 'G7']][i % 2], 0.05, 0.35, 0.7), t)
        elif ty == 'paid':
            fx.add(fx_thump(1.0), t)
            fx.add(fx_impact(0.7, True, 1.2), t)
            fx.add(fx_chime(['C6', 'E6', 'G6', 'C7'], 0.04, 0.45, 1.3), t + 0.03)
        elif ty == 'shrink':
            fx.add(fx_whoosh(0.4, 3000, 1200, 300, 0.3, 0.4), t)
        elif ty == 'tiles':
            for k, f in enumerate([700, 880, 1040]):
                fx.add(fx_pop(f, 0.55), t + k * 0.07, pan=[-0.4, 0.0, 0.4][k])
        elif ty == 'wipe':
            fx.add(fx_whoosh(0.45, 300, 4200, 1500, 0.75, 0.9, q=0.9), t - 0.1)
        elif ty == 'wipe2':
            fx.add(fx_whoosh(0.4, 3000, 3800, 500, 0.1, 0.55, q=0.9), t)
        elif ty == 'node':
            fx.add(fx_pop([523, 659, 784, 880][i % 4], 0.6), t, pan=[0.0, 0.0, -0.4, 0.4][i % 4])
        elif ty == 'run':
            y = sine(glide(400, 2400, 0.6, 1.0), 0.6) * np.exp(-tt(0.6) / 0.3) * 0.12
            fx.add(y + fx_whoosh(0.6, 800, 6000, 3000, 0.8, 0.3), t)
            for k, nm in enumerate(['A5', 'C6', 'E6', 'A6']):
                fx.add(pluck(hz(nm), 0.2, 1.0, 0.3), t + k * 0.19, pan=-0.3 + k * 0.2)
        elif ty == 'cascade':
            for k in range(21):
                fx.add(fx_tick(k), t + 0.04 + (k // 3 + k % 3) * 0.045, 0.28, pan=[-0.4, 0.0, 0.4][k % 3])
        elif ty == 'shimmer':
            for k, nm in enumerate(['A5', 'C6', 'E6', 'A6', 'C7', 'E7', 'A7']):
                fx.add(bell(hz(nm), 0.5, 0.2), t + k * 0.04, pan=-0.6 + k * 0.2)
        elif ty == 'collapse':
            d = b(53) - t
            fx.add(fx_reverse_swell(d, 0.8) + fx_riser(d, 400, 5000, 0.5, tonal=False), t)
        elif ty == 'logo':
            fx.add(fx_impact(1.2, True, 2.4), t)
        elif ty == 'offer':
            fx.add(fx_thump(0.6), t)
            fx.add(fx_pop(880, 0.8), t)
            fx.add(fx_chime(['F6', 'A6', 'C7'], 0.045, 0.5, 1.2), t + 0.02)
        elif ty == 'pill':
            fx.add(fx_pop(700, 0.8), t)
            fx.add(fx_whoosh(0.45, 500, 3000, 1500, 0.4, 0.35), t + 0.08)
        elif ty == 'type':
            for k in range(13):
                fx.add(fx_tick(k), t + k * 0.024, 0.3, pan=-0.3 + k * 0.05)
        elif ty == 'chime':
            fx.add(fx_chime(['D6', 'G6', 'B6', 'D7'], 0.05, 0.5, 1.8), t)
        last[ty] = t


# ------------------------------------------------------------------ mastering helpers
def eq_master(ch):
    ch = filt(filt(ch, 'hp', 36, 0.7), 'hp', 36, 0.7)   # 24 dB/oct below the kick
    ch = filt(ch, 'ls', 70, 0.7, -3.5)
    ch = filt(ch, 'peak', 280, 0.9, 1.5)                   # warmth
    ch = filt(ch, 'peak', 1300, 0.8, 2.0)                  # presence on small speakers
    ch = filt(ch, 'hs', 9500, 0.7, -3.0)                   # smooth the top
    ch = filt(ch, 'lp', 17500, 0.6)
    return ch


def widen(x, width):
    mid = (x[0] + x[1]) / 2
    side = (x[0] - x[1]) / 2 * width
    return np.vstack([mid + side, mid - side])


def sidechain(kicks, depth=0.65, release=0.19):
    g = np.ones(N + TAIL)
    n = ns(release * 3)
    tr = np.arange(n) / SR
    shape = depth * np.where(tr < 0.003, tr / 0.003, np.exp(-(tr - 0.003) / (release / 2.2)))
    for kt in kicks:
        i0 = ns(kt)
        seg = g[i0:i0 + n]
        np.minimum(seg, 1 - shape[:len(seg)], out=seg)
    return g


def compress(x, thresh_db=-14, ratio=2.5, attack=0.01, release=0.15, makeup_db=0.0):
    lvl = np.sqrt(np.mean(x ** 2, axis=0) + 1e-12)
    a_a = np.exp(-1 / (attack * SR))
    a_r = np.exp(-1 / (release * SR))
    # envelope follower via lfilter on level (approximation of attack/release: use release smoothing)
    env = signal.lfilter([1 - a_r], [1, -a_r], lvl)
    env = np.maximum(env, signal.lfilter([1 - a_a], [1, -a_a], lvl))
    db = 20 * np.log10(env + 1e-9)
    over = np.maximum(0, db - thresh_db)
    gain_db = -over * (1 - 1 / ratio) + makeup_db
    return x * 10 ** (gain_db / 20)


def limiter(x, ceiling_db=-1.0, lookahead=0.004, release=0.08):
    ceiling = 10 ** (ceiling_db / 20)
    peak = np.max(np.abs(x), axis=0)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    la = ns(lookahead)
    # look-ahead: min over the next `la` samples
    padded = np.concatenate([need, np.ones(la)])
    win = np.lib.stride_tricks.sliding_window_view(padded, la + 1).min(axis=1)[:len(need)]
    a_r = np.exp(-1 / (release * SR))
    g = np.empty_like(win)
    cur = 1.0
    # attack instantly, release smoothly (vectorised via block loop)
    for i0 in range(0, len(win), 4096):
        seg = win[i0:i0 + 4096]
        out = np.empty_like(seg)
        for j, v in enumerate(seg):
            cur = v if v < cur else v + (cur - v) * a_r
            out[j] = cur
        g[i0:i0 + 4096] = out
    y = x * g
    return np.clip(y, -ceiling, ceiling)


def lufs(x):
    """BS.1770 integrated loudness (gated) of a stereo buffer."""
    def kw(ch):
        y = filt(ch, 'hs', 1681.97, 0.7072, 3.9998)
        return filt(y, 'hp', 38.13, 0.5003)
    y = np.vstack([kw(x[0]), kw(x[1])])
    blk, hop = ns(0.4), ns(0.1)
    ms = np.array([np.sum(np.mean(y[:, i:i + blk] ** 2, axis=1)) for i in range(0, y.shape[1] - blk, hop)])
    L = -0.691 + 10 * np.log10(ms + 1e-12)
    g = ms[L > -70]
    rel = -0.691 + 10 * np.log10(np.mean(g)) - 10
    g2 = ms[(L > -70) & (L > rel)]
    return -0.691 + 10 * np.log10(np.mean(g2))


# ------------------------------------------------------------------ main
def main():
    cues_path = sys.argv[1] if len(sys.argv) > 1 else 'out/cues.json'
    out_path = sys.argv[2] if len(sys.argv) > 2 else 'out/soundtrack.wav'
    cues = json.load(open(cues_path))

    drums, bass, keys, arp, lead, fx = Bus(), Bus(), Bus(), Bus(), Bus(), Bus()
    kicks = build_music(drums, bass, keys, arp, lead)
    build_fx(fx, cues)

    # a breath of silence right before the two big hits (the drop and the mark landing)
    for g0, g1 in [(3.68, b(8)), (b(53) - 0.2, b(53))]:
        gate = np.ones(N + TAIL)
        i0, i1 = ns(g0), ns(g1)
        gate[i0:i1] = np.linspace(1, 0, i1 - i0) ** 0.35
        for bus in (drums, bass, keys, arp):
            bus.x *= gate

    # buses: tone + space
    sc = sidechain(kicks)
    bass.x *= sc
    keys.x *= sidechain(kicks, depth=0.75, release=0.22)
    arp.x *= sidechain(kicks, depth=0.35, release=0.15)
    keys.x = np.vstack([filt(filt(keys.x[ch], 'peak', 400, 0.8, -3), 'hs', 6000, 0.7, 1.5) for ch in range(2)])
    arp.x += pingpong(arp.x, b(0.75), fb=0.38, taps=5) * 0.55

    ir = make_ir()
    ir_long = make_ir(length=3.4, rt60=2.6, damp=0.5, seed=11)
    verb = convolve(keys.x * 0.25 + arp.x * 0.35 + lead.x * 0.45 + fx.x * 0.18 + drums.x * 0.06, ir)
    verb_long = convolve(fx.x * 0.12 + lead.x * 0.3, ir_long)

    keys.x = widen(keys.x, 1.5)
    arp.x = widen(arp.x, 1.3)
    mix = (drums.x * 0.72 + bass.x * 0.6 + keys.x * 0.5 + arp.x * 0.38 + lead.x * 0.42 + fx.x * 0.62
           + verb * 0.32 + verb_long * 0.22)
    # intro: gentle low cut that opens at the drop
    k = np.clip((np.arange(mix.shape[1]) / SR - 3.4) / 0.35, 0, 1)
    lows = np.vstack([filt(mix[ch], 'lp', 140) for ch in range(2)])
    mix = mix - lows * (1 - k) * 0.7
    mix = np.vstack([eq_master(mix[ch]) for ch in range(2)])
    # the last frames: gentle fade so the loop point is clean
    fade = np.ones(mix.shape[1])
    f0, f1 = ns(DUR - 0.35), ns(DUR)
    fade[f0:f1] = np.linspace(1, 0, f1 - f0) ** 1.5
    fade[f1:] = 0
    mix *= fade

    mix = compress(mix, thresh_db=-16, ratio=2.2, attack=0.008, release=0.2)
    mix = np.tanh(mix * 1.15) / 1.15
    mix = mix[:, :N]
    # loudness: aim ~ -11 LUFS, true-peak-ish ceiling -1 dBFS
    target = -11.0
    for _ in range(3):
        L = lufs(mix)
        mix *= 10 ** ((target - L) / 20)
        mix = limiter(mix, -1.0)
    L = lufs(mix)
    peak = 20 * np.log10(np.max(np.abs(mix)) + 1e-12)
    print(f'loudness {L:.1f} LUFS, peak {peak:.2f} dBFS')

    from scipy.io import wavfile
    wavfile.write(out_path, SR, (mix.T * 32767).astype(np.int16))
    print('wrote', out_path)


if __name__ == '__main__':
    main()
