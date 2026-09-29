// 24.8 – 30.0s  CALL TO ACTION. "Everything your clinic needs. Now." →
// the mark assembles → product name, demo button, website and handle.
import { h, rng, onFrame, cue, impact, prog, lerp, clamp } from '../lib/core.js';

const LOGO_C = [540, 520];
const SQ = 88;
const PITCH = 132;

export default function cta({ root, tl }) {
  const S = h('section.scene#s-cta', { style: { color: 'var(--text)' } });
  root.append(S);
  tl.set(S, { visibility: 'visible' }, 24.8);
  tl.set(S, { backgroundColor: 'rgba(255,255,255,0)' }, 24.8);
  tl.set(S, { backgroundColor: '#ffffff' }, 25.06);

  /* ---------- white flood from the centre ---------- */
  const flood = h('div.abs', { style: { background: '#fff' } });
  S.append(flood);
  const ein = gsap.parseEase('expo.in');
  onFrame((t) => {
    if (t < 24.78 || t > 25.1) { flood.style.visibility = 'hidden'; return; }
    flood.style.visibility = 'visible';
    const p = ein(clamp((t - 24.8) / 0.26));
    const size = lerp(24, 2600, p);
    Object.assign(flood.style, {
      width: `${size}px`, height: `${size}px`, left: `${540 - size / 2}px`, top: `${900 - size / 2}px`,
      borderRadius: `${(size * lerp(0.3, 0.1, p)).toFixed(1)}px`, transform: `rotate(${lerp(45, 0, p).toFixed(2)}deg)`,
    });
  });
  cue(24.8, 'whoosh', { dur: 0.3, gain: 0.7 });

  const dots = h('div.dots.on-light');
  const glow = h('div.abs', { style: { left: '-200px', right: '-200px', top: '120px', height: '900px', background: 'radial-gradient(ellipse 45% 45% at 50% 50%, rgba(254,77,30,0.10), rgba(254,77,30,0) 70%)' } });
  S.append(dots, glow);
  gsap.set(glow, { autoAlpha: 0 });
  tl.to(glow, { autoAlpha: 1, duration: 0.8 }, 26.7);
  gsap.set(dots, { autoAlpha: 0 });
  tl.to(dots, { autoAlpha: 1, duration: 0.5 }, 25.06);
  onFrame((t) => {
    if (t < 25 || t > 30.1) return;
    dots.style.transform = `translate(${(-(t - 25) * 12).toFixed(1)}px, ${(-(t - 25) * 18).toFixed(1)}px)`;
  });

  /* ---------- statement ---------- */
  const lines = [['Everything', 600, 25.08], ['your clinic', 712, 25.28], ['needs.', 824, 25.5]];
  const lineEls = lines.map(([txt, top, t0]) => {
    const m = h('div.mask', { style: { left: '0', right: '0', top: `${top}px`, height: '120px' } });
    const el = h('div.cta-line', { style: { top: '6px', fontSize: '100px' } }, txt);
    m.append(el);
    S.append(m);
    gsap.set(el, { yPercent: 110 });
    tl.to(el, { yPercent: 0, duration: 0.55, ease: 'expo.out' }, t0);
    cue(t0, 'swish', { gain: 0.5 });
    return el;
  });

  const now = h('div.cta-now', { style: { top: '930px' } });
  const nowTxt = h('span', {}, 'Now');
  const dot = h('span', { style: { display: 'inline-block', width: '64px', height: '64px', border: '15.5px solid var(--orange)', borderRadius: '20px', marginLeft: '14px', verticalAlign: '0.02em' } });
  now.append(nowTxt, dot);
  S.append(now);
  gsap.set(now, { autoAlpha: 0, scale: 2.6, transformOrigin: '50% 60%' });
  tl.to(now, { autoAlpha: 1, scale: 1, duration: 0.14, ease: 'power4.in' }, 25.88);
  tl.to(now, { scaleY: 0.9, scaleX: 1.06, duration: 0.07, yoyo: true, repeat: 1, ease: 'power2.out' }, 26.02);
  impact(26.02, 28, 7, 14);
  cue(26.02, 'impact', { big: 1 });
  const pr = rng(77);
  for (let i = 0; i < 18; i++) {
    const p = h('div.particle');
    S.append(p);
    const a = pr.range(0, Math.PI * 2), dist = pr.range(260, 620), sz = pr.range(10, 28);
    gsap.set(p, { left: 540 - sz / 2, top: 1080 - sz / 2, width: sz, height: sz, borderRadius: sz * 0.22, autoAlpha: 0 });
    tl.fromTo(p, { x: 0, y: 0, autoAlpha: 1, rotation: 0, scale: 1 }, {
      x: Math.cos(a) * dist, y: Math.sin(a) * dist * 0.8, autoAlpha: 0, scale: 0.3, rotation: pr.range(-300, 300),
      duration: pr.range(0.7, 1.1), ease: 'expo.out', immediateRender: false,
    }, 26.02);
  }

  // statement exits
  lineEls.forEach((el, i) => tl.to(el, { yPercent: -110, duration: 0.3, ease: 'power3.in' }, 26.5 + i * 0.04));
  tl.to(now, { scale: 0.12, autoAlpha: 0, y: -520, duration: 0.42, ease: 'power3.in' }, 26.5);

  /* ---------- the mark assembles ---------- */
  const squares = [];
  const r = rng(12);
  for (let i = 0; i < 9; i++) {
    const col = i % 3, row = Math.floor(i / 3);
    const el = h('div.sq', { style: { width: `${SQ}px`, height: `${SQ}px`, left: `${LOGO_C[0] - SQ / 2 + (col - 1) * PITCH}px`, top: `${LOGO_C[1] - SQ / 2 + (row - 1) * PITCH}px`, borderRadius: `${SQ * 0.186}px` } });
    S.append(el);
    squares.push(el);
    const fromX = 540 - (LOGO_C[0] + (col - 1) * PITCH) + r.range(-200, 200);
    const fromY = 1080 - (LOGO_C[1] + (row - 1) * PITCH) + r.range(-80, 80);
    gsap.set(el, { autoAlpha: 0 });
    const t0 = 26.62 + i * 0.045;
    tl.fromTo(el, { autoAlpha: 1, x: fromX, y: fromY, scale: 0.2, rotation: r.range(-200, 200) },
      { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.62, ease: 'expo.out', immediateRender: false }, t0);
    cue(t0 + 0.1, 'pluck', { n: i });
  }
  // the ninth square turns hollow, like the logo
  const last = squares[8];
  tl.to(last, { backgroundColor: 'rgba(254,77,30,0)', borderWidth: SQ * 0.243, borderStyle: 'solid', borderColor: '#fe4d1e', borderRadius: SQ * 0.314, duration: 0.25, ease: 'back.out(2)' }, 27.2);
  gsap.set(last, { borderStyle: 'solid', borderColor: '#fe4d1e', borderWidth: 0 });
  cue(27.2, 'click');

  // idle wave through the mark
  onFrame((t) => {
    if (t < 27.5 || t > 30.1) return;
    squares.forEach((el, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const ph = (t - 27.5) * 2.2 - (col + row) * 0.35;
      const w = Math.max(0, Math.sin(ph * Math.PI)) ** 6;
      el.style.scale = (1 + 0.1 * w).toFixed(4);
    });
  });

  /* ---------- product name, tagline, CTA ---------- */
  const word = h('div.wordmark', { style: { top: '716px', fontSize: '106px' } });
  const wm = h('span', { style: { display: 'inline-block', overflow: 'hidden', paddingBottom: '0.1em', marginBottom: '-0.1em' } });
  word.append(wm);
  const wchars = [...'HMSNow'].map((c, i) => {
    const s = h('span', { style: { display: 'inline-block' } }, c);
    if (i >= 3) s.className = 'now';
    wm.append(s);
    return s;
  });
  S.append(word);
  gsap.set(wchars, { yPercent: 115 });
  tl.to(wchars, { yPercent: 0, duration: 0.6, ease: 'expo.out', stagger: 0.035 }, 26.95);

  const tag = h('div.tagline', { style: { top: '858px', fontSize: '40px', fontWeight: '600', color: '#55555e' } },
    'Everything your clinic needs. ', h('b', { style: { color: 'var(--orange)' } }, 'Now.'));
  S.append(tag);
  gsap.set(tag, { autoAlpha: 0 });
  tl.fromTo(tag, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, 27.12);

  const arrow = h('span', { style: { display: 'inline-block', color: 'var(--orange)' } }, '→');
  const btn = h('div.cta-btn', { style: { top: '972px' } }, h('span', {}, 'Book a demo'), arrow);
  const sheen = h('div.sheen', { style: { width: '160px' } });
  btn.append(sheen);
  S.append(btn);
  gsap.set(btn, { autoAlpha: 0, scale: 0.6 });
  tl.to(btn, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 27.25);
  cue(27.25, 'pop', { n: 6 });
  tl.fromTo(sheen, { x: 0 }, { x: 1200, duration: 0.8, ease: 'power2.inOut', immediateRender: false }, 28.3);
  tl.fromTo(sheen, { x: 0 }, { x: 1200, duration: 0.8, ease: 'power2.inOut', immediateRender: false }, 29.2);
  onFrame((t) => {
    if (t < 27.5 || t > 30.1) return;
    const b = ((t - 27.5) % 0.5) / 0.5;
    arrow.style.transform = `translateX(${(Math.sin(b * Math.PI) ** 2 * 12).toFixed(2)}px)`;
  });

  const url = h('div.cta-url', { style: { top: '1170px' } });
  const urlChars = [];
  ['www', '.', 'ineed', '.', 'now'].forEach((part) => {
    for (const c of part) {
      const s = h('span', { style: { display: 'inline-block' } }, c);
      if (part === '.') s.className = 'dot';
      url.append(s);
      urlChars.push(s);
    }
  });
  S.append(url);
  gsap.set(urlChars, { autoAlpha: 0, y: 40 });
  tl.to(urlChars, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out', stagger: 0.022 }, 27.42);
  cue(27.42, 'type', { dur: 0.3 });

  const handle = h('div.cta-handle', { style: { top: '1282px' } }, 'or DM us ', h('b', { style: { color: 'var(--text)' } }, '@ineednow_'));
  S.append(handle);
  gsap.set(handle, { autoAlpha: 0 });
  tl.fromTo(handle, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out', immediateRender: false }, 27.62);

  /* ---------- the cursor clicks the button ---------- */
  const cur = h('div.cursor-sq', { style: { left: `${540 - 36 + 150}px`, top: `${1040 - 36 + 30}px`, zIndex: '3' } });
  S.append(cur);
  gsap.set(cur, { autoAlpha: 0, x: 420, y: -70, rotation: 120, scale: 1.4 });
  tl.to(cur, { autoAlpha: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: 0.45, ease: 'expo.out' }, 27.6);
  tl.to(cur, { scale: 0.7, duration: 0.07, ease: 'power2.in' }, 28.0);
  tl.to(cur, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, 28.07);
  tl.to(btn, { scale: 0.95, duration: 0.07, ease: 'power2.in' }, 28.0);
  tl.to(btn, { scale: 1, duration: 0.35, ease: 'back.out(3)' }, 28.07);
  const ripple = h('div.ripple');
  btn.append(ripple);
  gsap.set(ripple, { left: 540 - 150 + 150, top: 68 + 30, width: 20, height: 20, xPercent: -50, yPercent: -50, autoAlpha: 0 });
  tl.fromTo(ripple, { width: 20, height: 20, autoAlpha: 0.9 }, { width: 900, height: 900, autoAlpha: 0, duration: 0.7, ease: 'expo.out', immediateRender: false }, 28.02);
  tl.to(cur, { x: 520, y: -40, autoAlpha: 0, scale: 0.5, rotation: 90, duration: 0.4, ease: 'power3.in' }, 28.5);
  cue(28.02, 'click');
}
