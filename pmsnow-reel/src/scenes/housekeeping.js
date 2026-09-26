// 11.25 – 13.125s  04 HOUSEKEEPING — zoom out of room 305 onto the live room
// board; a wave of flips turns dirty rooms clean. Exit: tiles flood orange.
import { tl, b, add, gsap, cue, headline, hlIn, hlOut, windowed, icon, onFrame, prog, $ } from '../lib.js';

export const T_IN = b(24), T_OUT = b(28);
const G = { x: 60, y: 650, tile: 176, gap: 20 };

const ST = {
  occ: ['#1b1b22', 'var(--text)', 'bed-double', 'Occupied', 'rgba(255,255,255,.4)'],
  dirty: ['#ff4d1f', '#fff', 'spray-can', 'Dirty', '#fff'],
  clean: ['#3ddc97', '#062b1c', 'check', 'Clean', '#062b1c'],
  insp: ['#f6f3ef', '#0b0b0f', 'check-check', 'Inspected', '#0b0b0f'],
  cleaning: ['transparent', '#ff7a45', 'brush-cleaning', 'Cleaning', '#ff7a45'],
  inhouse: ['#1b1b22', 'var(--text)', 'user', 'Checked in', '#3ddc97'],
};

export function build({ world, hud }) {
  const scene = add(world, `<div class="scene" id="s-hk"><div class="dots"></div></div>`);
  windowed(scene, T_IN - 0.05, T_OUT + 0.05);

  add(document.head, `<style>
    #s-hk .grid { position:absolute; left:0; top:0; width:1080px; height:1920px; perspective:1400px; }
    #s-hk .t { position:absolute; width:${G.tile}px; height:${G.tile}px; transform-style:preserve-3d; }
    #s-hk .f { position:absolute; inset:0; border-radius:33px; backface-visibility:hidden; -webkit-backface-visibility:hidden; overflow:hidden; }
    #s-hk .f .no { position:absolute; left:20px; top:16px; font-family:var(--display); font-weight:700; font-size:38px; letter-spacing:-0.03em; }
    #s-hk .f .st { position:absolute; left:20px; bottom:18px; display:flex; align-items:center; gap:8px; font-weight:700; font-size:19px; }
    #s-hk .f.occ, #s-hk .f.inhouse { border:1.5px solid var(--line); }
    #s-hk .f.cleaning { border:11px solid #ff4d1f; }
    #s-hk .f.cleaning .no { left:12px; top:6px; } #s-hk .f.cleaning .st { left:12px; bottom:8px; }
    #s-hk .back { transform:rotateY(180deg); }
    #s-hk .who { position:absolute; right:14px; top:14px; width:44px; height:44px; border-radius:50%; background:#fff; color:#0b0b0f;
      font-weight:800; font-size:17px; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 14px rgba(0,0,0,.35); transform:translateZ(1px); }
    #s-hk .cover { position:absolute; width:${G.tile + 2}px; height:${G.tile + 2}px; margin:-1px; border-radius:33px; background:#ff4d1f; transform:scale(0); }
    #s-hk .bar { position:absolute; left:${G.x}px; top:568px; width:960px; height:56px; display:flex; align-items:center; gap:12px; }
    #s-hk .bar .pill { height:52px; font-size:23px; }
    #s-hk .bar .pill.on { background:var(--orange); color:#fff; border-color:var(--orange); }
    #s-hk .ready { margin-left:auto; font-weight:700; font-size:26px; color:var(--muted); display:flex; align-items:center; gap:14px; }
    #s-hk .ready b { font-family:var(--display); font-size:36px; color:var(--green); letter-spacing:-0.02em; }
    #s-hk .prog { position:absolute; left:${G.x}px; top:${G.y + 4 * G.tile + 3 * G.gap + 28}px; width:960px; height:12px; border-radius:6px; background:rgba(255,255,255,.08); overflow:hidden; }
    #s-hk .prog i { position:absolute; left:0; top:0; bottom:0; width:100%; background:var(--green); border-radius:6px; transform-origin:0 50%; }
  </style>`);

  const hl = headline(scene, ['Rooms ready.', '<span class="accent">In real time.</span>'], { top: 312 });
  hlIn(hl, T_IN + 0.08);
  hud.step(3, 'Housekeeping', T_IN);

  const bar = add(scene, `<div class="bar"><div class="pill on">All floors</div><div class="pill">F2</div><div class="pill">F3</div><div class="pill">F4</div><div class="pill">F5</div>
    <div class="ready">Ready <b class="cnt">4</b><span>/ 20</span></div></div>`);
  const cnt = bar.querySelector('.cnt');
  const progEl = add(scene, `<div class="prog"><i></i></div>`);

  const grid = add(scene, `<div class="grid"></div>`);
  // [initial, final, flip beat offset or null, staff]
  const plan = {
    201: ['occ'], 202: ['dirty', 'clean', 0, 'NR'], 203: ['dirty', 'clean', 1], 204: ['clean', 'insp', 3.5], 205: ['occ'],
    301: ['occ'], 302: ['inhouse'], 303: ['dirty', 'clean', 1.5, 'EM'], 304: ['cleaning', 'clean', 2], 305: ['inhouse'],
    401: ['dirty', 'insp', 2, 'AK'], 402: ['dirty', 'clean', 2.5], 403: ['occ'], 404: ['dirty', 'clean', 3], 405: ['cleaning', 'clean', 3.5],
    501: ['clean', 'insp', 4], 502: ['dirty', 'clean', 3.5], 503: ['occ'], 504: ['dirty', 'clean', 4], 505: ['dirty', 'clean', 4.5],
  };
  const face = (cls, no, back = false) => {
    const [bg, fg, ic, label, icc] = ST[cls];
    return `<div class="f ${cls}${back ? ' back' : ''}" style="background:${bg};color:${fg}"><div class="no">${no}</div>
      <div class="st">${icon(ic, { size: 24, sw: 2.6, color: icc })}<span>${label}</span></div></div>`;
  };
  const tiles = [];
  let ready = 0;
  Object.entries(plan).forEach(([no, [a, z, beat, who]], k) => {
    const i = k % 5, j = Math.floor(k / 5);
    const x = G.x + i * (G.tile + G.gap), y = G.y + j * (G.tile + G.gap);
    const t = add(grid, `<div class="t" style="left:${x}px;top:${y}px">${face(a, no)}${z ? face(z, no, true) : ''}</div>`);
    if (who) t.insertAdjacentHTML('beforeend', `<div class="who">${who}</div>`);
    tiles.push({ el: t, x: x + G.tile / 2, y: y + G.tile / 2, no, a, z, beat, who });
    if (a === 'clean' || a === 'insp') ready++;
  });

  // zoom out of room 305 (continuing the dive from the check-in card)
  const t305 = tiles.find((t) => t.no === '305');
  gsap.set(grid, { transformOrigin: `${t305.x}px ${t305.y}px` });
  tl.fromTo(grid, { scale: 5.5, x: 284 - t305.x, y: 965 - t305.y }, { scale: 1, x: 0, y: 0, duration: 0.85, ease: 'expo.out' }, T_IN - 0.06);
  tiles.forEach((t) => {
    const d = Math.hypot(t.x - t305.x, t.y - t305.y);
    tl.fromTo(t.el, { opacity: t === t305 ? 1 : 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' }, T_IN + d / 3000);
  });
  tl.fromTo([bar, progEl], { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', stagger: 0.06 }, T_IN + 0.2);

  const FLIP0 = b(24.55), FLIPK = 0.16;
  // staff hop onto their rooms
  tiles.filter((t) => t.who).forEach((t, k) => {
    const w = t.el.querySelector('.who');
    tl.fromTo(w, { scale: 0, y: -40 }, { scale: 1, y: 0, duration: 0.26, ease: 'back.out(3)' }, b(24.05) + k * 0.07);
    cue('pop', b(24.05) + k * 0.07, { v: 0.6 + k * 0.1 });
    tl.to(w, { scale: 0, duration: 0.18, ease: 'power2.in' }, FLIP0 + t.beat * FLIPK - 0.12);
  });

  // flip wave
  const readyAt = [];
  tiles.filter((t) => t.z).forEach((t) => {
    const tf = FLIP0 + t.beat * FLIPK;
    tl.to(t.el, { rotationY: 180, duration: 0.55, ease: 'back.out(1.6)' }, tf);
    tl.fromTo(t.el, { z: 0 }, { z: 60, duration: 0.2, yoyo: true, repeat: 1, ease: 'sine.inOut', immediateRender: false }, tf);
    cue('flip', tf, { v: t.beat / 5 });
    if (!(t.a === 'clean' || t.a === 'insp')) readyAt.push(tf + 0.2);
  });
  onFrame((t) => {
    const n = ready + readyAt.filter((x) => t >= x).length;
    const s = String(n);
    if (cnt.__s !== s) { cnt.textContent = s; cnt.__s = s; }
  });
  const pbar = progEl.querySelector('i');
  onFrame((t) => {
    const n = ready + readyAt.filter((x) => t >= x).length;
    pbar.style.transform = `scaleX(${(n / 20).toFixed(3)})`;
  });

  // exit: orange flood from the centre, then the camera pushes through
  hlOut(hl, T_OUT - 0.45);
  tl.to([bar, progEl], { opacity: 0, duration: 0.2 }, T_OUT - 0.45);
  const cx = 540, cy = G.y + (4 * G.tile + 3 * G.gap) / 2;
  const covers = add(scene, `<div class="layer"></div>`);
  tiles.forEach((t) => {
    const d = Math.hypot(t.x - cx, t.y - cy);
    const c = add(covers, `<div class="cover" style="left:${t.x - G.tile / 2}px;top:${t.y - G.tile / 2}px"></div>`);
    tl.to(c, { scale: 1.13, duration: 0.3, ease: 'expo.out' }, T_OUT - 0.42 + d / 2600);
  });
  gsap.set(scene, { transformOrigin: `${cx}px ${cy}px` });
  tl.to(scene, { scale: 4.2, duration: 0.4, ease: 'power3.in' }, T_OUT - 0.3);
  tl.to('#bg-color', { backgroundColor: '#ff4d1f', duration: 0.12 }, T_OUT - 0.12);
  cue('flood', T_OUT - 0.42);
}
