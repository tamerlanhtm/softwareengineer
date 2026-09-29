// Shared helpers for the reel: DOM builder, deterministic randomness,
// per-frame hooks, sound cues and a small toolkit of motion utilities.

gsap.registerPlugin(CustomEase, SplitText);
gsap.config({ force3D: false, nullTargetWarn: false });
gsap.ticker.lagSmoothing(0);

// House eases: one family so the whole piece moves with the same "hand".
CustomEase.create('snap', 'M0,0 C0.12,0.72 0.22,1 1,1');
CustomEase.create('whip', 'M0,0 C0.62,0 0.28,1 1,1');
CustomEase.create('slam', 'M0,0 C0.05,0.6 0.12,1.12 0.3,1.04 0.45,0.98 0.62,1 1,1');

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 30;
export const BPM = 120;
export const BEAT = 60 / BPM;

/* ---------- DOM ---------- */

// h('div.card.dark', {style: {left: '10px'}}, child, 'text')
export function h(sel, attrs = {}, ...children) {
  const tag = (sel.match(/^[a-z][a-z0-9]*/i) || ['div'])[0];
  const id = (sel.match(/#([\w-]+)/) || [])[1];
  const classes = [...sel.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
  const el = document.createElement(tag);
  if (id) el.id = id;
  if (classes.length) el.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function svg(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

export const px = (v) => `${v}px`;

/* ---------- randomness ---------- */

export function rng(seed = 1) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (lo, hi) => lo + (hi - lo) * next();
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.sign = () => (next() < 0.5 ? -1 : 1);
  return next;
}

// Smooth 1D value noise, deterministic.
export function noise1(x, seed = 0) {
  const hash = (n) => {
    const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return (hash(i) * (1 - u) + hash(i + 1) * u) * 2 - 1;
}

/* ---------- math ---------- */

export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (name) => gsap.parseEase(name);

// Eased progress of t inside [t0, t1].
export function prog(t, t0, t1, e = 'none') {
  const p = clamp((t - t0) / (t1 - t0));
  return typeof e === 'function' ? e(p) : gsap.parseEase(e)(p);
}

/* ---------- frame hooks & cues ---------- */

export const frameHooks = [];
export function onFrame(fn) { frameHooks.push(fn); }

export const cues = [];
// Sound-design cue: the audio script places a sample of `type` at time t.
export function cue(t, type, extra = {}) { cues.push({ t: +t.toFixed(4), type, ...extra }); }

/* ---------- camera shake ---------- */

const impacts = [];
export function impact(t, amp = 18, decay = 9, freq = 19) { impacts.push({ t, amp, decay, freq }); }
export function shakeAt(t) {
  let x = 0, y = 0, r = 0;
  for (const im of impacts) {
    const d = t - im.t;
    if (d < 0 || d > 1.2) continue;
    const env = im.amp * Math.exp(-im.decay * d);
    x += env * Math.sin(d * im.freq * 6.283 + im.t * 3.1);
    y += env * 0.8 * Math.sin(d * im.freq * 1.13 * 6.283 + 1.7 + im.t);
    r += env * 0.035 * Math.sin(d * im.freq * 0.87 * 6.283 + 0.4);
  }
  return { x, y, r };
}

/* ---------- text ---------- */

// Split text into per-character spans that can be animated individually.
export function splitChars(el, { wrapWords = true } = {}) {
  const text = el.textContent;
  el.textContent = '';
  const chars = [];
  const words = text.split(' ');
  words.forEach((w, wi) => {
    const word = h('span', { style: { display: 'inline-block', whiteSpace: 'nowrap' } });
    for (const ch of w) {
      const c = h('span', { style: { display: 'inline-block' } }, ch);
      word.append(c);
      chars.push(c);
    }
    el.append(wrapWords ? word : word);
    if (wi < words.length - 1) el.append(' ');
  });
  return chars;
}

// Width of an element's text itself (not of its box).
export function textWidth(el) {
  const r = document.createRange();
  r.selectNodeContents(el);
  return r.getBoundingClientRect().width;
}

// Shrink the font only when the text would be wider than maxW.
export function fitWidth(el, maxW) {
  const w = textWidth(el);
  if (w > maxW) {
    const fs = parseFloat(getComputedStyle(el).fontSize);
    el.style.fontSize = `${((fs * maxW) / w).toFixed(1)}px`;
  }
  return el;
}

// Wrap an element's children in an overflow mask so it can slide in from below.
export function masked(el, pad = 0.18) {
  const m = h('span', {
    style: {
      display: 'inline-block',
      overflow: 'hidden',
      verticalAlign: 'top',
      paddingBottom: `${pad}em`,
      marginBottom: `${-pad}em`,
      paddingTop: `${pad * 0.4}em`,
      marginTop: `${-pad * 0.4}em`,
    },
  });
  el.parentNode.insertBefore(m, el);
  m.append(el);
  return m;
}

/* ---------- icons (24px grid, stroke) ---------- */

const ic = (d, sw = 2.4) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

export const ICONS = {
  calendar: ic('<rect x="3.5" y="5" width="17" height="15" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  queue: ic('<rect x="3.5" y="4" width="17" height="16" rx="3.5"/><path d="M8 9h8M8 13h8M8 17h4"/>'),
  notes: ic('<path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M8.5 11h7M8.5 15h7M8.5 7.5h4"/>'),
  tooth: ic('<path d="M7.5 3.8c-2.4 0-4 1.8-4 4.3 0 2.1.9 3.3 1.5 5 .7 2 .8 6.9 2.6 6.9 1.6 0 1.5-4.3 2.5-5.6.5-.6 1.3-.6 1.8 0 1 1.3.9 5.6 2.5 5.6 1.8 0 1.9-4.9 2.6-6.9.6-1.7 1.5-2.9 1.5-5 0-2.5-1.6-4.3-4-4.3-1.7 0-2.6 1-4.5 1s-2.8-1-4.5-1z"/>', 2.2),
  flask: ic('<path d="M9.5 3.5h5M10.5 3.5v5.6L5.2 18.2A1.8 1.8 0 0 0 6.8 21h10.4a1.8 1.8 0 0 0 1.6-2.8L13.5 9.1V3.5"/><path d="M7.6 15h8.8"/>'),
  pill: ic('<rect x="2.8" y="8.2" width="18.4" height="7.6" rx="3.8" transform="rotate(-40 12 12)"/><path d="M9.2 9.2l5.6 5.6"/>'),
  receipt: ic('<path d="M6 3h12v18l-2.5-1.6L13 21l-2-1.6L9 21l-2.5-1.6L6 21z"/><path d="M9 8h6M9 12h6"/>'),
  chart: ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  lock: ic('<rect x="4.5" y="10.5" width="15" height="10.5" rx="3"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
  check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 3.2),
};
