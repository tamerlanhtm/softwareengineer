// 3.75 – 5.625s  DROP: the core explodes into the 3x3 mark, wordmark lands,
// then the camera dives through the hollow square into the product.
import { tl, b, add, gsap, onFrame, cue, rng, prog, splitChars, windowed, shake, $, E } from '../lib.js';
import { makeLogo } from '../logo-mark.js';

export const PORTAL_T0 = b(10.75);
export const PORTAL_T1 = b(12);
export let portalProbe = null;

export function build({ world }) {
  const T0 = b(8);
  const scene = add(world, `<div class="scene" id="s-logo"></div>`);
  windowed(scene, T0 - 0.001, PORTAL_T1 + 0.02);

  add(document.head, `<style>
    #s-logo .group { position:absolute; left:0; top:0; width:1080px; height:1920px; }
    #s-logo .wordmark { position:absolute; left:0; top:1085px; width:1080px; text-align:center;
      font-family:var(--display); font-weight:800; font-size:134px; letter-spacing:-0.045em; line-height:1; }
    #s-logo .wordmark .ln { padding-bottom:.12em; }
    #s-logo .wordmark .accent { color:var(--orange); }
    #s-logo .byline { position:absolute; left:0; top:1262px; width:1080px; text-align:center;
      font-family:var(--mono); font-weight:500; font-size:36px; letter-spacing:.06em; color:var(--muted); }
    #s-logo .byline b { color:var(--text); font-weight:700; }
    #s-logo .caret { display:inline-block; width:.55em; height:.9em; margin-left:6px; vertical-align:-0.1em; background:var(--orange); border-radius:3px; }
    #s-logo .ring { position:absolute; left:440px; top:700px; width:200px; height:200px; border-radius:18.75%;
      border:9px solid var(--orange); }
    #s-logo .p { position:absolute; left:540px; top:800px; border-radius:22%; }
  </style>`);

  const dots = add(scene, `<div class="dots"></div>`);
  const group = add(scene, `<div class="group"></div>`);
  const L = makeLogo(group, { cx: 540, cy: 800, size: 440 });
  portalProbe = L.probe;

  // --- burst ---
  const R = rng(8);
  L.squares.forEach((sq, k) => {
    const i = k % 3, j = Math.floor(k / 3);
    const [x, y] = L.center(i, j);
    tl.fromTo(sq, { x: 540 - x, y: 800 - y, scale: 0.12, rotation: (R() - 0.5) * 300 },
      { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.75, ease: 'back.out(1.35)' }, T0 + k * 0.012);
  });
  // hollow square arrives solid, then the hole punches out
  tl.fromTo(L.hole, { scale: 0 }, { scale: 1, duration: 0.42, ease: 'back.out(3)' }, b(8.75));
  cue('impact', T0);
  cue('punch', b(8.75));

  // shockwave rings
  [0, 0.07].forEach((d, k) => {
    const ring = add(scene, `<div class="ring"></div>`);
    tl.fromTo(ring, { scale: 0.25, opacity: k ? 0.5 : 1, rotation: 0 }, { scale: 5.5 + k * 2, opacity: 0, rotation: 45, duration: 0.9, ease: 'expo.out' }, T0 + d);
  });
  // square particles
  const parts = Array.from({ length: 44 }, () => {
    const sz = 7 + R() * 16;
    const col = R() < 0.7 ? '#ff4d1f' : (R() < 0.5 ? '#ff9a6b' : '#f6f3ef');
    return {
      el: add(scene, `<div class="p" style="width:${sz}px;height:${sz}px;margin:${-sz / 2}px;background:${col}"></div>`),
      a: R() * Math.PI * 2, v: 900 + R() * 1700, spin: (R() - 0.5) * 900, life: 0.55 + R() * 0.6,
    };
  });
  onFrame((t) => {
    const dt = t - T0;
    for (const p of parts) {
      if (dt < 0 || dt > p.life) { p.el.style.opacity = 0; continue; }
      const k = 4.2, d = (p.v / k) * (1 - Math.exp(-k * dt));
      p.el.style.opacity = (1 - dt / p.life).toFixed(3);
      p.el.style.transform = `translate(${(Math.cos(p.a) * d).toFixed(1)}px,${(Math.sin(p.a) * d + 260 * dt * dt).toFixed(1)}px) rotate(${(p.spin * dt).toFixed(1)}deg) scale(${(1 - 0.6 * dt / p.life).toFixed(3)})`;
    }
  });
  tl.fromTo('#flash', { opacity: 0.55 }, { opacity: 0, duration: 0.4, ease: 'power2.out', immediateRender: false }, T0);
  tl.fromTo('#bg-glow', { opacity: 1 }, { opacity: 0.45, duration: 1.2, ease: 'power2.out', immediateRender: false }, T0);
  shake(T0, 0.5, 20);

  // --- wordmark ---
  const wm = add(group, `<div class="wordmark"><span class="ln"><span class="ln-in">PMS<span class="accent">Now</span></span></span></div>`);
  const wmChars = splitChars(wm.querySelector('.ln-in'));
  tl.fromTo(wmChars, { yPercent: 120, rotate: 8 }, { yPercent: 0, rotate: 0, duration: 0.7, ease: 'expo.out', stagger: 0.035 }, b(8.9));
  cue('whoosh_s', b(8.8));
  const by = add(group, `<div class="byline"><span class="t"></span><span class="caret"></span></div>`);
  const byT = by.querySelector('.t');
  const byText = 'by ineed.now';
  onFrame((t) => {
    const n = Math.round(prog(t, b(9.6), 0.42) * byText.length);
    const s = n > 3 ? `by <b>${byText.slice(3, n)}</b>` : byText.slice(0, n);
    if (byT.__s !== s) { byT.innerHTML = s; byT.__s = s; }
  });
  const caret = by.querySelector('.caret');
  onFrame((t) => { caret.style.opacity = t < b(9.5) ? 0 : (Math.floor((t - b(9.5)) * 5) % 2 === 0 ? 1 : 0.15); });
  for (let k = 0; k < 12; k++) cue('type', b(9.6) + (k * 0.42) / 12);

  // --- portal: dive through the hollow square ---
  const [hx, hy] = L.center(2, 2);
  gsap.set(group, { transformOrigin: `${hx}px ${hy}px` });
  const ZMAX = 48;
  onFrame((t) => {
    if (t < PORTAL_T0 - 0.3) { group.style.transform = ''; return; }
    // tiny anticipation pull-back, then an exponential dive
    const pre = prog(t, PORTAL_T0 - 0.3, 0.3, 'sine.inOut');
    const z = prog(t, PORTAL_T0, PORTAL_T1 - PORTAL_T0, 'power3.in');
    const s = (1 - 0.05 * pre * (1 - z)) * Math.exp(z * Math.log(ZMAX));
    const mx = (540 - hx) * E('power2.inOut')(z), my = (960 - hy) * E('power2.inOut')(z);
    group.style.transform = `translate(${mx.toFixed(2)}px,${my.toFixed(2)}px) scale(${s.toFixed(4)})`;
  });
  cue('zoom', PORTAL_T0);
  gsap.set(dots, { transformOrigin: `${hx + 540}px ${hy + 960}px` });
  tl.to(dots, { scale: 2.6, opacity: 0, duration: PORTAL_T1 - PORTAL_T0 + 0.1, ease: 'power3.in' }, PORTAL_T0 - 0.1);
}
