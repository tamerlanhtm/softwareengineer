#!/usr/bin/env python3
"""Procedural soundtrack + sound design for the PSANow reel.

120 BPM, A minor, 30 s. Every hit is placed on the same timeline as the visuals
(see src/js/scenes/*). Output: 48 kHz / 24-bit stereo WAV.
"""
import sys
import wave

import numpy as np
from scipy import signal

SR = 48000
DUR = 30.0
N = int(SR * DUR)
BEAT = 0.5
BAR = 2.0
RNG = np.random.default_rng(20260929)

OUT = sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav'


# ----------------------------------------------------------------- utilities
def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def ns(d):
    return max(1, int(round(d * SR)))


def tv(d):
    return np.arange(ns(d)) / SR


def noise(d):
    return RNG.standard_normal(ns(d))


def phase(freq, n):
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    return 2 * np.pi * np.cumsum(f) / SR


def sine(freq, d, ph0=0.0):
    return np.sin(phase(freq, ns(d)) + ph0)


def saw(freq, d, ph0=None):
    n = ns(d)
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    dt = f / SR
    ph = (np.cumsum(dt) + (RNG.random() if ph0 is None else ph0)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt[m]
    y[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]
    y[m] -= x * x + x + x + 1
    return y


def square(freq, d):
    ph0 = RNG.random()
    return 0.5 * (saw(freq, d, ph0) - saw(freq, d, (ph0 + 0.5) % 1.0))


def sos_filter(x, kind, f, order=2):
    nyq = SR / 2
    if kind == 'bandpass':
        f = [max(20, f[0]), min(nyq * 0.98, f[1])]
    else:
        f = min(max(20, f), nyq * 0.98)
    sos = signal.butter(order, f, kind, fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=0)


def lp(x, f, order=2):
    return sos_filter(x, 'lowpass', f, order)


def hp(x, f, order=2):
    return sos_filter(x, 'highpass', f, order)


def bp(x, f1, f2, order=2):
    return sos_filter(x, 'bandpass', (f1, f2), order)


def tv_biquad(x, fc, kind='low', q=0.707, block=64):
    """Time-varying RBJ biquad (per-sample cutoff array, processed in blocks)."""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape[:1])
    y = np.zeros_like(x)
    zi = np.zeros(2)
    for i in range(0, len(x), block):
        f = float(np.clip(fc[min(i + block // 2, len(x) - 1)], 20, SR * 0.45))
        w0 = 2 * np.pi * f / SR
        alpha = np.sin(w0) / (2 * q)
        cw = np.cos(w0)
        if kind == 'low':
            b = np.array([(1 - cw) / 2, 1 - cw, (1 - cw) / 2])
        elif kind == 'high':
            b = np.array([(1 + cw) / 2, -(1 + cw), (1 + cw) / 2])
        else:  # band (constant peak gain)
            b = np.array([alpha, 0, -alpha])
        a = np.array([1 + alpha, -2 * cw, 1 - alpha])
        seg, zi = signal.lfilter(b / a[0], a / a[0], x[i:i + block], zi=zi)
        y[i:i + block] = seg
    return y


def expdec(d, tau):
    return np.exp(-tv(d) / tau)


def fade(x, a=0.002, r=0.01):
    n = len(x)
    na, nr = min(n, ns(a)), min(n, ns(r))
    x = x.copy()
    x[:na] *= np.linspace(0, 1, na)
    x[n - nr:] *= np.linspace(1, 0, nr)
    return x


def norm(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


# ----------------------------------------------------------------- buses
BUSES = ['drums', 'bass', 'pad', 'stab', 'arp', 'sfx', 'impact', 'intro']
bus = {k: np.zeros((N, 2)) for k in BUSES}
verb_send = np.zeros((N, 2))
delay_send = np.zeros((N, 2))


def to_stereo(x, pan=0.0):
    if x.ndim == 2:
        return x
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], axis=1) * np.sqrt(2)


def place(name, x, t, gain=1.0, pan=0.0, verb=0.0, delay=0.0):
    x = to_stereo(np.asarray(x, dtype=float), pan) * gain
    i0 = int(round(t * SR))
    s0 = 0
    if i0 < 0:
        s0 = -i0
        i0 = 0
    if i0 >= N or s0 >= len(x):
        return
    n = min(len(x) - s0, N - i0)
    bus[name][i0:i0 + n] += x[s0:s0 + n]
    if verb:
        verb_send[i0:i0 + n] += x[s0:s0 + n] * verb
    if delay:
        delay_send[i0:i0 + n] += x[s0:s0 + n] * delay


def pan_sweep(x, p0, p1):
    th = (np.clip(np.linspace(p0, p1, len(x)), -1, 1) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], axis=1) * np.sqrt(2)


# ----------------------------------------------------------------- instruments
def kick(f0=160.0, f1=46.0, pd=0.035, tau=0.3, click=0.35, d=0.5):
    t = tv(d)
    f = f1 + (f0 - f1) * np.exp(-t / pd)
    body = np.sin(phase(f, len(t))) * np.exp(-t / tau) * np.minimum(1, t / 0.0008)
    ck = hp(noise(0.006), 2500) * expdec(0.006, 0.0012) * click
    body[:len(ck)] += ck
    return fade(np.tanh(2.0 * body) / np.tanh(2.0), 0.0005, 0.02)


def clap():
    y = np.zeros(ns(0.4))
    for off in (0.0, 0.010, 0.020):
        seg = noise(0.012) * expdec(0.012, 0.0035)
        i = ns(off)
        y[i:i + len(seg)] += seg
    i = ns(0.029)
    tail = noise(0.36) * expdec(0.36, 0.075)
    n = min(len(y) - i, len(tail))
    y[i:i + n] += tail[:n]
    y = bp(y, 850, 3200)
    return fade(norm(y), 0.0005, 0.03)


def snare(tau=0.11, tone=190.0):
    t = tv(0.32)
    body = np.sin(phase(tone + 70 * np.exp(-t / 0.018), len(t))) * np.exp(-t / 0.05)
    nz = bp(noise(0.32), 1400, 8000) * np.exp(-t / tau)
    return fade(norm(0.55 * body + nz), 0.0005, 0.03)


def hat(tau=0.028, d=0.14):
    t = tv(d)
    metal = sum(np.sign(np.sin(2 * np.pi * f * t + RNG.random() * 6)) for f in (513, 761, 924, 1307, 1350, 2000))
    x = 0.55 * noise(d) + 0.45 * metal / 6
    x = hp(x, 7200, 4) * np.exp(-t / tau)
    return fade(norm(x), 0.0003, 0.01)


def bass_note(m, d=0.23, sub=0.55, bright=1400.0):
    f = mtof(m)
    t = tv(d)
    x = 0.8 * saw(f, d) + sub * np.sin(phase(f / 2, len(t)))
    fc = 180 + bright * np.exp(-t / 0.07)
    x = tv_biquad(x, fc, 'low', q=1.2)
    env = np.minimum(1, t / 0.003) * np.exp(-t / 0.35)
    return fade(np.tanh(1.6 * x * env), 0.002, 0.03)


def supersaw(ms, d, fc=1600.0, att=0.25, rel=0.5, detune=14.0, voices=5, q=0.8):
    n = ns(d + rel)
    L = np.zeros(n)
    R = np.zeros(n)
    for m in ms:
        f = mtof(m)
        for v in range(voices):
            c = (v - (voices - 1) / 2) / ((voices - 1) / 2) * detune
            y = saw(f * 2 ** (c / 1200), d + rel)
            if v == voices // 2:
                L += y * 0.7
                R += y * 0.7
            elif v % 2:
                L += y
            else:
                R += y
    t = np.arange(n) / SR
    env = np.minimum(1, t / att) * np.where(t < d, 1.0, np.exp(-(t - d) / (rel / 3)))
    fcv = np.broadcast_to(np.asarray(fc, dtype=float), (n,)) if np.ndim(fc) else np.full(n, fc)
    L = tv_biquad(L, fcv, 'low', q)
    R = tv_biquad(R, fcv, 'low', q)
    out = np.stack([L * env, R * env], axis=1)
    return out / (len(ms) * voices * 0.5)


def stab(ms, d=0.2):
    n = ns(d + 0.15)
    t = np.arange(n) / SR
    fc = 600 + 5200 * np.exp(-t / 0.05)
    x = supersaw(ms, d, fc=fc, att=0.003, rel=0.15, detune=18, voices=5, q=1.1)
    env = np.exp(-t / 0.16)[:len(x)]
    return x * env[:, None]


def pluck(m, d=0.3, tau=0.11, bright=5200.0):
    f = mtof(m)
    t = tv(d)
    x = 0.6 * saw(f, d) + 0.5 * square(f, d)
    fc = 600 + bright * np.exp(-t / 0.035)
    x = tv_biquad(x, fc, 'low', q=1.6)
    env = np.minimum(1, t / 0.002) * np.exp(-t / tau)
    return fade(x * env, 0.001, 0.02)


def marimba(m, d=0.7, tau=0.32):
    f = mtof(m)
    t = tv(d)
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t / tau)
         + 0.32 * np.sin(2 * np.pi * 3.99 * f * t) * np.exp(-t / 0.05)
         + 0.1 * np.sin(2 * np.pi * 9.8 * f * t) * np.exp(-t / 0.015))
    y *= np.minimum(1, t / 0.0012)
    return fade(y, 0.0005, 0.05)


