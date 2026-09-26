#!/usr/bin/env python3
"""
PMSNow reel soundtrack — synthesised from scratch (no samples, no licences).

  python3 audio/soundtrack.py out/cues.json out/soundtrack.wav [--stems out/]

Music: 128 BPM, A minor (Am–F–C–G), 16 bars = exactly 30 s, two drops.
Sound design: every SFX is placed from out/cues.json, which the composition
exports while it builds its timeline — so sound always follows picture.
"""
import json
import sys
import wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, lfilter
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR = 48000
DUR = 30.0
N = int(SR * DUR)
BPM = 128
BEAT = 60 / BPM


def b(n):
    return n * BEAT


def T(dur):
    return np.arange(int(round(dur * SR))) / SR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def db(x):
    return 10 ** (x / 20)


_seed = [1000]


def noise(dur):
    _seed[0] += 1
    return np.random.default_rng(_seed[0]).uniform(-1, 1, int(round(dur * SR)))


# ---------------------------------------------------------------- filters
def _sos(kind, fc, order=2):
    if kind == 'band':
        lo, hi = fc
        return butter(order, [max(20, lo), min(SR * 0.45, hi)], 'band', fs=SR, output='sos')
    return butter(order, min(max(fc, 20), SR * 0.45), kind, fs=SR, output='sos')


def lp(x, fc, order=2):
    return sosfilt(_sos('low', fc, order), x, axis=-1)


def hp(x, fc, order=2):
    return sosfilt(_sos('high', fc, order), x, axis=-1)


def bp(x, lo, hi, order=2):
    return sosfilt(_sos('band', (lo, hi), order), x, axis=-1)


def shelf(x, f0, gain_db, kind='low', S=0.9):
    """RBJ-cookbook shelving EQ"""
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    c, sn = np.cos(w0), np.sin(w0)
    al = sn / 2 * np.sqrt((A + 1 / A) * (1 / S - 1) + 2)
    q = 2 * np.sqrt(A) * al
    if kind == 'low':
        bb = [A * ((A + 1) - (A - 1) * c + q), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - q)]
        aa = [(A + 1) + (A - 1) * c + q, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - q]
    else:
        bb = [A * ((A + 1) + (A - 1) * c + q), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - q)]
        aa = [(A + 1) - (A - 1) * c + q, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - q]
    return lfilter(np.array(bb) / aa[0], np.array(aa) / aa[0], x, axis=-1)


def sweep(x, fcs, kind='low', block=128, width=0.6):
    """time-varying filter; fcs = cutoff per sample (for 'band': centre, ±width octaves)"""
    y = np.zeros_like(x)
    zi = None
    for s in range(0, len(x), block):
        fc = float(fcs[min(s + block // 2, len(fcs) - 1)])
        if kind == 'band':
            sos = _sos('band', (fc * 2 ** -width, fc * 2 ** width))
        else:
            sos = _sos(kind, fc)
        if zi is None or zi.shape[0] != sos.shape[0]:
            zi = np.zeros((sos.shape[0], 2))
        y[s:s + block], zi = sosfilt(sos, x[s:s + block], zi=zi)
    return y


# ------------------------------------------------------------ oscillators
def saw(freq, dur, phase=0.0):
    n = int(round(dur * SR))
    f = np.full(n, float(freq)) if np.isscalar(freq) else np.asarray(freq)[:n]
    dt = f / SR
    ph = (np.cumsum(dt) + phase) % 1.0
    s = 2 * ph - 1
    m = ph < dt                      # polyBLEP around the wrap
    x = ph[m] / dt[m]
    s[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]
    s[m] -= x * x + x + x + 1
    return s


def sine_f(freqs):
    return np.sin(2 * np.pi * np.cumsum(freqs) / SR)


def env_ad(t, a, d):
    return np.minimum(1, t / max(a, 1e-5)) * np.exp(-np.maximum(t - a, 0) / d)


def fade(x, a=0.002, r=0.01):
    n = x.shape[-1]
    na, nr = min(int(a * SR), n), min(int(r * SR), n)
    w = np.ones(n)
    if na: w[:na] = np.linspace(0, 1, na)
    if nr: w[-nr:] *= np.linspace(1, 0, nr)
    return x * w


def pan2(x, p=0.0):
    """equal-power pan; p in [-1, 1]; p may be an array"""
    a = (np.asarray(p) + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)]) * np.sqrt(2)


# ------------------------------------------------------------------ buses
class Bus:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, sig, t, gain_db=0.0, pan=0.0):
        if sig.ndim == 1:
            sig = pan2(sig, pan)
        i = int(round(t * SR))
        if i < 0:
            sig = sig[:, -i:]
            i = 0
        if i >= N:
            return
        n = min(sig.shape[1], N - i)
        self.x[:, i:i + n] += sig[:, :n] * db(gain_db)


