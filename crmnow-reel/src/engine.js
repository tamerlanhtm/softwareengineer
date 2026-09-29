// Deterministic motion engine. Every frame is a pure function of time `t` (seconds),
// so any frame can be rendered in isolation, in any order, by the capture script.

import { ICONS } from './icons.js';

export const W = 1080;
export const H = 1920;
export const BPM = 128;
export const BEAT = 60 / BPM;          // 0.46875 s
export const b = (n) => n * BEAT;      // beats -> seconds
export const DURATION = b(64);         // 16 bars = 30.0 s

export const ORANGE = '#FE4D1E';

// ---------------------------------------------------------------- math
export const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
export const lerp = (a, c, k) => a + (c - a) * k;
export const prog = (t, a, c) => (c === a ? (t >= c ? 1 : 0) : clamp((t - a) / (c - a)));

// ---------------------------------------------------------------- easing
const pow = Math.pow;
export const E = {
  linear: (x) => x,
  inQuad: (x) => x * x,
  outQuad: (x) => 1 - (1 - x) * (1 - x),
  inOutQuad: (x) => (x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2),
  inCubic: (x) => x * x * x,
  outCubic: (x) => 1 - pow(1 - x, 3),
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2),
  inQuart: (x) => x * x * x * x,
  outQuart: (x) => 1 - pow(1 - x, 4),
  inOutQuart: (x) => (x < 0.5 ? 8 * x ** 4 : 1 - pow(-2 * x + 2, 4) / 2),
  outQuint: (x) => 1 - pow(1 - x, 5),
  inOutQuint: (x) => (x < 0.5 ? 16 * x ** 5 : 1 - pow(-2 * x + 2, 5) / 2),
  inExpo: (x) => (x <= 0 ? 0 : pow(2, 10 * x - 10)),
  outExpo: (x) => (x >= 1 ? 1 : 1 - pow(2, -10 * x)),
  inOutExpo: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? pow(2, 20 * x - 10) / 2 : (2 - pow(2, -20 * x + 10)) / 2),
  inCirc: (x) => 1 - Math.sqrt(1 - x * x),
  outCirc: (x) => Math.sqrt(1 - pow(x - 1, 2)),
  outBack: (x, s = 1.70158) => 1 + (s + 1) * pow(x - 1, 3) + s * pow(x - 1, 2),
  inBack: (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x,
  outBackSoft: (x) => E.outBack(x, 1.1),
  outBackHard: (x) => E.outBack(x, 2.6),
  outElastic: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  // smooth "hermite" step
  smooth: (x) => x * x * (3 - 2 * x),
};

/** Eased progress of t through [a, c]. */
export const ez = (t, a, c, e = E.outCubic) => e(prog(t, a, c));

/** Keyframe track: frames = [[time, value, easeIntoThisFrame?], ...]. */
export function kf(t, frames) {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1, e = E.inOutCubic] = frames[i];
    if (t <= t1) {
      const [t0, v0] = frames[i - 1];
      return lerp(v0, v1, e(prog(t, t0, t1)));
    }
  }
  return frames[frames.length - 1][1];
}

/** Damped spring step response (0 -> 1 with overshoot). x = seconds since release. */
export function spring(x, freq = 2.4, damp = 0.42) {
  if (x <= 0) return 0;
  const w = 2 * Math.PI * freq;
  const wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * x) * (Math.cos(wd * x) + ((damp * w) / wd) * Math.sin(wd * x));
}

/** Decaying oscillation (for shakes / wobbles). Starts at 0, peaks early, dies out. */
export function wobble(x, freq = 9, decay = 7) {
  if (x <= 0) return 0;
  return Math.sin(x * freq * 2 * Math.PI) * Math.exp(-x * decay);
}

/** Deterministic PRNG. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth deterministic 1-D noise in [-1, 1]. */
export function noise1(x, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n) => {
    const s = Math.sin((n + seed * 131.7) * 127.1) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  const u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u);
}

// ---------------------------------------------------------------- DOM
export function el(tag, cls, html, parent) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  if (parent) parent.appendChild(n);
  return n;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function icon(name, size = 32, stroke = 2, extra = '') {
  const inner = ICONS[name];
  if (!inner) throw new Error(`missing icon ${name}`);
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" ${extra}>${inner}</svg>`;
}

const f3 = (v) => Math.round(v * 1000) / 1000;

/**
 * Set transform / opacity / filter on an element from a plain object.
 * Keys: x y z (px), s sx sy (scale), r (deg), rx ry (deg), skx, o (opacity), blur (px), origin.
 * Only writes styles that actually changed.
 */
