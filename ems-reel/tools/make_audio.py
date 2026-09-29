#!/usr/bin/env python3
"""Procedural soundtrack + sound design for the EMSNow reel.

Reads build/cues.json (exported from the composition's timeline) and writes a
48 kHz stereo WAV. The music is an original 120 BPM track in A minor with the
drop on 3.0 s; every visual hit (splits, stamps, clicks, whips, dings …) gets
a synthesized sound placed on the exact frame it happens.

    python3 tools/make_audio.py build/cues.json build/music.wav [--no-music]
"""
import json
import sys
from functools import lru_cache

import numpy as np
from scipy import signal

SR = 48000
DUR = 30.0
N = int(SR * DUR)
RNG = np.random.default_rng(2026)

# ----------------------------------------------------------------- helpers

def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def buf(n=N):
    return np.zeros((2, n), dtype=np.float64)


def place(dst, src, t, gain=1.0, pan=0.0):
    """Mix mono/stereo src into dst at time t with constant-power pan."""
    i = int(round(t * SR))
    if src.ndim == 1:
        l = np.cos((pan + 1) * np.pi / 4)
        r = np.sin((pan + 1) * np.pi / 4)
        src = np.stack([src * l * 1.4142, src * r * 1.4142])
    if i >= dst.shape[1]:
        return
    j0 = max(0, -i)
    i = max(0, i)
    n = min(src.shape[1] - j0, dst.shape[1] - i)
    if n > 0:
        dst[:, i:i + n] += src[:, j0:j0 + n] * gain


def env_exp(n, decay):
    return np.exp(-np.arange(n) / SR * decay)


def adsr(n, a=0.005, d=0.1, s=0.7, r=0.1, hold=None):
    t = np.arange(n) / SR
    hold = (n / SR - r) if hold is None else hold
    e = np.where(t < a, t / max(a, 1e-6), 1.0)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / max(d, 1e-6), e)
    e = np.where((t >= a + d) & (t < hold), s, e)
    rel = np.clip(1 - (t - hold) / max(r, 1e-6), 0, 1) * s
    e = np.where(t >= hold, rel, e)
    return e


def noise(n):
    return RNG.standard_normal(n)


def sos(kind, f, order=2, q=None):
    nyq = SR / 2
    if kind == 'bp':
        lo, hi = f
        return signal.butter(order, [max(lo, 10) / nyq, min(hi, nyq * 0.98) / nyq], btype='band', output='sos')
    return signal.butter(order, min(f, nyq * 0.98) / nyq, btype=kind, output='sos')


def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x)


def sweep_filter(x, kind, f0, f1, order=2, block=256, curve='exp'):
    """Time-varying Butterworth filter (block-wise coefficient updates)."""
    y = np.zeros_like(x)
    nb = int(np.ceil(len(x) / block))
    zi = None
    for b in range(nb):
        p = b / max(1, nb - 1)
        if curve == 'exp':
            f = f0 * (f1 / f0) ** p
        else:
            f = f0 + (f1 - f0) * p
        s = sos(kind, f, order) if kind != 'bp' else sos('bp', (f * 0.7, f * 1.4), order)
        if zi is None or zi.shape[0] != s.shape[0]:
            zi = np.zeros((s.shape[0], 2))
        seg = x[b * block:(b + 1) * block]
        out, zi = signal.sosfilt(s, seg, zi=zi)
        y[b * block:b * block + len(seg)] = out
    return y


@lru_cache(maxsize=64)
def saw_table(harm):
    L = 4096
    ph = np.arange(L) / L
    t = np.zeros(L)
    for k in range(1, harm + 1):
        t += np.sin(2 * np.pi * k * ph) / k
    return t * (2 / np.pi)


