// Dump the audio cue sheet that the scenes register (times are exact, in seconds).
// Usage: node scripts/cues.mjs [out/cues.json]
import fs from 'node:fs';
import path from 'node:path';
import { openComposition, ROOT } from './browser.mjs';

const out = process.argv[2] || path.join(ROOT, 'out', 'cues.json');
const comp = await openComposition();
const data = await comp.page.evaluate(() => ({ duration: window.__duration, cues: window.__cues }));
await comp.close();
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(data, null, 1));
const counts = {};
for (const c of data.cues) counts[c.type] = (counts[c.type] || 0) + 1;
console.log(`wrote ${data.cues.length} cues to ${out}`, counts);
