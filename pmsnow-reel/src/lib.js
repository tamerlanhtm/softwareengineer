// Core helpers for the reel. Everything is driven by ONE paused GSAP timeline
// (`tl`) plus pure functions of time (`onFrame`) so any frame can be rendered
// deterministically by seeking — no wall-clock animation anywhere.
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase.js';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin.js';

gsap.registerPlugin(CustomEase, DrawSVGPlugin);
gsap.config({ force3D: false, nullTargetWarn: false });
gsap.defaults({ lazy: false, ease: 'power3.out', duration: 0.5 });

export { gsap };
export const W = 1080, H = 1920, FPS = 30, DURATION = 30;
export const BPM = 128, BEAT = 60 / BPM, BAR = BEAT * 4;
/** beat number -> seconds */
export const b = (n) => n * BEAT;

export const tl = gsap.timeline({ paused: true });
export const updaters = [];
export const onFrame = (fn) => updaters.push(fn);

/** sound cues consumed by audio/soundtrack.py */
export const cues = [];
export const cue = (type, t, o = {}) => cues.push({ type, t: Math.round(t * 10000) / 10000, ...o });

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
export function add(parent, html) { const e = el(html); parent.appendChild(e); return e; }

export function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp = (x, a = 0, c = 1) => Math.min(c, Math.max(a, x));
export const lerp = (a, c, t) => a + (c - a) * t;
const easeCache = {};
export const E = (name) => (easeCache[name] ||= gsap.parseEase(name));
/** eased progress of a window [t0, t0+dur] */
export const prog = (t, t0, dur, ease) => {
  const p = clamp((t - t0) / dur);
  return ease ? E(ease)(p) : p;
};

/** show element only inside [tIn, tOut) */
export function windowed(node, tIn, tOut) {
  onFrame((t) => {
    const on = t >= tIn && t < tOut;
    if (node.__on !== on) { node.style.display = on ? '' : 'none'; node.__on = on; }
  });
}

/** wrap every character in span.ch (inside span.wd words); keeps nested markup */
export function splitChars(root) {
  const chars = [];
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
          const wd = document.createElement('span');
          wd.className = 'wd';
          for (const c of part) {
            const s = document.createElement('span');
            s.className = 'ch';
            s.textContent = c;
            wd.appendChild(s);
            chars.push(s);
          }
          frag.appendChild(wd);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && !child.classList.contains('nosplit')) {
        walk(child);
      }
    }
  };
  walk(root);
  return chars;
}

/** big masked headline; lines may contain <span class="accent"> */
/** untransformed layout width of an element's content (safe to call before/while things are tweened) */
export function contentWidth(node) {
  const w0 = node.style.width;
  node.style.width = 'max-content';   // intrinsic width, ignores fixed/stretched CSS widths
  const w = node.offsetWidth;
  node.style.width = w0;
  return w;
}
/** shrink `node`'s font-size (never grow) so its content is at most maxW wide; returns the size used */
export function fitWidth(node, maxW, size) {
  const w = contentWidth(node);
  const s = w > maxW ? Math.floor((size * maxW) / w) : size;
  node.style.fontSize = s + 'px';
  return s;
}

