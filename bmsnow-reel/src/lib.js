// Shared helpers for the composition. Everything is a pure function of time:
// scenes add tweens to one paused GSAP master timeline, and window.__seek(t)
// renders any frame deterministically.

export const W = 1080;
export const H = 1920;

export const COLOR = {
  ink: '#0D0B0A',
  ink2: '#16110F',
  ink3: '#211A17',
  orange: '#FE4D1E',
  orange2: '#FF7447',
  orange3: '#FF9B78',
  peach: '#FFC3AE',
  blush: '#FFE3D8',
  cream: '#FFF4EE',
  white: '#FFFFFF',
  textDark: '#1C1512',
};

// ---------- deterministic randomness ----------
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- DOM ----------
export function el(tag, cls, parent, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
export function css(e, styles) {
  Object.assign(e.style, styles);
  return e;
}
export function svgEl(tag, attrs = {}, parent) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
export function measure(text, font, letterSpacing = '0') {
  const s = el('span', '', document.body, text);
  css(s, { position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap', font, letterSpacing });
  const w = s.getBoundingClientRect().width;
  s.remove();
  return w;
}

// ---------- icons (Lucide) ----------
const ICONS = {};
export async function loadIcons(names) {
  await Promise.all(
    names.map(async (n) => {
      const r = await fetch(`node_modules/lucide-static/icons/${n}.svg`);
      if (!r.ok) throw new Error('missing icon ' + n);
      ICONS[n] = (await r.text()).replace(/<!--[\s\S]*?-->/g, '').trim();
    }),
  );
}
export function icon(name, size = 32, stroke = 2.2, color = 'currentColor') {
  const s = ICONS[name];
  if (!s) throw new Error('icon not loaded: ' + name);
  const svg = s
    .replace(/width="24"/, `width="${size}"`)
    .replace(/height="24"/, `height="${size}"`)
    .replace(/stroke-width="2"/, `stroke-width="${stroke}"`)
    .replace(/stroke="currentColor"/, `stroke="${color}"`);
  return `<span class="ico">${svg}</span>`;
}

// ---------- audio cue sheet (read by scripts/audio.py) ----------
export const cues = [];
export function cue(t, type, extra = {}) {
  cues.push({ t: Math.round(t * 1000) / 1000, type, ...extra });
}

// ---------- per-frame hooks for procedural bits (canvas, counters) ----------
export const frameHooks = [];
export function onFrame(fn) {
  frameHooks.push(fn);
}

// ---------- hard cuts: the motion-blur shutter never straddles these ----------
export const cuts = [];
export function hardCut(t) {
  cuts.push(t);
}

// ---------- motion-blur sample overrides ----------
export const blurBoost = [];
export function boostBlur(t0, t1, samples) {
  blurBoost.push({ t0, t1, samples });
}

// ---------- easing helpers ----------
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (k) => k * k * (3 - 2 * k);
export const easeOutExpo = (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
export const easeInOutCubic = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const prog = (t, t0, t1) => clamp((t - t0) / (t1 - t0));

// ---------- logo geometry, measured from the brand file ----------
// unit = one square (100). gap 51, filled corner r 18.3,
// hollow square: outer r 31.6, ring 24.4 thick, inner r ~7.
export const LOGO = { S: 100, G: 51, R: 18.3, HR: 31.6, RING: 24.4, IR: 7, SIZE: 402 };
export function logoCell(i) {
  const c = i % 3;
  const r = Math.floor(i / 3);
  return { x: c * (LOGO.S + LOGO.G), y: r * (LOGO.S + LOGO.G) };
}
export function rrPath(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (r === 0) return `M${x},${y}H${x + w}V${y + h}H${x}Z`;
  return (
    `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}` +
    `V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}` +
    `H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}` +
    `V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`
  );
}
// square of size s at (x,y) with outer radius R and a centered hole of size hole (radius ir)
export function ringPath(x, y, s, R, hole, ir) {
  let d = rrPath(x, y, s, s, R);
  if (hole > 0.01) {
    const o = (s - hole) / 2;
    d += rrPath(x + o, y + o, hole, hole, Math.min(ir, hole / 2));
  }
  return d;
}

// Static logo markup (for HUD / end card). size = rendered width in px.
export function logoSVG(size, color = COLOR.orange) {
  let paths = '';
  for (let i = 0; i < 9; i++) {
    const { x, y } = logoCell(i);
    paths +=
      i === 8
        ? `<path fill-rule="evenodd" d="${ringPath(x, y, 100, LOGO.HR, 100 - 2 * LOGO.RING, LOGO.IR)}"/>`
        : `<path d="${rrPath(x, y, 100, 100, LOGO.R)}"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 402 402" fill="${color}">${paths}</svg>`;
}

// ---------- reusable animated pieces ----------

// Headline built from masked lines. Returns the root and inner line spans.
export function headline(parent, lines, cls = 'headline') {
  const root = el('div', cls, parent);
  const spans = lines.map((html) => {
    const m = el('span', 'mask', root);
    return el('span', '', m, html);
  });
  return { root, spans };
}
export function lineIn(tl, spans, t, { stagger = 0.07, dur = 0.75, ease = 'expo.out' } = {}) {
  tl.fromTo(spans, { yPercent: 115, rotate: 4 }, { yPercent: 0, rotate: 0, duration: dur, ease, stagger }, t);
}
export function lineOut(tl, spans, t, { stagger = 0.04, dur = 0.32, ease = 'power3.in' } = {}) {
  tl.to(spans, { yPercent: -115, duration: dur, ease, stagger, immediateRender: false }, t);
}

export function chips(parent, items, top) {
  const box = el('div', 'chips', parent);
  if (top != null) box.style.top = top + 'px';
  const list = items.map((txt) => el('div', 'chip', box, `<i></i>${txt}`));
  return { box, list };
}
export function chipsIn(tl, list, t, stagger = 0.045) {
  tl.fromTo(
    list,
    { opacity: 0, y: 30, scale: 0.7 },
    { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(2.2)', stagger },
    t,
  );
}

export function countTo(tl, target, t, dur, from, to, fmt, ease = 'power3.out') {
  const o = { v: from };
  target.textContent = fmt(from);
  tl.to(o, { v: to, duration: dur, ease, onUpdate: () => (target.textContent = fmt(o.v)) }, t);
}

export const money = (v, d = 2) =>
  '₼ ' + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

// Deterministic text scramble (random glyphs are seeded by frame number so
// motion-blur sub-samples and parallel render workers agree).
const SCR = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz#%&*{}_';
export function scrambleTo(tl, target, from, to, t, dur, fps = 30) {
  const o = { p: 0 };
  target.textContent = from;
  tl.to(o, {
    p: 1, duration: dur, ease: 'none',
    onUpdate: () => {
      const p = o.p;
      if (p <= 0) return void (target.textContent = from);
      if (p >= 1) return void (target.textContent = to);
      const r = rng(Math.floor(tl.time() * fps) * 7919 + to.length);
      const len = Math.round(from.length + (to.length - from.length) * p);
      const fixed = Math.floor(to.length * p);
      let s = to.slice(0, fixed);
      for (let i = fixed; i < len; i++) s += SCR[Math.floor(r() * SCR.length)];
      target.textContent = s;
    },
  }, t);
}
