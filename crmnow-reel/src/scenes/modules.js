// S8 — ALL-IN-ONE (22.5 → 24.84s). 21 module tiles flip in on a diagonal wave, a highlight ripples
// across them, then every tile flies into the 3x3 mark while the frame floods orange (-> end card).
import { b, el, set, css, E, ez, prog, lerp, icon, textWidth } from '../engine.js';
import { buildHead, LOGO } from '../components.js';
import { END_LOGO } from './endcard.js';
import { T } from '../i18n.js';

const L10N = T.modules;
const MODS = [
  'user-plus', 'user-round', 'building-2', 'kanban', 'list-checks', 'package', 'file-text', 'receipt', 'credit-card',
  'life-buoy', 'megaphone', 'message-square', 'calendar-days', 'layout-dashboard', 'chart-column', 'shield-check',
  'folder-open', 'plug', 'workflow', 'sliders-horizontal', 'settings',
].map((ic, i) => [L10N.tiles[i], ic]);
const HELLO = L10N.hello;
const GX = 90;
const GY = 640;
const TW = 288;
const TH = 104;
const PX = 306;
const PY = 117;
const COLLAPSE = 1.6;

export default {
  id: 'modules',
  a: b(48),
  b: b(53),
  pre: 0,
  post: 0.02,
  z: 26,

  build(layer, ctx, fx) {
    const root = el('div', 'layer', null, layer);
    this.root = root;
    this.titles = [{ html: L10N.title, tin: -0.02, tout: 1.5, stagger: 0.117 }];
    this.head = buildHead(root, { num: '06', label: L10N.label, titles: this.titles, size: 100 });

    // greeting pill next to "4 languages."
    const w2 = textWidth(L10N.line2, '800 100px "Inter Tight Variable"', -4.5);
    this.hello = el('div', 'md-hello', `${icon('languages', 30, 2.2)}<div class="md-hw">${HELLO.map(([w, c]) => `<span><b>${w}</b><i>${c}</i></span>`).join('')}</div>`, root);
    this.hello.style.left = `${Math.min(760, 90 + w2 + 34)}px`;
    this.hw = [...this.hello.querySelectorAll('.md-hw span')];

    this.flood = el('div', 'md-flood', null, root);
    const grid = el('div', 'layer md-grid', null, root);
    const S = END_LOGO.S;
    const G = S * LOGO.gap;
    this.tiles = MODS.map(([name, ic], i) => {
      const r = Math.floor(i / 3);
      const c = i % 3;
      const n = el('div', 'md-t', `<div class="md-in"><span class="md-i">${icon(ic, 30, 2.2)}</span><span class="md-l">${name}</span></div><div class="md-ring"></div>`, grid);
      const R = Math.min(2, Math.floor((r * 3) / 7));
      const hollow = R === 2 && c === 2;
      const tx = END_LOGO.x + c * (S + G);
      const ty = END_LOGO.y + R * (S + G);
      return { n, i, r, c, hollow, tx, ty, inner: n.querySelector('.md-in'), ring: n.querySelector('.md-ring') };
    });

    const at = (x) => this.a + x;
    fx.cues.push({ t: at(0.02), type: 'cascade' }, { t: at(0.25), type: 'tick', i: 9 }, { t: at(0.5), type: 'tick', i: 10 },
      { t: at(0.85), type: 'shimmer' }, { t: at(COLLAPSE), type: 'collapse' }, { t: this.b, type: 'logo' });
  },

  update(tau) {
    this.head.update(tau);
    // greeting pill: pops after "4 languages." and cycles through the four UI languages
    const ha = ez(tau, 0.42, 0.8, E.outBack);
    const hout = ez(tau, 1.5, 1.72, E.inCubic);
    set(this.hello, { y: 432 + (1 - ha) * 20 - hout * 30, s: 0.85 + 0.15 * ha, o: prog(tau, 0.42, 0.55) * (1 - hout) });
    const cyc = Math.max(0, (tau - 0.55) / 0.26);
    this.hw.forEach((n, i) => {
      // continuous vertical roll: word i is centred when cyc == i (mod 4)
      let d = ((i - cyc) % 4 + 4) % 4;
      if (d > 2) d -= 4;
      const k = Math.max(-1, Math.min(1, d));
      const eased = Math.sign(k) * E.inOutCubic(Math.abs(k));
      set(n, { y: eased * 52, o: 1 - Math.abs(eased) });
    });

    // flood behind the forming logo
    const fl = ez(tau, 1.92, 2.3, E.inOutCubic);
    set(this.flood, { x: 540, y: END_LOGO.y + END_LOGO.size / 2, s: Math.max(0.001, fl * 30), r: 45 - fl * 45, o: fl > 0 ? 1 : 0 });

    for (const tl of this.tiles) {
      const k = tl.r + tl.c;
      const t0 = 0.04 + k * 0.045;
      const a = ez(tau, t0, t0 + 0.5, E.outBack);
      // shimmer wave
      const w0 = 0.86 + k * 0.035;
      const sh = ez(tau, w0, w0 + 0.12) * (1 - ez(tau, w0 + 0.14, w0 + 0.45));
      set(tl.ring, { o: sh });
      // collapse into the logo cell
      const ci = COLLAPSE + tl.i * 0.012;
      const m = ez(tau, ci, ci + 0.46, E.inOutCubic);
      const mc = ez(tau, ci, ci + 0.16, E.outQuad);            // colour flips to white early
      const spin = Math.sin(m * Math.PI) * ((tl.i * 37) % 2 ? 14 : -14);
      const S = END_LOGO.S;
      const x = lerp(GX + tl.c * PX, tl.tx, m);
      const y = lerp(GY + tl.r * PY, tl.ty, m);
      css(tl.n, 'width', `${lerp(TW, S, m).toFixed(2)}px`);
      css(tl.n, 'height', `${lerp(TH, S, m).toFixed(2)}px`);
      if (tl.hollow) {
        css(tl.n, 'border-radius', `${lerp(24, S * LOGO.rOuter, m).toFixed(2)}px`);
        css(tl.n, 'border', `${lerp(1.5, S * LOGO.ring, m).toFixed(2)}px solid ${mixc([255, 255, 255, 0.07], [255, 255, 255, 1], mc)}`);
        css(tl.n, 'background', mixc([28, 28, 34, 1], [255, 255, 255, 0], mc));
      } else {
        css(tl.n, 'border-radius', `${lerp(24, S * LOGO.rFill, m).toFixed(2)}px`);
        css(tl.n, 'border', `${lerp(1.5, 0, m).toFixed(2)}px solid rgba(255,255,255,${lerp(0.07, 0, m).toFixed(3)})`);
        css(tl.n, 'background', mixc([28, 28, 34, 1], [255, 255, 255, 1], mc));
      }
      set(tl.inner, { o: 1 - ez(tau, ci - 0.04, ci + 0.1) });
      set(tl.n, { x, y, rx: (1 - a) * -95, r: spin, o: prog(tau, t0, t0 + 0.12), origin: m > 0 ? '50% 50%' : '50% 0%' });
    }
  },
};

function mixc(a, c, k) {
  const m = a.map((v, i) => lerp(v, c[i], k));
  return `rgba(${Math.round(m[0])},${Math.round(m[1])},${Math.round(m[2])},${m[3].toFixed(3)})`;
}