# ----------------------------------------------------------- instruments
def kick(dur=0.5, punch=1.0):
    t = T(dur)
    f = 52 + 150 * np.exp(-t / 0.026) + 90 * np.exp(-t / 0.004)
    body = sine_f(f) * env_ad(t, 0.0015, 0.22)
    click = hp(noise(dur), 2500) * np.exp(-t / 0.0025) * 0.5 * punch
    return np.tanh(1.7 * (body + click)) * 0.95


def clap(dur=0.45):
    t = T(dur)
    n = noise(dur)
    e = sum(np.where(t >= d, np.exp(-(t - d) / 0.0045), 0) for d in (0, 0.010, 0.021))
    e = e + np.where(t >= 0.027, np.exp(-(t - 0.027) / 0.12), 0) * 0.75
    return bp(n, 950, 3200) * e * 1.4


def hat(decay=0.022, dur=0.2, bright=8000):
    t = T(dur)
    metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (317, 461, 538, 691, 823, 1043)) / 6
    x = hp(noise(dur) * 0.7 + metal * 0.5, bright, 2)
    return x * np.exp(-t / decay)


def snare(dur=0.3):
    t = T(dur)
    tone = sine_f(185 + 60 * np.exp(-t / 0.01)) * np.exp(-t / 0.05)
    nz = bp(noise(dur), 1200, 7000) * np.exp(-t / 0.08)
    return tone * 0.6 + nz


def crash(dur=2.4):
    t = T(dur)
    x = hp(noise(dur), 3500) + 0.3 * bp(noise(dur), 5000, 9000)
    return x * np.exp(-t / 0.95) * env_ad(t, 0.002, 10)


def supersaw_chord(midis, dur, cutoff=2600, voices=5, spread=0.14, amp_env=None):
    t = T(dur)
    L = np.zeros(len(t))
    R = np.zeros(len(t))
    rng = np.random.default_rng(len(midis) * 31 + int(dur * 100))
    for m in midis:
        f0 = mtof(m)
        for v in range(voices):
            det = (v / (voices - 1) - 0.5) * 2 * spread if voices > 1 else 0
            s = saw(f0 * 2 ** (det / 12), dur, rng.uniform())
            if v % 2 == 0:
                L += s
            if v % 2 == 1 or v == voices // 2:
                R += s
    st = np.vstack([L, R]) / (len(midis) * voices * 0.6)
    st = lp(st, cutoff, 2)
    if amp_env is not None:
        st = st * amp_env
    return st


def pluck(freq, dur=0.3, bright=1.0):
    t = T(dur)
    s = saw(freq, dur) + 0.6 * saw(freq * 1.006, dur, 0.3)
    s = sweep(s, 350 + 4800 * bright * np.exp(-t / 0.045), 'low', 64)
    return fade(s * np.exp(-t / 0.13), 0.001, 0.02) * 0.6


def bass_note(freq, dur=0.22, bright=1.0):
    t = T(dur)
    s = saw(freq, dur) * 0.7 + np.sin(2 * np.pi * freq * t) * 0.9
    s = sweep(s, 160 + 1300 * bright * np.exp(-t / 0.05), 'low', 64)
    return fade(s, 0.003, 0.03)


def sub_note(freq, dur):
    t = T(dur)
    return fade(np.sin(2 * np.pi * freq * t), 0.004, 0.04)


def bell(freq, dur=0.7, bright=1.0, decay=0.28):
    t = T(dur)
    idx = 2.2 * bright * np.exp(-t / 0.06)
    s = np.sin(2 * np.pi * freq * t + idx * np.sin(2 * np.pi * freq * 3.5 * t))
    s += 0.35 * np.sin(2 * np.pi * freq * 2.756 * t) * np.exp(-t / 0.12)
    return fade(s * env_ad(t, 0.001, decay), 0.0005, 0.03) * 0.5


def blip(freq, dur=0.05, decay=0.012):
    t = T(dur)
    return fade(np.sin(2 * np.pi * freq * t) * np.exp(-t / decay), 0.0003, 0.005)


