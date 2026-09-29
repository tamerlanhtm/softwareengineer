// Frame renderer with real motion blur.
//
// Every output frame is the average of N sub-frame captures spread across a
// 180° shutter (half a frame interval, centred on the frame time). Frames where
// the first and last sub-frame are pixel-identical are static and captured once.
//
//   node scripts/render.mjs [--from 0] [--to 900] [--workers 4] [--samples 8]
//                           [--shutter 0.5] [--fps 30] [--out out/frames]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { openComposition, ROOT, W, H } from './browser.mjs';
import { startServer } from './server.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []),
);
const FPS = +(args.fps || 30);
const SAMPLES = +(args.samples || 8);
const SHUTTER = +(args.shutter || 0.5);
const ADAPT = args.adaptive === '0' ? 0 : 1; // adaptive sample count (default on)
const WORKERS = +(args.workers || Math.max(1, Math.min(4, os.cpus().length)));
const OUT = path.resolve(ROOT, args.out || 'out/frames');
fs.mkdirSync(OUT, { recursive: true });

const server = await startServer(ROOT);
const probe = await openComposition({ server });
const meta = await probe.page.evaluate(() => ({ duration: window.__duration, boost: window.__blurBoost, cuts: window.__cuts || [] }));
await probe.close();

const total = Math.round(meta.duration * FPS);
const from = +(args.from || 0);
const to = Math.min(total, +(args.to || total));
const maxT = meta.duration - 1e-4;

// minimum sample count for a frame (scene-declared boosts for known fast moves)
function boostFor(t) {
  let n = 0;
  for (const b of meta.boost || []) if (t >= b.t0 && t <= b.t1) n = Math.max(n, b.samples);
  return n;
}
// how much the frame changes across the shutter (mean abs diff, 0..255) decides the sample count
async function motionScore(a, b) {
  const [da, db] = await Promise.all([a, b].map((p) => sharp(p).resize(270, 480, { kernel: 'nearest' }).removeAlpha().raw().toBuffer()));
  let s = 0;
  for (let i = 0; i < da.length; i++) s += Math.abs(da[i] - db[i]);
  return s / da.length;
}
function samplesForScore(score) {
  if (ADAPT === 0) return SAMPLES;
  return score < 0.5 ? 4 : score < 3 ? 8 : score < 10 ? 16 : 28;
}

const only = args.frames ? args.frames.split(',').flatMap((r) => {
  const [a, b] = r.split('-').map(Number);
  return b == null ? [a] : Array.from({ length: b - a + 1 }, (_, i) => a + i);
}) : null;
let next = from;
let done = 0;
const onlyCount = only ? only.length : 0;
let staticCount = 0;
let sampleTotal = 0;
const started = Date.now();

async function worker(id) {
  const comp = await openComposition({ server });
  while (true) {
    let f;
    if (only) {
      if (!only.length) break;
      f = only.shift();
    } else {
      f = next++;
      if (f >= to) break;
    }
    const t = f / FPS;
    const file = path.join(OUT, `f_${String(f).padStart(5, '0')}.png`);
    if (SAMPLES <= 1) {
      fs.writeFileSync(file, await comp.capture(Math.min(t, maxT)));
    } else {
      const span = SHUTTER / FPS;
      // centred shutter, but never straddling a hard cut (that would blend two shots into a grey frame)
      let w0 = t - span / 2;
      for (const c of meta.cuts) {
        if (c > t - span / 2 && c <= t + span / 2) w0 = t >= c ? c : c - span - 1e-4;
      }
      const at = (k, n) => Math.min(maxT, Math.max(0, w0 + (k / (n - 1)) * span));
      const first = await comp.capture(at(0, 2));
      const last = await comp.capture(at(1, 2));
      let n = 2;
      if (!first.equals(last)) n = Math.max(samplesForScore(await motionScore(first, last)), boostFor(t));
      sampleTotal += first.equals(last) ? 1 : n;
      const times = Array.from({ length: n }, (_, k) => at(k, n));
      if (first.equals(last)) {
        fs.writeFileSync(file, first);
        staticCount++;
      } else {
        const acc = new Uint32Array(W * H * 3);
        const add = async (png) => {
          const { data } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
          for (let i = 0; i < data.length; i++) acc[i] += data[i];
        };
        await add(first);
        for (let k = 1; k < n - 1; k++) await add(await comp.capture(times[k]));
        await add(last);
        const outBuf = Buffer.allocUnsafe(W * H * 3);
        const half = n >> 1;
        for (let i = 0; i < acc.length; i++) outBuf[i] = ((acc[i] + half) / n) | 0;
        await sharp(outBuf, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 3 }).toFile(file);
      }
    }
    done++;
    const totalN = onlyCount || to - from;
    if (done % 30 === 0 || done === totalN) {
      const el = (Date.now() - started) / 1000;
      const rate = done / el;
      process.stdout.write(`\r[render] ${done}/${totalN} frames  ${rate.toFixed(2)} fps  static=${staticCount}  avg samples=${(sampleTotal / done).toFixed(1)}  eta ${((totalN - done) / rate).toFixed(0)}s   `);
    }
  }
  await comp.close();
}

await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i)));
server.close();
console.log(`\n[render] done in ${((Date.now() - started) / 1000).toFixed(1)}s -> ${OUT}`);
