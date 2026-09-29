// Core helpers shared by every scene. Everything that moves is either a GSAP
// tween on the paused master timeline or a "proc" — a pure function of time —
// so any frame can be rendered by seeking, in any order, deterministically.

export const W = 1080;
export const H = 1920;

export const C = {
  orange: '#FE4D1E',
  orange2: '#FF7447',
  orangeSoft: '#FFB49A',
  orangeDeep: '#C9340C',
  ink: '#0A0A0D',
  ink2: '#131318',
  ink3: '#1C1C23',
  line: 'rgba(255,255,255,0.09)',
  paper: '#FAF8F5',
  paper2: '#F0ECE6',
  text: '#15151A',
  muted: '#8C8C99',
  green: '#16B36B',
  greenSoft: '#D6F5E6',
  red: '#F0293E',
  redSoft: '#FFE1E4',
  amber: '#F5A524',
};

export const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out', immediateRender: false } });

// ---------------------------------------------------------------- sound cues
export const cues = [];
export function cue(t, type, opts = {}) {
  cues.push({ t: Math.round(t * 10000) / 10000, type, ...opts });
}

// ------------------------------------------------------- procedural updaters
const procs = [];
export function proc(fn) {
  procs.push(fn);
}
export function runProcs(t, ft) {
  for (const p of procs) p(t, ft);
}

// ------------------------------------------------ motion-blur sample density
const fastRanges = [];
export function fast(t0, t1, samples = 16) {
  fastRanges.push([t0, t1, samples]);
}
export function samplesAt(t) {
  let s = 8;
  for (const [a, b, n] of fastRanges) if (t >= a && t <= b) s = Math.max(s, n);
  return s;
}

// ----------------------------------------------------------------- utilities
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, p) => a + (b - a) * p;
export const ease = (name) => gsap.parseEase(name);

export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function el(tag, opts = {}, parent) {
  const n = document.createElement(tag);
  if (opts.cls) n.className = opts.cls;
  if (opts.id) n.id = opts.id;
  if (opts.html != null) n.innerHTML = opts.html;
  if (opts.text != null) n.textContent = opts.text;
  if (opts.css) n.style.cssText = opts.css;
  if (parent) parent.appendChild(n);
  return n;
}

const SVGNS = 'http://www.w3.org/2000/svg';
export function svg(tag, attrs = {}, parent) {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}

// Rounded rectangle path (clockwise); used for the logo's punched square.
export function rrect(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  return (
    `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}` +
    `A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}` +
    `V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`
  );
}

// ------------------------------------------------------------------- icons
const ICONS = {};
export async function loadIcons(names) {
  await Promise.all(
    names.map(async (n) => {
      if (ICONS[n]) return;
      const res = await fetch(`node_modules/lucide-static/icons/${n}.svg`);
      if (!res.ok) throw new Error(`missing icon ${n}`);
      const txt = await res.text();
      ICONS[n] = txt.replace(/<!--.*?-->/s, '').trim();
    }),
  );
}
export function icon(name, size = 24, color = 'currentColor', stroke = 2) {
  const src = ICONS[name];
  if (!src) throw new Error(`icon not loaded: ${name}`);
  return src
    .replace(/width="24"/, `width="${size}"`)
    .replace(/height="24"/, `height="${size}"`)
    .replace(/stroke="currentColor"/, `stroke="${color}"`)
    .replace(/stroke-width="2"/, `stroke-width="${stroke}"`)
    .replace(/class="[^"]*"/, 'class="ico"');
}

// ------------------------------------------------------------ text helpers
// Splits a node's text into word + char spans (inline-block) for kinetic type.
export function split(node) {
  const text = node.textContent;
  node.textContent = '';
  const words = [];
  const chars = [];
  text.split(/(\s+)/).forEach((part) => {
    if (!part) return;
    if (/^\s+$/.test(part)) {
      node.appendChild(document.createTextNode(' '));
      return;
    }
    const w = el('span', { cls: 'w' }, node);
    for (const ch of part) chars.push(el('span', { cls: 'c', text: ch }, w));
    words.push(w);
  });
  return { words, chars };
}

// Scales font-size so the node's natural width fits maxW (never above maxSize).
export function fit(node, maxW, maxSize) {
  node.style.fontSize = '100px';
  node.style.whiteSpace = 'nowrap';
  const w = node.scrollWidth || node.getBoundingClientRect().width;
  const size = Math.min(maxSize, (100 * maxW) / w);
  node.style.fontSize = `${size.toFixed(2)}px`;
  return size;
}

// A line of display text, horizontally centred on x (default: stage centre),
// vertically centred on y.
export function textLine(parent, text, { y, x = W / 2, size = 90, cls = 'display', color = '#fff', weight, maxW, align = 'center', ls } = {}) {
  const box = el('div', { cls: 'tl-box', css: `top:${y}px;` }, parent);
  const n = el('div', { cls: `tl ${cls}`, text, css: `color:${color};font-size:${size}px;` }, box);
  if (weight) n.style.fontWeight = weight;
  if (ls) n.style.letterSpacing = ls;
  if (maxW) fit(n, maxW, size);
  box.style.left = `${x}px`;
  // centring lives in xPercent/yPercent so GSAP x/y tweens stay additive
  gsap.set(box, { xPercent: align === 'center' ? -50 : 0, yPercent: -50 });
  return { box, node: n };
}

