# BMSNow: Instagram Reel (9:16, 30 s)

A 30-second motion-graphics reel for **@ineednow_** introducing BMSNow, the
all-in-one booking and business system for salons, studios and clinics.
The video ends on **www.ineed.now**.

| File | What it is |
| --- | --- |
| `out/bmsnow-reel.mp4` | Final video: 1080×1920, 30 fps, H.264 High, AAC 48 kHz, with the synced soundtrack |
| `out/bmsnow-reel-silent.mp4` | Same picture with no audio, for adding a track from Instagram's music library |
| `out/bmsnow-reel-az.mp4`, `out/bmsnow-reel-az-silent.mp4`, `out/cover-az.jpg` | Azerbaijani version: same animation, timing and soundtrack |
| `out/cover.jpg` | Cover frame (end card). It stays readable in the 3:4 profile-grid crop |

## Storyboard (120 BPM, every cut on a bar downbeat)

The logo's 9 squares stand for the 9 module groups. A mini logo in the top-left
corner lights up one square per group, so by the end the viewer has "built" the logo.

| Time | Scene |
| --- | --- |
| 0:00 | Hook: "Run a salon? / studio? / clinic?" |
| 0:02 | The pill collapses into a square, which explodes into the logo. The 9th square punches its hole, then the camera flies through it |
| 0:04 | 01 Bookings & Calendar: a client books on the public booking page, the booking flies into the staff calendar, and a cancellation brings up a waitlist match |
| 0:08 | 02 Clients: client card with notes, then a consent form that is signed and locked |
| 0:10 | 03 Catalogue: services, packages, memberships, gift cards, retail and resources fan out like cards |
| 0:12 | 04 Staff: weekly schedule with split shifts, a leave approval, and a tiered commission |
| 0:14 | 05 Finance: invoice with deposit and tip, a PAID stamp, then a daily cash-up with zero variance |
| 0:16 | 06 Accounting: balanced journal entry, P&L, and September closed and locked |
| 0:18 | 07 Messaging: email reminder template (merge tag resolves) and the message log (sent / consent skip / retry) |
| 0:20 | 08 Reporting & Analytics: KPIs, revenue by day, retention line, top staff |
| 0:22 | 09 Management & Security: module grants per department, 5 languages |
| 0:24 | "9 groups" → "37 modules" → "0 paid add-ons". The "0" shrinks into the hollow logo square |
| 0:26 | End card: logo, "Everything you need. Now.", www.ineed.now, DM @ineednow_ |

Everything shown comes from the BMS module registry. Features marked *coming soon*
(SMS & WhatsApp, payment gateways, API tokens, webhooks) are deliberately left out:
reminders are shown as email, and payments are recorded as cash, card or transfer.
Department module counts (16 / 10 / 15 / 11 / 37) are taken from `config/departments.php`.
The people, prices and numbers in the UI mockups are sample data.

## How it's made

The whole video is one HTML page (`index.html` + `src/`) driven by a single paused
GSAP timeline. `window.__seek(t)` renders any moment deterministically.

- `src/scenes/*.js`: one file per scene. Each file adds its tweens to the master timeline and registers audio cues.
- `src/lib.js`, `src/ui.js`: helpers (vector logo rebuilt from the brand file's geometry, masked headlines, chips, counters, phone mockup).
- `scripts/render.mjs`: headless Chromium renders each frame as the average of 8 sub-frames over a 180° shutter (16 during the fastest moves). This is real motion blur. Static frames are captured once.
- `scripts/audio.py`: synthesizes the whole soundtrack with numpy/scipy, using no samples. That's a 120 BPM F-minor track plus 18 kinds of sound effects placed sample-accurately from the 153 cues in `out/cues.json`, so every pop, stamp, whoosh and impact lands on its frame. It's mastered to −14 LUFS with a −1.3 dBTP true peak. Details are in `out/audio_report/NOTES.md`, and the background glow pulses on the soundtrack's kicks.
- `scripts/encode.sh`: BT.709-tagged H.264 encode, so the brand orange (#FE4D1E) survives.

```bash
npm install                      # gsap, fonts (Unbounded, Inter), lucide icons, playwright, sharp
node scripts/snap.mjs /tmp/stills 4.5 12 27   # preview stills at given seconds
node scripts/cues.mjs            # dump audio cue sheet -> out/cues.json
python3 scripts/audio.py         # soundtrack -> out/audio.wav
node scripts/render.mjs          # frames -> out/frames (add --from/--to to re-render a range)
scripts/encode.sh                # -> out/bmsnow-reel.mp4, out/bmsnow-reel-silent.mp4, out/cover.jpg
```

For a live preview, serve the folder (for example `npx http-server .`) and open
`index.html?play`, or `index.html?t=12.5` for a single moment.

## Languages

All on-screen text goes through `src/i18n.js`. Render the Azerbaijani version with
`LANG_REEL=az node scripts/render.mjs --out out/frames_az && LANG_REEL=az scripts/encode.sh`,
or preview it at `index.html?lang=az`. Adding a language means adding a dictionary there.
