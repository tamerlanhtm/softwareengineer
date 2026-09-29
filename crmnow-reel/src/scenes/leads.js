// S3 — LEADS (5.625 → 9.375s). Leads stream in from every channel, the hot one is qualified
// and converted in one click into a contact + a deal. The deal card then flies into the pipeline.
import { b, el, set, css, E, ez, kf, prog, lerp, spring, icon, text } from '../engine.js';
import { buildHead } from '../components.js';
import { T, money, kmoney } from '../i18n.js';

const STAR = '<svg width="27" height="27" viewBox="0 0 24 24"><path d="M12 2.2l2.95 6.1 6.7.95-4.85 4.7 1.15 6.65L12 17.45 6.05 20.6 7.2 13.95 2.35 9.25l6.7-.95z" fill="currentColor"/></svg>';
const stars = (n) => `<div class="stars">${[0, 1, 2, 3, 4].map((i) => `<span class="${i < n ? 'on' : 'off'}">${STAR}</span>`).join('')}</div>`;

// arrival order: the last one lands on top and is our hero
const L10N = T.leads;
const LEADS = [
  { co: 'Atlas Dental', ic: 'users', rate: 3, bg: '#3A3A44' },
  { co: 'Pixel Studio', ic: 'instagram', rate: 4, bg: '#6B3F2C' },
  { co: 'Skyline Realty', ic: 'calendar-days', rate: 3, bg: '#34404F' },
  { co: 'Greenleaf Café', ic: 'phone', rate: 2, bg: '#4A3B52' },
  { co: 'Nova Logistics', ic: 'globe', rate: 5, bg: 'linear-gradient(135deg,#FF7A4F,#E8380C)', hero: true },
].map((L, i) => ({ ...L, ini: L10N.initials[i], name: L10N.names[i], src: L10N.sources[i], chip: L.hero ? L10N.hot : L10N.fresh }));
const ARRIVE = [0.234, 0.469, 0.703, 0.9375, 1.172];
const TOP = 648;
const PITCH = 148;
const CLICK = 2.11;       // local time of the "Convert" click

