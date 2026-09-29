// S6 — DASHBOARD (16.875 → 20.156s). KPI tiles count up, the revenue curve draws itself, funnel +
// lead-source donut sweep in, a tooltip pops and a CSV export is clicked. Leaves under an orange grid wipe.
import { b, el, set, css, E, ez, kf, prog, spring, icon, text } from '../engine.js';
import { buildHead } from '../components.js';
import { T, kmoney, int } from '../i18n.js';

const REV = [38, 42, 40, 51, 49, 58, 63, 71, 86.4];         // Jan–Sep actuals ($K)
const FCST = [86.4, 92, 99, 108];                           // Sep–Dec forecast
const L10N = T.dashboard;
const MONTHS = L10N.months;
const FUNNEL = [312, 184, 96, 41].map((v, i) => [L10N.funnelRows[i], v]);
const SOURCES = [[42, '#FE4D1E'], [28, '#FF8A5C'], [18, '#C9C3BD'], [12, '#55525A']].map(([p, c], i) => [L10N.legend[i], p, c]);
const KPIS = [
  { l: L10N.kpis[0], v: 482.9, f: (v) => kmoney(v), d: '12%', spark: [4, 6, 5, 8, 7, 10, 12] },
  { l: L10N.kpis[1], v: 49.8, f: (v) => kmoney(v), d: '24%', spark: [3, 4, 4, 6, 5, 8, 11] },
  { l: L10N.kpis[2], v: 312, f: (v) => int(v), d: '18%', spark: [5, 4, 7, 6, 9, 8, 12] },
];
// chart geometry (card-local)
const CW = 900;
const PX0 = 34;
const PX1 = 866;
const PY0 = 330;          // baseline
const PH = 170;
const xAt = (i) => PX0 + (i * (PX1 - PX0)) / 11;
const yAt = (v) => PY0 - (v / 110) * PH;
const CLICK = 2.34;
const LIVE_LEAD = 1.9;
const LIVE_PIPE = 2.62;

function smooth(pts) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

