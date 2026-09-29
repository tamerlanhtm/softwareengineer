"""Original soundtrack + sound design for the TOSNow reel, synthesized from
scratch with numpy/scipy (no samples, no licensed audio).

  * 128 BPM, 16 bars = 30 s. F minor (vi–IV–I–V loop) resolving to A♭ major.
  * Music structure follows the edit: tense hook → impact on the logo →
    groove through the product journey → build → final chorus on the CTA.
  * Every visual event exported to audio/cues.json gets a designed sound
    (slams, pops, whip-pans, clicks, stamps, typing …).

usage:  python3 audio/synth.py            → audio/soundtrack_premaster.wav
"""
import json
import os
import wave

import numpy as np
from scipy import signal
from scipy.ndimage import maximum_filter1d, uniform_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
BPM = 128
BEAT = 60 / BPM
DUR = 30.0
N = int(SR * DUR)
rng = np.random.default_rng(128)


def B(n):
    return n * BEAT


def tt(d):
    return np.arange(max(1, int(d * SR))) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def noise(d):
    return rng.standard_normal(max(1, int(d * SR)))


# ───────────────────────────── filters ─────────────────────────────
def _sos(kind, f, order=2):
    if kind == 'bp':
        lo, hi = f
        return signal.butter(order, [max(10, lo), min(hi, SR / 2 - 100)], 'bandpass', fs=SR, output='sos')
    return signal.butter(order, min(f, SR / 2 - 100), kind, fs=SR, output='sos')


def lp(x, f, o=2): return signal.sosfilt(_sos('low', f, o), x)
def hp(x, f, o=2): return signal.sosfilt(_sos('high', f, o), x)
def bp(x, lo, hi, o=2): return signal.sosfilt(_sos('bp', (lo, hi), o), x)


def shelf(x, f0, gain_db, kind='low', S=0.8):
    """RBJ cookbook shelving filter."""
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / 2 * np.sqrt((A + 1 / A) * (1 / S - 1) + 2)
    c = np.cos(w0)
    if kind == 'low':
        b0 = A * ((A + 1) - (A - 1) * c + 2 * np.sqrt(A) * alpha)
        b1 = 2 * A * ((A - 1) - (A + 1) * c)
        b2 = A * ((A + 1) - (A - 1) * c - 2 * np.sqrt(A) * alpha)
        a0 = (A + 1) + (A - 1) * c + 2 * np.sqrt(A) * alpha
        a1 = -2 * ((A - 1) + (A + 1) * c)
        a2 = (A + 1) + (A - 1) * c - 2 * np.sqrt(A) * alpha
    else:
        b0 = A * ((A + 1) + (A - 1) * c + 2 * np.sqrt(A) * alpha)
        b1 = -2 * A * ((A - 1) + (A + 1) * c)
        b2 = A * ((A + 1) + (A - 1) * c - 2 * np.sqrt(A) * alpha)
        a0 = (A + 1) - (A - 1) * c + 2 * np.sqrt(A) * alpha
        a1 = 2 * ((A - 1) - (A + 1) * c)
        a2 = (A + 1) - (A - 1) * c - 2 * np.sqrt(A) * alpha
    return signal.lfilter([b0 / a0, b1 / a0, b2 / a0], [1, a1 / a0, a2 / a0], x)


def sweep_filter(x, kind, f_curve, q_bw=0.6, block=256):
    """Time-varying filter: f_curve(u) → cutoff (or centre for 'bp'), u∈[0,1]."""
    y = np.zeros_like(x)
    zi = None
    n = len(x)
    for i in range(0, n, block):
        u = i / max(1, n - 1)
        f = float(f_curve(u))
        if kind == 'bp':
            sos = _sos('bp', (f * (1 - q_bw / 2), f * (1 + q_bw / 2)))
        else:
            sos = _sos('low' if kind == 'lp' else 'high', f)
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y[i:i + block], zi = signal.sosfilt(sos, x[i:i + block], zi=zi)
    return y


# ───────────────────────────── oscillators ─────────────────────────────
def phase_of(freq, n):
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    return np.cumsum(f) / SR, f / SR


