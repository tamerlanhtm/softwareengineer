import { tl, cues, runProcs, samplesAt, loadIcons, proc, shakeAt, rng } from './lib.js';
import { T } from './timing.js';
import { S, LANG } from './i18n.js';
import { ICON_NAMES } from './modules.js';
import { buildBackground } from './scenes/background.js';
import { buildHook } from './scenes/hook.js';
import { buildLogo } from './scenes/logo.js';
import { buildModules } from './scenes/modules.js';
import { buildFeatures } from './scenes/features.js';
import { buildBreadth } from './scenes/breadth.js';
import { buildFinale } from './scenes/finale.js';

const RENDER = new URLSearchParams(location.search).has('render');
const stage = document.getElementById('stage');
const world = document.getElementById('world');
const bg = document.getElementById('bg');
const fx = {
  flash: document.getElementById('flash'),
  grain: document.getElementById('grain'),
  vignette: document.getElementById('vignette'),
};

async function loadFonts() {
  const sample = 'AaBb 0123456789 ?!.,:·—–−$%#@&+ Məktəb Şşİıçğöü Школа Привет';
  const faces = [
    '200 100px "Unbounded Variable"', '500 100px "Unbounded Variable"', '800 100px "Unbounded Variable"', '900 100px "Unbounded Variable"',
    '400 100px "Inter Variable"', '600 100px "Inter Variable"', '800 100px "Inter Variable"',
    '500 100px "JetBrains Mono Variable"', '700 100px "JetBrains Mono Variable"',
  ];
  await Promise.all(faces.map((f) => document.fonts.load(f, sample)));
  await document.fonts.ready;
}

async function build() {
  document.documentElement.lang = S.htmlLang; // Turkic casing (i → İ) for uppercase labels
  document.title = `EMSNow — Instagram Reel (${LANG.toUpperCase()})`;
  await loadFonts();
  await loadIcons(ICON_NAMES);

  const ctx = { world, bg, fx, stage };
  buildBackground(ctx);
  buildHook(ctx);
  buildLogo(ctx);
  buildModules(ctx);
  buildFeatures(ctx);
  buildBreadth(ctx);
  buildFinale(ctx);

  tl.set({}, {}, T.total);

  // world camera: impact shakes
  proc((t) => {
    const s = shakeAt(t);
    world.style.transform = `translate(${s.x.toFixed(2)}px,${s.y.toFixed(2)}px) rotate(${s.r.toFixed(3)}deg)`;
  });
  // film grain: new pattern every output frame (not per sub-frame)
  proc((t, ft) => {
    const f = Math.floor(ft * 30 + 1e-4);
    const r = rng(f * 7919 + 17);
    fx.grain.style.backgroundPosition = `${Math.floor(r() * 384)}px ${Math.floor(r() * 384)}px`;
  });
}

function seek(t, ft = t) {
  tl.totalTime(Math.max(0, Math.min(T.total - 1e-6, t)));
  runProcs(t, ft);
}

window.__ready = (async () => {
  await build();
  gsap.ticker.sleep();
  window.__duration = T.total;
  window.__cues = cues.slice().sort((a, b) => a.t - b.t);
  window.__seek = seek;
  window.__samplesAt = samplesAt;
  window.__checkOverlaps = checkOverlaps;
  seek(0);
  if (!RENDER) preview();
})();

// Real-time preview when the page is opened in a normal browser.
// Space: pause/play · ←/→: step one frame · click: pause at the clicked time.
function preview() {
  document.body.classList.add('preview');
  const fit = () => {
    const s = Math.min(innerWidth / 1080, innerHeight / 1920);
    stage.style.transform = `scale(${s})`;
    stage.style.width = '1080px';
    stage.parentElement.style.height = `${1920 * s}px`;
    stage.style.marginRight = `${1080 * (s - 1)}px`;
    stage.style.marginBottom = `${1920 * (s - 1)}px`;
  };
  fit();
  addEventListener('resize', fit);
  let playing = true;
  let t = 0;
  let last = performance.now();
  const loop = (now) => {
    if (playing) t = (t + (now - last) / 1000) % T.total;
    last = now;
    seek(t);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') playing = !playing;
    if (e.code === 'ArrowRight') { playing = false; t = Math.min(T.total, t + 1 / 30); }
    if (e.code === 'ArrowLeft') { playing = false; t = Math.max(0, t - 1 / 30); }
  });
}

// Debug: list tweens that animate the same property of the same element at
// overlapping times (those break when the renderer seeks backwards inside a
// frame's shutter). Run via tools/check.mjs.
function checkOverlaps() {
  const SKIP = new Set(['duration', 'ease', 'stagger', 'delay', 'yoyo', 'repeat', 'onUpdate', 'immediateRender', 'overwrite', 'transformOrigin', 'svgOrigin', 'lazy', 'callbackScope', 'id', 'data', 'runBackwards', 'startAt', 'parent', 'keyframes', 'repeatDelay', 'paused', 'reversed', 'inherit']);
  const alias = { autoAlpha: 'opacity', scale: 'scale*', scaleX: 'scale*', scaleY: 'scale*' };
  const ids = new WeakMap();
  let next = 0;
  const idOf = (o) => { if (!ids.has(o)) ids.set(o, next++); return ids.get(o); };
  const rows = [];
  for (const tw of tl.getChildren(false, true, false)) {
    const v = tw.vars;
    const targets = tw.targets();
    const start = tw.startTime();
    const dur = tw.duration();
    const total = tw.totalDuration();
    let each = 0;
    if (v.stagger != null) {
      each = typeof v.stagger === 'number' ? v.stagger : v.stagger.each || 0;
    }
    const staggerTotal = each * Math.max(0, targets.length - 1);
    const one = total - staggerTotal;
    const props = [];
    const seen = new Set();
    for (const k of Object.keys(v)) {
      if (SKIP.has(k)) continue;
      if (k === 'attr') for (const a of Object.keys(v.attr)) props.push('attr:' + a);
      else if (k === 'css') for (const a of Object.keys(v.css)) props.push(a);
      else if (!seen.has(alias[k] || k)) { seen.add(alias[k] || k); props.push(alias[k] || k); }
    }
    targets.forEach((t, i) => {
      const a = start + i * each;
      for (const p of props) rows.push({ key: idOf(t) + '|' + p, t, p, a, b: a + one, desc: ((t.id || t.className?.baseVal || t.className || t.tagName || 'obj') + ' ' + (t.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24)) });
    });
  }
  const byKey = {};
  for (const r of rows) (byKey[r.key] ||= []).push(r);
  const out = [];
  for (const list of Object.values(byKey)) {
    list.sort((x, y) => x.a - y.a);
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const cur = list[i];
      if (cur.a < prev.b - 1e-4) out.push(`${cur.p} on "${cur.desc}": [${prev.a.toFixed(3)}–${prev.b.toFixed(3)}] vs [${cur.a.toFixed(3)}–${cur.b.toFixed(3)}]`);
    }
  }
  return out;
}
