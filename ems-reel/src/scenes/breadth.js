import { el, svg, tl, scene, textLine, riseIn, riseOut, enter, fit, cue, shake, proc, burst, fast, icon, clamp, C } from '../lib.js';
import { T } from '../timing.js';
import { MODULES } from '../modules.js';

// 21.0–25.0 · breadth: a rapid-fire module blitz, four languages on a
// rolodex, and the right access for every role.
export function buildBreadth({ world, fx }) {
  blitz(world);
  languages(world);
  roles(world);
}

function blitz(world) {
  const s = scene(world, 's-blitz', T.blitz - 0.01, T.lang);
  const flood = el('div', { cls: 'layer', css: `background:${C.orange};` }, s);
  gsap.set(flood, { opacity: 0 });
  const words = [
    ['Admissions', 'admissions', 0.25, 'w'],
    ['Attendance', 'attendance', 0.25, 'o'],
    ['Library', 'library', 0.25, 'flood'],
    ['Transport', 'transport', 0.25, 'w'],
    ['Hostel', 'hostel', 0.125, 'o'],
    ['Health', 'health', 0.125, 'w'],
    ['Cafeteria', 'cafeteria', 0.125, 'o'],
    ['Alumni', 'alumni', 0.125, 'flood'],
  ];
  // 36 progress pips, filling as the words fly by
  const pips = el('div', { cls: 'abs row', css: 'left:50%;top:1250px;gap:7px;transform:translateX(-50%);' }, s);
  const pipEls = Array.from({ length: 36 }, () => el('div', { css: 'width:14px;height:14px;border-radius:4px;background:rgba(255,255,255,.14);' }, pips));
  const count = el('div', { cls: 'abs mono', text: '', css: 'left:0;right:0;top:1290px;text-align:center;font-size:26px;font-weight:700;color:rgba(255,255,255,.7);' }, s);
  const total = words.reduce((a, w) => a + w[2], 0);

  const q = (x) => Math.round(x * 30) / 30; // cut on frame boundaries
  let acc = T.blitz;
  words.forEach(([word, key, len, style], i) => {
    const t = q(acc);
    const dur = q(acc + len) - t;
    acc += len;
    const m = MODULES.find((x) => x.key === key);
    const g = el('div', { cls: 'layer' }, s);
    gsap.set(g, { autoAlpha: 0 });
    const flooded = style === 'flood';
    const col = flooded ? C.ink : style === 'o' ? C.orange : '#fff';
    const tileBg = flooded ? C.ink : C.orange;
    const ic = el('div', { cls: 'abs', css: `left:470px;top:640px;width:140px;height:140px;border-radius:34px;background:${tileBg};display:grid;place-items:center;`, html: icon(m.icon, 76, flooded ? C.orange : '#fff', 2) }, g);
    const w = textLine(g, word, { y: 930, size: 230, color: col });
    w.node.style.fontWeight = 900;
    fit(w.node, 940, 230);
    tl.set(g, { autoAlpha: 1 }, t);
    tl.set(g, { autoAlpha: 0 }, t + dur);
    if (flooded) {
      tl.set(flood, { opacity: 1 }, t);
      tl.set(flood, { opacity: 0 }, t + dur);
      tl.set(pips, { opacity: 0 }, t);
      tl.set(pips, { opacity: 1 }, t + dur);
      tl.set(count, { opacity: 0 }, t);
      tl.set(count, { opacity: 1 }, t + dur);
    }
    // each word lands differently — slam, slide, stretch, tilt
    const v = i % 4;
    if (v === 0) tl.fromTo(w.box, { scale: 1.18 }, { scale: 1, duration: Math.min(0.2, dur), ease: 'expo.out' }, t);
    if (v === 1) tl.fromTo(w.box, { x: 220 }, { x: 0, duration: Math.min(0.2, dur), ease: 'expo.out' }, t);
    if (v === 2) tl.fromTo(w.node, { scaleX: 1.25, scaleY: 0.8 }, { scaleX: 1, scaleY: 1, duration: Math.min(0.2, dur), ease: 'expo.out' }, t);
    if (v === 3) tl.fromTo(w.box, { rotation: -8, y: 60 }, { rotation: 0, y: 0, duration: Math.min(0.2, dur), ease: 'expo.out' }, t);
    tl.fromTo(ic, { scale: 0.5, rotation: -20 }, { scale: 1, rotation: 0, duration: Math.min(0.22, dur), ease: 'back.out(2.5)' }, t);
    cue(t, 'blitz', { n: i, dur });
  });
  // pips + counter: 36 modules over the blitz
  proc((time) => {
    const p = clamp((time - T.blitz) / total);
    const n = Math.min(36, Math.round(p * 36 + (p > 0 ? 1 : 0)));
    pipEls.forEach((e, k) => (e.style.background = k < n ? C.orange : 'rgba(255,255,255,.14)'));
    count.textContent = `${String(n).padStart(2, '0')} / 36 modules`;
  });
  shake(T.blitz, 0.25, 12, 26);
  fast(T.blitz, T.lang, 10);
}

