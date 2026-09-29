import { el, proc, tl, C } from '../lib.js';
import { T } from '../timing.js';

// Persistent backdrop: ink base, two drifting ember glows and a slowly
// travelling dot grid (the "canvas" everything sits on).
export function buildBackground({ bg }) {
  el('div', { css: `position:absolute;inset:0;background:${C.ink};` }, bg);

  const g1 = el('div', {
    cls: 'bg-glow',
    css: 'width:1500px;height:1500px;left:-210px;top:-120px;background:radial-gradient(circle, rgba(254,77,30,.20) 0%, rgba(254,77,30,.07) 38%, rgba(254,77,30,0) 68%);',
  }, bg);
  const g2 = el('div', {
    cls: 'bg-glow',
    css: 'width:1300px;height:1300px;left:-110px;top:900px;background:radial-gradient(circle, rgba(255,120,70,.14) 0%, rgba(255,120,70,.05) 40%, rgba(255,120,70,0) 70%);',
  }, bg);
  const grid = el('div', { cls: 'bg-grid' }, bg);

  proc((t) => {
    g1.style.transform = `translate(${Math.sin(t * 0.37) * 140}px,${Math.cos(t * 0.29) * 170}px)`;
    g2.style.transform = `translate(${Math.cos(t * 0.31) * 160}px,${Math.sin(t * 0.43) * 120}px)`;
    grid.style.transform = `translate(${-((t * 16) % 48)}px,${-((t * 26) % 48)}px)`;
  });

  // glow intensity follows the story: dim in the hook, warm after the drop
  tl.set([g1, g2], { opacity: 0.45 }, 0);
  tl.to([g1, g2], { opacity: 1, duration: 0.6, ease: 'power2.out' }, T.drop);
  tl.to(grid, { opacity: 0.55, duration: 0.3 }, T.blitz);
  tl.to(grid, { opacity: 1, duration: 0.4 }, T.fin);
}
