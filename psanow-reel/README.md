# PSANow — Instagram Reel (9:16, 30 s)

A 30-second motion-graphics promo for **PSANow** (Professional Services Automation by
[ineed.now](https://www.ineed.now)), made for the `@ineednow_` Instagram page.

**Deliverables (`out/`)**

| File | What it is |
| --- | --- |
| `psanow-reel.mp4` | Final reel: 1080×1920, 30 fps, H.264 High, AAC 48 kHz, with the original soundtrack |
| `psanow-reel-no-music.mp4` | Same cut without audio, so you can add a trending track in Instagram |
| `psanow-soundtrack.wav` | The soundtrack on its own (24-bit, −12 LUFS) |
| `cover-*.png` | Four cover-frame options for the Reel/grid thumbnail (logo, 45 modules, 0 paid add-ons, CTA) |
| `caption.txt` | Ready-to-paste caption |

## Storyboard

| Time | Beat | On screen |
| --- | --- | --- |
| 0–4 s | Hook | "Still running your firm on spreadsheets?" over a glitching 3D spreadsheet; four pain points slam in, then everything implodes into one orange square |
| 4–6 s | Drop | The square explodes into the logo grid; the last square punches its hollow; **PSANow** wordmark + tagline |
| 6–12 s | Journey | The camera dives through the hollow square. *Sell it. Plan it. Staff it. Track it. Bill it. Grow it.*: one orange token travels from a won deal, to a Gantt bar, to a resource allocation, to an approved timesheet, to an invoice total, to a profit bar |
| 12–19 s | Scale | 45 module tiles burst out and count up; the 10 groups light up; the tiles flip, and "45 modules" rolls to **"0 paid add-ons"**, then "Everything's included." |
| 19–22 s | Trust | Forced 2FA, 5 languages (EN · AZ · TR · RU · UZ), multi-currency |
| 22–30 s | CTA | "Everything your firm needs." then **"Now."**, then a white flood into the logo lockup, *Book a demo*, **www.ineed.now**, @ineednow_ |

Brand: the logo is rebuilt as vector from the supplied mark (8 filled squares + 1 hollow square,
gap = 0.5 × square, corner radius 18 %). Colour `#FE4D1E`. Type: Unbounded (display), Inter Tight
(headlines), Inter (UI), JetBrains Mono (labels). All of these fonts support Azerbaijani, Turkish and Cyrillic.

Everything shown matches the PSA spec: 45 modules in 10 groups, all base, no paid add-ons,
forced 2FA, 5 languages, multi-currency rate cards and exchange rates. No "coming soon" integrations are claimed.
The client names and amounts in the UI mock-ups are made up.

## How it's built

- `src/`: the composition is a single HTML page (1080×1920). Every frame is a pure function of
  time: `window.renderAt(t)`. There are no CSS animations, so any frame can be rendered at any time.
  - `js/engine.js`: easing, springs, keyframes, deterministic noise, camera shake and flashes
  - `js/scenes/0*.js`: one file per scene
- `scripts/render.mjs`: renders frames with parallel headless Chromium workers and **real motion
  blur**. Each frame averages 6 sub-frames over a 180° shutter. Fast frames are detected
  automatically and re-rendered with 24 sub-frames.
- `scripts/audio.py`: procedural soundtrack and sound design (120 BPM, A minor). Synths, drums, risers,
  impacts and UI sounds are all synthesised in NumPy and placed on the same timeline as the visuals.
- `scripts/build.sh`: the full pipeline. It renders the frames, the soundtrack and the loudness
  normalisation, then encodes the MP4s and exports the covers.

```bash
npm install                      # fonts, playwright, sharp
pip install numpy scipy          # audio
./scripts/build.sh               # ~15 min on 4 cores; outputs to out/
```

Dev helper for checking frames: `node scripts/stills.mjs sheet.png 5 0.3 4.0 6.5 12.2` renders
the given timestamps into a contact sheet.
