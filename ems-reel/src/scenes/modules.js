import { el, tl, scene, textLine, riseIn, riseOut, enter, fit, cue, shake, proc, burst, fast, counter, icon, clamp, C } from '../lib.js';
import { T } from '../timing.js';
import { MODULES, GROUPS } from '../modules.js';
import { S } from '../i18n.js';

export const GRID = { tile: 110, gap: 18, cols: 6, left: 165, top: 650 };
GRID.pitch = GRID.tile + GRID.gap;
export const CARD1 = { x: 100, y: 610, w: 880, h: 800 }; // first feature card (timetable)

// 6.55–11.0 · 36 modules burst out of the logo's open square → flip to reveal
// their icons → "Start with the core. Add what you need." → the Timetable
// tile grows into the first feature card.
export function buildModules({ world }) {
  const s = scene(world, 's-mods', T.zoom + 0.22, T.f1 + 0.02);
  const hud = el('div', { cls: 'layer' }, s);
  const stageWrap = el('div', { cls: 'layer', css: 'perspective:1700px;perspective-origin:540px 1000px;' }, s);
  const gridEl = el('div', { cls: 'layer', css: 'transform-style:preserve-3d;transform-origin:540px 1025px;' }, stageWrap);
  const top = el('div', { cls: 'layer' }, s);

  const { tile, pitch, cols, left, top: gtop } = GRID;
  const cx0 = left + (cols * pitch - GRID.gap) / 2; // 540
  const cy0 = gtop + (cols * pitch - GRID.gap) / 2; // 1025
  const baseCount = MODULES.filter((m) => GROUPS.find((g) => g.key === m.group).base).length; // 22

  const tiles = MODULES.map((m, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = left + c * pitch;
    const y = gtop + r * pitch;
    const wrap = el('div', { cls: 'abs', css: `left:${x}px;top:${y}px;width:${tile}px;height:${tile}px;perspective:520px;` }, gridEl);
    const flip = el('div', { cls: 'abs', css: 'inset:0;transform-style:preserve-3d;' }, wrap);
    const front = el('div', { cls: 'abs', css: `inset:0;border-radius:26px;background:${C.orange};backface-visibility:hidden;` }, flip);
    const back = el('div', {
      cls: 'abs',
      css: `inset:0;border-radius:26px;background:${C.ink3};border:2px solid rgba(255,255,255,.10);backface-visibility:hidden;transform:rotateY(180deg);display:grid;place-items:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.06);`,
    }, flip);
    const ic = el('div', { cls: 'abs', css: 'inset:0;display:grid;place-items:center;', html: icon(m.icon, 50, '#fff', 1.9) }, back);
    const base = i < baseCount;
    return { m, i, r, c, x, y, wrap, flip, front, back, ic, base };
  });

  // ---------------------------------------------------------- burst out of the hole
  const t0 = T.mods;
  tiles.forEach((t) => {
    const dx = cx0 - (t.x + tile / 2);
    const dy = cy0 - (t.y + tile / 2);
    const d = Math.hypot(dx, dy);
    const delay = (d / 520) * 0.2;
    enter(t.wrap, { x: dx, y: dy, scale: 0.25, rotation: ((t.i * 47) % 180) - 90 }, { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.75, ease: 'expo.out' }, t0 + delay);
  });
  shake(t0 + 0.05, 0.35, 10, 20);
  cue(t0, 'burst');
  fast(t0, t0 + 0.4, 12);

  // counter "36"
  const num = textLine(hud, '0', { y: 380, size: 290, color: C.orange });
  num.node.style.fontWeight = 900;
  num.node.style.letterSpacing = '-0.05em';
  num.node.style.fontVariantNumeric = 'tabular-nums';
  counter(num.node, { t0: t0 + 0.08, dur: 1.05, to: 36, easeName: 'power2.out' });
  enter(num.box, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'expo.out' }, t0);
  cue(t0 + 0.08, 'count', { dur: 1.05, n: 36 });
  const lab = textLine(hud, S.mods.label, { y: 552, size: 46 });
  fit(lab.node, 820, 46);
  const labC = riseIn(lab, t0 + 0.45, { stagger: 0.016, dur: 0.6 });
  labC.slice(S.mods.label.split(' ')[0].length).forEach((ch) => (ch.style.color = 'rgba(255,255,255,.55)'));

  // ---------------------------------------------------------- flip wave
  tiles.forEach((t) => {
    tl.fromTo(t.flip, { rotationY: 0 }, { rotationY: 180, duration: 0.55, ease: 'back.out(1.5)' }, T.flips + (t.r + t.c) * 0.045);
  });
  cue(T.flips, 'flipwave', { n: 11, spacing: 0.045 });

  // tilt the whole board into depth, light sweep, then settle flat again
  tl.fromTo(gridEl, { rotationX: 0, rotationZ: 0, scale: 1 }, { rotationX: 22, rotationZ: -7, scale: 0.94, duration: 1.0, ease: 'power2.inOut' }, T.flips + 0.35);
  tl.to(gridEl, { rotationX: 0, rotationZ: 0, scale: 1, duration: 0.6, ease: 'power3.inOut' }, T.core - 0.15);
  // light sweep: a diagonal wave of highlights across the tiles
  tiles.forEach((t) => {
    const hi = el('div', { cls: 'abs', css: 'inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,.34),rgba(255,255,255,.04) 70%);' }, t.back);
    gsap.set(hi, { opacity: 0 });
    tl.to(hi, { opacity: 1, duration: 0.14, ease: 'power2.out', yoyo: true, repeat: 1 }, T.flips + 0.8 + (t.r + t.c) * 0.04);
  });
  cue(T.flips + 0.75, 'shimmer');

  // ---------------------------------------------------------- 9.0 · core vs add-ons
  riseOut(labC, T.core - 0.2, { dur: 0.3, stagger: 0.006 });
  tl.to(num.box, { y: -120, opacity: 0, duration: 0.35, ease: 'power3.in' }, T.core - 0.22);
  const h1a = textLine(hud, S.mods.core[0], { y: 330, size: 112 });
  const h1b = textLine(hud, S.mods.core[1], { y: 455, size: 112, color: C.orange });
  const s1 = Math.min(fit(h1a.node, 900, 112), fit(h1b.node, 900, 112));
  h1a.node.style.fontSize = h1b.node.style.fontSize = `${s1}px`;
  const h1aC = riseIn(h1a, T.core, { stagger: 0.03, dur: 0.6 });
  const h1bC = riseIn(h1b, T.core + 0.12, { stagger: 0.03, dur: 0.6 });
  cue(T.core - 0.05, 'whoosh', { dur: 0.35, pan: -0.2 });

  const plusses = [];
  const fills = [];
  tiles.forEach((t) => {
    if (t.base) {
      tl.to(t.back, { borderColor: 'rgba(254,77,30,.55)', duration: 0.3 }, T.core + 0.1 + t.i * 0.012);
      tl.to(t.ic.firstChild, { attr: { stroke: C.orangeSoft }, duration: 0.3 }, T.core + 0.1 + t.i * 0.012);
      return;
    }
    // add-on slots hollow out into the logo's "open square"
    const d = T.core + 0.25 + (t.i - baseCount) * 0.02;
    tl.to(t.back, { backgroundColor: 'rgba(10,10,13,0)', borderColor: C.orange, borderWidth: 9, borderRadius: 34, duration: 0.35, ease: 'power2.out' }, d);
    tl.to(t.ic, { opacity: 0, scale: 0.5, duration: 0.25 }, d);
    const plus = el('div', { cls: 'abs', css: 'inset:0;display:grid;place-items:center;', html: icon('plus', 40, C.orange, 3) }, t.back);
    enter(plus, { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(2)' }, d + 0.12);
    plusses.push(plus);
    const fill = el('div', { cls: 'abs', css: `inset:-9px;border-radius:34px;background:${C.orange};` }, t.back);
    gsap.set(fill, { scale: 0, opacity: 0 });
    fills.push(fill);
    t.back.appendChild(t.ic); // icon above the fill
  });
  cue(T.core + 0.25, 'hollow', { n: 14, spacing: 0.02 });

  // side labels
  const mkLabel = (text, y, color) => {
    const n = el('div', { cls: 'abs mono', text, css: `left:104px;top:${y}px;font-size:24px;font-weight:700;color:${color};white-space:nowrap;letter-spacing:.26em;` }, hud);
    gsap.set(n, { xPercent: -50, yPercent: -50, rotation: -90 });
    return n;
  };
  const labCore = mkLabel(S.mods.labCore, gtop + (3.5 * pitch) / 2, 'rgba(255,255,255,.75)');
  const labAdd = mkLabel(S.mods.labAdd, gtop + 4.3 * pitch, C.orange);
  enter(labCore, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5 }, T.core + 0.2);
  enter(labAdd, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5 }, T.core + 0.45);

  // ---------------------------------------------------------- 10.0 · add what you need
  riseOut(h1aC, T.addons - 0.12, { dur: 0.28, stagger: 0.01 });
  riseOut(h1bC, T.addons - 0.1, { dur: 0.28, stagger: 0.01 });
  const h2a = textLine(hud, S.mods.add[0], { y: 330, size: 112 });
  const h2b = textLine(hud, S.mods.add[1], { y: 455, size: 112, color: C.orange });
  const s2 = Math.min(fit(h2a.node, 900, 112), fit(h2b.node, 900, 112));
  h2a.node.style.fontSize = h2b.node.style.fontSize = `${s2}px`;
  const h2aC = riseIn(h2a, T.addons + 0.05, { stagger: 0.02, dur: 0.4 });
  const h2bC = riseIn(h2b, T.addons + 0.12, { stagger: 0.02, dur: 0.4 });
  const addTiles = tiles.filter((t) => !t.base);
  addTiles.forEach((t, k) => {
    const d = T.addons + 0.08 + k * 0.028;
    tl.to(plusses[k], { scale: 0, rotation: 90, duration: 0.18, ease: 'power2.in' }, d);
    tl.fromTo(fills[k], { scale: 0, opacity: 1 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.8)' }, d + 0.05);
    tl.to(t.ic.firstChild, { attr: { stroke: '#fff' }, duration: 0.01 }, d);
    tl.fromTo(t.ic, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2.2)' }, d + 0.1);
    tl.fromTo(t.wrap, { scale: 1 }, { scale: 1.14, duration: 0.08, yoyo: true, repeat: 1, ease: 'power2.out' }, d + 0.05);
  });
  cue(T.addons + 0.13, 'snaps', { n: 14, spacing: 0.028 });

  // ---------------------------------------------------------- 10.62 · timetable tile → feature card
  const tt = tiles.find((t) => t.m.key === 'timetable');
  riseOut(h2aC, T.toCard + 0.02, { dur: 0.26, stagger: 0.008 });
  riseOut(h2bC, T.toCard + 0.04, { dur: 0.26, stagger: 0.008 });
  tl.to([labCore, labAdd], { opacity: 0, duration: 0.2 }, T.toCard);
  tiles.forEach((t) => {
    if (t === tt) return;
    const dx = t.x - tt.x;
    const dy = t.y - tt.y;
    const d = Math.hypot(dx, dy);
    tl.to(t.wrap, { x: dx * 0.3, y: dy * 0.3 + 40, scale: 0.3, opacity: 0, duration: 0.26, ease: 'power2.in' }, T.toCard + d / 9000);
  });
  const morph = el('div', { cls: 'abs', css: `left:0;top:0;width:${tile}px;height:${tile}px;border-radius:26px;background:${C.ink3};opacity:0;box-shadow:0 40px 90px rgba(0,0,0,.55);` }, top);
  tl.set(morph, { opacity: 1, x: tt.x, y: tt.y }, T.toCard + 0.06);
  tl.set(tt.wrap, { opacity: 0 }, T.toCard + 0.06);
  tl.to(morph, {
    x: CARD1.x, y: CARD1.y, width: CARD1.w, height: CARD1.h, borderRadius: 40,
    duration: 0.36, ease: 'expo.inOut',
  }, T.toCard + 0.06);
  tl.to(morph, { backgroundColor: C.paper, duration: 0.12, ease: 'power1.in' }, T.toCard + 0.08);
  fast(T.toCard, T.f1 + 0.05, 12);
  cue(T.toCard, 'whoosh', { dur: 0.4, pan: 0.3 });
  cue(T.toCard + 0.3, 'expand');
}
