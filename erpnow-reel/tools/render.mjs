// Frame-accurate capture of src/index.html with Chromium (Playwright).
//
//   node tools/render.mjs video [--sub 6] [--fastsub 16] [--shutter 0.5] [--workers 4] [--from 0] [--to 900]
//       -> build/video.mkv  (lossless FFV1, 30 fps, sub-frame motion blur blended by tools/blend.py)
//   node tools/render.mjs stills 1.5 3.25 ...      -> build/stills/t_<time>.png
//   node tools/render.mjs sheet <t0> <t1> <step> [cols]  -> build/sheet_<t0>-<t1>.png (contact sheet)
//   node tools/render.mjs patch --from 840 --to 870  -> re-render a frame range and splice it into build/video.mkv
//   node tools/render.mjs cues                     -> build/cues.json (sound cue sheet for tools/audio.py)
//
// Motion blur: each output frame n averages k renders taken at
//   t = n/fps + (j/k) * shutter/fps,  j = 0..k-1   (forward shutter, so cuts land clean on frames);
// k = --sub normally, --fastsub inside the fast-motion windows the composition declares (K.fast).
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(ROOT, 'build');
const LANG = process.env.REEL_LANG || '';   // e.g. REEL_LANG=az renders the Azerbaijani version
const PAGE = url.pathToFileURL(path.join(ROOT, 'src/index.html')).href + '?capture=1' + (LANG ? `&lang=${LANG}` : '');
const MASTER = LANG ? `video_${LANG}.mkv` : 'video.mkv';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const W = 1080, H = 1920, FPS = 30, DURATION = 30;

const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (name, def) => { const i = argv.indexOf('--' + name); return i >= 0 ? Number(argv[i + 1]) : def; };
const positional = argv.slice(1).filter((a, i, arr) => !a.startsWith('--') && !(i > 0 && arr[i - 1].startsWith('--')));

fs.mkdirSync(BUILD, { recursive: true });

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => { console.error('[pageerror]', e.message); process.exitCode = 1; });
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
  await page.goto(PAGE);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const cdp = await page.context().newCDPSession(page);
  async function shot(t) {
    await page.evaluate((tt) => window.renderFrame(tt), t);
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
    return Buffer.from(r.data, 'base64');
  }
  return { page, shot };
}

const launch = () => chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'] });

async function stills(times, dir = path.join(BUILD, 'stills')) {
  fs.mkdirSync(dir, { recursive: true });
  const browser = await launch();
  const { shot } = await openPage(browser);
  const files = [];
  for (const t of times) {
    const f = path.join(dir, `${LANG ? LANG + '_' : ''}t_${Number(t).toFixed(3)}.png`);
    fs.writeFileSync(f, await shot(Number(t)));
    files.push(f);
  }
  await browser.close();
  return files;
}

const countFrames = (file) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file, '-map', '0:v', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = [...r.stderr.matchAll(/frame=\s*(\d+)/g)];
  return m.length ? Number(m[m.length - 1][1]) : -1;
};

async function renderSegment(browser, i, from, to, subAt, shutter) {
  const { shot } = await openPage(browser);
  const out = path.join(BUILD, `seg_${String(i).padStart(2, '0')}.mkv`);
  const py = spawn('python3', [path.join(ROOT, 'tools/blend.py'), out, String(FPS)],
    { stdio: ['pipe', 'inherit', 'inherit'], env: { ...process.env, FFMPEG } });
  const done = new Promise((res, rej) => py.on('close', (c) => (c === 0 ? res() : rej(new Error('blend exit ' + c)))));
  const write = (buf) => new Promise((res) => (py.stdin.write(buf) ? res() : py.stdin.once('drain', res)));
  const u32 = (v) => { const b = Buffer.alloc(4); b.writeUInt32BE(v); return b; };
  for (let n = from; n < to; n++) {
    const k = subAt(n);
    await write(u32(k));
    for (let j = 0; j < k; j++) {
      const png = await shot(n / FPS + (k > 1 ? (j / k) * (shutter / FPS) : 0));
      await write(u32(png.length));
      await write(png);
    }
    if (n % 30 === 0) process.stdout.write(`  [w${i}] frame ${n}/${to}\n`);
  }
  py.stdin.end();
  await done;
  const got = countFrames(out);
  if (got !== to - from) throw new Error(`segment ${i}: expected ${to - from} frames, got ${got}`);
  return out;
}

