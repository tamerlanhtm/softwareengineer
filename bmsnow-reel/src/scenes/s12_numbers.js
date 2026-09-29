import { el, css, COLOR, W, H, LOGO, logoCell, boostBlur } from '../lib.js';
import { T, GROUPS, MODULES } from '../timing.js';

// 0:24–0:26  The payoff numbers.
//  - the HUD mini grid (all 9 groups lit) flies out into a big 3x3 grid with module counts
//  - the grid collapses into a giant "37 modules"
//  - an orange square bursts in: "0 paid add-ons"
//  - the orange square shrinks into the 9th (hollow) square of the end-card logo:
//    the "0" becomes the hole. Match cut into the CTA.
export const CTA_LOGO = { cx: 540, cy: 404, width: 240 }; // shared with s13_cta.js
const K = CTA_LOGO.width / LOGO.SIZE;
export const RING = {
  size: 100 * K,
  cx: CTA_LOGO.cx + (logoCell(8).x + 50 - 201) * K,
  cy: CTA_LOGO.cy + (logoCell(8).y + 50 - 201) * K,
};

export default function numbers({ layers, tl, bg, hud, cue }) {
  const t0 = T.numbers;
  const sec = el('section', 'scene', layers.scenes);
  sec.style.zIndex = 4;
  tl.set(sec, { visibility: 'visible' }, t0 - 0.36);
  tl.set(sec, { visibility: 'hidden' }, T.end + 1);

  // ---------------- big 3x3 grid from the HUD mini grid ----------------
  const S = 220, G = S * 0.51;
  const gx = W / 2 - (3 * S + 2 * G) / 2, gy = 470;
  const counts = GROUPS.map((g) => g.modules);
  const short = ['Bookings', 'Clients', 'Catalogue', 'Staff', 'Finance', 'Accounting', 'Messaging', 'Reports', 'Admin'];
  const cells = GROUPS.map((g, i) => {
    const c = el('div', 'abs', sec);
    const x = gx + (i % 3) * (S + G), y = gy + Math.floor(i / 3) * (S + G);
    const ring = i === 8;
    css(c, {
      left: x + 'px', top: y + 'px', width: S + 'px', height: S + 'px',
      borderRadius: (ring ? LOGO.HR : LOGO.R) + '%',
      background: ring ? 'transparent' : COLOR.orange,
      boxShadow: ring ? `inset 0 0 0 ${S * LOGO.RING / 100}px ${COLOR.orange}` : '0 20px 50px -10px rgba(254,77,30,0.45)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    });
    c.innerHTML = ring
      ? `<div class="n" style="font:800 72px/1 var(--display);color:#FE4D1E;letter-spacing:-0.04em">${counts[i]}</div>`
      : `<div class="n" style="font:800 96px/1 var(--display);color:#fff;letter-spacing:-0.05em">${counts[i]}</div><div class="l" style="font:700 22px/1 var(--ui);color:rgba(255,255,255,0.88);margin-top:12px">${short[i]}</div>`;
    // start exactly on top of the HUD mini-grid cell
    const hx = 84 + (i % 3) * 18 + 7, hy = 262 + Math.floor(i / 3) * 18 + 7;
    const sc = 14 / S;
    gsap.set(c, { x: hx - (x + S / 2), y: hy - (y + S / 2), scale: sc });
    return c;
  });
  const ringLabel = el('div', 'abs', sec, 'Admin');
  css(ringLabel, { left: gx + 2 * (S + G) + 'px', width: S + 'px', top: gy + 2 * (S + G) + S + 16 + 'px', textAlign: 'center', font: '700 22px/1 var(--ui)', color: 'rgba(255,255,255,0.7)' });
  const nums = cells.map((c) => c.querySelector('.n'));
  const labels = cells.map((c) => c.querySelector('.l')).filter(Boolean);

  const top1 = el('div', 'abs', sec);
  css(top1, { left: 0, width: W + 'px', top: '300px', textAlign: 'center' });
  top1.innerHTML = `<span class="display" style="font-size:76px;font-weight:800;color:#fff">9 groups<span style="color:#FE4D1E">.</span></span>`;

  const FLY = t0 - 0.36;
  hud.hide(tl, FLY);
  tl.set(hud.eb, { opacity: 0 }, FLY + 0.02);
  tl.to(cells, { x: 0, y: 0, scale: 1, duration: 0.36, ease: 'expo.inOut', stagger: 0.012 }, FLY);
  boostBlur(FLY + 0.05, t0, 16);
  cue(FLY, 'riser', { dur: 0.36, gain: 0.6 });
  cue(t0, 'impact', { gain: 1.0 });
  bg.to(tl, FLY, { glow: 0.75, particles: 0.5, orbY: 0.45, dur: 0.4 });
  tl.fromTo(nums, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.5)', stagger: 0.03 }, t0 + 0.02);
  tl.fromTo([...labels, ringLabel], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.24, ease: 'expo.out', stagger: 0.01 }, t0 + 0.05);
  tl.fromTo(top1, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' }, t0 + 0.02);
  counts.forEach((_, i) => cue(t0 + 0.03 + i * 0.03, 'tick', { gain: 0.3, pitch: 1 + i * 0.07 }));

  // ---------------- 37 modules ----------------
  const B2 = t0 + 0.5;
  // module-name wall behind the number
  const wall = el('div', 'abs', sec);
  css(wall, { left: 0, top: '430px', width: W + 'px', height: '900px', overflow: 'hidden', opacity: 0 });
  const all = MODULES.flat();
  const rowsTxt = [0, 1, 2, 3, 4, 5].map((r) => all.filter((_, i) => i % 6 === r).join('  ·  '));
  const wallRows = rowsTxt.map((txt, r) => {
    const d = el('div', 'abs', wall, (txt + '  ·  ').repeat(3));
    css(d, { left: 0, top: r * 150 + 'px', whiteSpace: 'nowrap', font: '700 64px/1 var(--display)', letterSpacing: '-0.03em', color: r % 2 ? 'rgba(255,255,255,0.07)' : 'rgba(254,77,30,0.16)' });
    return d;
  });
  const big = el('div', 'abs', sec);
  css(big, { left: 0, width: W + 'px', top: '540px', textAlign: 'center', font: '900 470px/1 var(--display)', letterSpacing: '-0.07em', color: '#fff', opacity: 0 });
  big.textContent = '37';
  const bigL = el('div', 'abs', sec);
  css(bigL, { left: 0, width: W + 'px', top: '1060px', textAlign: 'center' });
  bigL.innerHTML = `<span class="display" style="font-size:96px;font-weight:800;color:#fff">modules<span style="color:#FE4D1E">.</span></span>`;
  gsap.set(bigL, { opacity: 0 });

  tl.to(cells, { x: (i) => (1 - (i % 3)) * (S + G) * 0.85, y: (i) => (1 - Math.floor(i / 3)) * (S + G) * 0.85, scale: 0.2, opacity: 0, duration: 0.22, ease: 'power4.in', stagger: 0.008 }, B2 - 0.22);
  tl.to([ringLabel], { opacity: 0, duration: 0.1 }, B2 - 0.16);
  tl.to(top1, { opacity: 0, y: -40, duration: 0.2, ease: 'power2.in' }, B2 - 0.2);
  tl.fromTo(big, { scale: 2.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'power4.in' }, B2 - 0.2);
  tl.fromTo(big, { y: 0 }, { keyframes: [{ y: 14, duration: 0.05 }, { y: -6, duration: 0.07 }, { y: 0, duration: 0.1 }], immediateRender: false }, B2);
  tl.fromTo(bigL, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out' }, B2 + 0.04);
  tl.to(wall, { opacity: 1, duration: 0.15 }, B2);
  wallRows.forEach((r, i) => tl.fromTo(r, { x: i % 2 ? -900 : -200 }, { x: i % 2 ? -300 : -800, duration: 0.8, ease: 'none' }, B2 - 0.1));
  boostBlur(B2 - 0.2, B2, 16);
  cue(B2, 'impact', { gain: 0.9 });
  cue(B2, 'sub', { gain: 0.8 });

  // ---------------- 0 paid add-ons ----------------
  const B3 = t0 + 1.0;
  const ZX = 540, ZY = 800; // centre of the orange square while it fills the screen
  const scaleFull = 2400 / RING.size;
  const sq = el('div', 'abs', sec);
  css(sq, {
    left: RING.cx - RING.size / 2 + 'px', top: RING.cy - RING.size / 2 + 'px', width: RING.size + 'px', height: RING.size + 'px',
    borderRadius: LOGO.HR + '%', background: COLOR.orange, zIndex: 5,
  });
  const zero = el('div', 'abs', sq, '0');
  css(zero, { left: 0, top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `900 ${560 / scaleFull}px/1 var(--display)`, color: COLOR.ink, letterSpacing: '-0.05em' });
  const hole = el('div', 'abs', sq);
  const holeS = RING.size * (100 - 2 * LOGO.RING) / 100;
  css(hole, { left: (RING.size - holeS) / 2 + 'px', top: (RING.size - holeS) / 2 + 'px', width: holeS + 'px', height: holeS + 'px', borderRadius: (LOGO.IR / 100) * RING.size + 'px', background: COLOR.ink });
  gsap.set(hole, { scale: 0 });
  gsap.set(sq, { x: ZX - RING.cx, y: ZY - RING.cy, scale: 0, transformOrigin: '50% 50%' });

  const add = el('div', 'abs', sec);
  css(add, { left: 0, width: W + 'px', top: '1060px', textAlign: 'center', zIndex: 6 });
  add.innerHTML = `<span class="display" style="font-size:96px;font-weight:800;color:#0D0B0A">paid add-ons.</span>`;
  const inc = el('div', 'abs', sec);
  css(inc, { left: 0, width: W + 'px', top: '1212px', textAlign: 'center', zIndex: 6, font: '800 44px/1 var(--ui)', color: '#0D0B0A', letterSpacing: '-0.01em' });
  inc.innerHTML = 'Every module <span style="opacity:0.55">included.</span>';
  gsap.set([add, inc], { opacity: 0 });

  tl.to(sq, { scale: scaleFull, duration: 0.26, ease: 'expo.out' }, B3 - 0.06);
  tl.to([big, bigL, wall], { opacity: 0, duration: 0.01 }, B3 + 0.14);
  tl.fromTo(zero, { scale: 1.6 }, { scale: 1, duration: 0.35, ease: 'expo.out' }, B3 - 0.06);
  tl.fromTo(add, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' }, B3 + 0.06);
  tl.fromTo(inc, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out' }, B3 + 0.3);
  boostBlur(B3 - 0.06, B3 + 0.1, 16);
  cue(B3 - 0.04, 'impact', { gain: 1.1 });
  cue(B3, 'burst', { gain: 0.6 });
  cue(B3 + 0.3, 'pop', { gain: 0.5, pitch: 1.1 });

  // ---------------- match cut: orange square -> hollow 9th logo square ----------------
  const M = T.cta - 0.3;
  tl.to([add, inc], { opacity: 0, y: -30, duration: 0.14, ease: 'power2.in' }, M - 0.04);
  tl.to(sq, { x: 0, y: 0, scale: 1, duration: 0.36, ease: 'expo.inOut' }, M);
  tl.to(zero, { opacity: 0, duration: 0.12 }, M + 0.12);
  tl.to(hole, { scale: 1, duration: 0.24, ease: 'back.out(1.8)' }, M + 0.16);
  boostBlur(M, M + 0.3, 16);
  cue(M, 'whoosh', { dur: 0.34, gain: 0.9 });
  bg.to(tl, M, { glow: 0.55, particles: 0.6, orbY: 0.3, dur: 0.5 });
}
