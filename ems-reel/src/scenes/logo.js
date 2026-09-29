import { el, svg, tl, scene, textLine, riseIn, riseOut, enter, fit, cue, shake, proc, burst, flash, fast, rrect, clamp, lerp, ease, C } from '../lib.js';
import { T } from '../timing.js';

// Logo geometry, measured from the brand mark (units of a 1122×1122 box):
// 280-unit squares on a 421 pitch; filled corners r≈50; the open square has
// an outer radius of 85 and a 142-unit hole with r≈18.
const P = 421;
const S = 280;
const HOLE = 142;
const HOLE_C = 2 * P + S / 2; // 982 — centre of the open square

// 3.0–7.0 · cell-division logo build → EMSNow lockup → "One system." → dive
export function buildLogo({ world, fx }) {
  const s = scene(world, 's-logo', T.drop, T.mods + 0.45);
  const fxl = el('div', { cls: 'layer' }, s); // rings + particles under the logo
  const root = svg('svg', { width: 1080, height: 1920, viewBox: '0 0 1080 1920', style: 'position:absolute;inset:0;overflow:visible' }, s);
  const g = svg('g', {}, root);
  const top = el('div', { cls: 'layer' }, s);

  // dark surround with a hole — only shown while diving through the open square
  const mask = svg('path', {
    'fill-rule': 'evenodd',
    fill: C.ink,
    opacity: 0,
    d: `M-60000,-60000H60000V60000H-60000Z ${rrect(2 * P + (S - HOLE) / 2, 2 * P + (S - HOLE) / 2, HOLE, HOLE, 18)}`,
  }, g);

  // nine cells; the ninth is a path so its hole can open
  const cells = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const last = r === 2 && c === 2;
      const n = last
        ? svg('path', { fill: C.orange, 'fill-rule': 'evenodd' }, g)
        : svg('rect', { x: c * P, y: r * P, width: S, height: S, rx: 50, fill: C.orange }, g);
      cells.push({ n, r, c, last });
    }
  }
  const open = cells[8].n;
  const centre = cells[4].n;
  g.appendChild(centre); // centre cell on top so the split reads as "dividing"

  // --------------------------------------------------------- logo transform
  const L = { x: 540, y: 960, s: 140 / S }; // starts exactly on the hook's seed square
  const Z = { z: 0 };
  const SEND = 34;
  proc(() => {
    const s0 = L.s;
    const s1 = s0 * Math.pow(SEND / s0, Z.z);
    const k = ease('power2.out')(clamp(Z.z * 2.4));
    const hx = lerp(L.x + (HOLE_C - 561) * s0, 540, k);
    const hy = lerp(L.y + (HOLE_C - 561) * s0, 960, k);
    g.setAttribute('transform', `translate(${(hx - HOLE_C * s1).toFixed(3)},${(hy - HOLE_C * s1).toFixed(3)}) scale(${s1.toFixed(5)})`);
  });

  // --------------------------------------------------------- 3.00 drop: divide
  const t0 = T.drop;
  flash(fx.flash, t0, { color: C.orange, peak: 0.85, dur: 0.32 });
  shake(t0, 0.55, 26, 17);
  cue(t0, 'impact', { big: true });
  cells.forEach(({ n, r, c }) => {
    const dx = (1 - c) * P;
    const dy = (1 - r) * P;
    gsap.set(n, { x: dx, y: dy });
    if (dx) tl.fromTo(n, { x: dx }, { x: 0, duration: 0.42, ease: 'back.out(1.9)' }, t0 + 0.02);
    if (dy) tl.fromTo(n, { y: dy }, { y: 0, duration: 0.42, ease: 'back.out(1.9)' }, T.split2);
  });
  // squash & stretch on the centre cell as it "gives birth"
  tl.fromTo(centre, { scaleX: 1, scaleY: 1, transformOrigin: '50% 50%' }, { scaleX: 1.28, scaleY: 0.82, duration: 0.09, ease: 'power2.out', yoyo: true, repeat: 1 }, t0);
  tl.fromTo(centre, { scaleX: 1, scaleY: 1 }, { scaleX: 0.84, scaleY: 1.24, duration: 0.09, ease: 'power2.out', yoyo: true, repeat: 1 }, T.split2);
  cue(t0 + 0.02, 'split', { n: 0 });
  cue(T.split2, 'split', { n: 1 });
  fast(t0, T.punch + 0.2, 12);

  // shockwave rings + ember burst from the centre
  [0, 0.08].forEach((d, i) => {
    const ring = el('div', { cls: 'abs', css: `left:390px;top:810px;width:300px;height:300px;border-radius:50%;border:${i ? 3 : 8}px solid ${i ? '#fff' : C.orange};` }, fxl);
    gsap.set(ring, { opacity: 0 });
    tl.fromTo(ring, { scale: 0.2, opacity: 1 }, { scale: 5.5 + i, opacity: 0, duration: 0.8, ease: 'expo.out' }, t0 + d);
  });
  burst(fxl, { t: t0, x: 540, y: 960, n: 34, seed: 7, colors: [C.orange, C.orange2, '#fff', C.orangeSoft], size: [10, 26], speed: [700, 1900], drag: 3.2, gravity: 500, life: 1.0 });

  // --------------------------------------------------------- 3.50 punch the open square
  proc((t) => {
    const p = clamp((t - T.punch) / 0.55);
    const e = ease('elastic.out(1, 0.55)')(p);
    const hole = HOLE * e;
    const ro = lerp(50, 85, ease('power3.out')(clamp(p * 1.6)));
    let d = rrect(2 * P, 2 * P, S, S, ro);
    if (hole > 0.5) d += rrect(2 * P + (S - hole) / 2, 2 * P + (S - hole) / 2, hole, hole, 18 * (hole / HOLE));
    open.setAttribute('d', d);
  });
  cue(T.punch, 'punch');
  burst(fxl, { t: T.punch + 0.02, x: 540 + P * (140 / S), y: 960 + P * (140 / S), n: 16, seed: 11, colors: ['#fff', C.orangeSoft], size: [6, 14], speed: [300, 900], drag: 3.5, gravity: 300, life: 0.7 });

  // --------------------------------------------------------- 3.85 lockup
  tl.to(L, { y: 790, s: 400 / 1122, duration: 0.7, ease: 'expo.inOut' }, T.lockup);
  const wm = textLine(top, 'EMSNow', { y: 1110, size: 150 });
  fit(wm.node, 760, 150);
  const wmChars = riseIn(wm, T.lockup + 0.3, { stagger: 0.03, dur: 0.55 });
  wmChars.slice(3).forEach((c) => (c.style.color = C.orange));
  const sub = textLine(top, 'School management system', { y: 1232, size: 30, cls: 'mono', color: 'rgba(255,255,255,.72)' });
  const subChars = riseIn(sub, T.lockup + 0.4, { stagger: 0.006, dur: 0.45 });
  cue(T.lockup, 'whoosh', { dur: 0.5, pan: 0 });
  cue(T.lockup + 0.3, 'type', { n: 6, spacing: 0.035 });


  // --------------------------------------------------------- 4.95 "One system. Your entire school."
  riseOut(wmChars, T.one - 0.1, { dur: 0.32, to: 1.1, stagger: 0.015 });
  riseOut(subChars, T.one - 0.12, { dur: 0.3, to: 1.1, stagger: 0.004 });
  tl.to(L, { y: 1150, s: 560 / 1122, duration: 0.8, ease: 'expo.inOut' }, T.one - 0.05);
  const a = textLine(top, 'One system.', { y: 470, size: 120 });
  fit(a.node, 880, 124);
  const b = textLine(top, 'Your entire school.', { y: 610, size: 90, color: C.orange });
  fit(b.node, 880, 84);
  const aC = riseIn(a, T.one + 0.1, { stagger: 0.03, dur: 0.65 });
  const bC = riseIn(b, T.one + 0.55, { stagger: 0.018, dur: 0.5 });
  cue(T.one - 0.1, 'whoosh', { dur: 0.45, pan: 0.2 });
  cue(T.one + 0.1, 'rise');
  cue(T.one + 0.55, 'rise', { soft: true });

  // squares breathe while we read; the open square pulses — "come in"
  cells.forEach(({ n, r, c, last }) => {
    if (last) return;
    tl.to(n, { scale: 0.93, transformOrigin: '50% 50%', duration: 0.26, ease: 'sine.inOut', yoyo: true, repeat: 1 }, T.one + 0.7 + (r + c) * 0.06);
  });
  [5.92, 6.1].forEach((t) => {
    tl.fromTo(open, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.1, duration: 0.07, ease: 'power2.out', yoyo: true, repeat: 1 }, t);
    cue(t, 'thump');
  });

  // --------------------------------------------------------- 6.30 dive through the hole
  riseOut(aC, T.zoom - 0.14, { dur: 0.3, to: -1.1, stagger: 0.01 });
  riseOut(bC, T.zoom - 0.1, { dur: 0.3, to: -1.1, stagger: 0.008 });
  tl.set(mask, { attr: { opacity: 1 } }, T.zoom);
  tl.to(Z, { z: 1, duration: 0.62, ease: 'power3.in' }, T.zoom);
  fast(T.zoom, T.zoom + 0.66, 16);
  cue(T.zoom, 'zoom', { dur: 0.62 });
}
