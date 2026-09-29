# ERPNow — 30s Instagram Reel (9:16)

A 30-second, 1080×1920 motion-graphics reel for **ERPNow by ineed.now**, built for the
[@ineednow_](https://www.instagram.com/ineednow_/) Instagram page.

| File | What it is |
| --- | --- |
| `out/ERPNow_Reel_30s.mp4` | **Upload this.** H.264 1080×1920 30 fps + AAC, with the original soundtrack |
| `out/ERPNow_Reel_30s_no-music.mp4` | Same video, silent, in case you want Instagram's trending audio instead |
| `out/ERPNow_Reel_cover.png` | Suggested Reel cover (logo reveal frame, safe for the 3:4 grid crop) |
| `out/ERPNow_Reel_endcard.png` | End-card frame (handy for Stories / a pinned post) |
| `out/ERPNow_Reel_soundtrack.wav` | The soundtrack on its own (-14 LUFS, -1 dBTP) |
| `CAPTION.md` | Ready-to-paste caption and hashtags |

## Storyboard

The story follows **one order through the whole system**: the same Nova Trading deal
(Q-1042 → SO-2207 → INV-3318, $4,484.00) shows up in sales, stock, payments and the ledger.

| Time | Scene | What happens |
| --- | --- | --- |
| 0.0–4.0 | Hook | **"I NEED …"**: the logo's hollow tile stretches into a slot machine that spins through business needs and lands on **"IT ALL."**, then **"NOW."** slams in. Its period becomes the orange tile. |
| 4.0–6.4 | Brand | The drop: the tile bursts into the ineed.now mark, **ERPNow**, "The all-in-one ERP for small business." |
| 6.4–10.0 | 8 groups | Logo tiles flip into the 8 module groups (add-ons tagged); the hollow tile counts up to **26 modules**. Camera dives into Sales. |
| 10.0–12.2 | Sales | Quotation → click → sales order → click → invoice. **"Quote. Order. Invoice. Done."** |
| 12.2–14.2 | Inventory | Live stock across 3 warehouses, low-stock alert, SO-2207 shipment, transfer fixes the alert. |
| 14.2–16.1 | Finance | INV-3318: Overdue → Partial (card) → Paid (bank transfer). **PAID** stamp. |
| 16.1–18.1 | Accounting | Auto-posted journal entry balances; trial balance / P&L / balance sheet; period closed & locked. |
| 18.1–20.1 | Analytics | Dashboard assembles: collections, receivables, open orders, low stock, 12-month chart, 3 pending approvals. |
| 20.1–21.8 | Procurement + HR | One-tap approvals: requisition → PO-0907, leave request. |
| 21.8–24.0 | Security + languages | Split-flap 2FA code verifies; roles orbit the shield; the same board says HELLO / SALAM / MERHABA / ПРИВЕТ. |
| 24.0–26.0 | Stats | **26 modules. 4 languages. 1 system.** on the beat, then implodes. |
| 26.0–30.0 | End card | Logo re-forms, **"Everything your business needs. Now."**, tap on **Request a demo**, **www.ineed.now**, **DM @ineednow_**. |

Key text stays inside Instagram's safe area (roughly y 280–1480 px), clear of the Reels UI.

## How it is made

Everything is code, so any word, colour or timing can be changed and the video re-rendered.

- `src/` is an HTML/CSS/JS composition. `src/engine.js` is a tiny deterministic animation
  engine (easing curves, springs, keyframes), and every frame is a pure function of time.
  Each scene lives in `src/scenes/NN-name.js`, and shared brand parts (logo tiles, kickers,
  headlines, tile-wave transition) live in `src/ui.js`.
- `tools/render.mjs` drives headless Chromium through Playwright frame by frame, running 4 browsers in parallel.
  Motion blur is real. It renders 6 sub-frames per output frame, or 12 inside the fast-motion windows each scene
  declares, and `tools/blend.py` averages them in float with a 180° shutter. Very fast moves such as whip pans,
  blinds, slams and the slot reel also get a velocity-driven directional blur, so they streak instead of strobing.
  Every segment is checked for an exact frame count.
- `tools/audio.py` synthesises the soundtrack from scratch (numpy/scipy): a 120 BPM A-minor → C-major
  track (Am–F–C–G). The sound effects (slams, whooshes, clicks, chimes, the split-flap
  clatter, the stamp) are placed from a cue sheet that the composition exports, so every sound
  lands on its frame. Mastered to -14 LUFS / -1 dBTP.
- The logo was rebuilt from the supplied mark with measured proportions: tile 2u, gap 1u,
  radius 0.186, hollow tile radius 0.317, stroke 0.25. Brand orange is `#FE4D1E`.
- Fonts: Inter / Inter Display and JetBrains Mono (SIL Open Font License), baked to static
  overlap-free instances by `tools/fonts.py`.

### Preview and edit

Open `src/index.html` in Chrome. You get a scrub bar, and Space plays with the soundtrack.
Common edits:

- **Call to action / URL / handle**: `src/scenes/11-cta.js`
- **Headlines**: the `K.headline(...)` call near the top of each scene file
- **Brand colours**: `K.C` in `src/ui.js` and the variables in `src/styles.css`

### Rebuild

Requirements: Node 18+, Python 3 with `numpy scipy pillow` (plus `fonttools brotli skia-pathops`
only if you regenerate the fonts), and ffmpeg (or `pip install imageio-ffmpeg`).

```bash
npm install                 # Playwright (uses an installed Chromium)
bash tools/build.sh         # ~15-20 min on 4 cores: cues -> soundtrack -> frames -> out/*.mp4 + covers
SUB=1 bash tools/build.sh   # fast draft without motion blur
node tools/render.mjs sheet 10 12 0.25   # contact sheet of a time range for quick review
```

## Posting tips

- Upload `ERPNow_Reel_30s.mp4` as a **Reel**, set `ERPNow_Reel_cover.png` as the cover, and
  paste the caption from `CAPTION.md`.
- In Instagram's settings turn on **Upload at highest quality** (Settings → Data usage and media quality).
- To use a trending sound instead, upload the `_no-music` file and add audio in the app.
  The cuts are on a 120 BPM grid, so most 120/128 BPM tracks will fit.
