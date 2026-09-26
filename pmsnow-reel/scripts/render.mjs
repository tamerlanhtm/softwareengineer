// Frame-accurate renderer with real (temporally super-sampled) motion blur.
//
//   node scripts/render.mjs [--sub 4] [--subfast 8] [--shutter 0.5] [--workers 4] [--dir out/frames] [--from 0] [--to 900]
//
// For every output frame n (30 fps) we render several sub-frames spread across a
// `shutter` fraction of the frame interval (0.5 = 180° shutter), centred on
// n/30 s; scripts/blend.py averages them → natural motion blur. Frames inside
// FAST windows (whip pans, dives, bursts) get `subfast` samples so fast motion
// smears instead of strobing. Files: f0000_00.jpg …; existing files are skipped,
// so an interrupted render resumes where it stopped.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, openPage, CHROME_ARGS, ROOT } from './server.mjs';

const opt = { sub: 4, subfast: 8, shutter: 0.5, workers: 4, dir: 'out/frames', from: 0, to: null, q: 94, chunk: 10 };
// seconds with very fast motion (transitions) → more sub-frames
const FAST = [[3.4, 4.3], [5.0, 5.75], [7.2, 7.9], [9.0, 9.5], [10.85, 11.65], [12.6, 13.3], [14.1, 14.5], [14.6, 15.1],
  [16.4, 16.95], [18.3, 18.85], [20.1, 20.7], [22.1, 23.4], [25.95, 26.35]];
const a = process.argv.slice(2);
for (let i = 0; i < a.length; i += 2) opt[a[i].replace(/^--/, '')] = isNaN(+a[i + 1]) ? a[i + 1] : +a[i + 1];
const dir = path.resolve(ROOT, opt.dir);
fs.mkdirSync(dir, { recursive: true });

const { server, port } = await startServer();

// one page just to read metadata + cues
{
  const b = await chromium.launch({ args: CHROME_ARGS });
  const p = await openPage(b, port);
  const meta = await p.evaluate(() => ({ fps: window.__fps, duration: window.__duration, cues: window.__cues }));
  fs.writeFileSync(path.resolve(ROOT, 'out/cues.json'), JSON.stringify(meta.cues, null, 1));
  opt.fps = meta.fps; opt.duration = meta.duration;
  await b.close();
}
const N = Math.round(opt.duration * opt.fps);
const last = opt.to == null ? N : Math.min(N, opt.to);
console.log(`render ${opt.from}..${last - 1} of ${N} frames · ${opt.sub} sub-frames · shutter ${opt.shutter} · ${opt.workers} workers → ${dir}`);

const queue = [];
for (let f = opt.from; f < last; f += opt.chunk) queue.push([f, Math.min(last, f + opt.chunk)]);
const subsFor = (n) => (FAST.some(([a, z]) => n / opt.fps >= a && n / opt.fps <= z) ? opt.subfast : opt.sub);
let total = 0;
for (let n = opt.from; n < last; n++) total += subsFor(n);
let done = 0, skipped = 0;
const t0 = Date.now();

const subTimes = (n) => {
  const S = subsFor(n);
  return Array.from({ length: S }, (_, k) => {
    const off = S === 1 ? 0 : ((k + 0.5) / S - 0.5) * (opt.shutter / opt.fps);
    return Math.min(opt.duration - 1e-4, Math.max(0, n / opt.fps + off));
  });
};

async function worker(id) {
  const browser = await chromium.launch({ args: CHROME_ARGS });
  const page = await openPage(browser, port);
  const cdp = await page.context().newCDPSession(page);
  while (queue.length) {
    const [s, e] = queue.shift();
    for (let n = s; n < e; n++) {
      const ts = subTimes(n);
      for (let k = 0; k < ts.length; k++) {
        const file = path.join(dir, `f${String(n).padStart(4, '0')}_${String(k).padStart(2, '0')}.jpg`);
        if (fs.existsSync(file) && fs.statSync(file).size > 1000) { skipped++; done++; continue; }
        await page.evaluate(([t, f]) => window.__seek(t, f), [ts[k], n]);
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: opt.q, optimizeForSpeed: true });
        fs.writeFileSync(file, Buffer.from(data, 'base64'));
        done++;
      }
    }
    const el = (Date.now() - t0) / 1000;
    const rate = (done - skipped) / Math.max(el, 1e-3);
    process.stdout.write(`\r[w${id}] ${done}/${total} sub-frames · ${rate.toFixed(1)}/s · eta ${((total - done) / Math.max(rate, 1e-3) / 60).toFixed(1)} min   `);
  }
  await browser.close();
}
await Promise.all(Array.from({ length: opt.workers }, (_, i) => worker(i)));
console.log(`\ndone in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
server.close();
