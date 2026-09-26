// 7.5 – 9.375s  02 RESERVATIONS — tape chart fills itself, a booking is dragged
// into room 305 and gets an automatic rate quote.
import { tl, b, add, gsap, cue, headline, hlIn, hlOut, windowed, icon, makeCursor, moveTo, click, onFrame, prog } from '../lib.js';

export const T_IN = b(16), T_OUT = b(20);
// geometry shared with the front-desk morph
export const PANEL = { x: 60, y: 590, w: 960, h: 870 };
const LEFT = 150, TOP = 104, ROW = 84, PAD = 32;
const COLW = (PANEL.w - PAD * 2 - LEFT) / 7;
export function barRect(row, d0, d1) {
  return {
    x: PANEL.x + PAD + LEFT + d0 * COLW + 5,
    y: PANEL.y + TOP + row * ROW + 12,
    w: (d1 - d0) * COLW - 10,
    h: ROW - 24,
  };
}
export const DROP = { row: 4, d0: 3.5, d1: 6.5 };

export function build({ world, hud }) {
  const scene = add(world, `<div class="scene" id="s-resv"><div class="dots"></div></div>`);
  windowed(scene, T_IN - 0.01, T_OUT + 0.45);

  add(document.head, `<style>
    #s-resv .hdr { position:absolute; top:${PAD}px; height:60px; text-align:center; font-family:var(--mono); font-size:21px; color:var(--muted); letter-spacing:.06em; }
    #s-resv .hdr b { display:block; font-family:var(--sans); font-size:27px; color:var(--text); letter-spacing:0; margin-top:2px; font-weight:700; }
    #s-resv .today { position:absolute; border-radius:22px; background:rgba(255,77,31,.08); border:1.5px solid rgba(255,77,31,.35); }
    #s-resv .room { position:absolute; left:${PAD + 6}px; font-weight:700; font-size:28px; }
    #s-resv .room small { display:block; font-weight:500; font-size:19px; color:var(--muted); margin-top:1px; }
    #s-resv .gl { position:absolute; height:1.5px; background:var(--line); }
    #s-resv .bar { position:absolute; border-radius:18px; display:flex; align-items:center; gap:8px; padding:0 16px;
      font-weight:700; font-size:22px; white-space:nowrap; overflow:hidden; transform-origin:0 50%; }
    #s-resv .bar small { font-weight:600; font-size:18px; opacity:.7; }
    #s-resv .b-or { background:var(--orange); color:#fff; }
    #s-resv .b-lt { background:var(--text); color:var(--ink); }
    #s-resv .b-gr { background:var(--ink4); color:var(--text); border:1.5px solid var(--line2); }
    #s-resv .b-bl { background:var(--blue); color:#0b1633; }
    #s-resv .b-wl { background:transparent; color:var(--muted); border:2.5px dashed rgba(255,255,255,.28); }
    #s-resv .legend { position:absolute; left:${PAD}px; bottom:26px; display:flex; gap:28px; font-weight:600; font-size:22px; color:var(--muted); }
    #s-resv .legend i { display:inline-block; width:18px; height:18px; border-radius:5px; margin-right:10px; vertical-align:-2px; }
    #s-resv .drag { position:absolute; left:0; top:0; z-index:40; box-shadow:0 30px 60px rgba(0,0,0,.55), 0 0 0 4px rgba(255,255,255,.9); }
    #s-resv .quote { position:absolute; padding:14px 20px; border-radius:18px; background:var(--text); color:var(--ink); white-space:nowrap;
      font-weight:700; font-size:25px; box-shadow:0 18px 40px rgba(0,0,0,.45); z-index:41; }
    #s-resv .quote span { color:var(--orange); }
    #s-resv .quote:after { content:''; position:absolute; left:40px; bottom:-10px; border:10px solid transparent; border-bottom:0; border-top-color:var(--text); }
  </style>`);

  // whip in from the right
  tl.fromTo(scene, { x: 1350, skewX: -6 }, { x: 0, skewX: 0, duration: 0.55, ease: 'expo.out' }, T_IN);

  const hl = headline(scene, ['Every booking.', '<span class="accent">One view.</span>'], { top: 312 });
  hlIn(hl, T_IN + 0.02);
  hud.step(1, 'Reservations', T_IN);

  const panel = add(scene, `<div class="card" style="left:${PANEL.x}px;top:${PANEL.y}px;width:${PANEL.w}px;height:${PANEL.h}px"></div>`);
  const days = [['MO', 14], ['TU', 15], ['WE', 16], ['TH', 17], ['FR', 18], ['SA', 19], ['SU', 20]];
  add(panel, `<div class="today" style="left:${PAD + LEFT + 2 * COLW + 4}px;top:${PAD - 10}px;width:${COLW - 8}px;height:${TOP + 8 * ROW - PAD + 6}px"></div>`);
  days.forEach(([d, n], i) => add(panel, `<div class="hdr" style="left:${PAD + LEFT + i * COLW}px;width:${COLW}px">${d}<b>${n}</b></div>`));
  const rooms = ['301', '302', '303', '304', '305', '306', '307', '308'];
  const types = ['Deluxe', 'Deluxe', 'Twin', 'Twin', 'Deluxe', 'Suite', 'Twin', 'Deluxe'];
  rooms.forEach((r, i) => {
    add(panel, `<div class="gl" style="left:${PAD}px;width:${PANEL.w - PAD * 2}px;top:${TOP + i * ROW}px"></div>`);
    add(panel, `<div class="room" style="top:${TOP + i * ROW + 16}px">${r}<small>${types[i]}</small></div>`);
  });
  add(panel, `<div class="gl" style="left:${PAD}px;width:${PANEL.w - PAD * 2}px;top:${TOP + 8 * ROW}px"></div>`);

  const bookings = [
    [0, 0.5, 3.5, 'b-or', 'Leyla M.', '3n'],
    [1, 1.5, 5.5, 'b-lt', 'Murat Y.', '4n'],
    [2, -0.5, 1.5, 'b-gr', 'John S.', ''],
    [2, 2.5, 6.5, 'b-bl', 'Caspian Tours', 'Group'],
    [3, 2.5, 6.5, 'b-bl', 'Caspian Tours', 'Group'],
    [4, 0.5, 2.5, 'b-or', 'Anna P.', '2n'],
    [5, 1.5, 4.5, 'b-gr', 'Elvin H.', '3n'],
    [5, 5.5, 7.5, 'b-or', 'Sophie L.', ''],
    [6, -0.5, 3.5, 'b-lt', 'Ivan K.', '4n'],
    [7, 3.5, 7.5, 'b-wl', 'Waitlist', '· 2'],
  ];
  // clip bars to the grid area
  const gridClip = add(panel, `<div style="position:absolute;left:${PAD + LEFT}px;top:0;width:${7 * COLW}px;height:${PANEL.h}px;overflow:hidden"></div>`);
  const bars = bookings.map(([row, d0, d1, cls, name, sm], k) => {
    const r = barRect(row, d0, d1);
    const bar = add(gridClip, `<div class="bar ${cls}" style="left:${r.x - PANEL.x - PAD - LEFT}px;top:${r.y - PANEL.y}px;width:${r.w}px;height:${r.h}px">${name}<small>${sm}</small></div>`);
    return bar;
  });
  tl.fromTo(bars, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.55, ease: 'expo.out', stagger: 0.045 }, T_IN + 0.12);
  bars.forEach((_, k) => cue('blip', T_IN + 0.12 + k * 0.045, { v: k / bars.length }));

  add(panel, `<div class="legend"><span><i style="background:var(--orange)"></i>Confirmed</span><span><i style="background:var(--text)"></i>In-house</span>
    <span><i style="background:var(--blue)"></i>Group</span><span><i style="border:2.5px dashed rgba(255,255,255,.4)"></i>Waitlist</span></div>`);

  // --- drag a new booking into room 305 ---
  const tgt = barRect(DROP.row, DROP.d0, DROP.d1);
  const drag = add(scene, `<div class="bar b-or drag" style="width:${tgt.w}px;height:${tgt.h}px">Ayşe K.<small>3n</small></div>`);
  const cur = makeCursor(scene);
  const GRAB = b(17.25), DROP_T = b(18.6);
  const start = { x: 700, y: 1560 };
  // bar hangs from the cursor with a little lag + tilt
  gsap.set(drag, { opacity: 0 });
  tl.set(cur.el, { opacity: 1, x: start.x + 40 - 14, y: start.y + 20 - 8 }, GRAB - 0.3);
  tl.fromTo(drag, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1.06, duration: 0.3, ease: 'back.out(2)' }, GRAB - 0.3);
  const path = { x: start.x, y: start.y };
  tl.to(path, { x: tgt.x, y: tgt.y, duration: DROP_T - GRAB, ease: 'power3.inOut' }, GRAB);
  onFrame((t) => {
    if (t < GRAB - 0.3 || t > T_OUT + 0.5) return;
    const p = prog(t, GRAB, DROP_T - GRAB, 'power3.inOut');
    const x = start.x + (tgt.x - start.x) * p, y = start.y + (tgt.y - start.y) * p;
    const v = Math.sin(Math.PI * prog(t, GRAB, DROP_T - GRAB)); // velocity-ish → tilt
    const settle = t > DROP_T ? prog(t, DROP_T, 0.35, 'back.out(3)') : 0;
    drag.style.left = x + 'px'; drag.style.top = y + 'px';
    drag.style.rotate = `${(-7 * v * (1 - settle)).toFixed(2)}deg`;
    drag.style.boxShadow = t > DROP_T ? `0 ${(30 * (1 - settle)).toFixed(1)}px ${(60 * (1 - settle)).toFixed(1)}px rgba(0,0,0,.55), 0 0 0 ${(4 * (1 - settle)).toFixed(2)}px rgba(255,255,255,.9)` : '';
    cur.el.style.left = (x + 40) + 'px'; cur.el.style.top = (y + 20) + 'px';
  });
  gsap.set(cur.el, { x: -14, y: -8 });
  tl.to(drag, { scale: 1, duration: 0.35, ease: 'back.out(3)' }, DROP_T);
  tl.to(cur.el, { opacity: 0, duration: 0.25 }, DROP_T + 0.35);
  cue('grab', GRAB); cue('snap', DROP_T);

  const quote = add(scene, `<div class="quote" style="left:${tgt.x - 10}px;top:${tgt.y - 86}px">Auto rate quote · <span>$372</span></div>`);
  tl.fromTo(quote, { scale: 0.3, opacity: 0, y: 20, transformOrigin: '40px 100%' }, { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'back.out(2.4)' }, DROP_T + 0.12);
  cue('pop', DROP_T + 0.12);

  // exit: headline out, chart recedes while the booking morphs into the check-in card
  hlOut(hl, T_OUT - 0.4);
  tl.to([panel, quote], { opacity: 0, scale: 0.94, duration: 0.35, ease: 'power2.in' }, T_OUT - 0.33);
  tl.to(drag, { opacity: 0, duration: 0.01 }, T_OUT - 0.3);
}