export function headline(parent, lines, { top = 300, left = 80, size = 94, cls = '', align = 'left', maxW } = {}) {
  const h = add(parent, `<div class="headline ${cls}" style="top:${top}px;left:${left}px;font-size:${size}px;text-align:${align}"></div>`);
  if (align === 'center') { h.style.left = '0px'; h.style.width = W + 'px'; }
  const lines_ = lines.map((txt) => add(h, `<span class="ln"><span class="ln-in">${txt}</span></span>`));
  // longer translations shrink the whole headline so the widest line still fits
  const limit = maxW ?? (align === 'center' ? W - 120 : W - left - 50);
  const widest = Math.max(...lines_.map((ln) => contentWidth(ln.querySelector('.ln-in'))));
  if (widest > limit) h.style.fontSize = Math.floor((size * limit) / widest) + 'px';
  const chars = lines_.map((ln) => splitChars(ln.querySelector('.ln-in')));
  return { el: h, lines: lines_, chars, all: chars.flat() };
}
export function hlIn(hl, t, { stagger = 0.02, dur = 0.75, lineGap = 0.07, from = 118 } = {}) {
  hl.chars.forEach((cs, i) =>
    tl.fromTo(cs, { yPercent: from, rotate: 7 }, { yPercent: 0, rotate: 0, duration: dur, ease: 'expo.out', stagger }, t + i * lineGap));
}
export function hlOut(hl, t, { stagger = 0.008, dur = 0.3, lineGap = 0.03, to = -118 } = {}) {
  hl.chars.forEach((cs, i) =>
    tl.to(cs, { yPercent: to, rotate: -4, duration: dur, ease: 'power3.in', stagger }, t + i * lineGap));
}

/** numeric counter driven purely by time */
export function counter(node, { from = 0, to, t0, dur, ease = 'expo.out', fmt = (v) => Math.round(v).toLocaleString('en-US') }) {
  onFrame((t) => {
    const s = fmt(lerp(from, to, prog(t, t0, dur, ease)));
    if (node.__s !== s) { node.textContent = s; node.__s = s; }
  });
}

/** vertical rolling digits (odometer). returns element; value driven by fn(t) */
export function odometer(parent, { digits, cls = '', style = '' }) {
  const o = add(parent, `<span class="odo ${cls}" style="display:inline-flex;overflow:hidden;height:1.08em;line-height:1.08em;vertical-align:top;${style}"></span>`);
  const cols = [];
  for (let i = 0; i < digits; i++) {
    const c = add(o, `<span style="display:inline-flex;flex-direction:column;"></span>`);
    for (let d = 0; d < 20; d++) add(c, `<span style="height:1.08em;text-align:center">${d % 10}</span>`);
    cols.push(c);
  }
  return { el: o, cols };
}
/** set odometer to continuous value v (digits roll smoothly) */
export function setOdo(odo, v) {
  const n = odo.cols.length;
  for (let i = 0; i < n; i++) {
    const p = Math.pow(10, n - 1 - i);
    // a digit only rolls while every digit to its right is passing 9 -> 0
    const roll = clamp((v % p) - (p - 1), 0, 1);
    const shown = (Math.floor(v / p) % 10) + roll;
    odo.cols[i].style.transform = `translateY(${(-shown * 1.08).toFixed(4)}em)`;
  }
}

// ---------- camera shake ----------
const shakes = [];
export function shake(t0, dur, amp, freq = 24) { shakes.push({ t0, dur, amp, freq }); }
export function initShake(node) {
  onFrame((t) => {
    let x = 0, y = 0, r = 0;
    for (const s of shakes) {
      const p = (t - s.t0) / s.dur;
      if (p < 0 || p > 1) continue;
      const a = s.amp * (1 - p) * (1 - p);
      const w = 2 * Math.PI * s.freq * (t - s.t0);
      x += a * Math.sin(w + 1.3);
      y += a * Math.sin(w * 1.37 + 0.2);
      r += a * 0.05 * Math.sin(w * 0.83 + 2.1);
    }
    node.style.transform = x || y ? `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg)` : '';
  });
}

// ---------- icons (lucide) ----------
export const ICONS = {};
export async function loadIcons(names) {
  await Promise.all(names.map(async (n) => {
    const r = await fetch(`/node_modules/lucide-static/icons/${n}.svg`);
    if (!r.ok) throw new Error('icon ' + n);
    ICONS[n] = (await r.text()).replace(/<!--[\s\S]*?-->/g, '').trim();
  }));
}
export function icon(name, { size = 32, color = 'currentColor', sw = 2.2, cls = '' } = {}) {
  const svg = ICONS[name]
    .replace(/width="24"/, `width="${size}"`).replace(/height="24"/, `height="${size}"`)
    .replace(/stroke-width="2"/, `stroke-width="${sw}"`).replace(/stroke="currentColor"/, `stroke="${color}"`);
  return `<span class="ico ${cls}" style="width:${size}px;height:${size}px">${svg}</span>`;
}