async function video(outName = MASTER) {
  const sub = opt('sub', 6), fastsub = opt('fastsub', 16), shutter = opt('shutter', 0.5), workers = opt('workers', 4);
  const from = opt('from', 0), to = opt('to', DURATION * FPS);
  const t0 = Date.now();
  // Fast-motion windows declared by the scenes (K.fast) get more sub-frames.
  const probe = await launch();
  const fast = await (await openPage(probe)).page.evaluate(() => window.getFast());
  await probe.close();
  const subAt = (n) => {
    if (sub <= 1) return 1;
    const a = n / FPS, b = a + shutter / FPS;
    return fast.some(([f0, f1]) => b > f0 && a < f1) ? Math.max(sub, fastsub) : sub;
  };
  let total = 0;
  for (let n = from; n < to; n++) total += subAt(n);
  // One browser per worker: pages in one browser share its GPU/compositor process,
  // so separate browsers are what actually parallelises the rendering.
  const per = Math.ceil((to - from) / workers);
  const jobs = [];
  for (let i = 0; i < workers; i++) {
    const a = from + i * per, b = Math.min(to, a + per);
    if (a < b) jobs.push(launch().then(async (browser) => {
      try { return await renderSegment(browser, i, a, b, subAt, shutter); } finally { await browser.close(); }
    }));
  }
  const segs = await Promise.all(jobs);
  const list = path.join(BUILD, 'segments.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n') + '\n');
  const out = path.join(BUILD, outName);
  const r = spawnSync(FFMPEG, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('concat failed');
  segs.forEach((s) => fs.unlinkSync(s));
  const got = countFrames(out);
  if (got !== to - from) throw new Error(`video: expected ${to - from} frames, got ${got}`);
  console.log(`video: ${out}  (${got} frames from ${total} renders in ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

async function patch() {
  const from = opt('from', 0), to = opt('to', 0), master = path.join(BUILD, MASTER);
  const total = countFrames(master);
  if (!(to > from) || to > total) throw new Error(`patch: bad range ${from}-${to} for ${total} frames`);
  await video('patch.mkv');
  const tmp = path.join(BUILD, 'patched_' + MASTER);
  const fc = `[0:v]trim=start_frame=0:end_frame=${from},setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];` +
    `[0:v]trim=start_frame=${to},setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]`;
  const r = spawnSync(FFMPEG, ['-y', '-v', 'error', '-i', master, '-i', path.join(BUILD, 'patch.mkv'), '-filter_complex', fc,
    '-map', '[v]', '-r', String(FPS), '-c:v', 'ffv1', '-level', '3', '-pix_fmt', 'bgr0', tmp], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('patch splice failed');
  const got = countFrames(tmp);
  if (got !== total) throw new Error(`patch: expected ${total} frames, got ${got}`);
  fs.renameSync(tmp, master);
  console.log(`patched frames ${from}-${to - 1} into ${master}`);
}

async function sheet() {
  const [a, b, step, cols = 6] = positional.map(Number);
  const times = [];
  for (let t = a; t <= b + 1e-9; t += step) times.push(Math.round(t * 1000) / 1000);
  const dir = path.join(BUILD, 'sheet_frames');
  fs.rmSync(dir, { recursive: true, force: true });
  const files = await stills(times, dir);
  const out = path.join(BUILD, `sheet_${a}-${b}.png`);
  const r = spawnSync('python3', [path.join(ROOT, 'tools/sheet.py'), out, String(cols), ...files], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('sheet failed');
  console.log(out);
}

async function cues() {
  const browser = await launch();
  const { page } = await openPage(browser);
  const c = await page.evaluate(() => window.getCues());
  await browser.close();
  const out = path.join(BUILD, 'cues.json');
  fs.writeFileSync(out, JSON.stringify(c, null, 1));
  console.log(`cues: ${c.length} -> ${out}`);
}

if (cmd === 'video') await video();
else if (cmd === 'stills') console.log((await stills(positional)).join('\n'));
else if (cmd === 'sheet') await sheet();
else if (cmd === 'patch') await patch();
else if (cmd === 'cues') await cues();
else { console.error('usage: render.mjs video|stills|sheet|cues'); process.exit(2); }