def sine(freq, d, ph0=0.0):
    n = int(d * SR)
    p, _ = phase_of(freq, n)
    return np.sin(2 * np.pi * (p + ph0))


def _blep(p, dt):
    out = np.zeros_like(p)
    m = p < dt
    t = p[m] / dt[m]
    out[m] = 2 * t - t * t - 1
    m2 = p > 1 - dt
    t = (p[m2] - 1) / dt[m2]
    out[m2] = t * t + 2 * t + 1
    return out


def saw(freq, d, ph0=None):
    n = int(d * SR)
    p, dt = phase_of(freq, n)
    p = (p + (rng.random() if ph0 is None else ph0)) % 1.0
    return 2 * p - 1 - _blep(p, dt)


def square(freq, d):
    n = int(d * SR)
    p, dt = phase_of(freq, n)
    p = (p + rng.random()) % 1.0
    s = np.where(p < 0.5, 1.0, -1.0)
    s += _blep(p, dt)
    s -= _blep((p + 0.5) % 1.0, dt)
    return s


def env_exp(d, tau, att=0.002):
    t = tt(d)
    return np.minimum(1, t / max(att, 1e-4)) * np.exp(-t / tau)


def adsr(d, a, r, s=1.0):
    t = tt(d)
    e = np.minimum(1, t / max(a, 1e-4)) * s
    rel0 = max(0.0, d - r)
    e = np.where(t > rel0, e * np.clip(1 - (t - rel0) / max(r, 1e-4), 0, 1), e)
    return e


# ───────────────────────────── mixing ─────────────────────────────
class Bus:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, sig, t0, gain=1.0, pan=0.0):
        if sig.ndim == 1:
            a = (pan + 1) * np.pi / 4
            sig = np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
        i0 = int(round(t0 * SR))
        s0 = 0
        if i0 < 0:
            s0, i0 = -i0, 0
        if i0 >= N or s0 >= sig.shape[1]:
            return
        n = min(sig.shape[1] - s0, N - i0)
        self.x[:, i0:i0 + n] += gain * sig[:, s0:s0 + n]


music, drums, sfx, verb_send, delay_send, sfx_verb = Bus(), Bus(), Bus(), Bus(), Bus(), Bus()


def to_stereo(sig, width=0.0):
    if sig.ndim == 2:
        return sig
    return np.vstack([sig, sig])


# ───────────────────────────── instruments ─────────────────────────────
def kick(big=False):
    d = 0.55 if big else 0.42
    t = tt(d)
    f = 54 + (170 if big else 150) * np.exp(-t / 0.03)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.26 if big else 0.17))
    knock = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.04) * 0.6     # audible on phone speakers
    beater = bp(noise(d), 1800, 5000) * np.exp(-t / 0.006) * 0.45
    clk = hp(noise(d), 2500) * np.exp(-t / 0.003) * 0.3
    x = np.tanh(1.8 * (body * np.minimum(1, t / 0.0015) + knock + beater + clk))
    return hp(x, 38) * 0.9


def clap():
    d = 0.4
    t = tt(d)
    n = noise(d)
    e = np.zeros_like(t)
    for k, off in enumerate((0.0, 0.012, 0.024)):
        e += (t >= off) * np.exp(-np.clip(t - off, 0, None) / 0.005) * (0.8 + 0.1 * k)
    e += (t >= 0.03) * np.exp(-np.clip(t - 0.03, 0, None) / 0.11) * 0.55
    body = bp(n, 800, 3200) * e
    return np.tanh(1.5 * body) * 0.8


def hat(open_=False):
    d = 0.35 if open_ else 0.08
    t = tt(d)
    x = hp(noise(d), 7500, 4) * np.exp(-t / (0.12 if open_ else 0.022))
    x += bp(noise(d), 9000, 13000) * np.exp(-t / (0.09 if open_ else 0.015)) * 0.6
    return x * 0.5


def snare_roll_hit(v):
    d = 0.12
    t = tt(d)
    x = bp(noise(d), 1200, 6000) * np.exp(-t / 0.035) + np.sin(2 * np.pi * 210 * t) * np.exp(-t / 0.03) * 0.5
    return x * v