// ---------- cursor ----------
const CURSOR_SVG = `<svg viewBox="0 0 64 64"><path d="M14 8 L14 50 L25 39.5 L32.5 56 L40 52.6 L32.8 36.4 L48 36 Z" fill="#fff" stroke="#0b0b0f" stroke-width="3.2" stroke-linejoin="round"/></svg>`;
export function makeCursor(parent) {
  const c = add(parent, `<div class="cursor">${CURSOR_SVG}</div>`);
  const rip = add(parent, `<div class="ripple"></div>`);
  gsap.set(c, { x: 0, y: 0, opacity: 0, transformOrigin: '14px 8px' });
  return { el: c, rip };
}
/** click at current cursor tip position (x,y are the tip) */
export function click(cur, t, x, y, { color } = {}) {
  tl.to(cur.el, { scale: 0.82, duration: 0.07, ease: 'power2.in' }, t - 0.07)
    .to(cur.el, { scale: 1, duration: 0.25, ease: 'back.out(3)' }, t);
  if (color) gsap.set(cur.rip, { borderColor: color });
  tl.fromTo(cur.rip, { left: x, top: y, scale: 0.2, opacity: 1 }, { scale: 1.3, opacity: 0, duration: 0.5, ease: 'expo.out' }, t);
  cue('click', t);
}
/** move cursor so its tip goes to (x,y) */
export function moveTo(cur, t, x, y, dur = 0.5, ease = 'power3.inOut') {
  tl.to(cur.el, { x: x - 14, y: y - 8, duration: dur, ease }, t);
}

/** clip `layer` (untransformed, full-stage) to the on-screen box of `target` */
export function clipToTarget(layer, target, tIn, tOut, radiusRatio = 0) {
  onFrame((t) => {
    if (t < tIn || t >= tOut) {
      if (layer.__clip) { layer.style.clipPath = ''; layer.__clip = false; }
      return;
    }
    const r = target.getBoundingClientRect();
    const L = layer.getBoundingClientRect();
    const sx = L.width / W || 1, sy = L.height / H || 1;
    const top = (r.top - L.top) / sy, left = (r.left - L.left) / sx;
    const bottom = H - (r.bottom - L.top) / sy, right = W - (r.right - L.left) / sx;
    const rad = (r.width / sx) * radiusRatio;
    layer.style.clipPath = `inset(${top.toFixed(2)}px ${right.toFixed(2)}px ${bottom.toFixed(2)}px ${left.toFixed(2)}px round ${rad.toFixed(2)}px)`;
    layer.__clip = true;
  });
}

/** text that decodes from random glyphs into the final string */
export function scramble(node, text, t0, dur, { seed = 7, charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#/%*' } = {}) {
  onFrame((t, frame) => {
    const p = clamp((t - t0) / dur);
    if (t < t0) { if (node.__s !== '') { node.textContent = ''; node.__s = ''; } return; }
    const n = text.length;
    const revealed = Math.floor(p * n);
    const r = rng(seed + (frame | 0) * 131);
    let s = '';
    for (let i = 0; i < n; i++) {
      if (i < revealed || text[i] === ' ') s += text[i];
      else if (i < revealed + 6) s += charset[Math.floor(r() * charset.length)];
    }
    if (node.__s !== s) { node.textContent = s; node.__s = s; }
  });
}

/** typewriter: reveals characters over [t0, t0+dur] */
export function typewriter(node, text, t0, dur) {
  onFrame((t) => {
    const n = Math.round(prog(t, t0, dur) * text.length);
    const s = text.slice(0, n);
    if (node.__s !== s) { node.textContent = s; node.__s = s; }
  });
}
