// Deterministic frame renderer with motion blur.
//
// Every output frame is the average of N sub-frames spread across a 180°
// shutter, captured from headless Chromium. The sub-frames are decoded and
// accumulated in-process (sharp), so a frame can never be assembled from the
// wrong sub-frames. Work is split across parallel browser instances.
//
//   node scripts/render.mjs [--lang en|az] [--samples 8] [--shutter 0.5] [--workers 4]
//                           [--fps 30] [--from 0] [--to 30] [--out render/frames]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { serve, launch, openComposition, capture, ROOT } from './lib.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []),
);
const samples = parseInt(args.samples ?? '8', 10);
const shutter = parseFloat(args.shutter ?? '0.5');
const workers = parseInt(args.workers ?? '4', 10);
const fps = parseInt(args.fps ?? '30', 10);
const lang = args.lang ?? 'en';
const outDir = path.resolve(ROOT, args.out ?? (lang === 'en' ? 'render/frames' : `render/frames_${lang}`));
fs.mkdirSync(outDir, { recursive: true });

const { server, port } = await serve();
const probe = await launch();
const { meta, page: probePage } = await openComposition(probe, port, lang);
// Cue sheet for the soundtrack generator.
const cues = await probePage.evaluate(() => window.__cues);
fs.mkdirSync(path.join(ROOT, 'audio'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'audio', 'cues.json'), `${JSON.stringify(cues, null, 1)}\n`);
await probe.close();

const from = Math.round(parseFloat(args.from ?? '0') * fps);
const to = Math.round(parseFloat(args.to ?? String(meta.duration)) * fps);
const total = to - from;
const chunk = Math.ceil(total / workers);
console.log(`rendering [${lang}] frames ${from}..${to - 1} (${total}) · ${samples} samples · shutter ${shutter} · ${workers} workers`);

const started = Date.now();
let done = 0;
const framePath = (f) => path.join(outDir, `f_${String(f).padStart(5, '0')}.png`);

async function renderFrame(comp, f) {
  if (samples === 1) {
    fs.writeFileSync(framePath(f), await capture(comp, Math.min(f / fps, meta.duration - 1e-4)));
    return;
  }
  let acc = null;
  let info = null;
  for (let k = 0; k < samples; k++) {
    const off = ((k + 0.5) / samples - 0.5) * shutter;
    const t = Math.min(Math.max((f + off) / fps, 0), meta.duration - 1e-4);
    const raw = await sharp(await capture(comp, t)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    info = raw.info;
    if (!acc) acc = new Uint16Array(raw.data.length);
    const d = raw.data;
    for (let i = 0; i < d.length; i++) acc[i] += d[i];
  }
  const out = Buffer.allocUnsafe(acc.length);
  const half = samples >> 1;
  for (let i = 0; i < acc.length; i++) out[i] = (acc[i] + half) / samples;
  await sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png({ compressionLevel: 1 })
    .toFile(framePath(f));
}

async function runWorker(w) {
  const a = from + w * chunk;
  const b = Math.min(to, a + chunk);
  if (a >= b) return;
  const browser = await launch();
  const comp = await openComposition(browser, port, lang);
  for (let f = a; f < b; f++) {
    await renderFrame(comp, f);
    done++;
    if (done % 30 === 0) {
      const el = (Date.now() - started) / 1000;
      console.log(`  ${done}/${total} frames · ${el.toFixed(0)}s elapsed · ~${((el / done) * (total - done)).toFixed(0)}s left`);
    }
  }
  await browser.close();
}

await Promise.all(Array.from({ length: workers }, (_, w) => runWorker(w)));
server.close();
const missing = [];
for (let f = from; f < to; f++) if (!fs.existsSync(framePath(f))) missing.push(f);
if (missing.length) {
  console.error(`missing frames: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`done in ${((Date.now() - started) / 1000).toFixed(0)}s → ${outDir}`);
process.exit(0);
