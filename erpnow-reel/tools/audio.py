"""Procedural soundtrack for the ERPNow reel.

120 BPM, A minor -> C major (Am F C G). A music bed plus sound design that is synced to
build/cues.json, the cue sheet exported from the composition (node tools/render.mjs cues),
so every hit, whoosh, click and chime lands on the frame its animation happens.

Usage: python3 tools/audio.py [out.wav]      (needs numpy + scipy)
Writes a float WAV (peak -1 dBFS); tools/build.sh loudness-normalises it to -14 LUFS.
"""
import json
import os
import sys

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
DUR = 30.0
N = int(SR * DUR)
BPM = 120
BEAT = 60 / BPM
HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, '..', 'build')
RNG = np.random.default_rng(1234)


# ---------------------------------------------------------------- DSP basics
def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def noise(n, seed=None):
    return (np.random.default_rng(seed) if seed is not None else RNG).standard_normal(n)


def _bq(kind, f0, q):
    f0 = min(max(float(f0), 10.0), SR * 0.45)
    w0 = 2 * np.pi * f0 / SR
    c, s = np.cos(w0), np.sin(w0)
    al = s / (2 * q)
    if kind == 'lp':
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
    elif kind == 'hp':
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
    else:  # band-pass, 0 dB peak
        b = [al, 0.0, -al]
    a = [1 + al, -2 * c, 1 - al]
    return np.array(b) / a[0], np.array(a) / a[0]


def filt(x, kind, f0, q=0.707):
    b, a = _bq(kind, f0, q)
    return signal.lfilter(b, a, x)


def sweep(x, kind, f, q=0.707, block=64):
    """Time-varying biquad; f is an array of cutoffs (one per sample)."""
    y = np.empty_like(x)
    zi = np.zeros(2)
    for i in range(0, len(x), block):
        b, a = _bq(kind, f[i], q)
        y[i:i + block], zi = signal.lfilter(b, a, x[i:i + block], zi=zi)
    return y


