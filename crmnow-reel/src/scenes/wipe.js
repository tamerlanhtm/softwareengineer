// Brand transition: a diagonal wave of rounded squares (the logo's building block) covers the frame,
// then peels away to reveal the next scene.
import { el, set, E, ez } from '../engine.js';

export function gridWipe({ id, t0, color = '#FE4D1E', cols = 3, rows = 6, z = 70 }) {
  const stagger = 0.028;
  const dur = 0.24;
  const span = (cols + rows - 2) * stagger;
  const t1 = t0 + dur;                       // first squares start peeling while the last ones still cover
  return {
    id,
    a: t0,
    b: t1 + span + dur,
    pre: 0,
    post: 0,
    z,
    covered: t1,
    build(layer, ctx, fx) {
      this.cells = [];
      const cw = 1080 / cols;
      const ch = 1920 / rows;
      const size = Math.max(cw, ch) * 1.34;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const n = el('div', 'wipe-sq', null, layer);
          n.style.cssText = `position:absolute;left:${c * cw + cw / 2 - size / 2}px;top:${r * ch + ch / 2 - size / 2}px;width:${size}px;height:${size}px;border-radius:${size * 0.157}px;background:${color};`;
          this.cells.push({ n, k: r + c });
        }
      }
      fx.cues.push({ t: t0, type: 'wipe' }, { t: t1, type: 'wipe2' });
    },
    update(tau, t) {
      for (const { n, k } of this.cells) {
        const i = ez(t, t0 + k * stagger, t0 + k * stagger + dur, E.outCubic);
        const o = ez(t, t1 + k * stagger, t1 + k * stagger + dur, E.inCubic);
        const s = i * (1 - o);
        set(n, { s: Math.max(0.001, s), r: (1 - i) * 45 - o * 45, o: s > 0.002 ? 1 : 0 });
      }
    },
  };
}