def saw(freq, n, phase=0.0):
    """Band-limited saw via wavetable (harmonics kept under ~18 kHz)."""
    harm = int(max(1, min(80, 18000 // max(freq, 1))))
    tab = saw_table(harm)
    ph = (phase + np.arange(n) * freq / SR) % 1.0
    return tab[(ph * 4096).astype(np.int64) % 4096]


def sine(freq, n, phase=0.0):
    return np.sin(2 * np.pi * (phase + np.cumsum(np.full(n, freq) / SR)))


def sine_sweep(f0, f1, n, decay=None):
    if decay is None:
        f = f0 * (f1 / f0) ** (np.arange(n) / max(1, n - 1))
    else:
        f = f1 + (f0 - f1) * np.exp(-np.arange(n) / SR * decay)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def reverb_ir(seconds=2.4, predelay=0.012, bright=6500):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    irs = []
    for ch in range(2):
        e = noise(n) * np.exp(-t * (6.9 / seconds))
        e = filt(e, 'low', bright, 1)
        # early reflections
        for k in range(6):
            d = int((0.007 + 0.011 * k + 0.004 * ch) * SR)
            if d < n:
                e[d] += 0.5 * (0.7 ** k) * (1 if (k + ch) % 2 else -1)
        e = np.concatenate([np.zeros(int(predelay * SR)), e])
        irs.append(e / np.sqrt(np.sum(e ** 2)))
    return irs


# ----------------------------------------------------------------- instruments

def kick(level=1.0, tight=False):
    n = int(0.5 * SR)
    body = sine_sweep(150, 44, n, decay=26) * env_exp(n, 8.5 if not tight else 13)
    click = filt(noise(int(0.004 * SR)), 'high', 2000) * 0.5
    body[:len(click)] += click
    return np.tanh(body * 1.6) * 0.95 * level


def clap(level=1.0):
    n = int(0.35 * SR)
    x = np.zeros(n)
    for k, d in enumerate([0, 0.009, 0.018, 0.027]):
        i = int(d * SR)
        m = int(0.012 * SR) if k < 3 else n - i
        seg = noise(m) * env_exp(m, 22 if k < 3 else 16)
        x[i:i + m] += seg[: n - i]
    x = filt(x, 'bp', (900, 2600))
    return x * 1.6 * level


def snare(level=1.0):
    n = int(0.3 * SR)
    tone = sine_sweep(260, 180, n, decay=40) * env_exp(n, 25) * 0.5
    nz = filt(noise(n), 'bp', (1500, 9000)) * env_exp(n, 18)
    return (tone + nz * 0.9) * level


def hat(open_=False, level=1.0):
    n = int((0.22 if open_ else 0.05) * SR)
    x = filt(noise(n), 'high', 7200, 2) * env_exp(n, 14 if open_ else 70)
    return x * 0.5 * level


def supersaw(freq, n, voices=5, spread=0.14, seed=0):
    r = np.random.default_rng(seed)
    out = np.zeros((2, n))
    for v in range(voices):
        det = (v - (voices - 1) / 2) / ((voices - 1) / 2 or 1) * spread  # semitone offset
        f = freq * 2 ** (det / 12)
        pan = (v / max(1, voices - 1)) * 2 - 1
        s = saw(f, n, r.random())
        out[0] += s * np.cos((pan * 0.8 + 1) * np.pi / 4)
        out[1] += s * np.sin((pan * 0.8 + 1) * np.pi / 4)
    return out / voices


def pluck(freq, dur=0.35, bright=1.0, level=1.0):
    n = int(dur * SR)
    x = saw(freq, n, RNG.random()) * 0.7 + saw(freq * 2.003, n, RNG.random()) * 0.25
    # decaying low-pass: approximate with two static filters crossfaded
    hi = filt(x, 'low', min(9000, freq * 10 * bright))
    lo = filt(x, 'low', min(2500, freq * 2.5))
    k = env_exp(n, 14)
    y = hi * k + lo * (1 - k)
    return y * env_exp(n, 7) * adsr(n, 0.002, 0.05, 1, 0.03) * level


def bell(freq, dur=1.6, level=1.0, ratio=3.5, index=2.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    idx = index * np.exp(-t * 5)
    mod = np.sin(2 * np.pi * freq * ratio * t) * idx
    car = np.sin(2 * np.pi * freq * t + mod)
    car += 0.3 * np.sin(2 * np.pi * freq * 2.01 * t) * np.exp(-t * 6)
    return car * np.exp(-t * (3.2 / dur * 1.6)) * adsr(n, 0.002, 0.02, 1, 0.05) * 0.5 * level


def pop(freq=700, level=1.0):
    n = int(0.09 * SR)
    x = sine_sweep(freq * 1.9, freq, n, decay=60) * env_exp(n, 38)
    return x * level


def tick(level=1.0, freq=3200):
    n = int(0.018 * SR)
    x = sine(freq, n) * env_exp(n, 260) + filt(noise(n), 'high', 5000) * env_exp(n, 400) * 0.4
    return x * level


def whoosh(dur=0.5, level=1.0, up=True, lo=300, hi=6000):
    n = int(dur * SR)
    x = noise(n)
    f0, f1 = (lo, hi) if up else (hi, lo)
    y = sweep_filter(x, 'bp', f0, f1, 2)
    t = np.linspace(0, 1, n)
    shape = np.sin(np.pi * np.clip(t, 0, 1)) ** 1.5
    if up:
        shape = t ** 2.2 * (1 - np.clip((t - 0.92) / 0.08, 0, 1))
    return y * shape * level * 1.4


def swish(dur=0.35, level=1.0):
    n = int(dur * SR)
    y = sweep_filter(noise(n), 'bp', 5000, 700, 2)
    t = np.linspace(0, 1, n)
    return y * np.sin(np.pi * t) ** 1.2 * level * 1.6


def riser(dur, level=1.0):
    n = int(dur * SR)
    t = np.linspace(0, 1, n)
    nz = sweep_filter(noise(n), 'bp', 400, 9000, 2) * 1.2
    tone = supersaw(110, n, voices=3, spread=0.25, seed=3)
    f = 110 * 2 ** (t * 2)
    ph = np.cumsum(f) / SR
    tone = (np.sin(2 * np.pi * ph) + 0.4 * np.sin(4 * np.pi * ph)) * 0.35
    y = (nz + tone) * t ** 2.4
    return y * level


def impact(level=1.0, big=True):
    n = int((2.6 if big else 1.6) * SR)
    t = np.arange(n) / SR
    sub = sine_sweep(95, 32, n, decay=5.5) * np.exp(-t * (2.2 if big else 3.5))
    crack = filt(noise(n), 'low', 4000) * np.exp(-t * 9) * 0.9
    air = filt(noise(n), 'high', 3000) * np.exp(-t * 3.2) * 0.25
    y = np.tanh((sub * 1.3 + crack + air) * 1.2)
    return y * level


def thud(level=1.0):
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    y = sine_sweep(120, 45, n, decay=18) * np.exp(-t * 11) + filt(noise(n), 'low', 900) * np.exp(-t * 30) * 0.6
    return y * level


def glitch(level=1.0, seed=0):
    r = np.random.default_rng(seed)
    n = int(0.16 * SR)
    y = np.zeros(n)
    i = 0
    while i < n:
        m = int(r.integers(120, 900))
        f = r.choice([220, 440, 880, 1760, 3520])
        seg = np.sign(np.sin(2 * np.pi * f * np.arange(m) / SR)) * r.uniform(0.2, 0.6)
        if r.random() < 0.4:
            seg = r.standard_normal(m) * 0.4
        y[i:i + m] = seg[: n - i]
        i += m
    return filt(y, 'bp', (300, 7000)) * env_exp(n, 12) * level


def shatter(level=1.0):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    y = filt(noise(n), 'high', 2500) * np.exp(-t * 7) * 0.7
    for k in range(14):
        f = RNG.uniform(2500, 7500)
        d = int(RNG.uniform(0, 0.25) * SR)
        m = int(0.25 * SR)
        s = np.sin(2 * np.pi * f * np.arange(m) / SR) * np.exp(-np.arange(m) / SR * RNG.uniform(14, 30)) * 0.25
        y[d:d + m] += s[: n - d]
    return y * level


# ----------------------------------------------------------------- score

BPM = 120
BEAT = 60 / BPM
DROP = 3.0
CHORDS = [  # (start, end, name, notes, bass midi)
    (0.0, 3.0, 'Am', [57, 60, 64], 33),
    (3.0, 5.0, 'Am', [57, 60, 64, 69], 45), (5.0, 7.0, 'F', [53, 57, 60, 65], 41),
    (7.0, 9.0, 'C', [55, 60, 64, 67], 36), (9.0, 11.0, 'G', [55, 59, 62, 67], 43),
    (11.0, 13.0, 'Am', [57, 60, 64, 69], 45), (13.0, 15.0, 'F', [53, 57, 60, 65], 41),
    (15.0, 17.0, 'C', [55, 60, 64, 67], 36), (17.0, 19.0, 'G', [55, 59, 62, 67], 43),
    (19.0, 21.0, 'Am', [57, 60, 64, 69], 45), (21.0, 22.5, 'F', [53, 57, 60, 65], 41),
    (22.5, 23.75, 'G', [55, 59, 62, 67], 43), (23.75, 25.0, 'E', [52, 56, 59, 64], 40),
    (25.0, 26.7, 'Am', [57, 60, 64, 69], 45), (26.7, 27.85, 'F', [53, 57, 60, 65, 67], 41),
    (27.85, 30.0, 'C', [55, 60, 64, 67, 71], 36),
]
PENTA = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84]  # A minor pentatonic


def chord_at(t):
    for c in CHORDS:
        if c[0] <= t < c[1]:
            return c
    return CHORDS[-1]


def build_music(cues):
    drums = buf()
    bass = buf()
    keys = buf()
    lead = buf()
    send = buf()  # reverb send

    kicks = []
    # ---- intro (0–3): the groove plays "behind a wall" — low-passed, opening
    # up as the hook builds, so the drop at 3.0 lands with full weight
    intro = buf()
    place(intro, kick(0.9), 0.0)
    t = 0.0
    while t < DROP - 1e-9:
        beat = int(round(t / BEAT))
        place(intro, kick(0.95, tight=True), t)
        if beat % 2 == 1:
            place(intro, clap(0.35), t)
        place(intro, hat(True, 0.3), t + BEAT / 2)
        for k in range(4):
            if k != 2:
                place(intro, hat(False, 0.2), t + k * BEAT / 4)
        t += BEAT
    n3 = int(DROP * SR)
    for ch in range(2):
        intro[ch, :n3] = sweep_filter(intro[ch, :n3], 'low', 260, 2400, 2)
    intro[:, n3:] = 0
    drums += intro * 0.9
    n = int(3.0 * SR)
    drone = (saw(mtof(33), n) * 0.6 + saw(mtof(45) * 1.004, n) * 0.4)
    drone = sweep_filter(drone, 'low', 120, 900, 2)
    drone *= np.linspace(0.35, 1.0, n) ** 1.5 * adsr(n, 0.02, 0.1, 1, 0.08)
    place(bass, drone * 0.5, 0.0)

    # ---- main groove from the drop to the end card
    groove_end = 28.0
    t = DROP
    while t < groove_end - 1e-9:
        beat = int(round((t - DROP) / BEAT))
        in_blitz = 21.0 <= t < 22.5
        in_break = 22.5 <= t < 25.0
        in_build = 24.0 <= t < 25.0
        if in_build:
            t += BEAT
            continue
        # kick (four on the floor)
        place(drums, kick(0.85 if not in_break else 0.7), t)
        kicks.append(t)
        # clap on 2 & 4
        if beat % 2 == 1 and not in_blitz:
            c = clap(0.4)
            place(drums, c, t)
            place(send, c * 0.5, t)
        # hats
        place(drums, hat(True, 0.34), t + BEAT / 2, pan=0.2)
        for k in range(4):
            if k != 2:
                place(drums, hat(False, 0.22 if k % 2 else 0.14), t + k * BEAT / 4, pan=-0.25 if k % 2 else 0.25)
        t += BEAT

    # snare-roll build into the finale (24.0–25.0), 16ths then 32nds
    t = 24.0
    k = 0
    while t < 25.0 - 1e-9:
        p = (t - 24.0) / 1.0
        sn = snare(0.18 + 0.55 * p ** 1.6)
        place(drums, sn, t, pan=np.sin(k) * 0.2)
        place(send, sn * 0.3, t)
        t += BEAT / 4 if p < 0.5 else BEAT / 8
        k += 1

    # blitz: snare hits on every word (from cues)
    for c in cues:
        if c['type'] == 'blitz':
            s = snare(0.75 + 0.05 * c.get('n', 0))
            place(drums, s, c['t'], pan=((c.get('n', 0) % 3) - 1) * 0.25)
            place(send, s * 0.4, c['t'])

    # sidechain envelope from kicks
    sc = np.ones(N)
    tt = np.arange(N) / SR
    for k in kicks:
        if k < DROP - 0.01:
            continue
        i = int(k * SR)
        m = int(0.42 * SR)
        seg = 1 - 0.78 * np.exp(-np.arange(min(m, N - i)) / SR / 0.085)
        sc[i:i + len(seg)] = np.minimum(sc[i:i + len(seg)], seg)

    # ---- bass: 8th-note pulses on the chord root (from the drop)
    for (a, b, name, notes, root) in CHORDS[1:]:
        t = a
        while t < min(b, groove_end + 1.5) - 1e-9:
            dur = BEAT / 2
            f = mtof(root)
            m = int(dur * SR)
            x = saw(f, m) * 0.55 + sine(f / 2, m) * 0.7 + saw(f * 1.005, m) * 0.3
            x = filt(x, 'low', 520 if t < 25 else 700)
            x *= adsr(m, 0.004, 0.08, 0.75, 0.04)
            place(bass, x * 0.42, t)
            t += dur
    # sub hit + long bass under the final chord
    m = int(2.2 * SR)
    tail = (sine(mtof(36), m) * 0.8 + filt(saw(mtof(48), m), 'low', 400) * 0.4) * env_exp(m, 1.6)
    place(bass, tail * 0.6, 27.85)

    # ---- pads (supersaw chords), sidechained
    pad = buf()
    for i, (a, b, name, notes, root) in enumerate(CHORDS):
        if a < DROP:
            continue
        n = int((b - a + 0.35) * SR)
        x = np.zeros((2, n))
        for j, m in enumerate(notes):
            x += supersaw(mtof(m), n, voices=5, spread=0.16, seed=i * 10 + j)
        x = np.stack([filt(x[0], 'low', 2600 if a < 25 else 3400, 2), filt(x[1], 'low', 2600 if a < 25 else 3400, 2)])
        x *= adsr(n, 0.03, 0.2, 0.8, 0.35, hold=(b - a))
        place(pad, x * (0.3 if a < 25 else 0.34), a)
    pad *= sc
    keys += pad
    send += pad * 0.35

    # ---- 16th pluck arpeggio from bar 2 (5.0) to the end card
    pattern = [0, 1, 2, 3, 2, 1, 3, 2]
    t = 5.0
    k = 0
    while t < 29.6:
        if not (21.0 <= t < 22.5 or 24.0 <= t < 25.0):
            c = chord_at(t)
            notes = c[3]
            m = notes[pattern[k % len(pattern)] % len(notes)] + 12
            fade = 1.0 if t < 27.85 else max(0.0, 1 - (t - 27.85) / 1.8)
            p = pluck(mtof(m), 0.28, bright=0.8 + 0.4 * ((k % 4) == 0), level=(0.32 if t < 11 else 0.38) * fade)
            pan = np.sin(k * 0.9) * 0.5
            place(keys, p, t, pan=pan)
            place(send, p * 0.5, t, pan=pan)
        t += BEAT / 4
        k += 1

    # ---- lead motif over the features (11–21)
    rhythm = [(0, 0.5), (0.5, 0.25), (0.75, 0.25), (1.0, 0.75), (1.75, 0.25)]
    # diatonic re-voicing of the same motif over each chord (A minor / C major)
    motifs = {'Am': [76, 74, 72, 69, 72], 'F': [77, 76, 72, 69, 72], 'C': [76, 74, 72, 67, 72], 'G': [74, 72, 71, 67, 71]}
    for bar_start in [11.0, 13.0, 15.0, 17.0, 19.0]:
        c = chord_at(bar_start)
        notes_m = motifs.get(c[2], motifs['Am'])
        for (o, d), m in zip(rhythm, notes_m):
            n = int((d + 0.25) * SR)
            f = mtof(m)
            x = supersaw(f, n, voices=3, spread=0.08, seed=int(m))
            x = np.stack([filt(x[0], 'low', 4200), filt(x[1], 'low', 4200)])
            x *= adsr(n, 0.01, 0.1, 0.7, 0.18, hold=d)
            place(lead, x * 0.5, bar_start + o)
            place(send, x * 0.22, bar_start + o)

    # ---- intro stabs + final bells
    for c in cues:
        if c['type'] == 'stab':
            ch = [[57, 60, 64], [55, 60, 64], [56, 59, 64]][c.get('n', 0) % 3]
            n = int(0.5 * SR)
            x = np.zeros((2, n))
            for j, m in enumerate(ch):
                x += supersaw(mtof(m + 12), n, voices=5, spread=0.2, seed=40 + j)
            x = np.stack([filt(x[0], 'low', 3800), filt(x[1], 'low', 3800)]) * env_exp(n, 7)
            place(keys, x * 0.3, c['t'])
            place(send, x * 0.25, c['t'])
            place(drums, kick(0.6, tight=True), c['t'])
    return drums, bass, keys, lead, send, sc


def build_sfx(cues):
    fx = buf()
    send = buf()

    def put(x, t, g=1.0, pan=0.0, rv=0.2):
        place(fx, x, t, g, pan)
        if rv:
            place(send, x, t, g * rv, pan)

    for c in cues:
        t = c['t']
        ty = c['type']
        n = c.get('n', 0)
        soft = c.get('soft', False)
        if ty == 'impact':
            big = c.get('big', True)
            put(impact(1.0, big), t, 0.95 if big else 0.7, rv=0.35)
            put(filt(noise(int(1.2 * SR)), 'high', 6000) * env_exp(int(1.2 * SR), 3) * 0.3, t, 0.6, rv=0.4)
        elif ty == 'suck':
            d = c.get('dur', 0.5)
            x = whoosh(d + 0.05, 1.0, up=True, lo=200, hi=9000)
            put(x, t, 0.55, rv=0.3)
            put(riser(d + 0.05), t, 0.35, rv=0.2)
        elif ty == 'stab':
            put(glitch(0.8, seed=n), t, 0.45, pan=(n - 1) * 0.3, rv=0.1)
        elif ty == 'swish':
            put(swish(0.35), t, 0.5, pan=c.get('pan', 0), rv=0.15)
        elif ty == 'paper':
            for k in range(4):
                put(swish(0.22) * 0.8, t + k * 0.06, 0.35, pan=(-1) ** k * 0.4, rv=0.05)
        elif ty == 'pops':
            for k in range(c.get('n', 6)):
                f = mtof(PENTA[(k * 2) % len(PENTA)] + 12)
                put(pop(f * 0.5), t + k * c.get('spacing', 0.04), 0.3 if soft else 0.42, pan=np.sin(k * 1.7) * 0.6, rv=0.1)
        elif ty == 'split':
            put(pop(420 if n == 0 else 560, 1.0), t, 0.5, rv=0.15)
            put(swish(0.25), t, 0.35, pan=0, rv=0.1)
        elif ty == 'punch':
            put(thud(0.9), t, 0.6, rv=0.2)
            put(bell(mtof(81), 1.2, 0.8), t + 0.02, 0.35, rv=0.4)
        elif ty in ('whoosh',):
            d = c.get('dur', 0.45)
            put(whoosh(d, 1.0, up=False, lo=250, hi=5000) if not soft else swish(d), t, 0.45 if not soft else 0.3, pan=c.get('pan', 0), rv=0.15)
        elif ty == 'type':
            for k in range(c.get('n', 5)):
                put(tick(0.8, 2600 + k * 120), t + k * c.get('spacing', 0.04), 0.35, pan=(k - 2) * 0.12, rv=0.05)
        elif ty == 'rise':
            put(swish(0.3), t, 0.25 if soft else 0.35, rv=0.1)
        elif ty == 'thump':
            put(thud(0.8), t, 0.35 if soft else 0.55, rv=0.15)
        elif ty == 'zoom':
            d = c.get('dur', 0.6)
            put(whoosh(d + 0.1, 1.0, up=True, lo=150, hi=8000), t, 0.7, rv=0.3)
            put(riser(d + 0.05), t, 0.3, rv=0.2)
        elif ty == 'burst':
            put(impact(0.6, big=False), t, 0.45, rv=0.25)
            put(shatter(0.6), t, 0.3, rv=0.2)
        elif ty == 'count':
            d = c.get('dur', 1.0)
            k = 0
            steps = c.get('n', 36)
            e = lambda p: 1 - (1 - p) ** 2
            for s in range(steps):
                tt = t + d * (1 - np.sqrt(1 - s / steps)) if not soft else t + d * s / steps
                put(tick(0.6, 2200 + s * 25), tt, 0.16 if soft else 0.22, pan=np.sin(s) * 0.3, rv=0)
        elif ty == 'flipwave':
            for k in range(c.get('n', 11)):
                ch = chord_at(t + k * 0.05)[3]
                m = sorted(ch)[k % len(ch)] + 12 * (1 + k // len(ch))
                put(pluck(mtof(m), 0.3, 1.2, 1.0), t + k * c.get('spacing', 0.045), 0.3, pan=(k / 10 - 0.5) * 1.2, rv=0.35)
        elif ty == 'shimmer':
            for k in range(8):
                put(bell(mtof(PENTA[4 + k % 6] + 12), 0.8, 0.5), t + k * 0.05, 0.12, pan=(k / 7 - 0.5), rv=0.6)
        elif ty == 'hollow':
            for k in range(c.get('n', 14)):
                put(pop(300 - k * 6, 0.8), t + k * c.get('spacing', 0.02), 0.2, pan=np.sin(k) * 0.4, rv=0.1)
        elif ty == 'snaps':
            for k in range(c.get('n', 14)):
                m = PENTA[k % len(PENTA)] + 12
                put(pluck(mtof(m), 0.2, 1.3, 1.0), t + k * c.get('spacing', 0.03), 0.28, pan=np.sin(k * 1.3) * 0.5, rv=0.3)
                put(tick(0.5, 4000), t + k * c.get('spacing', 0.03), 0.18, rv=0)
        elif ty == 'expand':
            put(swish(0.3), t - 0.2, 0.3, rv=0.1)
        elif ty == 'ticks':
            for k in range(c.get('n', 8)):
                put(tick(0.6, 3000 + (k % 3) * 300), t + k * c.get('spacing', 0.04), 0.22, pan=np.sin(k * 2.1) * 0.5, rv=0.05)
        elif ty == 'error':
            for k, f in enumerate([mtof(77), mtof(74)]):
                m = int(0.09 * SR)
                x = np.sign(np.sin(2 * np.pi * f * np.arange(m) / SR)) * env_exp(m, 20)
                put(filt(x, 'low', 3500) * 0.5, t + k * 0.1, 0.28, rv=0.1)
        elif ty == 'success':
            for k, m in enumerate([76, 81]):
                put(bell(mtof(m), 0.9, 0.8), t + k * 0.08, 0.2 if soft else 0.28, rv=0.35)
        elif ty == 'typing':
            for k in range(c.get('n', 6)):
                for j in range(3):
                    put(tick(0.7, 1800 + j * 400), t + k * c.get('spacing', 0.1) + j * 0.03, 0.2, pan=(j - 1) * 0.2, rv=0)
        elif ty == 'stamps':
            for k in range(c.get('n', 6)):
                put(thud(0.6), t + k * c.get('spacing', 0.06), 0.28, pan=(k / 5 - 0.5) * 0.6, rv=0.1)
                put(tick(0.6, 3600), t + k * c.get('spacing', 0.06), 0.2, rv=0)
        elif ty == 'ringfill':
            d = c.get('dur', 0.6)
            put(whoosh(d, 1.0, up=True, lo=600, hi=4000) * 0.6, t, 0.25, rv=0.2)
        elif ty == 'click':
            put(tick(1.0, 1800), t, 0.55 if c.get('big') else 0.42, rv=0.05)
            put(pop(900, 0.8), t, 0.25, rv=0.05)
        elif ty == 'stamp':
            put(thud(1.0), t, 0.8, rv=0.25)
            put(impact(0.5, big=False), t, 0.35, rv=0.2)
        elif ty == 'receipt':
            put(swish(0.25), t, 0.25, rv=0.1)
            for k in range(3):
                put(tick(0.5, 2400), t + 0.04 * k, 0.15, rv=0)
        elif ty == 'ding':
            m = PENTA[4 + n] + 12
            put(bell(mtof(m), 1.0, 1.0, ratio=2.0, index=1.2), t, 0.26, pan=(n / 4 - 0.5) * 0.6, rv=0.4)
        elif ty == 'whip':
            put(whoosh(0.45, 1.0, up=False, lo=300, hi=7000), t, 0.6, pan=0.5 * c.get('dir', 1) * (0 if c.get('vertical') else 1), rv=0.1)
        elif ty == 'flip':
            put(swish(0.3), t, 0.45, rv=0.1)
            put(pop(300, 0.8), t + 0.24, 0.3, rv=0.1)
        elif ty == 'zoomin':
            put(whoosh(0.4, 1.0, up=True, lo=300, hi=9000), t, 0.5, rv=0.2)
        elif ty == 'shatter':
            put(shatter(1.0), t + 0.1, 0.45, rv=0.25)
        elif ty == 'blitz':
            put(thud(0.6), t, 0.25, rv=0.05)
        elif ty == 'flipword':
            put(swish(0.18), t, 0.3, pan=(n - 1.5) * 0.3, rv=0.1)
            put(pluck(mtof([69, 72, 76, 81][n % 4]), 0.25, 1.2), t, 0.25, rv=0.3)
        elif ty == 'pop':
            m = PENTA[(n * 2) % len(PENTA)] + 12
            put(pop(mtof(m) * 0.5, 1.0), t, 0.25 if soft else 0.4, pan=np.sin(n * 1.9) * 0.5, rv=0.15)
        elif ty == 'thud':
            put(thud(1.0), t, 0.55, rv=0.2)
        elif ty == 'morph':
            put(whoosh(0.6, 1.0, up=False, lo=400, hi=6000), t, 0.4, rv=0.3)
        elif ty == 'sparkle':
            for k in range(6):
                put(bell(mtof(PENTA[6 + k % 5] + 12), 0.9, 0.6), t + k * 0.035, 0.12, pan=(k / 5 - 0.5), rv=0.6)
        elif ty == 'logo':
            for k in range(c.get('n', 9)):
                m = [69, 72, 76, 79, 81, 84, 88, 91, 93][k % 9]
                put(pluck(mtof(m), 0.3, 1.2), t + k * c.get('spacing', 0.04), 0.22, pan=(k / 8 - 0.5), rv=0.35)
        elif ty == 'chime':
            for k, m in enumerate([72, 76, 79, 84]):
                put(bell(mtof(m), 2.2, 1.0, ratio=3.01, index=1.6), t + k * 0.06, 0.24, pan=(k / 3 - 0.5) * 0.5, rv=0.55)
    return fx, send


def comp(x, thresh=0.5, ratio=3.0, attack=0.005, release=0.12):
    """Simple stereo-linked feed-forward compressor (block envelope)."""
    level = np.max(np.abs(x), axis=0)
    blk = 64
    nb = len(level) // blk + 1
    pk = np.array([level[i * blk:(i + 1) * blk].max() if i * blk < len(level) else 0 for i in range(nb)])
    env = np.zeros(nb)
    a = np.exp(-blk / SR / attack)
    r = np.exp(-blk / SR / release)
    e = 0.0
    for i in range(nb):
        c = a if pk[i] > e else r
        e = c * e + (1 - c) * pk[i]
        env[i] = e
    gain = np.ones(nb)
    over = env > thresh
    gain[over] = (thresh + (env[over] - thresh) / ratio) / env[over]
    g = np.repeat(gain, blk)[: x.shape[1]]
    return x * g


TARGET_LUFS = -14.0


def lufs(x):
    """BS.1770-4 integrated loudness (48 kHz K-weighting, gated)."""
    b1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]
    a1 = [1.0, -1.69065929318241, 0.73248077421585]
    b2 = [1.0, -2.0, 1.0]
    a2 = [1.0, -1.99004745483398, 0.99007225036621]
    y = signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=1), axis=1)
    blk = int(0.4 * SR)
    hop = int(0.1 * SR)
    zs = np.array([np.sum(np.mean(y[:, i:i + blk] ** 2, axis=1)) for i in range(0, y.shape[1] - blk, hop)])
    ls = -0.691 + 10 * np.log10(zs + 1e-15)
    zs = zs[ls > -70]
    rel = -0.691 + 10 * np.log10(np.mean(zs)) - 10
    zs2 = zs[(-0.691 + 10 * np.log10(zs + 1e-15)) > rel]
    return -0.691 + 10 * np.log10(np.mean(zs2))


def limit(x, ceiling=0.80, look=0.004, release=0.09):
    """Look-ahead peak limiter (instant-by-anticipation attack, smooth release)."""
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    pk = np.max(np.abs(x), axis=0)
    g = np.minimum(1.0, ceiling / np.maximum(pk, 1e-9))
    w = int(look * SR)
    g = minimum_filter1d(g, size=2 * w + 1, mode='nearest')
    g = uniform_filter1d(g, size=w, mode='nearest')
    a = np.exp(-1 / (release * SR))
    # release smoothing, block-vectorised in chunks for speed
    out = np.empty_like(g)
    yv = 1.0
    for i in range(0, len(g), 32):
        seg = g[i:i + 32]
        m = seg.min()
        yv = m if m < yv else a ** 32 * yv + (1 - a ** 32) * m
        out[i:i + 32] = np.minimum(seg, yv) if m < yv else np.minimum(seg, yv)
    return x * np.minimum(out, g)


def main():
    cues_path = sys.argv[1] if len(sys.argv) > 1 else 'build/cues.json'
    out = sys.argv[2] if len(sys.argv) > 2 else 'build/music.wav'
    no_music = '--no-music' in sys.argv
    global TARGET_LUFS
    if '--lufs' in sys.argv:
        TARGET_LUFS = float(sys.argv[sys.argv.index('--lufs') + 1])
    data = json.load(open(cues_path))
    cues = data['cues']

    drums, bass, keys, lead, msend, sc = build_music(cues)
    fx, fsend = build_sfx(cues)

    bass = bass * sc
    ir = reverb_ir(2.4)
    send = msend + fsend
    wet = np.stack([signal.fftconvolve(send[0], ir[0])[:N], signal.fftconvolve(send[1], ir[1])[:N]])

    music = drums * 0.9 + bass * 1.0 + keys * 1.0 + lead * 1.0
    if no_music:
        music = music * 0
        wet = np.stack([signal.fftconvolve(fsend[0], ir[0])[:N], signal.fftconvolve(fsend[1], ir[1])[:N]])
    mix = music + fx * 1.0 + wet * 0.45

    # master: highpass → glue comp → loudness-targeted look-ahead limiter
    mix = np.stack([filt(mix[0], 'high', 28, 2), filt(mix[1], 'high', 28, 2)])
    mix = comp(mix, thresh=0.5 * np.max(np.abs(mix)), ratio=2.0, attack=0.01, release=0.15)
    fade = int(0.35 * SR)
    mix[:, -fade:] *= np.linspace(1, 0, fade) ** 1.5
    mix = mix / np.max(np.abs(mix))
    g = 1.0
    for _ in range(5):
        y = limit(mix * g)
        L = lufs(y)
        g *= 10 ** ((TARGET_LUFS - L) / 20)
    mix = limit(mix * g)
    print(f'integrated loudness {lufs(mix):.1f} LUFS, peak {20 * np.log10(np.max(np.abs(mix))):.2f} dBFS, drive {20 * np.log10(g):.1f} dB')

    from scipy.io import wavfile
    wavfile.write(out, SR, (mix.T * 32767).astype(np.int16))
    print(f'wrote {out}  ({DUR}s, {len(cues)} cues, music={"off" if no_music else "on"})')


if __name__ == '__main__':
    main()
