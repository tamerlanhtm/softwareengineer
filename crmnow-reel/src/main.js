// Orchestrates the reel: builds every scene once, then renders any time `t` on demand.
//   window.__render(t)  -> draws the frame at t seconds (used by scripts/render.mjs)
//   window.__cues       -> audio cue list (used by scripts/soundtrack.py)
// Opened directly in a browser it shows a small player for previewing in real time.
import { el, set, css, kf, DURATION, noise1 } from './engine.js';
import { buildCursor, buildRipples, buildBursts, cameraAt, flashAt } from './components.js';
import hook from './scenes/hook.js';
import logo from './scenes/logo.js';
import leads from './scenes/leads.js';
import pipeline from './scenes/pipeline.js';
import billing from './scenes/billing.js';
import dashboard from './scenes/dashboard.js';
import automation from './scenes/automation.js';
import modules from './scenes/modules.js';
import endcard from './scenes/endcard.js';
import { gridWipe } from './scenes/wipe.js';
import { LANG } from './i18n.js';
import { b } from './engine.js';

const wipe = gridWipe({ id: 'wipe', t0: b(43) - 0.34 });
const SCENES = [hook, logo, leads, pipeline, billing, dashboard, wipe, automation, modules, endcard];

async function loadFonts() {
  const sample = 'AaBbCc 0123 $€₼ Привет Salam Azərbaycan Türkçe ğüşıöç ✓→·';
  await Promise.all([
    document.fonts.load('800 100px "Inter Tight Variable"', sample),
    document.fonts.load('600 100px "Inter Tight Variable"', sample),
    document.fonts.load('400 40px "Inter Variable"', sample),
    document.fonts.load('700 40px "Inter Variable"', sample),
    document.fonts.load('600 30px "JetBrains Mono Variable"', sample),
  ]);
  await document.fonts.ready;
}

function buildBackground(cam) {
  const layer = el('div', 'layer bg-base', null, cam);
  layer.style.zIndex = 0;
  const glowA = el('div', 'glow glow-a', null, layer);
  const glowB = el('div', 'glow glow-b', null, layer);
  const dots = el('div', 'layer bg-dots', null, layer);
  return {
    layer,
    update(t) {
      // slow, organic drift so the backdrop never feels static
      set(glowA, { x: -560 + noise1(t * 0.35, 1) * 140 + kf(t, [[0, -120], [30, 260]]), y: 1080 + noise1(t * 0.3, 2) * 120 - kf(t, [[0, 0], [30, 380]]), s: 1 + 0.08 * Math.sin(t * 1.3) });
      set(glowB, { x: 420 + noise1(t * 0.25, 3) * 160, y: -380 + noise1(t * 0.28, 4) * 140, o: 0.9 });
      set(dots, { y: -((t * 14) % 44), o: 1 });
    },
  };
}

async function main() {
  document.documentElement.lang = LANG;          // locale-aware text-transform (i -> İ in Azerbaijani)
  document.body.classList.add(`lang-${LANG}`);
  await loadFonts();
  const stage = document.getElementById('stage');
  const cam = document.getElementById('cam');
  const fx = document.getElementById('fx');

  const bg = buildBackground(cam);
  const ctx = { shared: {} };
  const clicks = [];
  const bursts = [];
  const hits = [];
  const flashes = [];
  const cues = [];

  for (const sc of SCENES) {
    sc.layer = el('section', 'scene', null, cam);
    sc.layer.id = `sc-${sc.id}`;
    sc.layer.style.zIndex = sc.z;
    sc.fx = { clicks: [], bursts: [], hits: [], flashes: [], cues: [] };
    sc.build(sc.layer, ctx, sc.fx);
    clicks.push(...sc.fx.clicks);
    bursts.push(...sc.fx.bursts);
    hits.push(...sc.fx.hits);
    flashes.push(...sc.fx.flashes);
    cues.push(...sc.fx.cues.map((c) => ({ ...c, scene: sc.id })));
  }

  const top = el('div', 'layer', null, cam);
  top.style.zIndex = 85;
  const particles = buildBursts(top, bursts);
  const ripples = buildRipples(top, clicks);
  ctx.cursor = buildCursor(top);

  const vignette = el('div', 'vignette', null, fx);
  const flash = el('div', 'flash', null, fx);

  function render(t) {
    t = Math.max(0, Math.min(DURATION - 1e-6, t));
    bg.update(t);
    for (const sc of SCENES) {
      const on = t >= sc.a - (sc.pre || 0) && t < sc.b + (sc.post || 0);
      if (on !== sc._on) { sc.layer.style.display = on ? '' : 'none'; sc._on = on; }
      if (on) sc.update(t - sc.a, t, ctx);
    }
    particles.update(t);
    ripples.update(t);
    ctx.cursor.apply();
    const c = cameraAt(t, hits);
    set(cam, { x: c.x, y: c.y, s: c.s, r: c.r });
    const f = flashAt(t, flashes);
    css(flash, 'background', f.color);
    set(flash, { o: f.o });
    // lighter vignette over the bright (white / orange) scenes
    set(vignette, { o: kf(t, [[3.8, 1], [4.0, 0.14], [5.3, 0.14], [5.55, 1], [24.6, 1], [25.1, 0.45]]) });
  }

  window.__render = render;
  window.__cues = cues.sort((a, b) => a.t - b.t);
  window.__meta = { duration: DURATION, lang: LANG, scenes: SCENES.map((s) => ({ id: s.id, a: s.a, b: s.b })) };

  const params = new URLSearchParams(location.search);
  if (params.has('t')) render(parseFloat(params.get('t')));
  else render(0);

  if (!window.__capture) setupPlayer(stage, render);
  window.__ready = true;
}

function setupPlayer(stage, render) {
  const ui = document.getElementById('player');
  ui.hidden = false;
  const fit = () => {
    const k = Math.min(window.innerWidth / 1080, (window.innerHeight - 80) / 1920);
    stage.style.transformOrigin = '0 0';
    stage.style.transform = `translate(${(window.innerWidth - 1080 * k) / 2}px, 8px) scale(${k})`;
  };
  fit();
  window.addEventListener('resize', fit);
  const scrub = document.getElementById('scrub');
  const tc = document.getElementById('tc');
  const pp = document.getElementById('pp');
  let playing = false;
  let t0 = 0;
  let start = 0;
  const tick = (now) => {
    if (!playing) return;
    const t = (t0 + (now - start) / 1000) % DURATION;
    scrub.value = t; tc.textContent = t.toFixed(2);
    render(t);
    requestAnimationFrame(tick);
  };
  pp.onclick = () => {
    playing = !playing; pp.textContent = playing ? '❚❚' : '▶';
    if (playing) { t0 = parseFloat(scrub.value); start = performance.now(); requestAnimationFrame(tick); }
  };
  scrub.oninput = () => { playing = false; pp.textContent = '▶'; tc.textContent = (+scrub.value).toFixed(2); render(+scrub.value); };
}

main().catch((e) => { console.error(e); window.__error = String(e && e.stack || e); });
