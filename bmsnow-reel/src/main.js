import { el, cues, frameHooks, blurBoost, cuts, loadIcons, cue, onFrame } from './lib.js';
import { T, DURATION } from './timing.js';
import { buildBackground } from './bg.js';
import { buildHud } from './hud.js';
import { LANG, translateTree, fitHeadlines } from './i18n.js';
import hook from './scenes/s01_hook.js';
import logo from './scenes/s02_logo.js';
import bookings from './scenes/s03_bookings.js';
import clients from './scenes/s04_clients.js';
import catalogue from './scenes/s05_catalogue.js';
import staff from './scenes/s06_staff.js';
import finance from './scenes/s07_finance.js';
import accounting from './scenes/s08_accounting.js';
import messaging from './scenes/s09_messaging.js';
import analytics from './scenes/s10_analytics.js';
import admin from './scenes/s11_admin.js';
import numbers from './scenes/s12_numbers.js';
import cta from './scenes/s13_cta.js';

const ICONS = [
  'scissors', 'calendar', 'calendar-check', 'clock', 'check', 'user', 'users', 'gift', 'package', 'crown',
  'shopping-bag', 'door-open', 'armchair', 'sparkles', 'receipt', 'credit-card', 'banknote', 'wallet', 'landmark',
  'lock', 'lock-keyhole', 'mail', 'mail-check', 'send', 'bell', 'chart-column', 'chart-line', 'chart-pie',
  'trending-up', 'shield-check', 'key', 'globe', 'languages', 'layout-grid', 'file-signature', 'signature',
  'clipboard-check', 'star', 'heart', 'repeat', 'coins', 'percent', 'briefcase', 'stethoscope', 'flower',
  'dumbbell', 'smartphone', 'mouse-pointer-2', 'arrow-right', 'arrow-up-right', 'list-checks', 'file-text',
  'book-open', 'scale', 'calculator', 'tag', 'user-check', 'megaphone', 'message-square', 'timer', 'zap',
  'badge-check', 'circle-check-big', 'at-sign', 'link', 'hand-coins', 'notebook-pen', 'ticket', 'store',
  'map-pin', 'settings', 'toggle-right', 'brush', 'droplet', 'leaf', 'inbox', 'user-cog', 'award', 'undo',
  'rotate-ccw', 'refresh-cw', 'hourglass', 'piggy-bank', 'building', 'palette', 'house', 'infinity', 'layers',
];

async function loadFonts() {
  const sample = 'AaBbÇçƏəĞğİıÖöŞşÜüʻ₼₺₽ЖжЯя0123456789';
  const loads = [];
  for (const w of [500, 600, 700, 800, 900]) loads.push(document.fonts.load(`${w} 40px Unbounded`, sample));
  for (const w of [400, 500, 600, 700, 800, 900]) loads.push(document.fonts.load(`${w} 40px "Inter Variable"`, sample));
  await Promise.all(loads);
  await document.fonts.ready;
}

async function init() {
  await loadFonts();
  await loadIcons(ICONS);
  gsap.registerPlugin(CustomEase, SplitText, DrawSVGPlugin, MorphSVGPlugin, ScrambleTextPlugin);
  CustomEase.create('snap', 'M0,0 C0.12,0.9 0.2,1 1,1');
  CustomEase.create('whip', 'M0,0 C0.75,0 0.25,1 1,1');
  CustomEase.create('slam', 'M0,0 C0.5,0 0.6,1.25 0.78,1.06 0.86,0.98 0.94,0.99 1,1');

  const stage = document.getElementById('stage');
  const layers = {
    bg: el('div', 'layer', stage),
    scenes: el('div', 'layer', stage),
    hud: el('div', 'layer', stage),
    fx: el('div', 'layer', stage),
  };
  layers.hud.id = 'hud';
  // explicit stacking contexts so scene z-indexes stay inside the scenes layer
  Object.values(layers).forEach((l, i) => (l.style.zIndex = i));
  const tl = gsap.timeline({ paused: true });
  const ctx = { stage, layers, tl, T, cue, onFrame };

  ctx.bg = buildBackground(ctx);
  ctx.hud = buildHud(ctx);
  for (const scene of [hook, logo, bookings, clients, catalogue, staff, finance, accounting, messaging, analytics, admin, numbers, cta]) {
    scene(ctx);
  }
  tl.set({}, {}, DURATION);
  document.documentElement.lang = LANG; // correct casing for uppercase labels (az: i -> İ)
  translateTree(stage);
  fitHeadlines(stage);

  window.__duration = DURATION;
  window.__cues = cues.sort((a, b) => a.t - b.t);
  window.__blurBoost = blurBoost;
  window.__cuts = cuts;
  window.__seek = (t) => {
    // never sit exactly on 0: zero-duration sets placed at 0 only fire once the playhead moves
    const tt = Math.max(t, 1e-4);
    tl.seek(tt, false);
    for (const fn of frameHooks) fn(tt);
  };

  const q = new URLSearchParams(location.search);
  if (q.has('play')) {
    const t0 = performance.now() - (parseFloat(q.get('play')) || 0) * 1000;
    const loop = () => {
      window.__seek(((performance.now() - t0) / 1000) % DURATION);
      requestAnimationFrame(loop);
    };
    loop();
  } else {
    window.__seek(parseFloat(q.get('t')) || 0);
  }
  window.__ready = true;
}

init().catch((e) => {
  console.error(e);
  document.body.innerHTML = `<pre style="color:#fff;font-size:28px;white-space:pre-wrap">${e.stack}</pre>`;
});
