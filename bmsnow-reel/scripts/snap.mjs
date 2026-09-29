// Preview stills: node scripts/snap.mjs <outDir> <t1> <t2> ...  (times in seconds)
//   or:          node scripts/snap.mjs <outDir> --range <from> <to> <step>
import fs from 'node:fs';
import path from 'node:path';
import { openComposition } from './browser.mjs';

const [outDir, ...rest] = process.argv.slice(2);
let times = [];
if (rest[0] === '--range') {
  const [a, b, s] = rest.slice(1).map(Number);
  for (let t = a; t <= b + 1e-9; t += s) times.push(+t.toFixed(4));
} else {
  times = rest.map(Number);
}
fs.mkdirSync(outDir, { recursive: true });
const comp = await openComposition();
for (const t of times) {
  const png = await comp.capture(t);
  const name = path.join(outDir, `t_${t.toFixed(3).padStart(7, '0')}.png`);
  fs.writeFileSync(name, png);
}
await comp.close();
console.log(`wrote ${times.length} stills to ${outDir}`);
