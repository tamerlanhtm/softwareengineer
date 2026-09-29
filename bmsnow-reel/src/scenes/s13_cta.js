import { el, css, icon, COLOR, W, H, LOGO, logoCell } from '../lib.js';
import { T } from '../timing.js';
import { tap } from '../ui.js';
import { CTA_LOGO, RING } from './s12_numbers.js';

// 0:26–0:30  End card: the logo completes around the hollow square, then
// "Everything you need. Now." and the call to action: www.ineed.now / @ineednow_.
export default function cta({ layers, tl, bg, cue }) {
  const t0 = T.cta;
  const sec = el('section', 'scene', layers.scenes);
  sec.style.zIndex = 6;
  tl.set(sec, { visibility: 'visible' }, t0 - 0.05);

  // ---------------- logo completes ----------------
  const k = CTA_LOGO.width / LOGO.SIZE;
  const size = 100 * k;
  const order = [5, 7, 4, 2, 6, 1, 3, 0];
  const sqs = order.map((i, n) => {
    const { x, y } = logoCell(i);
    const cx = CTA_LOGO.cx + (x + 50 - 201) * k;
    const cy = CTA_LOGO.cy + (y + 50 - 201) * k;
    const s = el('div', 'abs', sec);
    css(s, { left: cx - size / 2 + 'px', top: cy - size / 2 + 'px', width: size + 'px', height: size + 'px', borderRadius: LOGO.R + '%', background: COLOR.orange });
    tl.fromTo(s, { x: RING.cx - cx, y: RING.cy - cy, scale: 0, rotation: -90 }, { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.55, ease: 'back.out(1.6)' }, t0 + 0.02 + n * 0.035);
    cue(t0 + 0.04 + n * 0.035, 'tick', { gain: 0.3, pitch: 1.3 - n * 0.05 });
    return { el: s, i };
  });

  // wordmark
  const wm = el('div', 'abs', sec);
  css(wm, { left: 0, width: W + 'px', top: '556px', textAlign: 'center' });
  const wmIn = el('div', 'clip', wm);
  css(wmIn, { display: 'inline-block', padding: '4px 10px 14px' });
  const word = el('div', 'display', wmIn);
  css(word, { fontSize: '62px', fontWeight: 800, letterSpacing: '-0.05em', color: '#fff', whiteSpace: 'nowrap' });
  word.innerHTML = 'BMS<span style="color:#FE4D1E">Now</span>';
  const split = new SplitText(word, { type: 'chars' });
  tl.fromTo(split.chars, { yPercent: 120 }, { yPercent: 0, duration: 0.55, ease: 'expo.out', stagger: 0.03 }, t0 + 0.3);

  // tagline
  const tag = el('div', 'abs', sec);
  css(tag, { left: 0, width: W + 'px', top: '690px', textAlign: 'center' });
  const l1 = el('span', 'mask', tag);
  const l1s = el('span', 'display', l1, 'Everything');
  css(l1s, { fontSize: '104px', fontWeight: 800, color: '#fff' });
  const l2 = el('span', 'mask', tag);
  const l2s = el('span', 'display', l2, 'you need.');
  css(l2s, { fontSize: '104px', fontWeight: 800, color: '#fff' });
  tl.fromTo([l1s, l2s], { yPercent: 115 }, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.09 }, t0 + 0.5);
  cue(t0 + 0.5, 'swish', { gain: 0.5 });

  const now = el('div', 'abs', sec);
  css(now, { left: 0, width: W + 'px', top: '906px', textAlign: 'center', font: '900 240px/1 var(--display)', letterSpacing: '-0.065em', color: COLOR.orange, textShadow: '0 20px 80px rgba(254,77,30,0.35)' });
  now.textContent = 'Now.';
  const NW = t0 + 1.0;
  tl.fromTo(now, { scale: 2.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.22, ease: 'power4.in' }, NW - 0.22);
  tl.fromTo(now, { y: 0 }, { keyframes: [{ y: 16, duration: 0.05 }, { y: -6, duration: 0.07 }, { y: 0, duration: 0.12 }], immediateRender: false }, NW);
  cue(NW, 'impact', { gain: 1.0 });
  cue(NW, 'sub', { gain: 0.7 });
  bg.to(tl, NW, { glow: 1.0, dur: 0.06, ease: 'none' });
  bg.to(tl, NW + 0.06, { glow: 0.6, dur: 0.8, ease: 'power2.out' });

  // call to action
  const btn = el('div', 'abs row', sec);
  css(btn, { left: '150px', width: '780px', top: '1206px', height: '124px', borderRadius: '40px', background: '#fff', color: COLOR.ink, justifyContent: 'center', gap: '26px', boxShadow: '0 30px 80px -20px rgba(254,77,30,0.55)' });
  btn.innerHTML = `<span style="font:800 52px/1 var(--display);letter-spacing:-0.04em">www.ineed<span style="color:#FE4D1E">.now</span></span>
    <span class="arr" style="width:74px;height:74px;border-radius:24px;background:#FE4D1E;color:#fff;display:flex;align-items:center;justify-content:center">${icon('arrow-up-right', 40, 2.8)}</span>`;
  const handle = el('div', 'abs', sec);
  css(handle, { left: 0, width: W + 'px', top: '1372px', textAlign: 'center', font: '600 32px/1.2 var(--ui)', color: 'rgba(255,255,255,0.62)' });
  handle.innerHTML = `Let's talk: DM <b style="color:#fff;font-weight:800">@ineednow_</b>`;
  const B = t0 + 1.4;
  tl.fromTo(btn, { scale: 0.4, opacity: 0, y: 60 }, { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.8)' }, B);
  tl.fromTo(handle, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, B + 0.15);
  cue(B, 'pop', { gain: 0.8, pitch: 0.85 });
  const arr = btn.querySelector('.arr');
  [0, 1, 2, 3].forEach((n) => {
    tl.fromTo(arr, { x: 0, y: 0 }, { keyframes: [{ x: 8, y: -8, duration: 0.14, ease: 'power2.out' }, { x: 0, y: 0, duration: 0.3, ease: 'power2.inOut' }], immediateRender: false }, B + 0.7 + n * 0.5);
  });

  // cursor taps the button
  const cur = el('div', 'cursor', sec);
  cur.innerHTML = `<svg viewBox="0 0 24 24" width="56" height="56"><path d="M4 2.5l15 7.2-6.4 1.9-2.6 6.3L4 2.5z" fill="#fff" stroke="#0D0B0A" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
  css(cur, { left: 0, top: 0, zIndex: 10 });
  const CL = t0 + 2.45;
  tl.fromTo(cur, { x: 1150, y: 1750, opacity: 1 }, { x: 700, y: 1284, duration: 0.55, ease: 'power3.out' }, CL - 0.55);
  tl.fromTo(btn, { scale: 1 }, { keyframes: [{ scale: 0.95, duration: 0.07 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' }], immediateRender: false }, CL);
  tap(sec, 706, 1290, tl, CL, 'rgba(254,77,30,0.9)');
  tl.to(cur, { x: 1150, y: 1800, duration: 0.6, ease: 'power3.in' }, CL + 0.5);
  cue(CL, 'click', { gain: 0.9 });
  cue(CL + 0.05, 'ding', { gain: 0.5, pitch: 1.0 });

  // final flourish: logo wave
  const FW = t0 + 3.0;
  sqs.forEach(({ el: s, i }) => {
    const d = ((i % 3) + Math.floor(i / 3)) * 0.05;
    tl.to(s, { keyframes: [{ scale: 1.16, duration: 0.12, ease: 'power2.out' }, { scale: 1, duration: 0.35, ease: 'back.out(3)' }] }, FW + d);
  });
  cue(FW, 'swish', { gain: 0.35 });

  // dip to black for a seamless Instagram loop back into the hook
  const fade = el('div', 'layer', layers.fx);
  css(fade, { background: COLOR.ink, opacity: 0 });
  tl.to(fade, { opacity: 1, duration: 0.2, ease: 'power1.in' }, T.end - 0.2);
}
