// Export the sound-design cue sheet (audio/cues.json) from the composition.
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openComposition, ROOT } from './lib.mjs';

const { server, port } = await serve();
const browser = await launch();
const { page } = await openComposition(browser, port);
const cues = await page.evaluate(() => window.__cues);
fs.mkdirSync(path.join(ROOT, 'audio'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'audio', 'cues.json'), `${JSON.stringify(cues, null, 1)}\n`);
console.log(`${cues.length} cues → audio/cues.json`);
await browser.close();
server.close();
