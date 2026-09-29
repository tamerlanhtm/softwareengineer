// Render individual frames for review.
//   node scripts/stills.mjs out_dir 0 0.5 3.1 ...      (times in seconds)
//   node scripts/stills.mjs out_dir --every 0.5        (whole piece)
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openComposition, capture } from './lib.mjs';

const [outDir, ...rest] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

const { server, port } = await serve();
const browser = await launch();
const comp = await openComposition(browser, port);

let times = [];
if (rest[0] === '--every') {
  const step = parseFloat(rest[1]);
  const from = parseFloat(rest[2] ?? '0');
  const to = parseFloat(rest[3] ?? comp.meta.duration);
  for (let t = from; t < to - 1e-6; t += step) times.push(+t.toFixed(4));
} else {
  times = rest.map(Number);
}

for (const t of times) {
  const png = await capture(comp, t);
  const name = `t${t.toFixed(3).padStart(7, '0')}.png`;
  fs.writeFileSync(path.join(outDir, name), png);
}
console.log(`wrote ${times.length} stills to ${outDir}`);
await browser.close();
server.close();