def saw(freq, n, ph0=0.0):
    f = np.full(n, float(freq)) if np.isscalar(freq) else np.asarray(freq, float)
    dt = f / SR
    ph = (ph0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    t = ph[m] / dt[m]
    y[m] -= t + t - t * t - 1
    m = ph > 1 - dt
    t = (ph[m] - 1) / dt[m]
    y[m] -= t * t + t + t + 1
    return y


def square(freq, n, ph0=0.0):
    return 0.5 * (saw(freq, n, ph0) - saw(freq, n, ph0 + 0.5))


def sine_glide(f, n):
    f = np.full(n, float(f)) if np.isscalar(f) else f
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def fade(x, fin=0.001, fout=0.01):
    x = x.copy()
    a, b = int(fin * SR), int(fout * SR)
    if a:
        x[..., :a] *= np.linspace(0, 1, a)
    if b:
        x[..., -b:] *= np.linspace(1, 0, b)
    return x


def pan2(x, pan=0.0):
    th = (pan + 1) * np.pi / 4
    return np.vstack([x * np.cos(th), x * np.sin(th)]) * np.sqrt(2)


def place(bus, x, t, gain=1.0, pan=0.0):
    if x.ndim == 1:
        x = pan2(x, pan)
    i0 = int(round(t * SR))
    if i0 < 0:
        x, i0 = x[:, -i0:], 0
    n = min(x.shape[1], N - i0)
    if n > 0:
        bus[:, i0:i0 + n] += gain * x[:, :n]


def bus():
    return np.zeros((2, N))


# ---------------------------------------------------------------- harmony
CHORDS = {  # voicing (MIDI) and bass root
    'Am': ([57, 60, 64, 69], 33), 'F': ([57, 60, 65, 69], 29),
    'C': ([55, 60, 64, 67], 36), 'G': ([55, 59, 62, 67], 31),
}
PROG = ['Am', 'Am', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'C', 'F']  # one per 2 s bar


def chord_at(t):
    b = min(int(t // 2), len(PROG) - 1)
    name = PROG[b]
    if t >= 29.0:
        name = 'C'
    return CHORDS[name]


# ---------------------------------------------------------------- drum voices
def kick(big=False):
    n = int((0.62 if big else 0.42) * SR)
    t = tt(n)
    f = 46 + (200 if big else 150) * np.exp(-t / 0.03) + (30 if big else 0) * np.exp(-t / 0.2)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.36 if big else 0.24))
    click = filt(noise(n, 11), 'hp', 3000) * np.exp(-t / 0.0025) * 0.5
    return fade(np.tanh(1.8 * (body + click)) / np.tanh(1.8), 0.0005, 0.02)


def snare(seed=None):
    n = int(0.26 * SR)
    t = tt(n)
    tone = np.sin(2 * np.pi * 190 * t + 1.5 * np.sin(2 * np.pi * 95 * t) * np.exp(-t / 0.02)) * np.exp(-t / 0.06)
    nz = filt(noise(n, seed), 'bp', 3400, 0.6) * np.exp(-t / 0.085)
    return fade(0.45 * tone + 0.95 * nz)


def clap():
    n = int(0.42 * SR)
    t = tt(n)
    base = filt(noise(n, 21), 'bp', 1500, 0.8) + 0.35 * filt(noise(n, 22), 'hp', 5000)
    env = np.zeros(n)
    for k, off in enumerate([0, 0.009, 0.019, 0.028]):
        m = t >= off
        env[m] += np.exp(-(t[m] - off) / (0.005 if k < 3 else 0.12))
    return fade(base * env * 0.8)


def hat(open_=False, seed=0):
    n = int((0.34 if open_ else 0.07) * SR)
    t = tt(n)
    r = np.random.default_rng(seed)
    m = sum(square(f * 1.7, n, r.random()) for f in [205.3, 304.4, 369.6, 522.7, 540.0, 800.0])
    m = filt(filt(m, 'bp', 10000, 0.7), 'hp', 7000)
    nz = filt(noise(n, seed + 100), 'hp', 8000)
    return fade((0.5 * m / 3 + 0.5 * nz) * np.exp(-t / (0.12 if open_ else 0.016)))


# ---------------------------------------------------------------- tonal voices
def bass_note(midi, dur=0.22, bright=1.0):
    f = mtof(midi)
    n = int((dur + 0.06) * SR)
    t = tt(n)
    sub = np.sin(2 * np.pi * f * t)
    s = saw(f, n) + 0.5 * saw(f * 1.006, n, 0.3)
    s = sweep(s, 'lp', 220 + 1500 * bright * np.exp(-t / 0.07), q=1.1)
    env = np.minimum(1, t / 0.004) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.012))
    return fade((0.6 * sub + 0.5 * s) * env)


def pad_chord(midis, dur, att=0.18, rel=0.45, cut=2300, seed=0):
    n = int((dur + rel) * SR)
    t = tt(n)
    r = np.random.default_rng(seed)
    L, R = np.zeros(n), np.zeros(n)
    for m in midis:
        f = mtof(m)
        for k, det in enumerate([-0.13, -0.065, 0.0, 0.065, 0.13]):
            v = saw(f * 2 ** (det / 12), n, r.random())
            th = ((k - 2) / 2 * 0.85 + 1) * np.pi / 4
            L += v * np.cos(th)
            R += v * np.sin(th)
    env = np.minimum(1, t / att) * np.where(t < dur, 1.0, np.exp(-(t - dur) / (rel / 3)))
    out = np.vstack([filt(filt(L, 'lp', cut), 'lp', cut * 1.3), filt(filt(R, 'lp', cut), 'lp', cut * 1.3)])
    return fade(out * env / (len(midis) * 3.5), 0.002, 0.02)


def pluck_note(freq, dur=0.14, bright=1.0):
    n = int((dur + 0.3) * SR)
    t = tt(n)
    s = 0.65 * saw(freq, n) + 0.35 * square(freq * 2, n)
    s = sweep(s, 'lp', 500 + 4500 * bright * np.exp(-t / 0.045), q=0.9)
    return fade(s * np.minimum(1, t / 0.002) * np.exp(-t / 0.11))


