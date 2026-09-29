// Render stills (single sample, no motion blur) for quick review.
//   node tools/snap.mjs --times 1,2.5,7 [--out build/snaps]
//   node tools/snap.mjs --from 0 --to 30 --step 0.5 --sheet build/sheet.png [--cols 6] [--thumb 270]
//   node tools/snap.mjs --cues build/cues.json   (just dump the sound cue list)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { serve, launch, openComposition, arg, ROOT, W, H } from './common.mjs';

const out = path.resolve(ROOT, arg('out', 'build/snaps'));
let times = [];
if (arg('times')) times = String(arg('times')).split(',').map(Number);
if (arg('from') !== undefined) {
  const from = Number(arg('from'));
  const to = Number(arg('to', from + 1));
  const step = Number(arg('step', 0.5));
  for (let t = from; t <= to + 1e-9; t += step) times.push(Math.round(t * 1000) / 1000);
}
times.sort((a, b) => a - b);

const srv = await serve();
const browser = await launch();
const comp = await openComposition(browser, srv.address().port);

if (arg('cues')) {
  const file = path.resolve(ROOT, arg('cues'));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ duration: comp.info.duration, cues: comp.info.cues }, null, 1));
  console.log(`wrote ${comp.info.cues.length} cues -> ${file}`);
}

fs.mkdirSync(out, { recursive: true });
const shots = [];
for (const t of times) {
  await comp.seek(t);
  const png = await comp.capture();
  const file = path.join(out, `t${t.toFixed(3).padStart(7, '0')}.png`);
  fs.writeFileSync(file, png);
  shots.push({ t, file });
}
console.log(`rendered ${shots.length} stills -> ${out}`);

const sheetPath = arg('sheet');
if (sheetPath && shots.length) {
  const cols = Number(arg('cols', 6));
  const tw = Number(arg('thumb', 270));
  const th = Math.round((tw * H) / W);
  const pad = 6;
  const label = 26;
  const rows = Math.ceil(shots.length / cols);
  const comps = [];
  for (let i = 0; i < shots.length; i++) {
    const x = pad + (i % cols) * (tw + pad);
    const y = pad + Math.floor(i / cols) * (th + label + pad);
    comps.push({ input: await sharp(shots[i].file).resize(tw, th).toBuffer(), left: x, top: y + label });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="${label}"><text x="4" y="19" font-family="DejaVu Sans Mono" font-size="17" fill="#ffb08f">${shots[i].t.toFixed(2)}s</text></svg>`;
    comps.push({ input: Buffer.from(svg), left: x, top: y });
  }
  await sharp({
    create: {
      width: pad + cols * (tw + pad),
      height: pad + rows * (th + label + pad),
      channels: 3,
      background: '#222',
    },
  })
    .composite(comps)
    .png()
    .toFile(path.resolve(ROOT, sheetPath));
  console.log(`contact sheet -> ${sheetPath}`);
}

await browser.close();
srv.close();