def crash():
    d = 2.2
    t = tt(d)
    x = hp(noise(d), 4000, 2) * np.exp(-t / 0.55) + bp(noise(d), 3000, 9000) * np.exp(-t / 0.9) * 0.5
    return x * 0.4


def supersaw_chord(notes, d, cutoff=1500, detune=0.12, voices=3, a=0.2, r=0.45):
    """Stereo detuned-saw chord."""
    L = np.zeros(int(d * SR))
    R = np.zeros_like(L)
    for m in notes:
        f = midi(m)
        for v in range(voices):
            cents = (v - (voices - 1) / 2) * detune * 100 / max(1, (voices - 1) / 2) if voices > 1 else 0
            s = saw(f * 2 ** (cents / 1200), d)
            pan = (v - (voices - 1) / 2) / max(1, (voices - 1) / 2) * 0.8
            ang = (pan + 1) * np.pi / 4
            L += s * np.cos(ang)
            R += s * np.sin(ang)
    e = adsr(d, a, r)
    st = np.vstack([lp(L, cutoff), lp(R, cutoff)]) * e / (len(notes) * voices) * 2.2
    return st


def pluck(m, d=0.3, bright=4200):
    t = tt(d)
    f = midi(m)
    x = 0.6 * saw(f, d) + 0.4 * square(f * 1.002, d)
    cut = lambda u: 500 + bright * np.exp(-u * d / 0.06)
    x = sweep_filter(x, 'lp', cut, block=128)
    return x * np.exp(-t / 0.16) * np.minimum(1, t / 0.002) * 0.5


def bass_note(m, d):
    t = tt(d)
    f = midi(m)
    sub = np.sin(2 * np.pi * f * t) * 0.55
    mid = saw(f, d) + 0.5 * saw(f * 2.003, d)
    mid = sweep_filter(mid, 'lp', lambda u: 380 + 1700 * np.exp(-u * d / 0.08), block=128)
    x = np.tanh(1.5 * (sub + 0.6 * mid))
    e = np.minimum(1, t / 0.004) * np.clip(1 - np.maximum(0, t - (d - 0.04)) / 0.04, 0, 1)
    return x * e * 0.55


def fm_bell(m, d=0.9, index=2.2, ratio=2.0, tau=0.35):
    t = tt(d)
    f = midi(m)
    mod = np.sin(2 * np.pi * f * ratio * t) * index * np.exp(-t / 0.12)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / tau) * np.minimum(1, t / 0.002)
    return x * 0.45


def whoosh(d, f0=300, f1=5000, peak=0.55, bw=1.2, curve='bell'):
    n = noise(d)
    x = sweep_filter(n, 'bp', lambda u: f0 * (f1 / f0) ** u, q_bw=bw)
    t = np.linspace(0, 1, len(x))
    if curve == 'bell':
        e = np.where(t < peak, (t / peak) ** 2, ((1 - t) / (1 - peak)) ** 1.5)
    elif curve == 'rise':
        e = t ** 2.2
    else:
        e = (1 - t) ** 2
    return x * e


def sub_drop(d=1.4, f0=130, f1=44):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.25)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55) * np.minimum(1, t / 0.003)
    return np.tanh(2.2 * x) * 0.7   # harmonics so the drop reads on small speakers


def blip(freq, d=0.06, drop=0.5):
    t = tt(d)
    f = freq * (1 - drop * (1 - np.exp(-t / 0.015)))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (d / 3)) * np.minimum(1, t / 0.001)


def click_tr(freq=2800, d=0.012):
    t = tt(d)
    return (np.sin(2 * np.pi * freq * t) * 0.6 + hp(noise(d), 3000) * 0.4) * np.exp(-t / 0.0025)


# ───────────────────────────── the score ─────────────────────────────
CHORDS = {  # voicings (MIDI) for pads, roots for the bass
    'Fm': ([53, 56, 60, 65], 41), 'Db': ([53, 56, 61, 65], 37),
    'Ab': ([56, 60, 63, 68], 44), 'Eb': ([55, 58, 63, 67], 39),
}
PROG = {3: 'Fm', 4: 'Db', 5: 'Ab', 6: 'Eb', 7: 'Fm', 8: 'Db', 9: 'Ab', 10: 'Eb',
        11: 'Fm', 12: 'Db', 13: 'Ab', 14: 'Eb'}
