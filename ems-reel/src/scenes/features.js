import { el, svg, tl, scene, textLine, riseIn, riseOut, enter, fit, cue, shake, proc, burst, fast, counter, money, icon, clamp, lerp, ease, C } from '../lib.js';
import { T } from '../timing.js';
import { CARD1 } from './modules.js';

// 11–21s · five feature spotlights, one bar of music each, each with a
// different transition: whip-pan, vertical push, 3D flip, zoom, shatter.

const KICK_Y = 292;
const HEAD_A = 392;
const HEAD_B = 500;

function shell(world, id, tIn, tOut, kicker, a, b, { rise = true } = {}) {
  const s = scene(world, id, tIn, tOut);
  const wrap = el('div', { cls: 'layer' }, s);
  const k = el('div', { cls: 'kicker', css: `top:${KICK_Y - 16}px;`, html: `<span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:${C.orange};margin-right:16px;vertical-align:1px"></span>${kicker}` }, wrap);
  const la = textLine(wrap, a, { y: HEAD_A, size: 96 });
  const lb = textLine(wrap, b, { y: HEAD_B, size: 96, color: C.orange });
  const sz = Math.min(fit(la.node, 900, 100), fit(lb.node, 900, 100));
  la.node.style.fontSize = lb.node.style.fontSize = `${sz}px`;
  let chars = [];
  if (rise) {
    chars = [...riseIn(la, tIn + 0.05, { stagger: 0.022, dur: 0.6 }), ...riseIn(lb, tIn + 0.15, { stagger: 0.022, dur: 0.6 })];
    enter(k, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4 }, tIn + 0.02);
  }
  return { s, wrap, k, la, lb, chars };
}

