// 13.125 – 15.0s  05 BILLING — on orange: the folio builds itself, one click
// splits it between guest and company, both stamped PAID.
import { tl, b, add, gsap, cue, headline, hlIn, hlOut, windowed, icon, onFrame, prog, makeCursor, moveTo, click, shake } from '../lib.js';

export const T_IN = b(28), T_OUT = b(32);
const CARD = { x: 90, y: 580, w: 900, h: 830 };
export const WIPE_ORIGIN = { x: 790, y: 1150 };

export function build({ world, hud }) {
  const scene = add(world, `<div class="scene" id="s-bill"></div>`);
  windowed(scene, T_IN - 0.05, T_OUT + 0.15);

  add(document.head, `<style>
    #s-bill .headline { color:var(--ink); }
    #s-bill .headline .w { color:#fff; }
    #s-bill .inv { position:absolute; background:#faf8f5; color:var(--ink); border-radius:44px; box-shadow:0 60px 120px -20px rgba(90,20,0,.55); }
    #s-bill .inv .h1 { position:absolute; left:48px; top:44px; font-weight:800; font-size:38px; letter-spacing:-0.01em; }
    #s-bill .inv .h2 { position:absolute; left:48px; top:94px; font-weight:500; font-size:24px; color:#6b6b76; }
    #s-bill .split { position:absolute; right:44px; top:48px; height:64px; padding:0 26px; border-radius:32px; background:var(--ink); color:#fff;
      display:flex; align-items:center; gap:12px; font-weight:700; font-size:25px; }
    #s-bill .hr { position:absolute; left:48px; right:48px; height:2px; background:rgba(0,0,0,.08); }
    #s-bill .row { position:absolute; left:48px; right:48px; height:64px; display:flex; align-items:center; font-weight:600; font-size:29px; }
    #s-bill .row .ic { width:52px; height:52px; border-radius:16px; background:rgba(255,77,31,.1); display:flex; align-items:center; justify-content:center; margin-right:20px; }
    #s-bill .row .amt { margin-left:auto; font-weight:700; font-variant-numeric:tabular-nums; }
    #s-bill .row.sm { font-size:25px; color:#6b6b76; height:44px; }
    #s-bill .tot { position:absolute; left:48px; right:48px; display:flex; align-items:baseline; }
    #s-bill .tot .l { font-family:var(--display); font-weight:700; font-size:40px; letter-spacing:-0.02em; }
    #s-bill .tot .v { margin-left:auto; font-family:var(--display); font-weight:800; font-size:66px; letter-spacing:-0.04em; color:var(--orange); }
    #s-bill .methods { position:absolute; left:48px; bottom:40px; display:flex; gap:12px; }
    #s-bill .methods .pill { background:rgba(0,0,0,.05); color:#3b3b44; border-color:rgba(0,0,0,.08); height:50px; font-size:22px; }
    #s-bill .half { position:absolute; width:450px; height:560px; }
    #s-bill .half .k { position:absolute; left:40px; top:40px; font-family:var(--mono); font-weight:700; font-size:22px; letter-spacing:.16em; color:#8a8a94; }
    #s-bill .half .n { position:absolute; left:40px; top:80px; font-weight:750; font-size:34px; }
    #s-bill .half .a { position:absolute; left:36px; top:170px; font-family:var(--display); font-weight:800; font-size:70px; letter-spacing:-0.045em; }
    #s-bill .half .m { position:absolute; left:40px; top:282px; display:flex; align-items:center; gap:12px; font-weight:600; font-size:25px; color:#4a4a54; }
    #s-bill .half .lines { position:absolute; left:40px; right:40px; top:350px; }
    #s-bill .half .lines div { height:14px; border-radius:7px; background:rgba(0,0,0,.06); margin-bottom:16px; }
    #s-bill .stamp { position:absolute; right:34px; bottom:44px; padding:8px 22px; border:6px solid #1fa971; border-radius:18px; color:#1fa971;
      font-family:var(--display); font-weight:800; font-size:48px; letter-spacing:.04em; transform:rotate(-12deg); }
  </style>`);

  // colours for this scene
  hud.theme(T_IN - 0.15, { '--hud-fill': '#0b0b0f', '--hud-line': 'rgba(0,0,0,.28)', '--hud-text': 'rgba(11,11,15,.7)', '--hud-num': '#0b0b0f' }, 0.15);
  tl.to('#bg-glow', { opacity: 0, duration: 0.2 }, T_IN - 0.15);

  const hl = headline(scene, ['Split bills.', '<span class="w">Instant invoices.</span>'], { top: 312 });
  hlIn(hl, T_IN + 0.02);
  hud.step(4, 'Billing & payments', T_IN);

  const inv = add(scene, `<div class="inv" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px">
    <div class="h1">Folio #10482</div><div class="h2">Room 305 · Ayşe Kaya · 3 nights</div>
    <div class="split">${icon('split', { size: 26, sw: 2.6, color: '#fff' })}Split bill</div>
    <div class="hr" style="top:150px"></div></div>`);
  tl.fromTo(inv, { y: 1000, rotation: 6 }, { y: 0, rotation: 0, duration: 0.7, ease: 'expo.out' }, T_IN - 0.08);
  cue('whoosh_s', T_IN - 0.1);

  const items = [['bed-double', 'Room · 3 nights', '$372.00'], ['utensils', 'Restaurant · room charge', '$64.00'], ['flower-2', 'Spa · massage', '$90.00'], ['package', 'Minibar', '$18.00']];
  const rows = items.map(([ic, l, a], k) => add(inv, `<div class="row" style="top:${178 + k * 76}px"><div class="ic">${icon(ic, { size: 28, sw: 2.3, color: '#ff4d1f' })}</div>${l}<span class="amt">${a}</span></div>`));
  add(inv, `<div class="hr" style="top:492px"></div>`);
  const sub = [add(inv, `<div class="row sm" style="top:510px">Subtotal<span class="amt">$544.00</span></div>`),
    add(inv, `<div class="row sm" style="top:556px">VAT 18%<span class="amt">$97.92</span></div>`)];
  const tot = add(inv, `<div class="tot" style="top:620px"><span class="l">Total</span><span class="v">$0.00</span></div>`);
  const methods = add(inv, `<div class="methods"><div class="pill">${icon('banknote', { size: 24, sw: 2.3 })}Cash</div><div class="pill">${icon('credit-card', { size: 24, sw: 2.3 })}Card</div><div class="pill">${icon('landmark', { size: 24, sw: 2.3 })}Bank transfer</div></div>`);
  const R0 = T_IN + 0.15;
  tl.fromTo(rows, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'expo.out', stagger: 0.07 }, R0);
  rows.forEach((_, k) => cue('tick', R0 + k * 0.07, { v: 0.4 + k * 0.1 }));
  tl.fromTo([...sub, tot, methods], { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'expo.out', stagger: 0.05 }, R0 + 0.3);
  const tv = tot.querySelector('.v');
  onFrame((t) => {
    const s = '$' + (641.92 * prog(t, R0 + 0.3, 0.7, 'expo.out')).toFixed(2);
    if (tv.__s !== s) { tv.textContent = s; tv.__s = s; }
  });

  // click "Split bill"
  const cur = makeCursor(scene);
  const sx = CARD.x + CARD.w - 44 - 110, sy = CARD.y + 48 + 34;
  tl.set(cur.el, { opacity: 1, x: 980, y: 1500 }, R0 + 0.3);
  moveTo(cur, R0 + 0.3, sx, sy, 0.5, 'power3.inOut');
  const CLICK = R0 + 0.85;
  click(cur, CLICK, sx, sy, { color: '#0b0b0f' });
  tl.to(cur.el, { opacity: 0, duration: 0.2 }, CLICK + 0.25);

  // split into two bills
  const halves = [
    { x: 58, rot: -3.5, k: 'Guest', n: 'Ayşe Kaya', a: '$202.96', ic: 'credit-card', m: 'Card ···· 4821' },
    { x: 572, rot: 3.5, k: 'Company', n: 'Nexa Corp.', a: '$438.96', ic: 'landmark', m: 'Bank transfer' },
  ].map((h, i) => {
    const el = add(scene, `<div class="inv half" style="left:${h.x}px;top:700px"><div class="k">${h.k}</div><div class="n">${h.n}</div>
      <div class="a">${h.a}</div><div class="m">${icon(h.ic, { size: 28, sw: 2.3, color: '#ff4d1f' })}${h.m}</div>
      <div class="lines"><div style="width:88%"></div><div style="width:64%"></div><div style="width:76%"></div></div>
      <div class="stamp">PAID</div></div>`);
    tl.fromTo(el, { y: 120, opacity: 0, rotation: 0, scale: 0.9 },
      { y: 0, opacity: 1, rotation: h.rot, scale: 1, duration: 0.6, ease: 'back.out(1.6)' }, CLICK + 0.1);
    const st = el.querySelector('.stamp');
    const ts = CLICK + 0.42 + i * 0.16;
    tl.fromTo(st, { scale: 2.6, opacity: 0, rotation: -24 }, { scale: 1, opacity: 1, rotation: -12, duration: 0.28, ease: 'power4.in' }, ts - 0.28);
    cue('stamp', ts, { i });
    shake(ts, 0.22, 7);
    return el;
  });
  // the folio tears in two: clipped copies of the card fly apart, revealing the new bills
  const tears = [0, 1].map((i) => {
    const c = inv.cloneNode(true);
    c.style.clipPath = i ? `inset(0 0 0 ${CARD.w / 2}px round 0 44px 44px 0)` : `inset(0 ${CARD.w / 2}px 0 0 round 44px 0 0 44px)`;
    // clones carry build-time styles: put them in the folio's settled state
    c.style.transform = '';
    c.querySelectorAll('.row, .tot, .methods').forEach((e) => { e.style.opacity = 1; e.style.transform = 'none'; });
    c.querySelector('.tot .v').textContent = '$641.92';
    scene.appendChild(c);
    gsap.set(c, { x: 0, y: 0, rotation: 0, opacity: 0, transformOrigin: i ? '100% 100%' : '0% 100%' });
    tl.set(c, { opacity: 1 }, CLICK + 0.04);
    tl.to(c, { x: i ? 260 : -260, y: 120, rotation: i ? 14 : -14, opacity: 0, duration: 0.42, ease: 'power3.in' }, CLICK + 0.04);
    return c;
  });
  tl.set(inv, { opacity: 0 }, CLICK + 0.04);
  cue('split', CLICK + 0.04);

  hlOut(hl, T_OUT - 0.42);
  tl.to(halves, { y: -40, duration: 0.5, ease: 'power2.in' }, T_OUT - 0.4);
}
