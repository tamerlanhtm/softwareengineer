# TOSNow — Instagram Reel (9:16, 30 s)

A 30-second motion-graphics reel for **@ineednow_** introducing **TOSNow**, the
tour operator system by [ineed.now](https://www.ineed.now). Every frame is
code-generated (HTML + GSAP, rendered frame-by-frame with true motion blur) and
the soundtrack is original — synthesized from scratch, no samples or licensed
audio — so it is safe to post and promote. Available in **English** and
**Azerbaijani** (same edit, same soundtrack).

## Deliverables (`deliverables/`)

| File | Use |
| --- | --- |
| `TOSNow_Reel_1080x1920.mp4` | **Main post.** 1080×1920, 30 fps, H.264 + original soundtrack (−14 LUFS). |
| `TOSNow_Reel_1080x1920_SFX-only.mp4` | Same video with only the synced sound design — pick a trending track in Instagram and keep the UI sounds underneath. |
| `TOSNow_Reel_cover.jpg` | Reel cover (end card). All key content sits inside the 3:4 profile-grid crop. |
| `TOSNow_Reel_1080x1920_AZ.mp4` | **Azerbaijani version** of the main post. |
| `TOSNow_Reel_1080x1920_AZ_SFX-only.mp4` | Azerbaijani version with sound design only. |
| `TOSNow_Reel_AZ_cover.jpg` | Azerbaijani cover (end card). |
| `TOSNow_Reel_soundtrack.wav` | The original soundtrack on its own (48 kHz, −14 LUFS) for re-edits — shared by both languages. |

## Storyboard

128 BPM → 16 bars = exactly 30 s. Every cut, pop and whip-pan lands on the beat.

| Time | Bars | Scene | What happens |
| --- | --- | --- | --- |
| 0.0–3.75 s | 1–2 | **Hook — chaos** | Spreadsheets, chats, overdue invoices and a calendar clash float in 3D depth of field. Pain points slam on a syncopated 3-3-2 rhythm: *14 spreadsheets · 217 unread messages · 1 double-booked guide* (with an RGB glitch) · *Sound familiar?* Everything is sucked into the brand's hollow square. |
| 3.75–7.5 s | 3–4 | **Logo reveal** | Camera flies *through* the hollow square onto paper; it pulls back into its slot while the other 8 squares pop in a diagonal wave (one per 16th note, each a note of the melody). **TOSNow · Tour Operator System**, then a slot-machine line: *One system for your enquiries / itineraries / suppliers / departures / vouchers.* |
| 7.5–11.25 s | 5–6 | **Scale** | The mark becomes the centre of a 5×6 grid — icons light up as the counter runs to **30 modules**. Tiles then sort themselves into **8 groups** (6 core + 2 add-ons, add-ons drawn hollow like the logo). |
| 11.25–22.5 s | 7–12 | **Product journey** | The *Enquiries* tile opens into a product card and the camera whip-pans along an orange flow line through six modules, one per bar: enquiry → multi-option quote → **booking confirmed**; day-by-day **itinerary** builder; **cost build-up → markup → sell price**; **departure seats** filling until *Guaranteed*; **ops board** catching a double-booking and reassigning the driver; **supplier voucher with QR verification**. |
| 22.5–26.25 s | 13–14 | **Everything else** | Pull-back: the voucher becomes the centre of a 3×3 bento grid (the logo's grid): live dashboard, **5 languages** (Hello · Salam · Merhaba · Привет · Salom), multi-currency, margins, agent portal, roles & access, automation — and a hollow slot: *Your agency here.* |
| 26.25–30 s | 15–16 | **Call to action** | The nine tiles collapse back into the logo as the stage floods to paper. *Everything your tour company needs.* **Now.** → **Book a demo** → `www.ineed.now` types itself → *DM us @ineednow_*. |

Sample names, hotels and prices in the product cards are illustrative demo data.

## Languages

All on-screen copy lives in one copy deck, `src/i18n.js` (`en` and `az`); pick a
language with `?lang=az` / `--lang az`. Timing never depends on the copy, so every
language shares the edit, the cue sheet and the soundtrack. Longer translations
shrink to fit their slot automatically (never grow), dates, weekdays and numbers
follow each language (`14 iyun`, `B.E. Ç.A. …`, `15.050 $`, `15,3%`), and the page
declares its language so uppercase text gets the right `İ`.

Key lines, English → Azerbaijani:

| Scene | English | Azərbaycanca |
| --- | --- | --- |
| Hook | 14 spreadsheets. · 217 unread messages. · 1 double-booked guide. · Sound familiar? | 14 Excel cədvəli. · 217 oxunmamış mesaj. · 1 bələdçi, iki qrup. · Tanış gəlir? |
| Logo | Tour Operator System · One system for your enquiries / itineraries / suppliers / departures / vouchers. | Turoperatorlar üçün sistem · Hamısı bir sistemdə: sorğular / marşrutlar / təchizatçılar / gedişlər / vauçerlər. |
| Scale | 30 modules · 8 groups · 6 core · 2 add-ons | 30 modul · 8 qrup · 6 əsas · 2 əlavə |
| Journey | Enquiries become bookings. · Itineraries, day by day. · Cost. Markup. Sell price. Done. · Every seat, tracked live. · Ops board. Zero clashes. · Vouchers with QR check. | Sorğudan rezervasiyaya. · Tur proqramı, gün-gün. · Maya dəyərindən satış qiymətinə. · Hər yer canlı izlənir. · Bir lövhə. Sıfır konflikt. · QR yoxlamalı vauçerlər. |
| Bento | Plus everything else you need. · Your agency here. | Və sizə lazım olan hər şey. · Sizin agentlik burada. |
| CTA | Everything your tour company needs. Now. · Book a demo · DM us @ineednow_ | Tur şirkətinizə lazım olan hər şey. İndi. · Demo sifariş edin · Bizə yazın @ineednow_ |

## Brand system used

* **Orange** `#FE4D1E` (sampled from the logo), ink `#0D0B0A`, paper `#F6F3EE`.
* **Logo geometry** (sampled): square size *s*, pitch 1.5·*s*, corner radius 0.18·*s*;
  hollow square outer radius 0.3·*s*, stroke 0.25·*s*.
* Type: Unbounded (display/numbers), Inter Tight (headlines), Inter (UI), JetBrains Mono (labels).
* Icons: Lucide (ISC).

## Sound

Original track in F minor resolving to A♭ major on the end card (vi–IV–I–V), 128 BPM:
tense drone + ticking clock under the hook, impact and a melodic logo arpeggio, a
four-on-the-floor groove with off-beat house bass through the journey, snare-roll
builds into the bento and the CTA, and a final chorus. 118 visual events drive
matching sound design (slams, message pings, glitch, whip-pans, clicks, stamp,
typing…) from `audio/cues.json`. The mix is voiced for phone speakers and mastered
to −14 LUFS / < −1 dBTP.

## Rebuild

Requirements: Node 18+, Python 3.10+ (`numpy scipy`), ffmpeg with libx264, Chromium via Playwright.

```bash
npm install
npm run build                          # everything below, in order

node scripts/build-assets.mjs          # icons + QR code → src/generated/assets.js
node scripts/export-cues.mjs           # visual cue sheet → audio/cues.json
python3 audio/synth.py                 # soundtrack + SFX-only premasters
node scripts/render.mjs --sub 8 --shutter 0.6 --workers 4 --out out/master.mkv
python3 scripts/encode.py out/master.mkv

# Azerbaijani version (same soundtrack)
node scripts/render.mjs --lang az --sub 8 --shutter 0.6 --workers 4 --out out/master_az.mkv
python3 scripts/encode.py out/master_az.mkv --lang az
```

* Preview any moment: `node scripts/stills.mjs 3.2 b24 b56.5 --lang az` (seconds or `b<beat>`).
* Copy lives in `src/i18n.js`; timing is in beats via `B(n)` in the scene files, so edits
  stay on the grid and the audio cues follow automatically (re-run `export-cues` +
  `synth.py` after timing changes).

## Posting tips

* In Instagram: *Settings → Data usage and media quality → Upload at highest quality* before uploading.
* Use `TOSNow_Reel_cover.jpg` (or `TOSNow_Reel_AZ_cover.jpg`) as the cover.
* Suggested caption (English):

> Still running tours on spreadsheets? 👀
> Meet TOSNow — one system for enquiries, itineraries, suppliers, departures, vouchers and finance.
> ✅ 30 modules in 8 groups
> ✅ Enquiry → multi-option quote → booking
> ✅ Live seats & guaranteed departures
> ✅ Ops board that catches double-bookings
> ✅ QR-verified supplier vouchers
> ✅ EN · AZ · TR · RU · UZ
> Book a demo 👉 www.ineed.now or DM us.
>
> #touroperator #travelagency #DMC #traveltech #tourism #bookingsystem #SaaS #TOSNow #ineednow

* Suggested caption (Azərbaycanca):

> Hələ də turları Excel cədvəlləri ilə idarə edirsiniz? 👀
> TOSNow ilə tanış olun — sorğular, marşrutlar, təchizatçılar, gedişlər, vauçerlər və maliyyə bir sistemdə.
> ✅ 8 qrupda 30 modul
> ✅ Sorğu → çoxvariantlı təklif → rezervasiya
> ✅ Canlı yer nəzarəti və zəmanətli gedişlər
> ✅ İkiqat təyinatları aşkarlayan əməliyyat lövhəsi
> ✅ QR ilə yoxlanılan təchizatçı vauçerləri
> ✅ AZ · EN · TR · RU · UZ
> Demo sifariş edin 👉 www.ineed.now və ya bizə yazın.
>
> #turoperator #turizm #səyahət #turagentlik #Azərbaycan #Bakı #TOSNow #ineednow