# bar 15: Db (2 beats) → Eb (2 beats, "Now."), bar 16: A♭ major resolve.


def chord_at(beat):
    bar = int(beat // 4) + 1
    if bar == 15:
        return 'Db' if beat < 58 else 'Eb'
    if bar >= 16:
        return 'Ab'
    return PROG.get(bar, 'Fm')


kick_times = []


def place_kick(beat, big=False, gain=1.0):
    drums.add(kick(big), B(beat), 0.95 * gain)
    kick_times.append(B(beat))


def score():
    # ── Hook (bars 1–2): tension drone, ticking clock, slams on 3-3-2 ──
    d = B(8)
    t = tt(d)
    drone = np.sin(2 * np.pi * midi(41) * t) * 0.3 + lp(saw(midi(41) * (1 + 0.002 * np.sin(2 * np.pi * 0.3 * t)), d), 520) * 0.4 \
        + lp(saw(midi(53) * 1.003, d), 900) * 0.12
    drone *= np.minimum(1, t / 0.05) * (0.7 + 0.3 * t / d)
    music.add(drone, 0, 0.55)
    rumble = bp(noise(d), 90, 400) * (0.4 + 0.6 * t / d)
    music.add(rumble, 0, 0.16)
    for k in range(int(8 * 4)):          # 16th "clock" ticks, accent on beats
        b = k * 0.25
        g = 0.22 if k % 4 == 0 else 0.1
        drums.add(click_tr(5200 if k % 4 else 3600, 0.01), B(b), g, pan=0.25 if k % 2 else -0.25)
    for k in range(8):                    # off-beat hats creep in during bar 2
        drums.add(hat(), B(4 + k * 0.5 + 0.25), 0.18 + 0.02 * k, pan=0.3)

    # ── Bar 3: impact + reveal pad; hats from beat 10 ──
    for bar in range(3, 17):
        b0 = (bar - 1) * 4
        name = chord_at(b0)
        if bar == 15:
            for half, nm in ((0, 'Db'), (2, 'Eb')):
                ch = supersaw_chord(CHORDS[nm][0] + [CHORDS[nm][0][0] + 12], B(2) + 0.45, cutoff=3200, a=0.03, r=0.4)
                music.add(ch, B(b0 + half), 0.7)
                verb_send.add(ch, B(b0 + half), 0.35)
            continue
        if bar == 16:
            ch = supersaw_chord(CHORDS['Ab'][0] + [72], B(4) + 0.2, cutoff=3400, a=0.02, r=1.2)
            music.add(ch, B(b0), 0.75)
            verb_send.add(ch, B(b0), 0.45)
            continue
        cutoff = 1600 if bar == 3 else 2300 + 90 * (bar - 4)
        ch = supersaw_chord(CHORDS[name][0], B(4) + 0.4, cutoff=cutoff, a=0.5 if bar == 3 else 0.12, r=0.4)
        music.add(ch, B(b0), 0.55 if bar == 3 else 0.5)
        verb_send.add(ch, B(b0), 0.35)

    # ── Drums ──
    for b in range(12, 62):
        if 23 <= b < 24 or 47 <= b < 48 or 55 <= b < 56:   # breaths before big transitions
            continue
        place_kick(b, big=b in (16, 24, 48, 56))
    for b in range(10, 62):
        if 55 <= b < 56:
            continue
        drums.add(hat(), B(b + 0.5), 0.55 if b >= 12 else 0.32, pan=0.2)
        if b >= 24 and b < 55:
            drums.add(hat(), B(b + 0.25), 0.17, pan=-0.3)
            drums.add(hat(), B(b + 0.75), 0.2, pan=-0.3)
        if 32 <= b < 47 or 56 <= b < 60:
            drums.add(hat(open_=True), B(b + 0.5), 0.26, pan=-0.15)
    for b in range(17, 62, 2):                              # claps on 2 & 4
        if b in (23, 47, 55):
            continue
        drums.add(clap(), B(b), 0.75)
        verb_send.add(clap(), B(b), 0.22)
    for b in (16, 24, 48, 56):
        drums.add(crash(), B(b), 0.7, pan=0.1)
    for k in range(16):                                     # snare roll into the bento
        b = 46 + k * 0.125
        drums.add(snare_roll_hit(0.15 + 0.5 * k / 15), B(b), 0.6)
    for k in range(8):                                      # fill into the CTA
        drums.add(snare_roll_hit(0.3 + 0.6 * k / 7), B(54 + k * 0.125), 0.55)

    # ── Bass: off-beat house bass from bar 4 ──
    for b in range(12, 62):
        if 23 <= b < 24 or 47 <= b < 48 or 55 <= b < 56:
            continue
        root = CHORDS[chord_at(b)][1]
        music.add(bass_note(root, B(0.42)), B(b + 0.5), 0.9)
        if b >= 24 and b % 2 == 1 and b < 55:               # extra drive in the journey
            music.add(bass_note(root + 12, B(0.2)), B(b + 0.75), 0.35)

    # ── Arp: 16th plucks through the journey and bento ──
    pattern = [0, 1, 2, 3, 2, 1, 2, 3]
    for k in range(int((55 - 24) * 4)):
        b = 24 + k * 0.25
        notes = CHORDS[chord_at(b)][0]
        m = notes[pattern[k % 8]] + 12
        g = 0.32 + (0.1 if k % 4 == 0 else 0)
        p = pluck(m, 0.28, bright=5600)
        music.add(p, B(b), g, pan=-0.35 if k % 2 else 0.35)
        delay_send.add(p, B(b), g * 0.7)

    # ── Risers / builds ──
    r = whoosh(B(3), 250, 7000, curve='rise') * 0.9          # hook riser → logo impact
    r += saw(np.linspace(midi(53), midi(65), int(B(3) * SR)), B(3)) * np.linspace(0, 1, int(B(3) * SR)) ** 2 * 0.12
    sfx.add(lp(r, 9000), B(5), 0.55)
    sfx.add(whoosh(B(1.5), 400, 6000, curve='rise'), B(10.5), 0.25)
    sfx.add(whoosh(B(2), 300, 8000, curve='rise'), B(46), 0.35)
    r2 = whoosh(B(3), 200, 9000, curve='rise')
    r2 += saw(np.linspace(midi(51), midi(63), int(B(3) * SR)), B(3)) * np.linspace(0, 1, int(B(3) * SR)) ** 2 * 0.1
    sfx.add(lp(r2, 10000), B(53), 0.5)


# ───────────────────────────── sound design from cues ─────────────────────────────
def sfx_for(c):
    ty, t0 = c['type'], c['t']
    if ty == 'slam':
        big = c.get('final')
        sfx.add(kick(big=True), t0, 1.0 if big else 0.9)
        kick_times.append(t0)
        st = supersaw_chord((CHORDS['Eb'][0] if big else [53, 56, 60]) + ([] if big else [41]), 0.6, cutoff=2600, a=0.003, r=0.5)
        st *= np.exp(-tt(0.6) / 0.2)
        sfx.add(st, t0, 0.7 if big else 0.55)
        sfx_verb.add(st, t0, 0.5)
        sfx.add(lp(noise(0.25), 5000) * np.exp(-tt(0.25) / 0.05), t0, 0.35)
        sfx.add(sub_drop(0.8, 90, 38), t0, 0.5)
    elif ty == 'ping':
        pan = [-0.5, 0.5, -0.4, 0.5, -0.5, 0.4][c.get('i', 0) % 6]
        tone = np.concatenate([blip(1318, 0.07, 0.0), blip(1976, 0.12, 0.0)])
        sfx.add(tone, t0, 0.22, pan)
        sfx_verb.add(tone, t0, 0.12)
    elif ty == 'glitch':
        small = c.get('small')
        d = 0.12 if small else 0.32
        x = np.zeros(int(d * SR))
        k = 0
        while k < len(x):
            seg = int(SR * (0.012 + 0.02 * rng.random()))
            n = len(x[k:k + seg])
            src = square(rng.uniform(80, 900), (seg + 4) / SR)[:n] * 0.5 + noise((seg + 4) / SR)[:n] * 0.4
            src = np.round(src * 6) / 6                      # bit-crush
            x[k:k + n] = src * (1 if rng.random() > 0.25 else 0)
            k += seg
        x = hp(x, 150) * np.linspace(1, 0.3, len(x))
        sfx.add(x, t0, 0.3 if small else 0.45)
    elif ty == 'suck':
        d = B(1.05)
        x = sweep_filter(noise(d), 'lp', lambda u: 300 + 7000 * u ** 2) * np.linspace(0, 1, int(d * SR)) ** 3
        sfx.add(x, t0, 0.5)
    elif ty == 'pop':
        x = blip(900 + 60 * c.get('note', 0), 0.09, 0.55)
        sfx.add(x, t0, 0.38)
        sfx_verb.add(x, t0, 0.2)
    elif ty == 'pulse':
        sfx.add(sub_drop(0.35, 120, 60), t0, 0.35)
    elif ty == 'zoom':
        d = c['to'] - t0
        sfx.add(whoosh(d, 200, 9000, peak=0.9), t0, 0.7)
    elif ty == 'impact':
        big = c.get('big')
        sfx.add(sub_drop(1.6, 120, 30), t0, 0.95)
        x = lp(noise(1.2), 4500) * np.exp(-tt(1.2) / 0.22)
        sfx.add(x, t0, 0.45)
        sfx_verb.add(x, t0, 0.5)
        sfx.add(kick(big=True), t0, 0.9)
        kick_times.append(t0)
        sfx.add(crash(), t0, 0.5)
    elif ty == 'blip':
        scale = [65, 68, 70, 72, 75, 77, 80, 84]
        x = fm_bell(scale[c['note']], 0.8)
        sfx.add(x, t0, 0.42, pan=-0.4 + 0.8 * c['note'] / 7)
        sfx_verb.add(x, t0, 0.35)
    elif ty == 'whoosh':
        dr = c.get('dir', '')
        d = 0.5 if dr in ('zoom', 'in') else 0.38
        x = whoosh(d, 250, 6000 if dr != 'soft' else 3000, peak=0.6)
        sfx.add(np.vstack([x * np.linspace(1.2, 0.4, len(x)), x * np.linspace(0.4, 1.2, len(x))]), t0 - 0.12, 0.45 if dr != 'soft' else 0.25)
    elif ty == 'scramble':
        d = c.get('dur', 0.5)
        for k in range(int(d * 32)):
            sfx.add(click_tr(rng.uniform(1800, 5200), 0.008), t0 + k / 32, 0.1, pan=rng.uniform(-0.5, 0.5))
    elif ty == 'tick':
        x = click_tr(3200 + 120 * (c.get('k', 0) % 8), 0.012)
        sfx.add(x, t0, 0.16, pan=rng.uniform(-0.2, 0.2))
    elif ty == 'popcascade':
        n, d = c['n'], c['dur']
        for k in range(n):
            x = blip(700 + 40 * k, 0.06, 0.5)
            sfx.add(x, t0 + d * k / n, 0.14, pan=rng.uniform(-0.6, 0.6))
    elif ty == 'countroll':
        n, d = c['n'], c['to'] - t0
        for k in range(n):
            sfx.add(click_tr(2000 + 90 * k, 0.01), t0 + d * k / n, 0.11, pan=0.2 * np.sin(k))
    elif ty == 'ding':
        x = fm_bell(84, 1.2, index=1.2, ratio=3.5, tau=0.5) + fm_bell(91, 1.2, index=0.8, ratio=2.0, tau=0.45) * 0.5
        sfx.add(x, t0, 0.35)
        sfx_verb.add(x, t0, 0.3)
    elif ty == 'shuffle':
        d = c.get('dur', 0.6)
        for k in range(22):
            g = bp(noise(0.03), 2000, 7000) * np.exp(-tt(0.03) / 0.008)
            sfx.add(g, t0 + d * k / 22, 0.12, pan=rng.uniform(-0.7, 0.7))
    elif ty == 'swish':
        sfx.add(hp(whoosh(0.22, 1500, 7000, peak=0.4), 1200), t0 - 0.03, 0.2, pan=0.3)
    elif ty == 'drop':
        t = tt(0.08)
        x = np.sin(2 * np.pi * np.cumsum(420 - 200 * (1 - np.exp(-t / 0.01))) / SR) * np.exp(-t / 0.02)
        cl = click_tr(2400, 0.008) * 0.4
        x[:len(cl)] += cl
        sfx.add(x, t0, 0.2, pan=0.35)
    elif ty == 'seat':
        sfx.add(blip(1200 + 45 * c.get('k', 0), 0.05, 0.3), t0, 0.14, pan=rng.uniform(-0.4, 0.4))
    elif ty == 'click':
        x = np.concatenate([click_tr(1500, 0.006), np.zeros(int(0.03 * SR)), click_tr(2600, 0.006) * 0.7])
        sfx.add(x, t0, 0.5)
    elif ty == 'success':
        x = np.zeros(int(0.7 * SR))
        a, b2 = fm_bell(84, 0.5, 0.8, 2.0, 0.2), fm_bell(91, 0.6, 0.8, 2.0, 0.25)
        x[:len(a)] += a
        o = int(0.09 * SR)
        x[o:o + len(b2)] += b2[:len(x) - o]
        sfx.add(x, t0, 0.32)
        sfx_verb.add(x, t0, 0.25)
    elif ty == 'error':
        d = 0.32
        x = lp(square(146.8, d) + square(155.6, d), 1800) * adsr(d, 0.005, 0.06) * 0.35
        x2 = np.concatenate([blip(740, 0.11, 0.05), blip(587, 0.16, 0.05)])
        sfx.add(x, t0, 0.5)
        sfx.add(x2, t0 + 0.05, 0.25)
    elif ty == 'swoosh':
        sfx.add(whoosh(0.35, 400, 4000, peak=0.5), t0, 0.3, pan=-0.2)
    elif ty == 'scan':
        d = c['to'] - t0
        t = tt(d)
        f = 700 + 500 * np.abs(np.sin(np.pi * t / d * 1.0))
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 28 * t)) * adsr(d, 0.05, 0.1)
        sfx.add(x, t0, 0.07)
    elif ty == 'stamp':
        t = tt(0.25)
        th = np.sin(2 * np.pi * np.cumsum(120 - 60 * (1 - np.exp(-t / 0.03))) / SR) * np.exp(-t / 0.07)
        slap = bp(noise(0.25), 300, 2500) * np.exp(-t / 0.02)
        x = np.tanh(2 * (th + slap * 0.8))
        sfx.add(x, t0, 0.6)
        sfx_verb.add(x, t0, 0.25)
    elif ty == 'notif':
        for k, m in enumerate([79, 84, 88]):
            x = fm_bell(m, 0.5, 0.6, 2.0, 0.18)
            sfx.add(x, t0 + k * 0.07, 0.2, pan=0.5)
    elif ty == 'lightup':
        for k, m in enumerate([68, 72, 75, 80, 84, 87]):
            x = fm_bell(m, 0.6, 0.9, 3.0, 0.2)
            sfx.add(x, t0 + k * 0.035, 0.16, pan=-0.6 + 0.24 * k)
            sfx_verb.add(x, t0 + k * 0.035, 0.18)
        sfx.add(hp(whoosh(0.5, 2000, 10000, peak=0.3), 1500), t0, 0.25)
    elif ty == 'type':
        x = bp(noise(0.02), 1800, 6000) * np.exp(-tt(0.02) / 0.004)
        cl = click_tr(rng.uniform(2500, 3500), 0.006) * 0.5
        x[:len(cl)] += cl
        sfx.add(x, t0, 0.2, pan=rng.uniform(-0.25, 0.25))
    elif ty == 'whip':
        d = c['to'] - t0 + 0.08
        x = whoosh(d, 200, 7000, peak=0.55, bw=1.4)
        pan_l = np.linspace(1.25, 0.35, len(x)) if c.get('i', 0) % 2 else np.linspace(0.35, 1.25, len(x))
        sfx.add(np.vstack([x * pan_l, x * (1.6 - pan_l)]), t0, 0.5)
    elif ty == 'riser':
        pass  # scored in score()


