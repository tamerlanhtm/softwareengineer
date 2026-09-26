// 18.75 – 20.625s  08 LANGUAGES — "Welcome" flips through EN / AZ / TR / RU on
// the beat while the switcher's orange block slides along.
import { tl, b, add, gsap, cue, headline, hlIn, hlOut, windowed, splitChars } from '../lib.js';

export const T_IN = b(40), T_OUT = b(44);
const WORDS = [
  ['EN', 'English', ['Welcome']],
  ['AZ', 'Azərbaycanca', ['Xoş', 'gəlmisiniz']],
  ['TR', 'Türkçe', ['Hoş', 'geldiniz']],
  ['RU', 'Русский', ['Добро', 'пожаловать']],
];
export const SEG = { x: 540 - 344, y: 1296, w: 688, h: 116 };
export const SEED = { x: 540, y: 960, size: 132 };

export function build({ world, hud }) {
  const scene = add(world, `<div class="scene" id="s-lang"><div class="dots"></div></div>`);
  windowed(scene, T_IN - 0.25, T_OUT + 0.26);

  add(document.head, `<style>
    #s-lang .word { position:absolute; left:0; width:1080px; text-align:center; font-family:var(--display); font-weight:800;
      letter-spacing:-0.045em; line-height:1.0; perspective:900px; }
    #s-lang .word .wl { display:block; white-space:nowrap; }
    #s-lang .word .ch { transform-origin:50% 50% -40px; }
    #s-lang .code { position:absolute; left:0; width:1080px; text-align:center; font-family:var(--mono); font-weight:500; font-size:28px; letter-spacing:.18em; color:var(--muted); top:1200px; height:40px; }
    #s-lang .code span { position:absolute; left:0; right:0; }
    #s-lang .seg { position:absolute; left:${SEG.x}px; top:${SEG.y}px; width:${SEG.w}px; height:${SEG.h}px; border-radius:40px; background:var(--ink3); border:1.5px solid var(--line); }
    #s-lang .hi { position:absolute; left:${SEG.x + 10}px; top:${SEG.y + 10}px; width:${(SEG.w - 20) / 4}px; height:${SEG.h - 20}px; border-radius:30px; background:var(--orange);
      box-shadow:0 12px 30px rgba(255,77,31,.45); }
    #s-lang .lbl { position:absolute; top:${SEG.y}px; width:${(SEG.w - 20) / 4}px; height:${SEG.h}px; line-height:${SEG.h}px; text-align:center;
      font-family:var(--display); font-weight:700; font-size:34px; color:var(--muted); }
  </style>`);

  const hl = headline(scene, ['Speaks your', '<span class="accent">language.</span>'], { top: 312 });
  hlIn(hl, T_IN - 0.1);
  hud.step(7, 'EN · AZ · TR · RU', T_IN);

  const seg = add(scene, `<div class="seg"></div>`);
  const hi = add(scene, `<div class="hi"></div>`);
  const segW = (SEG.w - 20) / 4;
  const lbls = WORDS.map(([code], k) => add(scene, `<div class="lbl" style="left:${SEG.x + 10 + k * segW}px">${code}</div>`));
  tl.fromTo([seg, hi, ...lbls], { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.03 }, T_IN - 0.2);

  const codes = add(scene, `<div class="code"></div>`);
  const probe = add(scene, `<div class="word" style="visibility:hidden;top:0"></div>`);
  const fitSize = (lines) => {
    let best = 230;
    for (const ln of lines) {
      probe.innerHTML = `<span style="font-size:100px;display:inline-block;white-space:nowrap">${ln}</span>`;
      const w = probe.firstChild.getBoundingClientRect().width;
      best = Math.min(best, Math.floor((930 / w) * 100));
    }
    return best;
  };

  WORDS.forEach(([code, name, lines], k) => {
    const size = fitSize(lines);
    const h = size * lines.length;
    const w = add(scene, `<div class="word" style="font-size:${size}px;top:${880 - h / 2}px">${lines.map((l) => `<span class="wl">${l}</span>`).join('')}</div>`);
    const chars = splitChars(w);
    // flip-in animates the glyph, flip-out its wrapper — so a late flip-in can never undo the exit
    const outs = chars.map((ch) => {
      const o = document.createElement('span');
      o.style.display = 'inline-block';
      o.style.transformOrigin = '50% 50% -40px';
      ch.replaceWith(o);
      o.appendChild(ch);
      return o;
    });
    const c = add(codes, `<span><span class="in">${code} · ${name}</span></span>`);
    const cIn = c.querySelector('.in');
    cIn.style.display = 'inline-block';
    const tIn = b(40 + k) - (k === 0 ? 0.1 : 0.02);
    tl.fromTo(chars, { rotationX: -95, yPercent: 40, opacity: 0 }, { rotationX: 0, yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.018 }, tIn);
    tl.fromTo(cIn, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3, ease: 'expo.out' }, tIn + 0.05);
    const tOut = k < 3 ? b(41 + k) - 0.2 : T_OUT - 0.06;
    tl.to(outs, { rotationX: 95, yPercent: -40, opacity: 0, duration: 0.16, ease: 'power2.in', stagger: 0.004 }, tOut);
    tl.to(c, { opacity: 0, y: -16, duration: 0.15 }, tOut);
    if (k > 0) {
      tl.to(hi, { x: k * segW, duration: 0.38, ease: 'expo.inOut' }, b(40 + k) - 0.2);
      tl.to(lbls[k - 1], { color: '#8d8d99', duration: 0.15 }, b(40 + k) - 0.1);
    }
    tl.to(lbls[k], { color: '#ffffff', duration: 0.15 }, b(40 + k) - 0.05);
    cue(k === 0 ? 'blip' : 'flipword', b(40 + k), { k });
  });

  // exit: the orange selector becomes the seed square of the next scene
  hlOut(hl, T_OUT - 0.32);
  tl.to([seg, ...lbls], { opacity: 0, y: 30, duration: 0.25, ease: 'power2.in', stagger: 0.02 }, T_OUT - 0.22);
  tl.to(hi, {
    left: SEED.x - SEED.size / 2, top: SEED.y - SEED.size / 2, x: 0, width: SEED.size, height: SEED.size, borderRadius: SEED.size * 0.1875,
    duration: 0.42, ease: 'expo.inOut',
  }, T_OUT - 0.2);
  cue('morph', T_OUT - 0.2);
}
