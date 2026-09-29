// S7 — AUTOMATION (20.156 → 22.5s). A workflow assembles node by node, then a run fires:
// light pulses race down the connectors, every node checks off and the run history ticks up.
import { b, el, set, css, E, ez, prog, spring, icon, text } from '../engine.js';
import { buildHead } from '../components.js';
import { T, money, int } from '../i18n.js';

const L10N = T.automation;
const NODES = [
  { ic: 'zap', x: 160, y: 618, w: 760, solid: true },
  { ic: 'filter', x: 160, y: 820, w: 760 },
  { ic: 'receipt', x: 90, y: 1030, w: 430 },
  { ic: 'bell', x: 560, y: 1030, w: 430 },
].map((N, i) => {
  const [k, t] = L10N.nodes[i];
  return { ...N, k, t: typeof t === 'function' ? t(money) : t };
});
const NH = 132;
const PATHS = [
  'M540 750V820',
  'M540 952V975Q540 991 524 991H321Q305 991 305 1007V1030',
  'M540 952V975Q540 991 556 991H759Q775 991 775 1007V1030',
  'M305 1162V1220',
  'M775 1162V1220',
];
// [draw start, draw end, pulse start, pulse end]
const TIMING = [[0.26, 0.4, 0.92, 1.06], [0.46, 0.64, 1.1, 1.3], [0.46, 0.64, 1.1, 1.3], [0.7, 0.8, 1.36, 1.48], [0.7, 0.8, 1.36, 1.48]];
const NODE_IN = [0.12, 0.32, 0.56, 0.62];
const NODE_FIRE = [0.9, 1.07, 1.31, 1.31];

export default {
  id: 'automation',
  a: b(43),
  b: b(48),
  pre: 0,
  post: 0.3,
  z: 25,

  build(layer, ctx, fx) {
    const root = el('div', 'layer', null, layer);
    this.root = root;
    this.head = buildHead(root, { num: '05', label: L10N.label, titles: [{ html: L10N.title, tin: 0.1, tout: 99 }] });

    const svg = el('div', 'layer', `<svg width="1080" height="1920" viewBox="0 0 1080 1920" style="display:block">
      ${PATHS.map((d) => `<path class="au-p" d="${d}" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="4" stroke-linecap="round"/>`).join('')}
      ${PATHS.map(() => '<g class="au-pulse"><circle r="22" fill="#FE4D1E" fill-opacity=".25"/><circle r="10" fill="#fff"/></g>').join('')}
    </svg>`, root);
    this.paths = [...svg.querySelectorAll('.au-p')].map((p) => ({ p, len: p.getTotalLength() }));
    this.pulses = [...svg.querySelectorAll('.au-pulse')];

    this.nodes = NODES.map((N) => {
      const n = el('div', 'card au-n' + (N.solid ? ' solid' : '') + (N.w < 500 ? ' sm' : ''), `
        <div class="au-i">${icon(N.ic, 38, 2.3)}</div>
        <div class="au-tx"><div class="au-k">${N.k}</div><div class="au-t">${N.t}</div></div>
        <div class="au-ok">${icon('check', 26, 3.2)}</div>
        <div class="au-glow"></div>`, root);
      n.style.cssText = `left:${N.x}px;top:${N.y}px;width:${N.w}px;height:${NH}px`;
      return { n, N, ok: n.querySelector('.au-ok'), glow: n.querySelector('.au-glow') };
    });

    this.hist = el('div', 'card au-h', `
      <div class="au-hh"><span class="au-ht">${icon('clock', 26, 2.3)}${L10N.history}</span><span class="au-hs">${L10N.runs(int(1283))}</span></div>
      <div class="au-bars">${Array.from({ length: 28 }, (_, i) => `<span style="height:${18 + Math.round(40 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)))}px"></span>`).join('')}</div>
      <div class="au-row">${icon('circle-check', 26, 2.4)}<span>${L10N.row}</span><em>${L10N.justNow}</em></div>`, root);
    this.runs = this.hist.querySelector('.runs');
    this.bars = [...this.hist.querySelectorAll('.au-bars span')];
    this.row = this.hist.querySelector('.au-row');

    const at = (x) => this.a + x;
    NODE_IN.forEach((x, i) => fx.cues.push({ t: at(x), type: 'node', i }));
    fx.cues.push({ t: at(0.9), type: 'run' }, { t: at(1.07), type: 'tick', i: 7 }, { t: at(1.31), type: 'tick', i: 8 }, { t: at(1.5), type: 'confirm' });
  },

  update(tau) {
    this.head.update(tau);
    const out = ez(tau, 2.0, 2.4, E.inCubic);
    set(this.root, { s: 1 - out * 0.08, y: -out * 40, o: 1 - out, origin: '540px 1000px' });

    this.nodes.forEach((d, i) => {
      const t0 = NODE_IN[i];
      const p = spring(tau - t0, 2.8, 0.5);
      set(d.n, { s: tau < t0 ? 0.9 : 0.9 + 0.1 * p, y: (1 - Math.min(1, p)) * 30, o: prog(tau, t0, t0 + 0.12) });
      const f = NODE_FIRE[i];
      const g = ez(tau, f - 0.03, f + 0.08) * (1 - ez(tau, f + 0.35, f + 0.8)) + ez(tau, f + 0.3, f + 0.6) * 0.35;
      set(d.glow, { o: g });
      const ok = spring(tau - (f + 0.06), 3.2, 0.4);
      set(d.ok, { s: tau > f + 0.06 ? ok : 0, o: tau > f + 0.06 ? 1 : 0 });
    });

    this.paths.forEach(({ p, len }, i) => {
      const [d0, d1, p0, p1] = TIMING[i];
      const d = ez(tau, d0, d1, E.inOutCubic);
      css(p, 'stroke-dasharray', `${len}`);
      css(p, 'stroke-dashoffset', `${len * (1 - d)}`);
      css(p, 'stroke', tau > p1 ? 'rgba(254,77,30,.8)' : 'rgba(255,255,255,.16)');
      const k = ez(tau, p0, p1, E.inOutQuad);
      const pt = p.getPointAtLength(len * k);
      const on = tau > p0 && tau < p1 + 0.08;
      set(this.pulses[i], { x: pt.x, y: pt.y, o: on ? 1 - ez(tau, p1, p1 + 0.08) : 0 });
    });

    const ha = ez(tau, 0.76, 1.2, E.outExpo);
    set(this.hist, { y: 1220 + (1 - ha) * 50, x: 90, o: ha });
    text(this.runs, int(tau > 1.48 ? 1284 : 1283));
    this.bars.forEach((n, i) => {
      const last = i === this.bars.length - 1;
      const g = last ? ez(tau, 1.48, 1.7, E.outBack) : ez(tau, 0.8 + i * 0.012, 1.1 + i * 0.012, E.outCubic);
      set(n, { sy: Math.max(0.02, g), origin: '50% 100%' });
    });
    const ra = ez(tau, 1.5, 1.85, E.outExpo);
    set(this.row, { x: (1 - ra) * 40, o: ra });
  },
};
