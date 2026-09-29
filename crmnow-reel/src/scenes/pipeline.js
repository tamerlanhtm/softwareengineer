// S4 — PIPELINE (9.375 → 13.125s). The new deal is dragged through the six-stage board while the
// camera pans with it; the weighted forecast climbs; it lands in WON with a burst. Exits with a whip-pan.
import { b, el, set, css, E, ez, kf, lerp, spring, icon, money, text } from '../engine.js';
import { buildHead } from '../components.js';
import { whipX } from './billing.js';

const COLS = [
  { name: 'New', p: 10, col: '#77737A', cards: [['Atlas Dental', 6200, 'MH', '#3A3A44', '3d'], ['Pixel Studio', 3900, 'ED', '#6B3F2C', '1d']] },
  { name: 'Qualified', p: 25, col: '#A07B6C', cards: [['Skyline Realty', 12500, 'AP', '#34404F', '4d'], ['Greenleaf Café', 2300, 'JC', '#4A3B52', '2d']] },
  { name: 'Proposal', p: 50, col: '#CC6E4C', cards: [['Orion Build', 18000, 'KB', '#3A3A44', '6d'], ['Blue Wave', 7400, 'SR', '#34404F', '2d']] },
  { name: 'Negotiation', p: 75, col: '#EE5A30', cards: [['Metro Clinic', 31000, 'NA', '#6B3F2C', '5d']] },
  { name: 'Won', p: 100, col: '#FE4D1E', cards: [['Kappa Foods', 9800, 'TY', '#4A3B52', '✓'], ['Vertex Lab', 15200, 'MH', '#3A3A44', '✓']] },
  { name: 'Lost', p: 0, col: '#45434A', cards: [['Delta Auto', 5100, 'JC', '#34404F', '—']] },
];
const X0 = 90;
const PITCH_X = 318;
const CARD_Y = 744;
const PITCH_Y = 150;
const HERO_AMT = 24800;
// hops of the hero deal: [start, duration]
const HOPS = [[0.94, 0.3], [1.41, 0.3], [1.875, 0.3], [2.34, 0.47]];
const WON_T = 2.81;
const BASE_WEIGHTED = COLS.reduce((s, c) => s + c.cards.reduce((a, k) => a + k[1], 0) * c.p / 100, 0);
const BASE_WON = COLS[4].cards.reduce((a, k) => a + k[1], 0);

const cardHTML = (co, amt, ini, bg, age, p) => `
  <div class="pc-top"><span class="pc-co">${co}</span><span class="av" style="width:40px;height:40px;font-size:16px;background:${bg}">${ini}</span></div>
  <div class="pc-amt">${money(amt)}</div>
  <div class="pc-foot"><span class="pc-p">${p}</span><span class="pc-age">${age}</span></div>`;