def bell(freq, dur=1.0, ratio=3.5, index=2.0, decay=None):
    n = int(dur * SR)
    t = tt(n)
    mod = index * np.exp(-t / 0.2) * np.sin(2 * np.pi * freq * ratio * t)
    y = np.sin(2 * np.pi * freq * t + mod) * np.exp(-t / (decay or dur * 0.3))
    return fade(y * np.minimum(1, t / 0.001))


def fm_pluck(freq, v=1.0):
    n = int(0.9 * SR)
    t = tt(n)
    mod = 1.4 * np.exp(-t / 0.07) * np.sin(2 * np.pi * freq * 2 * t)
    y = np.sin(2 * np.pi * freq * t + mod) * np.exp(-t / 0.32) + 0.25 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t / 0.12)
    return fade(y * np.minimum(1, t / 0.002)) * v


# ---------------------------------------------------------------- sound design
def whoosh(dur=0.45, f0=350, f1=3200, f2=700, q=1.1, seed=None, p0=-0.7, p1=0.7, rumble=0.0):
    n = int(dur * SR)
    t = tt(n)
    p = t / dur
    fc = np.where(p < 0.6, f0 * (f1 / f0) ** (p / 0.6), f1 * (f2 / f1) ** ((p - 0.6) / 0.4))
    y = sweep(noise(n, seed), 'bp', fc, q) * np.sin(np.pi * np.clip(p, 0, 1)) ** 1.6
    if rumble:
        y += rumble * filt(noise(n, (seed or 0) + 5), 'lp', 180) * np.sin(np.pi * p) ** 2 * 3
    pan = p0 + (p1 - p0) * p
    th = (pan + 1) * np.pi / 4
    return np.vstack([y * np.cos(th), y * np.sin(th)]) * np.sqrt(2)


def rise(dur, f0=250, f1=9000, seed=None, curve=2.2):
    n = int(dur * SR)
    t = tt(n)
    p = t / dur
    y = sweep(noise(n, seed), 'bp', f0 * (f1 / f0) ** p, 1.4) * p ** curve
    return fade(y, 0.001, 0.004)


def tick(hi=False, seed=None):
    n = int(0.04 * SR)
    t = tt(n)
    f = 2600 if hi else 1800
    y = filt(noise(n, seed), 'bp', 5200 if hi else 3500, 1.2) * np.exp(-t / 0.002) + 0.6 * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.008)
    return fade(y)


def pop(pitch=1.0):
    n = int(0.12 * SR)
    t = tt(n)
    f = (350 + 650 * np.exp(-t / 0.018)) * pitch
    y = sine_glide(f, n) * np.exp(-t / 0.045) + 0.2 * filt(noise(n, 3), 'hp', 3000) * np.exp(-t / 0.002)
    return fade(y)


def hit(big=False, seed=None):
    n = int(0.5 * SR)
    t = tt(n)
    nz = filt(noise(n, seed), 'bp', 1400, 0.7) * np.exp(-t / (0.09 if big else 0.06))
    tom = sine_glide(80 + 70 * np.exp(-t / 0.05), n) * np.exp(-t / 0.18)
    return fade(0.7 * nz + 0.6 * tom)


def crash(dur=1.6, seed=None):
    n = int(dur * SR)
    t = tt(n)
    y = filt(filt(noise(n, seed), 'hp', 4500), 'lp', 14000) * np.exp(-t / (dur * 0.33))
    return fade(y * np.minimum(1, t / 0.002))


def sub_drop(f0=75, f1=28, dur=1.0):
    n = int(dur * SR)
    t = tt(n)
    f = f1 + (f0 - f1) * np.exp(-t / (dur * 0.35))
    return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (dur * 0.45)))


def chord_notes(t, octave_up=1):
    midis, _ = chord_at(t)
    return [mtof(m + 12 * octave_up) for m in midis]