export function set(node, p) {
  let tr = '';
  if (p.x || p.y || p.z) tr += `translate3d(${f3(p.x || 0)}px,${f3(p.y || 0)}px,${f3(p.z || 0)}px) `;
  if (p.rx) tr += `rotateX(${f3(p.rx)}deg) `;
  if (p.ry) tr += `rotateY(${f3(p.ry)}deg) `;
  if (p.r) tr += `rotate(${f3(p.r)}deg) `;
  if (p.skx) tr += `skewX(${f3(p.skx)}deg) `;
  const sx = (p.s ?? 1) * (p.sx ?? 1);
  const sy = (p.s ?? 1) * (p.sy ?? 1);
  if (sx !== 1 || sy !== 1) tr += `scale(${f3(sx)},${f3(sy)})`;
  tr = tr.trim() || 'none';
  if (node.__tr !== tr) { node.style.transform = tr; node.__tr = tr; }
  if (p.o !== undefined) {
    const o = f3(clamp(p.o));
    if (node.__o !== o) { node.style.opacity = o; node.__o = o; }
    const vis = o <= 0.001 ? 'hidden' : '';
    if (node.__vis !== vis) { node.style.visibility = vis; node.__vis = vis; }
  }
  if (p.blur !== undefined) {
    const f = p.blur > 0.05 ? `blur(${f3(p.blur)}px)` : 'none';
    if (node.__f !== f) { node.style.filter = f; node.__f = f; }
  }
  if (p.origin !== undefined && node.__org !== p.origin) { node.style.transformOrigin = p.origin; node.__org = p.origin; }
}

/** Write a style property only if it changed. */
export function css(node, prop, value) {
  const k = `__css_${prop}`;
  if (node[k] !== value) { node.style.setProperty(prop, value); node[k] = value; }
}

/** Write textContent only if it changed. */
export function text(node, value) {
  if (node.__txt !== value) { node.textContent = value; node.__txt = value; }
}

/** Show/hide via display. */
export function show(node, on) {
  const d = on ? '' : 'none';
  if (node.__disp !== d) { node.style.display = d; node.__disp = d; }
}

/**
 * Split an element's text into masked word/char spans.
 * Returns { words: [{mask, inner, chars:[]}], chars: [] }.
 */
export function splitText(node, { chars = false, mask = true } = {}) {
  const src = node.innerHTML;
  node.innerHTML = '';
  const words = [];
  const allChars = [];
  // Allow simple inline markup: <b>..</b> marks accent words, <br> forces a line break.
  const tokens = src.split(/(<br\s*\/?>|\s+)/i).filter((s) => s !== '');
  let accent = false;
  for (const tok of tokens) {
    if (/^<br/i.test(tok)) { node.appendChild(document.createElement('br')); continue; }
    if (/^\s+$/.test(tok)) { node.appendChild(document.createTextNode(' ')); continue; }
    let w = tok;
    let isAccent = accent;
    if (w.startsWith('<b>')) { isAccent = true; accent = true; w = w.slice(3); }
    if (w.endsWith('</b>')) { accent = false; w = w.slice(0, -4); }
    const m = el('span', mask ? 'wm' : 'wn', null, node);
    const inner = el('span', 'wi' + (isAccent ? ' accent' : ''), null, m);
    const cs = [];
    if (chars) {
      for (const ch of w) { const c = el('span', 'ch', null, inner); c.textContent = ch; cs.push(c); allChars.push(c); }
    } else inner.textContent = w;
    words.push({ mask: m, inner, chars: cs });
  }
  return { words, chars: allChars };
}

// ---------------------------------------------------------------- formatting
export function money(v, dec = 0) {
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
export function int(v) {
  return Math.round(v).toLocaleString('en-US');
}

// ---------------------------------------------------------------- canvas text metrics
const _cv = document.createElement('canvas').getContext('2d');
/** Advance positions of each char of `str` (includes kerning), plus total width. */
export function charLayout(str, font, tracking = 0, space = 0) {
  _cv.font = font;
  const xs = [];
  let extra = 0;
  for (let i = 0; i < str.length; i++) {
    if (i > 0 && str[i - 1] === ' ') extra += space;
    xs.push(_cv.measureText(str.slice(0, i)).width + i * tracking + extra);
  }
  const width = _cv.measureText(str).width + (str.length - 1) * tracking + extra;
  return { xs, width };
}
export function textWidth(str, font, tracking = 0) {
  _cv.font = font;
  return _cv.measureText(str).width + (str.length - 1) * tracking;
}
