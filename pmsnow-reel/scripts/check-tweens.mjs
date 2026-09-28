// Finds tween pairs that fight over the same property of the same element where the
// later-starting tween finishes first — the earlier tween then "wins" and undoes it.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { startServer, openPage, CHROME_ARGS } from './server.mjs';
const { server, port } = await startServer();
const browser = await chromium.launch({ args: CHROME_ARGS });
const page = await openPage(browser, port, process.argv[2] || 'en');
const res = await page.evaluate(() => {
  const SKIP = new Set(['duration', 'ease', 'stagger', 'delay', 'immediateRender', 'yoyo', 'repeat', 'onUpdate', 'onComplete',
    'overwrite', 'lazy', 'startAt', 'runBackwards', 'data', 'id', 'paused', 'transformOrigin', 'xPercent', 'yPercent_', 'parent', 'repeatDelay', 'yoyoEase', 'inherit', 'callbackScope', 'keyframes']);
  const leaves = window.__tl.getChildren(true, true, false);
  const map = new Map();
  const name = (el) => (el.id ? '#' + el.id : '') + (el.className && el.className.baseVal === undefined ? '.' + String(el.className).split(' ').join('.') : '') + (el.textContent ? ` "${el.textContent.trim().slice(0, 18)}"` : '');
  for (const tw of leaves) {
    const s = tw.globalTime(0), e = tw.globalTime(tw.totalDuration());
    const props = Object.keys(tw.vars).filter((k) => !SKIP.has(k));
    for (const el of tw.targets()) {
      if (!el || typeof el !== 'object') continue;
      if (!map.has(el)) map.set(el, []);
      for (const p of props) map.get(el).push({ p, s, e });
    }
  }
  const out = [];
  for (const [el, arr] of map) {
    for (const a of arr) for (const b of arr) {
      if (a === b || a.p !== b.p) continue;
      if (b.s > a.s + 1e-6 && b.s < a.e - 1e-6 && b.e < a.e - 1e-6) out.push(`${name(el)} :: ${a.p}  A[${a.s.toFixed(3)}–${a.e.toFixed(3)}]  B[${b.s.toFixed(3)}–${b.e.toFixed(3)}]`);
    }
  }
  return [...new Set(out)];
});
console.log(res.length ? res.join('\n') : 'no conflicts');
await browser.close(); server.close();
