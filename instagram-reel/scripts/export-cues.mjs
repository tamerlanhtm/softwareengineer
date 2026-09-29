// Dumps the composition's audio sync cues to audio/cues.json.
//   node scripts/export-cues.mjs [--lang az] [--out audio/cues.json]
import { chromium } from 'playwright';
import fs from 'node:fs';
import { LAUNCH_ARGS, openComposition } from './render.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const lang = opt('--lang', 'en');
const out = opt('--out', 'audio/cues.json');
const browser = await chromium.launch({ args: LAUNCH_ARGS });
const { page } = await openComposition(browser, lang);
const data = await page.evaluate(() => ({ bpm: 128, duration: window.__duration, cues: window.__cues }));
await browser.close();
fs.writeFileSync(out, JSON.stringify(data, null, 1));
const counts = {};
data.cues.forEach((c) => (counts[c.type] = (counts[c.type] || 0) + 1));
console.log(data.cues.length, 'cues', counts);
