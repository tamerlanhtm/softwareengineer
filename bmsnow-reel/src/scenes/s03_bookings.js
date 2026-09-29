import { el, css, icon, headline, lineIn, lineOut, chips, chipsIn, COLOR, W, rrPath, svgEl } from '../lib.js';
import { T } from '../timing.js';
import { LANG } from '../i18n.js';
import { phone, tap, checkCircle, avatar, AV_BG, panel } from '../ui.js';

// 0:04–0:08  Group 1 — Bookings & Calendar.
// A client books on the public booking page (service -> time -> booked), the
// booking flies into the staff calendar, a cancellation surfaces a waitlist match.
export default function bookings({ layers, tl, bg, hud, cue }) {
  const t0 = T.bookings;
  const end = T.clients;
  const sec = el('section', 'scene', layers.scenes);
  tl.set(sec, { visibility: 'visible' }, t0 - 0.56);
  tl.set(sec, { visibility: 'hidden' }, end + 0.05);

  bg.to(tl, t0 - 0.56, { color: COLOR.ink, glow: 0.42, particles: 0.25, dots: 0.45, orbY: 0.55, dur: 0.01 });
  hud.show(tl, t0);
  hud.setGroup(tl, t0, 0);

  // ---------------- headline A / B ----------------
  const hA = headline(sec, ['Clients book', 'online, <span class="accent">24/7.</span>']);
  const hB = headline(sec, ['The whole team.', '<span class="accent">One calendar.</span>']);
  gsap.set([...hA.spans, ...hB.spans], { yPercent: 115 });
  lineIn(tl, hA.spans, t0 + 0.02);
  lineOut(tl, hA.spans, t0 + 1.86);
  lineIn(tl, hB.spans, t0 + 2.08);
  lineOut(tl, hB.spans, end - 0.26);

  // ---------------- phone with the public booking page ----------------
  const PW = 470;
  const PH = 960;
  const ph = phone(sec, { left: (W - PW) / 2, top: 598, width: PW, height: PH });
  const scr = ph.screen;
  const SW = PW - 30;

  // header (shared across steps)
  const head = el('div', 'abs', scr);
  css(head, { left: 0, top: 0, width: SW + 'px', height: '250px', background: 'linear-gradient(160deg,#FF7447 0%,#FE4D1E 55%,#E8400F 100%)' });
  head.innerHTML = `
    <div class="abs" style="left:34px;top:92px;display:flex;align-items:center;gap:18px">
      <div style="width:78px;height:78px;border-radius:24px;background:#fff;display:flex;align-items:center;justify-content:center;font:800 34px/1 var(--display);color:#FE4D1E">A</div>
      <div><div style="font:800 32px/1.1 var(--ui);color:#fff;letter-spacing:-0.01em">Aura Studio</div>
      <div style="font:600 20px/1.3 var(--ui);color:rgba(255,255,255,0.85);margin-top:4px">★ 4.9 · Hair, nails & skin</div></div>
    </div>
    <div class="abs" style="left:34px;top:196px;font:700 17px/1 var(--ui);letter-spacing:0.14em;color:rgba(255,255,255,0.8)">BOOK ONLINE · OPEN 24/7</div>`;

  const track = el('div', 'abs', scr);
  css(track, { left: 0, top: '250px', width: SW * 3 + 'px', height: PH - 30 - 250 + 'px' });
  const step = (i) => {
    const s = el('div', 'abs', track);
    css(s, { left: i * SW + 'px', top: 0, width: SW + 'px', height: '100%', padding: '30px 28px' });
    return s;
  };

  // step 1 — choose a service
  const s1 = step(0);
  el('div', '', s1, '<div style="font:800 30px/1 var(--ui);color:#1C1512;letter-spacing:-0.01em">Choose a service</div><div style="font:500 19px/1 var(--ui);color:#8C7F79;margin-top:10px">Step 1 of 2</div>');
  const services = [
    ['scissors', 'Haircut & Styling', '45 min', '₼ 35'],
    ['sparkles', 'Manicure', '60 min', '₼ 28'],
    ['droplet', 'Hydra Facial', '50 min', '₼ 45'],
    ['flower', 'Relax Massage', '60 min', '₼ 50'],
  ];
  const rows = services.map(([ic, name, dur, price], i) => {
    const r = el('div', 'abs row', s1);
    css(r, { left: '28px', right: '28px', top: 104 + i * 112 + 'px', height: '98px', borderRadius: '24px', background: '#fff', boxShadow: 'inset 0 0 0 2px #F1E7E2', padding: '0 20px', gap: '18px' });
    r.innerHTML = `<div class="iconbox" style="width:58px;height:58px;border-radius:17px">${icon(ic, 28, 2.2)}</div>
      <div class="grow"><div style="font:700 23px/1.15 var(--ui);color:#1C1512">${name}</div><div style="font:500 18px/1.3 var(--ui);color:#8C7F79;margin-top:4px">${dur}</div></div>
      <div style="font:800 22px/1 var(--ui);color:#1C1512">${price}</div>`;
    return r;
  });
  tl.fromTo(rows, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out', stagger: 0.05 }, t0 + 0.05);
  // select the first service
  const T1 = t0 + 0.62;
  tl.to(rows[0], { boxShadow: 'inset 0 0 0 4px #FE4D1E', backgroundColor: '#FFF3EE', duration: 0.12 }, T1);
  tl.fromTo(rows[0], { scale: 1 }, { keyframes: [{ scale: 0.95, duration: 0.08 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }], immediateRender: false }, T1 - 0.02);
  tap(s1, 150, 104 + 49, tl, T1);
  cue(T1, 'click', { gain: 0.7 });

  // step 2 — pick a time
  const s2 = step(1);
  el('div', '', s2, '<div style="font:800 30px/1 var(--ui);color:#1C1512;letter-spacing:-0.01em">Pick a time</div><div style="font:500 19px/1 var(--ui);color:#8C7F79;margin-top:10px">Haircut & Styling · with Aysel</div>');
  const days = [['Mon', 12], ['Tue', 13], ['Wed', 14], ['Thu', 15], ['Fri', 16]];
  const dayWrap = el('div', 'abs row', s2);
  css(dayWrap, { left: '28px', top: '104px', gap: '10px' });
  const dayEls = days.map(([d, n], i) => {
    const b = el('div', 'col', dayWrap);
    css(b, { width: '68px', height: '96px', borderRadius: '20px', alignItems: 'center', justifyContent: 'center', gap: '6px', background: i === 1 ? '#1C1512' : '#F7F0EC', color: i === 1 ? '#fff' : '#1C1512' });
    b.innerHTML = `<span style="font:600 16px/1 var(--ui);opacity:0.7">${d}</span><span style="font:800 26px/1 var(--ui)">${n}</span>`;
    return b;
  });
  const slots = ['10:00', '11:30', '13:00', '14:15', '15:30', '17:00'];
  const slotEls = slots.map((s, i) => {
    const b = el('div', 'abs center', s2);
    css(b, { left: 28 + (i % 2) * 198 + 'px', top: 232 + Math.floor(i / 2) * 88 + 'px', width: '186px', height: '74px', borderRadius: '20px', boxShadow: 'inset 0 0 0 2px #F1E7E2', font: '700 25px/1 var(--ui)', color: i === 3 ? '#C9BEB9' : '#1C1512', textDecoration: i === 3 ? 'line-through' : 'none' });
    b.textContent = s;
    return b;
  });
  const T2a = t0 + 0.86;
  tl.fromTo(track, { x: 0 }, { x: -SW, duration: 0.42, ease: 'expo.inOut' }, T2a);
  cue(T2a + 0.05, 'swish', { gain: 0.35 });
  tl.fromTo(slotEls, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out', stagger: 0.03 }, T2a + 0.18);
  const T2 = t0 + 1.34;
  tl.to(slotEls[4], { backgroundColor: '#FE4D1E', color: '#fff', boxShadow: 'inset 0 0 0 0px #FE4D1E', duration: 0.1 }, T2);
  tl.fromTo(slotEls[4], { scale: 1 }, { keyframes: [{ scale: 0.92, duration: 0.07 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }], immediateRender: false }, T2 - 0.02);
  tap(s2, 28 + 93, 232 + 2 * 88 + 37, tl, T2);
  cue(T2, 'click', { gain: 0.7 });

  // step 3 — booked
  const s3 = step(2);
  const ck = checkCircle(s3, 150);
  css(ck.w, { left: (SW - 150) / 2 + 'px', top: '46px' });
  const bookedTitle = el('div', 'abs', s3, "You're booked!");
  css(bookedTitle, { left: 0, width: SW + 'px', top: '226px', textAlign: 'center', font: '800 36px/1 var(--ui)', color: '#1C1512', letterSpacing: '-0.02em' });
  const conf = el('div', 'abs', s3);
  css(conf, { left: SW / 2 + 'px', top: '120px' });
  const bits = Array.from({ length: 14 }, (_, i) => {
    const b = el('i', 'abs', conf);
    const sz = 10 + (i % 3) * 5;
    css(b, { width: sz + 'px', height: sz + 'px', borderRadius: sz * 0.22 + 'px', background: i % 3 === 0 ? '#1C1512' : '#FE4D1E', left: -sz / 2 + 'px', top: -sz / 2 + 'px' });
    return b;
  });
  const T3 = t0 + 1.5;
  tl.fromTo(track, { x: -SW }, { x: -SW * 2, duration: 0.42, ease: 'expo.inOut', immediateRender: false }, T3);
  tl.fromTo(ck.w, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(2.5)' }, T3 + 0.22);
  tl.fromTo(ck.path, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.3, ease: 'power2.out' }, T3 + 0.36);
  tl.fromTo(bookedTitle, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' }, T3 + 0.3);
  bits.forEach((b, i) => {
    const a = (i / bits.length) * Math.PI * 2;
    tl.fromTo(b, { x: 0, y: 0, opacity: 1, rotation: 0 }, { x: Math.cos(a) * (150 + (i % 4) * 30), y: Math.sin(a) * (120 + (i % 3) * 30), rotation: 180, opacity: 0, duration: 0.8, ease: 'expo.out' }, T3 + 0.3);
  });
  cue(T3 + 0.3, 'ding', { gain: 0.8 });
  cue(T3 + 0.3, 'burst', { gain: 0.35 });

  // appointment card that will fly from the phone into the calendar
  // (lives in stage space so it can travel between the two)
  const fly = el('div', 'abs', sec);
  css(fly, { left: 0, top: 0, width: '194px', height: '84px', borderRadius: '16px', background: '#FE4D1E', color: '#fff', padding: '10px 14px', boxShadow: '0 20px 40px -10px rgba(254,77,30,0.6)', zIndex: 6, transformOrigin: '50% 50%' });
  fly.innerHTML = `<div style="font:800 ${LANG === 'az' ? 16 : 19}px/1.15 var(--ui);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Haircut & Styling</div><div style="font:600 16px/1.3 var(--ui);opacity:0.9;margin-top:3px">15:30 · Leyla M.</div>`;
  gsap.set(fly, { opacity: 0 });

  // phone in (camera arriving through the logo) and out
  gsap.set(ph.body, { transformPerspective: 2400 });
  tl.fromTo(ph.wrap, { scale: 0.5, y: 120 }, { scale: 1, y: 0, duration: 1.0, ease: 'expo.out' }, t0 - 0.5);
  tl.fromTo(ph.body, { rotationX: 30, rotationY: 20, rotationZ: -6 }, { rotationX: 8, rotationY: -12, rotationZ: 2, duration: 1.3, ease: 'expo.out' }, t0 - 0.5);
  tl.to(ph.body, { rotationY: -4, rotationX: 4, duration: 1.4, ease: 'sine.inOut' }, t0 + 0.8);
  const PO = t0 + 2.0;
  tl.to(ph.wrap, { x: -900, rotation: -8, duration: 0.5, ease: 'power3.in' }, PO);
  cue(PO + 0.15, 'whoosh', { dur: 0.45, gain: 0.7 });

  // ---------------- calendar ----------------
  const CX = 70, CY = 612, CWd = 940, CHt = 764;
  const calWrap = el('div', 'abs', sec);
  css(calWrap, { left: 0, top: 0, width: W + 'px', height: '1920px', perspective: '2600px' });
  const cal = panel(calWrap, { left: CX, top: CY, width: CWd, height: CHt, radius: 34 });
  css(cal, { overflow: 'hidden' });
  const GUT = 78, PADX = 22, HEADH = 98, STAFFH = 96;
  const colW = (CWd - PADX * 2 - GUT) / 4;
  const rowH = (CHt - HEADH - STAFFH - 22) / 6;
  const bodyTop = HEADH + STAFFH;
  const head2 = el('div', 'abs row', cal);
  css(head2, { left: PADX + 8 + 'px', right: PADX + 'px', top: 0, height: HEADH + 'px', gap: '16px' });
  head2.innerHTML = `
    <div style="font:800 32px/1 var(--ui);letter-spacing:-0.02em">Tue, 13 Oct</div>
    <div class="pill" style="height:36px;font-size:18px">Today</div>
    <div class="grow"></div>
    <div class="row" style="background:#F6EFEB;border-radius:16px;padding:5px;gap:4px;font:700 19px/1 var(--ui)">
      <div style="background:#fff;border-radius:12px;padding:10px 18px;box-shadow:0 2px 6px rgba(0,0,0,0.08)">Day</div>
      <div style="padding:10px 16px;color:#8C7F79">Week</div></div>`;
  const staffNames = ['Aysel', 'Emre', 'Olga', 'Nigora'];
  const staffInit = ['AY', 'EM', 'OL', 'NI'];
  staffNames.forEach((n, i) => {
    const s = el('div', 'abs row', cal);
    css(s, { left: PADX + GUT + i * colW + 10 + 'px', top: HEADH + 'px', width: colW - 10 + 'px', height: STAFFH + 'px', gap: '12px' });
    s.innerHTML = `${avatar(staffInit[i], 48, AV_BG[i])}<div style="font:700 21px/1 var(--ui)">${n}</div>`;
  });
  const gridLines = el('div', 'abs', cal);
  css(gridLines, { left: PADX + 'px', right: PADX + 'px', top: bodyTop + 'px', height: rowH * 6 + 'px' });
  for (let h = 0; h < 6; h++) {
    const ln = el('div', 'abs', gridLines);
    css(ln, { left: GUT - 8 + 'px', right: 0, top: h * rowH + 'px', height: '2px', background: '#F3ECE8' });
    const lb = el('div', 'abs', gridLines, `${12 + h}:00`);
    css(lb, { left: 0, top: h * rowH - 9 + 'px', font: '600 17px/1 var(--ui)', color: '#A89C96' });
  }
  for (let c = 1; c < 4; c++) {
    const v = el('div', 'abs', gridLines);
    css(v, { left: GUT + c * colW + 'px', top: 0, width: '2px', height: rowH * 6 + 'px', background: '#F3ECE8' });
  }
  const STY = {
    o: { bg: '#FE4D1E', fg: '#fff', sub: 'rgba(255,255,255,0.88)' },
    p: { bg: '#FFE6DC', fg: '#1C1512', sub: '#8C6A5E', bar: '#FE4D1E' },
    d: { bg: '#261E1B', fg: '#fff', sub: 'rgba(255,255,255,0.6)' },
    c: { bg: '#FFF6F2', fg: '#1C1512', sub: '#8C7F79', bar: '#FFB59E' },
  };
  const blockPos = (col, start, dur) => ({
    left: PADX + GUT + col * colW + 5,
    top: bodyTop + (start - 12) * rowH + 3,
    width: colW - 10,
    height: dur * rowH - 6,
  });
  const block = (col, start, dur, title, who, sty) => {
    const p = blockPos(col, start, dur);
    const s = STY[sty];
    const b = el('div', 'abs', cal);
    css(b, {
      left: p.left + 'px', top: p.top + 'px', width: p.width + 'px', height: p.height + 'px', borderRadius: '14px',
      background: s.bg, color: s.fg, padding: '9px 12px', overflow: 'hidden',
      boxShadow: s.bar ? `inset 5px 0 0 ${s.bar}` : 'none',
    });
    b.innerHTML = `<div style="font:800 18px/1.15 var(--ui);white-space:nowrap">${title}</div><div style="font:600 15px/1.3 var(--ui);color:${s.sub};white-space:nowrap">${who}</div>`;
    return b;
  };
  const blocks = [
    block(0, 12, 0.75, 'Colour', 'Sabina K.', 'p'),
    block(0, 13.25, 1.25, 'Balayage', 'Lale M.', 'd'),
    block(1, 12.5, 1, 'Beard & Cut', 'Orkhan T.', 'c'),
    block(1, 14, 1, 'Haircut', 'Murad A.', 'p'),
    block(1, 16, 1, 'Kids Cut', 'Deniz', 'd'),
    block(2, 12, 1, 'Facial', 'Anna P.', 'd'),
    block(2, 14, 0.75, 'Brows', 'Sevda', 'c'),
    block(3, 12.5, 1.5, 'Massage', 'Dilnoza', 'p'),
    block(3, 15, 1, 'Manicure', 'Aynur', 'd'),
    block(3, 16.5, 1, 'Pedicure', 'Malika', 'c'),
    block(0, 16.5, 1.25, 'Blow-dry', 'Zehra B.', 'p'),
    block(1, 17, 0.75, 'Shave', 'Kamran', 'c'),
  ];
  const cancelled = block(2, 16, 1, 'Facial', 'Kamala S.', 'p');
  const waitFill = block(2, 16, 1, 'Facial', 'Nigar R. · waitlist', 'o');
  gsap.set(waitFill, { opacity: 0 });
  // "now" line
  const now = el('div', 'abs', cal);
  css(now, { left: PADX + GUT - 8 + 'px', right: PADX + 'px', top: bodyTop + 2.66 * rowH + 'px', height: '3px', background: '#FE4D1E', zIndex: 3 });
  now.innerHTML = '<i style="position:absolute;left:-7px;top:-6px;width:15px;height:15px;border-radius:50%;background:#FE4D1E"></i>';

  // landing target for the new booking (Aysel 15:30–16:15)
  const land = blockPos(0, 15.5, 0.75);

  // calendar in
  const CI = t0 + 2.0;
  gsap.set(cal, { transformPerspective: 2600, transformOrigin: '50% 50%' });
  tl.fromTo(cal, { x: 1250, rotationY: -28, rotationZ: 3 }, { x: 0, rotationY: 0, rotationZ: 0, duration: 0.75, ease: 'expo.out' }, CI);
  tl.fromTo([...blocks, cancelled], { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)', stagger: 0.025 }, CI + 0.2);
  tl.fromTo(now, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, CI + 0.3);
  cue(CI + 0.22, 'tick', { gain: 0.3, pitch: 1.0 });
  cue(CI + 0.32, 'tick', { gain: 0.3, pitch: 1.15 });
  cue(CI + 0.42, 'tick', { gain: 0.3, pitch: 1.3 });

  // booking card flight: from phone confirmation to Aysel's 15:30 slot
  const FL = t0 + 1.95;
  const startX = W / 2 - 97, startY = 1090;
  const endX = CX + land.left, endY = CY + land.top;
  tl.set(fly, { opacity: 1, x: startX, y: startY, width: 194, height: 84, scale: 0.7, rotation: -6 }, FL);
  tl.to(fly, { x: endX, duration: 0.62, ease: 'power3.inOut' }, FL);
  tl.to(fly, { keyframes: [{ y: startY - 260, duration: 0.3, ease: 'power2.out' }, { y: endY, duration: 0.32, ease: 'power2.in' }] }, FL);
  tl.to(fly, { scale: 1, rotation: 0, width: land.width, height: land.height, duration: 0.62, ease: 'power2.inOut' }, FL);
  tl.to(fly, { keyframes: [{ scaleY: 0.86, scaleX: 1.08, duration: 0.07 }, { scaleY: 1, scaleX: 1, duration: 0.35, ease: 'back.out(4)' }] }, FL + 0.62);
  cue(FL + 0.62, 'thump', { gain: 0.8 });
  cue(FL + 0.62, 'pop', { gain: 0.5, pitch: 1.3 });

  // cancellation -> waitlist match
  const CC = t0 + 2.95;
  const stripes = el('div', 'abs', cancelled);
  css(stripes, { inset: 0, background: 'repeating-linear-gradient(135deg, rgba(28,21,18,0.10) 0 8px, transparent 8px 16px)', opacity: 0 });
  const cancelTag = el('div', 'abs', cancelled, 'Cancelled');
  css(cancelTag, { right: '8px', bottom: '8px', font: '800 13px/1 var(--ui)', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', background: '#1C1512', padding: '6px 8px', borderRadius: '8px', opacity: 0 });
  tl.to(stripes, { opacity: 1, duration: 0.15 }, CC);
  tl.to(cancelled, { backgroundColor: '#F4EEEB', boxShadow: 'inset 5px 0 0 #CFC3BD', duration: 0.15 }, CC);
  tl.fromTo(cancelTag, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' }, CC);
  tl.fromTo(cancelled, { x: 0 }, { keyframes: [{ x: -6, duration: 0.04 }, { x: 6, duration: 0.06 }, { x: -3, duration: 0.05 }, { x: 0, duration: 0.05 }], immediateRender: false }, CC);
  cue(CC, 'glitch', { gain: 0.35 });

  const toast = el('div', 'card dark row', sec);
  css(toast, { left: '220px', top: '524px', width: '640px', height: '112px', borderRadius: '26px', padding: '0 20px', gap: '18px', zIndex: 7 });
  toast.innerHTML = `<div class="iconbox" style="width:64px;height:64px;background:rgba(254,77,30,0.16)">${icon('hourglass', 30, 2.2)}</div>
    <div class="grow"><div style="font:800 23px/1.15 var(--ui);color:#fff">Waitlist match found</div><div style="font:500 19px/1.3 var(--ui);color:rgba(255,255,255,0.6)">Nigar R. wants 16:00 with Olga</div></div>
    <div class="btn" style="height:58px;padding:0 24px;font-size:22px;border-radius:16px">Book</div>`;
  const TT = CC + 0.18;
  tl.fromTo(toast, { opacity: 0, y: -60, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'expo.out' }, TT);
  cue(TT, 'pop', { gain: 0.6, pitch: 0.9 });
  const TB = TT + 0.36;
  tap(toast, 560, 56, tl, TB);
  cue(TB, 'click', { gain: 0.6 });
  tl.fromTo(waitFill, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, TB + 0.08);
  cue(TB + 0.1, 'ding', { gain: 0.5, pitch: 1.2 });
  tl.to(toast, { opacity: 0, y: -40, duration: 0.25, ease: 'power2.in' }, TB + 0.34);

  // chips
  const ch = chips(sec, ['Group classes', 'Waitlist', 'No-show handling', 'Self-reschedule'], 1406);
  gsap.set(ch.list, { opacity: 0 });
  chipsIn(tl, ch.list, CI + 0.85);

  // exit: whip everything left
  const EX = end - 0.3;
  tl.to([cal, fly], { x: '-=1150', duration: 0.34, ease: 'power3.in' }, EX);
  tl.to(ch.list, { opacity: 0, y: -20, duration: 0.2, stagger: 0.02 }, EX);
  cue(EX + 0.05, 'whoosh', { dur: 0.35, gain: 0.8 });
}