def bell(m, d=1.6):
    f = mtof(m)
    t = tv(d)
    parts = [(1.0, 1.0, 1.1), (2.0, 0.45, 0.7), (2.76, 0.35, 0.45), (5.4, 0.2, 0.22), (8.93, 0.12, 0.1)]
    y = sum(a * np.sin(2 * np.pi * f * r * t + RNG.random()) * np.exp(-t / tau) for r, a, tau in parts)
    y *= np.minimum(1, t / 0.001)
    return fade(y / 2.1, 0.0005, 0.08)


def boom(d=2.2, f0=120.0, f1=34.0):
    t = tv(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.11)
    y = np.sin(phase(f, len(t))) * np.exp(-t / 0.6) * np.minimum(1, t / 0.001)
    return fade(np.tanh(2.4 * y), 0.0005, 0.2)


def crash(d=2.6, tau=0.75):
    t = tv(d)
    x = hp(noise(d), 2800, 2)
    ring = sum(np.sin(2 * np.pi * f * t + RNG.random() * 6) for f in (3150, 4230, 5870, 7110, 8930, 10400)) * 0.06
    y = (x * 0.8 + ring) * np.exp(-t / tau) * np.minimum(1, t / 0.0015)
    return fade(lp(y, 13000), 0.0005, 0.3)


