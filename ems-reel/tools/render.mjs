// Frame renderer with real (temporal super-sampled) motion blur.
//
//   node tools/render.mjs [--lang en|az] [--fps 30] [--shutter 0.5] [--workers 4] [--from 0] [--to 30]
//
// Every output frame is the average, in linear light, of N sub-frame renders
// spread across the (forward) shutter interval [t, t + shutter/fps) (N comes from the composition's
// __samplesAt(t), so fast whip-pans get more samples). Frames that do not
// change inside the shutter are detected and written from a single capture.
// Output: build/frames[-lang]/00000.png ... and build/cues[-lang].json for the audio build.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { serve, launch, openComposition, arg, ROOT, W, H } from './common.mjs';

const fps = Number(arg('fps', 30));
const shutter = Number(arg('shutter', 0.5)); // fraction of a frame interval (0.5 = 180°)
const lang = arg('lang', 'en');
const suffix = lang === 'en' ? '' : `-${lang}`;
const framesDir = path.resolve(ROOT, arg('frames', `build/frames${suffix}`));

// ---------- worker ----------
async function worker(first, last) {
  const srv = await serve();
  const browser = await launch();
  const comp = await openComposition(browser, srv.address().port, lang);

  // sRGB <-> linear lookup tables
  const toLin = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const c = i / 255;
    toLin[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  const LUT = 8192;
  const toSrgb = new Uint8Array(LUT + 1);
  for (let i = 0; i <= LUT; i++) {
    const l = i / LUT;
    const c = l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055;
    toSrgb[i] = Math.max(0, Math.min(255, Math.round(c * 255)));
  }
  const N = W * H * 3;
  const acc = new Float32Array(N);
  const out = Buffer.alloc(N);
  const rgb = async (png) => sharp(png).removeAlpha().raw().toBuffer();

  await comp.seek(0);
  const t0 = Date.now();
  for (let f = first; f <= last; f++) {
    const ft = f / fps;
    const n = Math.max(1, await comp.samplesAt(ft));
    const times = [];
    for (let s = 0; s < n; s++) times.push(ft + (s / n) * (shutter / fps));
    const file = path.join(framesDir, `${String(f).padStart(5, '0')}.png`);

    // first + last sample: identical => frame is static inside the shutter
    await comp.seek(times[0], ft);
    const a = await comp.capture();
    let caps = [];
    if (n > 1) {
      await comp.seek(times[n - 1], ft);
      const z = await comp.capture();
      if (!z.equals(a)) {
        caps = [a];
        for (let m = 1; m < n - 1; m++) {
          await comp.seek(times[m], ft);
          caps.push(await comp.capture());
        }
        caps.push(z);
      }
    }
    if (caps.length === 0) {
      await sharp(a).removeAlpha().png({ compressionLevel: 3 }).toFile(file);
    } else {
      acc.fill(0);
      for (const png of caps) {
        const px = await rgb(png);
        for (let i = 0; i < N; i++) acc[i] += toLin[px[i]];
      }
      const k = LUT / caps.length;
      for (let i = 0; i < N; i++) {
        const v = (acc[i] * k + 0.5) | 0;
        out[i] = toSrgb[v > LUT ? LUT : v];
      }
      await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 3 }).toFile(file);
    }
    if ((f - first) % 15 === 0) {
      const done = f - first + 1;
      const rate = (Date.now() - t0) / done;
      process.stdout.write(`  [${first}-${last}] frame ${f} (${caps.length || 1} samples) ${(rate / 1000).toFixed(2)}s/frame\n`);
    }
  }
  await browser.close();
  srv.close();
}

// ---------- coordinator ----------
async function main() {
  if (arg('worker')) {
    await worker(Number(arg('first')), Number(arg('last')));
    return;
  }
  fs.mkdirSync(framesDir, { recursive: true });

  // read duration + cues once
  const srv = await serve();
  const browser = await launch();
  const comp = await openComposition(browser, srv.address().port, lang);
  const { duration, cues } = comp.info;
  await browser.close();
  srv.close();
  fs.writeFileSync(path.resolve(ROOT, `build/cues${suffix}.json`), JSON.stringify({ duration, cues }, null, 1));

  const from = Math.round(Number(arg('from', 0)) * fps);
  const to = Math.min(Math.round(Number(arg('to', duration)) * fps), Math.round(duration * fps)) - 1;
  const workers = Number(arg('workers', 4));
  const total = to - from + 1;
  const per = Math.ceil(total / workers);
  console.log(`rendering [${lang}] frames ${from}..${to} (${total}) @${fps}fps, shutter ${shutter}, ${workers} workers`);
  const t0 = Date.now();
  const self = fileURLToPath(import.meta.url);
  await Promise.all(
    Array.from({ length: workers }, (_, w) => {
      const a = from + w * per;
      const b = Math.min(to, a + per - 1);
      if (a > b) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const p = spawn(
          process.execPath,
          [self, '--worker', '--first', String(a), '--last', String(b), '--fps', String(fps), '--shutter', String(shutter), '--frames', framesDir, '--lang', lang],
          { stdio: 'inherit' },
        );
        p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`worker ${w} exited ${code}`))));
      });
    }),
  );
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
