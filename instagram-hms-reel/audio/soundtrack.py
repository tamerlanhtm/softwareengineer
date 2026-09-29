"""Original soundtrack and sound design for the HMSNow reel.

Everything is synthesised from scratch with numpy (no samples, no loops), so
the result is royalty-free. The music sits on the animation's 120 BPM grid
(bars start on odd seconds, the drop lands at 3.0s) and the sound effects are
placed from audio/cues.json, which the animation exports.

usage: python3 audio/soundtrack.py out.wav [--sfx-only]
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
DUR = 30.0
N = int(SR * DUR)
TAIL = SR * 3
HERE = Path(__file__).resolve().parent
rng = np.random.default_rng(7)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def ns(dur):
    return max(1, int(round(dur * SR)))


# ---------------------------------------------------------------- buses


class Bus:
    def __init__(self):
        self.x = np.zeros((2, N + TAIL))

    def add(self, sig, t, gain=1.0, pan=0.0):
        sig = np.asarray(sig, dtype=float) * gain
        if sig.ndim == 1:
            th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
            sig = np.vstack([sig * np.cos(th), sig * np.sin(th)]) * np.sqrt(2)
        i = int(round(t * SR))
        if i < 0:
            sig = sig[:, -i:]
            i = 0
        j = min(i + sig.shape[1], self.x.shape[1])
        if j > i:
            self.x[:, i:j] += sig[:, : j - i]


# ---------------------------------------------------------------- oscillators


def osc_saw(f, dur, phase0=0.0):
    n = ns(dur)
    f = np.broadcast_to(np.asarray(f, dtype=float), (n,))
    dt = f / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt[m]
    y[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]
    y[m] -= x * x + x + x + 1
    return y


def osc_square(f, dur, phase0=0.0):
    return 0.5 * (osc_saw(f, dur, phase0) - osc_saw(f, dur, phase0 + 0.5))


def osc_sine(f, dur, phase0=0.0):
    n = ns(dur)
    f = np.broadcast_to(np.asarray(f, dtype=float), (n,))
    return np.sin(2 * np.pi * (phase0 + np.cumsum(f) / SR))


def noise(dur):
    return rng.standard_normal(ns(dur))


# ---------------------------------------------------------------- filters


def lp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x, axis=-1)


def hp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, "high", fs=SR, output="sos"), x, axis=-1)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, min(hi, SR * 0.45)], "band", fs=SR, output="sos"), x, axis=-1)


def biquad(kind, fc, q):
    w = 2 * np.pi * np.clip(fc, 20, SR * 0.45) / SR
    c, s = np.cos(w), np.sin(w)
    a = s / (2 * q)
    if kind == "low":
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
    elif kind == "high":
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
    else:  # band, constant peak gain
        b = [a, 0.0, -a]
    return np.array(b) / (1 + a), np.array([1.0, -2 * c / (1 + a), (1 - a) / (1 + a)])


def sweep(x, fc, kind="low", q=0.8, block=128):
    """Time-varying biquad: coefficients updated every `block` samples."""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    y = np.zeros_like(x)
    zi = np.zeros(2)
    for i in range(0, len(x), block):
        b, a = biquad(kind, fc[min(i + block // 2, len(x) - 1)], q)
        y[i : i + block], zi = signal.lfilter(b, a, x[i : i + block], zi=zi)
    return y


def mixdown(*parts):
    """Sum (signal, gain) pairs of different lengths into one mono signal."""
    n = max(len(p) for p, _ in parts)
    out = np.zeros(n)
    for p, g in parts:
        out[: len(p)] += p * g
    return out


def fade(x, a=0.002, r=0.01):
    n = x.shape[-1]
    e = np.ones(n)
    na, nr = min(ns(a), n), min(ns(r), n)
    e[:na] = np.linspace(0, 1, na)
    e[n - nr :] *= np.linspace(1, 0, nr)
    return x * e


# ---------------------------------------------------------------- space


def make_ir(rt60=1.9, damp=5200, pre=0.012, seed=3):
    r = np.random.default_rng(seed)
    n = ns(rt60 * 1.1)
    t = tt(n)
    env = 10 ** (-3 * t / rt60) * np.clip(t / 0.006, 0, 1)
    ir = np.vstack([lp(r.standard_normal(n) * env, damp), lp(r.standard_normal(n) * env, damp)])
    ir = np.hstack([np.zeros((2, ns(pre))), ir])
    return ir / np.sqrt(np.sum(ir**2) / 2)


def convolve(x, ir):
    out = np.zeros((2, x.shape[1] + ir.shape[1] - 1))
    for c in range(2):
        out[c] = signal.fftconvolve(x[c], ir[c])
    return out[:, : x.shape[1]]


def pingpong(beat=0.375, fb=0.42, taps=5):
    n = ns(beat * taps) + 1
    ir = np.zeros((2, n))
    for k in range(1, taps + 1):
        ir[k % 2, ns(beat * k)] = fb**k
    return ir


# ---------------------------------------------------------------- instruments


def kick(f0=150, f1=48, tau_p=0.03, tau_a=0.19, dur=0.45, click=1.0):
    t = tt(ns(dur))
    f = f1 + (f0 - f1) * np.exp(-t / tau_p)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tau_a)
    y = np.tanh(1.6 * y) / np.tanh(1.6)
    c = hp(noise(dur), 2500) * np.exp(-t / 0.004) * 0.35 * click
    return fade(y + c, 0.0005, 0.02)


def clap():
    dur = 0.4
    t = tt(ns(dur))
    env = np.zeros_like(t)
    for off in (0.0, 0.010, 0.021):
        env += (t >= off) * np.exp(-np.clip(t - off, 0, None) / 0.005)
    env += (t >= 0.03) * np.exp(-np.clip(t - 0.03, 0, None) / 0.11) * 0.75
    return fade(bp(noise(dur) * env, 850, 4200) * 2.2)


def snare(pitch=190):
    dur = 0.25
    t = tt(ns(dur))
    body = np.sin(2 * np.pi * pitch * t) * np.exp(-t / 0.05)
    nz = bp(noise(dur), 1500, 9000) * np.exp(-t / 0.09)
    return fade(0.6 * body + nz)


def hat(open_=False):
    dur = 0.35 if open_ else 0.07
    t = tt(ns(dur))
    metal = sum(osc_square(f, dur) for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0)) / 6
    y = hp(0.6 * metal + 0.5 * noise(dur), 7200, 4)
    return fade(y * np.exp(-t / (0.085 if open_ else 0.016)))


def crash(dur=2.2):
    t = tt(ns(dur))
    metal = sum(osc_square(f, dur) for f in (431, 587, 739, 1019, 1321)) / 5
    y = hp(0.35 * metal + noise(dur), 3800, 2) * np.exp(-t / 0.7)
    return fade(y, 0.001, 0.2)


def bass_note(m, dur, cutoff=700):
    f = mtof(m)
    d = dur + 0.03
    t = tt(ns(d))
    y = 0.55 * osc_saw(f, d) + 0.75 * np.sin(2 * np.pi * f * t)
    y = sweep(y, cutoff + 1400 * np.exp(-t / 0.04), "low", 0.9)
    env = np.minimum(1, t / 0.003) * (0.35 + 0.65 * np.exp(-t / 0.2))
    return fade(y * env, 0.001, 0.03)


def supersaw(notes, dur, cutoff=2000, voices=5, detune=0.14, attack=0.06, release=0.35, width=0.85):
    d = dur + release
    t = tt(ns(d))
    out = np.zeros((2, len(t)))
    for m in notes:
        for v in range(voices):
            k = (v - (voices - 1) / 2) / ((voices - 1) / 2)
            y = osc_saw(mtof(m + k * detune), d, rng.random())
            th = (k * width + 1) * np.pi / 4
            out[0] += y * np.cos(th)
            out[1] += y * np.sin(th)
    env = np.clip(t / attack, 0, 1) * np.where(t < dur, 1.0, np.exp(-(t - dur) / (release / 3)))
    out = lp(out * env, cutoff, 2)
    return out / np.sqrt(len(notes) * voices)


def pluck(m, dur=0.4, bright=5200, tau=0.11, mix=0.5):
    f = mtof(m)
    t = tt(ns(dur))
    y = (1 - mix) * osc_saw(f, dur) + mix * osc_square(f * 2, dur) * 0.6
    y = sweep(y, 350 + bright * np.exp(-t / 0.06), "low", 1.1)
    return fade(y * np.minimum(1, t / 0.002) * np.exp(-t / tau), 0.001, 0.02)


def bell(m, dur=0.9, ratio=3.51, index=1.8, tau=0.32):
    f = mtof(m)
    t = tt(ns(dur))
    mod = np.sin(2 * np.pi * f * ratio * t) * index * np.exp(-t / (tau * 0.45))
    y = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / tau) * np.minimum(1, t / 0.0015)
    return fade(y, 0.0005, 0.03)


# ---------------------------------------------------------------- sound effects


def fx_whoosh(dur=0.45, lo=260, hi=2800, rev=False):
    t = tt(ns(dur))
    u = t / dur
    shape = np.sin(np.pi * u) ** 2 if not rev else u**2.2
    fc = lo + (hi - lo) * (np.sin(np.pi * u) if not rev else (1 - u) ** 0.7)
    y = sweep(noise(dur), fc, "band", 1.3) * shape * 2.2
    return fade(y, 0.002, 0.02)


def fx_riser(dur):
    t = tt(ns(dur))
    u = t / dur
    nz = sweep(noise(dur), 300 * (9000 / 300) ** u, "band", 2.2) * 1.8
    tone = sweep(osc_saw(mtof(45 + 26 * u**1.3), dur), 500 + 5000 * u, "low", 1.2) * 0.35
    y = (nz + tone) * u**2.4
    return fade(y, 0.01, 0.006)


def fx_suck(dur):
    t = tt(ns(dur))
    u = t / dur
    y = sweep(noise(dur), 900 + 9000 * u**2, "low", 0.8) * u**3.2 * 1.3
    y = hp(y, 500)
    return fade(y, 0.01, 0.004)


def fx_impact(big=True):
    dur = 2.4
    t = tt(ns(dur))
    sub = np.sin(2 * np.pi * np.cumsum(30 + 55 * np.exp(-t / 0.11)) / SR) * np.exp(-t / (1.0 if big else 0.5))
    nz = sweep(noise(dur), 300 + 7000 * np.exp(-t / 0.25), "low", 0.7) * np.exp(-t / 0.45) * 0.8
    y = np.tanh(1.6 * sub) * 0.9 + nz
    return fade(y, 0.0005, 0.3)


def fx_glitch(dur=0.14, seed=0):
    r = np.random.default_rng(seed + 11)
    t = tt(ns(dur))
    f = r.uniform(180, 700)
    y = osc_square(f * (1 + 0.5 * np.sin(2 * np.pi * 37 * t)), dur) * 0.6 + r.standard_normal(len(t)) * 0.4
    y = np.round(y * 6) / 6
    hold = 7
    y = np.repeat(y[::hold], hold)[: len(t)]
    gate = (np.floor(t / 0.0156) % 2 == 0) | (t < 0.03)
    return fade(bp(y * gate, 300, 7000) * np.exp(-t / 0.08), 0.001, 0.01)


def fx_ping(m1, m2):
    a = bell(m1, 0.4, ratio=2.0, index=0.6, tau=0.09)
    b = bell(m2, 0.5, ratio=2.0, index=0.6, tau=0.12)
    out = np.zeros(len(b) + ns(0.07))
    out[: len(a)] += a
    out[ns(0.07) : ns(0.07) + len(b)] += b
    return out


def fx_pop(f0=620):
    dur = 0.12
    t = tt(ns(dur))
    y = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.8 * np.exp(-t / 0.012))) / SR) * np.exp(-t / 0.035)
    return fade(y, 0.0005, 0.01)


def fx_click(bright=1.0):
    dur = 0.03
    t = tt(ns(dur))
    y = hp(noise(dur), 2500) * np.exp(-t / 0.0018) * bright + np.sin(2 * np.pi * 2900 * t) * np.exp(-t / 0.004) * 0.5
    return fade(y, 0.0002, 0.005)


def fx_tick():
    dur = 0.04
    t = tt(ns(dur))
    return fade(np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.007), 0.0003, 0.005)


def fx_flap():
    dur = 0.06
    t = tt(ns(dur))
    y = bp(noise(dur), 1400, 5200) * np.exp(-t / 0.006) * 1.6 + np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.012) * 0.6
    return fade(y, 0.0002, 0.01)


def fx_type(dur):
    r = np.random.default_rng(int(dur * 1000))
    out = np.zeros(ns(dur + 0.05))
    x = 0.0
    while x < dur:
        c = fx_click(0.6) * r.uniform(0.5, 1.0)
        i = ns(x)
        out[i : i + len(c)] += c[: len(out) - i]
        x += r.uniform(0.028, 0.05)
    return out


def fx_lock():
    dur = 0.3
    t = tt(ns(dur))
    thunk = np.sin(2 * np.pi * np.cumsum(90 + 120 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.06)
    out = thunk * 0.9
    for off in (0.0, 0.045):
        c = fx_click(1.2)
        i = ns(off)
        out[i : i + len(c)] += c
    return out


def fx_stamp():
    dur = 0.6
    t = tt(ns(dur))
    y = np.sin(2 * np.pi * np.cumsum(55 + 90 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.14)
    y += lp(noise(dur), 1800) * np.exp(-t / 0.035) * 0.9
    return fade(np.tanh(1.5 * y), 0.0005, 0.05)


def fx_scan(dur):
    t = tt(ns(dur))
    u = t / dur
    y = sweep(noise(dur), 900 * (6 / 0.9) ** u, "band", 5.0) * 0.9
    y += np.sin(2 * np.pi * 2100 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 24 * t)) * 0.12
    return fade(y * np.sin(np.pi * u) ** 0.6, 0.005, 0.02)


def fx_rise(dur):
    t = tt(ns(dur))
    u = t / dur
    return fade(osc_sine(300 * 4**u, dur) * np.sin(np.pi * u) * 0.6, 0.005, 0.02)


def fx_beep(m):
    dur = 0.09
    t = tt(ns(dur))
    return fade(lp(osc_square(mtof(m), dur), 5000) * 0.5 * np.exp(-t / 0.05), 0.001, 0.01)


def fx_alert():
    a = fx_beep(88)
    b = fx_beep(83)
    out = np.zeros(len(a) + ns(0.08))
    out[: len(a)] += a
    out[ns(0.08) : ns(0.08) + len(b)] += b
    return out


# ---------------------------------------------------------------- song map

VOICING = {
    "Am": [57, 60, 64, 69],
    "F": [57, 60, 65, 69],
    "C": [55, 60, 64, 67],
    "G": [55, 59, 62, 67],
    "Cmaj": [60, 64, 67, 72, 76],
}
ROOT = {"Am": 33, "F": 29, "C": 36, "G": 31, "Cmaj": 36}
# (start, end, chord, pad cutoff)
PROGRESSION = [
    (3, 5, "Am", 1500), (5, 7, "F", 1800), (7, 9, "C", 2000), (9, 11, "G", 2600),
    (11, 13, "Am", 2600), (13, 15, "F", 2600), (15, 17, "C", 2800), (17, 18, "G", 2800),
    (18, 19, "G", 700), (19, 21, "Am", 1500), (21, 23, "F", 1700), (23, 25, "G", 2300),
    (25, 26, "F", 1100), (26, 27, "G", 3400), (27, 30, "Cmaj", 2600),
]
PENTA = [69, 72, 74, 76, 79, 81, 84, 86]
CMAJ_ARP = [60, 64, 67, 72, 76, 79, 84, 88, 91]


def chord_at(t):
    for a, b, c, _ in PROGRESSION:
        if a <= t < b:
            return c
    return "Am"


def in_any(t, spans):
    return any(a <= t < b for a, b in spans)


def build(cues, music=True):
    drums, bass, pads, arp, sfx, verb_send, delay_send = (Bus() for _ in range(7))
    kicks = []

    def add_kick(t, g=1.0, **kw):
        drums.add(kick(**kw), t, 0.95 * g)
        kicks.append(t)

    if music:
        # ---- intro: heartbeat, ticking hats, dark drone
        for i, t in enumerate(np.arange(0, 2.51, 0.5)):
            g = 0.28 + 0.08 * i
            drums.add(kick(f0=95, f1=40, tau_p=0.05, tau_a=0.18, click=0.2), t, g)
            drums.add(kick(f0=80, f1=38, tau_p=0.05, tau_a=0.14, click=0.1), t + 0.14, g * 0.6)
        for i, t in enumerate(np.arange(0, 2.9, 0.125)):
            drums.add(hat(), t, 0.03 + 0.07 * t / 2.9, pan=0.3 if i % 2 else -0.3)
        drone = supersaw([45, 52, 57, 60], 2.9, cutoff=700, attack=0.2, release=0.05)
        drone[:, :] *= np.clip(tt(drone.shape[1]) / 2.9, 0.2, 1.0) ** 1.5
        pads.add(drone, 0.0, 0.55)

        # ---- chords
        for a, b, c, cut in PROGRESSION:
            pads.add(supersaw(VOICING[c], b - a, cutoff=cut, attack=0.03 if a in (3, 26, 27) else 0.08,
                              release=0.9 if c == "Cmaj" else 0.25), a, 0.9 if c != "Cmaj" else 0.75)

        # ---- groove sections
        groove = [(3.0, 8.45), (9.0, 18.0), (19.0, 22.76), (26.0, 27.0)]
        beats = [round(x, 3) for x in np.arange(3.0, 30.0, 0.5)]
        for t in beats:
            if in_any(t, groove):
                add_kick(t)
        for t in (22.96, 23.5, 24.0, 24.28, 27.0):
            add_kick(t, 1.0)
        for t in beats:
            if in_any(t, groove) and (t * 2) % 2 == 1:
                drums.add(clap(), t, 0.5, pan=0.05)
                verb_send.add(clap(), t, 0.12)
        hat_spans = [(5.0, 8.45), (9.0, 18.0), (19.0, 22.76), (26.0, 27.0)]
        for i, t in enumerate(np.arange(3.0, 30.0, 0.125)):
            if not in_any(t, hat_spans):
                continue
            off8 = abs((t % 0.5) - 0.25) < 1e-6
            if off8:
                drums.add(hat(True), t, 0.16, pan=0.25)
            else:
                drums.add(hat(), t, 0.07 + (0.03 if i % 2 == 0 else 0), pan=-0.3 if i % 2 else 0.3)
        for t in (3.0, 9.0, 19.0, 26.02, 27.0):
            drums.add(crash(), t, 0.32 if t != 27.0 else 0.25, pan=0.15)

        # ---- snare roll into "Now."
        x = 25.0
        while x < 25.9:
            u = (x - 25.0) / 0.9
            drums.add(snare(170 + 200 * u), x, 0.12 + 0.5 * u**1.5, pan=0.1 * np.sin(x * 20))
            x += 0.125 if u < 0.5 else (0.0625 if u < 0.8 else 0.03125)

        # ---- bass
        bass_spans = [(3.0, 8.45), (9.0, 18.0), (19.0, 22.76), (26.0, 27.0)]
        for t in np.arange(3.0, 27.0, 0.25):
            if not in_any(t, bass_spans):
                continue
            r = ROOT[chord_at(t)]
            up = int(round(t * 4)) % 2 == 1
            bass.add(bass_note(r + (12 if up else 0), 0.22, cutoff=600 if t < 9 else 800), t, 0.5)
        for t, c in ((22.96, "G"), (23.5, "G"), (24.0, "G"), (24.28, "G")):
            bass.add(bass_note(ROOT[c], 0.4), t, 0.5)
        bass.add(bass_note(36, 1.8, cutoff=500), 27.0, 0.55)

        # ---- arpeggio through the product tour
        pattern = [0, 2, 1, 3, 2, 0, 3, 1]
        for i, t in enumerate(np.arange(9.0, 18.0, 0.125)):
            tones = [m + 12 for m in VOICING[chord_at(t)]]
            m = tones[pattern[i % 8] % len(tones)]
            g = 0.2 + 0.06 * np.sin(i * 0.7)
            note = pluck(m, 0.3, bright=3800, tau=0.07)
            arp.add(note, t, g, pan=-0.35 if i % 2 else 0.35)
            delay_send.add(note, t, g * 0.5)
        # ---- outro sparkle
        for i, t in enumerate(np.arange(27.0, 29.6, 0.25)):
            m = CMAJ_ARP[(i * 3) % len(CMAJ_ARP)] + 12
            g = 0.12 * (1 - (t - 27.0) / 3.0)
            arp.add(bell(m, 0.9, tau=0.28), t, g, pan=0.4 * np.sin(i))
            verb_send.add(bell(m, 0.9, tau=0.28), t, g * 0.8)

    # ---------------------------------------------------------- cue-driven sfx
    for c in cues:
        t, k = c["t"], c["type"]
        n = int(c.get("n", 0))
        g = float(c.get("gain", 1.0))
        d = float(c.get("dur", 0.4))
        if k == "ping":
            p = c.get("pitch", 0)
            s = fx_ping(84 + [0, 3, 5, 7, 10][p % 5], 91 + [0, 3, 5, 7, 10][p % 5])
            sfx.add(s, t, 0.16 * g, pan=np.sin(t * 7) * 0.7)
            verb_send.add(s, t, 0.08 * g)
        elif k in ("hit", "glitch"):
            sfx.add(fx_glitch(0.15, n), t, 0.22)
            sfx.add(kick(f0=120, f1=45, tau_a=0.12, click=0.6), t, 0.3 if k == "hit" else 0.22)
        elif k == "scratch":
            sfx.add(fx_whoosh(0.18, 5000, 900, rev=True), t, 0.35)
        elif k == "riser":
            sfx.add(fx_riser(d), t, 0.3)
        elif k == "suck":
            sfx.add(fx_suck(d), t, 0.5)
            verb_send.add(fx_suck(d), t, 0.2)
        elif k == "impact":
            s = fx_impact(bool(c.get("big", 0)))
            sfx.add(s, t, 0.9)
            verb_send.add(s, t, 0.3)
        elif k == "pluck":
            m = CMAJ_ARP[n % 9] + 12 if t > 26 else PENTA[n % 8]
            s = mixdown((bell(m, 0.8, ratio=2.0, index=1.2, tau=0.22), 0.7), (pluck(m, 0.4, tau=0.1), 0.4))
            sfx.add(s, t, 0.3, pan=(n / 8 - 0.5) * 0.9)
            verb_send.add(s, t, 0.12)
            delay_send.add(s, t, 0.08)
        elif k == "click":
            sfx.add(fx_click(), t, 0.45)
        elif k == "swish":
            sfx.add(fx_whoosh(0.3, 1400, 6500), t - 0.05, 0.22 * g)
        elif k == "whoosh":
            s = fx_whoosh(d, 220, 2600)
            sfx.add(s, t, 0.42 * g, pan=0.5 if c.get("dir", 0) else -0.5)
            verb_send.add(s, t, 0.1 * g)
        elif k == "whoosh_rev":
            sfx.add(fx_whoosh(d, 200, 3200, rev=True), t, 0.35)
        elif k == "blip":
            s = pluck(PENTA[n % 8] + 12, 0.25, bright=4500, tau=0.05)
            sfx.add(s, t, 0.2 * g, pan=np.sin(n * 1.7) * 0.5)
        elif k == "pop":
            sfx.add(fx_pop(560 + 70 * n), t, 0.35)
        elif k == "coin":
            s = np.concatenate([bell(88 + (n % 3) * 2, 0.08, tau=0.05), bell(93 + (n % 3) * 2, 0.6, tau=0.18)])
            sfx.add(s, t, 0.13, pan=np.sin(n * 2.1) * 0.5)
            verb_send.add(s, t, 0.06)
        elif k == "portal":
            sfx.add(fx_whoosh(d + 0.1, 150, 4500, rev=True), t, 0.6)
            sfx.add(fx_riser(d), t, 0.35)
            sfx.add(fx_impact(False), t + d, 0.45)
        elif k == "tick":
            sfx.add(fx_tick(), t, 0.18 * g)
        elif k == "confirm":
            s = np.concatenate([bell(84, 0.07, tau=0.05), bell(91, 0.5, tau=0.14)])
            sfx.add(s, t, 0.13 * g)
            verb_send.add(s, t, 0.05)
        elif k == "notify":
            s = np.concatenate([bell(91, 0.1, index=1.0, tau=0.07), bell(96, 0.7, index=1.0, tau=0.2)])
            sfx.add(s, t, 0.14)
            verb_send.add(s, t, 0.07)
        elif k == "flap":
            sfx.add(fx_flap(), t, 0.3, pan=(n - 2) * 0.2)
        elif k == "type":
            sfx.add(fx_type(d), t, 0.18)
        elif k == "lock":
            sfx.add(fx_lock(), t, 0.5)
        elif k == "ripple":
            for j in range(8):
                sfx.add(pluck(PENTA[j] + 12, 0.2, tau=0.04), t + j * d / 8, 0.1, pan=(j / 7 - 0.5))
        elif k == "sparkle":
            r = np.random.default_rng(5)
            for j in range(9):
                s = bell(PENTA[r.integers(0, 8)] + 12, 0.5, tau=0.12)
                sfx.add(s, t + r.uniform(0, d), 0.07, pan=r.uniform(-0.8, 0.8))
        elif k == "select":
            sfx.add(fade(osc_sine(np.linspace(660, 990, ns(0.09)), 0.09) * np.exp(-tt(ns(0.09)) / 0.05)), t, 0.2)
        elif k == "alert":
            sfx.add(fx_alert(), t, 0.16)
        elif k == "scan":
            sfx.add(fx_scan(d), t, 0.22)
        elif k == "stamp":
            s = fx_stamp()
            sfx.add(s, t, 0.8)
            verb_send.add(s, t, 0.25)
        elif k == "rise":
            sfx.add(fx_rise(d), t, 0.12)
        elif k == "shimmer":
            r = np.random.default_rng(9)
            for j in range(14):
                s = bell(PENTA[r.integers(0, 8)] + 24, 0.6, tau=0.15)
                sfx.add(s, t + j * d / 14, 0.05, pan=r.uniform(-0.9, 0.9))
                verb_send.add(s, t + j * d / 14, 0.05)
        elif k == "beep":
            sfx.add(fx_beep([76, 79, 81, 83, 84, 88][n % 6]), t, 0.24)
        elif k == "stab":
            voic = [[55, 59, 62], [59, 62, 67], [62, 67, 71], [67, 71, 74], [71, 74, 79]][n % 5]
            s = supersaw(voic, 0.16, cutoff=5200, attack=0.003, release=0.12)
            sfx.add(s, t, 0.5)
            verb_send.add(s, t, 0.18)
        elif k == "chord":
            s = supersaw([43, 55, 59, 62, 67, 71], 0.5, cutoff=4200, attack=0.004, release=0.5)
            sfx.add(s, t, 0.55)
            verb_send.add(s, t, 0.25)

    # ---------------------------------------------------------- sidechain + mix
    tline = tt(N + TAIL)
    duck = np.ones_like(tline)
    for k in kicks:
        i = int(k * SR)
        seg = tline[i : i + ns(0.5)] - k
        duck[i : i + len(seg)] = np.minimum(duck[i : i + len(seg)], 1 - 0.62 * np.exp(-seg / 0.13) * np.clip(seg / 0.004, 0, 1))

    ir_room = make_ir(1.9, 5200)
    ir_hall = make_ir(3.2, 3800, seed=5)
    mix = drums.x * 0.44 + bass.x * duck * 1.8 + pads.x * duck * 0.45 + arp.x * (0.6 + 0.4 * duck) * 2.1 + sfx.x * 0.85
    mix += convolve(verb_send.x + pads.x * 0.06 + arp.x * 0.5, ir_room) * 0.5
    mix += convolve(verb_send.x * 0.6 + sfx.x * 0.08, ir_hall) * 0.3
    mix += convolve(delay_send.x, pingpong()) * 0.7
    mix = hp(mix, 28, 2)
    mix = mix[:, :N]

    # gentle glue: soft saturation + look-ahead peak limiter
    mix = mix / (np.max(np.abs(mix)) + 1e-9)
    mix = limiter(mix * 1.4, thr=0.9)
    # end: short fade so the loop point is clean
    fo = ns(0.35)
    mix[:, -fo:] *= np.linspace(1, 0, fo) ** 2
    return mix / (np.max(np.abs(mix)) + 1e-9) * 0.89


def limiter(x, thr=0.9, release=0.08, look=0.003):
    from scipy.ndimage import minimum_filter1d

    need = np.minimum(1.0, thr / np.maximum(np.max(np.abs(x), axis=0), 1e-9))
    w = ns(look)
    need = minimum_filter1d(need, 2 * w + 1)
    need = np.concatenate([need[w:], np.ones(w)])  # look ahead
    a = np.exp(-1 / (release * SR))
    g = np.empty_like(need)
    cur = 1.0
    for i, v in enumerate(need):
        cur = v if v < cur else a * cur + (1 - a) * v
        g[i] = cur
    g = signal.lfilter([1 - np.exp(-1 / (0.0008 * SR))], [1, -np.exp(-1 / (0.0008 * SR))], g)
    return x * np.minimum(g, need + 0.02)


def write_wav(path, x):
    from scipy.io import wavfile

    wavfile.write(path, SR, (np.clip(x.T, -1, 1) * 32767).astype(np.int16))


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    sfx_only = "--sfx-only" in sys.argv
    out = Path(args[0]) if args else HERE / "soundtrack.wav"
    cues = json.loads((HERE / "cues.json").read_text())
    mix = build(cues, music=not sfx_only)
    write_wav(out, mix)
    print(f"wrote {out} ({mix.shape[1] / SR:.2f}s, {len(cues)} cues{', sfx only' if sfx_only else ''})")