def pop(f0=700, dur=0.09):
    t = T(dur)
    f = f0 * (1 + 1.6 * np.exp(-t / 0.008))
    return fade(sine_f(f) * np.exp(-t / 0.025), 0.0005, 0.01)


def click_snd():
    t = T(0.05)
    a = hp(noise(0.05), 2500) * np.exp(-t / 0.0015)
    c = np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.004) * 0.5
    return a * 0.8 + c


def whoosh(dur=0.4, f0=250, f1=5000, shape=0.45, width=0.7):
    t = T(dur)
    u = t / dur
    fc = f0 * (f1 / f0) ** u
    x = sweep(noise(dur), fc, 'band', 128, width)
    env = np.where(u < shape, (u / shape) ** 2, ((1 - u) / (1 - shape)) ** 1.5)
    return x * env * 2.2


def riser(dur, f0=300, f1=9000, tone=True):
    t = T(dur)
    u = t / dur
    x = sweep(noise(dur), f0 * (f1 / f0) ** u, 'high', 128) * u ** 2.2
    if tone:
        fr = 110 * 2 ** (u * 2.5)
        x = x + lp(saw(fr, dur), 2500) * 0.18 * u ** 2
    return x


def impact(dur=2.6, big=1.0):
    t = T(dur)
    sub = sine_f(36 + 70 * np.exp(-t / 0.07)) * env_ad(t, 0.001, 0.85 * big)
    crunch = sweep(noise(dur), 200 + 9000 * np.exp(-t / 0.12), 'low', 128) * np.exp(-t / 0.28)
    return np.tanh(1.4 * (sub * 1.1 + crunch * 0.55))


def tear(dur=0.28):
    t = T(dur)
    grains = np.random.default_rng(7).random(len(t)) < 0.02
    g = uniform_filter1d(grains.astype(float), 60) * 30
    x = bp(noise(dur), 1500, 7000) * g * np.minimum(1, (dur - t) / 0.05)
    return x * 0.9


def stamp_snd():
    t = T(0.4)
    thud = sine_f(62 + 130 * np.exp(-t / 0.018)) * np.exp(-t / 0.1)
    slap = lp(noise(0.4), 2200) * np.exp(-t / 0.018)
    return np.tanh(1.6 * (thud + 0.7 * slap))


def flip_snd(pitch=1.0):
    t = T(0.08)
    x = bp(noise(0.08), 900 * pitch, 4200 * pitch) * np.exp(-t / 0.014)
    return x * 1.2 + blip(1300 * pitch, 0.08, 0.006) * 0.25


def clack(f=900):
    t = T(0.14)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.028)
    s += 0.5 * np.sin(2 * np.pi * f * 2.43 * t) * np.exp(-t / 0.009)
    s += np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.035) * 0.6
    s += hp(noise(0.14), 3000) * np.exp(-t / 0.002) * 0.6
    return fade(s, 0.0003, 0.01) * 0.7


