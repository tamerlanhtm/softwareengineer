// 0 – 3.75s  "RUNNING A HOTEL?" → notification chaos → everything is sucked
// into one orange square (the fix).
import { tl, b, add, gsap, onFrame, cue, rng, prog, clamp, splitChars, icon, windowed, fitWidth, $ } from '../lib.js';
import { T } from '../i18n.js';

// icon, x, y, rot, beat — texts come from T.chips (same order)
const CHIPS = [
  ['calendar-x', 330, 470, -5, 2.5], ['spray-can', 735, 610, 4, 3], ['file-x', 360, 1300, 3, 3.5],
  ['user-round', 720, 1440, -4, 4], ['credit-card', 590, 300, 2, 4.5], ['moon', 770, 1120, -6, 4.75],
  ['star', 330, 790, 5, 5], ['trending-up', 610, 1600, -3, 5.25], ['wrench', 300, 1730, 4, 5.5],
  ['users', 560, 940, -2, 5.625], ['package', 800, 1790, -5, 5.75], ['phone-missed', 700, 200, 3, 5.875],
].map(([ic, x, y, rot, beat], i) => [ic, T.chips[i][0], T.chips[i][1], x, y, rot, beat]);

export function build({ world }) {
  const T0 = 0, T_END = b(8);
  const scene = add(world, `<div class="scene" id="s-hook"><div class="dots"></div></div>`);
  windowed(scene, T0, T_END);

  add(document.head, `<style>
    #s-hook .wrap { position:absolute; left:0; top:0; width:1080px; height:1920px; transform-origin:540px 960px; }
    #s-hook .hook-txt { position:absolute; left:0; top:700px; width:1080px; text-align:center;
      font-family:var(--display); font-weight:800; font-size:158px; line-height:1.0; letter-spacing:-0.04em; color:var(--text); }
    #s-hook .q { color: var(--orange); display:inline-block; }
    #s-hook .chip-pos { position:absolute; left:0; top:0; }
    #s-hook .chip { display:flex; align-items:center; gap:22px; padding:22px 34px 22px 22px; border-radius:32px;
      background:rgba(28,28,35,.97); border:1.5px solid rgba(255,255,255,.11); white-space:nowrap;
      box-shadow:0 26px 44px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06); }
    #s-hook .chip-ic { width:70px; height:70px; border-radius:21px; background:var(--orange-soft); display:flex;
      align-items:center; justify-content:center; color:var(--orange); flex:none; }
    #s-hook .chip b { display:block; font-weight:750; font-size:32px; color:var(--text); letter-spacing:-0.01em; }
    #s-hook .chip span.sub { display:block; font-weight:500; font-size:25px; color:var(--muted); margin-top:5px; }
    #s-hook .chip .dot { position:absolute; right:-7px; top:-7px; width:26px; height:26px; border-radius:50%;
      background:var(--orange); border:5px solid var(--ink); }
    #s-hook .core { position:absolute; left:465px; top:885px; width:150px; height:150px; border-radius:18.75%;
      background:var(--orange); box-shadow:0 0 0 rgba(255,77,31,0); }
    #s-hook .speed { position:absolute; left:540px; top:960px; height:4px; border-radius:2px; transform-origin:0 50%;
      background:linear-gradient(90deg, rgba(255,160,120,.95), rgba(255,77,31,0)); }
  </style>`);

  // ---------- headline ----------
  const txtWrap = add(scene, `<div class="wrap"></div>`);
  const HL = T.hook.lines;   // [text, beat] — the last line gets the orange "?"
  const txt = add(txtWrap, `<div class="hook-txt">${HL.map(([str], i) => `<div class="hl">${str}${i === HL.length - 1 ? '<span class="q">?</span>' : ''}</div>`).join('')}</div>`);
  const rows = [...txt.querySelectorAll('.hl')];
  // one size for every line: as big as the longest line allows (max 158px); block stays centred
  const size = Math.min(...rows.map((r) => fitWidth(r, 940, 158)));
  rows.forEach((r) => { r.style.fontSize = ''; });
  txt.style.fontSize = size + 'px';
  txt.style.top = 700 + ((2 - rows.length) * size) / 2 + 'px';
  const q = txt.querySelector('.q');
  const lineChars = rows.map((r) => splitChars(r).filter((c) => !q.contains(c)));
  gsap.set(rows, { overflow: 'hidden', padding: '0.06em 0 0.1em', margin: '-0.06em 0 -0.1em' });

  lineChars.forEach((cs, i) => {
    if (i === 0) tl.fromTo(cs, { yPercent: 42, rotate: 3 }, { yPercent: 0, rotate: 0, duration: 0.5, ease: 'expo.out', stagger: 0.022 }, b(HL[i][1]));
    else tl.fromTo(cs, { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 0.55, ease: 'expo.out', stagger: 0.028 }, b(HL[i][1]));
  });
  tl.fromTo(q, { scale: 0, rotation: -140 }, { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2.6)' }, b(2));
  tl.fromTo(txt, { scale: 1 }, { scale: 1.07, duration: b(6), ease: 'none' }, 0);
  tl.to(txt, { opacity: 0.42, duration: b(3), ease: 'power1.in' }, b(3));
  cue('hit', 0); cue('hit', b(1)); cue('pop_big', b(2));

  // ---------- notification chips ----------
  const chipEls = CHIPS.map(([ic, title, sub, x, y, rot, beat], i) => {
    const wrap = add(scene, `<div class="wrap"></div>`);
    const pos = add(wrap, `<div class="chip-pos"></div>`);
    const chip = add(pos, `<div class="chip"><div class="chip-ic">${icon(ic, { size: 38, sw: 2.3 })}</div>
      <div><b>${title}</b><span class="sub">${sub}</span></div><div class="dot"></div></div>`);
    const t = b(beat);
    gsap.set(pos, { x, y, xPercent: -50, yPercent: -50 });
    tl.fromTo(pos, { scale: 0.35, opacity: 0, rotation: rot - 14 * Math.sign(rot || 1), y: y + 70 },
      { scale: 1, opacity: 1, rotation: rot, y, duration: 0.5, ease: 'back.out(2.2)' }, t);
    cue('notif', t, { i });
    return { wrap, pos, chip, x, y, t };
  });

  // chaos jitter builds until the freeze on beat 6
  onFrame((t) => {
    if (t < b(2.5) || t > b(8)) return;
    const c = t < b(6) ? prog(t, b(3), b(3), 'power2.in') : 0;
    chipEls.forEach((ce, i) => {
      const k = c * (0.4 + 0.6 * clamp((t - ce.t) / 0.5));
      const dx = k * 7 * Math.sin(t * 31 + i * 1.7), dy = k * 6 * Math.sin(t * 27 + i * 2.3), r = k * 1.6 * Math.sin(t * 23 + i);
      ce.chip.style.transform = `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) rotate(${r.toFixed(2)}deg)`;
    });
    const tj = c * 9;
    txt.parentElement.style.translate = `${(tj * Math.sin(t * 37)).toFixed(2)}px ${(tj * Math.sin(t * 29 + 1)).toFixed(2)}px`;
  });

  // ---------- the fix: one orange square ----------
  const core = add(scene, `<div class="core"></div>`);
  tl.fromTo(core, { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(2.4)' }, b(6));
  tl.to(chipEls.map((c) => c.chip), { opacity: 0.6, duration: 0.12 }, b(6));
  cue('freeze', b(6));

  // implosion: every element spirals into the core (wrapper scales/rotates about stage centre)
  const all = [...chipEls.map((c) => ({ wrap: c.wrap, d: Math.hypot(c.x - 540, c.y - 960) })), { wrap: txtWrap, d: 140 }];
  const maxD = Math.max(...all.map((a) => a.d));
  all.forEach(({ wrap, d }, i) => {
    const start = b(6.4) + (d / maxD) * 0.3;
    tl.to(wrap, { scale: 0, rotation: 150 + (i % 3) * 30, duration: 0.62, ease: 'power3.in' }, start);
  });
  cue('suck', b(6.3));
  tl.to(core, { rotation: 180, scale: 1.3, duration: b(1.5), ease: 'power2.inOut' }, b(6.3));
  tl.to(core, { boxShadow: '0 0 160px 40px rgba(255,77,31,.55)', duration: b(1.5), ease: 'power2.in' }, b(6.3));
  tl.to(core, { scale: 0.12, rotation: 315, duration: b(0.5), ease: 'power4.in' }, b(7.5));

  // speed lines streaming into the core
  const R = rng(99);
  const lines = Array.from({ length: 34 }, (_, i) => ({
    el: add(scene, `<div class="speed" style="width:${160 + R() * 320}px"></div>`),
    a: (i / 34) * 360 + R() * 8, ph: R(), sp: 1.6 + R() * 1.4,
  }));
  onFrame((t) => {
    const on = t > b(6.3) && t < b(7.95);
    const k = on ? Math.min(prog(t, b(6.3), 0.25), 1 - prog(t, b(7.6), b(0.35))) : 0;
    for (const l of lines) {
      if (!on) { l.el.style.opacity = 0; continue; }
      const ph = (t * l.sp + l.ph) % 1;
      const r = 60 + (1 - ph) * 1250;
      l.el.style.transform = `rotate(${l.a}deg) translateX(${r.toFixed(1)}px)`;
      l.el.style.opacity = (k * Math.sin(Math.PI * ph) * 0.9).toFixed(3);
    }
  });

  // background mood: glow heats up with the chaos, cuts on the freeze
  const glow = $('#bg-glow');
  tl.fromTo(glow, { opacity: 0.55 }, { opacity: 1, duration: b(3.5), ease: 'power2.in' }, b(2.5));
  tl.to(glow, { opacity: 0.25, duration: 0.2 }, b(6));
}
