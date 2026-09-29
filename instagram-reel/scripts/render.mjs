// Deterministic frame renderer: seeks the GSAP composition frame by frame in
// headless Chromium, captures each frame, and blends sub-frames in ffmpeg for
// true (temporal super-sampled) motion blur. Output is a lossless FFV1 master.
//
//   node scripts/render.mjs [--fps 30] [--sub 4] [--shutter 0.5] [--workers 4]
//                           [--start 0] [--end <duration>] [--out out/master.mkv]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1]]);
    return acc;
  }, []),
);
const fps = Number(args.fps ?? 30);
const sub = Number(args.sub ?? 4);
const shutter = Number(args.shutter ?? 0.5); // fraction of a frame the shutter is open
const workers = Number(args.workers ?? 4);
const out = path.resolve(root, args.out ?? 'out/master.mkv');

export const LAUNCH_ARGS = [
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--font-render-hinting=none',
  '--disable-lcd-text',
  '--force-color-profile=srgb',
  '--hide-scrollbars',
];

export async function openComposition(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[console]', m.text()); });
  await page.goto('file://' + path.join(root, 'src/index.html'));
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const cdp = await page.context().newCDPSession(page);
  const capture = async (t) => {
    await page.evaluate((tt) => { window.__seek(tt); }, t);
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
    return Buffer.from(r.data, 'base64');
  };
  return { page, capture };
}

async function renderSegment(idx, k0, k1, segPath) {
  const browser = await chromium.launch({ args: LAUNCH_ARGS });
  const { capture } = await openComposition(browser);
  const vf = sub > 1
    ? `tmix=frames=${sub},select='eq(mod(n\\,${sub})\\,${sub - 1})',setpts=N/(${fps}*TB)`
    : 'setpts=N/(' + fps + '*TB)';
  const ff = spawn(FFMPEG, [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps * sub), '-c:v', 'png', '-i', '-',
    '-vf', vf, '-r', String(fps),
    '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'bgr0', segPath,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));

  const t0 = Date.now();
  for (let k = k0; k < k1; k++) {
    for (let j = 0; j < sub; j++) {
      // Shutter centred on the frame time.
      const t = Math.max(0, k / fps + (sub > 1 ? ((j + 0.5) / sub - 0.5) * (shutter / fps) : 0));
      const png = await capture(t);
      if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    if ((k - k0) % 30 === 0) {
      const el = (Date.now() - t0) / 1000;
      const rate = (k - k0 + 1) / el;
      console.log(`[w${idx}] frame ${k}/${k1 - 1}  ${rate.toFixed(2)} fps  eta ${((k1 - k - 1) / rate).toFixed(0)}s`);
    }
  }
  ff.stdin.end();
  await done;
  await browser.close();
}

async function main() {
  // Probe duration.
  const probe = await chromium.launch({ args: LAUNCH_ARGS });
  const { page } = await openComposition(probe);
  const duration = await page.evaluate(() => window.__duration);
  await probe.close();

  const start = Number(args.start ?? 0);
  const end = Number(args.end ?? duration);
  const K0 = Math.round(start * fps);
  const K1 = Math.round(end * fps);
  const total = K1 - K0;
  console.log(`render ${start}s → ${end}s  (${total} frames @ ${fps}fps, ${sub} sub-frames, shutter ${shutter}) with ${workers} workers`);

  fs.mkdirSync(path.dirname(out), { recursive: true });
  const segDir = path.join(path.dirname(out), 'segments');
  fs.mkdirSync(segDir, { recursive: true });
  const per = Math.ceil(total / workers);
  const jobs = [];
  const segs = [];
  for (let w = 0; w < workers; w++) {
    const a = K0 + w * per;
    const b = Math.min(K1, a + per);
    if (a >= b) break;
    const seg = path.join(segDir, `seg_${String(w).padStart(2, '0')}.mkv`);
    segs.push(seg);
    jobs.push(renderSegment(w, a, b, seg));
  }
  const t0 = Date.now();
  await Promise.all(jobs);
  const list = path.join(segDir, 'list.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
  await new Promise((res, rej) => {
    const p = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out], { stdio: 'inherit' });
    p.on('close', (c) => (c === 0 ? res() : rej(new Error('concat failed'))));
  });
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s → ${out}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