def render_sfx(c, sfx, send):
    ty, t0 = c['type'], c['t']
    v = c.get('v', 1.0)
    if ty == 'slam':
        big = c.get('big')
        place(sfx, kick(True), t0, 0.55)
        place(sfx, hit(True, int(t0 * 100)), t0, 0.45 if big else 0.35)
        place(send, hit(True, int(t0 * 100)), t0, 0.3)
        if big:
            place(sfx, crash(1.2, int(t0 * 10)), t0, 0.2)
            g = chord_at(t0)[0]
            place(sfx, pad_chord([m + 12 for m in g], 0.25, att=0.003, rel=0.25, cut=4000, seed=5)[0], t0, 0.7, -0.3)
    elif ty in ('boom', 'drop'):
        place(sfx, kick(True), t0, 0.55)
        place(sfx, sub_drop(80, 26, 1.4), t0, 0.5)
        place(sfx, hit(True, 7), t0, 0.4)
        place(sfx, crash(2.2, int(t0)), t0, 0.3)
        place(send, crash(2.2, int(t0)), t0, 0.35)
    elif ty == 'land':
        place(sfx, kick(), t0, 0.5)
        place(sfx, hit(False, 4), t0, 0.35)
        place(sfx, bell(mtof(81), 1.2, 3.0, 1.2), t0, 0.22)
        place(send, bell(mtof(81), 1.2, 3.0, 1.2), t0, 0.25)
    elif ty == 'reverse':
        d = c['end'] - t0
        r = rise(d, 2500, 14000, 12, 3.0) + 0.6 * filt(noise(int(d * SR), 13), 'hp', 6000) * np.linspace(0, 1, int(d * SR)) ** 4
        place(sfx, r, t0, 0.5)
        place(send, r, t0, 0.3)
    elif ty == 'pluck':
        f = c.get('root', 440) * 2 ** (c.get('note', 0) / 12)
        place(sfx, fm_pluck(f, v), t0, 0.32, pan=((c.get('note', 0) % 12) / 6 - 1) * 0.5)
        place(send, fm_pluck(f, v), t0, 0.3)
    elif ty == 'tick':
        place(sfx, tick(bool(c.get('hi')), int(t0 * 1000)), t0, 0.28 * v, pan=(RNG.random() - 0.5) * 0.6)
    elif ty == 'pop':
        place(sfx, pop(c.get('pitch', 1.0)), t0, 0.3 * v)
    elif ty == 'stretch':
        n = int(0.32 * SR)
        t = tt(n)
        y = sine_glide(180 * (700 / 180) ** (t / 0.32) * (1 + 0.04 * np.sin(2 * np.pi * 28 * t)), n) * np.sin(np.pi * t / 0.32) ** 2
        place(sfx, fade(y), t0, 0.14)
    elif ty == 'swoosh':
        place(sfx, whoosh(c.get('dur', 0.36), 600, 4200, 900, 1.3, int(t0 * 10)), t0, 0.26 * v)
    elif ty == 'whoosh':
        up = c.get('up')
        w = whoosh(0.42, 300, 2600, 500, 0.9, int(t0 * 10), 0.8, -0.8, rumble=0.5)
        place(sfx, w, t0 - 0.12, 0.5 * v)
        if up:
            place(sfx, rise(0.3, 400, 3000, 14), t0 - 0.1, 0.15)
    elif ty == 'zoom':
        d = c['end'] - t0
        n = int(d * SR)
        t = tt(n)
        p = t / d
        y = rise(d, 150, 7000, 15, 2.0) + 0.5 * sine_glide(90 * (700 / 90) ** p, n) * p ** 2
        place(sfx, fade(y, 0.01, 0.003), t0, 0.5)
        place(send, fade(y, 0.01, 0.003), t0, 0.2)
    elif ty == 'flip':
        n = int(0.09 * SR)
        t = tt(n)
        y = sweep(noise(n, int(t0 * 100)), 'bp', 1500 * (4000 / 1500) ** (t / 0.09), 1.2) * np.sin(np.pi * t / 0.09)
        place(sfx, fade(y), t0, 0.28 * v, pan=(RNG.random() - 0.5))
    elif ty == 'click':
        for k, (off, f) in enumerate([(0.0, 2400), (0.07, 1900)]):
            n = int(0.03 * SR)
            t = tt(n)
            y = filt(noise(n, k), 'bp', 4200, 1.0) * np.exp(-t / 0.0015) + 0.5 * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.005)
            place(sfx, fade(y), t0 + off - 0.02, 0.5)
    elif ty == 'tap':
        n = int(0.06 * SR)
        t = tt(n)
        y = sine_glide(500 + 400 * np.exp(-t / 0.01), n) * np.exp(-t / 0.02) + 0.3 * filt(noise(n, 9), 'bp', 2500) * np.exp(-t / 0.003)
        place(sfx, fade(y), t0 - 0.01, 0.45)
    elif ty == 'success':
        a, b = sorted(chord_notes(t0, 1))[1:3]
        for k, f in enumerate([a * 2, b * 2]):
            place(sfx, bell(f, 0.9, 2.0, 0.8, 0.22), t0 + k * 0.075, 0.13 * v, pan=-0.2 + 0.4 * k)
            place(send, bell(f, 0.9, 2.0, 0.8, 0.22), t0 + k * 0.075, 0.12 * v)
    elif ty == 'alert':
        for k in range(2):
            n = int(0.09 * SR)
            y = filt(square(988, n), 'lp', 3000) * np.minimum(1, tt(n) / 0.004)
            place(sfx, fade(y, 0.002, 0.02), t0 + k * 0.13, 0.12)
    elif ty == 'coin':
        p = c.get('pitch', 1.0)
        for k, (f, g) in enumerate([(mtof(95) * p, 0.16), (mtof(100) * p, 0.14)]):
            place(sfx, bell(f, 0.8, 2.76, 1.6, 0.18), t0 + k * 0.06, g)
            place(send, bell(f, 0.8, 2.76, 1.6, 0.18), t0 + k * 0.06, 0.12)
        n = int(0.3 * SR)
        place(sfx, filt(noise(n, 31), 'hp', 9000) * np.exp(-tt(n) / 0.06), t0, 0.08)
    elif ty == 'stamp':
        n = int(0.6 * SR)
        t = tt(n)
        thud = sine_glide(45 + 70 * np.exp(-t / 0.04), n) * np.exp(-t / 0.14)
        slap = filt(noise(n, 41), 'bp', 700, 0.8) * np.exp(-t / 0.025) + 0.6 * filt(noise(n, 42), 'lp', 1500) * np.exp(-t / 0.06)
        y = fade(np.tanh(1.5 * (thud + slap)))
        place(sfx, y, t0, 0.6)
        place(send, y, t0, 0.3)
    elif ty == 'iris':
        d = c['end'] - t0 + 0.1
        place(sfx, whoosh(d, 5000, 900, 250, 1.0, 51, 0, 0, rumble=0.6), t0, 0.45)
    elif ty == 'wave':
        d = c.get('dur', 0.5)
        place(sfx, whoosh(d, 800, 6000, 1500, 1.2, int(t0 * 7), -0.6, 0.6), t0, 0.28)
        r = np.random.default_rng(int(t0 * 100))
        pent = [0, 2, 4, 7, 9]
        for k in range(14):
            f = mtof(84 + pent[r.integers(5)] + 12 * r.integers(2))
            place(sfx, pop(f / 700), t0 + r.random() * d, 0.08, pan=r.random() * 1.6 - 0.8)
    elif ty == 'draw':
        d = c['end'] - t0
        n = int(d * SR)
        t = tt(n)
        y = 0.4 * sine_glide(520 * (1100 / 520) ** (t / d), n) * np.sin(np.pi * t / d) + 0.3 * filt(noise(n, 61), 'bp', 6500, 2) * np.sin(np.pi * t / d)
        place(sfx, fade(y), t0, 0.1)
    elif ty == 'notify':
        for k, m in enumerate([79, 84]):
            place(sfx, bell(mtof(m), 1.0, 1.0, 0.6, 0.3), t0 + k * 0.12, 0.15)
            place(send, bell(mtof(m), 1.0, 1.0, 0.6, 0.3), t0 + k * 0.12, 0.14)
    elif ty == 'blinds':
        w = whoosh(0.34, 500, 3500, 800, 1.0, 71, 0.8, -0.8)
        w *= 0.6 + 0.4 * np.sin(2 * np.pi * 36 * tt(w.shape[1]))
        place(sfx, w, t0, 0.5)
    elif ty == 'flap':
        n = int(0.05 * SR)
        t = tt(n)
        f = 2400 * (0.85 + 0.3 * RNG.random())
        y = filt(noise(n), 'bp', f, 1.6) * np.exp(-t / 0.005) + 0.4 * np.sin(2 * np.pi * 160 * t) * np.exp(-t / 0.012)
        place(sfx, fade(y), t0, 0.22 * v, pan=(RNG.random() - 0.5) * 0.8)
    elif ty == 'riser':
        d = c['end'] - t0
        n = int(d * SR)
        t = tt(n)
        p = t / d
        y = rise(d, 300, 9000, 81, 2.4)
        g = sine_glide(mtof(43) * 4 ** p, n)
        g = 0.25 * (g + 0.5 * saw(mtof(43) * 4 ** p * 1.5, n)) * p ** 2
        place(sfx, fade(y + g, 0.01, 0.004), t0, 0.5)
        place(send, fade(y, 0.01, 0.004), t0, 0.25)
    elif ty == 'lock':
        for k, (off, f) in enumerate([(0.0, 3200), (0.045, 1900)]):
            n = int(0.08 * SR)
            t = tt(n)
            y = filt(noise(n, 90 + k), 'bp', f, 2.0) * np.exp(-t / 0.004) + 0.5 * np.sin(2 * np.pi * f * 0.75 * t) * np.exp(-t / 0.02)
            place(sfx, fade(y), t0 + off, 0.4)
        place(sfx, kick() * 0.3, t0 + 0.045, 0.5)
    elif ty == 'shimmer':
        r = np.random.default_rng(3)
        for k in range(9):
            f = mtof([84, 88, 91, 96, 100, 103][r.integers(6)])
            place(sfx, bell(f, 0.8, 3.0, 0.5, 0.2), t0 + k * 0.07, 0.06, pan=r.random() * 1.4 - 0.7)
            place(send, bell(f, 0.8, 3.0, 0.5, 0.2), t0 + k * 0.07, 0.08)
    else:
        print('unknown cue', ty, file=sys.stderr)


