// 9.375 – 11.25s  03 FRONT DESK — the dragged booking morphs into a check-in
// card: room rolls to 305, checklist ticks, signature, one click → checked in.
import { tl, b, add, gsap, cue, headline, hlIn, windowed, icon, makeCursor, moveTo, click, onFrame, prog, odometer, setOdo, rng } from '../lib.js';
import { barRect, DROP } from './reservations.js';
import { T } from '../i18n.js';
const FD = T.desk;

export const T_IN = b(20), T_OUT = b(24);
const CARD = { x: 60, y: 590, w: 960, h: 860 };

export function build({ world, hud }) {
  const scene = add(world, `<div class="scene" id="s-desk"><div class="dots"></div></div>`);
  windowed(scene, T_IN - 0.4, T_OUT + 0.2);

  add(document.head, `<style>
    #s-desk .morph { position:absolute; background:var(--orange); border-radius:18px; }
    #s-desk .avatar { position:absolute; left:44px; top:44px; width:128px; height:128px; border-radius:50%; background:var(--orange);
      display:flex; align-items:center; justify-content:center; font-family:var(--display); font-weight:700; font-size:46px; color:#fff; }
    #s-desk .name { position:absolute; left:200px; top:54px; font-weight:750; font-size:46px; letter-spacing:-0.01em; }
    #s-desk .sub { position:absolute; left:200px; top:114px; font-weight:500; font-size:26px; color:var(--muted); }
    #s-desk .status { position:absolute; right:40px; top:62px; }
    #s-desk .div { position:absolute; left:44px; right:44px; top:212px; height:1.5px; background:var(--line); }
    #s-desk .roomlbl { position:absolute; left:44px; top:250px; }
    #s-desk .roomno { position:absolute; left:34px; top:280px; font-family:var(--display); font-weight:800; font-size:172px; letter-spacing:-0.05em; line-height:1.08; }
    #s-desk .roomsub { position:absolute; left:46px; top:478px; font-weight:500; font-size:25px; color:var(--muted); }
    #s-desk .chk { position:absolute; left:520px; display:flex; align-items:center; gap:20px; font-weight:650; font-size:29px; }
    #s-desk .chk .c { width:46px; height:46px; border-radius:50%; border:3px solid rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center; color:var(--ink); }
    #s-desk .chk .c .ico { opacity:0; }
    #s-desk .chk .li { color:var(--muted); display:flex; }
    #s-desk .sig { position:absolute; left:44px; top:544px; width:872px; height:136px; border-radius:24px; background:rgba(255,255,255,.035); border:1.5px dashed rgba(255,255,255,.14); }
    #s-desk .sig .kicker { position:absolute; left:24px; top:18px; font-size:19px; }
    #s-desk .btn { position:absolute; left:44px; top:708px; width:872px; height:112px; border-radius:30px; background:var(--orange); overflow:hidden;
      display:flex; align-items:center; justify-content:center; gap:18px; font-family:var(--display); font-weight:700; font-size:38px; color:#fff; letter-spacing:-0.02em; }
    #s-desk .btn .a, #s-desk .btn .b2 { position:absolute; left:0; right:0; top:0; bottom:0; display:flex; align-items:center; justify-content:center; gap:18px; }
    #s-desk .btn .b2 { color:#062b1c; }
    #s-desk .conf { position:absolute; left:0; top:0; border-radius:3px; }
  </style>`);

  // --- morph: booking bar → card ---
  const from = barRect(DROP.row, DROP.d0, DROP.d1);
  const morph = add(scene, `<div class="morph" style="left:${from.x}px;top:${from.y}px;width:${from.w}px;height:${from.h}px"></div>`);
  const M0 = T_IN - 0.33;
  tl.fromTo(morph, { left: from.x, top: from.y, width: from.w, height: from.h, borderRadius: 18, backgroundColor: '#ff4d1f', opacity: 1 },
    { left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, borderRadius: 44, duration: 0.58, ease: 'expo.inOut' }, M0);
  tl.to(morph, { opacity: 0, duration: 0.22, ease: 'power1.in' }, M0 + 0.5);
  cue('morph', M0);

  const hl = headline(scene, FD.hl, { top: 312 });
  hlIn(hl, T_IN + 0.05);
  hud.step(2, FD.hud, T_IN);

  const card = add(scene, `<div class="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px"></div>`);
  tl.fromTo(card, { opacity: 0 }, { opacity: 1, duration: 0.01 }, M0 + 0.45);
  const avatar = add(card, `<div class="avatar">${FD.initials}</div>`);
  const name = add(card, `<div class="name">${FD.name}</div>`);
  const sub = add(card, `<div class="sub">${FD.sub}</div>`);
  const st1 = add(card, `<div class="status pill blue">${icon('clock', { size: 22, sw: 2.6 })}${FD.arriving}</div>`);
  const st2 = add(card, `<div class="status pill green">${icon('check', { size: 22, sw: 3 })}${FD.inhouse}</div>`);
  add(card, `<div class="div"></div>`);
  add(card, `<div class="roomlbl kicker">${FD.room}</div>`);
  const roomNo = add(card, `<div class="roomno"></div>`);
  const odo = odometer(roomNo, { digits: 3 });
  add(card, `<div class="roomsub">${FD.roomSub}</div>`);
  const checks = [['shield-check', FD.checks[0]], ['credit-card', FD.checks[1]], ['file-text', FD.checks[2]]].map(([ic, txt], k) =>
    add(card, `<div class="chk" style="top:${262 + k * 82}px"><div class="c">${icon('check', { size: 28, sw: 3.4, color: '#062b1c' })}</div><span class="li">${icon(ic, { size: 28, sw: 2.2 })}</span>${txt}</div>`));
  const sig = add(card, `<div class="sig"><div class="kicker">${FD.sig}</div>
    <svg style="position:absolute;left:250px;top:10px" width="560" height="120" viewBox="0 0 400 110" fill="none" stroke="#f6f3ef" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round">
      <path class="s1" d="M10 80 C 30 20, 55 8, 60 58 C 62 86, 38 96, 34 74 C 30 54, 70 38, 90 60 C 104 76, 110 38, 126 44 C 141 50, 130 82, 151 70 C 170 58, 176 28, 191 34 C 206 40, 196 76, 216 72 C 236 68, 240 38, 261 44 C 281 50, 271 86, 301 58"/>
      <path class="s2" d="M322 26 C 319 58, 316 80, 313 98 M 321 64 C 340 46, 356 40, 368 36 M 330 64 C 346 76, 362 86, 384 90"/>
    </svg></div>`);
  const btn = add(card, `<div class="btn"><div class="a">${FD.btn} ${icon('arrow-right', { size: 40, sw: 2.8, color: '#fff' })}</div>
    <div class="b2">${icon('check', { size: 42, sw: 3.4, color: '#062b1c' })}${FD.done}</div></div>`);
  const btnA = btn.querySelector('.a'), btnB = btn.querySelector('.b2');

  const C0 = T_IN + 0.1;
  tl.fromTo(avatar, { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(2.2)' }, C0);
  tl.fromTo([name, sub], { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.06 }, C0 + 0.05);
  tl.fromTo(st1, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.5)' }, C0 + 0.15);
  gsap.set(st2, { opacity: 0 });
  tl.fromTo(card.querySelectorAll('.roomlbl, .roomsub, .chk, .sig, .btn'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.04 }, C0 + 0.05);

  // room number rolls into place
  onFrame((t) => setOdo(odo, 305 * prog(t, C0 + 0.15, 0.95, 'expo.out')));
  for (let k = 0; k < 10; k++) cue('tick', C0 + 0.15 + k * 0.06, { v: 0.3 + k / 20 });

  // checklist
  checks.forEach((c, k) => {
    const tk = C0 + 0.45 + k * 0.2;
    tl.to(c.querySelector('.c'), { backgroundColor: '#3ddc97', borderColor: '#3ddc97', duration: 0.15 }, tk)
      .fromTo(c.querySelector('.c'), { scale: 1.35 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', immediateRender: false }, tk)
      .to(c.querySelector('.c .ico'), { opacity: 1, duration: 0.1 }, tk);
    cue('check', tk, { k });
  });
  // signature
  tl.fromTo(sig.querySelector('.s1'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.5, ease: 'power1.inOut' }, C0 + 0.5);
  tl.fromTo(sig.querySelector('.s2'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.22, ease: 'power1.inOut' }, C0 + 1.0);
  cue('scribble', C0 + 0.5);

  // cursor → click "Check in"
  const cur = makeCursor(scene);
  const bx = CARD.x + 44 + 600, by = CARD.y + 708 + 70;
  tl.set(cur.el, { opacity: 1, x: 900, y: 1700 }, C0 + 0.6);
  moveTo(cur, C0 + 0.6, bx, by, 0.55, 'power3.out');
  const CLICK = C0 + 1.2;
  click(cur, CLICK, bx, by, { color: '#ffffff' });
  tl.to(btn, { scale: 0.97, duration: 0.08 }, CLICK - 0.06).to(btn, { scale: 1, duration: 0.35, ease: 'back.out(3)' }, CLICK + 0.02);
  tl.to(btn, { backgroundColor: '#3ddc97', duration: 0.25 }, CLICK);
  tl.to(btnA, { yPercent: -100, opacity: 0, duration: 0.3, ease: 'power3.in' }, CLICK);
  tl.fromTo(btnB, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'expo.out' }, CLICK + 0.12);
  tl.to(st1, { opacity: 0, scale: 0.6, duration: 0.2 }, CLICK + 0.1);
  tl.fromTo(st2, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, CLICK + 0.15);
  tl.to(cur.el, { opacity: 0, duration: 0.2 }, CLICK + 0.3);
  cue('success', CLICK + 0.1);

  // confetti squares from the button
  const R = rng(305);
  const conf = Array.from({ length: 30 }, () => {
    const s = 8 + R() * 12;
    const col = ['#ff4d1f', '#3ddc97', '#f6f3ef', '#ffc24b'][Math.floor(R() * 4)];
    return { el: add(card, `<div class="conf" style="width:${s}px;height:${s * (0.6 + R() * 0.8)}px;background:${col}"></div>`),
      x: 150 + R() * 660, vx: (R() - 0.5) * 900, vy: -700 - R() * 900, spin: (R() - 0.5) * 1400 };
  });
  onFrame((t) => {
    const dt = t - (CLICK + 0.15);
    for (const c of conf) {
      if (dt < 0 || dt > 1.2) { c.el.style.opacity = 0; continue; }
      c.el.style.opacity = Math.min(1, 3 * (1.2 - dt)).toFixed(2);
      c.el.style.transform = `translate(${(44 + c.x + c.vx * dt).toFixed(1)}px,${(760 + c.vy * dt + 1600 * dt * dt).toFixed(1)}px) rotate(${(c.spin * dt).toFixed(0)}deg)`;
    }
  });

  // exit: dive into the room number (match-cut to the housekeeping board)
  const ox = CARD.x + 34 + 190, oy = CARD.y + 280 + 95;
  gsap.set(scene, { transformOrigin: `${ox}px ${oy}px` });
  tl.to(scene, { scale: 7, duration: 0.42, ease: 'power3.in' }, T_OUT - 0.34);
  tl.to(scene, { opacity: 0, duration: 0.12 }, T_OUT - 0.04);
  cue('zoom', T_OUT - 0.34);
}
