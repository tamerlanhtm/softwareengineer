// Lists overlapping tweens on the same element/property (see checkOverlaps in src/main.js).
import { serve, launch, openComposition, arg } from './common.mjs';
const srv = await serve();
const b = await launch();
const c = await openComposition(b, srv.address().port, arg('lang', 'en'));
const r = await c.page.evaluate(() => window.__checkOverlaps());
console.log(r.length ? r.join('\n') : 'no overlapping tweens');
console.log(`${r.length} overlap(s)`);
await b.close();
srv.close();
