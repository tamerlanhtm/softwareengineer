// S9 — END CARD (24.84 → 30s). White mark on brand orange, "Everything you need. Now.",
// the URL pill builds itself and gets tapped, then everything breathes until the loop.
import { b, el, set, css, E, ez, kf, prog, lerp, spring, rng, icon } from '../engine.js';
import { buildLogo, LOGO } from '../components.js';

const S = 104;
const SIZE = 3 * S + 2 * S * LOGO.gap;
export const END_LOGO = { S, size: SIZE, x: 540 - SIZE / 2, y: 292 };
const NOW = 0.94;           // "Now." slam (beat 55)
const PILL = 1.41;          // CTA pill (beat 56)
const TAP = 2.81;           // cursor tap (beat 59)
const URL = 'www.ineed.now';
const IG = '<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.3"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>';

export default {
  id: 'endcard',
  a: b(53),
  b: b(64),
  pre: 0,
  post: 0.1,
  z: 60,

  build(layer, ctx, fx) {
    const root = el('div', 'layer ec', null, layer);
    this.root = root;
    // drifting squares (the mark's building block) for depth
    const R = rng(99);
    this.floaters = Array.from({ length: 16 }, (_, i) => {
      const n = el('div', 'ec-fl' + (R() < 0.3 ? ' ring' : ''), null, root);
      const sz = 16 + R() * 46;
      n.style.width = n.style.height = `${sz}px`;
      n.style.borderRadius = `${sz * 0.2}px`;
      return { n, x: R() * 1080, y: R() * 1920, sp: 30 + R() * 70, ph: R() * 6.28, o: 0.08 + R() * 0.14, r: R() * 90 };
    });

    this.logo = buildLogo(root, { S, x: END_LOGO.x, y: END_LOGO.y, color: '#FFFFFF' });
    this.lines = ['Everything', 'you need.', 'Now.'].map((w, i) => {
      const n = el('div', 'ec-line' + (i === 2 ? ' now' : ''), `<span class="wm"><span class="wi">${w}</span></span>`, root);
      n.style.top = `${770 + i * 128}px`;
      return { n, inner: n.querySelector('.wi') };
    });

    this.pill = el('div', 'ec-pill', `
      <span class="ec-globe">${icon('globe', 44, 2.2)}</span>
      <span class="ec-url">${[...URL].map((c) => `<span>${c}</span>`).join('')}</span>
      <span class="ec-go">${icon('arrow-up-right', 46, 2.8)}</span>
      <span class="ec-shine"></span>`, root);
    this.urlChars = [...this.pill.querySelectorAll('.ec-url span')];
    this.go = this.pill.querySelector('.ec-go');
    this.globe = this.pill.querySelector('.ec-globe');
    this.shine = this.pill.querySelector('.ec-shine');
    this.handle = el('div', 'ec-handle', `<span class="dm">or DM us</span>${IG}<b>@ineednow_</b>`, root);

    const T = (x) => this.a + x;
    fx.cues.push({ t: T(0.1), type: 'rise' }, { t: T(NOW), type: 'slam', v: 1 }, { t: T(PILL), type: 'pill' },
      { t: T(1.6), type: 'type' }, { t: T(1.875), type: 'rise', v: 0.5 }, { t: T(TAP), type: 'click' }, { t: T(TAP + 0.05), type: 'chime' });
    fx.hits.push({ t: T(NOW), amp: 16, punch: 0.035, freq: 12, decay: 9 }, { t: T(TAP), amp: 4, punch: 0.008, freq: 14, decay: 12 });
    fx.flashes.push({ t: T(NOW), peak: 0.28, dur: 0.3, color: '#FFFFFF' });
    fx.bursts.push({ t: T(NOW), x: 540, y: 770 + 2 * 128 + 60, n: 36, seed: 55, colors: ['#FFFFFF', '#FFE3D8', '#FFC2A8'], speed: 1700, gravity: 1100, size: 22, life: 1.1 });
    fx.clicks.push({ t: T(TAP), x: 836, y: 1286, color: 'rgba(255,255,255,.95)', scale: 1.3 });
  },

  update(tau, t, ctx) {
    // floaters drift upward slowly
    for (const f of this.floaters) {
      const y = ((f.y - tau * f.sp) % 2100 + 2100) % 2100 - 90;
      set(f.n, { x: f.x + Math.sin(tau * 0.8 + f.ph) * 16, y, r: f.r + tau * 20, o: f.o });
    }

    // logo: lands on the beat with a little squash, then the hollow square breathes
    const land = spring(tau, 2.6, 0.35);
    set(this.logo.wrap, { s: 1.06 - 0.06 * land, origin: '50% 50%' });
    const hollow = this.logo.cells[8];
    const br = 1 + 0.06 * Math.max(0, Math.sin((tau - 1.4) * Math.PI * 1.0667)) * ez(tau, 1.4, 2.0);
    set(hollow.node, { s: br, origin: '50% 50%' });

    // headline
    this.lines.forEach((l, i) => {
      if (i < 2) {
        const a = ez(tau, 0.1 + i * 0.13, 0.7 + i * 0.13, E.outExpo);
        set(l.inner, { y: (1 - a) * 160, o: 1 });
      } else {
        const a = ez(tau, NOW, NOW + 0.3, E.outExpo);
        set(l.inner, { y: 0, s: lerp(2.2, 1, a), o: prog(tau, NOW, NOW + 0.06), origin: '50% 60%' });
      }
    });

    // CTA pill: dot -> pill, URL types itself in
    const pp = spring(tau - PILL, 3, 0.5);
    const grow = ez(tau, PILL + 0.1, PILL + 0.6, E.outExpo);
    const press = kf(tau, [[TAP - 0.06, 0], [TAP, 1, E.outQuad], [TAP + 0.14, 0, E.outQuad]]);
    css(this.pill, 'width', `${lerp(124, 800, grow).toFixed(1)}px`);
    set(this.pill, { x: 540 - lerp(124, 800, grow) / 2, y: 1224, s: (tau < PILL ? 0 : Math.max(0.001, pp)) * (1 - press * 0.04), o: tau > PILL ? 1 : 0, origin: '50% 50%' });
    this.urlChars.forEach((c, i) => {
      const a = ez(tau, 1.6 + i * 0.024, 1.8 + i * 0.024, E.outCubic);
      set(c, { y: (1 - a) * 26, o: a });
    });
    set(this.go, { x: (1 - ez(tau, 1.78, 2.1, E.outBack)) * -40, o: prog(tau, 1.78, 1.9), r: (1 - ez(tau, 1.78, 2.1)) * -90 });
    set(this.globe, { o: prog(tau, PILL + 0.25, PILL + 0.45) });
    const sh = prog(tau, TAP + 0.02, TAP + 0.55) + (tau > 4.2 ? prog(tau, 4.2, 4.75) : 0) - (tau > 4.2 ? 1 : 0);
    set(this.shine, { x: -260 + Math.max(0, sh) * 1180, skx: -20, o: sh > 0 && sh < 1 ? 1 : 0 });

    const hd = ez(tau, 1.875, 2.3, E.outExpo);
    set(this.handle, { y: 1392 + (1 - hd) * 30, o: hd });

    // cursor comes in to tap the URL
    const cx = kf(tau, [[2.25, 1150], [2.72, 838, E.inOutCubic], [3.05, 838], [3.5, 1160, E.inCubic]]);
    const cy = kf(tau, [[2.25, 1640], [2.72, 1288, E.inOutCubic], [3.05, 1288], [3.5, 1600, E.inCubic]]);
    if (tau > 2.25 && tau < 3.5) ctx.cursor.want(cx, cy, { press });
  },
};
