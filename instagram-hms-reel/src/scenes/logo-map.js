// 3.0 – 9.0s  The orange square slams, bursts into the iNeed.now mark, the
// product name lands, then the 9 squares become the first tiles of the
// 37-module map (filled = core, hollow = add-ons). Finally every tile
// collapses into one hollow square that we fly through into the product.
import { h, rng, onFrame, cue, impact, prog, lerp, clamp, noise1, masked } from '../lib/core.js';

const ROWS = [
  { label: 'Clinical', n: 6 },
  { label: 'Billing', n: 6 },
  { label: 'Staff & HR', n: 3 },
  { label: 'Accounting', n: 4 },
  { label: 'Analytics', n: 2 },
  { label: 'Admin & Security', n: 7 },
  { label: 'Diagnostics', n: 2, price: '+$29/mo' },
  { label: 'Insurance', n: 2, price: '+$25/mo' },
  { label: 'Pharmacy & Stock', n: 4, price: '+$22/mo' },
  { label: 'Patient Portal', n: 1, price: '+$19/mo' },
];

const TILE = 56;
const FILLED_B = TILE / 2; // border that fully fills the tile
const HOLLOW_B = TILE * 0.243; // logo stroke ratio
const R_FILLED = TILE * 0.186;
const R_HOLLOW = TILE * 0.314;
const LOGO_TILE = 128;
const LOGO_PITCH = 192;

