import { el, css, measure, COLOR } from '../lib.js';
import { T } from '../timing.js';
import { LANG, tr } from '../i18n.js';

// 0:00–0:02  "Run a [salon? / studio? / clinic?]" slot-machine hook.
// The orange pill then collapses into one logo square, handing off to the logo build.
export const HOOK_SQUARE = { cx: 540, cy: 860, size: 170 };

export default function hook({ layers, tl, bg, cue }) {
  const end = T.logo;
  const sec = el('section', 'scene', layers.scenes);
  tl.set(sec, { visibility: 'visible' }, 0);
  tl.set(sec, { visibility: 'hidden' }, end);

  Object.assign(bg.state, { glow: 0.5, particles: 0.85, dots: 0.35, vignette: 1, orbY: 0.4 });

  // en: "Run a" / [salon?]   az: [Salonunuz] / "var?" (pill on the first line)
  const AZ = LANG === 'az';
  const LS = '-0.045em';
  const words = AZ ? ['Salonunuz', 'Studiyanız', 'Klinikanız'] : ['salon?', 'studio?', 'clinic?'];
  const PAD = 46;
  const LEFT = 96;
  let FS = 150;
  const maxW = Math.max(...words.map((w) => measure(w, `800 ${FS}px Unbounded`, LS)));
  if (maxW + PAD * 2 > 1080 - LEFT * 2) FS = Math.floor((FS * (1080 - LEFT * 2 - PAD * 2)) / maxW);
  const widths = words.map((w) => measure(w, `800 ${FS}px Unbounded`, LS));
  const PILL_H = Math.round(FS * 1.36);
  const PILL_TOP = AZ ? 700 : 902;
  const L1_TOP = AZ ? PILL_TOP + PILL_H + 4 : 690;

  // line 1
  const l1m = el('div', 'abs clip', sec);
  css(l1m, { left: LEFT - 10 + 'px', top: L1_TOP + 'px', padding: '10px 20px 24px 10px' });
  const l1 = el('div', 'display', l1m, AZ ? 'var?' : 'Run a');
  css(l1, { fontSize: '150px', letterSpacing: LS, color: '#fff', whiteSpace: 'nowrap' });

  // pill
  const pill = el('div', 'abs', sec);
  css(pill, {
    left: LEFT + 'px', top: PILL_TOP + 'px', height: PILL_H + 'px', width: '0px',
    background: COLOR.orange, borderRadius: '52px', overflow: 'hidden',
    boxShadow: '0 30px 90px -10px rgba(254,77,30,0.55)',
  });
  const wordEls = words.map((w) => {
    const s = el('div', 'display abs', pill, w);
    css(s, { left: PAD + 'px', top: Math.round(FS * 0.08) + 'px', fontSize: FS + 'px', letterSpacing: LS, color: COLOR.ink, whiteSpace: 'nowrap', lineHeight: Math.round(FS * 1.2) + 'px' });
    return s;
  });
  gsap.set(wordEls, { yPercent: 115 });

  // small kicker above
  const kick = el('div', 'abs', sec);
  css(kick, { left: LEFT + 4 + 'px', top: '622px', font: '600 30px/1 var(--ui)', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' });
  kick.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#FE4D1E;margin-right:16px;vertical-align:1px"></span>' + tr('Quick question');

  // --- in ---
  tl.fromTo(kick, { opacity: 0.45, x: -14 }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out' }, 0.0);
  tl.fromTo(l1, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'expo.out' }, 0.0);
  tl.fromTo(pill, { width: 120, scaleY: 0.55 }, { width: widths[0] + PAD * 2, scaleY: 1, duration: 0.55, ease: 'expo.out' }, 0.0);
  cue(0.0, 'impact', { gain: 0.8 });

  // word rolls on the off-beats
  const at = [0.2, 0.75, 1.25];
  words.forEach((w, i) => {
    tl.fromTo(wordEls[i], { yPercent: 115 }, { yPercent: 0, duration: 0.5, ease: 'expo.out' }, at[i]);
    if (i > 0) {
      tl.to(wordEls[i - 1], { yPercent: -115, duration: 0.28, ease: 'power3.in' }, at[i] - 0.14);
      tl.to(pill, { width: widths[i] + PAD * 2, duration: 0.45, ease: 'expo.inOut' }, at[i] - 0.14);
      tl.fromTo(pill, { scale: 1.06 }, { scale: 1, duration: 0.4, ease: 'power3.out', immediateRender: false }, at[i]);
      cue(at[i] - 0.1, 'swish', { gain: 0.5 });
    }
    cue(at[i], 'pop', { gain: 0.7, pitch: 1 + i * 0.12 });
    bg.to(tl, at[i], { glow: 0.85, dur: 0.08, ease: 'none' });
    bg.to(tl, at[i] + 0.08, { glow: 0.5, dur: 0.4, ease: 'power2.out' });
  });

  // --- out: text leaves, pill collapses into a square at the logo's centre cell ---
  const OUT = 1.6;
  tl.to(kick, { opacity: 0, duration: 0.2 }, OUT);
  tl.to(l1, { yPercent: -110, duration: 0.3, ease: 'power3.in' }, OUT);
  tl.to(wordEls[2], { yPercent: -115, duration: 0.26, ease: 'power3.in' }, OUT + 0.02);
  const S = HOOK_SQUARE;
  tl.to(pill, {
    left: S.cx - S.size / 2, top: S.cy - S.size / 2, width: S.size, height: S.size,
    borderRadius: S.size * 0.183, rotation: 90, boxShadow: '0 20px 60px -10px rgba(254,77,30,0.0)',
    duration: end - OUT, ease: 'power4.inOut',
  }, OUT);
  cue(OUT, 'riser', { dur: end - OUT, gain: 0.8 });
  bg.to(tl, OUT, { glow: 0.2, particles: 0.3, dur: 0.4 });
}
