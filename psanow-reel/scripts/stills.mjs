// Dev tool: render chosen timestamps into a labelled contact sheet.
// usage: node scripts/stills.mjs out.png cols scale t1 t2 ...
import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'path';
const [,, out, colsArg, scaleArg, ...ts] = process.argv;
const cols = +colsArg, scale = +scaleArg;
const W = Math.round(1080 * scale), H = Math.round(1920 * scale);
const browser = await chromium.launch({ args: ['--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('console', m.text()); });
await page.goto('file://' + path.resolve('src/index.html') + '?lang=' + (process.env.REEL_LANG || 'en'));
await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
const tiles = [];
for (const t of ts) {
  await page.evaluate((t) => window.renderAt(t), +t);
  const buf = await page.screenshot({ type: 'png' });
  if (ts.length === 1 && scale === 1) { await sharp(buf).toFile(out); await browser.close(); process.exit(0); }
  const label = Buffer.from(`<svg width="${W}" height="34"><rect width="${W}" height="34" fill="rgba(0,0,0,.75)"/><text x="8" y="24" font-family="monospace" font-size="20" fill="#0f0">t=${(+t).toFixed(2)}</text></svg>`);
  tiles.push(await sharp(buf).resize(W, H).composite([{ input: label, top: 0, left: 0 }]).png().toBuffer());
}
const rows = Math.ceil(tiles.length / cols);
const gap = 6;
const sheet = sharp({ create: { width: cols * W + (cols + 1) * gap, height: rows * H + (rows + 1) * gap, channels: 3, background: '#444' } });
await sheet.composite(tiles.map((b, i) => ({ input: b, left: gap + (i % cols) * (W + gap), top: gap + Math.floor(i / cols) * (H + gap) }))).png().toFile(out);
await browser.close();
