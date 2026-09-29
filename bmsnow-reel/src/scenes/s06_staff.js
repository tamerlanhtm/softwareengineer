import { el, css, icon, headline, lineIn, lineOut, chips, chipsIn, countTo, COLOR, W } from '../lib.js';
import { T } from '../timing.js';
import { LANG, tr } from '../i18n.js';
import { avatar, AV_BG, tap } from '../ui.js';

// 0:12–0:14  Group 4 — Staff: weekly schedule with split shifts, time off and a
// leave approval, plus a commission statement that calculates itself.
export default function staff({ layers, tl, bg, hud, cue }) {
  const t0 = T.staff;
  const end = T.finance;
  const sec = el('section', 'scene', layers.scenes);
  tl.set(sec, { visibility: 'visible' }, t0 - 0.05);
  tl.set(sec, { visibility: 'hidden' }, end + 0.05);
  hud.setGroup(tl, t0, 3);
  bg.to(tl, t0 - 0.2, { glow: 0.45, orbY: 0.62, dur: 0.6 });

  const h = headline(sec, ['Shifts, leave &amp;', '<span class="accent">commissions.</span>']);
  gsap.set(h.spans, { yPercent: 115 });
  lineIn(tl, h.spans, t0 + 0.02);
  lineOut(tl, h.spans, end - 0.26);

  const st = el('div', 'abs', sec);
  css(st, { left: 0, top: 0, width: W + 'px', height: '1920px', perspective: '2400px' });

  // ---------------- weekly schedule (dark card) ----------------
  const SX = 70, SY = 578, SWd = 940, SHt = 520;
  const sch = el('div', 'card dark', st);
  css(sch, { left: SX + 'px', top: SY + 'px', width: SWd + 'px', height: SHt + 'px', borderRadius: '34px' });
  const hdr = el('div', 'abs row', sch);
  css(hdr, { left: '30px', right: '26px', top: '26px', height: '52px', gap: '14px' });
  hdr.innerHTML = `<div style="font:800 28px/1 var(--ui)">This week</div><div style="font:500 21px/1 var(--ui);color:rgba(255,255,255,0.5)">12 – 18 Oct</div><div class="grow"></div>
    <span class="pill dark" style="height:42px">${icon('calendar', 20, 2.4)}Schedules</span>`;
  const NAMEW = 176, GX = 26, GY = 112, ROWH = 94;
  const dayW = (SWd - GX * 2 - NAMEW) / 7;
  const days = LANG === 'az' ? ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  days.forEach((d, i) => {
    const dl = el('div', 'abs', sch, d);
    css(dl, { left: GX + NAMEW + i * dayW + 'px', width: dayW + 'px', top: GY - 4 + 'px', textAlign: 'center', font: '700 19px/1 var(--ui)', color: i === 1 ? '#FE4D1E' : 'rgba(255,255,255,0.45)' });
  });
  const people = [['Aysel', 'AY'], ['Emre', 'EM'], ['Olga', 'OL'], ['Nigora', 'NI']];
  // shift patterns per person: [start, end] in hours (10..20) or 'off' / 'split' / 'leave?'
  const pattern = [
    [[10, 18], [10, 18], 'off', [12, 20], [10, 18], [10, 16], 'off'],
    [[9, 17], [9, 17], [9, 17], [9, 17], 'leave?', 'leave?', 'off'],
    ['off', [11, 19], 'split', [11, 19], [11, 19], [10, 16], 'off'],
    [[10, 18], 'split', [10, 18], 'off', [12, 20], [10, 18], 'off'],
  ];
  const bars = [];
  const leaves = [];
  people.forEach(([n, ini], r) => {
    const y = GY + 30 + r * ROWH;
    const nm = el('div', 'abs row', sch);
    css(nm, { left: GX + 'px', top: y + 'px', height: ROWH - 14 + 'px', gap: '12px' });
    nm.innerHTML = `${avatar(ini, 46, AV_BG[r])}<div style="font:700 21px/1 var(--ui)">${n}</div>`;
    pattern[r].forEach((p, c) => {
      const x = GX + NAMEW + c * dayW + 5;
      const cell = el('div', 'abs', sch);
      css(cell, { left: x + 'px', top: y + 8 + 'px', width: dayW - 10 + 'px', height: ROWH - 30 + 'px' });
      if (p === 'off') {
        css(cell, { borderRadius: '14px', background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 7px, transparent 7px 14px)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.06)' });
        cell.innerHTML = '<div style="font:600 15px/64px var(--ui);text-align:center;color:rgba(255,255,255,0.3)">Off</div>';
        bars.push(cell);
      } else if (p === 'split') {
        const a = el('div', 'abs', cell);
        css(a, { left: 0, top: 0, width: '100%', height: '28px', borderRadius: '9px', background: '#FF7447' });
        const b = el('div', 'abs', cell);
        css(b, { left: 0, bottom: 0, width: '100%', height: '28px', borderRadius: '9px', background: '#FF7447' });
        bars.push(a, b);
      } else if (p === 'leave?') {
        css(cell, { borderRadius: '14px', boxShadow: 'inset 0 0 0 2px rgba(255,195,174,0.55)', background: 'rgba(255,195,174,0.06)' });
        cell.innerHTML = '<div class="lv" style="font:700 15px/64px var(--ui);text-align:center;color:#FFC3AE">Leave?</div>';
        leaves.push(cell);
        bars.push(cell);
      } else {
        css(cell, { borderRadius: '14px', background: c === 1 ? '#FE4D1E' : 'rgba(254,77,30,0.85)', color: '#fff' });
        cell.innerHTML = `<div style="font:700 15px/1.2 var(--ui);padding:10px 0 0 10px">${p[0]}–${p[1]}</div>`;
        bars.push(cell);
      }
    });
  });
  gsap.set(sch, { transformPerspective: 2400, transformOrigin: '50% 0%' });
  tl.fromTo(sch, { y: 900, rotationX: -50, scale: 0.9 }, { y: 0, rotationX: 0, scale: 1, duration: 0.8, ease: 'expo.out' }, t0);
  tl.fromTo(bars, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.45, ease: 'expo.out', stagger: { each: 0.012, from: 'start' } }, t0 + 0.2);
  cue(t0 + 0.02, 'whoosh', { dur: 0.3, gain: 0.5 });
  cue(t0 + 0.22, 'count', { dur: 0.35, gain: 0.2 });

  // leave approval: two pending cells flip to approved
  const LA = t0 + 0.72;
  const appr = el('div', 'abs row', sch);
  css(appr, { left: GX + NAMEW + 4 * dayW - 40 + 'px', top: GY + 30 + ROWH - 64 + 'px', height: '50px', padding: '0 16px', gap: '8px', borderRadius: '14px', background: '#fff', color: '#1C1512', font: '800 18px/1 var(--ui)', boxShadow: '0 16px 30px -8px rgba(0,0,0,0.5)', zIndex: 4 });
  appr.innerHTML = `<span style="color:#FE4D1E">${icon('user-check', 22, 2.6)}</span>Approve leave`;
  tl.fromTo(appr, { opacity: 0, scale: 0.6, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(2.5)' }, LA);
  tap(appr, 110, 25, tl, LA + 0.3);
  cue(LA, 'pop', { gain: 0.5, pitch: 1.1 });
  cue(LA + 0.3, 'click', { gain: 0.6 });
  tl.to(appr, { opacity: 0, scale: 0.8, duration: 0.2 }, LA + 0.42);
  leaves.forEach((c, i) => {
    tl.to(c, { background: '#FFC3AE', boxShadow: 'inset 0 0 0 0px rgba(0,0,0,0)', duration: 0.15 }, LA + 0.36 + i * 0.05);
    tl.to(c.querySelector('.lv'), { color: '#1C1512', duration: 0.15 }, LA + 0.36 + i * 0.05);
    tl.set(c.querySelector('.lv'), { textContent: tr('Leave ✓') }, LA + 0.36 + i * 0.05);
    tl.fromTo(c, { scale: 1 }, { keyframes: [{ scale: 1.15, duration: 0.08 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }], immediateRender: false }, LA + 0.36 + i * 0.05);
  });
  cue(LA + 0.4, 'ding', { gain: 0.4, pitch: 1.0 });

  // ---------------- commission statement ----------------
  const cm = el('div', 'card', st);
  css(cm, { left: '150px', top: '1064px', width: '830px', height: '312px', borderRadius: '34px', padding: '30px 34px', zIndex: 3 });
  cm.innerHTML = `
    <div class="row" style="gap:16px">
      ${avatar('AY', 60, AV_BG[0])}
      <div class="grow"><div style="font:800 25px/1.15 var(--ui)">Aysel · October commission</div><div style="font:500 19px/1.3 var(--ui);color:#8C7F79">Tiered · paid in next payout batch</div></div>
      <span class="pill tierpill" style="background:#1C1512;color:#fff;height:44px">${icon('award', 22, 2.4)}Tier 2</span>
    </div>
    <div class="row" style="margin-top:20px;align-items:flex-end;gap:26px">
      <div class="tnum cmv" style="font:800 74px/1 var(--display);letter-spacing:-0.05em;color:#1C1512">₼ 0.00</div>
      <div style="font:600 19px/1.5 var(--ui);color:#8C7F79;padding-bottom:8px">Services 40%<br>Retail 10%</div>
    </div>
    <div style="position:relative;margin-top:24px;height:18px;border-radius:9px;background:#F4EEEB;overflow:hidden"><i class="tier" style="position:absolute;left:0;top:0;bottom:0;width:100%;border-radius:9px;background:linear-gradient(90deg,#FF9B78,#FE4D1E)"></i></div>
    <div class="row" style="margin-top:10px;font:600 16px/1 var(--ui);color:#A89C96;justify-content:space-between"><span>Tier 1</span><span style="color:#FE4D1E">Tier 2 · 45%</span><span>Tier 3</span></div>`;
  const CM = t0 + 0.55;
  gsap.set(cm, { transformPerspective: 2400 });
  tl.fromTo(cm, { y: 950, rotationX: 30, rotationZ: -4 }, { y: 0, rotationX: 0, rotationZ: -2, duration: 0.7, ease: 'expo.out' }, CM);
  countTo(tl, cm.querySelector('.cmv'), CM + 0.15, 0.95, 0, 1284.5, (v) => '₼ ' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'power2.out');
  tl.fromTo(cm.querySelector('.tier'), { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 0.62, duration: 0.9, ease: 'power2.out' }, CM + 0.2);
  tl.fromTo(cm.querySelector('.tierpill'), { scale: 0, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(3)' }, CM + 0.95);
  cue(CM + 0.15, 'count', { dur: 0.9, gain: 0.35 });
  cue(CM + 0.95, 'pop', { gain: 0.7, pitch: 1.3 });
  cue(CM + 1.0, 'ding', { gain: 0.35, pitch: 1.5 });

  const ch = chips(sec, ['Weekly hours', 'Split shifts', 'Time off', 'Leave approvals', 'Payout batches'], 1422);
  gsap.set(ch.list, { opacity: 0 });
  chipsIn(tl, ch.list, t0 + 0.95, 0.035);

  // exit: tilt back and fall away
  const EX = end - 0.32;
  tl.to(sch, { y: -1300, rotationX: 40, duration: 0.36, ease: 'power3.in' }, EX);
  tl.to(cm, { y: -1100, rotationX: 30, duration: 0.36, ease: 'power3.in' }, EX + 0.04);
  tl.to(ch.list, { opacity: 0, y: -20, duration: 0.2, stagger: 0.02 }, EX);
  cue(EX + 0.04, 'whoosh', { dur: 0.35, gain: 0.7 });
}
