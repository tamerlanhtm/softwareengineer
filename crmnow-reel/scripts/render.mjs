// Frame-accurate capture of the composition with real motion blur (temporal super-sampling).
//
//   node scripts/render.mjs [--fps=30] [--blur=4] [--shutter=0.5] [--workers=4] [--dsf=1]
//                           [--from=0] [--to=30] [--out=out/video.mkv]
//
// For every output frame the page is rendered at several instants spread over a 180° shutter; the captures
// are averaged in linear light and dithered back to 8-bit. Fast moves (whip-pan, zoom-through, floods...)
// get many more samples so their blur is smooth rather than stepped. Work is split into 1-second chunks
// pulled by parallel browser workers; each chunk becomes a lossless segment, concatenated at the end.
// Also writes out/cues.json (sound cue list) for scripts/soundtrack.py.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import sharp from 'sharp';
import { startServer } from './serve.mjs';
import { openComposition } from './page.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? 'true']));
const FPS = Number(args.fps || 30);
const SUB = Number(args.blur || 4);
const SHUTTER = Number(args.shutter || 0.5);
const WORKERS = Number(args.workers || 4);
const DSF = Number(args.dsf || 1);
const OUT = args.out || 'out/video.mkv';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const W = Math.round(1080 * DSF);
const H = Math.round(1920 * DSF);

// [from, to, samples] — windows of very fast motion (seconds on the timeline)
const FAST = [
  [2.1, 2.5, 12],     // slot-machine spin
  [3.0, 3.4, 8],      // letters morph into the wordmark
  [3.7, 4.2, 12],     // orange + white floods
  [5.1, 5.7, 16],     // dive through the hollow square
  [8.95, 9.45, 8],    // deal card flies into the pipeline
  [12.6, 12.85, 12],  // whip-pan (shoulders)
  [12.85, 13.25, 40], // whip-pan (core)
  [13.25, 13.4, 12],
  [16.3, 16.8, 8],    // invoice shrinks into the dashboard
  [19.75, 20.55, 8],  // grid wipe
  [24.05, 24.9, 12],  // tiles collapse into the mark + flood
  [25.7, 25.95, 8],   // "Now." slam
];

function samplesAt(t) {
  if (SUB <= 1) return 1;
  let n = SUB;
  for (const [a, c, k] of FAST) if (t >= a && t <= c) n = Math.max(n, k);
  return n;
}
function subTimes(t) {
  const n = samplesAt(t);
  if (n === 1) return [t];
  return Array.from({ length: n }, (_, k) => t + ((k + 0.5) / n - 0.5) * (SHUTTER / FPS));
}

// sRGB <-> linear lookup tables
const TO_LIN = new Float32Array(256).map((_, i) => { const c = i / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
const LUT_N = 16384;
const TO_SRGB = new Float32Array(LUT_N + 1).map((_, i) => { const l = i / LUT_N; return 255 * (l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055); });

mkdirSync(dirname(OUT), { recursive: true });
const tmp = `${OUT}.parts`;
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const srv = await startServer();
const probe = await openComposition(srv.url);
const meta = await probe.page.evaluate(() => ({ ...window.__meta, cues: window.__cues }));
await probe.browser.close();
mkdirSync('out', { recursive: true });
writeFileSync('out/cues.json', JSON.stringify(meta.cues, null, 1));

const FROM = Number(args.from || 0);
const TO = Number(args.to || meta.duration);
const total = Math.round((TO - FROM) * FPS);
const CHUNK = FPS;                                   // 1 second per chunk
const chunks = [];
for (let f = 0; f < total; f += CHUNK) chunks.push([f, Math.min(total, f + CHUNK)]);
const captures = Array.from({ length: total }, (_, f) => samplesAt(FROM + f / FPS)).reduce((a, c) => a + c, 0);
console.log(`rendering ${total} frames @${FPS}fps (${captures} captures, shutter ${SHUTTER}) with ${WORKERS} workers at ${W}x${H}`);

let next = 0;
let doneFrames = 0;
const t0 = Date.now();

async function worker(w) {
  const { browser, page, errors } = await openComposition(srv.url);
  const cdp = await page.context().newCDPSession(page);
  if (DSF !== 1) await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: DSF, mobile: false });
  const acc = new Float32Array(W * H * 3);
  const out = Buffer.alloc(W * H * 3);
  while (next < chunks.length) {
    const ci = next++;
    const [f0, f1] = chunks[ci];
    const seg = `${tmp}/seg_${String(ci).padStart(3, '0')}.mkv`;
    const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-framerate', String(FPS),
      '-i', '-', '-c:v', 'libx264rgb', '-qp', '0', '-preset', 'ultrafast', seg], { stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c} (chunk ${ci})`)))));
    for (let f = f0; f < f1; f++) {
      const times = subTimes(FROM + f / FPS);
      acc.fill(0);
      for (const t of times) {
        await page.evaluate((tt) => window.__render(tt), t);
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
        const raw = await sharp(Buffer.from(data, 'base64')).removeAlpha().raw().toBuffer();
        for (let i = 0; i < raw.length; i++) acc[i] += TO_LIN[raw[i]];
      }
      // average in linear light, back to sRGB with a little ordered noise to avoid banding in the streaks
      const inv = LUT_N / times.length;
      let seed = (f * 2654435761) >>> 0;
      for (let i = 0; i < acc.length; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const v = TO_SRGB[Math.min(LUT_N, (acc[i] * inv) | 0)] + (times.length > 1 ? (seed / 4294967296 - 0.5) * 0.9 : 0);
        out[i] = v < 0 ? 0 : v > 255 ? 255 : (v + 0.5) | 0;
      }
      if (!ff.stdin.write(out)) await new Promise((r) => ff.stdin.once('drain', r));
      doneFrames++;
    }
    ff.stdin.end();
    await closed;
    const el = (Date.now() - t0) / 1000;
    console.log(`  w${w} chunk ${ci + 1}/${chunks.length} — ${doneFrames}/${total} frames, ${el.toFixed(0)}s elapsed`);
  }
  await browser.close();
  if (errors.length) console.warn(`worker ${w} page errors:`, errors.slice(0, 5));
}

await Promise.all(Array.from({ length: WORKERS }, (_, w) => worker(w)));
writeFileSync(`${tmp}/list.txt`, chunks.map((_, ci) => `file 'seg_${String(ci).padStart(3, '0')}.mkv'`).join('\n'));
await new Promise((res, rej) => {
  const p = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${tmp}/list.txt`, '-c', 'copy', OUT], { stdio: 'inherit' });
  p.on('close', (c) => (c === 0 ? res() : rej(new Error('concat failed'))));
});
rmSync(tmp, { recursive: true, force: true });
srv.close();
console.log(`done: ${OUT} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