def reverb(x, rt60=1.8, predelay=0.022, damp=5500, wet=1.0):
    n = int(rt60 * SR)
    t = np.arange(n) / SR
    decay = np.exp(-t * 6.9 / rt60)
    irs = []
    for ch in range(2):
        ir = rng.standard_normal(n) * decay
        ir = lp(ir, damp)
        ir = np.concatenate([np.zeros(int(predelay * SR)), ir])
        irs.append(ir / np.sqrt(np.sum(ir ** 2)))
    y = np.vstack([signal.fftconvolve(x[0], irs[0])[:N], signal.fftconvolve(x[1], irs[1])[:N]])
    return hp(y, 180) * wet


def pingpong(x, time=B(0.75), fb=0.38, n=4):
    y = np.zeros_like(x)
    d = int(time * SR)
    mono = x.mean(axis=0)
    for k in range(1, n + 1):
        ch = k % 2
        g = fb ** (k - 1) * 0.6
        y[ch, k * d:] += mono[:N - k * d] * g
    return lp(y, 3500)


def sidechain_curve(times, depth=0.62, tau=0.11):
    g = np.ones(N)
    t = np.arange(N) / SR
    for tk in sorted(times):
        i0 = int(tk * SR)
        i1 = min(N, i0 + int(0.6 * SR))
        if i0 >= N:
            continue
        dt = t[i0:i1] - tk
        att = np.minimum(1, dt / 0.004)
        red = 1 - depth * np.exp(-dt / tau) * att
        g[i0:i1] = np.minimum(g[i0:i1], red)
    return g