def thump(f0=120.0, f1=55.0, tau=0.18, d=0.5):
    t = tv(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.03)
    y = np.sin(phase(f, len(t))) * np.exp(-t / tau)
    y[:ns(0.004)] += lp(noise(0.004), 3000) * 0.6
    return fade(np.tanh(1.6 * y), 0.0005, 0.05)


def whoosh(d=0.45, f0=350.0, fpk=3200.0, f1=700.0, pk=0.62, q=2.2, p0=-0.7, p1=0.7):
    t = tv(d)
    u = t / d
    fc = np.where(u < pk, f0 * (fpk / f0) ** (u / pk), fpk * (f1 / fpk) ** ((u - pk) / (1 - pk)))
    y = tv_biquad(noise(d), fc, 'band', q)
    amp = np.where(u < pk, (u / pk) ** 2.2, (1 - (u - pk) / (1 - pk)) ** 1.6)
    return pan_sweep(norm(y * amp), p0, p1)


def riser(d, f0=300.0, f1=9500.0, tone=True):
    t = tv(d)
    u = t / d
    fc = f0 * (f1 / f0) ** (u ** 1.4)
    nz = tv_biquad(noise(d), fc, 'band', 2.8)
    y = norm(nz) * 0.8
    if tone:
        s = saw(110 * 2 ** (2.5 * u ** 1.3), d) + saw(110.6 * 2 ** (2.5 * u ** 1.3), d)
        y += lp(s, 2600) * 0.18
    return y * u ** 2.3


def suck(d=0.55):
    c = crash(d + 0.2, tau=0.4)[:ns(d)][::-1]
    fc = 400 * (14000 / 400) ** (tv(d) / d) ** 2
    c = tv_biquad(c, fc, 'low', 0.9)
    b = boom(d, 90, 40)[::-1] * 0.6
    y = norm(c) * 0.7 + b
    return fade(y * (tv(d) / d) ** 1.5, 0.01, 0.004)


def glitch(d=0.1, seed=0):
    r = np.random.default_rng(seed)
    n = ns(d)
    hold = int(SR / (1200 + 2500 * r.random()))
    x = r.standard_normal(n // hold + 1).repeat(hold)[:n]
    t = tv(d)
    steps = (t / 0.014).astype(int)
    freqs = 300 + 1500 * r.random(steps.max() + 1)
    sq = np.sign(np.sin(phase(freqs[steps], n)))
    gate = ((t / 0.011).astype(int) % 3 != 1).astype(float)
    y = (0.5 * x + 0.5 * sq) * gate * np.exp(-t / (d * 0.6))
    return fade(bp(y, 400, 7000), 0.0005, 0.005)


def tick(f=3000.0, tau=0.006, d=0.04, click=0.3):
    t = tv(d)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / tau)
    y[:ns(0.002)] += hp(noise(0.002), 3000) * click
    return fade(y, 0.0002, 0.005)


def pop(f0=260.0, f1=980.0, d=0.14):
    t = tv(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.018)
    y = np.sin(phase(f, len(t))) * np.exp(-t / 0.045) * np.minimum(1, t / 0.001)
    return fade(y, 0.0005, 0.01)


def mouse_click():
    y = np.zeros(ns(0.12))
    for off, g in ((0.0, 1.0), (0.072, 0.6)):
        c = bp(noise(0.006), 2500, 6500) * expdec(0.006, 0.0012) * g
        i = ns(off)
        y[i:i + len(c)] += c
    return y


