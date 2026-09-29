# BMSNow reel soundtrack: notes

Rendered by `scripts/audio.py` from `out/cues.json` (153 cues). Everything is synthesized with numpy/scipy, with no samples. The output is deterministic: two renders produce byte-identical files (same md5), and a full render takes about 21 s.

```
python3 scripts/audio.py                    # out/audio.wav + out/stems/{music,sfx}.wav
python3 scripts/audio.py --report           # + spectrum*.png, waveform.png, timeline.png, metrics.json
python3 scripts/audio.py --sfx-gain 2 --music-gain -1   # rebalance (dB); master re-normalises to -14 LUFS
```
Other flags: `--target-lufs`, `--true-peak`, `--cues`, `--out`, `--verbose` (prints per-part and per-cue levels).

## Final numbers (out/audio.wav)
| | |
|---|---|
| Format | 48 kHz, 16-bit PCM, stereo, 1,440,000 samples (30.000 s); stems have the same format |
| Integrated loudness | **-14.0 LUFS** (ffmpeg ebur128), LRA 4.8 LU |
| True peak | **-1.3 dBTP** (ffmpeg); sample peak -1.31 dBFS |
| Dynamics processing | Glue compression and the limiter each reach at most 2.1 dB of gain reduction |
| DC / phase | DC about 4e-5; L/R correlation 0.90 overall and 0.99-1.00 below 150 Hz (the low end is mono) |
| Tail | Momentary loudness is -23.5 LUFS at 29.5 s and -34.3 LUFS at 29.8 s; the last 10 ms peak at -90 dBFS; clean loop point |

Section loudness (LUFS): hook -17.2, drop 1 -12.9, groove -14.5 to -15.8, build -13.8 (momentary rises -17.5 → -9.7), **drop 2 -10.4 (loudest)**, CTA -13.5, end card -11.9, final bar -17.4.

## Arrangement
120 BPM, F minor. The loop is Fm-Db-Ab-Eb at one chord per bar from the 2.0 drop; the hook sits on Eb, and the build uses Db→Eb→Fm into drop 2. The CTA resolves to the relative major: Db (26) → **Ab on the "Now." slam (27.0)** → Db/Eb (28/28.5) → final Ab add9 hit at 29.0.
- **0-2 hook:** low-passed kick (0/0.5/1.0), dark pad swell, and a pluck teaser that goes from 8ths to 16ths as its filter opens.
- **2.0 drop 1:** full kit, crash, supersaw stab, sidechained sub plus mid bass, detuned pad (Haas-widened), and a 16th pluck arp with dotted-8th ping-pong delay.
- **4-22 groove:** open hats from 8 s; shaker, rolling 16th bass and a higher arp pattern from 12 s; light crashes at 12/16/20; fills ending on 12 (snare), 16 (toms) and 20 (32nd snare).
- **22-24 build:** snare roll (8ths → 16ths → 32nds, rising pitch), a high-pass sweep on the bass, pad and arp, a riser, and a 60 ms silent breath at 23.935.
- **24 drop 2:** stabs, kick and crashes locked to the slams at 24.0, 24.5 and **24.96** (moved off 25.0 to avoid a flam); octave-doubled arp.
- **26-30 CTA:** a second 60 ms breath before 27.0, the end-card groove, a fill into the final hit at 29.0, and nothing new after that.

**Kick times** (also `kick_times` in metrics.json):
- 0.0, 0.5, 1.0, low-passed; no kick at 1.5.
- Every 0.5 s from 2.0 through 23.0; **no kick 23.0-24.0**.
- 24.0, 24.5, 24.96, 25.5.
- 26.0, 26.5, 27.0, 27.5, 28.0, 28.5.
- Final hit at 29.0.

Claps land on beats 2 and 4, from 2.5 to 21.5 and then at 24.5, 25.5, 26.5, 27.5 and 28.5.

