import { gsap, tl, updaters, cues, onFrame, FPS, DURATION, W, H, loadIcons, initShake, $, b, add } from './lib.js';
import { buildHud } from './hud.js';
import * as hook from './scenes/hook.js';
import * as logo from './scenes/logo.js';
import * as dash from './scenes/dashboard.js';
import * as resv from './scenes/reservations.js';
import * as desk from './scenes/frontdesk.js';
import * as hk from './scenes/housekeeping.js';
import * as bill from './scenes/billing.js';
import * as audit from './scenes/audit.js';
import * as guest from './scenes/guests.js';
import * as lang from './scenes/languages.js';
import * as mods from './scenes/modules.js';
import * as cta from './scenes/cta.js';

const ICON_LIST = [
  'calendar-x', 'spray-can', 'file-x', 'user-round', 'credit-card', 'moon', 'star', 'trending-up', 'wrench',
  'package', 'users', 'phone-missed', 'bed-double', 'check', 'check-check', 'sparkles', 'brush-cleaning',
  'banknote', 'landmark', 'receipt', 'qr-code', 'globe', 'languages', 'layout-dashboard', 'calendar-days',
  'concierge-bell', 'door-open', 'utensils', 'flower-2', 'presentation', 'chart-line', 'shield-check', 'bell',
  'file-text', 'plug', 'settings', 'arrow-right', 'arrow-up-right', 'arrow-down-left', 'user', 'sun', 'split',
  'shield', 'users-round', 'hotel', 'crown', 'heart', 'message-circle', 'clock', 'circle-check', 'mail', 'send',
  'at-sign', 'mouse-pointer-2', 'building-2', 'boxes', 'cable', 'cog', 'chart-no-axes-combined', 'badge-percent',
];

function setupGrain() {
  const c = $('#grain');
  const ctx = c.getContext('2d');
  const frames = [];
  let seed = 1234567;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let k = 0; k < 8; k++) {
    const img = ctx.createImageData(c.width, c.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (rand() + rand() + rand()) / 3 * 255;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    frames.push(img);
  }
  let last = -1;
  onFrame((t, frame) => {
    const k = ((frame | 0) % frames.length + frames.length) % frames.length;
    if (k !== last) { ctx.putImageData(frames[k], 0, 0); last = k; }
  });
}

async function init() {
  const sample = 'AaBbZz09 əƏşŞğĞıİöÖüÜçÇ ДобропжалвтьУ№₼$%★';
  await Promise.all([
    document.fonts.load('800 100px "Unbounded Variable"', sample),
    document.fonts.load('500 100px "Unbounded Variable"', sample),
    document.fonts.load('600 40px "Inter Variable"', sample),
    document.fonts.load('500 30px "JetBrains Mono"', 'AZaz09·—/@.'),
    document.fonts.load('700 30px "JetBrains Mono"', 'AZaz09·—/@.'),
  ]);
  await document.fonts.ready;
  await loadIcons(ICON_LIST);

  const world = $('#world');
  const ctx = { world, overlay: $('#overlay'), hud: buildHud($('#hud')), gl: $('#gl') };
  initShake($('#shake'));

  hook.build(ctx);
  logo.build(ctx);
  dash.build(ctx);
  resv.build(ctx);
  desk.build(ctx);
  hk.build(ctx);
  bill.build(ctx);
  audit.build(ctx);
  guest.build(ctx);
  lang.build(ctx);
  await mods.build(ctx);
  cta.build(ctx);

  // make sure the master timeline spans the whole piece
  tl.set({}, {}, DURATION);

  window.__seek = (t, frame = Math.round(t * FPS)) => {
    tl.seek(t, true);
    for (const u of updaters) u(t, frame);
  };
  window.__cues = cues;
  window.__tl = tl;
  window.__duration = DURATION;
  window.__fps = FPS;
  window.__seek(0, 0);
  window.__ready = true;
}

init().catch((e) => { console.error(e); window.__error = String(e && e.stack || e); });
