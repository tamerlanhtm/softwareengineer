// S2 — LOGO (3.75 → 5.625s). White flood chases the orange one, the 3x3 mark assembles,
// CRMNow wordmark rises, then the camera dives through the hollow square into the product.
import { b, el, set, E, ez, prog, spring } from '../engine.js';
import { buildLogo } from '../components.js';

const S = 150;

export default {
  id: 'logo',
  a: b(8),
  b: b(12),
  pre: 0.14,
  post: 0,
  z: 50,

  build(layer, ctx, fx) {
    this.ctx = ctx;
    // white flood square (starts at the brand dot of the hook)
    this.flood = el('div', 'lg-flood', null, layer);
    this.flood.style.cssText = 'position:absolute;left:0;top:0;width:100px;height:100px;margin:-50px 0 0 -50px;border-radius:16px;background:#fff;';

    // everything that zooms
    const zoom = el('div', 'layer', null, layer);
    this.zoom = zoom;
    const logo = buildLogo(zoom, { S, x: 540 - (3 * S + 2 * S * (142 / 280)) / 2, y: 468 });
    this.logo = logo;
    const lx = parseFloat(logo.wrap.style.left);
    const ly = parseFloat(logo.wrap.style.top);
    const hc = logo.cells[8];
    this.hole = { x: lx + hc.cx, y: ly + hc.cy };
    const hs = S * 0.5;                     // inner opening of the ring
    const hr = S * 0.05;
    const hx = this.hole.x - hs / 2;
    const hy = this.hole.y - hs / 2;
    const holePath = `M${hx + hr} ${hy}H${hx + hs - hr}A${hr} ${hr} 0 0 1 ${hx + hs} ${hy + hr}V${hy + hs - hr}A${hr} ${hr} 0 0 1 ${hx + hs - hr} ${hy + hs}H${hx + hr}A${hr} ${hr} 0 0 1 ${hx} ${hy + hs - hr}V${hy + hr}A${hr} ${hr} 0 0 1 ${hx + hr} ${hy}Z`;
    const bg = el('div', 'layer', `<svg width="1080" height="1920" viewBox="0 0 1080 1920" style="display:block;overflow:visible"><path fill="#fff" fill-rule="evenodd" d="M-6000 -6000H7080V7920H-6000Z${holePath}"/><path class="plug" fill="#fff" d="${holePath}"/></svg>`, zoom);
    zoom.insertBefore(bg, logo.wrap);
    this.plug = bg.querySelector('.plug');

    // wordmark
    const word = el('div', 'lg-word', null, zoom);
    word.innerHTML = '<span class="wm"><span class="wi">' +
      [...'CRMNow'].map((c, i) => `<span class="ch${i >= 3 ? ' accent' : ''}">${c}</span>`).join('') + '</span></span>';
    this.word = word;
    this.wchars = [...word.querySelectorAll('.ch')];
    this.sub = el('div', 'lg-sub', 'The sales CRM by <b>ineed.now</b>', zoom);

    // order squares by distance from the centre cell
    this.order = logo.cells.map((c) => Math.max(Math.abs(c.r - 1), Math.abs(c.c - 1)) + (c.r === 1 && c.c === 1 ? 0 : 0));

    fx.cues.push({ t: 3.86, type: 'whoosh', v: 0.6 }, { t: 4.04, type: 'pop', i: 0 }, { t: 4.095, type: 'pop', i: 1 },
      { t: 4.15, type: 'pop', i: 2 }, { t: 4.22, type: 'draw' }, { t: 4.3, type: 'rise' }, { t: 5.14, type: 'zoom' });
  },

  update(tau, t) {
    // ---- white flood
    const dot = this.ctx.shared.dot || { x: 540, y: 960 };
    const f = ez(t, 3.86, 4.16, E.inOutCubic);
    set(this.flood, { x: dot.x, y: dot.y, s: Math.max(0.001, f * 48), r: (1 - f) * -60, o: t < 4.18 && f > 0 ? 1 : 0 });

    // ---- zoom group becomes the white world once the flood has covered the screen
    const zOn = t >= 4.03;
    set(this.zoom, { o: zOn ? 1 : 0 });
    if (!zOn) return;

    // logo cells
    this.logo.cells.forEach((c, i) => {
      if (c.hollow) {
        const d = ez(t, 4.2, 4.56, E.inOutCubic);
        c.draw(Math.max(0.0001, d));
        const sp = spring(t - 4.18, 2.6, 0.38);
        set(c.node, { s: 0.55 + 0.45 * sp, r: (1 - d) * -90, o: t > 4.18 ? 1 : 0 });
        return;
      }
      const t0 = 4.04 + this.order[i] * 0.055;
      const sp = spring(t - t0, 2.9, 0.4);
      set(c.node, { s: Math.max(0.001, sp), r: (1 - Math.min(1, sp)) * -80, o: t > t0 ? 1 : 0 });
    });

    // wordmark + subline
    this.wchars.forEach((c, i) => {
      const a = ez(t, 4.26 + i * 0.035, 4.86 + i * 0.035, E.outExpo);
      set(c, { y: (1 - a) * 190 });
    });
    const out = ez(t, 5.06, 5.24, E.inCubic);
    set(this.word, { y: -out * 50, o: 1 - out });
    const sa = ez(t, 4.52, 5.0, E.outExpo);
    set(this.sub, { y: (1 - sa) * 30 - out * 40, o: sa * (1 - out) });

    // ---- dive through the hollow square
    set(this.plug, { o: 1 - ez(t, 5.14, 5.3) });
    const p = prog(t, 5.16, 5.625);
    const s = Math.pow(52, E.inCubic(p));
    const m = E.inOutCubic(p);
    const dx = (540 - this.hole.x) * m;
    const dy = (960 - this.hole.y) * m;
    const breath = 1 + ez(t, 4.5, 5.16, E.outQuad) * 0.03;
    set(this.zoom, { x: dx, y: dy, s: s * breath, r: E.inCubic(p) * 16, o: 1, origin: `${this.hole.x}px ${this.hole.y}px` });
  },
};