export default {
  id: 'dashboard',
  a: b(36),
  b: b(43),
  pre: 0.5,
  post: 0.02,
  z: 24,

  build(layer, ctx, fx) {
    const root = el('div', 'layer', null, layer);
    this.root = root;
    this.head = buildHead(root, { num: '04', label: L10N.label, titles: [{ html: L10N.title, tin: 0.0, tout: 99 }] });

    // KPI tiles
    this.kpis = KPIS.map((k, i) => {
      const pts = k.spark.map((v, j) => [j * 18, 44 - v * 3.2]);
      const n = el('div', 'card kpi', `
        <div class="k-l">${k.l}</div>
        <div class="k-v">$0</div>
        <div class="k-f"><span class="k-d">${icon('trending-up', 22, 2.6)}${k.d}</span>
          <svg class="k-sp" width="112" height="48" viewBox="-2 -2 112 48"><path d="${smooth(pts)}" fill="none" stroke="#FE4D1E" stroke-width="4" stroke-linecap="round"/></svg></div>`, root);
      n.style.left = `${90 + i * 306}px`;
      const path = n.querySelector('path');
      return { n, k, i, v: n.querySelector('.k-v'), path, len: path.getTotalLength() };
    });

    // revenue chart
    const actual = REV.map((v, i) => [xAt(i), yAt(v)]);
    const fc = FCST.map((v, i) => [xAt(i + 8), yAt(v)]);
    const lineD = smooth(actual);
    const areaD = `${lineD}L${actual[actual.length - 1][0]} ${PY0}L${actual[0][0]} ${PY0}Z`;
    const grid = [0, 1, 2, 3].map((g) => `<line x1="${PX0}" x2="${PX1}" y1="${PY0 - g * (PH / 3.3)}" y2="${PY0 - g * (PH / 3.3)}" stroke="rgba(255,255,255,.06)" stroke-width="2" ${g ? 'stroke-dasharray="3 9"' : ''}/>`).join('');
    const labels = MONTHS.map((m, i) => `<text x="${xAt(i)}" y="${PY0 + 36}" text-anchor="middle">${m}</text>`).join('');
    this.chart = el('div', 'card rev', `
      <div class="rv-h"><div><div class="rv-t">${L10N.revenue}</div><div class="rv-s">${L10N.revenueSub}</div></div>
        <div class="btn ghost rv-x">${icon('download', 26, 2.4)}${L10N.export}</div></div>
      <svg class="rv-svg" width="${CW}" height="382" viewBox="0 0 ${CW} 382">
        <defs>
          <linearGradient id="rvFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#FE4D1E" stop-opacity=".45"/><stop offset="1" stop-color="#FE4D1E" stop-opacity="0"/></linearGradient>
          <clipPath id="rvClip"><rect class="rv-clip" x="0" y="0" width="0" height="380"/></clipPath>
        </defs>
        <g class="rv-grid">${grid}</g>
        <g class="rv-lab">${labels}</g>
        <path class="rv-area" d="${areaD}" fill="url(#rvFill)" clip-path="url(#rvClip)"/>
        <path class="rv-fc" d="${smooth(fc)}" fill="none" stroke="#FE4D1E" stroke-opacity=".55" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round"/>
        <path class="rv-line" d="${lineD}" fill="none" stroke="#FE4D1E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <circle class="rv-halo" r="26" fill="#FE4D1E" fill-opacity=".22"/>
        <circle class="rv-dot" r="11" fill="#fff" stroke="#FE4D1E" stroke-width="6"/>
      </svg>
      <div class="rv-tip"><b>${kmoney(86.4)}</b><span>${icon('trending-up', 22, 2.6)}${L10N.tip}</span></div>
      <div class="chip chip-o rv-toast">${icon('circle-check', 24, 2.4)}${L10N.file}</div>`, root);
    this.line = this.chart.querySelector('.rv-line');
    this.lineLen = this.line.getTotalLength();
    this.fc = this.chart.querySelector('.rv-fc');
    this.clip = this.chart.querySelector('.rv-clip');
    this.dot = this.chart.querySelector('.rv-dot');
    this.halo = this.chart.querySelector('.rv-halo');
    this.tip = this.chart.querySelector('.rv-tip');
    this.tipW = this.tip.offsetWidth;
    this.toast = this.chart.querySelector('.rv-toast');
    this.xbtn = this.chart.querySelector('.rv-x');
    this.sep = actual[actual.length - 1];

    // funnel
    this.funnel = el('div', 'card fun', `<div class="c-t">${L10N.funnel}</div>` + FUNNEL.map(([l, v]) =>
      `<div class="fn-r"><span class="fn-l">${l}</span><div class="fn-b"></div><span class="fn-v">${v}</span></div>`).join(''), root);
    this.fbars = [...this.funnel.querySelectorAll('.fn-b')];

    // donut
    const R = 70;
    const C = 2 * Math.PI * R;
    this.donutC = C;
    let acc = 0;
    const segs = SOURCES.map(([, p, col]) => { const s = { start: acc, len: (p / 100) * C, col }; acc += s.len; return s; });
    this.donut = el('div', 'card don', `<div class="c-t">${L10N.sources}</div>
      <div class="dn-w"><svg width="190" height="190" viewBox="-95 -95 190 190"><g transform="rotate(-90)">
        <circle r="${R}" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="30"/>
        ${segs.map((s) => `<circle class="dn-s" r="${R}" fill="none" stroke="${s.col}" stroke-width="30"/>`).join('')}
      </g></svg><div class="dn-c"><b>312</b><span>${L10N.leadsWord}</span></div>
      <div class="dn-lg">${SOURCES.map(([n, p, col]) => `<div><i style="background:${col}"></i>${n}<b>${p}%</b></div>`).join('')}</div></div>`, root);
    this.segs = segs.map((s, i) => ({ ...s, n: this.donut.querySelectorAll('.dn-s')[i] }));
    this.donutN = this.donut.querySelector('.dn-c b');
    this.funLead = this.funnel.querySelector('.fn-v');
    this.plus = el('div', 'chip chip-solid dash-plus', L10N.plusLead, root);

    // the chart card is placed by transform at (90, 798); measure the button relative to it
    const xr = this.xbtn.getBoundingClientRect();
    const cr = this.chart.getBoundingClientRect();
    this.xPos = { x: 90 + xr.left - cr.left + xr.width * 0.5, y: 798 + xr.top - cr.top + xr.height * 0.55 };
    const at = (x) => this.a + x;
    fx.clicks.push({ t: at(CLICK), x: this.xPos.x, y: this.xPos.y });
    fx.cues.push({ t: at(-0.1), type: 'tiles' }, { t: at(0.3), type: 'draw', v: 1.2 }, { t: at(1.45), type: 'pop', i: 3 },
      { t: at(CLICK), type: 'click' }, { t: at(2.42), type: 'confirm' }, { t: at(LIVE_LEAD), type: 'blip', i: 11 }, { t: at(LIVE_PIPE), type: 'count', v: 0.5 });
  },

  update(tau, t, ctx) {
    this.head.update(tau);
    set(this.root, { s: 1 + ez(tau, 0, 3.2, E.linear) * 0.025, origin: '540px 1000px' });

    const pop = (n, t0, x, y) => {
      const a = ez(tau, t0, t0 + 0.55, E.outExpo);
      set(n, { x, y: y + (1 - a) * 60, s: 0.94 + 0.06 * a, o: Math.min(1, a * 1.6) });
      return a;
    };
    // tiles: the middle one first (it receives the shrinking invoice)
    const order = [0.02, -0.3, 0.06];
    // "live": a new lead lands at 1.9s, the converted deal lifts the pipeline at 2.6s
    const liveLead = tau > LIVE_LEAD ? 1 : 0;
    const livePipe = ez(tau, LIVE_PIPE, LIVE_PIPE + 0.35, E.outCubic) * 24.8;
    this.kpis.forEach((k) => {
      pop(k.n, order[k.i], 0, 600);
      const bump = k.i === 0 ? livePipe : k.i === 2 ? liveLead : 0;
      text(k.v, k.k.f(k.k.v * ez(tau, 0.02 + k.i * 0.04, 1.05 + k.i * 0.04, E.outCubic) + bump));
      const tk = k.i === 0 ? LIVE_PIPE : k.i === 2 ? LIVE_LEAD : 99;
      const kick = tau > tk ? Math.exp(-(tau - tk) * 7) : 0;
      set(k.v, { s: 1 + kick * 0.1, origin: '0 70%' });
      css(k.v, 'color', kick > 0.25 ? 'var(--o)' : 'var(--tx)');
      const d = ez(tau, 0.25 + k.i * 0.06, 0.95 + k.i * 0.06, E.inOutCubic);
      css(k.path, 'stroke-dasharray', `${k.len}`);
      css(k.path, 'stroke-dashoffset', `${k.len * (1 - d)}`);
    });
    pop(this.chart, 0.12, 90, 798);
    pop(this.funnel, 0.2, 90, 1206);
    pop(this.donut, 0.26, 549, 1206);

    // revenue line draws; area follows via clip; a live dot rides the tip
    const d = ez(tau, 0.3, 1.3, E.inOutCubic);
    css(this.line, 'stroke-dasharray', `${this.lineLen}`);
    css(this.line, 'stroke-dashoffset', `${this.lineLen * (1 - d)}`);
    const tip = this.line.getPointAtLength(Math.max(0.01, this.lineLen * d));
    this.clip.setAttribute('width', tip.x.toFixed(1));
    this.dot.setAttribute('cx', tip.x.toFixed(1));
    this.dot.setAttribute('cy', tip.y.toFixed(1));
    this.halo.setAttribute('cx', tip.x.toFixed(1));
    this.halo.setAttribute('cy', tip.y.toFixed(1));
    const pulse = (((tau * 1.6) % 1) + 1) % 1;
    set(this.halo, { o: d > 0.02 ? (1 - pulse) * 0.9 : 0 });
    this.halo.setAttribute('r', (14 + pulse * 26).toFixed(1));
    set(this.dot, { o: d > 0.02 ? 1 : 0 });
    set(this.fc, { o: ez(tau, 1.2, 1.5) });
    const tp = spring(tau - 1.45, 3, 0.45);
    set(this.tip, { x: this.sep[0] - this.tipW / 2, y: this.sep[1] + 10 - 112 + (1 - Math.min(tp, 1)) * 20, s: tau > 1.45 ? 0.7 + 0.3 * tp : 0, o: tau > 1.45 ? 1 : 0, origin: '50% 100%' });

    // funnel + donut
    this.fbars.forEach((n, i) => css(n, 'width', `${Math.max(6, (FUNNEL[i][1] / 312) * 196 * ez(tau, 0.4 + i * 0.08, 1.1 + i * 0.08, E.outExpo))}px`));
    const k = ez(tau, 0.5, 1.35, E.inOutCubic) * this.donutC;
    for (const s of this.segs) {
      const vis = Math.max(0, Math.min(s.len - 2, k - s.start));
      css(s.n, 'stroke-dasharray', `${vis.toFixed(1)} ${this.donutC.toFixed(1)}`);
      css(s.n, 'stroke-dashoffset', `${(-s.start).toFixed(1)}`);
    }

    text(this.donutN, tau > LIVE_LEAD ? '313' : '312');
    text(this.funLead, tau > LIVE_LEAD ? '313' : '312');
    const pl = prog(tau, LIVE_LEAD, LIVE_LEAD + 0.9);
    set(this.plus, { x: 820, y: 590 - E.outCubic(pl) * 70, s: tau > LIVE_LEAD ? 0.8 + 0.2 * spring(tau - LIVE_LEAD, 3, 0.4) : 0, o: tau > LIVE_LEAD ? 1 - ez(tau, LIVE_LEAD + 0.55, LIVE_LEAD + 0.9) : 0 });

    // cursor exports the report
    const press = kf(tau, [[CLICK - 0.06, 0], [CLICK, 1, E.outQuad], [CLICK + 0.12, 0, E.outQuad]]);
    set(this.xbtn, { s: 1 - press * 0.06 });
    const { x: bx, y: by } = this.xPos;
    const cx = kf(tau, [[1.6, 1160], [2.2, bx, E.inOutCubic], [2.5, bx], [2.95, 1180, E.inCubic]]);
    const cy = kf(tau, [[1.6, 1380], [2.2, by, E.inOutCubic], [2.5, by], [2.95, 1100, E.inCubic]]);
    if (tau > 1.6 && tau < 2.95) ctx.cursor.want(cx, cy, { press });
    const ta = ez(tau, 2.42, 2.8, E.outBack);
    set(this.toast, { y: (1 - ta) * -20, s: 0.9 + 0.1 * ta, o: prog(tau, 2.42, 2.52) });
  },
};