export default {
  id: 'leads',
  a: b(12),
  b: b(20),
  pre: 0.55,
  post: 0.05,
  z: 20,

  build(layer, ctx, fx) {
    this.ctx = ctx;
    this.root = el('div', 'layer', null, layer);
    const root = this.root;
    this.head = buildHead(root, {
      num: '01', label: L10N.label,
      titles: [
        { html: L10N.t1, tin: -0.12, tout: 1.94 },
        { html: L10N.t2, tin: 2.2, tout: 3.26 },
      ],
    });

    // list header
    this.lh = el('div', 'ld-head', `<div class="l">${icon('inbox', 32, 2)}<span>${L10N.inbox}</span></div>
      <div class="chip chip-o">${icon('trending-up', 26, 2.4)}<span class="cnt">+123</span>&nbsp;${L10N.week}</div>`, root);
    this.cnt = this.lh.querySelector('.cnt');

    // cards
    this.cards = LEADS.map((L, i) => {
      const n = el('div', 'card lead' + (L.hero ? ' hero' : ''), `
        <div class="row">
          <div class="av" style="width:84px;height:84px;background:${L.bg}">${L.ini}</div>
          <div class="meta"><div class="nm">${L.name}</div>
            <div class="sub"><span class="src">${icon(L.ic, 26, 2.2)}${L.src}</span><span class="dotsep"></span>${L.co}</div></div>
          <div class="right">${stars(L.rate)}<span class="chip ${L.hero ? 'chip-solid' : 'chip-g'} sm">${L.hero ? icon('flame', 22, 2.4) : ''}${L.chip}</span></div>
        </div>
        ${L.hero ? `<div class="detail">
          <div class="tags"><span class="chip chip-g">${icon('target', 24, 2.2)}${L10N.budget} ${kmoney(25, 0)}</span><span class="chip chip-g">${icon('user-round', 24, 2.2)}${L10N.decision}</span></div>
          <div class="btns"><div class="btn ghost q">${icon('check', 28, 2.8)}${L10N.qualified}</div><div class="btn solid cv">${L10N.convert}${icon('arrow-right', 30, 2.6)}</div></div>
        </div>` : ''}`, root);
      return { n, L, i, t: ARRIVE[i] };
    });
    const hero = this.cards[4];
    this.hero = hero;
    hero.glow = el('div', 'sel-ring', null, hero.n);
    hero.tags = [...hero.n.querySelectorAll('.tags .chip')];
    hero.btns = [...hero.n.querySelectorAll('.btns .btn')];
    hero.cv = hero.n.querySelector('.btn.cv');
    hero.q = hero.n.querySelector('.btn.q');
    hero.stars = [...hero.n.querySelectorAll('.stars span')];

    // converted cards
    this.contact = el('div', 'card cv-card', `
      <div class="cv-top"><span class="cv-lbl">${icon('user-round', 26, 2.3)}${L10N.contact}</span><span class="ok">${icon('check', 24, 3)}</span></div>
      <div class="cv-person"><div class="av" style="width:78px;height:78px;background:${LEADS[4].bg}">${LEADS[4].ini}</div>
        <div><div class="nm">${LEADS[4].name}</div><div class="sub">${L10N.role}</div></div></div>
      <div class="cv-rows"><div>${icon('building-2', 26, 2)}Nova Logistics</div><div>${icon('globe', 26, 2)}${L10N.source}</div></div>`, root);
    this.deal = el('div', 'card cv-card deal', `
      <div class="cv-top"><span class="cv-lbl">${icon('handshake', 26, 2.3)}${L10N.deal}</span><span class="ok">${icon('check', 24, 3)}</span></div>
      <div class="cv-co">Nova Logistics</div>
      <div class="cv-amt">${money(24800)}</div>
      <div class="cv-foot"><span class="chip chip-o sm">${L10N.stage}</span><span class="own"><span class="av" style="width:44px;height:44px;font-size:18px;background:#3A3A44">${L10N.youIni}</span>${L10N.you}</span></div>`, root);
    this.amt = this.deal.querySelector('.cv-amt');
    this.badges = [
      el('div', 'chip chip-o badge', `${icon('circle-check', 26, 2.4)}${L10N.created[0]}`, root),
      el('div', 'chip chip-o badge', `${icon('circle-check', 26, 2.4)}${L10N.created[1]}`, root),
    ];

    // where the Convert button ends up (hero expanded at the top slot) -> cursor + ripple target
    css(hero.n, 'height', '296px');
    set(hero.n, { x: 90, y: TOP });
    const r = hero.cv.getBoundingClientRect();
    this.cvPos = { x: r.left + r.width * 0.6, y: r.top + r.height * 0.58 };

    const at = (x) => this.a + x;
    ARRIVE.forEach((x, i) => fx.cues.push({ t: at(x), type: 'card', i }));
    fx.cues.push({ t: at(1.45), type: 'expand' }, { t: at(1.56), type: 'star', i: 0 }, { t: at(CLICK), type: 'click' },
      { t: at(2.22), type: 'split' }, { t: at(2.5), type: 'confirm' }, { t: at(3.3), type: 'whoosh', v: 0.8 });
    fx.clicks.push({ t: at(CLICK), x: this.cvPos.x, y: this.cvPos.y, color: 'rgba(255,255,255,.95)' });
    fx.bursts.push({ t: at(2.2), x: 540, y: 790, n: 26, seed: 7, colors: ['#FE4D1E', '#FF8A5C', '#FFFFFF'], speed: 1500, gravity: 900, size: 20, life: 0.9 });
  },

  update(tau, t, ctx) {
    const root = this.root;
    // arrive through the hollow-square dive
    const zin = ez(tau, -0.5, 0.12, E.outCubic);
    // leave: everything but the deal card drifts away
    set(root, { s: lerp(1.28, 1, zin), origin: '540px 900px' });
    this.head.update(tau);

    const out = ez(tau, 3.28, 3.62, E.inCubic);
    const hi = ez(tau, -0.05, 0.4, E.outExpo);
    set(this.lh, { y: (1 - hi) * 30, o: hi * (1 - out) });
    const arrived = ARRIVE.filter((x) => tau >= x).length;
    text(this.cnt, `+${123 + arrived}`);

    // ---- hero expansion + split
    const ex = ez(tau, 1.42, 1.82, E.outExpo);
    const split = ez(tau, 2.18, 2.6, E.outExpo);
    const heroH = lerp(132, 296, ex);

    for (const c of this.cards) {
      const a = ez(tau, c.t, c.t + 0.4, E.outExpo);
      // later arrivals push this card down one slot each (springy)
      let slots = 0;
      for (const d of this.cards) if (d.i > c.i) slots += Math.min(1.04, spring(tau - d.t, 2.6, 0.55));
      let y = TOP + slots * PITCH + (1 - a) * -70;
      if (!c.L.hero) y += ex * 164 + split * 110 + out * 120;
      const dim = c.L.hero ? 1 : 1 - split * 0.72;
      const o = Math.min(1, a * 1.3) * dim * (1 - out);
      if (c.L.hero) {
        css(c.n, 'height', `${heroH}px`);
        const gone = ez(tau, 2.16, 2.3, E.inQuad);
        set(c.n, { x: 90, y, s: (0.92 + 0.08 * a) * (1 - gone * 0.06), o: o * (1 - gone), blur: (1 - a) * 10 });
      } else {
        set(c.n, { x: 90, y, s: 0.92 + 0.08 * a, o, blur: (1 - a) * 10 });
      }
    }

    // hero details
    const h = this.hero;
    set(h.glow, { o: ez(tau, 1.3, 1.55) });
    h.stars.forEach((s, i) => {
      const p = spring(tau - (1.5 + i * 0.05), 3.4, 0.35);
      set(s, { s: tau < 1.5 + i * 0.05 ? 1 : 0.6 + 0.4 * p });
    });
    h.tags.forEach((n, i) => { const p = ez(tau, 1.58 + i * 0.07, 1.98 + i * 0.07, E.outBack); set(n, { y: (1 - p) * 26, o: prog(tau, 1.58 + i * 0.07, 1.7 + i * 0.07) }); });
    h.btns.forEach((n, i) => { const p = ez(tau, 1.66 + i * 0.07, 2.06 + i * 0.07, E.outBack); set(n, { y: (1 - p) * 26, o: prog(tau, 1.66 + i * 0.07, 1.78 + i * 0.07) }); });
    const press = kf(tau, [[CLICK - 0.06, 0], [CLICK, 1, E.outQuad], [CLICK + 0.12, 0, E.outQuad]]);
    set(h.cv, { s: 1 - press * 0.06 });
    css(h.q, 'color', tau > 1.75 ? 'var(--o)' : 'var(--tx-2)');

    // cursor: glide in, click Convert, drift off
    const { x: bx, y: by } = this.cvPos;
    const cx = kf(tau, [[1.3, 1160], [1.98, bx, E.inOutCubic], [2.4, bx], [2.95, 1150, E.inCubic]]);
    const cy = kf(tau, [[1.3, 1560], [1.98, by, E.inOutCubic], [2.4, by], [2.95, 1300, E.inCubic]]);
    if (tau > 1.3 && tau < 2.95) ctx.cursor.want(cx, cy, { press });

    // ---- converted cards
    const pc = ez(tau, 2.2, 2.62, E.outBack);
    const pd = ez(tau, 2.26, 2.68, E.outBack);
    const on = tau > 2.18 ? 1 : 0;
    const fly = ez(tau, 3.3, 3.74, E.inOutCubic);
    set(this.contact, { x: lerp(320, 90, pc) - out * 260, y: 648, s: 0.8 + 0.2 * pc, o: on * Math.min(1, pc * 2) * (1 - out), origin: '50% 50%' });
    // the deal card becomes the pipeline card in the next scene
    const dx = lerp(lerp(320, 550, pd), 102, fly);
    const dy = lerp(648, 744, fly);
    const ds = (0.8 + 0.2 * pd) * lerp(1, 276 / 440, fly);
    set(this.deal, { x: dx, y: dy, s: ds, o: on * Math.min(1, pd * 2) * (1 - ez(tau, 3.64, 3.75)), origin: '0 0' });
    text(this.amt, money(Math.round(24800 * ez(tau, 2.3, 2.85, E.outCubic) / 100) * 100));
    this.badges.forEach((n, i) => {
      const p = ez(tau, 2.48 + i * 0.1, 2.9 + i * 0.1, E.outBack);
      set(n, { x: i === 0 ? 90 : 550, y: 972 + (1 - p) * 24 + out * 40, s: 0.9 + 0.1 * p, o: prog(tau, 2.48 + i * 0.1, 2.6 + i * 0.1) * (1 - out) });
    });
  },
};