// Masked "rise" reveal for a line: chars slide up from behind a clip.
export function riseIn(line, t, { stagger = 0.028, dur = 0.55, from = 1.1, ease = 'expo.out', blur = true } = {}) {
  line.box.classList.add('mask');
  const { chars } = split(line.node);
  gsap.set(chars, { yPercent: from * 100, rotation: 6, opacity: blur ? 0 : 1 });
  tl.fromTo(chars, { yPercent: from * 100, rotation: 6 }, { yPercent: 0, rotation: 0, duration: dur, ease, stagger }, t);
  if (blur) tl.fromTo(chars, { opacity: 0 }, { opacity: 1, duration: dur * 0.5, ease: 'none', stagger }, t);
  return chars;
}

// First appearance: applies the "from" state immediately (so the element is
// correct before its tween starts), then tweens to "to" at position t.
export function enter(target, from, to, t) {
  gsap.set(target, from);
  return tl.fromTo(target, from, to, t);
}
export function riseOut(chars, t, { stagger = 0.012, dur = 0.35, to = -1.1, ease = 'power3.in' } = {}) {
  tl.to(chars, { yPercent: to * 100, duration: dur, ease, stagger }, t);
}

// Scene container, visible between tIn and tOut.
export function scene(world, id, tIn, tOut) {
  const n = el('div', { cls: 'scene', id }, world);
  if (tIn <= 0) gsap.set(n, { autoAlpha: 1 });
  else tl.set(n, { autoAlpha: 1 }, tIn);
  if (tOut != null) tl.set(n, { autoAlpha: 0 }, tOut);
  return n;
}

// ------------------------------------------------------------- counters
export function counter(node, { t0, dur, from = 0, to, easeName = 'power2.out', fmt = (v) => String(Math.round(v)) }) {
  const e = ease(easeName);
  proc((t) => {
    const p = clamp((t - t0) / dur);
    node.textContent = fmt(from + (to - from) * e(p));
  });
}
export const money = (v, dec = 0) =>
  '$' + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

// ------------------------------------------------------------- particles
export function burst(parent, o) {
  const {
    t, x, y, n = 24, seed = 1, colors = [C.orange], size = [8, 18], speed = [300, 900],
    angle = [0, 360], gravity = 900, drag = 2.2, life = 1.1, spin = 540, round = 0.24,
  } = o;
  const r = rng(seed);
  const parts = [];
  for (let i = 0; i < n; i++) {
    const a = ((angle[0] + r() * (angle[1] - angle[0])) * Math.PI) / 180;
    const v = speed[0] + r() * (speed[1] - speed[0]);
    const s = size[0] + r() * (size[1] - size[0]);
    const node = el('div', { cls: 'particle', css: `width:${s}px;height:${s}px;background:${colors[i % colors.length]};border-radius:${s * round}px;` }, parent);
    parts.push({ node, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: r() * 360, spin: (r() - 0.5) * 2 * spin, life: life * (0.55 + r() * 0.45), s });
  }
  proc((time) => {
    const dt = time - t;
    for (const p of parts) {
      if (dt < 0 || dt > p.life) {
        p.node.style.visibility = 'hidden';
        continue;
      }
      const ex = (1 - Math.exp(-drag * dt)) / drag;
      const px = x + p.vx * ex;
      const py = y + p.vy * ex + 0.5 * gravity * dt * dt;
      const lp = dt / p.life;
      const sc = lp < 0.08 ? lp / 0.08 : 1 - Math.max(0, (lp - 0.55) / 0.45);
      p.node.style.visibility = 'visible';
      p.node.style.transform = `translate(${px - p.s / 2}px,${py - p.s / 2}px) rotate(${p.rot + p.spin * dt}deg) scale(${sc})`;
    }
  });
}

// --------------------------------------------------------- camera shake
const shakes = [];
export function shake(t0, dur = 0.45, amp = 16, freq = 19) {
  shakes.push({ t0, dur, amp, freq, ph: shakes.length * 1.93 });
}
export function shakeAt(t) {
  let x = 0;
  let y = 0;
  let r = 0;
  for (const s of shakes) {
    const d = t - s.t0;
    if (d < 0 || d > s.dur) continue;
    const k = Math.pow(1 - d / s.dur, 2.2) * s.amp;
    const w = d * s.freq * Math.PI * 2;
    x += k * Math.sin(w + s.ph);
    y += k * 0.8 * Math.sin(w * 1.27 + s.ph * 2.3);
    r += k * 0.035 * Math.sin(w * 0.83 + s.ph * 0.7);
  }
  return { x, y, r };
}

// Flash overlay pulse (colour, peak opacity, fade duration)
export function flash(node, t, { color = '#fff', peak = 0.9, dur = 0.35 } = {}) {
  tl.set(node, { backgroundColor: color }, t);
  tl.fromTo(node, { opacity: peak }, { opacity: 0, duration: dur, ease: 'power2.out' }, t);
}
