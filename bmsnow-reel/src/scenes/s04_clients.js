import { el, css, icon, headline, lineIn, lineOut, chips, chipsIn, countTo, svgEl, COLOR, W } from '../lib.js';
import { T } from '../timing.js';
import { avatar, checkCircle } from '../ui.js';

// 0:08–0:10  Group 2 — Clients: client card with notes + a consent form that
// gets signed and locked (immutable submission).
export default function clients({ layers, tl, bg, hud, cue }) {
  const t0 = T.clients;
  const end = T.catalogue;
  const sec = el('section', 'scene', layers.scenes);
  tl.set(sec, { visibility: 'visible' }, t0 - 0.05);
  tl.set(sec, { visibility: 'hidden' }, end + 0.05);
  hud.setGroup(tl, t0, 1);
  bg.to(tl, t0 - 0.2, { glow: 0.5, orbY: 0.45, dur: 0.6 });

  const h = headline(sec, ['Know every', '<span class="accent">client.</span>']);
  gsap.set(h.spans, { yPercent: 115 });
  lineIn(tl, h.spans, t0 + 0.02);
  lineOut(tl, h.spans, end - 0.26);

  // ---------------- client card ----------------
  const stage3d = el('div', 'abs', sec);
  css(stage3d, { left: 0, top: 0, width: W + 'px', height: '1920px', perspective: '2400px' });
  const card = el('div', 'card', stage3d);
  css(card, { left: '80px', top: '586px', width: '860px', height: '520px', borderRadius: '38px', padding: '40px 44px' });
  card.innerHTML = `
    <div class="row" style="gap:28px">
      <div class="cav">${avatar('LM', 124, 'linear-gradient(135deg,#FF9B6E,#FE4D1E)')}</div>
      <div class="grow">
        <div class="mask"><span class="cname" style="font:800 42px/1.1 var(--ui);letter-spacing:-0.02em">Leyla Mammadova</span></div>
        <div class="csub" style="font:500 23px/1.3 var(--ui);color:#8C7F79;margin-top:6px">Client since 2023 · +994 50 ••• •• 17</div>
        <div class="row ctags" style="gap:10px;margin-top:14px">
          <span class="pill" style="background:#FE4D1E;color:#fff">${icon('crown', 20, 2.4)}VIP</span>
          <span class="pill">Prefers Aysel</span>
          <span class="pill" style="background:#F4EEEB;color:#6E625C">Hair · Skin</span>
        </div>
      </div>
    </div>
    <div class="row cstats" style="gap:16px;margin-top:34px">
      <div class="cstat" style="flex:1;background:#FFF6F2;border-radius:24px;padding:22px 24px"><div style="font:600 20px/1 var(--ui);color:#8C7F79">Visits</div><div class="tnum" style="font:800 46px/1 var(--ui);margin-top:12px" data-k="visits">24</div></div>
      <div class="cstat" style="flex:1.35;background:#FFF6F2;border-radius:24px;padding:22px 24px"><div style="font:600 20px/1 var(--ui);color:#8C7F79">Lifetime spend</div><div class="tnum" style="font:800 46px/1 var(--ui);margin-top:12px" data-k="spend">₼ 1,240</div></div>
      <div class="cstat" style="flex:1;background:#FFF6F2;border-radius:24px;padding:22px 24px"><div style="font:600 20px/1 var(--ui);color:#8C7F79">No-shows</div><div class="tnum" style="font:800 46px/1 var(--ui);margin-top:12px;color:#FE4D1E">0</div></div>
    </div>
    <div class="row cnote" style="gap:18px;margin-top:22px;background:#1C1512;color:#fff;border-radius:24px;padding:20px 24px">
      <div class="iconbox" style="width:56px;height:56px;background:rgba(254,77,30,0.18)">${icon('notebook-pen', 28, 2.2)}</div>
      <div><div style="font:700 22px/1.2 var(--ui)">Note · Sensitive skin, patch test first</div><div style="font:500 19px/1.3 var(--ui);color:rgba(255,255,255,0.6);margin-top:4px">Next visit: Tue 13 Oct, 15:30 · Haircut & Styling</div></div>
    </div>`;
  const q = (s) => card.querySelector(s);
  const qa = (s) => [...card.querySelectorAll(s)];
  gsap.set(card, { transformPerspective: 2400, transformOrigin: '50% 50%' });

  const CI = t0;
  tl.fromTo(card, { x: 1150, rotationY: -35, rotationZ: 4 }, { x: 0, rotationY: -7, rotationZ: -1.5, duration: 0.8, ease: 'expo.out' }, CI);
  tl.to(card, { rotationY: 5, rotationX: 3, duration: 1.3, ease: 'sine.inOut' }, CI + 0.7);
  tl.fromTo(q('.cav'), { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2.2)' }, CI + 0.18);
  tl.fromTo(q('.cname'), { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: 'expo.out' }, CI + 0.24);
  tl.fromTo(q('.csub'), { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out' }, CI + 0.3);
  tl.fromTo(qa('.ctags .pill'), { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.5)', stagger: 0.05 }, CI + 0.34);
  tl.fromTo(qa('.cstat'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', stagger: 0.05 }, CI + 0.38);
  countTo(tl, card.querySelector('[data-k=visits]'), CI + 0.42, 0.8, 0, 24, (v) => Math.round(v));
  countTo(tl, card.querySelector('[data-k=spend]'), CI + 0.46, 0.85, 0, 1240, (v) => '₼ ' + Math.round(v).toLocaleString('en-US'));
  tl.fromTo(q('.cnote'), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' }, CI + 0.5);
  cue(CI + 0.05, 'whoosh', { dur: 0.3, gain: 0.5 });
  cue(CI + 0.2, 'pop', { gain: 0.6, pitch: 1.0 });
  cue(CI + 0.42, 'count', { dur: 0.6, gain: 0.25 });

  // ---------------- consent form ----------------
  const form = el('div', 'card', stage3d);
  css(form, { left: '372px', top: '1010px', width: '600px', height: '380px', borderRadius: '32px', padding: '30px 32px', zIndex: 3 });
  form.innerHTML = `
    <div class="row" style="gap:16px">
      <div class="iconbox" style="width:56px;height:56px">${icon('file-signature', 28, 2.2)}</div>
      <div class="grow"><div style="font:800 25px/1.15 var(--ui)">Consent form</div><div style="font:500 18px/1.3 var(--ui);color:#8C7F79">Hydra Facial · intake</div></div>
    </div>
    <div class="fchecks" style="margin-top:18px;display:flex;flex-direction:column;gap:10px"></div>
    <div style="position:absolute;left:32px;right:32px;bottom:44px;height:2px;background:#E9DFDA"></div>
    <div style="position:absolute;left:32px;bottom:18px;font:600 15px/1 var(--ui);color:#A89C96;letter-spacing:0.06em">SIGNATURE</div>`;
  const checks = ['I have read the aftercare advice', 'No allergies to listed products', 'Photos may be kept on file'];
  const boxes = checks.map((txt) => {
    const r = el('div', 'row', form.querySelector('.fchecks'));
    css(r, { gap: '12px', font: '600 19px/1.2 var(--ui)', color: '#3B302C' });
    const b = el('div', '', r);
    css(b, { width: '30px', height: '30px', borderRadius: '9px', boxShadow: 'inset 0 0 0 2.5px #D9CCC6', position: 'relative', flex: 'none' });
    const ck = checkCircle(b, 30, { bg: '#FE4D1E', stroke: 3.6 });
    css(ck.w, { left: 0, top: 0, borderRadius: '9px' });
    el('span', '', r, txt);
    return ck;
  });
  const sig = svgEl('svg', { width: 330, height: 110, viewBox: '0 0 400 120', fill: 'none' }, form);
  css(sig, { position: 'absolute', left: '40px', bottom: '40px' });
  const sigPath = svgEl('path', {
    d: 'M14,86 C22,26 44,8 40,56 C37,92 22,104 50,96 C74,89 82,58 98,61 C113,64 104,92 120,89 C136,86 140,52 156,57 C171,62 156,97 177,93 C198,89 200,48 216,54 C231,60 220,96 241,90 C266,83 272,36 290,48 C306,59 296,103 326,86 C344,76 356,70 392,70',
    stroke: '#1C1512', 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  }, sig);
  const locked = el('div', 'abs row', form);
  css(locked, { right: '26px', bottom: '56px', gap: '10px', height: '52px', padding: '0 18px 0 14px', borderRadius: '16px', background: '#1C1512', color: '#fff', font: '800 19px/1 var(--ui)', transform: 'rotate(-4deg)' });
  locked.innerHTML = `<span style="color:#FE4D1E">${icon('lock', 24, 2.6)}</span>Signed & locked`;

  const FI = t0 + 0.35;
  gsap.set(form, { transformPerspective: 2400 });
  tl.fromTo(form, { y: 1000, rotationX: 40, rotationZ: 10 }, { y: 0, rotationX: 0, rotationZ: 3, duration: 0.7, ease: 'expo.out' }, FI);
  boxes.forEach((ck, i) => {
    tl.fromTo(ck.w, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, FI + 0.25 + i * 0.07);
    tl.fromTo(ck.path, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.18, ease: 'power2.out' }, FI + 0.3 + i * 0.07);
    cue(FI + 0.25 + i * 0.07, 'tick', { gain: 0.45, pitch: 1.1 + i * 0.1 });
  });
  const SG = FI + 0.5;
  tl.fromTo(sigPath, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.42, ease: 'power1.inOut' }, SG);
  cue(SG, 'swish', { gain: 0.25 });
  tl.fromTo(locked, { opacity: 0, scale: 2.2, rotation: 8 }, { opacity: 1, scale: 1, rotation: -4, duration: 0.3, ease: 'power4.in' }, SG + 0.36);
  tl.fromTo(form, { x: 0 }, { keyframes: [{ x: 8, y: 6, duration: 0.04 }, { x: -5, y: -3, duration: 0.05 }, { x: 0, y: 0, duration: 0.06 }], immediateRender: false }, SG + 0.66);
  cue(SG + 0.65, 'stamp', { gain: 0.6 });
  cue(SG + 0.7, 'lock', { gain: 0.7 });

  const ch = chips(sec, ['Client cards', 'Notes', 'Intake forms', 'Consents', 'Segments'], 1422);
  gsap.set(ch.list, { opacity: 0 });
  chipsIn(tl, ch.list, t0 + 0.9);

  // exit: both cards drop back and shrink into a stack at centre (hand-off to the catalogue fan)
  const EX = end - 0.3;
  tl.to(card, { x: 200, y: 520, scale: 0.34, rotationY: 0, rotationX: 0, rotationZ: -8, opacity: 0, duration: 0.34, ease: 'power3.in' }, EX);
  tl.to(form, { x: -80, y: 160, scale: 0.5, rotationZ: 8, opacity: 0, duration: 0.34, ease: 'power3.in' }, EX);
  tl.to(ch.list, { opacity: 0, y: -20, duration: 0.2, stagger: 0.02 }, EX);
  cue(EX + 0.05, 'swish', { gain: 0.6 });
}