def stamp(d=0.5):
    y = thump(100, 48, 0.12, d) * 0.9
    y[:ns(0.06)] += lp(noise(0.06), 1800) * expdec(0.06, 0.012) * 0.6
    return y


def flip_tick():
    return fade(bp(noise(0.03), 1600, 5200) * expdec(0.03, 0.006), 0.0003, 0.005)


def digi_chatter(d, seed=3):
    r = np.random.default_rng(seed)
    y = np.zeros(ns(d))
    tt = 0.0
    while tt < d - 0.03:
        c = tick(900 + r.random() * 2600, 0.004, 0.02, 0.1) * (0.5 + 0.5 * r.random())
        i = ns(tt)
        y[i:i + len(c)] += c[:len(y) - i]
        tt += 0.022 + r.random() * 0.02
    return y


# ----------------------------------------------------------------- harmony
AM, FMAJ, CMAJ, GMAJ = [57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]
ROOT = {'Am': 45, 'F': 41, 'C': 48, 'G': 43}
CH = {'Am': AM, 'F': FMAJ, 'C': CMAJ, 'G': GMAJ}
# chord per half-bar (1 s) slot, index = int(t)
PROG = ['Am', 'Am', 'Am', 'Am',  # 0-4 intro
        'Am', 'Am', 'F', 'F', 'C', 'C', 'G', 'G',  # 4-12
        'Am', 'Am', 'F', 'F', 'C', 'C', 'G', 'G',  # 12-20
        'Am', 'Am', 'F', 'G',  # 20-24
        'Am', 'Am', 'F', 'F', 'C', 'C']  # 24-30


def chord_at(t):
    return PROG[min(int(t), len(PROG) - 1)]


def in_ranges(t, ranges):
    return any(a <= t < b for a, b in ranges)


GROOVE = [(4.0, 19.0), (24.0, 28.0)]
KICK_R = [(4.0, 19.0), (22.0, 23.96), (24.0, 28.0)]
CLAP_R = [(4.0, 19.0), (24.0, 28.0)]

# ----------------------------------------------------------------- INTRO 0-4
drone_d = 4.0
t = tv(drone_d)
dr = saw(mtof(33), drone_d) + saw(mtof(33) * 1.005, drone_d) + 0.6 * saw(mtof(40), drone_d)
dr = tv_biquad(dr, 220 + 900 * (t / drone_d) ** 2, 'low', 1.4)
dr *= np.minimum(1, t / 0.5) * (0.5 + 0.5 * (t / drone_d))
place('intro', fade(dr, 0.05, 0.02) * 0.28, 0.0)
for b in range(8):  # muffled heartbeat kick
    tb = b * BEAT
    place('intro', lp(kick(tau=0.25), 380) * (0.55 + 0.05 * b), tb)
