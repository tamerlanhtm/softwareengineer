// S9 — END CARD (24.84 → 30s). White mark on brand orange, "Everything you need. Now.", then the offer:
// 14-day free trial, the URL pill (tapped) and the demo account / Instagram chips. Holds until the loop.
import { b, el, set, css, E, ez, kf, prog, lerp, spring, rng, icon } from '../engine.js';
import { buildLogo, LOGO } from '../components.js';

const S = 80;
const SIZE = 3 * S + 2 * S * LOGO.gap;
export const END_LOGO = { S, size: SIZE, x: 540 - SIZE / 2, y: 300 };
const LINE_TOP = 668;       // headline: 3 lines, 114px apart
const OFFER_Y = 1054;
const PILL_Y = 1190;
const CHIPS_Y = 1346;
const NOW = 0.94;           // "Now." slam (beat 55)
const OFFER = 1.41;         // 14-day free trial (beat 56)
const PILL = 1.875;         // URL pill (beat 57)
const CHIPS = 2.34;         // demo account + Instagram (beat 58)
const TAP = 2.81;           // cursor tap (beat 59)
const URL = 'www.ineed.now';
const IG = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.3"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>';

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
    this.floaters = Array.from({ length: 16 }, () => {
      const n = el('div', 'ec-fl' + (R() < 0.3 ? ' ring' : ''), null, root);
      const sz = 16 + R() * 46;
      n.style.width = n.style.height = `${sz}px`;
      n.style.borderRadius = `${sz * 0.2}px`;
      return { n, x: R() * 1080, y: R() * 1920, sp: 30 + R() * 70, ph: R() * 6.28, o: 0.08 + R() * 0.14, r: R() * 90 };
    });

    this.logo = buildLogo(root, { S, x: END_LOGO.x, y: END_LOGO.y, color: '#FFFFFF' });
    this.lines = ['Everything', 'you need.', 'Now.'].map((w, i) => {
      const n = el('div', 'ec-line' + (i === 2 ? ' now' : ''), `<span class="wm"><span class="wi">${w}</span></span>`, root);
      n.style.top = `${LINE_TOP + i * 114}px`;
      return { n, inner: n.querySelector('.wi') };
    });

    this.offer = el('div', 'ec-offer', `${icon('gift', 46, 2.2)}<span>14-day <b>free</b> trial</span><span class="ec-offer-shine"></span>`, root);
    this.offerShine = this.offer.querySelector('.ec-offer-shine');
    this._ow = this.offer.offsetWidth;

    this.pill = el('div', 'ec-pill', `
      <span class="ec-globe">${icon('globe', 40, 2.2)}</span>
      <span class="ec-url">${[...URL].map((c) => `<span>${c}</span>`).join('')}</span>
      <span class="ec-go">${icon('arrow-up-right', 42, 2.8)}</span>
      <span class="ec-shine"></span>`, root);
    this.urlChars = [...this.pill.querySelectorAll('.ec-url span')];
    this.go = this.pill.querySelector('.ec-go');
    this.globe = this.pill.querySelector('.ec-globe');
    this.shine = this.pill.querySelector('.ec-shine');

    const chips = el('div', 'ec-chips', `
      <span class="ec-chip">${icon('monitor-play', 32, 2.2)}Try the demo account</span>
      <span class="ec-chip">${IG}DM @ineednow_</span>`, root);
    chips.style.top = `${CHIPS_Y}px`;
    this.chips = [...chips.querySelectorAll('.ec-chip')];

    const T = (x) => this.a + x;
    fx.cues.push({ t: T(0.1), type: 'rise' }, { t: T(NOW), type: 'slam', v: 1 }, { t: T(OFFER), type: 'offer' },
      { t: T(PILL), type: 'pill' }, { t: T(PILL + 0.12), type: 'type' }, { t: T(CHIPS), type: 'rise', v: 0.5 },
      { t: T(TAP), type: 'click' }, { t: T(TAP + 0.05), type: 'chime' });
    fx.hits.push({ t: T(NOW), amp: 16, punch: 0.035, freq: 12, decay: 9 }, { t: T(OFFER), amp: 6, punch: 0.015, freq: 13, decay: 11 },
      { t: T(TAP), amp: 4, punch: 0.008, freq: 14, decay: 12 });
    fx.flashes.push({ t: T(NOW), peak: 0.28, dur: 0.3, color: '#FFFFFF' });
    fx.bursts.push(
      { t: T(NOW), x: 540, y: LINE_TOP + 2 * 114 + 60, n: 36, seed: 55, colors: ['#FFFFFF', '#FFE3D8', '#FFC2A8'], speed: 1700, gravity: 1100, size: 22, life: 1.1 },
      { t: T(OFFER), x: 540, y: OFFER_Y + 50, n: 22, seed: 61, colors: ['#FFFFFF', '#FFE3D8'], speed: 1300, gravity: 900, size: 16, life: 0.9 });
    fx.clicks.push({ t: T(TAP), x: 842, y: PILL_Y + 60, color: 'rgba(255,255,255,.95)', scale: 1.3 });
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
    const br = 1 + 0.07 * Math.max(0, Math.sin((tau - 1.4) * Math.PI * 1.0667)) * ez(tau, 1.4, 2.0);
    set(hollow.node, { s: br, origin: '50% 50%' });

    // headline
    this.lines.forEach((l, i) => {
      if (i < 2) {
        const a = ez(tau, 0.1 + i * 0.13, 0.7 + i * 0.13, E.outExpo);
        set(l.inner, { y: (1 - a) * 150, o: 1 });
      } else {
        const a = ez(tau, NOW, NOW + 0.3, E.outExpo);
        set(l.inner, { y: 0, s: lerp(2.2, 1, a), o: prog(tau, NOW, NOW + 0.06), origin: '50% 60%' });
      }
    });

    // offer badge: stamps in on the downbeat, then a light sweep every couple of beats
    const op = spring(tau - OFFER, 3.2, 0.42);
    set(this.offer, { x: 540 - this.offerW() / 2, y: OFFER_Y, s: tau < OFFER ? 0 : 0.35 + 0.65 * op, r: tau < OFFER ? 0 : (1 - Math.min(1, op)) * -8, o: tau > OFFER ? 1 : 0, origin: '50% 50%' });
    const sweep = tau < OFFER + 0.3 ? -1 : ((tau - OFFER - 0.3) % 1.4) / 0.55;
    set(this.offerShine, { x: -140 + Math.min(1, Math.max(0, sweep)) * (this.offerW() + 280), skx: -20, o: sweep > 0 && sweep < 1 ? 1 : 0 });

    // URL pill: dot -> pill, the URL types itself in
    const pp = spring(tau - PILL, 3, 0.5);
    const grow = ez(tau, PILL + 0.08, PILL + 0.55, E.outExpo);
    const press = kf(tau, [[TAP - 0.06, 0], [TAP, 1, E.outQuad], [TAP + 0.14, 0, E.outQuad]]);
    const pw = lerp(116, 760, grow);
    css(this.pill, 'width', `${pw.toFixed(1)}px`);
    set(this.pill, { x: 540 - pw / 2, y: PILL_Y, s: (tau < PILL ? 0 : Math.max(0.001, pp)) * (1 - press * 0.04), o: tau > PILL ? 1 : 0, origin: '50% 50%' });
    this.urlChars.forEach((c, i) => {
      const a = ez(tau, PILL + 0.12 + i * 0.022, PILL + 0.3 + i * 0.022, E.outCubic);
      set(c, { y: (1 - a) * 24, o: a });
    });
    set(this.go, { x: (1 - ez(tau, PILL + 0.3, PILL + 0.6, E.outBack)) * -40, o: prog(tau, PILL + 0.3, PILL + 0.4), r: (1 - ez(tau, PILL + 0.3, PILL + 0.6)) * -90 });
    set(this.globe, { o: prog(tau, PILL + 0.2, PILL + 0.35) });
    const sh = prog(tau, TAP + 0.02, TAP + 0.55);
    set(this.shine, { x: -260 + sh * 1140, skx: -20, o: sh > 0 && sh < 1 ? 1 : 0 });

    // demo account + Instagram chips
    this.chips.forEach((n, i) => {
      const a = ez(tau, CHIPS + i * 0.09, CHIPS + 0.45 + i * 0.09, E.outBack);
      set(n, { y: (1 - a) * 30, o: prog(tau, CHIPS + i * 0.09, CHIPS + 0.12 + i * 0.09) });
    });

    // cursor comes in to tap the URL
    const cx = kf(tau, [[2.3, 1150], [2.74, 842, E.inOutCubic], [3.05, 842], [3.5, 1160, E.inCubic]]);
    const cy = kf(tau, [[2.3, 1640], [2.74, PILL_Y + 62, E.inOutCubic], [3.05, PILL_Y + 62], [3.5, 1600, E.inCubic]]);
    if (tau > 2.3 && tau < 3.5) ctx.cursor.want(cx, cy, { press });
  },

  offerW() {
    return this._ow;
  },
};
