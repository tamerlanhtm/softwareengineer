import { el, css } from './lib.js';
import { GROUPS } from './timing.js';

// Eyebrow row shown during the 9 group scenes: a mini logo grid that lights up
// square by square (progress through the 9 groups), the group number and label.
export function buildHud({ layers }) {
  const root = el('div', 'layer', layers.hud);
  const eb = el('div', 'eyebrow', root);
  const grid = el('div', 'minigrid', eb);
  const cells = GROUPS.map((_, i) => {
    const c = el('i', '', grid);
    css(c, { left: (i % 3) * 18 + 'px', top: Math.floor(i / 3) * 18 + 'px' });
    if (i === 8) css(c, { background: 'transparent', boxShadow: 'inset 0 0 0 3.6px rgba(255,255,255,0.16)', borderRadius: '5px' });
    return c;
  });
  const numWrap = el('div', 'lblwrap', eb);
  css(numWrap, { width: '40px' });
  const lblWrap = el('div', 'lblwrap', eb);
  css(lblWrap, { width: '760px' });
  const nums = GROUPS.map((g, i) => el('div', 'num', numWrap, String(i + 1).padStart(2, '0')));
  const lbls = GROUPS.map((g) =>
    el('div', 'lbl', lblWrap, `${g.label}<span style="color:rgba(255,255,255,0.3);margin-left:18px">${g.modules} modules</span>`),
  );
  for (const n of [...nums, ...lbls]) css(n, { position: 'absolute', left: 0, top: '2px' });
  gsap.set([...nums, ...lbls], { yPercent: 130 });
  gsap.set(eb, { opacity: 0 });

  let current = -1;
  return {
    root, eb, cells,
    show(tl, t) {
      tl.fromTo(eb, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out' }, t);
    },
    hide(tl, t) {
      tl.to(eb, { opacity: 0, x: -30, duration: 0.3, ease: 'power2.in' }, t);
    },
    setGroup(tl, t, i) {
      if (current >= 0) {
        tl.to([nums[current], lbls[current]], { yPercent: -130, duration: 0.35, ease: 'power3.in' }, t - 0.12);
      }
      tl.fromTo([nums[i], lbls[i]], { yPercent: 130 }, { yPercent: 0, duration: 0.6, ease: 'expo.out', stagger: 0.04 }, t + 0.1);
      const c = cells[i];
      if (i === 8) {
        tl.to(c, { boxShadow: 'inset 0 0 0 3.6px rgba(254,77,30,1)', duration: 0.2 }, t + 0.1);
      } else {
        tl.to(c, { backgroundColor: '#FE4D1E', duration: 0.2 }, t + 0.1);
      }
      tl.fromTo(c, { scale: 1.9 }, { scale: 1, duration: 0.55, ease: 'back.out(3)' }, t + 0.1);
      current = i;
    },
  };
}