## SFX design
Every cue starts exactly at `round(t*48000)`; the median measured onset is 3 samples, which is just the attack ramp. Risers and reverse swells are generated exactly `dur` long, so they peak at t+dur. Each cue's randomness is seeded from its own type, time and occurrence, so adding a cue never changes the sound of the others.

| type | synthesis |
|---|---|
| impact | 125→50 Hz sine boom (saturated), 105 Hz punch, low-passed noise body, noise crack, rumble, 1.4 s noise-IR tail |
| burst | bright high-passed noise burst + 70 pentatonic sine "shimmer" grains (random pan) + small whump |
| thump | 100→52 Hz saturated sine, 85 ms decay, soft noise body |
| pop | sine/triangle blip, pitch drops 2.3x→1x within ~10 ms, 32 ms decay (`pitch` scales 560 Hz) |
| tick | 32 ms glassy blip: 3.4 kHz x `pitch` + inharmonic partial + tiny noise click |
| click | press + release (42 ms apart): band-passed noise click + short tonal body |
| swish / whoosh | noise through a band-pass whose centre follows the envelope, with an L→R or R→L pan sweep; whoosh adds rumble and air. Pitch, filter range, peak position, Q and direction are randomised per cue (seeded) |
| riser | band-pass noise sweep (350 Hz→7.7 kHz) + detuned saws rising 1-2 octaves with an opening low-pass; exponential swell, hard stop at t+dur |
| ding | two additive bell tones, Ab5 then C6 75 ms later (a major third), inharmonic partials, plate send |
| type | jittered keystrokes (~75 ms apart): click + short "thock" body |
| stamp | 125→48 Hz thud + mid slap + paper crack + small room |
| lock | two metallic clicks (4 inharmonic partials each), the second higher, plus a clunk |
| count | tick train that eases from 30/s to 12/s with slightly rising pitch; accented last tick |
| glitch | random square/noise/saw slices, sample-and-hold decimation, bit-crush, repeats and pan jumps |
| sub | 808-style sine, fast punch then 98→46 Hz drop, saturated for phone-audible harmonics |
| reverse | reversed synthetic cymbal (noise + metallic squares) swelling to t+dur |
| shutter | click → band-passed "flap" → second click 36 ms later |

**Mix:** the music "bed" ducks 3 dB × gain on impacts, up to 2.5 dB on whooshes, and 1.5-2.5 dB on risers, stamps and subs. On top of that, a dynamic EQ (STFT-based, keyed by the SFX bus) cuts the music by 2-3 dB only in the bands a sound occupies (the average cut at 200 Hz-8 kHz is 1.7 dB). The stabs, crashes and final chord that land with the slams are never ducked. On the verbose audibility check, most SFX types sit +6 to +23 dB above the music in their own band; ticks sit around +2 dB, which reads as light sparkle, as requested.

**Master:** mono below 120 Hz, 22 Hz high-pass, -1.5 dB low shelf at 75 Hz, glue compressor (1.6:1), soft clip, then a 4 ms look-ahead true-peak limiter (4x oversampled detection) with loudness normalisation to -14 LUFS. After that come the 5 ms fade-in, the 0.3 s fade-out and TPDF dither.

## Flags
- **Stems:** these are the pre-master buses after ducking and unmasking, so `music + sfx` equals the master input. Rebalancing them in an editor keeps the music dips under the SFX. For a clean rebalance, re-run the script with `--music-gain` / `--sfx-gain` instead.
- **Masked cues:**
  - The build ticks (22.2-23.5 s) are partly covered by the snare roll and riser (the weakest measure -10 dB in their band).
  - The single `type` cue at 16.14 (gain 0.35) measures -2 dB in its band.

  Raise their `gain` in the cue sheet if they must read.
- **Low end:** the 40-80 Hz band is EDM-strong; drop 2 stacks three impacts and a sub. Phone speakers get the 100 Hz+ punch and crack layers instead.
- **Ending:** it resolves to Ab major, not F minor, as a brighter end-card lift. The loop back to the 0.0 impact is clean.
