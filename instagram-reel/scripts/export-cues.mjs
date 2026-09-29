// Dumps the composition's audio sync cues to audio/cues.json.
import { chromium } from 'playwright';
import fs from 'node:fs';
import { LAUNCH_ARGS, openComposition } from './render.mjs';

const browser = await chromium.launch({ args: LAUNCH_ARGS });
const { page } = await openComposition(browser);
const data = await page.evaluate(() => ({ bpm: 128, duration: window.__duration, cues: window.__cues }));
await browser.close();
fs.writeFileSync('audio/cues.json', JSON.stringify(data, null, 1));
const counts = {};
data.cues.forEach((c) => (counts[c.type] = (counts[c.type] || 0) + 1));
console.log(data.cues.length, 'cues', counts);