# ---------------------------------------------------------------- arrangement
def build_music():
    drums, bass, pad, arp, send = bus(), bus(), bus(), bus(), bus()
    K, KB, SN, CL = kick(), kick(True), snare(3), clap()
    hats_c = [hat(False, s) for s in range(4)]
    hats_o = [hat(True, s) for s in range(2)]
    beats = np.arange(0, DUR, BEAT)
    groove = lambda tb: (4.0 <= tb < 24.0) or (26.0 <= tb < 29.0)

    # -- intro (0-4): filtered heartbeat, rising 16th hats, rolling bass, snare roll into "IT ALL."
    for tb in [1.0, 1.5, 2.0, 2.5]:
        place(drums, filt(K, 'lp', 700), tb, 0.42)
    for k in range(20):
        tb = 1.0 + k * 0.125
        place(drums, hats_c[k % 4], tb, 0.1 + 0.18 * k / 19, pan=0.25 * (1 if k % 2 else -1))
    roll = [2.5 + x for x in np.cumsum([0.125, 0.125, 0.0625, 0.0625, 0.0625, 0.0625, 0.03125, 0.03125, 0.03125, 0.03125])] + [2.5]
    for k, tb in enumerate(sorted(roll)):
        if tb < 2.99:
            place(drums, SN, tb, 0.12 + 0.3 * (tb - 2.5) / 0.5)
    for k in range(24):
        tb = 0.5 + k * 0.125
        place(bass, bass_note(33 if k % 8 else 45, 0.1, bright=0.25 + 0.75 * k / 23), tb, 0.16 + 0.26 * k / 23)
    place(pad, pad_chord(CHORDS['Am'][0], 3.1, att=1.2, rel=0.3, cut=900, seed=1), 0.35, 0.45)

    # -- groove
    kicks = []
    for tb in beats:
        if groove(tb):
            place(drums, K, tb, 0.85)
            kicks.append(tb)
            place(drums, hats_o[int(tb * 2) % 2], tb + 0.25, 0.12, pan=0.15)
            for s in (0.125, 0.375):
                place(drums, hats_c[int(tb * 8) % 4], tb + s, 0.07, pan=-0.2)
            beat_in_bar = int(round((tb % 2) / BEAT))
            if beat_in_bar in (1, 3):
                place(drums, CL, tb, 0.42)
                place(send, CL, tb, 0.22)
            root = chord_at(tb)[1]
            last = beat_in_bar == 3
            place(bass, bass_note(root + (12 if last else 0), 0.2), tb + 0.25, 0.5)
    kicks += [3.0, 3.5, 4.0, 24.0, 24.5, 25.0, 26.0, 29.0]

    # -- pads: one chord per bar
    for b in range(2, 15):
        t0 = 2.0 * b
        if 24.0 <= t0 < 26.0:
            continue
        name = PROG[b]
        dur = 1.0 if b == 14 else 2.0
        place(pad, pad_chord(CHORDS[name][0], dur, seed=b), t0, 0.9)
    place(pad, pad_chord(CHORDS['C'][0] + [72], 1.0, att=0.01, rel=1.6, cut=3200, seed=15), 29.0, 1.0)
    place(bass, bass_note(36, 0.8), 29.0, 0.6)
    place(drums, KB, 29.0, 0.6)
    place(drums, crash(2.0, 99), 29.0, 0.3)
    place(send, crash(2.0, 99), 29.0, 0.3)

    # -- arp: 16ths over chord tones
    pattern = [0, 1, 2, 3, 2, 1, 2, 3]
    for k, ta in enumerate(np.arange(8.0, 29.0, BEAT / 4)):
        if 22.0 <= ta < 26.0:
            continue
        tones = sorted(chord_at(ta)[0])
        m = tones[pattern[k % 8]] + 12
        place(arp, pluck_note(mtof(m), bright=0.7 + 0.3 * ((k % 4) == 0)), ta, 0.22, pan=0.35 * (1 if k % 2 else -1))
    # dotted-8th ping-pong echo on the arp
    d = int(0.375 * SR)
    echo = np.zeros_like(arp)
    echo[1, d:] += 0.35 * arp[0, :-d]
    echo[0, 2 * d:] += 0.2 * arp[1, :-2 * d]
    arp += echo

    # -- build (25-26): accelerating snare roll, filtered
    t = 25.0
    step = 0.125
    while t < 25.93:
        place(drums, SN, t, 0.12 + 0.35 * (t - 25.0))
        t += step
        if t > 25.5:
            step = 0.0625
        if t > 25.75:
            step = 0.03125

    # -- sidechain pump from every kick / slam
    sc_pad, sc_bass = np.ones(N), np.ones(N)
    for tk in kicks:
        i0 = int(tk * SR)
        n = min(int(0.45 * SR), N - i0)
        if n <= 0:
            continue
        x = tt(n)
        env = np.exp(-x / 0.13) * np.minimum(1, x / 0.006 + 0.3)
        sc_pad[i0:i0 + n] = np.minimum(sc_pad[i0:i0 + n], 1 - 0.65 * env)
        sc_bass[i0:i0 + n] = np.minimum(sc_bass[i0:i0 + n], 1 - 0.5 * env)
    pad *= sc_pad
    arp *= sc_pad
    bass *= sc_bass
    send += 0.3 * pad + 0.35 * arp
    return drums, bass, pad, arp, send


