# EMSNow — 30s Instagram Reel (9:16)

A 30-second motion-graphics reel for **@ineednow_** introducing EMSNow, the
school management system by [ineed.now](https://www.ineed.now).

| File | What it is |
| --- | --- |
| `export/EMSNow-reel.mp4` | Final reel — 1080×1920, 30 fps, H.264 + AAC, original soundtrack (−14 LUFS) |
| `export/EMSNow-reel-sfx-only.mp4` | Same picture with sound effects only — pair it with a trending track inside Instagram |
| `export/EMSNow-reel-cover.jpg` | Cover image (end card) for the Reel / profile grid |
| `export/EMSNow-reel-az.mp4` | **Azerbaijani version** — same motion, sound and timing, all copy localized |
| `export/EMSNow-reel-az-sfx-only.mp4` | Azerbaijani version with sound effects only |
| `export/EMSNow-reel-az-cover.jpg` | Azerbaijani cover image |

## Storyboard

| Time | Beat | On screen |
| --- | --- | --- |
| 0–3s | Hook | "Still running your school on… spreadsheets? paperwork? 10 different apps?" — the clutter piles up, then collapses into one orange square |
| 3–5s | Drop | The square divides into the 3×3 ineed.now mark, the open square punches out → **EMSNow** lockup |
| 5–7s | Promise | "One system. Your entire school." → camera dives through the logo's open square |
| 7–9s | Scale | 36 module tiles burst out and flip to reveal their icons — "36 modules. One platform." |
| 9–11s | Modularity | "Start with the core." (22 core modules) → "Add what you need." (14 add-on modules snap in) |
| 11–13s | Timetable | Teacher clash detected → dragged to a free slot → "No clashes" |
| 13–15s | Exams | Marks typed in → letter grades → GPA → report card ready |
| 15–17s | Finance | Invoice with discount → pay by card → PAID stamp → receipt |
| 17–19s | Parent portal | Grade, attendance, homework, fee balance and PTA notifications stack in |
| 19–21s | Dashboard | Enrollment, attendance %, fees collected, dues, upcoming exams, CSV export |
| 21–22.5s | Breadth | Rapid-fire modules with a 36-pip counter |
| 22.5–23.75s | Languages | School → Məktəb → Okul → Школа (EN · AZ · TR · RU) |
| 23.75–25s | Access | Owner, Principal, Teacher, Registrar, Accountant, Librarian around a shield |
| 25–30s | CTA | "Everything your school needs." → *need* becomes **ineed.now** → logo, EMSNow, **Book a demo**, www.ineed.now, @ineednow_ |

### Azerbaijani version (`?lang=az`)

Same storyboard, localized rather than word-for-word translated:

- Hook: "Məktəbiniz hələ də… cədvəllərdə? kağızlarda? 10 fərqli proqramda?"
- "Bir sistem. Bütün məktəbiniz." · "36 modul. bir platforma." · "Əsasdan başlayın. Lazım olanı əlavə edin."
- Features: "Toqquşmasız dərs cədvəli." · "Balları yazın. Hesabatı alın." · "Maliyyə tam nəzarətdə." · "Valideynlər hər an xəbərdar." · "Bütün məktəb bir baxışda."
- UI mock-ups use Azerbaijani spellings of names (Məmmədova, Kərimova, Əliyev…), weekday abbreviations (B.e., Ç.a., Ç., C.a., C.), manat amounts (1 290,00 ₼) and comma decimals (96,4%)
- Breadth: Qəbul · Davamiyyət · Kitabxana · Nəqliyyat · Yataqxana · Sağlamlıq · Yeməkxana · Məzunlar; "Sizin dilinizdə danışır."; "Hər rol üçün düzgün icazələr."
- Finale pun: "Məktəbinizə lazım olan hər şey — **indi.**" — *indi* ("now") keeps its i, n, d and dot and becomes **ineed.now**
- CTA: "Demo sifariş edin"

Key copy sits between y≈250 and y≈1450, clear of the Instagram UI.
All figures in the UI mock-ups (names, grades, amounts) are illustrative
sample data.

## How it's made

The whole video is code: an HTML/CSS composition animated with GSAP on a
single paused timeline, so every frame is rendered deterministically by
seeking.

- `index.html`, `styles.css`, `src/` — the composition (`src/timing.js` is the cue sheet; one file per act in `src/scenes/`)
- `tools/render.mjs` — renders frames in headless Chromium with **true motion blur** (8–18 sub-frames per frame averaged in linear light, adaptive on fast moves)
- `tools/make_audio.py` — synthesizes the original 120 BPM soundtrack and ~40 kinds of sound effects, each placed on the exact frame from the cue list the timeline exports; mastered to −14 LUFS / −1 dBTP
- `tools/encode.sh` — encodes the Instagram-ready MP4s and the cover
- `tools/snap.mjs` — renders stills / contact sheets for review

### Re-render

```bash
npm install
pip install numpy scipy imageio-ffmpeg
node tools/render.mjs --workers 4   # → build/frames, build/cues.json
tools/encode.sh                     # → export/EMSNow-reel*.{mp4,jpg}

# Azerbaijani
node tools/render.mjs --lang az --workers 4   # → build/frames-az, build/cues-az.json
tools/encode.sh az                            # → export/EMSNow-reel-az*.{mp4,jpg}
```

Open `index.html` through any static server (e.g. `npx serve .`) to preview
it live in a browser (space = pause, ←/→ = step a frame); add `?lang=az` for
the Azerbaijani version.

All on-screen text lives in `src/i18n.js` (one pack per language, plus number
and currency formats), so copy changes — or a new language such as TR or RU —
don't touch the animation code. Add a pack, then render with `--lang <code>`.

Fonts: Unbounded, Inter and JetBrains Mono (OFL). Icons: Lucide (ISC).
