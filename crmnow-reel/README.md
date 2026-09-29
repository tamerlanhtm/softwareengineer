# CRMNow — Instagram Reel (30 s · 9:16)

Motion-graphics promo for **CRMNow**, the sales CRM by **ineed.now**. It's built for the **@ineednow_** Reels feed.

| File | What it is |
| --- | --- |
| `out/crmnow-reel.mp4` | The Reel: 1080×1920, 30 fps, H.264 High + AAC 256 kbps, 30.0 s |
| `out/cover.png` | Cover frame for the Reel (the end card, which reads well in the 3:4 profile-grid crop) |
| `out/soundtrack.wav` | Original soundtrack, 48 kHz stereo, synthesized from scratch (no samples, no licensing) |

## Storyboard

Music: 128 BPM. 16 bars = exactly 30 s. Every cut, click, stamp and whoosh lands on the beat grid.

| Time | Scene | On screen |
| --- | --- | --- |
| 0.0–3.8 | Hook | "I need … more leads / closed deals / paid invoices / real numbers / less busywork … everything. **Now.**" The spreadsheet-and-missed-call chaos gets sucked into the dot as the words collapse into **ineed.now** |
| 3.8–5.6 | Logo | The dot floods the screen. The 3×3 mark assembles, **CRMNow** rises, then the camera dives through the hollow square into the product |
| 5.6–9.4 | Leads & Contacts | Leads stream in from Website / Instagram / Referral / Event / Cold call. The hot lead is qualified, and **Convert** splits it into a contact and a deal |
| 9.4–13.1 | Deals & Pipelines | The deal is dragged through the six-stage board while the weighted forecast climbs. It lands in **Won** with a burst |
| 13.1–16.9 | Quotes · Invoices · Payments | The quote builds itself (discount + tax) and is accepted. It flips in 3D into an invoice, a bank transfer and a card payment land, and it's stamped **PAID** |
| 16.9–20.2 | Reporting & Analytics | KPI tiles, the revenue curve, the funnel and lead sources update live (+1 lead), then a CSV export |
| 20.2–22.5 | Workflow Automation | When a deal is won → if it's over $5,000 → an invoice is created and the team is notified. The run history ticks up |
| 22.5–24.8 | All-in-one | **21 modules · 4 languages (Hello / Salam / Merhaba / Привет) · 1 workspace**. The tiles fly into the logo |
| 24.8–30.0 | End card | "Everything you need. **Now.**" → **14-day free trial** → **www.ineed.now** (tapped) → "Try the demo account" · "DM @ineednow_" |

Key copy stays inside Instagram's safe zone: y ≈ 260–1480 px, clear of the right-hand action buttons and the caption area.

## How it's made

- `src/` is an HTML/CSS/JS composition on a 1080×1920 stage. A small deterministic engine (`src/engine.js`) renders every frame as a pure function of time, and each scene lives in its own file (`src/scenes/*.js`). Fonts are Inter / Inter Tight / JetBrains Mono, and icons are Lucide (all open-source). The logo is rebuilt as vectors from the supplied artwork (brand orange `#FE4D1E`).
- `scripts/render.mjs` drives headless Chromium frame by frame. It renders **real motion blur**: 4–40 sub-frames per frame (more on fast moves such as the whip-pan and the zoom-through), averaged in linear light over a 180° shutter.
- `scripts/soundtrack.py` synthesizes the music and every sound effect (drums, pumping bass, supersaw chords, plucks, bells, risers, impacts, UI clicks) with numpy/scipy. It places each effect on the cue list exported by the composition, then mixes and masters it to about −11 LUFS.

## Preview / edit / re-render

```bash
npm install
node scripts/serve.mjs 8080          # open http://127.0.0.1:8080/src/index.html  (▶ play / scrub, no audio)
node scripts/shots.mjs out/stills 7.5 12.2 27.5   # PNG stills at given times
bash scripts/build.sh                # full render -> out/crmnow-reel.mp4 + cover (needs ffmpeg with libx264,
                                     # python3 + numpy + scipy; ~6 min on 4 cores)
```

All on-screen copy is plain text in the scene files. For example, the offer, the URL, the handle and the headline are in `src/scenes/endcard.js`, and the hook phrases are in `src/scenes/hook.js`.
