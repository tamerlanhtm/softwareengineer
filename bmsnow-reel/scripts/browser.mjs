// Shared Playwright helpers: open the composition and seek deterministically.
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const W = 1080;
export const H = 1920;

export async function openComposition({ server } = {}) {
  const srv = server || (await startServer(ROOT));
  const browser = await chromium.launch({
    args: ['--disable-gpu', '--font-render-hinting=none', '--disable-lcd-text', '--hide-scrollbars', '--force-color-profile=srgb'],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[console]', m.text()); });
  await page.goto(srv.url + 'index.html?render=1' + (process.env.LANG_REEL ? '&lang=' + process.env.LANG_REEL : ''));
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const cdp = await page.context().newCDPSession(page);
  const capture = async (t) => {
    await page.evaluate((tt) => window.__seek(tt), t);
    const r = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true, captureBeyondViewport: false });
    return Buffer.from(r.data, 'base64');
  };
  const close = async () => { await browser.close(); if (!server) srv.close(); };
  return { page, capture, close, srv };
}
