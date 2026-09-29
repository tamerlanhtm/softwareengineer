import { el, css, icon, headline, lineIn, lineOut, chips, chipsIn, countTo, svgEl, COLOR, W } from '../lib.js';
import { T } from '../timing.js';
import { checkCircle } from '../ui.js';

// 0:16–0:18  Group 6 — Accounting: the sale auto-posts a balanced journal entry,
// P&L bars grow, and last month's fiscal period closes and locks.
export default function accounting({ layers, tl, bg, hud, cue }) {
  const t0 = T.accounting;
  const end = T.messaging;
  const sec = el('section', 'scene', layers.scenes);
  tl.set(sec, { visibility: 'visible' }, t0 - 0.05);
  tl.set(sec, { visibility: 'hidden' }, end + 0.05);
  hud.setGroup(tl, t0, 5);
  bg.to(tl, t0 - 0.2, { glow: 0.45, orbY: 0.62, dur: 0.6 });

  const h = headline(sec, ['Accounting,', '<span class="accent">built right in.</span>']);
  gsap.set(h.spans, { yPercent: 115 });
  lineIn(tl, h.spans, t0 + 0.02);
  lineOut(tl, h.spans, end - 0.26);

  const st = el('div', 'abs', sec);
  css(st, { left: 0, top: 0, width: W + 'px', height: '1920px', perspective: '2400px' });

  // ---------------- journal entry ----------------
  const jr = el('div', 'card', st);
  css(jr, { left: '76px', top: '576px', width: '660px', height: '520px', borderRadius: '34px', padding: '30px 34px' });
  const rows = [
    ['Card clearing', '54.00', ''],
    ['Customer deposits', '10.00', ''],
    ['Service revenue', '', '35.00'],
    ['Retail revenue', '', '24.00'],
    ['Tips payable', '', '5.00'],
  ];
  const cell = 'font:700 21px/1 var(--ui);text-align:right;width:104px';
  jr.innerHTML = `
    <div class="row" style="gap:14px">
      <div class="iconbox" style="width:56px;height:56px">${icon('book-open', 28, 2.2)}</div>
      <div class="grow"><div style="font:800 25px/1.1 var(--ui)">Journal · JE-2041</div><div style="font:500 18px/1.3 var(--ui);color:#8C7F79">Posted from INV-0142</div></div>
    </div>
    <div class="row" style="margin-top:22px;padding:0 0 10px;border-bottom:2px solid #F1E7E2;font:700 16px/1 var(--ui);letter-spacing:0.12em;color:#A89C96">
      <span class="grow">ACCOUNT</span><span style="width:104px;text-align:right">DEBIT</span><span style="width:104px;text-align:right">CREDIT</span></div>
    ${rows.map(([a, d, c]) => `<div class="row jrow" style="padding:13px 0;border-bottom:1.5px solid #F7F1EE">
      <span class="grow" style="font:600 21px/1 var(--ui);color:#3B302C">${a}</span>
      <span class="tnum" style="${cell};color:#1C1512">${d}</span><span class="tnum" style="${cell};color:#1C1512">${c}</span></div>`).join('')}
    <div class="row jtot" style="padding:14px 0 0">
      <span class="grow row" style="gap:10px;font:800 21px/1 var(--ui)"><span class="bal"></span>Balanced</span>
      <span class="tnum" style="${cell};font-weight:800;color:#FE4D1E">64.00</span><span class="tnum" style="${cell};font-weight:800;color:#FE4D1E">64.00</span></div>`;
  const bal = checkCircle(jr.querySelector('.bal'), 34, { stroke: 3.6 });
  css(bal.w, { position: 'relative' });

  const J = t0;
  gsap.set(jr, { transformPerspective: 2400, transformOrigin: '50% 0%' });
  tl.fromTo(jr, { y: -900, rotationX: 50, rotationZ: -6 }, { y: 0, rotationX: 0, rotationZ: -2, duration: 0.75, ease: 'expo.out' }, J);
  tl.fromTo(jr.querySelectorAll('.jrow'), { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.35, ease: 'expo.out', stagger: 0.055 }, J + 0.14);
  tl.fromTo(jr.querySelector('.jtot'), { opacity: 0 }, { opacity: 1, duration: 0.25 }, J + 0.45);
  tl.fromTo(bal.w, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, J + 0.5);
  tl.fromTo(bal.path, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.2 }, J + 0.58);
  cue(J, 'whoosh', { dur: 0.3, gain: 0.5 });
  cue(J + 0.14, 'type', { dur: 0.3, gain: 0.35 });
  cue(J + 0.52, 'tick', { gain: 0.5, pitch: 1.4 });

  // ---------------- P&L ----------------
  const pl = el('div', 'card dark', st);
  css(pl, { left: '392px', top: '1000px', width: '612px', height: '372px', borderRadius: '34px', padding: '28px 32px', zIndex: 3 });
  const bars = [
    ['Revenue', 18420, 1.0, 'rgba(255,255,255,0.9)'],
    ['Expenses', 11230, 0.61, 'rgba(255,255,255,0.28)'],
    ['Net profit', 7190, 0.39, '#FE4D1E'],
  ];
  pl.innerHTML = `
    <div class="row" style="justify-content:space-between"><div><div style="font:800 25px/1.1 var(--ui)">Profit &amp; loss</div><div style="font:500 18px/1.3 var(--ui);color:rgba(255,255,255,0.5)">October · all services</div></div>
    <span class="pill dark" style="height:40px">${icon('chart-column', 20, 2.4)}Statements</span></div>
    ${bars.map(([n, v, f, c]) => `<div style="margin-top:22px"><div class="row" style="justify-content:space-between;font:600 19px/1 var(--ui);color:rgba(255,255,255,0.65)"><span>${n}</span><span class="tnum plv" data-v="${v}" style="font:800 21px/1 var(--ui);color:#fff">₼ 0</span></div>
      <div style="margin-top:10px;height:22px;border-radius:8px;background:rgba(255,255,255,0.06)"><i class="plb" data-f="${f}" style="display:block;height:100%;width:100%;border-radius:8px;background:${c}"></i></div></div>`).join('')}`;
  const P = t0 + 0.35;
  gsap.set(pl, { transformPerspective: 2400 });
  tl.fromTo(pl, { x: 900, rotationY: -40, rotationZ: 6 }, { x: 0, rotationY: -6, rotationZ: 2, duration: 0.7, ease: 'expo.out' }, P);
  pl.querySelectorAll('.plb').forEach((b, i) => {
    tl.fromTo(b, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: +b.dataset.f, duration: 0.7, ease: 'expo.out' }, P + 0.2 + i * 0.08);
  });
  pl.querySelectorAll('.plv').forEach((v, i) => {
    countTo(tl, v, P + 0.2 + i * 0.08, 0.7, 0, +v.dataset.v, (x) => '₼ ' + Math.round(x).toLocaleString('en-US'), 'expo.out');
  });
  cue(P, 'whoosh', { dur: 0.3, gain: 0.45 });
  cue(P + 0.2, 'count', { dur: 0.5, gain: 0.25 });

  // ---------------- period close & lock ----------------
  const lk = el('div', 'abs row', st);
  css(lk, { left: '34px', top: '1226px', width: '372px', height: '150px', borderRadius: '30px', padding: '0 24px', gap: '16px', background: '#FE4D1E', color: '#fff', boxShadow: '0 30px 60px -16px rgba(254,77,30,0.55)', zIndex: 4 });
  const lsvg = svgEl('svg', { width: 74, height: 74, viewBox: '0 0 24 24', fill: 'none' }, lk);
  const shackle = svgEl('path', { d: 'M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11', stroke: '#fff', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, lsvg);
  svgEl('rect', { x: 4.5, y: 11, width: 15, height: 10.5, rx: 2.6, fill: '#fff' }, lsvg);
  const kh = svgEl('circle', { cx: 12, cy: 16.2, r: 1.6, fill: '#FE4D1E' }, lsvg);
  const ltxt = el('div', '', lk);
  ltxt.innerHTML = `<div style="font:700 17px/1 var(--ui);letter-spacing:0.12em;opacity:0.85">FISCAL PERIOD</div><div style="font:800 30px/1.1 var(--ui);margin-top:8px">September</div><div class="lstate" style="font:700 20px/1.2 var(--ui);margin-top:4px;opacity:0.9">Closing…</div>`;
  const L = t0 + 0.7;
  tl.fromTo(lk, { y: 500, rotation: -8, opacity: 0 }, { y: 0, rotation: -2, opacity: 1, duration: 0.6, ease: 'expo.out' }, L);
  tl.fromTo(shackle, { y: -4.5 }, { y: 0, duration: 0.18, ease: 'power4.in' }, L + 0.5);
  tl.set(ltxt.querySelector('.lstate'), { textContent: 'Closed & locked' }, L + 0.68);
  tl.fromTo(lk, { scale: 1 }, { keyframes: [{ scale: 0.94, duration: 0.05 }, { scale: 1.04, duration: 0.12 }, { scale: 1, duration: 0.25, ease: 'back.out(3)' }], immediateRender: false }, L + 0.66);
  cue(L, 'pop', { gain: 0.5, pitch: 0.9 });
  cue(L + 0.66, 'lock', { gain: 0.9 });

  const ch = chips(sec, ['Chart of accounts', 'Journal', 'Trial balance', 'P&amp;L', 'Balance sheet', 'Period close'], 1422);
  gsap.set(ch.list, { opacity: 0 });
  chipsIn(tl, ch.list, t0 + 1.0, 0.035);

  const EX = end - 0.32;
  tl.to(jr, { y: -1400, rotationX: -30, duration: 0.36, ease: 'power3.in' }, EX);
  tl.to(pl, { x: 1100, duration: 0.34, ease: 'power3.in' }, EX + 0.02);
  tl.to(lk, { x: -900, rotation: -20, duration: 0.34, ease: 'power3.in' }, EX + 0.04);
  tl.to(ch.list, { opacity: 0, y: -20, duration: 0.2, stagger: 0.02 }, EX);
  cue(EX + 0.04, 'whoosh', { dur: 0.35, gain: 0.7 });
}
