/* Shared helpers for the TOSNow reel composition.
 * Everything is driven by one paused GSAP timeline plus pure per-frame hooks,
 * so any time t can be rendered deterministically (needed for sub-frame blur
 * and parallel rendering). */

const BPM = 128;
const BEAT = 60 / BPM;          // 0.46875 s
const BAR = BEAT * 4;           // 1.875 s  → 16 bars = 30 s
const DURATION = 16 * BAR;
const B = (n) => n * BEAT;      // beats → seconds
const W = 1080, H = 1920;

const COLORS = {
  or: '#FE4D1E', or2: '#FF7447', or3: '#FFA585',
  ink: '#0D0B0A', ink2: '#171412', ink3: '#211D1A', ink4: '#2C2623',
  paper: '#F6F3EE', dk: '#151110', green: '#22C57F', amber: '#FFB547', red: '#FF4646',
};

/* ── math ─────────────────────────────────────────────── */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const E = {
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};

// Ease for zooms: interpolates size in log space (perceptually constant dolly)
// while other props (position, rotation) follow the same progression.
function logEase(s0, s1, base = (p) => p) {
  const r = s1 / s0;
  return (p) => (s0 * Math.pow(r, base(p)) - s0) / (s1 - s0);
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Stateless hash noise in [-1, 1] for (seed, integer step).
function hash1(seed, n) {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(n | 0, 0xc2b2ae35);
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15; x = Math.imul(x, 0x846ca68b); x ^= x >>> 16;
  return ((x >>> 0) / 4294967296) * 2 - 1;
}
// Damped oscillation used for impacts / camera shake.
function shake(t, t0, amp, freq = 18, decay = 10) {
  if (t < t0) return 0;
  const d = t - t0;
  return amp * Math.exp(-decay * d) * Math.sin(2 * Math.PI * freq * d);
}
function pulse(t, t0, decay = 8) { return t < t0 ? 0 : Math.exp(-decay * (t - t0)); }

/* ── DOM ──────────────────────────────────────────────── */
function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}
function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return [...root.querySelectorAll(sel)]; }
function icon(name, size = 24, stroke = 2, extra = '') {
  if (!window.ICONS[name]) throw new Error('missing icon ' + name);
  return `<svg class="ic" ${extra} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${window.ICONS[name]}</svg>`;
}
function scene(id) {
  const s = el(`<div class="scene" id="${id}"></div>`);
  document.getElementById('scenes').appendChild(s);
  return s;
}
// Wrap each line of text in a mask for slide-up reveals: lines = ['a', 'b'].
function maskLines(lines, cls = '') {
  return lines.map((l) => `<span class="mask ${cls}"><span>${l}</span></span>`).join('');
}
const fmtMoney = (v) => '$' + Math.round(v).toLocaleString('en-US');
const fmtInt = (v) => String(Math.round(v));

/* ── timing registries ───────────────────────────────── */
const CUES = [];          // audio sync cues, exported to audio/cues.json
function cue(type, t, extra = {}) { CUES.push({ type, t: +t.toFixed(4), ...extra }); }
const FRAME_HOOKS = [];   // pure functions of t, run after every seek
function onFrame(fn) { FRAME_HOOKS.push(fn); }

// Number counter driven by time (deterministic).
function countUp(node, t0, t1, from, to, fmt = fmtInt, ease = E.outCubic) {
  onFrame((t) => {
    const v = lerp(from, to, ease(inv(t0, t1, t)));
    const s = fmt(v);
    if (node.__txt !== s) { node.textContent = s; node.__txt = s; }
  });
}
// Deterministic scramble-in for mono labels.
const SCRAMBLE = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/#%&';
function scrambleIn(node, text, t0, dur) {
  onFrame((t) => {
    const p = inv(t0, t0 + dur, t);
    const n = text.length;
    const shown = Math.floor(p * n);
    const step = Math.floor(t * 24);
    let s = '';
    for (let i = 0; i < n; i++) {
      if (i < shown || text[i] === ' ') s += text[i];
      else if (p > 0 && i < shown + 4) s += SCRAMBLE[Math.floor((hash1(i * 31 + 7, step) * 0.5 + 0.5) * SCRAMBLE.length)];
      else s += ' ';
    }
    if (p >= 1) s = text;
    if (node.__txt !== s) { node.textContent = s; node.__txt = s; }
  });
}