export default {
  id: 'pipeline',
  a: b(20),
  b: b(28),
  pre: 0.2,
  post: 0.32,
  z: 22,

  build(layer, ctx, fx) {
    const root = el('div', 'layer', null, layer);
    this.root = root;
    this.head = buildHead(root, {
      num: '02', label: 'Deals & Pipelines',
      titles: [{ html: 'Close deals<br><b>faster.</b>', tin: -0.1, tout: 99 }],
    });

    this.board = el('div', 'layer', null, root);
    this.cols = COLS.map((c, i) => {
      const n = el('div', 'pcol', `
        <div class="pcol-bar" style="background:${c.col}"></div>
        <div class="pcol-h"><span class="pcol-dot" style="background:${c.col}"></span><span class="pcol-name">${c.name}</span><span class="pcol-n">${c.cards.length}</span></div>
        <div class="pcol-sum"><span class="sum">${money(c.cards.reduce((a, k) => a + k[1], 0))}</span><span class="pp">${c.name === 'Lost' ? '' : c.p + '%'}</span></div>
        <div class="pcol-drop"></div>`, this.board);
      n.style.left = `${X0 + i * PITCH_X}px`;
      const cards = c.cards.map((k, j) => {
        const cn = el('div', 'pcard' + (c.name === 'Won' ? ' won' : ''), cardHTML(k[0], k[1], k[2], k[3], k[4], c.name === 'Won' ? 'Won' : c.p + '%'), this.board);
        return { n: cn, j };
      });
      return { n, c, i, cards, cnt: n.querySelector('.pcol-n'), sum: n.querySelector('.sum'), drop: n.querySelector('.pcol-drop'), base: c.cards.reduce((a, k) => a + k[1], 0) };
    });

    // the hero deal (continues from the Leads scene)
    this.hero = el('div', 'pcard hero', cardHTML('Nova Logistics', HERO_AMT, 'YO', '#3A3A44', 'now', '10%'), this.board);
    this.heroP = this.hero.querySelector('.pc-p');
    this.heroAge = this.hero.querySelector('.pc-age');
    this.heroWon = el('div', 'pc-won', `${icon('check', 26, 3.2)}`, this.hero);

    // forecast panel
    this.fc = el('div', 'card fc', `
      <div class="fc-col"><div class="fc-l">Weighted forecast</div><div class="fc-v"><span class="wv">$0</span><span class="fc-up">${icon('trending-up', 28, 2.6)}</span></div></div>
      <div class="fc-col r"><div class="fc-l">Won this month</div><div class="fc-v"><span class="wn">$0</span></div></div>
      <div class="fc-bar">${COLS.slice(0, 5).map((c) => `<span style="background:${c.col}"></span>`).join('')}</div>`, root);
    this.wv = this.fc.querySelector('.wv');
    this.wn = this.fc.querySelector('.wn');
    this.bars = [...this.fc.querySelectorAll('.fc-bar span')];

    const T = (x) => this.a + x;
    HOPS.forEach(([s], i) => fx.cues.push({ t: T(s - 0.06), type: 'grab', i }, { t: T(s + HOPS[i][1]), type: 'place', i }));
    fx.cues.push({ t: T(WON_T), type: 'win' }, { t: T(3.3), type: 'whip' });
    fx.hits.push({ t: T(WON_T), amp: 12, punch: 0.03, freq: 12, decay: 9 });
    fx.flashes.push({ t: T(WON_T), peak: 0.22, dur: 0.35, color: '#FE4D1E' });
    fx.bursts.push({ t: T(WON_T), x: 558, y: CARD_Y + 69, n: 44, seed: 21, colors: ['#FE4D1E', '#FF8A5C', '#FFFFFF', '#FFC2A8'], speed: 1900, gravity: 1300, size: 24, life: 1.2, dx: whipX });
  },

  update(tau, t, ctx) {
    this.head.update(tau);

    // whip-pan exit (shared camera move with the billing scene)
    set(this.root, { x: whipX(t) });

    // camera pan across the board, following the deal
    const pan = kf(tau, [[1.45, 0], [1.8, -PITCH_X, E.inOutCubic], [1.92, -PITCH_X], [2.27, -2 * PITCH_X, E.inOutCubic],
      [2.38, -2 * PITCH_X], [2.8, -3 * PITCH_X, E.inOutCubic]]);
    set(this.board, { x: pan });

    // hero column position (fractional while dragging) and lift
    let col = 0;
    let lift = 0;
    let arc = 0;
    HOPS.forEach(([s, d], k) => {
      const m = ez(tau, s, s + d, E.inOutCubic);
      col += m;
      arc += Math.sin(m * Math.PI) * (k === 3 ? -46 : -24);
      lift = Math.max(lift, ez(tau, s - 0.08, s + 0.02, E.outCubic) * (1 - ez(tau, s + d - 0.04, s + d + 0.1, E.inOutQuad)));
    });
    const stage = Math.round(col);
    const land = HOPS.reduce((a, [s, d]) => a + (tau > s + d ? Math.exp(-(tau - s - d) * 9) * Math.sin((tau - s - d) * 34) : 0), 0);

    // columns + their cards
    for (const c of this.cols) {
      const a = ez(tau, -0.2 + c.i * 0.05, 0.4 + c.i * 0.05, E.outExpo);
      set(c.n, { y: (1 - a) * 90, o: Math.min(1, a * 1.4) });
      // does the hero sit in this column? (slides others down, springy)
      let occ = 0;
      if (c.i === 0) occ = 1 - ez(tau, HOPS[0][0], HOPS[0][0] + 0.2);
      else if (c.i <= 4) {
        const [si, di] = HOPS[c.i - 1];
        const inT = si + di * 0.7;
        occ = Math.min(1.03, spring(tau - inT, 3, 0.5));
        if (c.i < 4) occ *= 1 - ez(tau, HOPS[c.i][0], HOPS[c.i][0] + 0.2);
      }
      c.cards.forEach((k) => {
        const ca = ez(tau, 0.02 + c.i * 0.05 + k.j * 0.06, 0.45 + c.i * 0.05 + k.j * 0.06, E.outExpo);
        set(k.n, { x: X0 + c.i * PITCH_X + 12, y: CARD_Y + (k.j + occ) * PITCH_Y + (1 - ca) * 70, o: Math.min(1, ca * 1.5) });
      });
      text(c.cnt, String(c.cards.length + (c.i === stage ? 1 : 0)));
      text(c.sum, money(c.base + (c.i === stage ? HERO_AMT : 0)));
      // drop-zone highlight while the deal hovers
      let dz = 0;
      HOPS.forEach(([s, d], k) => { if (k + 1 === c.i) dz = Math.max(dz, ez(tau, s, s + d * 0.6) * (1 - ez(tau, s + d, s + d + 0.25))); });
      set(c.drop, { o: dz });
    }

    // hero card
    const heroIn = ez(tau, -0.1, 0.02);
    const won = ez(tau, WON_T - 0.02, WON_T + 0.12);
    const hx = X0 + col * PITCH_X + 12;
    const hy = CARD_Y + arc - lift * 8;
    set(this.hero, { x: hx, y: hy, s: 1 + lift * 0.07 + land * 0.025, r: lift * 2.6 * (1 - won), o: heroIn });
    css(this.hero, '--lift', lift.toFixed(3));
    this.hero.classList.toggle('is-won', won > 0.5);
    text(this.heroP, stage >= 4 ? 'Won' : `${COLS[stage].p}%`);
    text(this.heroAge, stage >= 4 ? '✓' : 'now');
    set(this.heroWon, { s: spring(tau - WON_T, 3, 0.4), o: tau > WON_T ? 1 : 0 });

    // cursor rides the card during each drag
    const grab = HOPS.some(([s, d]) => tau > s - 0.05 && tau < s + d + 0.02) ? 1 : 0;
    const sx = hx + pan + 206;
    const sy = hy + 84;
    const enter = ez(tau, 0.45, 0.9, E.outCubic);
    const leave = ez(tau, 2.95, 3.3, E.inCubic);
    if (tau > 0.45 && tau < 3.3) ctx.cursor.want(lerp(1150, sx, enter) + leave * 400, lerp(1500, sy, enter) + leave * 300, { press: grab * 0.8 });

    // forecast
    const fa = ez(tau, 0.1, 0.55, E.outExpo);
    set(this.fc, { y: 1232 + (1 - fa) * 80, x: 90, o: fa });
    let pv = COLS[0].p;
    HOPS.forEach(([s, d], k) => { pv = lerp(pv, COLS[k + 1].p, ez(tau, s + d * 0.5, s + d + 0.35, E.outCubic)); });
    const weighted = BASE_WEIGHTED + HERO_AMT * pv / 100;
    text(this.wv, money(Math.round(lerp(0, weighted, ez(tau, 0.1, 0.9, E.outCubic)) / 10) * 10));
    text(this.wn, money(Math.round(lerp(0, BASE_WON, ez(tau, 0.15, 0.95, E.outCubic)) + HERO_AMT * ez(tau, WON_T, WON_T + 0.45, E.outCubic))));
    const pulse = ez(tau, WON_T, WON_T + 0.1) * (1 - ez(tau, WON_T + 0.25, WON_T + 0.6));
    set(this.wn, { s: 1 + pulse * 0.12, origin: '0 70%' });
    css(this.wn, 'color', tau > WON_T ? 'var(--o)' : 'var(--tx)');
    // stacked bar = weighted share per stage
    this.bars.forEach((n, i) => {
      const colData = this.cols[i];
      const val = colData.base * COLS[i].p / 100 + (i === stage ? HERO_AMT * COLS[i].p / 100 : 0);
      css(n, 'flex-grow', (val * ez(tau, 0.3 + i * 0.05, 0.9 + i * 0.05, E.outCubic)).toFixed(1));
    });
  },
};