function languages(world) {
  const t0 = T.lang;
  const s = scene(world, 's-lang', t0 - 0.01, T.roles + 0.05);
  const head = textLine(s, 'Speaks your language.', { y: 560, size: 84 });
  fit(head.node, 900, 84);
  const hc = riseIn(head, t0, { stagger: 0.016, dur: 0.5 });
  const k = el('div', { cls: 'kicker', css: 'top:452px;', text: 'EN · AZ · TR · RU' }, s);
  enter(k, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35 }, t0 + 0.05);

  const drum = el('div', { cls: 'abs', css: 'left:0;right:0;top:760px;height:260px;perspective:900px;perspective-origin:50% 50%;' }, s);
  const langs = [['School', 'EN'], ['Məktəb', 'AZ'], ['Okul', 'TR'], ['Школа', 'RU']];
  const faces = langs.map(([w]) => {
    const f = el('div', { cls: 'abs', css: 'left:0;right:0;top:0;height:260px;display:grid;place-items:center;backface-visibility:hidden;transform-origin:50% 50% -130px;' }, drum);
    const n = el('div', { cls: 'display', text: w, css: `font-size:200px;font-weight:900;color:${C.orange};letter-spacing:-.05em;` }, f);
    fit(n, 900, 200);
    gsap.set(f, { rotationX: 90, opacity: 0 });
    return f;
  });
  const chips = el('div', { cls: 'abs row', css: 'left:50%;top:1100px;gap:18px;transform:translateX(-50%);' }, s);
  const chipEls = langs.map(([, code]) => {
    const c = el('div', { cls: 'pill', css: `height:78px;padding:0 30px;font:700 32px var(--f-mono);letter-spacing:.12em;border:3px solid rgba(255,255,255,.18);color:rgba(255,255,255,.6);justify-content:center;`, text: code }, chips);
    return c;
  });
  enter(chips, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 }, t0 + 0.1);
  const step = 0.3;
  faces.forEach((f, i) => {
    const ti = t0 + 0.08 + i * step;
    tl.fromTo(f, { rotationX: -90, opacity: 1 }, { rotationX: 0, duration: 0.24, ease: 'back.out(1.6)' }, ti);
    if (i < faces.length - 1) tl.to(f, { rotationX: 90, duration: 0.2, ease: 'power2.in' }, ti + step - 0.06);
    tl.to(chipEls[i], { backgroundColor: C.orange, borderColor: C.orange, color: '#fff', duration: 0.08 }, ti);
    if (i < faces.length - 1) tl.to(chipEls[i], { backgroundColor: 'rgba(0,0,0,0)', borderColor: 'rgba(255,255,255,.18)', color: 'rgba(255,255,255,.6)', duration: 0.1 }, ti + step);
    cue(ti, 'flipword', { n: i });
  });
  // exit
  const tx = T.roles - 0.12;
  riseOut(hc, tx - 0.04, { dur: 0.22, stagger: 0.004 });
  tl.to([drum, chips, k], { opacity: 0, y: -40, duration: 0.2, ease: 'power2.in' }, tx);
}