def reverb_ir(rt60=1.5, pre=0.018, seed=7):
    n = int(rt60 * SR)
    t = tt(n)
    env = 10 ** (-3 * t / rt60)
    ir = np.zeros((2, n + int(pre * SR)))
    for ch in range(2):
        x = filt(filt(noise(n, seed + ch) * env, 'lp', 5500), 'hp', 150)
        ir[ch, int(pre * SR):] = x
    return ir / np.sqrt((ir ** 2).sum() / 2)


def rms(x):
    return float(np.sqrt(np.mean(x ** 2)) + 1e-12)


def lufs(x):
    """Integrated loudness, ITU-R BS.1770-4 (48 kHz K-weighting, 400 ms blocks, gated)."""
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    y = signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=1), axis=1)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    z = np.array([np.mean(y[:, i:i + blk] ** 2, axis=1).sum() for i in range(0, y.shape[1] - blk, hop)])
    lk = -0.691 + 10 * np.log10(z + 1e-12)
    z = z[lk > -70]
    rel = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[-0.691 + 10 * np.log10(z) > rel]
    return -0.691 + 10 * np.log10(z.mean())


def limit(x, ceiling_db=-1.0, look=0.004, release=0.06):
    """Look-ahead brickwall limiter on 4x oversampled peaks (approximate true-peak)."""
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    ceil = 10 ** (ceiling_db / 20)
    up = signal.resample_poly(x, 4, 1, axis=1)
    pk = np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)[:x.shape[1]]
    g = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    L = int(look * SR)
    g = minimum_filter1d(g, size=2 * L + 1)
    g = minimum_filter1d(g, size=int(release * SR), origin=-(int(release * SR) // 2) + 1)  # hold
    g = uniform_filter1d(g, size=L)
    g = np.minimum(g, minimum_filter1d(np.minimum(1.0, ceil / np.maximum(pk, 1e-9)), size=2 * L + 1))
    return x * g, float(g.min())


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BUILD, 'soundtrack_raw.wav')
    cues = json.load(open(os.path.join(BUILD, 'cues.json')))
    drums, bass, pad, arp, send = build_music()
    sfx, sfx_send = bus(), bus()
    for c in cues:
        render_sfx(c, sfx, sfx_send)

    # reverb (mono in, stereo out) on the combined send
    ir = reverb_ir()
    wet_in = (send + sfx_send).mean(axis=0)
    wet = np.vstack([signal.fftconvolve(wet_in, ir[ch])[:N] for ch in range(2)])

    stems = {'drums': drums, 'bass': bass, 'pad': pad, 'arp': arp, 'sfx': sfx, 'reverb': wet}
    gains = {'drums': 0.32, 'bass': 0.7, 'pad': 0.8, 'arp': 1.2, 'sfx': 0.45, 'reverb': 0.25}
    for k, v in stems.items():
        print(f'{k:7s} rms {20 * np.log10(rms(v * gains[k])):6.1f} dBFS   peak {20 * np.log10(np.abs(v * gains[k]).max() + 1e-12):6.1f} dBFS')
    mix = sum(stems[k] * gains[k] for k in stems)
    mix = np.vstack([filt(mix[ch], 'hp', 28) for ch in range(2)])
    mix = fade(mix, 0.002, 0.35)
    # master: loudness-normalise to -14 LUFS, true-peak ceiling -1 dBTP (iterate: limiting costs loudness)
    for _ in range(3):
        mix *= 10 ** ((-14.0 - lufs(mix)) / 20)
        mix, gmin = limit(mix)
    print(f'master: {lufs(mix):.2f} LUFS, max gain reduction {20 * np.log10(gmin):.1f} dB, sample peak {20 * np.log10(np.abs(mix).max()):.2f} dBFS')
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    wavfile.write(out, SR, mix.T.astype(np.float32))
    for k, v in stems.items():  # stems for inspection / remixing
        wavfile.write(os.path.join(BUILD, f'stem_{k}.wav'), SR, (v * gains[k]).T.astype(np.float32))
    print('wrote', os.path.normpath(out), f'rms {20 * np.log10(rms(mix)):.1f} dBFS')


if __name__ == '__main__':
    main()