def sparkle(n=8, dur=0.55, lo=88, hi=108, seed=3):
    rng = np.random.default_rng(seed)
    out = np.zeros((2, int(dur * SR) + SR))
    scale = [0, 3, 5, 7, 10]
    for k in range(n):
        m = lo + scale[rng.integers(5)] + 12 * rng.integers(0, max(1, (hi - lo) // 12 + 1))
        s = bell(mtof(min(m, hi)), 0.5, 0.6, 0.12) * 0.5
        i = int(rng.uniform(0, dur) * SR)
        out[:, i:i + len(s)] += pan2(s, rng.uniform(-0.7, 0.7))
    return out


def scribble(dur=0.7):
    t = T(dur)
    am = np.abs(np.sin(2 * np.pi * 7.3 * t) * np.sin(2 * np.pi * 2.1 * t + 1))
    return bp(noise(dur), 2200, 6500) * am * 0.5 * np.minimum(1, (dur - t) / 0.05)


# ------------------------------------------------------------- arrangement
CH = {
    'Am': ([57, 60, 64, 69], 33), 'F': ([53, 57, 60, 64], 29), 'C': ([55, 60, 64, 67], 36),
    'G': ([55, 59, 62, 67], 31), 'Gsus': ([55, 60, 62, 67], 31),
}
BARS = ['Am', 'Am', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'Am', 'G', 'F', 'Gsus', 'C', 'F']


def chord_at(beat):
    if beat >= 62:
        return 'C'
    return BARS[int(beat // 4)]


def section(beat):
    for name, a, z in (('intro', 0, 6), ('freeze', 6, 8), ('main', 8, 44), ('build', 44, 48), ('drop2', 48, 52),
                       ('break', 52, 56), ('final', 56, 62), ('outro', 62, 65)):
        if a <= beat < z:
            return name
    return 'outro'


def build_music(drums, bass, pads, arp, stabs, fx):
    kicks = []
    # ---- drums
    for i in range(0, 64 * 4):          # 16th grid
        beat = i / 4
        t = b(beat)
        sec = section(beat)
        on_beat = i % 4 == 0
        if sec in ('main', 'drop2', 'final') or (sec == 'build' and beat < 46.5):
            if on_beat:
                drums.add(kick(), t, -6.5)
                kicks.append(t)
            if on_beat and int(beat) % 2 == 1 and sec != 'build':
                drums.add(clap(), t, -6.5, 0.05)
            if i % 4 == 2:
                drums.add(hat(0.03 if int(beat) % 4 == 3 else 0.022), t, -12.5, 0.25)
                if sec in ('drop2', 'final') and int(beat) % 2 == 0:
                    drums.add(hat(0.14, 0.4, 6500), t, -17, -0.2)
            elif i % 2 == 1 and sec != 'build':
                drums.add(hat(0.012), t, -21, -0.3)
        elif sec == 'intro' and beat >= 2:
            if on_beat:
                drums.add(lp(kick(), 380), t, -8)
                kicks.append(t)
            v = (beat - 2) / 4
            drums.add(hat(0.012), t, -30 + 12 * v, 0.3 if i % 2 else -0.3)
        elif sec == 'break' and beat < 55.5:
            if i % 2 == 0:
                drums.add(hat(0.015), t, -27 + (beat - 52) * 1.5, 0.2)
    # build: snare roll 8ths → 16ths → 32nds, rising
    rolls = [(44 + k * 0.5) for k in range(4)] + [(46 + k * 0.25) for k in range(6)] + [(47.5 + k * 0.125) for k in range(3)]
    for k, bt in enumerate(rolls):
        drums.add(snare(), b(bt), -20 + k * 1.1, 0.1)
    fx.add(riser(b(3.7), 250, 9000), b(44), -12)
    # breakdown → "Now.": reverse cymbal + riser land on the downbeat of bar 14
    fx.add(crash(b(2))[::-1], b(54), -9)
    fx.add(riser(b(2), 300, 10000), b(54), -11)
    # final hits
    for t, g in ((b(8), -6), (b(48), -6), (b(56), -5), (b(62), -7)):
        drums.add(crash(), t, g)
    # ---- bass (offbeat 8ths + sub)
    for beat2 in range(0, 64 * 2):
        beat = beat2 / 2
        sec = section(beat)
        ch = chord_at(beat)
        root = mtof(CH[ch][1] + 12)
        t = b(beat)
        if sec in ('main', 'drop2', 'final') and beat2 % 2 == 1:
            bass.add(bass_note(root, 0.2, 1.3 if sec != 'main' else 1.1), t, -8)
        if sec in ('main', 'drop2', 'final') and beat2 % 2 == 0:
            bass.add(sub_note(root / 2, 0.42), t + 0.02, -18)
        if sec == 'intro' and beat >= 2 and beat2 % 1 == 0:
            bass.add(lp(bass_note(root, 0.18, 0.4), 500), t, -14 + (beat - 2) * 1.2)
    # ---- pads: sustained supersaws per bar
    for bar in range(16):
        beat0 = bar * 4
        sec = section(beat0)
        if sec in ('intro', 'freeze'):
            continue
        segs = [(beat0, 4)] if bar != 15 else [(60, 2), (62, 2)]
        for bt, ln in segs:
            ch = chord_at(bt)
            dur = b(ln) + (1.4 if bt >= 62 else 0.06)
            tt = T(dur)
            env = np.minimum(1, tt / 0.03) * np.minimum(1, np.maximum(dur - tt, 0) / 0.06)
            if bt >= 62:
                env = np.minimum(1, tt / 0.01) * np.exp(-tt / 1.3)
            cut = {'main': 2400, 'build': 1400 + 0, 'drop2': 3600, 'break': 1800, 'final': 3400, 'outro': 4200}[section(bt)]
            if section(bt) == 'build':
                cut = 900
            chord = supersaw_chord(CH[ch][0], dur, cut, amp_env=env)
            pads.add(chord, b(bt), -11.5 if section(bt) != 'break' else -7.5)
    # build: a brighter G swell rises under the muffled pad
    swell = supersaw_chord(CH['G'][0], b(4), 3000, amp_env=np.linspace(0, 1, int(round(b(4) * SR))) ** 2)
    pads.add(swell, b(44), -16)
    # ---- arp (16ths, chord tones two octaves up)
    pattern = [0, 1, 2, 3, 2, 1, 2, 3, 0, 2, 1, 3, 2, 3, 1, 2]
    for i in range(12 * 4, 62 * 4):
        beat = i / 4
        sec = section(beat)
        if sec in ('build', 'break') or (8 <= beat < 12):
            continue
        ch = chord_at(beat)
        notes = CH[ch][0]
        m = notes[pattern[i % 16]] + 12
        br = 1.0 if sec in ('drop2', 'final') else 0.65
        arp.add(pluck(mtof(m), 0.25, br), b(beat), -15.5 if sec == 'main' else -13.5, 0.35 if i % 2 else -0.35)
    # ---- stabs at the very start ("RUNNING" / "A HOTEL")
    for bt in (0, 1):
        tt = T(0.9)
        stabs.add(supersaw_chord([57, 64, 69, 72], 0.9, 5000, amp_env=env_ad(tt, 0.004, 0.16)), b(bt), -8)
    return np.array(kicks)


def tape_stop(x, t0, dur):
    """slow a bus to a halt over [t0, t0+dur], silence afterwards until next content"""
    i0, n = int(t0 * SR), int(dur * SR)
    u = np.arange(n) / SR
    pos = i0 + (u - u ** 2 / (2 * dur)) * SR
    for c in range(2):
        seg = np.interp(pos, np.arange(len(x[c])), x[c])
        x[c, i0:i0 + n] = seg * np.linspace(1, 0, n) ** 0.5
    return x


def sidechain(kicks, depth=0.62, rel=0.12):
    g = np.ones(N)
    for t in kicks:
        i = int(t * SR)
        n = min(int(0.45 * SR), N - i)
        if n <= 0:
            continue
        tt = np.arange(n) / SR
        g[i:i + n] = np.minimum(g[i:i + n], 1 - depth * np.exp(-tt / rel))
    return g


# ------------------------------------------------------------------- sfx
PENTA = [0, 3, 5, 7, 10]


def penta(k, base=76):
    return mtof(base + PENTA[k % 5] + 12 * (k // 5))


def place_sfx(cues, sfx, big):
    for c in cues:
        t, ty = c['t'], c['type']
        v = c.get('v', 0.5)
        k = c.get('k', c.get('i', 0))
        if ty == 'hit':
            big.add(kick(0.6, 1.4), t, -3)
        elif ty == 'pop_big':
            sfx.add(pop(420, 0.14), t, -9)
            sfx.add(bell(mtof(81), 0.6), t, -17, 0.2)
        elif ty == 'notif':
            sfx.add(bell(penta(k, 76), 0.5, 0.9, 0.16), t, -15, [-0.5, 0.5][k % 2] * 0.8)
            sfx.add(pop(900 + 60 * k, 0.06), t, -22)
        elif ty == 'freeze':
            big.add(lp(impact(1.2, 0.6), 1500), t, -11)
            sfx.add(bell(mtof(93), 1.2, 1.4, 0.5), t, -17)
        elif ty == 'suck':
            dur = b(8) - t - 0.035
            x = riser(dur, 180, 11000, tone=True)
            pn = np.sin(np.linspace(0, 14, len(x)) ** 1.3) * 0.7
            big.add(pan2(x, pn), t, -8)
        elif ty == 'impact':
            big.add(impact(2.8, 1.2), t, -1.5)
        elif ty == 'impact2':
            big.add(impact(2.8, 1.25), t, -1.0)
            big.add(supersaw_chord([60, 64, 67, 72, 76], 1.4, 6000, amp_env=env_ad(T(1.4), 0.003, 0.45)), t, -9)
        elif ty == 'burst3d':
            big.add(impact(2.2, 0.9), t, -3)
            sfx.add(whoosh(0.5, 3000, 300, 0.2), t, -12)
        elif ty == 'punch':
            sfx.add(pop(260, 0.12), t, -8)
            sfx.add(click_snd(), t, -14)
        elif ty in ('whoosh', 'whoosh_s'):
            d = 0.42 if ty == 'whoosh' else 0.3
            x = whoosh(d, 300, 6000)
            sfx.add(pan2(x, np.linspace(0.5, -0.6, len(x))), t, -9 if ty == 'whoosh' else -13)
        elif ty == 'zoom':
            x = whoosh(0.62, 150, 9000, 0.85, 0.8)
            sfx.add(x, t, -8)
        elif ty == 'land':
            sfx.add(lp(kick(0.4), 900), t, -10)
            sfx.add(whoosh(0.35, 5000, 400, 0.05), t, -17)
        elif ty == 'type':
            sfx.add(click_snd() * 0.6 + blip(2400 + 300 * ((t * 37) % 1), 0.05, 0.004) * 0.3, t, -21, ((t * 13) % 1) - 0.5)
        elif ty == 'tick':
            sfx.add(blip(1800 + 1600 * v, 0.04, 0.006), t, -21, 0.2)
        elif ty == 'count':
            sfx.add(blip(mtof(72 + k * 1.05), 0.06, 0.012), t, -15, (k % 2 - 0.5) * 0.6)
            sfx.add(click_snd(), t, -26)
        elif ty == 'blip':
            sfx.add(blip(1100 + 900 * v, 0.05, 0.01), t, -18, (v - 0.5))
        elif ty == 'pop':
            sfx.add(pop(600 + 500 * v, 0.08), t, -13)
        elif ty == 'grab':
            sfx.add(sine_f(np.linspace(450, 900, int(0.05 * SR))) * np.exp(-T(0.05) / 0.02), t, -16)
        elif ty == 'snap':
            sfx.add(pop(380, 0.1), t, -9)
            sfx.add(click_snd(), t, -13)
        elif ty == 'morph':
            x = whoosh(0.45, 400, 7000, 0.7, 0.5)
            sfx.add(x, t, -12)
        elif ty == 'check':
            sfx.add(bell(penta(k + 2, 81), 0.5, 0.7, 0.14), t, -14, (k - 1) * 0.3)
        elif ty == 'scribble':
            sfx.add(scribble(0.72), t, -16, -0.2)
        elif ty == 'click':
            sfx.add(click_snd(), t, -10)
        elif ty == 'success':
            sfx.add(bell(mtof(84), 0.7, 0.8, 0.25), t, -12)
            sfx.add(bell(mtof(91), 0.9, 0.8, 0.35), t + 0.09, -12)
        elif ty == 'flip':
            sfx.add(flip_snd(0.85 + 0.3 * v), t, -12, (v - 0.5) * 1.2)
        elif ty == 'flood':
            sfx.add(whoosh(0.5, 200, 3000, 0.8), t, -9)
            sfx.add(lp(impact(0.8, 0.4), 800), t + 0.4, -12)
        elif ty == 'stamp':
            sfx.add(stamp_snd(), t, -5, -0.35 if k == 0 else 0.35)
        elif ty == 'split':
            sfx.add(tear(), t, -10)
        elif ty == 'flap':
            for j in range(8):
                sfx.add(click_snd() * (1 - j / 10), t + j * 0.024, -16, 0.2)
        elif ty in ('sparkle', 'shimmer'):
            sfx.add(sparkle(9 if ty == 'sparkle' else 6, 0.5, 84, 105, 11 if ty == 'sparkle' else 12), t, -16 if ty == 'sparkle' else -21)
        elif ty == 'star':
            sfx.add(bell(penta(k + 5, 76), 0.7, 1.0, 0.22), t, -13, (k - 2) * 0.25)
        elif ty == 'flipword':
            sfx.add(whoosh(0.22, 800, 5000, 0.6), t - 0.12, -17)
            sfx.add(blip(mtof(76 + [0, 5, 7][k - 1 if 0 < k < 4 else 0]), 0.1, 0.03), t, -16)
        elif ty == 'suck_short':
            x = riser(0.3, 400, 9000, tone=False)
            sfx.add(x, t, -9)
        elif ty == 'clack':
            sfx.add(clack(700 + 60 * (k % 7) + 11 * k), t, -12, ((k * 0.37) % 1.4) - 0.7)
        elif ty == 'logo_land':
            for j, m in enumerate((72, 76, 79, 84)):
                sfx.add(bell(mtof(m), 1.6, 0.5, 0.7), t + j * 0.035, -17, (j - 1.5) * 0.3)
            sfx.add(sub_note(mtof(36), 0.9) * np.exp(-T(0.9) / 0.35), t, -9)
        # unknown cue types are silently ignored


# ------------------------------------------------------------------ mixing
def make_ir(rt60, pre=0.02, damp=6000, seed=5):
    dur = rt60 * 1.1
    t = T(dur)
    rng = np.random.default_rng(seed)
    x = rng.standard_normal((2, len(t))) * np.exp(-6.9 * t / rt60)
    x = lp(x, damp)
    ir = np.zeros((2, int(pre * SR) + len(t)))
    ir[:, int(pre * SR):] = x
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(x, ir, mix):
    wet = np.vstack([fftconvolve(x[c], ir[c])[:N] for c in range(2)])
    return wet * mix


def delay(x, time, fb=0.35, mix=0.3, lpf=3500):
    d = int(time * SR)
    y = np.zeros_like(x)
    src = x.copy()
    for k in range(1, 6):
        tap = np.zeros_like(x)
        tap[:, d * k:] = src[:, :N - d * k] * (fb ** (k - 1))
        if k % 2:
            tap = tap[::-1]            # ping-pong
        y += tap
    return lp(y, lpf) * mix


def limiter(x, ceiling=0.89, look=0.004):
    a = np.max(np.abs(x), axis=0)
    g = np.minimum(1.0, ceiling / np.maximum(a, 1e-9))
    w = int(look * SR)
    g = minimum_filter1d(g, 2 * w + 1)
    g = uniform_filter1d(g, w)
    g = minimum_filter1d(g, w)            # never exceed the needed reduction after smoothing
    return np.clip(x * g, -ceiling, ceiling)


def write_wav(path, x):
    y = np.clip(x, -1, 1)
    pcm = (y.T * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    cues = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    music_on = '--no-music' not in sys.argv
    drums, bass, pads, arp, stabs, fx, sfx, big = (Bus() for _ in range(8))
    kicks = build_music(drums, bass, pads, arp, stabs, fx) if music_on else np.array([])
    place_sfx(cues, sfx, big)

    sc = sidechain(kicks)
    music = drums.x + bass.x * sc + pads.x * sc + arp.x * sc + stabs.x + fx.x
    # freeze → tape stop, then the pre-drop gap (sfx keep playing)
    freeze_t = b(6)
    music = tape_stop(music, freeze_t, 0.32)
    gap0, gap1 = int((freeze_t + 0.32) * SR), int(b(8) * SR)
    music[:, gap0:gap1] = 0

    hall = make_ir(2.2, 0.03, 5200, 9)
    room = make_ir(0.7, 0.01, 7000, 10)
    mix = music + sfx.x * db(3) + big.x
    mix += reverb(pads.x * sc + arp.x * sc * 1.2 + stabs.x, hall, 0.32)
    mix += delay(arp.x * sc, BEAT * 0.75, 0.4, 0.28)
    mix += reverb(sfx.x * db(3) * 0.8 + big.x * 0.5, hall, 0.22)
    mix += reverb(drums.x, room, 0.12)

    mix = hp(mix, 30, 2)
    # phone-speaker friendly tilt: less sub, more presence
    mix = shelf(mix, 105, -4.0, 'low')
    mix = shelf(mix, 2600, 3.5, 'high')
    # gentle glue + loudness
    try:
        import pyloudnorm as pyln
        meter = pyln.Meter(SR)
        lufs = meter.integrated_loudness(mix.T)
        mix *= db(-12.5 - lufs)
    except Exception:
        mix *= 0.5 / (np.sqrt(np.mean(mix ** 2)) * 4 + 1e-9)
    mix = np.tanh(mix * 1.15) / np.tanh(1.15)
    mix = limiter(mix, db(-1.0))
    # tiny fade-in / tail fade so the loop point is clean
    n0, n1 = int(0.004 * SR), int(0.35 * SR)
    mix[:, :n0] *= np.linspace(0, 1, n0)
    mix[:, -n1:] *= np.linspace(1, 0, n1) ** 1.5
    write_wav(out, mix)
    try:
        import pyloudnorm as pyln
        print(f'{out}: {pyln.Meter(SR).integrated_loudness(mix.T):.1f} LUFS, peak {20*np.log10(np.max(np.abs(mix))):.2f} dBFS')
    except Exception:
        print(out)


if __name__ == '__main__':
    main()
