// Shared bits for the render scripts: a tiny static server for the project
// and a Chromium page that has the composition loaded and ready to seek.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

export function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const file = path.join(ROOT, url);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

export async function launch() {
  return chromium.launch({
    args: [
      '--hide-scrollbars',
      '--force-color-profile=srgb',
      '--disable-lcd-text',
      '--font-render-hinting=none',
      '--disable-gpu',
    ],
  });
}

export async function openComposition(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') console.error(`[page ${m.type()}]`, m.text());
  });
  await page.goto(`http://127.0.0.1:${port}/src/index.html?render=1`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const cdp = await page.context().newCDPSession(page);
  const meta = await page.evaluate(() => window.__meta);
  return { page, cdp, meta };
}

export async function capture({ page, cdp }, t) {
  await page.evaluate((tt) => {
    window.__seek(tt);
    return new Promise((r) => requestAnimationFrame(() => r()));
  }, t);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
  return Buffer.from(data, 'base64');
}