function cursor(parent) {
  const n = el('div', {
    cls: 'cursor',
    html: '<svg width="64" height="64" viewBox="0 0 32 32"><path d="M6 3 L6 25.5 L11.6 20.3 L15.2 28.6 L19.1 26.9 L15.6 18.8 L23.2 18.8 Z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  }, parent);
  gsap.set(n, { opacity: 0 });
  return n;
}
// cursor tip sits at (12,6) inside its 64px box
const tip = (x, y) => ({ x: x - 12, y: y - 6 });

function click(parent, cur, x, y, t, color = 'rgba(255,255,255,.9)') {
  const ring = el('div', { cls: 'abs', css: `left:${x - 40}px;top:${y - 40}px;width:80px;height:80px;border-radius:50%;border:4px solid ${color};` }, parent);
  gsap.set(ring, { opacity: 0 });
  tl.fromTo(ring, { scale: 0.2, opacity: 1 }, { scale: 1.6, opacity: 0, duration: 0.45, ease: 'expo.out' }, t);
  tl.fromTo(cur, { scale: 1 }, { scale: 0.82, duration: 0.07, yoyo: true, repeat: 1, ease: 'power2.out' }, t - 0.03);
  cue(t, 'click');
}

// --------------------------------------------------------------------------
// F1 · Timetable — clash detected, dragged to a free slot, resolved
// --------------------------------------------------------------------------
function timetable(world) {
  const t0 = T.f1;
  const f = shell(world, 's-f1', t0 - 0.03, T.f2 + 0.3, 'Timetable & scheduling', 'Clash-free', 'timetables.');
  const card = el('div', { cls: 'card', css: `left:${CARD1.x}px;top:${CARD1.y}px;width:${CARD1.w}px;height:${CARD1.h}px;` }, f.wrap);
  const inner = el('div', { cls: 'layer' }, card);
  gsap.set(inner, { opacity: 0 });
  tl.to(inner, { opacity: 1, duration: 0.25, ease: 'none' }, t0);

  // header
  el('div', { cls: 'abs', css: 'left:44px;top:40px;', html: `<div style="font:750 38px var(--f-ui);letter-spacing:-.02em">Timetable</div><div style="font:500 23px var(--f-ui);color:${C.muted};margin-top:4px">Grade 9A · Week 12</div>` }, inner);
  const pill = el('div', { cls: 'abs pill', css: `right:36px;top:46px;height:62px;padding:0 24px;font-size:25px;background:${C.paper2};color:${C.muted};`, html: `${icon('clock', 24, C.muted, 2.2)}<span>Auto-check on</span>` }, inner);
  const pillBad = el('div', { cls: 'abs pill', css: `right:36px;top:46px;height:62px;padding:0 24px;font-size:25px;background:${C.red};color:#fff;`, html: `${icon('triangle-alert', 24, '#fff', 2.4)}<span>Teacher clash</span>` }, inner);
  const pillOk = el('div', { cls: 'abs pill', css: `right:36px;top:46px;height:62px;padding:0 24px;font-size:25px;background:${C.green};color:#fff;`, html: `${icon('circle-check', 24, '#fff', 2.4)}<span>No clashes</span>` }, inner);
  gsap.set([pillBad, pillOk], { opacity: 0, scale: 0.6 });

  // grid geometry (card-local)
  const gx = 44 + 84;
  const colW = (792 - 84) / 5;
  const rowY = (p) => 200 + p * 96;
  const cellX = (d) => gx + d * colW;
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach((d, i) => {
    el('div', { cls: 'abs', text: d, css: `left:${cellX(i)}px;top:152px;width:${colW}px;text-align:center;font:650 22px var(--f-ui);color:${C.muted};` }, inner);
  });
  ['08:30', '09:25', '10:20', '11:15', '12:30', '13:25'].forEach((tm, p) => {
    el('div', { cls: 'abs', text: tm, css: `left:44px;top:${rowY(p) + 34}px;font:500 18px var(--f-mono);color:#A9A9B3;` }, inner);
    el('div', { cls: 'abs', css: `left:44px;right:44px;top:${rowY(p)}px;height:1.5px;background:#ECE8E2;` }, inner);
  });

  const SUB = {
    Math: ['#FFE3D8', '#C2410C'], English: ['#E2E8FF', '#4338CA'], Physics: ['#DAF4E6', '#0F7A4A'], Chemistry: ['#F1E6FF', '#7E22CE'],
    Biology: ['#DDF1FD', '#0369A1'], History: ['#FDF1C8', '#A16207'], Literature: ['#FCE4F1', '#BE185D'], Art: ['#EAE7E4', '#57534E'], PE: ['#CFF7EF', '#0F766E'],
  };
  const TEACH = { Math: 'A. Hasanova', English: 'L. Mammadli', Physics: 'R. Aliyev', Chemistry: 'N. Karimova', Biology: 'T. Ismayilov', History: 'S. Guliyev', Literature: 'G. Huseynova', Art: 'F. Rzayev', PE: 'E. Babayev' };
  const plan = [
    ['Math', 'English', 'Physics', 'History', null, 'Art'],
    ['Physics', 'Math', 'Literature', 'Biology', 'PE', null],
    ['English', 'History', null, 'Math', 'Biology', 'Literature'],
    ['Biology', 'Literature', 'Math', 'English', null, 'History'],
    ['Chemistry', 'Physics', 'English', 'Math', 'Art', 'PE'],
  ];
  const block = (parent, sub, x, y) => {
    const [bgc, fg] = SUB[sub];
    return el('div', {
      cls: 'abs',
      css: `left:${x}px;top:${y}px;width:${colW - 10}px;height:86px;border-radius:16px;background:${bgc};color:${fg};padding:13px 14px;overflow:hidden;`,
      html: `<div style="font:750 21px var(--f-ui);letter-spacing:-.01em">${sub}</div><div style="font:550 15px var(--f-ui);opacity:.75;margin-top:5px;white-space:nowrap">${TEACH[sub]}</div>`,
    }, parent);
  };
  const blocks = [];
  plan.forEach((col, d) => col.forEach((sub, p) => { if (sub) blocks.push(block(inner, sub, cellX(d) + 5, rowY(p) + 5)); }));
  // deterministic shuffle for the pop-in order
  const order = blocks.map((b, i) => [((i * 7919) % 31) / 31, b]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  order.forEach((b, i) => enter(b, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.42, ease: 'back.out(2.2)' }, t0 + 0.08 + i * 0.016));
  cue(t0 + 0.08, 'ticks', { n: 12, spacing: 0.035 });

  // the new lesson: carried in by the cursor → lands on Wed P3 → clash
  const layer = el('div', { cls: 'layer' }, f.wrap);
  const nb = block(layer, 'Chemistry', 0, 0);
  nb.style.boxShadow = '0 18px 36px rgba(0,0,0,.28)';
  const red = el('div', { cls: 'abs', css: `inset:0;border-radius:16px;background:${C.redSoft};border:3px solid ${C.red};color:${C.red};padding:10px 11px;`, html: `<div style="font:750 21px var(--f-ui)">Chemistry</div><div style="font:600 15px var(--f-ui);margin-top:5px;white-space:nowrap">N. Karimova</div>` }, nb);
  gsap.set(red, { opacity: 0 });
  const slotA = { x: CARD1.x + cellX(2) + 5, y: CARD1.y + rowY(2) + 5 }; // Wed P3
  const slotB = { x: CARD1.x + cellX(3) + 5, y: CARD1.y + rowY(4) + 5 }; // Thu P5
  const start = { x: 1120, y: 1560 };
  const cur = cursor(layer);
  const bw = colW - 10;
  // cursor holds the block by its middle
  const grab = { x: bw / 2, y: 43 };

  const tA = t0 + 0.55; // carry in
  const tDrop = t0 + 0.88;
  enter(nb, { x: start.x, y: start.y, rotation: 8, scale: 1.08, opacity: 1 }, { x: slotA.x, y: slotA.y - 10, rotation: 4, duration: 0.33, ease: 'power3.inOut' }, tA);
  enter(cur, { ...tip(start.x + grab.x, start.y + grab.y), opacity: 1 }, { ...tip(slotA.x + grab.x, slotA.y - 10 + grab.y), duration: 0.33, ease: 'power3.inOut' }, tA);
  tl.to(nb, { y: slotA.y, rotation: 0, scale: 1, duration: 0.12, ease: 'power2.in' }, tDrop);
  tl.to(cur, { y: tip(0, slotA.y + grab.y).y, duration: 0.12, ease: 'power2.in' }, tDrop);
  cue(tA, 'whoosh', { dur: 0.3, pan: 0.5, soft: true });
  // clash!
  const tC = tDrop + 0.13;
  tl.to(red, { opacity: 1, duration: 0.08 }, tC);
  tl.fromTo(nb, { x: slotA.x }, { x: slotA.x + 9, duration: 0.05, yoyo: true, repeat: 5, ease: 'sine.inOut' }, tC);
  tl.to(pill, { opacity: 0, duration: 0.1 }, tC);
  tl.to(pillBad, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2.5)' }, tC);
  const tip1 = el('div', {
    cls: 'abs pill',
    css: `left:${slotA.x - 110}px;top:${slotA.y - 84}px;height:64px;padding:0 22px;font-size:24px;background:${C.text};color:#fff;box-shadow:0 14px 30px rgba(0,0,0,.35);`,
    html: `${icon('triangle-alert', 22, '#FF8A7A', 2.4)}<span>N. Karimova is teaching 9B</span>`,
  }, layer);
  enter(tip1, { opacity: 0, y: 16, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(2)' }, tC + 0.04);
  cue(tC, 'error');
  shake(tC, 0.3, 6, 26);

  // drag to Thu P5 → resolved
  const tM = tC + 0.36;
  tl.to(tip1, { opacity: 0, y: -10, duration: 0.18 }, tM);
  tl.to(nb, { x: slotB.x, y: slotB.y - 12, rotation: -3, scale: 1.06, duration: 0.36, ease: 'power3.inOut' }, tM);
  tl.to(cur, { ...tip(slotB.x + grab.x, slotB.y - 12 + grab.y), duration: 0.36, ease: 'power3.inOut' }, tM);
  tl.to(red, { opacity: 0, duration: 0.2 }, tM + 0.12);
  const tR = tM + 0.4;
  tl.to(nb, { y: slotB.y, rotation: 0, scale: 1, duration: 0.12, ease: 'power2.in' }, tR - 0.04);
  tl.to(cur, { y: tip(0, slotB.y + grab.y).y, duration: 0.12, ease: 'power2.in' }, tR - 0.04);
  tl.to(pillBad, { opacity: 0, scale: 0.8, duration: 0.12 }, tR);
  tl.to(pillOk, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2.5)' }, tR + 0.02);
  tl.to(cur, { x: '+=90', y: '+=110', opacity: 0, duration: 0.4, ease: 'power2.in' }, tR + 0.18);
  burst(layer, { t: tR + 0.04, x: slotB.x + bw / 2, y: slotB.y + 43, n: 16, seed: 21, colors: [C.green, C.orange, '#fff'], size: [7, 14], speed: [250, 700], gravity: 700, life: 0.8 });
  cue(tM, 'whoosh', { dur: 0.3, pan: 0, soft: true });
  cue(tR, 'success');
  return f;
}

// --------------------------------------------------------------------------
// F2 · Exams — marks typed in → letter grades stamp → GPA ring
// --------------------------------------------------------------------------
function exams(world) {
  const t0 = T.f2;
  const f = shell(world, 's-f2', t0 - 0.12, T.f3 + 0.3, 'Examinations & grading', 'Marks in.', 'Report cards out.', { rise: false });
  const R = { x: 100, y: 600, w: 880, h: 820 };
  const card = el('div', { cls: 'card', css: `left:${R.x}px;top:${R.y}px;width:${R.w}px;height:${R.h}px;` }, f.wrap);
  el('div', {
    cls: 'abs row', css: 'left:44px;top:40px;gap:22px;',
    html: `<div style="width:76px;height:76px;border-radius:50%;background:${C.orange};color:#fff;display:grid;place-items:center;font:750 28px var(--f-ui)">AM</div>
           <div><div style="font:750 34px var(--f-ui);letter-spacing:-.02em">Aylin Mammadova</div><div style="font:500 22px var(--f-ui);color:${C.muted};margin-top:4px">Grade 9A · Term 1 report card</div></div>`,
  }, card);
  el('div', { cls: 'abs', css: `left:44px;right:44px;top:156px;display:flex;font:600 17px var(--f-mono);letter-spacing:.14em;color:#A6A6B0;`, html: '<div style="flex:1">SUBJECT</div><div style="width:150px;text-align:center">MARK</div><div style="width:130px;text-align:center">GRADE</div>' }, card);
  const rows = [['Mathematics', 96, 'A+'], ['Physics', 91, 'A'], ['English', 88, 'A−'], ['History', 84, 'B+'], ['Biology', 93, 'A'], ['Literature', 90, 'A']];
  const gradeCol = { 'A+': ['#DAF4E6', '#0F7A4A'], A: ['#DAF4E6', '#0F7A4A'], 'A−': ['#E2F0FF', '#1D4ED8'], 'B+': ['#FFF0D6', '#B45309'] };
  const hl = el('div', { cls: 'abs', css: `left:28px;right:28px;top:196px;height:76px;border-radius:18px;background:#FFF1EB;` }, card);
  gsap.set(hl, { opacity: 0 });
  rows.forEach(([sub, mark, g], i) => {
    const y = 196 + i * 82;
    el('div', { cls: 'abs', css: `left:44px;right:44px;top:${y + 75}px;height:1.5px;background:#EFEBE5;` }, card);
    el('div', { cls: 'abs', text: sub, css: `left:44px;top:${y + 20}px;font:600 28px var(--f-ui);` }, card);
    const m = el('div', { cls: 'abs', text: '0', css: `left:${44 + 792 - 280}px;top:${y + 16}px;width:150px;text-align:center;font:800 32px var(--f-ui);font-variant-numeric:tabular-nums;` }, card);
    const mt = t0 + 0.28 + i * 0.1;
    counter(m, { t0: mt, dur: 0.32, to: mark, easeName: 'power2.out' });
    enter(m, { opacity: 0 }, { opacity: 1, duration: 0.05 }, mt);
    const [bgc, fg] = gradeCol[g];
    const gp = el('div', { cls: 'abs', text: g, css: `left:${44 + 792 - 118}px;top:${y + 12}px;width:106px;height:54px;border-radius:14px;background:${bgc};color:${fg};display:grid;place-items:center;font:800 26px var(--f-display);letter-spacing:-.02em;` }, card);
    enter(gp, { scale: 2.1, rotation: -14, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.34, ease: 'back.out(2.2)' }, t0 + 0.92 + i * 0.065);
  });
  tl.to(hl, { opacity: 1, duration: 0.1 }, t0 + 0.26);
  tl.fromTo(hl, { y: 0 }, { y: 82 * 5, duration: 0.5, ease: 'steps(5)' }, t0 + 0.3);
  tl.to(hl, { opacity: 0, duration: 0.15 }, t0 + 0.86);
  cue(t0 + 0.28, 'typing', { n: 6, spacing: 0.1 });
  cue(t0 + 0.92, 'stamps', { n: 6, spacing: 0.065 });

  // GPA ring + ready chip
  const gy = 196 + 6 * 82 + 16;
  const ring = el('div', { cls: 'abs', css: `left:44px;top:${gy}px;width:112px;height:112px;` }, card);
  const rs = svg('svg', { width: 112, height: 112, viewBox: '0 0 112 112' }, ring);
  svg('circle', { cx: 56, cy: 56, r: 46, fill: 'none', stroke: '#F1ECE6', 'stroke-width': 12 }, rs);
  const arc = svg('circle', { cx: 56, cy: 56, r: 46, fill: 'none', stroke: C.orange, 'stroke-width': 12, 'stroke-linecap': 'round', transform: 'rotate(-90 56 56)', 'stroke-dasharray': `${2 * Math.PI * 46}`, 'stroke-dashoffset': `${2 * Math.PI * 46}` }, rs);
  const circ = 2 * Math.PI * 46;
  tl.fromTo(arc, { attr: { 'stroke-dashoffset': circ } }, { attr: { 'stroke-dashoffset': circ * (1 - 3.83 / 4) }, duration: 0.6, ease: 'power3.out' }, t0 + 1.2);
  const gpa = el('div', { cls: 'abs', text: '0.00', css: 'inset:0;display:grid;place-items:center;font:800 27px var(--f-display);letter-spacing:-.03em;' }, ring);
  counter(gpa, { t0: t0 + 1.2, dur: 0.6, to: 3.83, easeName: 'power3.out', fmt: (v) => v.toFixed(2) });
  const gl = el('div', { cls: 'abs', css: `left:176px;top:${gy + 22}px;`, html: `<div style="font:750 30px var(--f-ui)">GPA 3.83</div><div style="font:500 21px var(--f-ui);color:${C.muted};margin-top:4px">Class rank 2 of 28</div>` }, card);
  enter(gl, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, t0 + 1.35);
  const ready = el('div', { cls: 'abs pill', css: `right:40px;top:${gy + 26}px;height:60px;padding:0 24px;font-size:23px;background:${C.green};color:#fff;`, html: `${icon('download', 24, '#fff', 2.4)}<span>Report card ready</span>` }, card);
  enter(ready, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.4)' }, t0 + 1.55);
  cue(t0 + 1.2, 'ringfill', { dur: 0.6 });
  cue(t0 + 1.55, 'success', { soft: true });
  return f;
}

// --------------------------------------------------------------------------
// F3 · Finance — invoice → pay by card → PAID stamp → receipt
// --------------------------------------------------------------------------
function finance(world) {
  const t0 = T.f3;
  const f = shell(world, 's-f3', t0 - 0.12, T.f4 + 0.2, 'Fees · payments · payroll · accounting', 'Finance,', 'finally sorted.', { rise: false });
  const R = { x: 100, y: 610, w: 880, h: 800 };
  const persp = el('div', { cls: 'layer', css: 'perspective:1800px;perspective-origin:540px 1000px;' }, f.wrap);
  const card = el('div', { cls: 'card', css: `left:${R.x}px;top:${R.y}px;width:${R.w}px;height:${R.h}px;` }, persp);
  f.card = card;
  el('div', { cls: 'abs', css: 'left:44px;top:40px;', html: `<div style="font:750 38px var(--f-ui);letter-spacing:-.02em">Invoice <span style="font:500 24px var(--f-mono);color:${C.muted};letter-spacing:0">INV-2048</span></div><div style="font:500 23px var(--f-ui);color:${C.muted};margin-top:6px">Murad Aliyev · Grade 7B</div>` }, card);
  const due = el('div', { cls: 'abs pill', css: `right:40px;top:48px;height:54px;padding:0 24px;font-size:22px;background:#FFF0D6;color:#B45309;letter-spacing:.06em;`, html: '<span>DUE</span>' }, card);
  const paid = el('div', { cls: 'abs pill', css: `right:40px;top:48px;height:54px;padding:0 24px;font-size:22px;background:${C.green};color:#fff;letter-spacing:.06em;`, html: `${icon('check', 22, '#fff', 3)}<span>PAID</span>` }, card);
  gsap.set(paid, { opacity: 0, scale: 0.6 });

  const items = [['Tuition — Term 1', 1200, '#15151A'], ['Transport', 150, '#15151A'], ['Sibling discount', -60, C.orange]];
  items.forEach(([label, v, col], i) => {
    const y = 170 + i * 76;
    const row = el('div', { cls: 'abs', css: `left:44px;right:44px;top:${y}px;height:76px;display:flex;align-items:center;justify-content:space-between;border-bottom:1.5px solid #EFEBE5;font:550 28px var(--f-ui);color:${col};` }, card);
    el('div', { text: label }, row);
    const val = el('div', { text: '', css: 'font-weight:700;font-variant-numeric:tabular-nums;' }, row);
    counter(val, { t0: t0 + 0.25 + i * 0.08, dur: 0.45, to: Math.abs(v), fmt: (x) => (v < 0 ? '−' : '') + money(x, 2) });
    enter(row, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out' }, t0 + 0.22 + i * 0.08);
  });
  const tot = el('div', { cls: 'abs', css: 'left:44px;right:44px;top:410px;display:flex;align-items:baseline;justify-content:space-between;' }, card);
  el('div', { text: 'Total', css: 'font:700 30px var(--f-ui);' }, tot);
  const tv = el('div', { text: '$0.00', css: 'font:800 56px var(--f-display);letter-spacing:-.04em;font-variant-numeric:tabular-nums;' }, tot);
  counter(tv, { t0: t0 + 0.42, dur: 0.5, to: 1290, easeName: 'power3.out', fmt: (x) => money(x, 2) });
  enter(tot, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, t0 + 0.4);
  cue(t0 + 0.25, 'ticks', { n: 8, spacing: 0.06 });

  el('div', { cls: 'abs', text: 'Pay with', css: `left:44px;top:520px;font:600 22px var(--f-ui);color:${C.muted};` }, card);
  const methods = [['Cash', 'banknote'], ['Card', 'credit-card'], ['Bank transfer', 'landmark']];
  let mx = 44;
  const chips = methods.map(([m, ic]) => {
    const w = m.length > 5 ? 290 : 190;
    const chip = el('div', { cls: 'abs pill', css: `left:${mx}px;top:566px;width:${w}px;height:74px;justify-content:center;font-size:25px;border:2.5px solid #E2DDD6;color:${C.text};background:#fff;`, html: `${icon(ic, 26, C.text, 2.1)}<span>${m}</span>` }, card);
    const on = el('div', { cls: 'abs pill', css: `inset:-2.5px;justify-content:center;font-size:25px;background:${C.orange};color:#fff;`, html: `${icon(ic, 26, '#fff', 2.1)}<span>${m}</span>` }, chip);
    gsap.set(on, { opacity: 0 });
    mx += w + 18;
    return { chip, on, w, x: mx - w - 18 };
  });
  chips.forEach((c, i) => enter(c.chip, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.8)' }, t0 + 0.5 + i * 0.05));

  // cursor → Card
  const layer = el('div', { cls: 'layer' }, f.wrap);
  const cur = cursor(layer);
  const cardChip = chips[1];
  const cx = R.x + cardChip.x + cardChip.w / 2 + 20;
  const cy = R.y + 566 + 44;
  const tClick = t0 + 0.98;
  enter(cur, { ...tip(1160, 1520), opacity: 1 }, { ...tip(cx, cy), duration: 0.38, ease: 'power3.inOut' }, tClick - 0.42);
  click(layer, cur, cx, cy, tClick);
  tl.to(cardChip.on, { opacity: 1, duration: 0.12 }, tClick + 0.02);
  tl.fromTo(cardChip.chip, { scale: 1 }, { scale: 0.94, duration: 0.07, yoyo: true, repeat: 1 }, tClick);
  tl.to(cur, { x: '+=80', y: '+=140', opacity: 0, duration: 0.35, ease: 'power2.in' }, tClick + 0.2);

  // PAID
  const tP = tClick + 0.2;
  tl.to(due, { opacity: 0, scale: 0.7, duration: 0.12 }, tP);
  tl.to(paid, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2.6)' }, tP + 0.02);
  const stamp = el('div', {
    cls: 'abs',
    text: 'PAID',
    css: `left:560px;top:280px;padding:6px 34px 10px;border:10px solid ${C.green};border-radius:26px;color:${C.green};font:900 118px var(--f-display);letter-spacing:.02em;mix-blend-mode:multiply;`,
  }, card);
  enter(stamp, { xPercent: -50, yPercent: -50, scale: 2.8, rotation: -32, opacity: 0 }, { scale: 1, rotation: -14, opacity: 0.92, duration: 0.22, ease: 'power4.in' }, tP + 0.03);
  shake(tP + 0.25, 0.35, 16, 22);
  burst(layer, { t: tP + 0.25, x: R.x + 560, y: R.y + 280, n: 26, seed: 33, colors: [C.green, C.orange, '#fff', '#9BE6C0'], size: [8, 18], speed: [400, 1200], gravity: 900, life: 1.0 });
  cue(tP + 0.25, 'stamp');
  const rc = el('div', { cls: 'abs pill', css: `left:44px;top:690px;height:66px;padding:0 26px;font-size:23px;background:${C.paper2};color:${C.text};font-family:var(--f-mono);font-weight:600;`, html: `${icon('receipt', 24, C.text, 2.1)}<span>Receipt #R-10492 · Card · $1,290.00</span>` }, card);
  enter(rc, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out' }, tP + 0.42);
  cue(tP + 0.42, 'receipt');
  return f;
}

// --------------------------------------------------------------------------
// F4 · Parent portal — phone, notifications stacking in
// --------------------------------------------------------------------------
function portal(world) {
  const t0 = T.f4;
  const f = shell(world, 's-f4', t0 - 0.06, T.f5 + 0.2, 'Parent portal · notifications', 'Parents,', 'always in the loop.', { rise: false });
  const persp = el('div', { cls: 'layer', css: 'perspective:1600px;perspective-origin:540px 1050px;' }, f.wrap);
  const PW = 470;
  const PH = 960;
  const px = 540 - PW / 2;
  const py = 585;
  const phone = el('div', { cls: 'abs', css: `left:${px}px;top:${py}px;width:${PW}px;height:${PH}px;border-radius:78px;background:#0C0C10;padding:14px;box-shadow:0 60px 120px rgba(0,0,0,.6), inset 0 0 0 2px #2A2A33, 0 0 0 1.5px #3A3A44;` }, persp);
  f.phone = phone;
  const scr = el('div', { cls: 'abs', css: `inset:14px;border-radius:64px;background:#F3F1ED;overflow:hidden;color:${C.text};` }, phone);
  el('div', { cls: 'abs', css: 'left:50%;top:16px;width:128px;height:36px;margin-left:-64px;border-radius:20px;background:#0C0C10;' }, scr);
  el('div', { cls: 'abs', text: '9:41', css: 'left:40px;top:20px;font:700 22px var(--f-ui);' }, scr);
  el('div', { cls: 'abs', css: 'right:36px;top:24px;width:40px;height:19px;border-radius:6px;border:2px solid #15151A;padding:2px;', html: '<div style="width:70%;height:100%;border-radius:3px;background:#15151A"></div>' }, scr);
  const mini = Array.from({ length: 9 }, (_, i) => `<div style="width:8px;height:8px;border-radius:2px;${i === 8 ? `border:2px solid ${C.orange}` : `background:${C.orange}`}"></div>`).join('');
  el('div', { cls: 'abs row', css: 'left:34px;top:82px;gap:12px;', html: `<div style="display:grid;grid-template-columns:repeat(3,8px);gap:4px">${mini}</div><div style="font:700 22px var(--f-ui)">EMSNow <span style="color:${C.muted};font-weight:500">· Parent</span></div>` }, scr);
  el('div', { cls: 'abs', css: 'left:34px;top:136px;', html: `<div style="font:750 34px var(--f-ui);letter-spacing:-.02em">Good morning, Leyla</div><div style="font:500 21px var(--f-ui);color:${C.muted};margin-top:4px">Aylin · Grade 9A</div>` }, scr);
  const notes = [
    ['award', C.orange, 'New grade', 'Mathematics · A+'],
    ['user-check', C.green, 'Attendance', 'Checked in at 08:02'],
    ['book-open', '#2563EB', 'Homework', 'Physics · due Friday'],
    ['wallet', '#7C3AED', 'Fee balance', '$0.00 · all paid'],
    ['calendar', '#D97706', 'PTA meeting', 'Thursday · 18:00'],
  ];
  const NY = 238;
  const NH = 116;
  const nodes = notes.map(([ic, col, title, body]) => {
    const n = el('div', {
      cls: 'abs row',
      css: `left:22px;right:22px;top:${NY}px;height:${NH - 14}px;border-radius:28px;background:#fff;padding:0 20px;gap:18px;box-shadow:0 10px 26px rgba(20,20,30,.10);`,
      html: `<div style="width:58px;height:58px;border-radius:18px;background:${col};display:grid;place-items:center;flex:none">${icon(ic, 30, '#fff', 2.2)}</div>
             <div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font:750 22px var(--f-ui)">${title}</span><span style="font:500 16px var(--f-ui);color:${C.muted}">now</span></div>
             <div style="font:500 20px var(--f-ui);color:#55555F;margin-top:3px;white-space:nowrap">${body}</div></div>`,
    }, scr);
    gsap.set(n, { opacity: 0 });
    return n;
  });
  const gap = 0.24;
  const arrive = nodes.map((_, i) => t0 + 0.4 + i * gap);
  const eIn = ease('back.out(1.5)');
  const ePush = ease('power3.out');
  proc((t) => {
    nodes.forEach((n, i) => {
      const p = clamp((t - arrive[i]) / 0.5);
      if (t < arrive[i]) {
        n.style.opacity = 0;
        return;
      }
      let y = -150 * (1 - eIn(p));
      for (let j = i + 1; j < nodes.length; j++) y += NH * ePush(clamp((t - arrive[j]) / 0.4));
      n.style.opacity = Math.min(1, p * 3).toFixed(3);
      n.style.transform = `translateY(${y.toFixed(2)}px) scale(${(0.92 + 0.08 * eIn(p)).toFixed(4)})`;
    });
  });
  arrive.forEach((ti, i) => cue(ti + 0.03, 'ding', { n: i }));
  // phone entrance (3D flip from the invoice) + float
  enter(phone, { rotationY: -90, opacity: 1, transformOrigin: '50% 50%' }, { rotationY: -10, duration: 0.5, ease: 'expo.out' }, t0 + 0.02);
  tl.to(phone, { rotationY: 9, rotationX: 4, y: -14, duration: 1.4, ease: 'sine.inOut' }, t0 + 0.52);
  // soft glow behind the phone
  const glow = el('div', { cls: 'abs', css: 'left:90px;top:760px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(254,77,30,.35),rgba(254,77,30,0) 65%);' }, f.wrap);
  f.wrap.insertBefore(glow, f.wrap.firstChild);
  enter(glow, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.8 }, t0);
  return f;
}

// --------------------------------------------------------------------------
// F5 · Dashboard — live KPIs, chart, CSV export
// --------------------------------------------------------------------------
function dashboard(world) {
  const t0 = T.f5;
  const f = shell(world, 's-f5', t0 - 0.1, T.blitz + 0.02, 'Dashboard & advanced reporting', 'Your whole school,', 'at a glance.', { rise: false });
  const tiles = [];
  const tile = (x, y, w, h) => {
    const n = el('div', { cls: 'dcard', css: `left:${x}px;top:${y}px;width:${w}px;height:${h}px;overflow:hidden;` }, f.wrap);
    tiles.push({ n, x, y, w, h });
    return n;
  };
  const label = (parent, text, ic) => el('div', { cls: 'abs row', css: `left:30px;top:26px;gap:10px;font:600 22px var(--f-ui);color:#A7A7B3;`, html: `${icon(ic, 22, C.orangeSoft, 2.2)}<span>${text}</span>` }, parent);

  // Row A · KPIs
  const a1 = tile(100, 600, 430, 210);
  label(a1, 'Enrollment', 'users');
  const en = el('div', { cls: 'abs', text: '0', css: 'left:30px;top:78px;font:800 66px var(--f-display);letter-spacing:-.04em;' }, a1);
  counter(en, { t0: t0 + 0.2, dur: 0.9, to: 1248, fmt: (v) => Math.round(v).toLocaleString('en-US') });
  el('div', { cls: 'abs pill', css: `left:30px;top:160px;height:34px;padding:0 12px;font-size:18px;background:rgba(22,179,107,.16);color:#3DDC97;`, html: `${icon('trending-up', 18, '#3DDC97', 2.4)}<span>+4.2% this year</span>` }, a1);
  const spark = svg('svg', { width: 150, height: 70, viewBox: '0 0 150 70', style: 'position:absolute;right:26px;top:70px;overflow:visible' }, a1);
  const sp = svg('path', { d: 'M0,58 C18,52 26,56 40,44 S64,40 76,32 S100,34 112,20 S136,14 150,6', fill: 'none', stroke: C.orange, 'stroke-width': 4, 'stroke-linecap': 'round' }, spark);
  const spLen = 175;
  sp.setAttribute('stroke-dasharray', spLen);
  enter(sp, { attr: { 'stroke-dashoffset': spLen } }, { attr: { 'stroke-dashoffset': 0 }, duration: 0.8, ease: 'power2.out' }, t0 + 0.3);

  const a2 = tile(550, 600, 430, 210);
  label(a2, 'Attendance today', 'user-check');
  const at = el('div', { cls: 'abs', text: '0%', css: 'left:30px;top:78px;font:800 66px var(--f-display);letter-spacing:-.04em;' }, a2);
  counter(at, { t0: t0 + 0.25, dur: 0.9, to: 96.4, fmt: (v) => `${v.toFixed(1)}%` });
  const rsv = svg('svg', { width: 110, height: 110, viewBox: '0 0 110 110', style: 'position:absolute;right:26px;top:66px' }, a2);
  svg('circle', { cx: 55, cy: 55, r: 44, fill: 'none', stroke: 'rgba(255,255,255,.1)', 'stroke-width': 12 }, rsv);
  const circ = 2 * Math.PI * 44;
  const ar = svg('circle', { cx: 55, cy: 55, r: 44, fill: 'none', stroke: C.orange, 'stroke-width': 12, 'stroke-linecap': 'round', transform: 'rotate(-90 55 55)', 'stroke-dasharray': circ, 'stroke-dashoffset': circ }, rsv);
  tl.fromTo(ar, { attr: { 'stroke-dashoffset': circ } }, { attr: { 'stroke-dashoffset': circ * (1 - 0.964) }, duration: 0.9, ease: 'power2.out' }, t0 + 0.25);
  el('div', { cls: 'abs', text: '1,203 of 1,248 present', css: `left:30px;top:162px;font:500 18px var(--f-ui);color:#8C8C99;` }, a2);

  // Row B · fees chart
  const b = tile(100, 830, 880, 330);
  label(b, 'Fees collected · this term', 'wallet');
  const fv = el('div', { cls: 'abs', text: '$0', css: 'left:30px;top:70px;font:800 56px var(--f-display);letter-spacing:-.04em;' }, b);
  counter(fv, { t0: t0 + 0.3, dur: 1.0, to: 482300, fmt: (v) => money(v) });
  const ch = svg('svg', { width: 820, height: 170, viewBox: '0 0 820 170', style: 'position:absolute;left:30px;top:140px;overflow:visible' }, b);
  const defs = svg('defs', {}, ch);
  const lg = svg('linearGradient', { id: 'fillg', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  svg('stop', { offset: '0', 'stop-color': C.orange, 'stop-opacity': 0.45 }, lg);
  svg('stop', { offset: '1', 'stop-color': C.orange, 'stop-opacity': 0 }, lg);
  const clip = svg('clipPath', { id: 'chclip' }, defs);
  const clipR = svg('rect', { x: 0, y: -20, width: 0, height: 220 }, clip);
  const pts = [[0, 138], [117, 120], [234, 126], [351, 92], [468, 98], [585, 60], [702, 48], [820, 18]];
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mxp = (x0 + x1) / 2;
    d += ` C${mxp},${y0} ${mxp},${y1} ${x1},${y1}`;
  }
  const gch = svg('g', { 'clip-path': 'url(#chclip)' }, ch);
  for (let i = 0; i < 4; i++) svg('line', { x1: 0, x2: 820, y1: 20 + i * 45, y2: 20 + i * 45, stroke: 'rgba(255,255,255,.06)', 'stroke-width': 1.5 }, ch);
  svg('path', { d: `${d} L820,170 L0,170 Z`, fill: 'url(#fillg)' }, gch);
  svg('path', { d, fill: 'none', stroke: C.orange, 'stroke-width': 5, 'stroke-linecap': 'round' }, gch);
  const dot = svg('circle', { cx: 820, cy: 18, r: 10, fill: '#fff', stroke: C.orange, 'stroke-width': 5 }, ch);
  gsap.set(dot, { opacity: 0 });
  tl.fromTo(clipR, { attr: { width: 0 } }, { attr: { width: 830 }, duration: 1.0, ease: 'power2.inOut' }, t0 + 0.3);
  tl.fromTo(dot, { opacity: 0, scale: 0, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' }, t0 + 1.25);
  ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].forEach((m, i) => {
    el('div', { cls: 'abs', text: m, css: `left:${30 + pts[i][0] - 20}px;top:300px;width:40px;text-align:center;font:500 15px var(--f-mono);color:#6E6E7A;` }, b);
  });

  // Row C · dues, exams, export
  const c1 = tile(100, 1180, 280, 230);
  label(c1, 'Dues', 'receipt');
  const du = el('div', { cls: 'abs', text: '$0', css: 'left:30px;top:84px;font:800 44px var(--f-display);letter-spacing:-.04em;' }, c1);
  counter(du, { t0: t0 + 0.35, dur: 0.9, to: 36120, fmt: (v) => money(v) });
  el('div', { cls: 'abs', css: 'left:30px;right:30px;top:160px;height:10px;border-radius:5px;background:rgba(255,255,255,.08);', html: `<div style="width:7%;height:100%;border-radius:5px;background:${C.orange}"></div>` }, c1);
  el('div', { cls: 'abs', text: '7% of billed', css: 'left:30px;top:182px;font:500 17px var(--f-ui);color:#8C8C99;' }, c1);

  const c2 = tile(400, 1180, 280, 230);
  label(c2, 'Upcoming exams', 'calendar');
  const ex = el('div', { cls: 'abs', text: '0', css: 'left:30px;top:74px;font:800 64px var(--f-display);letter-spacing:-.04em;' }, c2);
  counter(ex, { t0: t0 + 0.4, dur: 0.8, to: 12 });
  el('div', { cls: 'abs', text: 'Next: Math · Mon', css: 'left:30px;top:170px;font:500 18px var(--f-ui);color:#8C8C99;' }, c2);

  const c3 = tile(700, 1180, 280, 230);
  label(c3, 'Reports', 'chart-column');
  const btn = el('div', { cls: 'abs pill', css: `left:30px;top:96px;height:70px;padding:0 24px;font-size:23px;background:${C.orange};color:#fff;`, html: `${icon('download', 24, '#fff', 2.5)}<span>Export CSV</span>` }, c3);
  const file = el('div', { cls: 'abs pill', css: `left:30px;top:178px;height:36px;padding:0 12px;font-size:16px;background:rgba(255,255,255,.08);color:#D8D8E0;font-family:var(--f-mono);`, html: `${icon('file-spreadsheet', 18, '#3DDC97', 2.2)}<span>fees_term1.csv</span>` }, c3);
  gsap.set(file, { opacity: 0 });
  const layer = el('div', { cls: 'layer' }, f.wrap);
  const cur = cursor(layer);
  const bx = 700 + 30 + 110;
  const by = 1180 + 96 + 35;
  const tClick = t0 + 1.3;
  enter(cur, { ...tip(1160, 1560), opacity: 1 }, { ...tip(bx, by), duration: 0.4, ease: 'power3.inOut' }, tClick - 0.44);
  click(layer, cur, bx, by, tClick);
  tl.fromTo(btn, { scale: 1 }, { scale: 0.93, duration: 0.07, yoyo: true, repeat: 1 }, tClick);
  tl.fromTo(file, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, tClick + 0.1);
  tl.to(cur, { x: '+=70', y: '+=120', opacity: 0, duration: 0.35, ease: 'power2.in' }, tClick + 0.22);

  // bento pop-in
  tiles.forEach((tt, i) => enter(tt.n, { opacity: 0, y: 70, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'expo.out' }, t0 + 0.02 + i * 0.05));
  cue(t0 + 0.02, 'pops', { n: 6, spacing: 0.05, soft: true });
  cue(t0 + 0.3, 'count', { dur: 0.9, n: 20, soft: true });
  f.tiles = tiles;
  return f;
}

export function buildFeatures({ world }) {
  const f1 = timetable(world);
  const f2 = exams(world);
  const f3 = finance(world);
  const f4 = portal(world);
  const f5 = dashboard(world);

  // F1 → F2 · whip-pan left
  tl.to(f1.wrap, { x: -1350, duration: 0.3, ease: 'power3.in' }, T.f2 - 0.2);
  enter(f2.wrap, { x: 1350 }, { x: 0, duration: 0.5, ease: 'expo.out' }, T.f2 - 0.1);
  fast(T.f2 - 0.2, T.f2 + 0.25, 18);
  cue(T.f2 - 0.2, 'whip', { dir: -1 });

  // F2 → F3 · vertical push
  tl.to(f2.wrap, { y: -2000, duration: 0.3, ease: 'power3.in' }, T.f3 - 0.2);
  enter(f3.wrap, { y: 2000 }, { y: 0, duration: 0.5, ease: 'expo.out' }, T.f3 - 0.1);
  fast(T.f3 - 0.2, T.f3 + 0.25, 18);
  cue(T.f3 - 0.2, 'whip', { dir: 1, vertical: true });

  // F3 → F4 · 3D flip: the invoice turns away, the phone turns in
  tl.to(f3.card, { rotationY: 90, duration: 0.24, ease: 'power2.in', transformOrigin: '50% 50%' }, T.f4 - 0.22);
  tl.to([f3.k, f3.la.box, f3.lb.box], { opacity: 0, y: -40, duration: 0.2, ease: 'power2.in', stagger: 0.03 }, T.f4 - 0.22);
  enter([f4.k, f4.la.box, f4.lb.box], { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out', stagger: 0.05 }, T.f4);
  fast(T.f4 - 0.22, T.f4 + 0.3, 14);
  cue(T.f4 - 0.22, 'flip');

  // F4 → F5 · zoom through
  tl.to([f4.k, f4.la.box, f4.lb.box], { opacity: 0, y: -50, duration: 0.2, ease: 'power2.in', stagger: 0.03 }, T.f5 - 0.3);
  tl.to(f4.wrap, { scale: 2.1, opacity: 0, duration: 0.3, ease: 'power3.in', transformOrigin: '540px 1060px' }, T.f5 - 0.2);
  enter([f5.k, f5.la.box, f5.lb.box], { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', stagger: 0.05 }, T.f5 + 0.02);
  fast(T.f5 - 0.2, T.f5 + 0.2, 16);
  cue(T.f5 - 0.22, 'zoomin');

  // F5 → blitz · the bento shatters outward
  f5.tiles.forEach((tt, i) => {
    const dx = tt.x + tt.w / 2 - 540;
    const dy = tt.y + tt.h / 2 - 1000;
    tl.to(tt.n, { x: dx * 1.6, y: dy * 1.6, rotation: (i % 2 ? 1 : -1) * 28, scale: 0.6, opacity: 0, duration: 0.24, ease: 'power3.in' }, T.blitz - 0.3 + i * 0.01);
  });
  tl.to([f5.k, f5.la.box, f5.lb.box], { opacity: 0, y: -60, duration: 0.22, ease: 'power3.in' }, T.blitz - 0.3);
  fast(T.blitz - 0.3, T.blitz, 14);
  cue(T.blitz - 0.3, 'shatter');
}