for i in range(32):  # clock ticks: 8ths, then 16ths from 2.0
    tt = i * 0.125
    if tt < 2.0 and i % 2:
        continue
    place('intro', tick(2600 if (i // 2) % 2 else 1900, 0.004, 0.03, 0.4), tt, 0.1 + 0.08 * (tt / 4), pan=0.25 if i % 4 < 2 else -0.25)
for tt in (0.0, 0.42, 0.95):  # headline words
    place('sfx', whoosh(0.28, 900, 5200, 2500, 0.35, 1.6, -0.2, 0.2)[:, :] * 0.35, tt - 0.05)
place('sfx', riser(0.28, 1500, 7000, tone=False) * 0.25, 1.17)  # selection drag
for k, ts in enumerate((1.5, 2.0, 2.5, 3.0)):  # pain stamps
    place('impact', stamp() * (0.75 + 0.07 * k), ts, verb=0.25)
    place('sfx', glitch(0.1 + 0.02 * k, seed=k + 1) * 0.35, ts + 0.005, pan=(-0.4, 0.4, -0.3, 0.3)[k])
    place('sfx', lp(noise(0.05), 5000) * expdec(0.05, 0.01) * 0.25, ts)
place('sfx', riser(1.95, 250, 9000) * 0.55, 2.0, verb=0.15)
roll_t = 3.0
while roll_t < 3.93:
    u = (roll_t - 3.0) / 0.95
    place('drums', snare(0.07) * (0.1 + 0.25 * u), roll_t, pan=0.1 * np.sin(roll_t * 20), verb=0.12)
    roll_t += 0.125 if u < 0.5 else 0.0625 if u < 0.8 else 0.03125
place('sfx', suck(0.52) * 0.8, 3.95 - 0.52, verb=0.1)
place('sfx', pop(400, 1400, 0.12) * 0.35, 3.62)

# ----------------------------------------------------------------- DRUMS / GROOVE
kick_times = []
for b in range(int(DUR / BEAT)):
    tb = b * BEAT
    if in_ranges(tb, KICK_R):
        kick_times.append(tb)
        place('drums', kick(), tb, 0.5)
    if in_ranges(tb, CLAP_R) and b % 4 in (1, 3):
        place('drums', clap(), tb, 0.3, verb=0.22)
    # offbeat hats
    off = tb + 0.25
    if in_ranges(off, GROOVE + [(21.0, 23.96)]):
        place('drums', hat(0.03), off, 0.14, pan=0.2)
    # 16th shaker energy in the second half / finale
    if in_ranges(tb, [(12.0, 19.0), (19.0, 22.0), (24.0, 28.0)]):
        for s in (0.125, 0.375):
            place('drums', hat(0.012, 0.05), tb + s, 0.06 if 19.0 <= tb < 22.0 else 0.065, pan=-0.35)
    if in_ranges(tb, [(24.0, 28.0)]) and b % 2 == 1:
        place('drums', hat(0.16, 0.3), off, 0.08, pan=0.3)
# build: extra kicks, 8ths then 16ths, into the "Now." drop
for tt in list(np.arange(23.25, 23.5, 0.5)) + list(np.arange(23.5, 23.9, 0.125)):
    if abs(tt / BEAT - round(tt / BEAT)) > 1e-6:
        place('drums', kick(tau=0.18), float(tt), 0.3 + 0.2 * (tt - 23.0))
        kick_times.append(float(tt))
roll_t = 22.0
while roll_t < 23.93:
    u = (roll_t - 22.0) / 1.95
    place('drums', snare(0.08, 200 + 120 * u), roll_t, 0.08 + 0.27 * u ** 1.5, pan=0.12 * np.sin(roll_t * 17), verb=0.15)
    roll_t += 0.25 if u < 0.5 else 0.125 if u < 0.76 else 0.0625 if u < 0.9 else 0.03125
# final hit at 28
place('drums', kick(tau=0.5), 28.0, 0.6)
kick_times.append(28.0)

# ----------------------------------------------------------------- BASS
for b in range(int(DUR / BEAT)):
    tb = b * BEAT
    off = tb + 0.25
    if in_ranges(off, GROOVE + [(22.0, 23.96)]):
        c = chord_at(off)
        m = ROOT[c]
        if in_ranges(off, [(12.0, 19.0), (24.0, 28.0)]) and b % 4 == 3:
            m += 12
        place('bass', bass_note(m), off, 0.55, pan=0.0)
# breakdown: long notes
def bass_sustain(m, d, fc=420.0):
    f = mtof(m)
    x = 0.7 * saw(f, d) + 0.8 * np.sin(phase(f / 2, ns(d)))
    x = lp(x, fc, 2)
    t = tv(d)
    env = np.minimum(1, t / 0.04) * np.minimum(1, (d - t) / 0.25)
    return np.tanh(1.3 * x * env)


for t0, c, d in ((19.0, 'G', 1.0), (20.0, 'Am', 2.0)):
    place('bass', bass_sustain(ROOT[c], d), t0, 0.45)
for tb in (20.0, 21.0, 21.5):
    place('drums', lp(kick(tau=0.25), 900), tb, 0.3)
    kick_times.append(tb)
place('sfx', suck(0.8) * 0.5, 22.0 - 0.8, verb=0.2)
# final sustained root
place('bass', bass_note(ROOT['C'], 2.0, sub=1.0, bright=300), 28.0, 0.55)

# ----------------------------------------------------------------- PAD + STABS
for s in range(4, 30):
    c = chord_at(s)
    voicing = CH[c] + [CH[c][0] + 12, CH[c][1] + 12]
    if s >= 28:
        voicing = [48, 55, 60, 62, 64, 67, 72]  # C add9 resolve
        pad = supersaw(voicing, 2.0 if s == 28 else 0.01, fc=2200, att=0.02, rel=1.6, detune=16)
        if s == 28:
            place('pad', pad, 28.0, 1.1, verb=0.45)
        continue
    brk = 19 <= s < 22
    fc = 1500 if not brk else 900 + 400 * (s - 19)
    if 22 <= s < 24:
        fc = 1100 + (s - 22) * 900
    pad = supersaw(voicing, 1.0, fc=fc, att=0.08, rel=0.4, detune=14)
    place('pad', pad, float(s), 0.95 if brk else 0.6, verb=0.35)
stab_times = []
for bar in range(15):
    t0 = bar * BAR
    for off in (0.0, 0.75):
        ts = t0 + off
        if in_ranges(ts, GROOVE) and ts >= 4.0:
            c = chord_at(ts)
            place('stab', stab([n + 12 for n in CH[c]] + [CH[c][0] + 24]), ts, 0.75, verb=0.25, delay=0.15)
            stab_times.append(ts)

# ----------------------------------------------------------------- ARP
ARP_R = [(6.0, 19.0), (19.0, 22.0), (24.0, 28.0)]
step = 0
tt = 6.0
while tt < 28.0:
    if in_ranges(tt, ARP_R):
        c = CH[chord_at(tt)]
        pattern = [c[0] + 12, c[1] + 12, c[2] + 12, c[0] + 24, c[2] + 12, c[1] + 12, c[0] + 24, c[1] + 24]
        m = pattern[step % len(pattern)]
        g = 0.3 if tt < 12 else 0.36
        if 19.0 <= tt < 22.0:
            g = 0.46
        place('arp', pluck(m, 0.28, 0.1), tt, g * (1.0 if step % 4 == 0 else 0.75), pan=0.35 * np.sin(step * 0.7), delay=0.35, verb=0.18)
    step += 1
    tt = 6.0 + step * 0.125

# ----------------------------------------------------------------- IMPACTS
def big_hit(t0, g=1.0, crash_g=0.5):
    place('impact', boom(), t0, 0.95 * g)
    place('impact', crash(), t0, crash_g * g, verb=0.3)
    place('impact', clap(), t0, 0.45 * g, verb=0.4)
    place('impact', thump(140, 60, 0.2), t0, 0.5 * g)


big_hit(4.0, 1.0)
big_hit(24.0, 1.1, 0.6)
big_hit(12.06, 0.55, 0.35)
place('impact', crash(), 28.0, 0.45, verb=0.4)
place('impact', boom(2.0, 90, 32), 28.0, 0.6)
for tw in (22.0, 22.5, 23.0):  # closing words
    place('impact', thump(130, 58, 0.16), tw, 0.55, verb=0.2)
    place('sfx', whoosh(0.3, 600, 4200, 1500, 0.3, 1.8, 0.8, -0.2), tw - 0.06, 0.35)
place('sfx', riser(1.9, 280, 10000) * 0.6, 22.05, verb=0.2)

# ----------------------------------------------------------------- SFX: LOGO
place('sfx', pop(220, 900, 0.16), 4.34, 0.6, verb=0.2)
for i in range(6):
    place('sfx', tick(1800 + i * 260, 0.005, 0.03, 0.2), 4.4 + i * 0.045, 0.22, pan=-0.3 + i * 0.12)
place('sfx', digi_chatter(0.44, 5), 4.78, 0.35)
place('sfx', whoosh(0.62, 200, 5000, 9000, 0.9, 2.0, -0.3, 0.3), 5.4, 0.65, verb=0.15)
place('sfx', riser(0.55, 400, 7000, tone=False), 5.43, 0.35)
place('impact', thump(150, 70, 0.14), 6.0, 0.5)

# ----------------------------------------------------------------- SFX: JOURNEY
ASC = [69, 72, 74, 76, 79, 81]  # A4 C5 D5 E5 G5 A5
for i, t0 in enumerate((6.0, 7.0, 8.0, 9.0, 10.0, 11.0)):
    place('sfx', whoosh(0.3, 500, 4200, 1200, 0.45, 1.8, -0.5, 0.5), t0 - 0.14, 0.35)
    place('sfx', marimba(ASC[i] + 12, 0.6, 0.25), t0, 0.22, verb=0.25, delay=0.2)
place('sfx', whoosh(0.32, 700, 3000, 900, 0.5, 2.5, -0.4, 0.5), 6.44, 0.3)  # deal drag
place('sfx', bell(88, 1.2), 6.72, 0.13, verb=0.3)  # won
for i, t0 in enumerate((7.02, 7.09, 7.23, 7.3)):
    place('sfx', pop(300 + i * 90, 900 + i * 180, 0.1), t0, 0.16, pan=-0.3 + i * 0.2)
place('sfx', whoosh(0.26, 800, 3500, 1200, 0.5, 2.5, 0.2, -0.2), 8.48, 0.28)  # chip move
place('sfx', tick(2200, 0.01, 0.05, 0.5), 8.74, 0.4)
for i in range(15):
    place('sfx', tick(2500 + (i % 3) * 400, 0.004, 0.03, 0.5), 9.08 + i * 0.03, 0.14, pan=-0.3 + (i % 5) * 0.15)
place('sfx', bell(84, 1.0), 9.56, 0.11, verb=0.3)
place('sfx', bell(91, 1.0), 9.64, 0.09, verb=0.3)
place('impact', stamp(), 10.52, 0.8, verb=0.25)
place('sfx', glitch(0.05, 9) * 0.3, 10.53)
for i in range(6):
    place('sfx', pop(250 + i * 70, 700 + i * 160, 0.09), 11.02 + i * 0.05, 0.13, pan=-0.4 + i * 0.16)
for k in range(2):
    place('sfx', tick(1760, 0.03, 0.08, 0.1), 11.5 + k * 0.1, 0.18)
# fill into 12
for k, tt in enumerate(np.arange(11.5, 11.98, 0.0625)):
    place('drums', snare(0.06), tt, 0.07 + 0.03 * k, pan=0.15 * ((-1) ** k))
place('sfx', whoosh(0.34, 300, 5200, 800, 0.7, 2.0, 0.0, 0.0), 11.78, 0.45)

# ----------------------------------------------------------------- SFX: MODULES
for i in range(45):  # counter landings: rising blips
    tl = 12.07 + i * 0.02 + 0.56
    place('sfx', tick(700 + 1900 * (i / 44) ** 1.2, 0.005, 0.03, 0.15), tl, 0.12, pan=0.3 * np.sin(i))
place('sfx', bell(93, 1.2), 13.52, 0.12, verb=0.3)
place('sfx', digi_chatter(0.4, 7), 13.75, 0.25)
PENT = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91]
for r in range(10):
    place('sfx', marimba(PENT[r], 0.7), 14.25 + r * 0.25, 0.26, pan=-0.5 + r * 0.11, verb=0.2, delay=0.15)
place('sfx', riser(0.9, 300, 8000) * 0.4, 16.08)
for d in range(18):  # flip flutter
    place('sfx', flip_tick(), 17.0 + d * 0.03 + 0.17, 0.3, pan=-0.6 + d * 0.07)
place('impact', thump(120, 52, 0.2), 17.0, 0.7, verb=0.2)
place('impact', crash(1.6, 0.5), 17.0, 0.22, verb=0.2)
place('impact', stamp(), 17.55, 0.75, verb=0.25)
place('sfx', bell(88, 1.4), 17.6, 0.12, verb=0.35)
place('sfx', whoosh(0.34, 300, 6000, 1800, 0.75, 1.6, 0.0, 0.0), 18.8, 0.6)

# ----------------------------------------------------------------- SFX: TRUST
place('impact', thump(140, 65, 0.12), 19.02, 0.45)
for i in range(6):
    place('sfx', tick(1318.5, 0.018, 0.06, 0.05), 19.28 + i * 0.075, 0.2, pan=-0.3 + i * 0.12)
place('sfx', bell(88, 1.0), 19.84, 0.12, verb=0.3)
place('sfx', bell(93, 1.0), 19.92, 0.1, verb=0.3)
for t0 in (20.0, 21.0):
    place('sfx', whoosh(0.4, 400, 4200, 900, 0.55, 1.8, 0.8, -0.3), t0 - 0.12, 0.4)
for k in range(6):
    place('sfx', tick(2100, 0.006, 0.04, 0.3), 20.2 + k * 0.28 + 0.2, 0.14, pan=0.35)
for k in range(5):
    place('sfx', tick(2800, 0.005, 0.03, 0.3), 21.3 + k * 0.14, 0.13, pan=-0.2)
place('sfx', whoosh(0.3, 500, 5000, 1500, 0.6, 1.8, -0.2, -0.9), 21.86, 0.35)

# ----------------------------------------------------------------- SFX: LOCKUP
place('sfx', whoosh(0.45, 1500, 9000, 4000, 0.8, 1.2, -0.3, 0.3), 24.4, 0.4, verb=0.2)
LAND = [69, 72, 76, 79, 81, 84, 88, 91, 93]  # Am7 arpeggio as the squares land
for k in range(9):
    place('sfx', marimba(LAND[k], 0.8, 0.35), 24.96 + k * 0.05 + 0.3, 0.2, pan=-0.4 + (k % 3) * 0.4, verb=0.25)
    place('sfx', thump(160, 90, 0.05, 0.12), 24.96 + k * 0.05 + 0.3, 0.12)
place('sfx', pop(240, 1000, 0.16), 25.62, 0.5, verb=0.25)
place('sfx', digi_chatter(0.5, 11), 25.45, 0.22)
place('sfx', pop(180, 760, 0.18), 25.92, 0.5, verb=0.2)
place('sfx', whoosh(0.3, 800, 5000, 2000, 0.5, 1.6, -0.2, 0.2), 26.24, 0.25)
place('sfx', mouse_click(), 27.28, 0.7)
for k in range(7):
    place('sfx', bell(84 + (0, 3, 7, 10, 12, 15, 19)[k], 0.8), 27.34 + k * 0.035, 0.05, pan=-0.5 + k * 0.16, verb=0.4)
place('sfx', pop(120, 400, 0.4) * 0.6, 28.4, verb=0.4)
for k in range(8):
    place('sfx', bell(96 + (0, 2, 4, 7, 9, 12, 14, 16)[k], 0.9), 28.8 + k * 0.05, 0.035, pan=-0.6 + k * 0.17, verb=0.5)

# ----------------------------------------------------------------- FX RETURNS
def make_ir(rt60=1.9, d=2.6, pre=0.015, damp=5200):
    n = ns(d)
    t = np.arange(n) / SR
    dec = np.exp(-6.91 * t / rt60)
    irs = []
    for ch in range(2):
        x = RNG.standard_normal(n) * dec
        xl = lp(x, damp)
        w = np.exp(-t / 0.25)
        x = x * w + xl * (1 - w)
        for k in range(6):  # early reflections
            i = ns(0.007 + 0.011 * k + 0.003 * ch)
            x[i] += (0.6 - 0.08 * k) * (1 if (k + ch) % 2 else -1)
        x = np.concatenate([np.zeros(ns(pre)), x])
        irs.append(x / np.sqrt(np.sum(x ** 2)))
    return irs


def ping_pong(x, d=0.375, fb=0.38, taps=6):
    y = np.zeros_like(x)
    mono = x.mean(axis=1)
    for k in range(1, taps + 1):
        i = ns(d * k)
        seg = lp(mono[:N - i], 5500 - 500 * k) * fb ** k
        y[i:, k % 2] += seg
    return y


irL, irR = make_ir()
verb = np.stack([signal.fftconvolve(verb_send[:, 0], irL)[:N], signal.fftconvolve(verb_send[:, 1], irR)[:N]], axis=1)
delay = ping_pong(delay_send)

# ----------------------------------------------------------------- MIX
t_all = np.arange(N) / SR
sc = np.ones(N)
for tk in kick_times:
    i = ns(tk)
    L = min(N - i, ns(0.45))
    e = 1 - 0.55 * np.exp(-np.arange(L) / SR / 0.11)
    sc[i:i + L] = np.minimum(sc[i:i + L], e)
sc = signal.lfilter([1 - np.exp(-1 / (0.004 * SR))], [1, -np.exp(-1 / (0.004 * SR))], sc)
sc2 = sc[:, None]

drums = np.tanh(1.2 * bus['drums']) / np.tanh(1.2)
mix = (
    0.8 * drums
    + 0.9 * bus['bass'] * sc2
    + 0.8 * bus['pad'] * sc2
    + 0.75 * bus['stab'] * sc2
    + 0.7 * bus['arp'] * sc2
    + 0.85 * bus['sfx']
    + 0.8 * bus['impact']
    + 0.3 * bus['intro']
    + 0.32 * verb
    + 0.28 * delay * sc2
)
# a breath of silence right before each drop (the drop itself starts on the beat)
gap = np.ones(N)
for g0 in (3.93, 23.93):
    i0, i1, i2 = ns(g0), ns(g0 + 0.02), ns(g0 + 0.07)
    gap[i0:i1] = np.linspace(1, 0, i1 - i0)
    gap[i1:i2] = 0.0
mix *= gap[:, None]
mix = hp(mix, 28, 2)
mix *= 0.72
# gentle master glue: slow RMS compressor
a_rms = np.exp(-1 / (0.05 * SR))
rms = np.sqrt(signal.lfilter([1 - a_rms], [1, -a_rms], np.mean(mix ** 2, axis=1)) + 1e-12)
thr = 0.25
gain = np.where(rms > thr, (thr / rms) ** (1 - 1 / 2.2), 1.0)
mix *= gain[:, None]
# look-ahead limiter
peak = np.max(np.abs(mix), axis=1)
ceil = 0.89
g = np.minimum(1.0, ceil / np.maximum(peak, 1e-9))
from scipy.ndimage import minimum_filter1d
la = ns(0.004)
g = minimum_filter1d(g, size=2 * la + 1)
rel = np.exp(-1 / (0.08 * SR))
g_s = signal.lfilter([1 - rel], [1, -rel], g)
g = np.minimum(g, g_s)
mix = mix * g[:, None]
mix = np.clip(mix, -0.98, 0.98)
# fade out the very end
fo = ns(0.6)
mix[-fo:] *= np.linspace(1, 0, fo)[:, None]

pcm = (np.clip(mix, -1, 1) * 8388607).astype(np.int32)
raw = np.frombuffer(pcm.astype('<i4').tobytes(), dtype=np.uint8).reshape(-1, 4)[:, :3].tobytes()
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(3)
    w.setframerate(SR)
    w.writeframes(raw)
print('wrote', OUT, 'peak', float(np.max(np.abs(mix))))
