// 15.0 – 16.875s  06 NIGHT AUDIT — circle-wipe into the night; the day closes
// itself (ring fills, checklist ticks, business date flips). Exit: the ring
// becomes the next guest's avatar.
import { tl, b, add, gsap, cue, headline, hlIn, hlOut, windowed, icon, onFrame, prog, rng } from '../lib.js';
import { WIPE_ORIGIN } from './billing.js';
import { T } from '../i18n.js';
const AU = T.audit;

export const T_IN = b(32), T_OUT = b(36);
const RC = { x: 540, y: 905 };
export const AVATAR = { x: 60 + 44 + 75, y: 590 + 44 + 75, r: 75 };

export function build({ world, hud }) {
  const scene = add(world, `<div class="scene" id="s-audit"></div>`);
  windowed(scene, T_IN - 0.42, T_OUT + 0.2);

  add(document.head, `<style>
    #s-audit .wipe { position:absolute; left:${WIPE_ORIGIN.x - 1200}px; top:${WIPE_ORIGIN.y - 1200}px; width:2400px; height:2400px; border-radius:50%; background:#0a0f24; }
    #s-audit .star { position:absolute; border-radius:50%; background:#fff; }
    #s-audit .pct { position:absolute; left:0; width:1080px; top:${RC.y - 92}px; text-align:center; font-family:var(--display); font-weight:700; font-size:118px; letter-spacing:-0.05em; }
    #s-audit .pct small { font-size:.45em; color:var(--muted); margin-left:6px; letter-spacing:0; }
    #s-audit .plbl { position:absolute; left:0; width:1080px; top:${RC.y + 52}px; text-align:center; font-weight:600; font-size:28px; color:var(--muted); height:40px; }
    #s-audit .plbl span { position:absolute; left:0; right:0; }
    #s-audit .plbl .done { color:var(--green); }
    #s-audit .cl { position:absolute; left:170px; display:flex; align-items:center; gap:22px; font-weight:650; font-size:31px; color:var(--muted); }
    #s-audit .cl .c { width:48px; height:48px; border-radius:50%; border:3px solid rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center; }
    #s-audit .cl .c .ico { opacity:0; }
    #s-audit .flap { display:inline-flex; height:56px; margin-left:6px; perspective:300px; }
    #s-audit .flap span { display:inline-flex; align-items:center; justify-content:center; height:56px; padding:0 14px; border-radius:12px;
      background:#18203e; color:#fff; font-family:var(--mono); font-weight:700; font-size:28px; }
    #s-audit .flapw { position:relative; display:inline-block; width:128px; height:56px; }
    #s-audit .flapw span { position:absolute; left:0; top:0; backface-visibility:hidden; }
  </style>`);

  // circle wipe from the PAID stamp
  const wipe = add(scene, `<div class="wipe"></div>`);
  tl.fromTo(wipe, { scale: 0 }, { scale: 1, duration: 0.5, ease: 'power3.inOut' }, T_IN - 0.4);
  tl.set('#bg-color', { backgroundColor: '#0a0f24' }, T_IN + 0.1);
  tl.set(wipe, { opacity: 0 }, T_IN + 0.12);
  cue('whoosh', T_IN - 0.38);
  hud.theme(T_IN - 0.15, { '--hud-fill': '#ff4d1f', '--hud-line': 'rgba(255,255,255,.22)', '--hud-text': '#8d8d99', '--hud-num': '#ff4d1f' }, 0.2);

  // stars + moon
  const R = rng(26);
  const stars = Array.from({ length: 70 }, () => {
    const s = 1.5 + R() * 3;
    return { el: add(scene, `<div class="star" style="left:${R() * 1080}px;top:${60 + R() * 1250}px;width:${s}px;height:${s}px"></div>`), ph: R() * 6.28, w: 3 + R() * 6, base: 0.25 + R() * 0.6 };
  });
  onFrame((t) => {
    if (t < T_IN - 0.4 || t > T_OUT + 0.2) return;
    const k = prog(t, T_IN - 0.1, 0.4);
    for (const s of stars) s.el.style.opacity = (k * s.base * (0.55 + 0.45 * Math.sin(t * s.w + s.ph))).toFixed(3);
  });
  const moon = add(scene, `<svg style="position:absolute;left:800px;top:280px;overflow:visible;filter:drop-shadow(0 0 40px rgba(255,236,210,.45))" width="150" height="150" viewBox="0 0 150 150">
    <defs><mask id="moonm"><rect width="150" height="150" fill="#fff"/><circle cx="104" cy="50" r="58" fill="#000"/></mask></defs>
    <circle cx="75" cy="75" r="62" fill="#f6f1e6" mask="url(#moonm)"/></svg>`);
  tl.fromTo(moon, { y: 60, opacity: 0, rotation: -30 }, { y: 0, opacity: 1, rotation: 0, duration: 0.9, ease: 'expo.out' }, T_IN);

  const hl = headline(scene, AU.hl, { top: 312 });
  hlIn(hl, T_IN + 0.02);
  hud.step(5, AU.hud, T_IN);

  // progress ring
  const ringWrap = add(scene, `<div style="position:absolute;left:${RC.x - 260}px;top:${RC.y - 260}px;width:520px;height:520px"></div>`);
  ringWrap.innerHTML = `<svg width="520" height="520" viewBox="0 0 520 520" style="overflow:visible">
    <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9a6b"/><stop offset="1" stop-color="#ff4d1f"/></linearGradient></defs>
    <circle class="track" cx="260" cy="260" r="220" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="30"/>
    <circle class="arc" cx="260" cy="260" r="220" fill="none" stroke="url(#rg)" stroke-width="30" stroke-linecap="round" transform="rotate(-90 260 260)"
      style="filter:drop-shadow(0 0 22px rgba(255,77,31,.55))"/>
    <circle class="fill" cx="260" cy="260" r="236" fill="#ff4d1f"/></svg>`;
  const arc = ringWrap.querySelector('.arc'), fill = ringWrap.querySelector('.fill');
  gsap.set(fill, { scale: 0, transformOrigin: '50% 50%' });
  const A0 = T_IN + 0.15, A1 = T_IN + 1.35;
  tl.fromTo(ringWrap, { scale: 0.6, opacity: 0, rotation: -60 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.7, ease: 'expo.out' }, T_IN - 0.05);
  tl.fromTo(arc, { drawSVG: '0%' }, { drawSVG: '100%', duration: A1 - A0, ease: 'power2.inOut' }, A0);
  const pct = add(scene, `<div class="pct"><span class="n">0</span><small>%</small></div>`);
  const pn = pct.querySelector('.n');
  onFrame((t) => {
    const s = String(Math.round(100 * prog(t, A0, A1 - A0, 'power2.inOut')));
    if (pn.__s !== s) { pn.textContent = s; pn.__s = s; }
  });
  for (let k = 0; k < 16; k++) cue('tick', A0 + (k * (A1 - A0)) / 16, { v: k / 16 });
  const plbl = add(scene, `<div class="plbl"><span class="run">${AU.running}</span><span class="done">${AU.done}</span></div>`);
  tl.fromTo([pct, plbl], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', stagger: 0.05 }, T_IN + 0.05);
  gsap.set(plbl.querySelector('.done'), { opacity: 0 });
  tl.to(plbl.querySelector('.run'), { opacity: 0, y: -20, duration: 0.2 }, A1);
  tl.fromTo(plbl.querySelector('.done'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, A1 + 0.05);
  tl.fromTo(ringWrap, { scale: 1 }, { scale: 1.06, duration: 0.12, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }, A1);
  cue('success', A1);

  // checklist
  const items = AU.items;
  const cls = items.map((txt, k) => add(scene, `<div class="cl" style="top:${1230 + k * 76}px"><div class="c">${icon('check', { size: 30, sw: 3.4, color: '#062b1c' })}</div>${txt}</div>`));
  const dateRow = add(scene, `<div class="cl" style="top:${1230 + 2 * 76}px"><div class="c">${icon('check', { size: 30, sw: 3.4, color: '#062b1c' })}</div>${AU.date}
    <span class="flapw"><span class="d0">${AU.d0}</span><span class="d1" style="transform:rotateX(180deg)">${AU.d1}</span></span></div>`);
  cls.push(dateRow);
  tl.fromTo(cls, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'expo.out', stagger: 0.06 }, T_IN + 0.15);
  cls.forEach((c, k) => {
    const tk = T_IN + 0.5 + k * 0.4;
    tl.to(c.querySelector('.c'), { backgroundColor: '#3ddc97', borderColor: '#3ddc97', duration: 0.12 }, tk)
      .fromTo(c.querySelector('.c'), { scale: 1.4 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', immediateRender: false }, tk)
      .to(c.querySelector('.c .ico'), { opacity: 1, duration: 0.1 }, tk)
      .to(c, { color: '#f6f3ef', duration: 0.2 }, tk);
    cue('check', tk, { k });
  });
  const d0 = dateRow.querySelector('.d0'), d1 = dateRow.querySelector('.d1');
  const TF = T_IN + 1.3;
  tl.to(d0, { rotationX: -180, duration: 0.5, ease: 'back.out(1.4)' }, TF).to(d1, { rotationX: 0, duration: 0.5, ease: 'back.out(1.4)' }, TF);
  gsap.set(d1, { backgroundColor: '#ff4d1f' });
  cue('flap', TF);

  // exit: ring closes into a disc and flies to the guest avatar slot
  const TX = T_OUT - 0.42;
  hlOut(hl, TX);
  tl.to([pct, plbl, ...cls, moon], { opacity: 0, duration: 0.2, stagger: 0.02 }, TX);
  tl.to(ringWrap.querySelector('.track'), { opacity: 0, duration: 0.15 }, TX);
  tl.to(fill, { scale: 1, duration: 0.22, ease: 'power3.out' }, TX);
  tl.to(ringWrap, { x: AVATAR.x - RC.x, y: AVATAR.y - RC.y, scale: AVATAR.r / 250, duration: 0.5, ease: 'expo.inOut' }, TX + 0.1);
  tl.to('#bg-color', { backgroundColor: '#0b0b0f', duration: 0.4 }, TX + 0.1);
  tl.to(stars.map((s) => s.el), { y: 120, duration: 0.5, ease: 'power2.in' }, TX);
  tl.set(ringWrap, { opacity: 0 }, T_OUT + 0.15);
  cue('morph', TX + 0.1);
}
