# HMSNow — Instagram reel (9:16, 30 s)

A 30-second motion-graphics reel for **HMSNow** (hospital and clinic management by iNeed.now), made for the **@ineednow_** Instagram page.

| File | What it's for |
| --- | --- |
| `export/HMSNow_reel_1080x1920.mp4` | **Post this one.** 1080×1920, 30 fps, H.264 + AAC. Includes the original music and sound design, mastered to −14 LUFS. |
| `export/HMSNow_reel_1080x1920_sfx-only.mp4` | The same video with the sound effects but no music. Use it if you'd rather add a trending track from Instagram's music library. |
| `export/HMSNow_reel_cover.jpg` | Cover image (the end card). It stays readable in the profile grid's 3:4 crop. |

The music and sound effects are synthesized from scratch in `audio/soundtrack.py`, with no samples and no stock tracks, so there are no licensing issues.

## Storyboard

| Time | Scene | Message |
| --- | --- | --- |
| 0–3 s | Notifications pile up in a dark room while the headline asks: *Paper charts? Spreadsheets? Sticky notes? Too many apps? Sound familiar?* Everything then implodes into one orange square. | The pain of running a clinic without a system |
| 3–5 s | The square slams down and bursts into the iNeed.now mark, and the **HMSNow** name lands. | The brand reveal |
| 5–8.5 s | The logo's squares become the first tiles of the module map. A counter runs up to **37 modules, one login**. Filled tiles are the core groups; hollow tiles are the add-ons, which light up with their prices. | All in one system, and you pay only for what you need |
| 8.5–9 s | Every tile collapses into the hollow square, and the camera flies through it into the product. | |
| 9–18 s | One patient's journey, filmed as a single camera move with whip pans across 8 live panels: **Book → Check-in → Treat → Dental → Diagnose → Dispense → Bill → Grow**. It ends by pulling back in 3D to show everything connected. | Appointments, queue, SOAP/ICD-10, odontogram, lab and imaging, FEFO pharmacy, invoices and claims, accounting |
| 19–23 s | An orange flood turns into a padlock, followed by **Forced 2FA**, the **chart access log**, and **every role**. | Security by default |
| 23–25 s | Greetings flash past: *Hello · Salam · Merhaba · Привет · Salom*, followed by **5 languages**. | EN / AZ / TR / RU / UZ |
| 25–30 s | *Everything your clinic needs. **Now.*** The mark reassembles, the cursor clicks **Book a demo**, and the end card shows **www.ineed.now** and **@ineednow_**. | Call to action |

All key text stays inside the Reels safe area, clear of the header and the caption and button overlays.

## How it's built

- `src/` holds the animation as a web page (HTML/CSS plus [GSAP](https://gsap.com) timelines), one file per scene in `src/scenes/`. You can preview it in a browser in real time.
- `scripts/render.mjs` renders every frame deterministically in headless Chromium. Each output frame blends 8 sub-frames across a 180° shutter, which gives real motion blur. The frames are rendered in parallel.
- `audio/soundtrack.py` generates a 120 BPM track that resolves from A minor to C major. It places about 170 sound-effect cues (whooshes, UI clicks, the stamp, 2FA beeps and so on), which the animation exports to `audio/cues.json`, so picture and sound stay in sync.
- `scripts/encode.sh` masters the audio (two-pass EBU R128 loudness normalization) and encodes the MP4s with BT.709 colour.

## Edit and re-render

```bash
npm install                      # gsap, playwright, sharp, fonts
npx http-server -c-1 .           # then open http://localhost:8080/src/index.html  (space = pause, ←/→ = step)

node scripts/stills.mjs out 12.5 29     # render single frames to check a change
node scripts/render.mjs                  # all 900 frames with motion blur → render/frames (≈9 min on 4 cores)
scripts/encode.sh                        # soundtrack + MP4s + cover → export/
```

`encode.sh` needs `ffmpeg` with libx264 on the `PATH` (or set `FFMPEG=...`). Python needs `numpy` and `scipy`.

The copy lives in the scene files. For example, the call-to-action button text and the URL are in `src/scenes/cta.js`, and the step titles are in the `STEPS` list in `src/scenes/journey.js`. The brand colour `#FE4D1E` was sampled from the logo, and the logo geometry (square size, gaps, the hollow square's stroke and corner radii) was measured from the original artwork.
