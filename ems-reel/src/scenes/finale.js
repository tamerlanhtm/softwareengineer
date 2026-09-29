import { el, svg, tl, scene, textLine, riseIn, riseOut, enter, split, fit, cue, shake, proc, burst, fast, flash, icon, rrect, rng, clamp, C } from '../lib.js';
import { T } from '../timing.js';

// 25–30s · "Everything your school needs." — "need" stays on screen and
// becomes ineed.now — then the end card: logo, EMSNow, Book a demo,
// www.ineed.now, @ineednow_.
export function buildFinale({ world, fx }) {
  const s = scene(world, 's-fin', T.fin - 0.02, null);
  const back = el('div', { cls: 'layer' }, s);
  const mid = el('div', { cls: 'layer' }, s);
  const top = el('div', { cls: 'layer' }, s);

  // warm pool of light behind the end card
  const pool = el('div', { cls: 'abs', css: 'left:-160px;top:260px;width:1400px;height:1400px;border-radius:50%;background:radial-gradient(circle,rgba(254,77,30,.30),rgba(254,77,30,.08) 42%,rgba(254,77,30,0) 68%);' }, back);
  enter(pool, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 1.2, ease: 'expo.out' }, T.fin);

  // ---------------------------------------------------------- statement
  const SZ = 150;
  const l1 = textLine(mid, 'Everything', { y: 740, size: SZ });
  const l2 = textLine(mid, 'your school', { y: 890, size: SZ });
  const l3 = textLine(mid, 'needs.', { y: 1040, size: SZ, color: C.orange });
  const sz = Math.min(fit(l1.node, 920, SZ), fit(l2.node, 920, SZ), fit(l3.node, 920, SZ));
  [l1, l2, l3].forEach((l) => (l.node.style.fontSize = `${sz}px`));
  const c1 = split(l1.node).chars;
  const c2 = riseIn(l2, T.fin + 0.22, { stagger: 0.025, dur: 0.55 });
  const c3 = split(l3.node).chars;

  // measure the morph before any initial transforms are applied
  const big = textLine(mid, 'ineed.now', { y: 890, size: sz });
  const bsz = fit(big.node, 900, sz);
  const bc = split(big.node).chars; // i n e e d . n o w
  const rc = (n) => n.getBoundingClientRect();
  const glide = [0, 1, 2, 3].map((i) => {
    const a = rc(c3[i]);
    const b = rc(bc[i + 1]);
    return { dx: b.left + b.width / 2 - (a.left + a.width / 2), dy: b.top + b.height / 2 - (a.top + a.height / 2) };
  });
  // "Everything" slams in letter by letter
  gsap.set(c1, { opacity: 0, scale: 2.2 });
  c1.forEach((c, i) => tl.fromTo(c, { opacity: 0, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'expo.out' }, T.fin + 0.02 + i * 0.018));
  // "needs." drops with weight
  gsap.set(c3, { y: -260, opacity: 0 });
  c3.forEach((c, i) => tl.fromTo(c, { y: -260, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'bounce.out' }, T.fin + 0.46 + i * 0.035));
  shake(T.fin + 0.02, 0.35, 14, 20);
  flash(fx.flash, T.fin, { color: C.orange, peak: 0.35, dur: 0.3 });
  cue(T.fin, 'impact', { big: false });
  cue(T.fin + 0.22, 'rise');
  cue(T.fin + 0.5, 'thud');
  fast(T.fin, T.fin + 0.35, 10);

  // ---------------------------------------------------------- needs. → ineed.now
  bc.slice(6).forEach((c) => (c.style.color = C.orange));
  bc[5].style.color = C.orange;
  gsap.set(bc, { opacity: 0 });
  const k = bsz / sz;
  const tM = T.morph;
  tl.to(c1, { yPercent: -140, opacity: 0, duration: 0.26, ease: 'power2.in', stagger: 0.008 }, tM - 0.06);
  riseOut(c2, tM, { dur: 0.3, to: -1.2, stagger: 0.01 });
  // n e e d glide into place (and shrink to the new size)
  glide.forEach(({ dx, dy }, i) => {
    tl.to(c3[i], { x: dx, y: dy, scale: k, color: '#ffffff', duration: 0.5, ease: 'expo.inOut' }, tM + 0.04 + i * 0.02);
  });
  // "s." falls away
  tl.to(c3.slice(4), { y: 240, rotation: 40, opacity: 0, duration: 0.4, ease: 'power3.in', stagger: 0.04 }, tM);
  // swap the gliding letters for the real line once they land
  const tLand = tM + 0.62;
  tl.set(c3.slice(0, 4), { opacity: 0 }, tLand);
  tl.set(bc.slice(1, 5), { opacity: 1 }, tLand);
  // "i" drops in, ".now" slides in
  tl.fromTo(bc[0], { opacity: 0, y: -200 }, { opacity: 1, y: 0, duration: 0.45, ease: 'back.out(2)' }, tM + 0.32);
  bc.slice(5).forEach((c, i) => tl.fromTo(c, { opacity: 0, x: 160 }, { opacity: 1, x: 0, duration: 0.42, ease: 'expo.out' }, tM + 0.36 + i * 0.04));
  tl.fromTo(big.node, { scale: 1 }, { scale: 1.06, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' }, tLand);
  cue(tM, 'morph');
  cue(tLand, 'sparkle');
  burst(top, { t: tLand, x: 540, y: 890, n: 22, seed: 5, colors: [C.orange, '#fff', C.orangeSoft], size: [6, 14], speed: [400, 1100], gravity: 300, drag: 3, life: 0.9 });

  // ---------------------------------------------------------- end card
  const tE = T.end;
  // logo
  const LS = 330 / 1122;
  const lg = svg('svg', { width: 1080, height: 1920, viewBox: '0 0 1080 1920', style: 'position:absolute;inset:0;overflow:visible' }, top);
  const g = svg('g', { transform: `translate(${540 - 561 * LS},${520 - 561 * LS}) scale(${LS})` }, lg);
  const order = [4, 1, 3, 5, 7, 0, 2, 6, 8];
  const sq = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const last = r === 2 && c === 2;
    const n = last
      ? svg('path', { d: rrect(842, 842, 280, 280, 85) + rrect(911, 911, 142, 142, 18), fill: C.orange, 'fill-rule': 'evenodd' }, g)
      : svg('rect', { x: c * 421, y: r * 421, width: 280, height: 280, rx: 50, fill: C.orange }, g);
    sq.push(n);
  }
  order.forEach((idx, i) => {
    enter(sq[idx], { scale: 0, rotation: -90, transformOrigin: '50% 50%' }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2.2)' }, tE + i * 0.04);
  });
  cue(tE, 'logo', { n: 9, spacing: 0.04 });

  // wordmark + subtitle
  const wm = textLine(top, 'EMSNow', { y: 812, size: 136 });
  fit(wm.node, 740, 136);
  const wmc = riseIn(wm, tE + 0.14, { stagger: 0.03, dur: 0.6 });
  wmc.slice(3).forEach((c) => (c.style.color = C.orange));
  const sub = textLine(top, 'School management system', { y: 912, size: 30, cls: 'mono', color: 'rgba(255,255,255,.72)' });
  riseIn(sub, tE + 0.3, { stagger: 0.01, dur: 0.5 });

  // CTA button
  const btn = el('div', {
    cls: 'abs pill',
    css: `left:540px;top:1066px;height:138px;padding:0 58px 0 66px;gap:24px;background:${C.orange};color:#fff;box-shadow:0 26px 60px rgba(254,77,30,.45), inset 0 2px 0 rgba(255,255,255,.25);overflow:hidden;`,
    html: `<span style="font:750 50px var(--f-display);letter-spacing:-.03em">Book a demo</span>${icon('arrow-right', 50, '#fff', 3)}`,
  }, top);
  const shine = el('div', { cls: 'abs', css: 'top:-20px;left:0;width:120px;height:170px;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-18deg);' }, btn);
  gsap.set(shine, { x: -200 });
  enter(btn, { xPercent: -50, yPercent: -50, scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(2)' }, tE + 0.42);
  cue(tE + 0.42, 'pop', { n: 3 });

  // URL: the big ineed.now flies down into "www.ineed.now"
  const url = textLine(top, 'www.ineed.now', { y: 1232, size: 68 });
  fit(url.node, 880, 68);
  const uc = split(url.node).chars; // w w w . i n e e d . n o w
  uc.slice(9).forEach((c) => (c.style.color = C.orange));
  gsap.set(uc, { opacity: 0 });
  const bigR = rc(big.node);
  const aR = rc(uc[4]);
  const zR = rc(uc[12]);
  const target = { x: (aR.left + zR.right) / 2, y: (aR.top + aR.bottom) / 2 };
  const src = { x: bigR.left + bigR.width / 2, y: bigR.top + bigR.height / 2 };
  const kk = (zR.right - aR.left) / bigR.width;
  tl.to(big.box, { x: target.x - src.x, y: target.y - src.y, scale: kk, duration: 0.6, ease: 'expo.inOut' }, tE + 0.02);
  tl.set(big.box, { opacity: 0 }, tE + 0.62);
  tl.set(uc.slice(4), { opacity: 1 }, tE + 0.62);
  uc.slice(0, 4).forEach((c, i) => tl.fromTo(c, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.35, ease: 'expo.out' }, tE + 0.6 + i * 0.03));
  cue(tE + 0.02, 'whoosh', { dur: 0.5, pan: 0 });

  // handle
  const ig = `<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.3"/><circle cx="17.4" cy="6.6" r="0.6" fill="#fff"/></svg>`;
  const handle = el('div', { cls: 'abs row', css: 'left:540px;top:1326px;gap:16px;font:700 44px var(--f-ui);color:rgba(255,255,255,.9);letter-spacing:-.01em;', html: `${ig}<span>@ineednow_</span>` }, top);
  enter(handle, { xPercent: -50, yPercent: -50, opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, tE + 0.72);

  // cursor clicks the CTA
  const cur = el('div', {
    cls: 'cursor',
    html: '<svg width="64" height="64" viewBox="0 0 32 32"><path d="M6 3 L6 25.5 L11.6 20.3 L15.2 28.6 L19.1 26.9 L15.6 18.8 L23.2 18.8 Z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  }, top);
  const tC = T.click;
  const bx = 720;
  const by = 1100;
  enter(cur, { x: 1160 - 12, y: 1620 - 6, opacity: 1 }, { x: bx - 12, y: by - 6, duration: 0.45, ease: 'power3.inOut' }, tC - 0.48);
  tl.fromTo(cur, { scale: 1 }, { scale: 0.82, duration: 0.07, yoyo: true, repeat: 1 }, tC - 0.03);
  tl.fromTo(btn, { scale: 1 }, { scale: 0.93, duration: 0.08, yoyo: true, repeat: 1, ease: 'power2.out' }, tC);
  const ring = el('div', { cls: 'abs', css: `left:${bx - 60}px;top:${by - 60}px;width:120px;height:120px;border-radius:50%;border:5px solid #fff;` }, top);
  gsap.set(ring, { opacity: 0 });
  tl.fromTo(ring, { scale: 0.2, opacity: 1 }, { scale: 2.2, opacity: 0, duration: 0.6, ease: 'expo.out' }, tC);
  burst(top, { t: tC + 0.02, x: bx, y: by, n: 18, seed: 77, colors: ['#fff', C.orangeSoft, C.orange], size: [6, 13], speed: [300, 900], gravity: 500, drag: 3, life: 0.8 });
  tl.to(cur, { x: '+=110', y: '+=150', opacity: 0, duration: 0.5, ease: 'power2.in' }, tC + 0.35);
  cue(tC, 'click', { big: true });
  cue(tC + 0.05, 'chime');

  // idle life on the end card
  [tC + 0.55, tC + 1.45].forEach((t) => tl.fromTo(shine, { x: -200 }, { x: 640, duration: 0.7, ease: 'power2.inOut' }, t));
  tl.fromTo(sq[8], { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.12, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.out' }, 29.05);
  cue(29.05, 'thump', { soft: true });

  // drifting embers
  const R = rng(99);
  const dust = Array.from({ length: 26 }, () => {
    const size = 4 + R() * 9;
    const n = el('div', { cls: 'abs', css: `left:0;top:0;width:${size}px;height:${size}px;border-radius:${size * 0.25}px;background:${R() > 0.35 ? C.orange : '#fff'};` }, back);
    return { n, x: R() * 1080, y: 400 + R() * 1400, v: 30 + R() * 70, ph: R() * 6.28, a: 0.15 + R() * 0.45 };
  });
  proc((t) => {
    const d = t - T.end;
    for (const p of dust) {
      if (d < 0) {
        p.n.style.opacity = 0;
        continue;
      }
      const y = p.y - d * p.v;
      const x = p.x + Math.sin(t * 0.9 + p.ph) * 24;
      p.n.style.opacity = (p.a * clamp(d / 0.8)).toFixed(3);
      p.n.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(t * 40 + p.ph * 50).toFixed(1)}deg)`;
    }
  });
}
