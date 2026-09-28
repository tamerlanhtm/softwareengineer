// 24.84 – 30s  CTA — the cube's face hands over to the flat logo; tagline lands,
// "Now." slams in, then the contact block. Holds long enough to read the URL.
import { tl, b, add, gsap, cue, headline, hlIn, windowed, icon, onFrame, prog, rng, shake, makeCursor, moveTo, click, splitChars, contentWidth } from '../lib.js';
import { makeLogo } from '../logo-mark.js';
import { T_LOGO, LOGO } from './modules.js';
import { T } from '../i18n.js';

export const T_END = 30;

export function build({ world }) {
  const scene = add(world, `<div class="scene" id="s-cta"><div class="dots"></div></div>`);
  windowed(scene, T_LOGO - 0.05, T_END + 1);

  add(document.head, `<style>
    #s-cta .tag { position:absolute; left:0; width:1080px; top:760px; text-align:center; font-family:var(--display); font-weight:750; font-size:84px;
      line-height:1.04; letter-spacing:-0.04em; }
    #s-cta .now { position:absolute; left:0; width:1080px; top:958px; text-align:center; font-family:var(--display); font-weight:800; font-size:196px;
      letter-spacing:-0.06em; line-height:1; color:var(--orange); }
    #s-cta .btn { position:absolute; left:${540 - 300}px; top:1228px; width:600px; height:118px; border-radius:59px; background:var(--orange); overflow:hidden;
      display:flex; align-items:center; justify-content:center; gap:18px; font-family:var(--display); font-weight:700; font-size:42px; color:#fff; letter-spacing:-0.02em;
      box-shadow:0 24px 60px rgba(255,77,31,.45); }
    #s-cta .btn .shine { position:absolute; top:-20px; bottom:-20px; width:140px; left:-200px; background:linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent); transform:skewX(-18deg); }
    #s-cta .url { position:absolute; left:0; width:1080px; top:1384px; text-align:center; font-family:var(--display); font-weight:600; font-size:54px; letter-spacing:-0.02em; }
    #s-cta .url b { color:var(--orange); font-weight:600; }
    #s-cta .ig { position:absolute; left:0; width:1080px; top:1466px; display:flex; justify-content:center; align-items:center; gap:12px;
      font-family:var(--mono); font-weight:500; font-size:34px; color:var(--muted); letter-spacing:.04em; }
    #s-cta .ig .ico { color:var(--orange); }
    #s-cta .fl { position:absolute; left:0; top:0; border-radius:22%; background:var(--orange); }
    #s-cta .lm-sq { overflow:hidden; }
  </style>`);

  // ambient floating squares
  const R = rng(64);
  const floaters = Array.from({ length: 22 }, () => {
    const s = 10 + R() * 34;
    return { el: add(scene, `<div class="fl" style="width:${s}px;height:${s}px"></div>`), x: R() * 1080, y: 200 + R() * 1700, sp: 30 + R() * 70,
      ph: R() * 6.28, rot: (R() - 0.5) * 80, a: 0.06 + R() * 0.16 };
  });
  onFrame((t) => {
    if (t < T_LOGO - 0.05) return;
    const k = prog(t, T_LOGO + 0.3, 1.2);
    for (const f of floaters) {
      const dt = t - T_LOGO;
      f.el.style.transform = `translate(${(f.x + 20 * Math.sin(dt * 0.9 + f.ph)).toFixed(1)}px,${(f.y - f.sp * dt).toFixed(1)}px) rotate(${(f.rot * dt).toFixed(1)}deg)`;
      f.el.style.opacity = (k * f.a).toFixed(3);
    }
  });

  // logo — identical geometry to the cube's final front face
  const L = makeLogo(scene, { cx: LOGO.cx, cy: LOGO.cy, size: LOGO.size });
  // light sweep across the filled squares (band continuous across the mark)
  L.squares.slice(0, 8).forEach((sq) => {
    sq.style.backgroundImage = 'linear-gradient(105deg, transparent 44%, rgba(255,255,255,.6) 50%, transparent 56%)';
    sq.style.backgroundSize = '1080px 1920px';
    sq.style.backgroundRepeat = 'no-repeat';
  });
  const sqPos = L.squares.map((sq) => [parseFloat(sq.style.left) + LOGO.cx - LOGO.size / 2, parseFloat(sq.style.top) + LOGO.cy - LOGO.size / 2]);
  // later sweeps are registered later, so they win while active; clamped p keeps state exact when seeking
  const sweep = (t0) => onFrame((t) => {
    if (t < t0 - 0.05) return;
    const p = prog(t, t0, 0.7, 'power2.inOut');
    const off = -1100 + p * 1500;
    L.squares.slice(0, 8).forEach((sq, i) => { sq.style.backgroundPosition = `${(off - sqPos[i][0]).toFixed(1)}px ${(-sqPos[i][1]).toFixed(1)}px`; });
  });
  sweep(T_LOGO + 0.15);
  sweep(b(61));
  // after the landing the mark stays alive: a slow diagonal wave through the squares
  onFrame((t) => {
    const k = prog(t, T_LOGO + 1.0, 1.2);
    L.squares.forEach((sq, i) => {
      const c = i % 3, r = Math.floor(i / 3);
      sq.style.translate = k ? `0 ${(-6 * k * Math.max(0, Math.sin((t - T_LOGO) * 3.2 - (c + r) * 0.75))).toFixed(2)}px` : '';
    });
  });
  // soft glow behind the mark that pumps with the kick from the "Now." drop
  const pulse = add(scene, `<div style="position:absolute;left:${LOGO.cx - 420}px;top:${LOGO.cy - 420}px;width:840px;height:840px;border-radius:50%;
    background:radial-gradient(closest-side, rgba(255,77,31,.30), rgba(255,77,31,.07) 60%, transparent 100%)"></div>`);
  scene.insertBefore(pulse, L.el);
  onFrame((t) => {
    const beat = t / (60 / 128);
    const since = (beat - Math.floor(beat)) * (60 / 128);
    const kickOn = t >= b(56) && t < b(62);
    const base = prog(t, T_LOGO, 0.6);
    pulse.style.opacity = (base * (0.55 + (kickOn ? 0.45 * Math.exp(-since * 9) : 0.1))).toFixed(3);
  });
  cue('logo_land', T_LOGO);

  // tagline
  const tag = add(scene, `<div class="tag">${T.cta.tag.map((l) => `<span class="ln"><span class="ln-in">${l}</span></span>`).join('')}</div>`);
  // shrink the tagline if a translation runs wide
  const tagW = Math.max(...[...tag.querySelectorAll('.ln-in')].map(contentWidth));
  if (tagW > 960) tag.style.fontSize = Math.floor((84 * 960) / tagW) + 'px';
  const tagChars = [...tag.querySelectorAll('.ln-in')].map((e) => splitChars(e));
  tagChars.forEach((cs, i) => tl.fromTo(cs, { yPercent: 118, rotate: 7 }, { yPercent: 0, rotate: 0, duration: 0.75, ease: 'expo.out', stagger: 0.018 }, b(53.4) + i * 0.1));
  cue('whoosh_s', b(53.3));

  // "Now." slam
  const now = add(scene, `<div class="now" style="margin-top:${T.cta.nowDy}px">${T.cta.now}</div>`);
  const NOW = b(56);
  tl.fromTo(now, { scale: 3.2, opacity: 0, filter: 'blur(18px)' }, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.26, ease: 'power4.in' }, NOW - 0.26);
  tl.fromTo('#flash', { opacity: 0.32 }, { opacity: 0, duration: 0.35, ease: 'power2.out', immediateRender: false }, NOW);
  shake(NOW, 0.4, 16);
  cue('impact2', NOW);
  tl.fromTo([tag, L.el], { y: 0 }, { y: -8, duration: 0.08, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, NOW);

  // contact block
  const CT = b(57);
  const btn = add(scene, `<div class="btn"><div class="shine"></div>${T.cta.btn} ${icon('arrow-right', { size: 44, sw: 2.8, color: '#fff' })}</div>`);
  // button grows with its label (stays centred)
  const bw = Math.max(600, Math.min(960, contentWidth(btn) + 130));
  Object.assign(btn.style, { width: bw + 'px', left: 540 - bw / 2 + 'px' });
  const url = add(scene, `<div class="url">www.<b>ineed.now</b></div>`);
  const ig = add(scene, `<div class="ig">${icon('at-sign', { size: 36, sw: 2.4 })}<span>ineednow_</span></div>`);
  tl.fromTo(btn, { y: 80, opacity: 0, scale: 0.85 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.8)' }, CT);
  tl.fromTo([url, ig], { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'expo.out', stagger: 0.09 }, CT + 0.12);
  cue('pop_big', CT); cue('pop', CT + 0.12); cue('pop', CT + 0.21);

  // cursor taps the button — then a shine runs across it every bar
  const cur = makeCursor(scene);
  const bx = 540 + 150, by = 1228 + 76;
  tl.set(cur.el, { opacity: 1, x: 1000, y: 1800 }, b(58.2));
  moveTo(cur, b(58.2), bx, by, 0.6, 'power3.out');
  click(cur, b(59.5), bx, by, { color: '#ffffff' });
  tl.to(btn, { scale: 0.95, duration: 0.08 }, b(59.5) - 0.06).to(btn, { scale: 1, duration: 0.45, ease: 'back.out(3)' }, b(59.5) + 0.02);
  tl.to(cur.el, { x: '+=180', y: '+=220', opacity: 0, duration: 0.6, ease: 'power2.in' }, b(59.5) + 0.35);
  [b(58.5), b(62)].forEach((t) => tl.fromTo(btn.querySelector('.shine'), { x: 0 }, { x: 1000, duration: 0.7, ease: 'power2.inOut', immediateRender: false }, t));
}
