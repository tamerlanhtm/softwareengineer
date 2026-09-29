import { el, css, svgEl, rrPath, ringPath, logoCell, LOGO, COLOR, W, H, boostBlur, hardCut } from '../lib.js';
import { T } from '../timing.js';
import { HOOK_SQUARE } from './s01_hook.js';

// 0:02–0:04  The square explodes into the 3x3 mark, the last square punches
// its hole, wordmark lands, then the camera dives through the hole into scene 3.
export const LOGO_END = { cx: 540, cy: 690, scale: 1.02 }; // logo transform while the wordmark shows

export default function logo({ layers, tl, bg, cue }) {
  const t0 = T.logo;
  const end = T.bookings;
  const sec = el('section', 'scene', layers.scenes);
  sec.style.zIndex = 5;
  tl.set(sec, { visibility: 'visible' }, t0);
  tl.set(sec, { visibility: 'hidden' }, end);

  const cam = el('div', 'layer', sec);
  const svg = svgEl('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, cam);
  css(svg, { position: 'absolute', left: 0, top: 0 });

  // hole of the 9th square in screen space once the logo has settled
  const k = LOGO_END.scale;
  const holeSize = (100 - 2 * LOGO.RING) * k;
  const hc = { x: LOGO_END.cx + 151 * k, y: LOGO_END.cy + 151 * k };
  const holeD = rrPath(hc.x - holeSize / 2, hc.y - holeSize / 2, holeSize, holeSize, LOGO.IR * k);
  const screenD = `M-10,-10H${W + 10}V${H + 10}H-10Z`;
  const bgPath = svgEl('path', { d: screenD, fill: COLOR.cream, 'fill-rule': 'evenodd' }, svg);
  const cover = svgEl('path', { d: holeD, fill: COLOR.cream }, svg);

  // soft warm glow behind the mark
  const defs = svgEl('defs', {}, svg);
  const rg = svgEl('radialGradient', { id: 'lglow' }, defs);
  svgEl('stop', { offset: '0', 'stop-color': '#FE4D1E', 'stop-opacity': '0.28' }, rg);
  svgEl('stop', { offset: '1', 'stop-color': '#FE4D1E', 'stop-opacity': '0' }, rg);
  const glow = svgEl('circle', { cx: 0, cy: 0, r: 520, fill: 'url(#lglow)' }, svg);

  const shock = svgEl('circle', { cx: HOOK_SQUARE.cx, cy: HOOK_SQUARE.cy, r: 100, fill: 'none', stroke: COLOR.orange, 'stroke-width': 26 }, svg);
  const shock2 = svgEl('circle', { cx: 0, cy: 0, r: 20, fill: 'none', stroke: COLOR.orange, 'stroke-width': 10, opacity: 0 }, svg);

  // confetti squares thrown out by the explosion
  const conf = [];
  for (let i = 0; i < 18; i++) {
    const sz = 14 + (i * 37) % 22;
    const c = svgEl('path', { d: rrPath(-sz / 2, -sz / 2, sz, sz, sz * 0.2), fill: i % 4 === 0 ? '#1C1512' : COLOR.orange }, svg);
    conf.push(c);
  }

  const g = svgEl('g', {}, svg);
  const order = [0, 1, 2, 3, 5, 6, 7, 8, 4]; // centre cell drawn last (on top)
  const cells = [];
  const paths = [];
  for (const i of order) {
    const { x, y } = logoCell(i);
    const cg = svgEl('g', {}, g);
    const p = svgEl('path', { d: rrPath(-50, -50, 100, 100, LOGO.R), fill: COLOR.orange }, cg);
    cells[i] = cg;
    paths[i] = p;
    gsap.set(cg, { x: x + 50 - 201, y: y + 50 - 201 });
  }
  const s0 = HOOK_SQUARE.size / 100;
  gsap.set(g, { x: HOOK_SQUARE.cx, y: HOOK_SQUARE.cy, scale: s0, transformOrigin: '0px 0px' });
  gsap.set(glow, { x: HOOK_SQUARE.cx, y: HOOK_SQUARE.cy });

  // wordmark
  const wm = el('div', 'abs', cam);
  css(wm, { left: 0, width: W + 'px', top: '958px', textAlign: 'center' });
  const wmMask = el('div', 'clip', wm);
  css(wmMask, { display: 'inline-block', padding: '8px 16px 26px' });
  const word = el('div', 'display', wmMask);
  css(word, { fontSize: '138px', letterSpacing: '-0.05em', color: COLOR.ink, whiteSpace: 'nowrap', fontWeight: 800 });
  word.innerHTML = 'BMS<span style="color:#FE4D1E">Now</span>';
  const split = new SplitText(word, { type: 'chars' });

  const by = el('div', 'abs', cam);
  css(by, { left: 0, width: W + 'px', top: '1170px', textAlign: 'center', font: '600 34px/1 var(--ui)', letterSpacing: '0.02em', color: '#6E625C' });
  by.innerHTML = 'by <b style="color:#1C1512;font-weight:800">ineed</b><b style="color:#FE4D1E;font-weight:800">.now</b>';


  // ---------- timeline ----------
  const E = t0; // explosion
  hardCut(E); // dark hook -> cream logo is a straight cut
  cue(E, 'impact', { gain: 1.0 });
  cue(E, 'burst', { gain: 0.9 });
  bg.to(tl, E, { glow: 0.5, particles: 0.5, dots: 0.35, dur: 0.01 });

  tl.fromTo(shock, { attr: { r: 90, 'stroke-width': 34 }, opacity: 1 }, { attr: { r: 980, 'stroke-width': 0 }, opacity: 0.2, duration: 0.8, ease: 'expo.out' }, E);
  tl.fromTo(g, { rotation: -30, scale: s0 * 0.92 }, { rotation: 0, scale: s0, duration: 0.9, ease: 'expo.out' }, E);
  tl.fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 0.6 }, E);

  conf.forEach((c, i) => {
    const a = (i / conf.length) * Math.PI * 2 + 0.3;
    const dist = 380 + ((i * 53) % 7) * 70;
    tl.fromTo(c, { x: HOOK_SQUARE.cx, y: HOOK_SQUARE.cy, rotation: 0, scale: 0.4, opacity: 1 },
      { x: HOOK_SQUARE.cx + Math.cos(a) * dist, y: HOOK_SQUARE.cy + Math.sin(a) * dist * 1.25, rotation: (i % 2 ? 1 : -1) * 260, scale: 1, duration: 0.9, ease: 'expo.out' }, E);
    tl.to(c, { opacity: 0, scale: 0.2, duration: 0.35, ease: 'power2.in' }, E + 0.55 + (i % 5) * 0.04);
  });
  boostBlur(E, E + 0.3, 20);

  const burstOrder = [1, 3, 5, 7, 0, 2, 6, 8];
  burstOrder.forEach((i, n) => {
    const { x, y } = logoCell(i);
    const tx = x + 50 - 201;
    const ty = y + 50 - 201;
    tl.fromTo(
      cells[i],
      { x: 0, y: 0, scale: 0.35, rotation: (n % 2 ? -1 : 1) * 120 },
      { x: tx, y: ty, scale: 1, rotation: 0, duration: 0.75, ease: 'expo.out' },
      E + 0.02 + n * 0.028,
    );
    cue(E + 0.05 + n * 0.028, 'tick', { gain: 0.35, pitch: 1 + n * 0.06 });
  });
  tl.fromTo(cells[4], { scale: 1.25 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' }, E);

  // punch the hole in the 9th square
  const P = E + 0.42;
  const ring = { v: 50, r: LOGO.R };
  const drawRing = () => paths[8].setAttribute('d', ringPath(-50, -50, 100, ring.r, Math.max(0, 100 - 2 * ring.v), LOGO.IR));
  paths[8].setAttribute('fill-rule', 'evenodd');
  tl.fromTo(ring, { v: 50, r: LOGO.R }, { v: LOGO.RING, r: LOGO.HR, duration: 0.5, ease: 'back.out(2.4)', onUpdate: drawRing, onReverseComplete: drawRing }, P);
  tl.to(cells[8], { keyframes: [{ scale: 0.82, duration: 0.08, ease: 'power2.in' }, { scale: 1, duration: 0.45, ease: 'back.out(4)' }] }, P - 0.08);
  tl.fromTo(shock2, { attr: { r: 30, 'stroke-width': 14 }, opacity: 0 }, { attr: { r: 220, 'stroke-width': 0 }, opacity: 1, duration: 0.5, ease: 'expo.out', immediateRender: false }, P);
  cue(P, 'pop', { gain: 1.0, pitch: 0.7 });

  // settle: logo moves up, wordmark rises in
  const M = E + 0.62;
  tl.to(g, { x: LOGO_END.cx, y: LOGO_END.cy, scale: LOGO_END.scale, duration: 0.7, ease: 'expo.inOut' }, M);
  tl.to(glow, { x: LOGO_END.cx, y: LOGO_END.cy, duration: 0.7, ease: 'expo.inOut' }, M);
  // position shock2 at the 9th square in the big logo state
  gsap.set(shock2, { x: HOOK_SQUARE.cx + 151 * s0, y: HOOK_SQUARE.cy + 151 * s0 });
  tl.fromTo(split.chars, { yPercent: 120, rotate: 8 }, { yPercent: 0, rotate: 0, duration: 0.6, ease: 'expo.out', stagger: 0.03 }, M + 0.25);
  tl.fromTo(by, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, M + 0.45);
  cue(M + 0.3, 'swish', { gain: 0.5 });
  cue(M + 0.4, 'thump', { gain: 0.6 });

  // dive through the hole
  const D = end - 0.55;
  tl.set(bgPath, { attr: { d: screenD + holeD } }, D);
  tl.to(cover, { opacity: 0, duration: 0.14, ease: 'none' }, D);
  tl.to([wmMask, by], { opacity: 0, duration: 0.18, ease: 'power1.in' }, D);
  gsap.set(cam, { transformOrigin: `${hc.x}px ${hc.y}px` });
  tl.to(cam, { x: W / 2 - hc.x, y: H / 2 - hc.y, duration: 0.5, ease: 'power3.inOut' }, D);
  tl.fromTo(cam, { scale: 1 }, { scale: 58, duration: 0.55, ease: 'expo.in', immediateRender: false }, D);
  boostBlur(D, end, 24);
  cue(D, 'whoosh', { dur: 0.55, gain: 1.0 });
}