export default function logoMap({ root, tl }) {
  const S = h('section.scene.light#s-logomap');
  root.append(S);
  tl.set(S, { visibility: 'visible' }, 3.0);
  tl.set(S, { visibility: 'hidden' }, 9.0);

  const dots = h('div.dots.on-light');
  S.append(dots);
  onFrame((t) => {
    if (t < 2.9 || t > 9.1) return;
    dots.style.transform = `translate(${(-(t - 3) * 14).toFixed(1)}px, ${(-(t - 3) * 22).toFixed(1)}px)`;
  });

  /* ---------- map layout ---------- */
  const tiles = [];
  let rowTop;
  ROWS.forEach((row, ri) => {
    const addon = !!row.price;
    rowTop = addon ? 1150 + (ri - 6) * 68 : 680 + ri * 68;
    row.top = rowTop;
    for (let k = 0; k < row.n; k++) {
      tiles.push({ row: ri, k, addon, mx: 430 + k * 68 + TILE / 2, my: rowTop + TILE / 2 });
    }
  });

  // Logo squares map to: clinical 0-5, billing 0-1, diagnostics 0 (the hollow one)
  const logoIdx = [0, 1, 2, 3, 4, 5, 6, 7, tiles.findIndex((t) => t.row === 6)];
  logoIdx.forEach((ti, li) => { tiles[ti].logo = li; });
  const portalIdx = tiles.length - 1; // the Patient Portal tile becomes the portal

  const tileLayer = h('div.abs', { style: { inset: '0' } });
  S.append(tileLayer);
  tiles.forEach((tt) => {
    tt.el = h('div.tile', {
      style: {
        left: `${tt.mx - TILE / 2}px`, top: `${tt.my - TILE / 2}px`,
        background: 'transparent', borderStyle: 'solid', borderColor: 'var(--orange)',
      },
    });
    tileLayer.append(tt.el);
  });

  // Order of appearance for the 28 non-logo tiles (row-major).
  let order = 0;
  tiles.forEach((tt) => {
    if (tt.logo !== undefined) return;
    tt.appear = 5.22 + order * 0.04;
    cue(tt.appear, 'blip', { n: order % 8, gain: 0.35 });
    order++;
  });
  // Hollow → filled activation for add-ons
  let fillOrder = 0;
  tiles.forEach((tt) => {
    if (!tt.addon) return;
    tt.fill = 7.12 + fillOrder * 0.065;
    cue(tt.fill, 'coin', { n: fillOrder });
    fillOrder++;
  });
  // Collapse timing: far tiles leave first
  tiles.forEach((tt, i) => {
    const d = Math.hypot(tt.mx - 540, tt.my - 960) / 900;
    tt.collapse = 7.84 + (1 - clamp(d)) * 0.16 + (i % 3) * 0.012;
  });

  const burstOrder = [0, 1, 2, 5, 8, 7, 6, 3];
  const r = rng(3);
  const logoRot = Array.from({ length: 9 }, () => r.sign() * r.range(60, 140));
  burstOrder.forEach((li, k) => cue(3.06 + k * 0.055, 'pluck', { n: k }));

  const E = {
    expoOut: gsap.parseEase('expo.out'),
    expoInOut: gsap.parseEase('expo.inOut'),
    back: gsap.parseEase('back.out(2.6)'),
    back2: gsap.parseEase('back.out(2)'),
    slam: gsap.parseEase('slam'),
    p3in: gsap.parseEase('power3.in'),
  };

  function logoState(li, t) {
    const lc = { x: 540, y: lerp(960, 700, prog(t, 3.7, 4.3, E.expoInOut)) };
    const ls = lerp(1, 0.84, prog(t, 3.7, 4.3, E.expoInOut));
    const col = li % 3, row = Math.floor(li / 3);
    const ox = (col - 1) * LOGO_PITCH * ls, oy = (row - 1) * LOGO_PITCH * ls;
    let s = (LOGO_TILE / TILE) * ls, rot = 0, op = 1, x = lc.x + ox, y = lc.y + oy;
    let sx = 1, sy = 1;
    if (li === 4) {
      const p = clamp((t - 3.0) / 0.4);
      s *= lerp(2.3, 1, E.slam(p));
      const q = clamp((t - 3.0) / 0.3);
      sx = 1 + 0.28 * Math.sin(q * Math.PI) * (1 - q);
      sy = 1 - 0.22 * Math.sin(q * Math.PI) * (1 - q);
    } else {
      const k = burstOrder.indexOf(li);
      const tb = 3.06 + k * 0.055;
      const p = E.expoOut(clamp((t - tb) / 0.55));
      if (t < tb) op = 0;
      x = lc.x + ox * p;
      y = lc.y + oy * p;
      s *= lerp(0.3, 1, p);
      rot = (1 - p) * logoRot[li];
    }
    // idle breathing once the mark has settled
    const b = prog(t, 4.3, 4.6);
    s *= 1 + b * 0.025 * Math.sin((t - 4.3) * 5.2 - li * 0.55);
    const hol = li === 8 ? E.back2(clamp((t - 3.62) / 0.3)) : 0;
    return { x, y, s, sx, sy, rot, op, hol };
  }

  function apply(tt, st) {
    const b = lerp(FILLED_B, HOLLOW_B, clamp(st.hol, 0, 1.2));
    const rad = lerp(R_FILLED, R_HOLLOW, clamp(st.hol, 0, 1));
    const el = tt.el;
    el.style.borderWidth = `${Math.max(b, 3).toFixed(2)}px`;
    el.style.backgroundColor = st.hol < 0.02 ? '#fe4d1e' : 'transparent';
    el.style.borderRadius = `${rad.toFixed(2)}px`;
    el.style.opacity = st.op.toFixed(3);
    el.style.transform = `translate(${(st.x - tt.mx).toFixed(2)}px, ${(st.y - tt.my).toFixed(2)}px) rotate(${st.rot.toFixed(2)}deg) scale(${(st.s * (st.sx || 1)).toFixed(4)}, ${(st.s * (st.sy || 1)).toFixed(4)})`;
  }

  onFrame((t) => {
    if (t < 2.99 || t > 9.05) return;
    for (let i = 0; i < tiles.length; i++) {
      const tt = tiles[i];
      let st;
      if (tt.logo !== undefined) {
        const L = logoState(tt.logo, Math.min(t, 5.0));
        const tf = 5.0 + tt.logo * 0.03;
        const p = E.expoInOut(clamp((t - tf) / 0.62));
        st = {
          x: lerp(L.x, tt.mx, p), y: lerp(L.y, tt.my, p), s: lerp(L.s, 1, p),
          sx: L.sx, sy: L.sy, rot: L.rot * (1 - p) + Math.sin(p * Math.PI) * (tt.logo % 2 ? 12 : -12),
          op: L.op, hol: L.hol,
        };
      } else {
        const p = clamp((t - tt.appear) / 0.36);
        st = { x: tt.mx, y: tt.my + (1 - E.expoOut(p)) * 26, s: E.back(p), rot: (1 - E.expoOut(p)) * -30, op: t < tt.appear ? 0 : 1, hol: tt.addon ? 1 : 0 };
      }
      if (tt.addon) st.hol = 1 - E.back2(clamp((t - tt.fill) / 0.22));
      // collapse
      if (i === portalIdx) {
        const p = E.expoInOut(clamp((t - 7.9) / 0.42));
        st.x = lerp(st.x, 540, p);
        st.y = lerp(st.y, 960, p);
        // arrive, then a small anticipation squeeze before we fly through
        const ant = Math.sin(Math.PI * clamp((t - 8.3) / 0.15)) * 0.14;
        st.s = lerp(st.s, 200 / TILE, p) * (1 - ant);
        st.rot = lerp(0, 180, p) - ant * 40;
        st.hol = lerp(st.hol, 1, clamp((t - 7.98) / 0.3));
        if (t >= 8.45) st.op = 0;
      } else {
        const p = E.p3in(clamp((t - tt.collapse) / 0.38));
        st.x = lerp(st.x, 540, p);
        st.y = lerp(st.y, 960, p);
        st.s *= 1 - p * 0.92;
        st.rot += p * 140 * (i % 2 ? 1 : -1);
        if (p >= 0.99) st.op = 0;
      }
      apply(tt, st);
    }
  });

  /* ---------- slam dressing: flash, rings, particles ---------- */

  [0, 0.07].forEach((d, i) => {
    const ring = h('div.ring');
    S.insertBefore(ring, tileLayer);
    gsap.set(ring, { autoAlpha: 0 });
    tl.fromTo(ring, { autoAlpha: 1, scale: 0.25, borderWidth: i ? 6 : 26 },
      { autoAlpha: 0, scale: i ? 2.3 : 3.1, borderWidth: 1, duration: 0.9, ease: 'expo.out', immediateRender: false }, 3.0 + d);
  });
  const pr = rng(21);
  for (let i = 0; i < 16; i++) {
    const p = h('div.particle');
    S.append(p);
    const a = pr.range(0, Math.PI * 2);
    const dist = pr.range(330, 760);
    const size = pr.range(10, 30);
    gsap.set(p, { left: 540 - size / 2, top: 960 - size / 2, width: size, height: size, borderRadius: size * 0.22, autoAlpha: 0 });
    tl.fromTo(p, { x: 0, y: 0, rotation: 0, autoAlpha: 1, scale: 1 },
      { x: Math.cos(a) * dist, y: Math.sin(a) * dist, rotation: pr.range(-360, 360), scale: 0, duration: pr.range(0.7, 1.1), ease: 'expo.out', immediateRender: false }, 3.0);
  }
  impact(3.0, 30, 7, 15);
  cue(3.0, 'impact', { big: 1 });
  cue(3.62, 'click');

  /* ---------- wordmark ---------- */
  const word = h('div.wordmark', { style: { top: '985px' } });
  S.append(word);
  const chars = [];
  const holder = h('span', { style: { display: 'inline-block' } });
  word.append(holder);
  'HMSNow'.split('').forEach((c, i) => {
    const s = h('span', { style: { display: 'inline-block' } }, c);
    if (i >= 3) s.className = 'now';
    holder.append(s);
    chars.push(s);
  });
  chars.forEach((c) => masked(c, 0.12));
  gsap.set(chars, { yPercent: 115 });
  tl.to(chars, { yPercent: 0, duration: 0.75, ease: 'expo.out', stagger: 0.04 }, 3.86);
  tl.to(chars, { yPercent: -115, duration: 0.4, ease: 'power3.in', stagger: 0.02 }, 4.92);
  cue(3.86, 'swish');

  const tag = h('div.tagline', { style: { top: '1150px' } }, 'Clinic & hospital management');
  const by = h('div.tagline.mono', { style: { top: '1222px', fontSize: '26px', letterSpacing: '0.28em', color: '#9a9aa3', fontFamily: 'var(--mono)', fontWeight: '600' } }, 'BY INEED.NOW');
  S.append(tag, by);
  gsap.set([tag, by], { autoAlpha: 0 });
  tl.fromTo(tag, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', immediateRender: false }, 4.12);
  tl.fromTo(by, { autoAlpha: 0, y: 20, letterSpacing: '0.6em' }, { autoAlpha: 1, y: 0, letterSpacing: '0.28em', duration: 0.7, ease: 'expo.out', immediateRender: false }, 4.25);
  tl.to([tag, by], { autoAlpha: 0, y: -24, duration: 0.3, ease: 'power2.in', stagger: 0.04 }, 4.9);

  /* ---------- map text ---------- */
  const count = h('div.map-count', { style: { top: '12px' } }, '9');
  const countMask = h('div.abs', { style: { left: '0', top: '238px', right: '0', height: '276px', overflow: 'hidden' } });
  countMask.append(count);
  const title1 = h('div.map-title', { style: { top: '322px' } }, 'modules,');
  const title2 = h('div.map-title', { style: { top: '392px' } }, 'one login.');
  S.append(countMask, title1, title2);
  gsap.set(count, { yPercent: 112 });
  gsap.set([title1, title2], { autoAlpha: 0 });
  tl.to(count, { yPercent: 0, duration: 0.7, ease: 'expo.out' }, 5.02);
  tl.fromTo(title1, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'expo.out', immediateRender: false }, 5.12);
  tl.fromTo(title2, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'expo.out', immediateRender: false }, 5.2);
  onFrame((t) => {
    if (t < 4.9 || t > 9) return;
    let n = 9;
    for (const tt of tiles) if (tt.appear !== undefined && t >= tt.appear) n++;
    const txt = String(n);
    if (count.textContent !== txt) count.textContent = txt;
  });
  // Count digits pop on each tick
  tl.to([count, title1, title2], { y: -40, autoAlpha: 0, duration: 0.35, ease: 'power3.in', stagger: 0.05 }, 7.84);

  const heads = [
    { top: 634, text: 'Core · included' },
    { top: 1104, text: 'Add-ons · as you grow' },
  ].map((hd, i) => {
    const ln = h('span.ln');
    const el = h('div.map-head', { style: { top: `${hd.top}px` } }, h('span', {}, hd.text), ln);
    S.append(el);
    gsap.set(el, { autoAlpha: 0 });
    const t0 = i ? 5.72 : 5.18;
    tl.fromTo(el, { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, t0);
    tl.fromTo(ln, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.6, ease: 'expo.out', immediateRender: false }, t0 + 0.1);
    tl.to(el, { autoAlpha: 0, x: -30, duration: 0.25, ease: 'power2.in' }, 7.8 + i * 0.05);
    return el;
  });

  ROWS.forEach((row, ri) => {
    const lab = h('div.map-label', { style: { top: `${row.top}px`, lineHeight: `${TILE}px`, height: `${TILE}px` } }, row.label);
    S.append(lab);
    gsap.set(lab, { autoAlpha: 0 });
    const first = tiles.find((t) => t.row === ri);
    const t0 = first.appear !== undefined ? first.appear - 0.06 : 5.12 + ri * 0.05;
    tl.fromTo(lab, { autoAlpha: 0, x: -34 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'expo.out', immediateRender: false }, t0);
    tl.to(lab, { autoAlpha: 0, x: -40, duration: 0.25, ease: 'power2.in' }, 7.8 + ri * 0.012);
    if (row.price) {
      const k = ri - 6;
      const pill = h('div.price', { style: { left: `${430 + row.n * 68 + 12}px`, top: `${row.top + 3}px` } }, row.price);
      S.append(pill);
      gsap.set(pill, { autoAlpha: 0, transformOrigin: '0% 50%' });
      const tp = 6.5 + k * 0.1;
      tl.fromTo(pill, { autoAlpha: 0, scale: 0.4, x: -20 }, { autoAlpha: 1, scale: 1, x: 0, duration: 0.45, ease: 'back.out(2.4)', immediateRender: false }, tp);
      cue(tp, 'pop', { n: k });
      tl.to(pill, { autoAlpha: 0, scale: 0.6, duration: 0.2, ease: 'power2.in' }, 7.82 + k * 0.02);
    }
  });

  cue(5.0, 'whoosh', { dur: 0.6, gain: 0.5 });
  cue(7.84, 'suck', { dur: 0.6 });

  /* ---------- portal frame (top layer, above every scene) ---------- */
  const frame = h('div.portal-frame', { style: { zIndex: '50' } });
  root.append(frame);
  gsap.set(frame, { autoAlpha: 0 });
  const pin = gsap.parseEase('power2.in');
  onFrame((t) => {
    if (t < 8.44 || t > 9.02) {
      frame.style.visibility = 'hidden';
      return;
    }
    const p = pin(clamp((t - 8.45) / 0.55));
    const size = lerp(200, 5600, p);
    frame.style.visibility = 'visible';
    frame.style.opacity = '1';
    frame.style.width = frame.style.height = `${size}px`;
    frame.style.left = `${540 - size / 2}px`;
    frame.style.top = `${960 - size / 2}px`;
    frame.style.borderWidth = `${(size * 0.243).toFixed(2)}px`;
    frame.style.borderRadius = `${(size * 0.314).toFixed(2)}px`;
    frame.style.transform = `rotate(${(180 + p * 45).toFixed(2)}deg)`;
  });
  cue(8.45, 'portal', { dur: 0.55 });

  // Expose the hole geometry so the journey scene can clip to it.
  window.__portalHole = (t) => {
    if (t < 8.44) return 0;
    const p = pin(clamp((t - 8.45) / 0.55));
    const size = lerp(200, 5600, p);
    return { half: size * 0.257, radius: size * 0.071, rot: 180 + p * 45 };
  };
}