def master_chain(mix, ref=None):
    """EQ → peak-knee soft clip → true-peak limiter. `ref` reuses another mix's
    pre-gain so stems keep their exact level relative to the full mix."""
    mix = hp(mix, 36)
    mix = shelf(mix, 110, -3.0, 'low')     # tame sub energy phones can't play anyway
    mix = shelf(mix, 3800, +3.0, 'high')   # presence / air
    pre = ref if ref is not None else 0.9 / np.percentile(np.abs(mix), 99.97)
    mix = mix * pre
    a = np.abs(mix)
    knee = 0.8
    mix = np.where(a < knee, mix, np.sign(mix) * (knee + (1 - knee) * np.tanh((a - knee) / (1 - knee))))
    # lookahead limiter with true-peak (4x oversampled) detection → -1.5 dBTP
    thr = 10 ** (-1.5 / 20)
    up = signal.resample_poly(mix, 4, 1, axis=1)
    peak = np.max(np.abs(up), axis=0).reshape(-1, 4).max(axis=1)[:N]
    env = maximum_filter1d(peak, size=int(0.006 * SR) * 2 + 1)
    g = np.minimum(1.0, thr / np.maximum(env, 1e-9))
    g = uniform_filter1d(g, size=int(0.004 * SR))
    mix = mix * g
    # fade the last 250 ms to silence (clean loop point) and ensure 0 at start
    f = int(0.25 * SR)
    mix[:, -f:] *= np.linspace(1, 0, f) ** 2
    mix[:, :64] *= np.linspace(0, 1, 64)
    tp = np.max(np.abs(signal.resample_poly(mix, 4, 1, axis=1)))
    return mix * min(1.0, thr / tp), pre


def write_wav(path, x):
    pcm = (np.clip(x.T, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('wrote', path, f'{x.shape[1] / SR:.2f}s', 'peak', round(float(np.max(np.abs(x))), 3))


def main():
    cues = json.load(open(os.path.join(HERE, 'cues.json')))['cues']
    score()
    for c in cues:
        sfx_for(c)

    sc = sidechain_curve(kick_times)
    music.x *= sc
    delay_send.x *= sc
    sfx_wet = reverb(sfx_verb.x) * 0.55
    wet = reverb(verb_send.x) * 0.55 + pingpong(delay_send.x) * 0.5

    full = music.x * 0.9 + drums.x * 0.85 + sfx.x * 0.8 + wet + sfx_wet
    full_m, pre = master_chain(full)
    write_wav(os.path.join(HERE, 'soundtrack_premaster.wav'), full_m)
    # Sound-design-only stem at the same relative level (for use under IG library music).
    sfx_m, _ = master_chain(sfx.x * 0.8 + sfx_wet, ref=pre)
    write_wav(os.path.join(HERE, 'sfx_only_premaster.wav'), sfx_m)


if __name__ == '__main__':
    main()
