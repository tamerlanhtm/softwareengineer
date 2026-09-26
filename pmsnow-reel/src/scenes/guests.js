// 16.875 – 18.75s  07 GUEST CRM & FEEDBACK — the audit ring lands as the guest's
// avatar; profile, tags, stay count; 5 stars from an in-room QR card.
import { tl, b, add, gsap, cue, headline, hlIn, hlOut, windowed, icon, onFrame, prog, rng, typewriter } from '../lib.js';
import { AVATAR } from './audit.js';

export const T_IN = b(36), T_OUT = b(40);
const P = { x: 60, y: 590, w: 960, h: 500 };
const F = { x: 60, y: 1122, w: 960, h: 330 };

export function build({ world, hud }) {
  const scene = add(world, `<div class="scene" id="s-guest"><div class="dots"></div></div>`);
  windowed(scene, T_IN - 0.2, T_OUT + 0.2);

  add(document.head, `<style>
    #s-guest .av { position:absolute; left:${AVATAR.x - P.x - AVATAR.r}px; top:${AVATAR.y - P.y - AVATAR.r}px; width:${AVATAR.r * 2}px; height:${AVATAR.r * 2}px; border-radius:50%;
      background:var(--orange); display:flex; align-items:center; justify-content:center; font-family:var(--display); font-weight:700; font-size:52px; color:#fff; }
    #s-guest .nm { position:absolute; left:234px; top:60px; font-weight:750; font-size:48px; letter-spacing:-0.01em; }
    #s-guest .sb { position:absolute; left:234px; top:122px; font-weight:500; font-size:26px; color:var(--muted); }
    #s-guest .vip { position:absolute; right:40px; top:58px; height:60px; font-size:27px; font-weight:800; padding:0 24px; }
    #s-guest .tags { position:absolute; left:44px; top:236px; display:flex; gap:12px; }
    #s-guest .note { position:absolute; left:44px; top:318px; display:flex; align-items:center; gap:14px; font-weight:500; font-size:27px; color:#cfcbd3; }
    #s-guest .note .ico { color:var(--orange); }
    #s-guest .stats { position:absolute; left:44px; right:44px; top:388px; display:flex; }
    #s-guest .stat { flex:1; }
    #s-guest .stat .l { font-weight:600; font-size:22px; color:var(--muted); }
    #s-guest .stat .v { font-family:var(--display); font-weight:700; font-size:50px; letter-spacing:-0.03em; margin-top:2px; }
    #s-guest .ft { position:absolute; left:40px; top:34px; font-weight:700; font-size:30px; }
    #s-guest .fs { position:absolute; left:40px; top:78px; font-weight:500; font-size:23px; color:var(--muted); }
    #s-guest .stars { position:absolute; left:34px; top:140px; display:flex; gap:10px; }
    #s-guest .stars .s { width:66px; height:66px; color:rgba(255,255,255,.12); }
    #s-guest .stars .s svg { fill:currentColor; stroke:none; }
    #s-guest .rate { position:absolute; left:436px; top:136px; font-family:var(--display); font-weight:800; font-size:76px; letter-spacing:-0.04em; }
    #s-guest .rate small { font-size:.4em; color:var(--muted); letter-spacing:0; margin-left:6px; }
    #s-guest .alert { position:absolute; left:40px; top:240px; height:50px; font-size:22px; }
    #s-guest .qr { position:absolute; right:40px; top:40px; width:210px; height:210px; border-radius:26px; background:#f6f3ef; padding:17px; }
    #s-guest .qr i { position:absolute; background:#0b0b0f; border-radius:1.5px; }
    #s-guest .qrl { position:absolute; right:40px; top:266px; width:210px; text-align:center; font-family:var(--mono); font-size:19px; color:var(--muted); letter-spacing:.08em; }
  </style>`);

  const hl = headline(scene, ['Know every', '<span class="accent">guest.</span>'], { top: 312 });
  hlIn(hl, T_IN + 0.02);
  hud.step(6, 'Guest CRM', T_IN);

  const prof = add(scene, `<div class="card" style="left:${P.x}px;top:${P.y}px;width:${P.w}px;height:${P.h}px"></div>`);
  const av = add(prof, `<div class="av"><span>MY</span></div>`);
  const nm = add(prof, `<div class="nm">Murat Yılmaz</div>`);
  const sb = add(prof, `<div class="sb">Corporate · Istanbul</div>`);
  const vip = add(prof, `<div class="pill gold vip">${icon('crown', { size: 30, sw: 2.4 })}VIP</div>`);
  const tags = add(prof, `<div class="tags"><div class="pill orange">${icon('heart', { size: 22, sw: 2.6 })}Loyalty · Gold</div>
    <div class="pill blue">${icon('clock', { size: 22, sw: 2.6 })}Late check-out</div><div class="pill">${icon('building-2', { size: 22, sw: 2.4 })}High floor</div></div>`);
  const note = add(prof, `<div class="note">${icon('message-circle', { size: 30, sw: 2.3 })}<span class="tx"></span></div>`);
  typewriter(note.querySelector('.tx'), 'Prefers a quiet room · extra pillows', T_IN + 0.45, 0.55);
  const stats = add(prof, `<div class="stats"><div class="stat"><div class="l">Stays</div><div class="v s1">0</div></div>
    <div class="stat"><div class="l">Nights</div><div class="v s2">0</div></div><div class="stat"><div class="l">Lifetime value</div><div class="v s3">$0</div></div></div>`);
  const s1 = stats.querySelector('.s1'), s2 = stats.querySelector('.s2'), s3 = stats.querySelector('.s3');
  onFrame((t) => {
    const p = prog(t, T_IN + 0.3, 0.9, 'expo.out');
    const a = String(Math.round(7 * p)), c = String(Math.round(23 * p)), d = '$' + (4.2 * p).toFixed(1) + 'K';
    if (s1.__s !== a) { s1.textContent = a; s1.__s = a; }
    if (s2.__s !== c) { s2.textContent = c; s2.__s = c; }
    if (s3.__s !== d) { s3.textContent = d; s3.__s = d; }
  });

  // the incoming disc lands here: card materialises around it
  tl.fromTo(prof, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out' }, T_IN - 0.05);
  tl.fromTo(av.querySelector('span'), { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, T_IN + 0.05);
  tl.fromTo([nm, sb], { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.06 }, T_IN + 0.05);
  tl.fromTo(vip, { scale: 0, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(3)' }, T_IN + 0.3);
  cue('sparkle', T_IN + 0.3);
  tl.fromTo(tags.children, { y: 20, opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)', stagger: 0.07 }, T_IN + 0.2);
  tl.fromTo([note, stats], { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'expo.out', stagger: 0.06 }, T_IN + 0.3);

  // feedback card
  const fb = add(scene, `<div class="card" style="left:${F.x}px;top:${F.y}px;width:${F.w}px;height:${F.h}px">
    <div class="ft">Guest feedback</div><div class="fs">From the in-room QR card</div>
    <div class="stars">${'<div class="s">' + icon('star', { size: 66, sw: 0 }) + '</div>'.repeat(1)}</div>
    <div class="rate"><span class="rv">0.0</span><small>/ 5</small></div>
    <div class="pill green alert">${icon('bell', { size: 22, sw: 2.6 })}Low-score alerts on</div>
    <div class="qr"></div><div class="qrl">SCAN · RATE · SHARE</div></div>`);
  const starsEl = fb.querySelector('.stars');
  starsEl.innerHTML = Array.from({ length: 5 }, () => `<div class="s">${icon('star', { size: 66, sw: 0 })}</div>`).join('');
  tl.fromTo(fb, { y: 200, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out' }, T_IN + 0.1);
  [...starsEl.children].forEach((s, k) => {
    const ts = T_IN + 0.55 + k * 0.1;
    tl.to(s, { color: '#ffc24b', duration: 0.05 }, ts)
      .fromTo(s, { scale: 0.4, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(3.5)', immediateRender: false }, ts);
    cue('star', ts, { k });
  });
  const rv = fb.querySelector('.rv');
  onFrame((t) => {
    const s = (4.9 * prog(t, T_IN + 0.55, 0.6, 'power2.out')).toFixed(1);
    if (rv.__s !== s) { rv.textContent = s; rv.__s = s; }
  });
  tl.fromTo(fb.querySelector('.alert'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.5)' }, T_IN + 1.1);

  // QR code: 21x21 modules appear in a sweep (finder patterns first)
  const qr = fb.querySelector('.qr');
  const N = 21, M = 176 / N, R = rng(4821);
  const isFinder = (x, y) => [[0, 0], [N - 7, 0], [0, N - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  const finderOn = (x, y) => { const fx = x < 7 ? 0 : N - 7, fy = y < 7 ? 0 : N - 7; const u = x - fx, v = y - fy; return u === 0 || v === 0 || u === 6 || v === 6 || (u >= 2 && u <= 4 && v >= 2 && v <= 4); };
  const mods = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const f = isFinder(x, y);
    const on = f ? finderOn(x, y) : R() < 0.48;
    if (!on) continue;
    const m = add(qr, `<i style="left:${17 + x * M}px;top:${17 + y * M}px;width:${M + 0.6}px;height:${M + 0.6}px"></i>`);
    mods.push({ m, d: f ? 0 : 0.05 + (x + y) / (2 * N) * 0.45 + R() * 0.08 });
  }
  const Q0 = T_IN + 0.35;
  mods.forEach(({ m, d }) => tl.fromTo(m, { scale: 0 }, { scale: 1, duration: 0.2, ease: 'back.out(2)' }, Q0 + d));
  cue('shimmer', Q0);

  // exit: everything drops away
  hlOut(hl, T_OUT - 0.42);
  tl.to(prof, { y: 1500, rotation: -9, duration: 0.55, ease: 'power3.in' }, T_OUT - 0.42);
  tl.to(fb, { y: 1300, rotation: 7, duration: 0.5, ease: 'power3.in' }, T_OUT - 0.4);
  cue('whoosh', T_OUT - 0.3);
}
