// 0.0 – 3.0s  HOOK: the clinic before HMSNow. Notification chaos piles up while
// kinetic words ask the question, then everything implodes into one orange square.
import { h, rng, onFrame, cue, impact, noise1, prog, clamp, fitWidth } from '../lib/core.js';
import { L } from '../i18n.js';

const TOASTS = L.hook.toasts;
const WORDS = ['fill', 'outline', 'strike', 'flicker', 'hl'].map((style, i) => ({ text: L.hook.words[i], style }));

export default function hook({ root, tl }) {
  const S = h('section.scene.dark#s-hook');
  root.append(S);

  const dots = h('div.dots');
  const alertV = h('div.alert-vignette');
  const toastLayer = h('div.abs', { style: { inset: '0' } });
  const glow = h('div.hook-glow');
  const kicker = h('div.hook-kicker', {}, L.hook.kicker);
  const wordLayer = h('div.abs', { style: { inset: '0' } });
  const lines = h('div.abs', { style: { inset: '0' } });
  const core = h('div.core');
  S.append(dots, alertV, toastLayer, glow, kicker, wordLayer, lines, core);

  tl.set(S, { visibility: 'visible' }, 0);
  tl.set(S, { visibility: 'hidden' }, 3.0);
  // slow push-in that tightens as the chaos builds
  onFrame((t) => {
    if (t > 3.05) return;
    const z = 1 + 0.035 * prog(t, 0, 2.5, 'power1.in') + 0.05 * prog(t, 2.45, 3.0, 'power3.in');
    S.style.transform = `scale(${z.toFixed(4)})`;
  });

  /* ---------- toasts ---------- */
  const r = rng(7);
  const toastEls = [];
  // Appearance times accelerate: a couple already on screen at frame 0.
  const times = TOASTS.map((_, i) => (i < 6 ? -0.2 : 0.12 + 2.2 * Math.pow((i - 6) / (TOASTS.length - 6), 0.85)));
  // Distribute vertically in shuffled bands so they cover the whole frame.
  const bands = TOASTS.map((_, i) => i).sort(() => r() - 0.5);
  TOASTS.forEach(([ico, col, title, meta, time], i) => {
    const depth = r(); // 0 far .. 1 near
    const scale = 0.7 + depth * 0.42;
    // keep the headline band (≈560–1000px) clear: toasts live above and below it
    const yf = bands[i] / (TOASTS.length - 1);
    const y = (yf < 0.4 ? 70 + (yf / 0.4) * 440 : 1010 + ((yf - 0.4) / 0.6) * 760) + r.range(-30, 30);
    const x = r.range(-210, 590);
    const rot = r.range(-11, 11);
    const outer = h('div.abs', { style: { left: '0', top: '0' } });
    const drift = h('div.abs', { style: { left: '0', top: '0' } });
    const card = h('div.toast', {},
      h('div.t-ico', { style: { background: col } }, ico),
      h('div.t-txt', {}, h('div.t-title', {}, title), h('div.t-meta', {}, meta)),
      h('div.t-time', {}, time));
    drift.append(card);
    outer.append(drift);
    toastLayer.append(outer);
    card.querySelectorAll('.t-title, .t-meta').forEach((el) => fitWidth(el, 450));
    card.style.opacity = String(0.7 + depth * 0.3);
    if (depth < 0.35) card.style.filter = `blur(${((0.35 - depth) * 12).toFixed(1)}px)`;
    const t0 = Math.max(times[i], -0.3);
    gsap.set(outer, { x, y, rotation: rot, scale: 0, transformOrigin: '50% 50%' });
    if (t0 <= 0) {
      gsap.set(outer, { scale, autoAlpha: 1 });
    } else {
      gsap.set(outer, { autoAlpha: 0 });
      tl.fromTo(outer, { scale: scale * 0.55, autoAlpha: 0, y: y + 60 },
        { scale, autoAlpha: 1, y, duration: 0.42, ease: 'back.out(2.2)', immediateRender: false }, t0);
    }
    if (t0 > 0.02) cue(t0, 'ping', { pitch: i % 5, gain: 0.35 + depth * 0.35 });
    // implode into the centre
    const cx = 540 - 350, cy = 960 - 64;
    tl.to(outer, {
      x: cx, y: cy, scale: 0.02, rotation: rot + r.sign() * r.range(90, 200),
      duration: 0.42, ease: 'power3.in',
    }, 2.5 + r() * 0.09);
    tl.set(outer, { autoAlpha: 0 }, 2.99);
    toastEls.push({ drift, seed: i * 13.7, depth });
  });

  // Nervous drift so nothing ever sits still in the chaos.
  onFrame((t) => {
    if (t > 3.05) return;
    for (const d of toastEls) {
      const k = 0.6 + (1 - d.depth) * 0.6;
      const nx = noise1(t * 1.3 + d.seed, 1) * 26 * k;
      const ny = noise1(t * 1.1 + d.seed, 2) * 18 * k - t * 22 * k;
      const nr = noise1(t * 1.7 + d.seed, 3) * 3.5;
      d.drift.style.transform = `translate(${nx.toFixed(1)}px, ${ny.toFixed(1)}px) rotate(${nr.toFixed(2)}deg)`;
    }
    dots.style.transform = `translate(${(-t * 18).toFixed(1)}px, ${(-t * 30).toFixed(1)}px)`;
  });

  /* ---------- kinetic words ---------- */
  tl.to(kicker, { autoAlpha: 0, y: -30, duration: 0.2, ease: 'power2.in' }, 1.9);

  const wordEls = WORDS.map((w, i) => {
    const el = h(`div.hook-word${w.style === 'outline' ? '.outline' : ''}`);
    if (w.style === 'hl') {
      el.append(h('span.hl', {}, w.text));
      el.style.fontSize = '100px';
    } else {
      el.textContent = w.text;
    }
    wordLayer.append(el);
    // auto-fit to the frame width
    const maxW = 960;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const wNat = el.scrollWidth || maxW;
    if (wNat > maxW) el.style.fontSize = `${Math.floor(fs * maxW / wNat)}px`;
    gsap.set(el, { autoAlpha: 0, transformOrigin: '50% 50%' });
    return el;
  });

  const T = [0, 0.5, 1.0, 1.5, 2.0];
  wordEls.forEach((el, i) => {
    const t0 = T[i];
    const next = T[i + 1] ?? 2.5;
    const style = WORDS[i].style;
    if (i === 0) {
      tl.fromTo(el, { autoAlpha: 1, scale: 1.1 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'power3.out' }, 0);
    } else if (style === 'outline') {
      tl.set(el, { autoAlpha: 1 }, t0);
      tl.fromTo(el, { x: 260, skewX: -18 }, { x: 0, skewX: 0, duration: 0.32, ease: 'expo.out', immediateRender: false }, t0);
    } else if (style === 'strike') {
      tl.set(el, { autoAlpha: 1 }, t0);
      tl.fromTo(el, { scale: 1.35 }, { scale: 1, duration: 0.28, ease: 'expo.out', immediateRender: false }, t0);
      const bar = h('div.strike');
      wordLayer.append(bar);
      const bw = Math.min(el.scrollWidth, 960);
      gsap.set(bar, { left: 540 - bw / 2 - 20, top: 770 + 58, width: bw + 40, scaleX: 0, autoAlpha: 0, rotation: -2 });
      tl.fromTo(bar, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.18, ease: 'power3.out', immediateRender: false }, t0 + 0.16);
      tl.set(bar, { autoAlpha: 0 }, next);
      cue(t0 + 0.16, 'scratch');
    } else if (style === 'flicker') {
      const chars = [...el.textContent];
      el.textContent = '';
      const spans = chars.map((c) => {
        const s = h('span', { style: { display: 'inline-block' } }, c === ' ' ? ' ' : c);
        el.append(s);
        return s;
      });
      tl.set(el, { autoAlpha: 1 }, t0);
      const order = spans.map((_, k) => k).sort(() => r() - 0.5);
      order.forEach((k, j) => {
        tl.fromTo(spans[k], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, immediateRender: false }, t0 + j * 0.017);
      });
      gsap.set(spans, { autoAlpha: 0 });
    } else if (style === 'hl') {
      tl.set(el, { autoAlpha: 1 }, t0);
      tl.fromTo(el, { scale: 0.4, rotation: -6 }, { scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(2.4)', immediateRender: false }, t0);
    }
    // hard out on the next beat (the next word replaces it)
    if (i < WORDS.length - 1) tl.set(el, { autoAlpha: 0 }, next);
    cue(t0, i === 0 ? 'hit' : 'glitch', { i });
    impact(t0, i === 4 ? 16 : 10, 12, 17);
  });
  // "SOUND FAMILIAR?" gets sucked into the core
  tl.to(wordEls[4], { scale: 0, rotation: 25, autoAlpha: 0, duration: 0.34, ease: 'power3.in' }, 2.5);

  // RGB-split ghosts on each word change (2 frames)
  const ghostR = h('div.abs', { style: { inset: '0', mixBlendMode: 'screen' } });
  const ghostC = h('div.abs', { style: { inset: '0', mixBlendMode: 'screen' } });
  S.insertBefore(ghostR, wordLayer);
  S.insertBefore(ghostC, wordLayer);
  WORDS.forEach((w, i) => {
    if (i === 0) return;
    const mk = (col, dx) => {
      const g = h('div.hook-word', {}, w.text);
      g.style.color = col;
      g.style.fontSize = wordEls[i].style.fontSize || '';
      g.style.transform = `translateX(${dx}px)`;
      return g;
    };
    const a = mk('#ff2a55', -14);
    const b = mk('#1fe3ff', 14);
    ghostR.append(a);
    ghostC.append(b);
    gsap.set([a, b], { autoAlpha: 0 });
    tl.set([a, b], { autoAlpha: 0.85 }, T[i]);
    tl.set([a, b], { autoAlpha: 0 }, T[i] + 0.07);
  });

  /* ---------- alert pulse on every beat ---------- */
  onFrame((t) => {
    if (t > 3.05) return;
    let a = 0;
    for (let b = 0; b < 2.5; b += 0.5) {
      const d = t - b;
      if (d >= 0) a = Math.max(a, (0.35 + b * 0.25) * Math.exp(-d * 5));
    }
    a *= 1 - prog(t, 2.45, 2.8);
    alertV.style.opacity = a.toFixed(3);
  });

  /* ---------- implosion ---------- */
  const N = 22;
  const lr = rng(11);
  const speed = [];
  for (let i = 0; i < N; i++) {
    const el = h('div.speedline');
    lines.append(el);
    speed.push({ el, a: (i / N) * 6.2832 + lr.range(-0.1, 0.1), len: lr.range(260, 620), t0: 2.45 + lr() * 0.25 });
  }
  const inEase = gsap.parseEase('power2.in');
  onFrame((t) => {
    for (const s of speed) {
      const p = clamp((t - s.t0) / 0.3);
      if (p <= 0 || p >= 1) { s.el.style.opacity = '0'; continue; }
      const e = inEase(p);
      const dist = 980 * (1 - e) + 30;
      const len = s.len * (1 - 0.75 * e);
      const x = Math.cos(s.a) * dist, y = Math.sin(s.a) * dist;
      s.el.style.opacity = (0.9 * (1 - e * 0.5)).toFixed(3);
      s.el.style.width = `${len.toFixed(1)}px`;
      s.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${s.a}rad)`;
    }
  });
  gsap.set(core, { scale: 0, rotation: 0 });
  tl.fromTo(core, { scale: 0, rotation: -45 }, { scale: 0.42, rotation: 180, duration: 0.42, ease: 'power2.in', immediateRender: false }, 2.52);
  tl.to(core, { scaleX: 0.62, scaleY: 0.26, duration: 0.06, ease: 'power2.in' }, 2.94);
  onFrame((t) => {
    if (t < 2.55 || t > 3) return;
    const j = prog(t, 2.55, 2.95) * 7;
    core.style.translate = `${(noise1(t * 40, 5) * j).toFixed(1)}px ${(noise1(t * 40, 6) * j).toFixed(1)}px`;
  });
  cue(2.45, 'suck', { dur: 0.55 });
  cue(1.5, 'riser', { dur: 1.45 });
}
