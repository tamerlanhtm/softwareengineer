// Top-left HUD: a mini 3x3 logo that fills one square per feature scene,
// plus a rolling "01  DASHBOARD" label.
import { tl, add, gsap, b } from './lib.js';

export const HUD_ON = b(12) - 0.05;
export const HUD_OFF = b(44);

export function buildHud(root) {
  const tracker = add(root, `<div class="tracker"></div>`);
  const sq = [];
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
    const s = add(tracker, `<i style="left:${i * 22}px;top:${j * 22}px"></i>`);
    sq.push(s);
  }
  // 9th square is the logo's hollow square — always an outline
  sq[8].classList.add('last');
  const label = add(root, `<div class="hud-label"><div class="rows"></div></div>`);
  const rows = label.querySelector('.rows');
  const labels = [];

  gsap.set([tracker, label], { opacity: 0 });
  tl.to(tracker, { opacity: 1, duration: 0.3 }, HUD_ON);
  tl.fromTo(sq, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', stagger: 0.025 }, HUD_ON);
  tl.to(label, { opacity: 1, duration: 0.3 }, HUD_ON);
  tl.to([tracker, label], { opacity: 0, duration: 0.25, ease: 'power2.in' }, HUD_OFF - 0.2);

  return {
    /** at time t: fill square i and roll the label to `text` */
    step(i, text, t) {
      const r = add(rows, `<div class="row"><b>${String(i + 1).padStart(2, '0')}</b>&nbsp;&nbsp;${text}</div>`);
      labels.push(r);
      const idx = labels.length - 1;
      if (idx > 0) tl.to(rows, { y: -48 * idx, duration: 0.45, ease: 'expo.inOut' }, t - 0.2);
      tl.set(sq[i], { className: 'on' }, t)
        .fromTo(sq[i], { scale: 1.6 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', immediateRender: false }, t);
    },
    /** tween HUD colours (for scenes on orange / navy backgrounds) */
    theme(t, vars, dur = 0.25) { tl.to(root, { ...vars, duration: dur, ease: 'none' }, t); },
    tracker, label,
  };
}
