// Render individual timestamps to PNG for review.
//   node scripts/snap.mjs --out preview 0 1.5 3.75       (explicit times, seconds)
//   node scripts/snap.mjs --out preview --range 3:6:0.25 (start:end:step)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, openPage, CHROME_ARGS } from './server.mjs';

const args = process.argv.slice(2);
let out = 'preview';
const times = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = args[++i];
  else if (args[i] === '--range') {
    const [a, b, s] = args[++i].split(':').map(Number);
    for (let t = a; t <= b + 1e-9; t += s) times.push(+t.toFixed(4));
  } else times.push(Number(args[i]));
}
times.sort((a, b) => a - b);
fs.mkdirSync(out, { recursive: true });

const { server, port } = await startServer();
const browser = await chromium.launch({ args: CHROME_ARGS });
const page = await openPage(browser, port);
const cdp = await page.context().newCDPSession(page);
for (const t of times) {
  const frame = Math.round(t * 30);
  await page.evaluate(([t, f]) => window.__seek(t, f), [t, frame]);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
  const f = path.join(out, `t${t.toFixed(3).padStart(8, '0')}.png`);
  fs.writeFileSync(f, Buffer.from(data, 'base64'));
}
console.log(`wrote ${times.length} frames to ${out}`);
await browser.close();
server.close();
