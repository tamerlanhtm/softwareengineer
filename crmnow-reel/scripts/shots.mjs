// Render individual frames for review:  node scripts/shots.mjs [--lang=az] <outDir> <t1> <t2> ...
import { mkdirSync, writeFileSync } from 'node:fs';
import { startServer } from './serve.mjs';
import { openComposition } from './page.mjs';

const argv = process.argv.slice(2);
const lang = (argv.find((a) => a.startsWith('--lang=')) || '--lang=en').slice(7);
const [outDir, ...times] = argv.filter((a) => !a.startsWith('--'));
mkdirSync(outDir, { recursive: true });
const srv = await startServer();
const { browser, shot, errors } = await openComposition(srv.url, { lang });
for (const t of times.map(Number)) {
  writeFileSync(`${outDir}/f_${t.toFixed(3).padStart(7, '0')}.png`, await shot(t));
}
if (errors.length) console.log('ERRORS', errors);
await browser.close();
srv.close();
console.log(`wrote ${times.length} frames to ${outDir}`);
