// Opens the composition in headless Chromium, ready for frame capture.
import { chromium } from 'playwright';

export async function openComposition(url, { capture = true } = {}) {
  const browser = await chromium.launch({ args: ['--force-device-scale-factor=1', '--font-render-hinting=none', '--disable-lcd-text'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  if (capture) await page.addInitScript(() => { window.__capture = true; });
  await page.goto(`${url}/src/index.html`);
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 60000 });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error(err);
  if (errors.length) console.warn('page errors:', errors);
  const cdp = await page.context().newCDPSession(page);
  const shot = async (t, format = 'png') => {
    await page.evaluate((tt) => window.__render(tt), t);
    const r = await cdp.send('Page.captureScreenshot', { format, optimizeForSpeed: true, captureBeyondViewport: false, ...(format === 'jpeg' ? { quality: 92 } : {}) });
    return Buffer.from(r.data, 'base64');
  };
  return { browser, page, shot, errors };
}
