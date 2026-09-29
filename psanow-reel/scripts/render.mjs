// Frame renderer: parallel headless Chromium workers, multi-sample motion blur.
// node scripts/render.mjs --out frames --fps 30 --sub 6 --shutter 0.5 --workers 4 [--from 0 --to 900] [--scale 1]
import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const OUT = args.out || 'frames';
const FPS = +(args.fps || 30);
const SUB = +(args.sub || 6);
const SHUTTER = +(args.shutter || 0.5);
const SCALE = +(args.scale || 1);
const Q = +(args.quality || 94);
const FMT = args.format || 'png';
const SUB_HI = +(args.subhi || 24);
const THRESH = +(args.thresh || 2.5);
const DURATION = 30;
const FROM = +(args.from || 0);
const TO = +(args.to || Math.round(DURATION * FPS));
const W = Math.round(1080 * SCALE), H = Math.round(1920 * SCALE);

async function worker() {
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => process.send({ err: e.message }));
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  await page.goto('file://' + path.join(root, 'src/index.html'));
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const cdp = await page.context().newCDPSession(page);
  const acc = new Float32Array(W * H * 3);
  process.on('message', async (msg) => {
    if (msg.quit) { await browser.close(); process.exit(0); }
    const grab = async (t) => {
      await page.evaluate((t) => window.renderAt(t), t);
      const shot = await cdp.send('Page.captureScreenshot', FMT === 'png' ? { format: 'png', optimizeForSpeed: true } : { format: 'jpeg', quality: Q, optimizeForSpeed: true });
      let img = sharp(Buffer.from(shot.data, 'base64')).removeAlpha();
      if (SCALE !== 1) img = img.resize(W, H);
      return (await img.raw().toBuffer({ resolveWithObject: true })).data;
    };
    const pass = async (f, n) => {
      acc.fill(0);
      let first = null, last = null;
      for (let s = 0; s < n; s++) {
        const off = n === 1 ? 0 : SHUTTER * ((s + 0.5) / n - 0.5);
        const data = await grab((f + off) / FPS);
        for (let i = 0; i < data.length; i++) acc[i] += data[i];
        if (s === 0) first = data;
        if (s === n - 1) last = data;
      }
      // motion metric: mean abs difference between first and last sample (sparse)
      let m = 0, c = 0;
      for (let i = 0; i < first.length; i += 61) { m += Math.abs(first[i] - last[i]); c++; }
      return m / c;
    };
    for (let f = msg.a; f < msg.b; f++) {
      let n = SUB;
      const motion = await pass(f, n);
      if (SUB > 1 && SUB_HI > SUB && motion > THRESH) { n = SUB_HI; await pass(f, n); }
      const out = Buffer.alloc(W * H * 3);
      const k = 1 / n;
      for (let i = 0; i < out.length; i++) out[i] = Math.min(255, Math.round(acc[i] * k));
      await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 2, adaptiveFiltering: false }).toFile(path.join(OUT, `f_${String(f).padStart(5, '0')}.png`));
      process.send({ done: f, n, motion: +motion.toFixed(2) });
    }
    process.send({ idle: true });
  });
  process.send({ ready: true });
}

async function master() {
  fs.mkdirSync(OUT, { recursive: true });
  const N = +(args.workers || 4);
  const CH = 12;
  const queue = [];
  for (let a = FROM; a < TO; a += CH) queue.push({ a, b: Math.min(TO, a + CH) });
  const total = TO - FROM;
  let done = 0, heavy = 0;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: N }, () => new Promise((resolve) => {
    const w = fork(fileURLToPath(import.meta.url), process.argv.slice(2), { env: { ...process.env, RENDER_WORKER: '1' } });
    const next = () => { const job = queue.shift(); if (job) w.send(job); else { w.send({ quit: true }); resolve(); } };
    w.on('message', (m) => {
      if (m.err) console.error('page error:', m.err);
      if (m.ready || m.idle) next();
      if (m.done != null) {
        done++;
        if (args.verbose) console.log('frame', m.done, 'motion', m.motion, 'samples', m.n);
        if (m.n > SUB) heavy++;
        if (done % 30 === 0 || done === total) {
          const el = (Date.now() - t0) / 1000;
          console.log(`${done}/${total} frames  ${el.toFixed(0)}s elapsed  ~${((el / done) * (total - done)).toFixed(0)}s left`);
        }
      }
    });
  })));
  console.log('render complete in', ((Date.now() - t0) / 1000).toFixed(1), 's;', heavy, 'frames used', SUB_HI, 'samples');
}

if (process.env.RENDER_WORKER) worker(); else master();
