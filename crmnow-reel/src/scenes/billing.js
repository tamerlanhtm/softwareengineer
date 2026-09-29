// S5 — BILLING (13.125 → 16.875s). A quote builds itself, gets accepted, flips (3D) into an invoice,
// two payments land and it's stamped PAID. Enters with the whip-pan, exits by shrinking into the dashboard.
import { b, el, set, css, E, ez, kf, prog, lerp, spring, icon, text } from '../engine.js';
import { buildHead, logoMarkHTML } from '../components.js';
import { T, money } from '../i18n.js';

export const WHIP = { a: b(20) + 3.3, d: 0.75 };      // shared whip-pan window (global seconds)
export const whipX = (t) => -1350 * E.inOutExpo(prog(t, WHIP.a, WHIP.a + WHIP.d));

const L10N = T.billing;
const ITEMS = [
  [L10N.items[0], '1', 2400],
  [L10N.items[1], '12', 4320],
  [L10N.items[2], '1', 1200],
];
const SUB = 7920;
const DISC = 792;
const TAX = 1283.04;
const TOTAL = 8411.04;
const PAY1 = 4000;
const ACCEPT = 1.17;
const FLIP = [1.41, 1.875];
const PAID = 2.81;

export default {
  id: 'billing',
  a: b(28),
  b: b(36),
  pre: 0.46,
  post: 0.05,
  z: 23,

  build(layer, ctx, fx) {
    const root = el('div', 'layer', null, layer);
    this.root = root;
    this.titles = [{ html: L10N.title, tin: 0.02, tout: 3.3 }];
    this.head = buildHead(root, { num: '03', label: L10N.label, titles: this.titles });
    this.words = this.titles[0].words.map((w) => w.inner);

    const persp = el('div', 'layer doc-persp', null, root);
    const doc = el('div', 'doc', null, persp);
    this.doc = doc;
    const mark = logoMarkHTML(12.5);
    const front = el('div', 'face front', `
      <div class="d-head"><div class="d-brand">${mark}<span class="d-kind">${L10N.quote}</span></div><div class="d-id"><b>Q-1042</b><span>${L10N.valid}</span></div></div>
      <div class="d-bill"><div class="d-lbl">${L10N.billTo}</div><div class="d-co">Nova Logistics</div><div class="d-pp">${L10N.person}</div></div>
      <div class="d-th"><span>${L10N.th[0]}</span><span>${L10N.th[1]}</span><span>${L10N.th[2]}</span></div>
      ${ITEMS.map(([n, q, a]) => `<div class="d-row"><span>${n}</span><span class="q">${q}</span><span class="a">${money(a, 2)}</span></div>`).join('')}
      <div class="d-sum">
        <div class="d-s"><span>${L10N.subtotal}</span><span>${money(SUB, 2)}</span></div>
        <div class="d-s"><span>${L10N.discount}</span><span>−${money(DISC, 2)}</span></div>
        <div class="d-s"><span>${L10N.tax}</span><span>${money(TAX, 2)}</span></div>
      </div>
      <div class="d-total"><span>${L10N.total}</span><span class="tv">${money(0, 2)}</span></div>
      <div class="d-btns"><div class="btn d-ghost">${L10N.decline}</div><div class="btn solid acc">${icon('check', 30, 3)}${L10N.accept}</div></div>
      <div class="stamp acc-stamp">${icon('check', 44, 3.4)}${L10N.accepted}</div>`, doc);
    const back = el('div', 'face back', `
      <div class="d-head"><div class="d-brand">${mark}<span class="d-kind">${L10N.invoice}</span></div><div class="d-id"><b>INV-0142</b><span>${L10N.due}</span></div></div>
      <div class="d-bill"><div class="d-lbl">${L10N.billTo}</div><div class="d-co">Nova Logistics</div><div class="d-pp">${icon('file-check', 24, 2.2)}${L10N.converted}</div></div>
      <div class="d-lbl mt">${L10N.amountDue}</div>
      <div class="d-due">${money(TOTAL, 2)}</div>
      <div class="d-prog"><div class="fill"></div></div>
      <div class="d-pl"><span class="pct">${L10N.paidPct(0)}</span><span>${money(TOTAL, 2)}</span></div>
      <div class="d-lbl mt2">${L10N.payments}</div>
      <div class="d-pay p1"><span class="pi">${icon('landmark', 28, 2.2)}</span><span class="pn">${L10N.pay1[0]}<small>${L10N.pay1[1]}</small></span><span class="pa">${money(PAY1, 2)}</span><span class="pk">${icon('check', 22, 3.2)}</span></div>
      <div class="d-pay p2"><span class="pi">${icon('credit-card', 28, 2.2)}</span><span class="pn">${L10N.pay2[0]}<small>${L10N.pay2[1]}</small></span><span class="pa">${money(TOTAL - PAY1, 2)}</span><span class="pk">${icon('check', 22, 3.2)}</span></div>
      <div class="stamp paid-stamp">${L10N.paid}</div>`, doc);
    this.front = front;
    this.back = back;
    this.rows = [...front.querySelectorAll('.d-row')];
    this.sums = [...front.querySelectorAll('.d-s')];
    this.totalRow = front.querySelector('.d-total');
    this.tv = front.querySelector('.tv');
    this.btns = front.querySelector('.d-btns');
    this.accBtn = front.querySelector('.acc');
    this.accStamp = front.querySelector('.acc-stamp');
    this.due = back.querySelector('.d-due');
    this.fill = back.querySelector('.fill');
    this.pct = back.querySelector('.pct');
    this.pays = [back.querySelector('.p1'), back.querySelector('.p2')];
    this.paidStamp = back.querySelector('.paid-stamp');

    // cursor / ripple target: the Accept button (doc is flat at rest)
    const r = this.accBtn.getBoundingClientRect();
    this.accPos = { x: r.left + r.width * 0.55, y: r.top + r.height * 0.55 };
    const rs = this.paidStamp.getBoundingClientRect();
    const at = (x) => this.a + x;
    fx.clicks.push({ t: at(ACCEPT), x: this.accPos.x, y: this.accPos.y });
    fx.cues.push({ t: at(0.25), type: 'row', i: 0 }, { t: at(0.37), type: 'row', i: 1 }, { t: at(0.49), type: 'row', i: 2 },
      { t: at(0.75), type: 'count' }, { t: at(ACCEPT), type: 'click' }, { t: at(ACCEPT + 0.05), type: 'stamp', v: 0.7 },
      { t: at(FLIP[0]), type: 'flip' }, { t: at(2.11), type: 'coin', i: 0 }, { t: at(2.58), type: 'coin', i: 1 },
      { t: at(PAID), type: 'paid' }, { t: at(3.3), type: 'shrink' });
    fx.hits.push({ t: at(ACCEPT + 0.05), amp: 6, punch: 0.012, freq: 14, decay: 12 }, { t: at(PAID), amp: 14, punch: 0.03, freq: 12, decay: 9 });
    fx.flashes.push({ t: at(PAID), peak: 0.25, dur: 0.35, color: '#FE4D1E' });
    fx.bursts.push({ t: at(PAID), x: 1080 - (rs.left + rs.width / 2), y: rs.top + rs.height / 2, n: 40, seed: 33,
      colors: ['#FE4D1E', '#FF8A5C', '#FFFFFF', '#FFC2A8'], speed: 1800, gravity: 1300, size: 24, life: 0.95 });
  },

  update(tau, t, ctx) {
    // whip in, shrink out towards the dashboard tile
    const shrink = ez(tau, 3.2, 3.62, E.inOutCubic);
    set(this.root, { x: whipX(t) + 1350 });
    this.head.update(tau);
    // progressive title: each word lights up as the document reaches that state
    const lit = [ez(tau, 0.2, 0.4), ez(tau, 1.6, 1.8), ez(tau, PAID, PAID + 0.12)];
    this.words.forEach((w, i) => css(w, 'color', i === 2 ? mix('#3B3836', '#FE4D1E', lit[i]) : mix('#3B3836', '#F7F5F3', lit[i])));

    // document: flip + gentle float
    const flip = ez(tau, FLIP[0], FLIP[1], E.inOutCubic);
    const dip = Math.sin(flip * Math.PI);
    const paidHit = spring(tau - PAID, 3.2, 0.3);
    set(this.doc, {
      y: -dip * 30 + Math.sin(tau * 1.6) * 5 - shrink * 330,
      ry: flip * 180, rx: dip * 4, s: (1 - dip * 0.1) * lerp(1, 0.33, shrink) * (tau > PAID ? 1 + (1 - paidHit) * -0.02 : 1),
      o: 1 - ez(tau, 3.48, 3.66),
    });
    css(this.front, 'visibility', flip < 0.5 ? 'visible' : 'hidden');
    css(this.back, 'visibility', flip >= 0.5 ? 'visible' : 'hidden');

    // quote build-up
    this.rows.forEach((n, i) => { const a = ez(tau, 0.25 + i * 0.12, 0.6 + i * 0.12, E.outExpo); set(n, { x: (1 - a) * -40, o: a }); });
    this.sums.forEach((n, i) => { const a = ez(tau, 0.58 + i * 0.07, 0.9 + i * 0.07, E.outExpo); set(n, { y: (1 - a) * 16, o: a }); });
    const ta = ez(tau, 0.72, 1.0, E.outExpo);
    set(this.totalRow, { y: (1 - ta) * 20, o: ta });
    text(this.tv, money(TOTAL * ez(tau, 0.75, 1.12, E.outCubic), 2));
    const ba = ez(tau, 0.8, 1.1, E.outBack);
    set(this.btns, { y: (1 - ba) * 24, o: prog(tau, 0.8, 0.9) });
    const press = kf(tau, [[ACCEPT - 0.06, 0], [ACCEPT, 1, E.outQuad], [ACCEPT + 0.12, 0, E.outQuad]]);
    set(this.accBtn, { s: 1 - press * 0.06 });
    stamp(this.accStamp, tau - (ACCEPT + 0.04), -9);

    // cursor
    const { x: ax, y: ay } = this.accPos;
    const cx = kf(tau, [[0.55, 1160], [1.05, ax, E.inOutCubic], [1.25, ax], [1.62, 1180, E.inCubic]]);
    const cy = kf(tau, [[0.55, 1650], [1.05, ay, E.inOutCubic], [1.25, ay], [1.62, 1560, E.inCubic]]);
    if (tau > 0.55 && tau < 1.62) ctx.cursor.want(cx, cy, { press });

    // invoice: payments land
    const p1 = ez(tau, 2.11, 2.4, E.outCubic);
    const p2 = ez(tau, 2.58, 2.85, E.outCubic);
    const paid = PAY1 * p1 + (TOTAL - PAY1) * p2;
    text(this.due, money(Math.max(0, TOTAL - paid), 2));
    css(this.due, 'color', tau > PAID ? '#FE4D1E' : 'var(--paper-ink)');
    css(this.fill, 'width', `${(paid / TOTAL) * 100}%`);
    text(this.pct, L10N.paidPct(Math.round((paid / TOTAL) * 100)));
    this.pays.forEach((n, i) => { const a = ez(tau, (i ? 2.58 : 2.11) - 0.05, (i ? 2.58 : 2.11) + 0.3, E.outBack); set(n, { x: (1 - a) * 60, o: prog(tau, (i ? 2.58 : 2.11) - 0.05, (i ? 2.58 : 2.11) + 0.08) }); });
    stamp(this.paidStamp, tau - PAID, -12);
  },
};

function stamp(n, dt, rot) {
  if (dt < 0) { set(n, { o: 0 }); return; }
  const a = E.outExpo(Math.min(1, dt / 0.2));
  set(n, { s: lerp(2.6, 1, a) + Math.sin(Math.min(dt, 0.5) * 30) * Math.exp(-dt * 12) * 0.05, r: rot + (1 - a) * 8, o: Math.min(1, dt / 0.06) });
}

function mix(a, c, k) {
  const h = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const pa = h(a);
  const pc = h(c);
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pc[i], k))).join(',')})`;
}