function roles(world) {
  const t0 = T.roles;
  const s = scene(world, 's-roles', t0 - 0.02, T.fin + 0.05);
  const a = textLine(s, 'The right access', { y: 390, size: 96 });
  const b = textLine(s, 'for every role.', { y: 498, size: 96, color: C.orange });
  const sz = Math.min(fit(a.node, 900, 96), fit(b.node, 900, 96));
  a.node.style.fontSize = b.node.style.fontSize = `${sz}px`;
  const ac = riseIn(a, t0, { stagger: 0.02, dur: 0.5 });
  const bc = riseIn(b, t0 + 0.08, { stagger: 0.02, dur: 0.5 });

  const cx = 540;
  const cy = 1010;
  const lines = svg('svg', { width: 1080, height: 1920, viewBox: '0 0 1080 1920', style: 'position:absolute;inset:0;overflow:visible' }, s);
  const shield = el('div', { cls: 'abs', css: `left:${cx - 100}px;top:${cy - 100}px;width:200px;height:200px;border-radius:52px;background:${C.orange};display:grid;place-items:center;box-shadow:0 0 90px rgba(254,77,30,.55);`, html: icon('shield-check', 110, '#fff', 1.8) }, s);
  enter(shield, { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(2.2)' }, t0 + 0.05);
  const names = ['Owner', 'Principal', 'Teacher', 'Registrar', 'Accountant', 'Librarian'];
  const chips = names.map((n, i) => {
    const ang = (-90 + i * 60) * (Math.PI / 180);
    const x = cx + Math.cos(ang) * 350;
    const y = cy + Math.sin(ang) * 285;
    const ln = svg('line', { x1: cx, y1: cy, x2: x, y2: y, stroke: 'rgba(254,77,30,.45)', 'stroke-width': 3, 'stroke-dasharray': '8 10' }, lines);
    const len = Math.hypot(x - cx, y - cy);
    gsap.set(ln, { attr: { x2: cx, y2: cy } });
    tl.to(ln, { attr: { x2: x, y2: y }, duration: 0.3, ease: 'power2.out' }, t0 + 0.12 + i * 0.05);
    const c = el('div', {
      cls: 'abs pill',
      css: `left:${x}px;top:${y}px;height:76px;padding:0 28px 0 18px;font-size:30px;background:${C.ink3};border:2px solid rgba(255,255,255,.12);color:#fff;box-shadow:0 18px 40px rgba(0,0,0,.45);`,
      html: `<span style="width:40px;height:40px;border-radius:12px;background:rgba(254,77,30,.18);display:grid;place-items:center">${icon('lock', 22, C.orange, 2.4)}</span><span>${n}</span>`,
    }, s);
    enter(c, { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)' }, t0 + 0.2 + i * 0.05);
    cue(t0 + 0.2 + i * 0.05, 'pop', { n: i, soft: true });
    return { c, x, y, ln };
  });

  // implode into the centre → finale
  const tx = T.fin - 0.22;
  riseOut([...ac, ...bc], tx - 0.05, { dur: 0.22, stagger: 0.003 });
  chips.forEach(({ c, x, y, ln }, i) => {
    tl.to(c, { x: cx - x, y: cy - y, scale: 0, opacity: 0, duration: 0.24, ease: 'power3.in' }, tx + i * 0.01);
    tl.to(ln, { attr: { x2: cx, y2: cy }, duration: 0.2, ease: 'power3.in' }, tx);
  });
  tl.to(shield, { scale: 0.7, rotation: 45, duration: 0.24, ease: 'power3.in' }, tx);
  fast(tx, T.fin + 0.05, 12);
  cue(tx, 'suck', { dur: 0.25 });
}
