import { W, H, FPS, DURATION, frameHooks, cues, shakeAt } from './lib/core.js';
import hook from './scenes/hook.js';
import logoMap from './scenes/logo-map.js';
import journey from './scenes/journey.js';
import security from './scenes/security.js';
import languages from './scenes/languages.js';
import cta from './scenes/cta.js';

const params = new URLSearchParams(location.search);
const RENDER = params.has('render');
if (RENDER) document.body.classList.add('render');

async function loadFonts() {
  // Sample text pulls in every unicode-range subset we use (Latin-Ext covers
  // Azerbaijani: Ə İ Ğ Ş Ç Ö Ü and the manat sign).
  const az = 'ƏİĞŞÇÖÜəığşçöü₼';
  const specs = [
    ['900 100px "Unbounded Variable"', `ABCDEFGHIJKLMNOPQRSTUVWXYZ?.0123456789 Привет ${az}`],
    ['700 100px "Unbounded Variable"', `abcdefghijklmnopqrstuvwxyz ${az}`],
    ['500 40px "Inter Variable"', `abcdefghijklmnopqrstuvwxyz Azərbaycan Oʻzbek Türkçe Русский ${az}`],
    ['700 40px "JetBrains Mono Variable"', `A-0123456789 MRN ${az}`],
  ];
  await Promise.all(specs.map(([f, s]) => document.fonts.load(f, s)));
  await document.fonts.ready;
}

await loadFonts();

const root = document.getElementById('shake');
const master = gsap.timeline({ paused: true });
const ctx = { root, tl: master };

hook(ctx);
logoMap(ctx);
journey(ctx);
security(ctx);
languages(ctx);
cta(ctx);

// Global camera shake from impacts registered by the scenes.
frameHooks.push((t) => {
  const s = shakeAt(t);
  root.style.transform = `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px) rotate(${s.r.toFixed(3)}deg)`;
});

function seek(t) {
  // GSAP skips zero-duration sets that sit exactly on the playhead at 0.
  master.seek(Math.max(t, 1e-4), false);
  for (const fn of frameHooks) fn(t);
}

cues.sort((a, b) => a.t - b.t);
window.__seek = seek;
window.__meta = { fps: FPS, duration: DURATION, width: W, height: H };
window.__cues = cues;
window.__ready = true;

if (!RENDER) {
  // Real-time preview: fit to window, space = pause, arrows = scrub, ?t=12 to jump.
  const vp = document.getElementById('viewport');
  const fit = () => {
    const s = Math.min(innerWidth / W, innerHeight / H);
    vp.style.transform = `translate(-50%, -50%) scale(${s})`;
  };
  fit();
  addEventListener('resize', fit);
  let t = parseFloat(params.get('t') || '0');
  let playing = true;
  let last = performance.now();
  const hud = document.getElementById('hud');
  hud.style.cssText = 'position:fixed;left:10px;bottom:10px;color:#fff;font:12px monospace;opacity:.7';
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') playing = !playing;
    if (e.code === 'ArrowRight') t += e.shiftKey ? 1 : 1 / FPS;
    if (e.code === 'ArrowLeft') t -= e.shiftKey ? 1 : 1 / FPS;
  });
  const loop = (now) => {
    if (playing) t += (now - last) / 1000;
    last = now;
    if (t >= DURATION) t = 0;
    if (t < 0) t = 0;
    seek(t);
    hud.textContent = `${t.toFixed(2)}s  ${playing ? '▶' : '❚❚'}  [space] pause  [←/→] step`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
