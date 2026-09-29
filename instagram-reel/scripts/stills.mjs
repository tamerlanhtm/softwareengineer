// Renders single frames at given times (seconds, or "b<beat>" for beats @128 BPM)
// for visual QA:  node scripts/stills.mjs 0.5 b8 b8.5 ... [--out out/stills] [--lang az]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { LAUNCH_ARGS, openComposition } from './render.mjs';

const argv = process.argv.slice(2);
let outDir = 'out/stills';
let lang = 'en';
const times = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--out') { outDir = argv[++i]; continue; }
  if (argv[i] === '--lang') { lang = argv[++i]; continue; }
  const a = argv[i];
  times.push(a.startsWith('b') ? Number(a.slice(1)) * 60 / 128 : Number(a));
}
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const { capture } = await openComposition(browser, lang);
for (const t of times) {
  const png = await capture(t);
  const f = path.join(outDir, `t${t.toFixed(3).padStart(7, '0')}.png`);
  fs.writeFileSync(f, png);
  console.log(f);
}
await browser.close();
