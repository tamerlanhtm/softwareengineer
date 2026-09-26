# PMSNow — 30s Instagram Reel (1080×1920)

Motion-graphics promo for **PMSNow** by **ineed.now** (for [@ineednow_](https://instagram.com/ineednow_)).
Everything — animation, 3D, music and sound design — is generated from code in this folder.

**Deliverables** (`deliverables/`)

| File | Use |
|---|---|
| `PMSNow_Reel_1080x1920.mp4` | Main upload — H.264 High, 30 fps, BT.709, AAC 48 kHz, original soundtrack |
| `PMSNow_Reel_1080x1920_sfx-only.mp4` | Same picture, sound effects only — lay a trending Instagram track underneath |
| `PMSNow_Reel_cover.jpg` | Reel cover (key content sits inside the 3:4 profile-grid crop) |

## Storyboard (128 BPM · 16 bars · every cut on the beat)

| Time | Beat | Scene |
|---|---|---|
| 0.0 – 3.8 s | 0–8 | **Hook** — "RUNNING A HOTEL?" → flood of real hotel problems (overbooking, dirty rooms, missing invoice…) → all sucked into one orange square |
| 3.8 – 5.6 | 8–12 | **Drop** — square explodes into the ineed.now mark, PMSNow wordmark; camera dives *through the hollow square* |
| 5.6 – 7.5 | 12–16 | 01 Dashboard — Occupancy / ADR / RevPAR / Revenue count up, chart draws (RevPAR = ADR × Occ) |
| 7.5 – 9.4 | 16–20 | 02 Reservations — tape chart, group & waitlist, a booking is dragged into room 305 with an auto rate quote |
| 9.4 – 11.3 | 20–24 | 03 Front desk — booking morphs into the check-in card: room rolls to 305, ID / deposit / reg-card, signature, *Checked in* |
| 11.3 – 13.1 | 24–28 | 04 Housekeeping — zoom out of room 305 onto the live room board, staff assigned, flip-wave to clean / inspected |
| 13.1 – 15.0 | 28–32 | 05 Billing & payments — on orange: folio builds, split bill tears it in two, PAID stamps (card / bank transfer) |
| 15.0 – 16.9 | 32–36 | 06 Night audit — circle-wipe to night, day closes itself, business date flips |
| 16.9 – 18.8 | 36–40 | 07 Guest CRM — ring becomes the guest avatar: VIP, loyalty, notes, stay count, 5★ from the in-room QR |
| 18.8 – 20.6 | 40–44 | 08 Languages — Welcome → Xoş gəlmisiniz → Hoş geldiniz → Добро пожаловать |
| 20.6 – 24.8 | 44–53 | **27 modules** — counter + all 27 modules (core vs add-ons) → 27 3D cubelets assemble into a 3×3×3 cube; a dolly-zoom flattens it until its front face *is* the logo |
| 24.8 – 30.0 | 53–64 | **CTA** — "Everything your hotel needs. **Now.**" · Book a demo · www.ineed.now · @ineednow_ |

The top-left HUD is a mini version of the mark: one square fills per feature scene, so after scene 08 it *becomes* the logo.

## How it works

* `index.html` + `src/` — the composition: HTML/CSS/SVG animated by **one paused GSAP timeline** plus pure
  functions of time (`onFrame`). Any frame can be rendered deterministically via `window.__seek(t)`.
  The cube is **three.js** (rounded cubelets, physical material, dolly-zoom camera).
* `scripts/render.mjs` — headless Chromium (Playwright) captures **4–8 sub-frames per frame** across a 180° shutter;
  `scripts/blend.py` averages them in linear light → real motion blur, adds soft film grain, encodes with ffmpeg.
* `audio/soundtrack.py` — the soundtrack is **synthesised from scratch** (no samples → no licensing issues):
  128 BPM, A minor (Am–F–C–G), two drops, plus ~200 sound effects. Their timings come from `out/cues.json`,
  which the composition exports while building its timeline — sound always follows picture.

## Edit & re-render

```bash
npm install                      # gsap, three, fonts (Unbounded, Inter, JetBrains Mono), lucide icons
./build.sh                       # ≈15 min on 4 cores → deliverables/
node scripts/snap.mjs --out preview 6.4 26.5   # quick stills of any timestamps
node scripts/check-tweens.mjs                  # lint: tweens that fight over the same property
```

To re-render only part of the film, delete those frames from `out/frames/` (`fNNNN_*.jpg`, NNNN = frame at 30 fps)
and run `./build.sh` again — existing sub-frames are reused.

* Copy lives in the scene files: `src/scenes/*.js` (e.g. CTA text / URL in `src/scenes/cta.js`).
* Brand: orange `#FF4D1F`; the mark is rebuilt as vectors from the brand PNG in `src/logo-mark.js`
  (128-unit squares, 24-unit corner radius, hollow square stroke 32, inner radius 6).
* Timing is on a beat grid: `b(n)` = beat *n* at 128 BPM (`src/lib.js`).

## Content notes

* Only shipped capabilities are shown. "Coming soon" items (Booking.com / Expedia / Airbnb sync, key cards,
  SMS/WhatsApp, payment gateways, door locks) are deliberately left out.
* No prices are shown. The module screen distinguishes *Core — included* from *Add-ons — as you grow*
  (Sales & Distribution, Operations, Revenue Centers).
* Names, figures and UI are illustrative mock-ups in the brand style, not screenshots of the live product.
