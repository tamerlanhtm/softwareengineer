import { el, css, icon, headline, lineIn, lineOut, chips, chipsIn, logoSVG, COLOR, W } from '../lib.js';
import { T } from '../timing.js';

// 0:10–0:12  Group 3 — Catalogue: six product types fan out like a hand of cards.
export default function catalogue({ layers, tl, bg, hud, cue }) {
  const t0 = T.catalogue;
  const end = T.staff;
  const sec = el('section', 'scene', layers.scenes);
  tl.set(sec, { visibility: 'visible' }, t0 - 0.05);
  tl.set(sec, { visibility: 'hidden' }, end + 0.05);
  hud.setGroup(tl, t0, 2);

  const h = headline(sec, ['Sell more than', '<span class="accent">services.</span>']);
  gsap.set(h.spans, { yPercent: 115 });
  lineIn(tl, h.spans, t0 + 0.02);
  lineOut(tl, h.spans, end - 0.26);

  const CW = 300, CH = 420;
  const cx = W / 2 - CW / 2, cy = 790;
  const fan = el('div', 'abs', sec);
  css(fan, { left: 0, top: 0, width: W + 'px', height: '1920px', perspective: '2400px' });

  const base = (dark) =>
    `position:absolute;left:${cx}px;top:${cy}px;width:${CW}px;height:${CH}px;border-radius:30px;padding:26px 24px;` +
    `background:${dark ? '#1A1412' : '#fff'};color:${dark ? '#fff' : '#1C1512'};` +
    `box-shadow:0 30px 70px -20px rgba(0,0,0,0.65), 0 0 0 1.5px ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.02)'};font-family:var(--ui);overflow:hidden`;
  const label = (txt, dark) => `<div style="font:700 17px/1 var(--ui);letter-spacing:0.14em;text-transform:uppercase;color:${dark ? 'rgba(255,255,255,0.5)' : '#A89C96'}">${txt}</div>`;
  const ib = (name, dark) => `<div class="iconbox" style="width:62px;height:62px;border-radius:18px;margin-top:20px;${dark ? 'background:rgba(254,77,30,0.16)' : ''}">${icon(name, 30, 2.2)}</div>`;

  const defs = [
    { dark: false, html: `${label('Services')}${ib('scissors')}
        <div style="font:800 28px/1.1 var(--ui);margin-top:20px">Haircut &amp; Styling</div>
        <div style="font:500 19px/1.35 var(--ui);color:#8C7F79;margin-top:8px">45 min + 10 min buffer<br>3 stylists</div>
        <div style="position:absolute;left:24px;bottom:24px;font:800 34px/1 var(--ui)">₼ 35</div>` },
    { dark: true, html: `${label('Packages', true)}${ib('layers', true)}
        <div style="font:800 28px/1.1 var(--ui);margin-top:20px">5 × Massage</div>
        <div style="font:500 19px/1.35 var(--ui);color:rgba(255,255,255,0.55);margin-top:8px">Session bundle</div>
        <div style="position:absolute;left:24px;right:24px;bottom:26px"><div style="display:flex;gap:8px">${[1, 1, 0, 0, 0].map((u) => `<i style="flex:1;height:14px;border-radius:5px;background:${u ? 'rgba(255,255,255,0.18)' : '#FE4D1E'}"></i>`).join('')}</div>
        <div style="font:700 19px/1 var(--ui);margin-top:14px">3 of 5 left</div></div>` },
    { dark: false, html: `${label('Memberships')}${ib('crown')}
        <div style="font:800 28px/1.1 var(--ui);margin-top:20px">Glow Club</div>
        <div style="font:500 19px/1.35 var(--ui);color:#8C7F79;margin-top:8px">2 credits / month<br>10% member discount</div>
        <div style="position:absolute;left:24px;bottom:24px;font:800 34px/1 var(--ui)">₼ 49<span style="font:600 19px/1 var(--ui);color:#8C7F79">/mo</span></div>` },
    { gift: true, html: `<div style="font:700 17px/1 var(--ui);letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.8)">Gift card</div>
        <div style="position:absolute;right:-110px;top:-96px;opacity:0.16">${logoSVG(330, '#fff')}</div>
        <div style="position:absolute;left:24px;bottom:100px;font:800 64px/1 var(--display);letter-spacing:-0.04em;color:#fff">₼100</div>
        <div style="position:absolute;left:24px;bottom:30px;font:600 19px/1.3 var(--ui);color:rgba(255,255,255,0.85)">Balance tracked<br>Expires 12/2026</div>
        <div class="shine" style="position:absolute;top:-40%;left:-80%;width:60%;height:180%;background:linear-gradient(100deg,transparent,rgba(255,255,255,0.55),transparent);transform:rotate(12deg)"></div>` },
    { dark: false, html: `${label('Retail')}${ib('shopping-bag')}
        <div style="font:800 28px/1.1 var(--ui);margin-top:20px">Argan Hair Oil</div>
        <div style="font:500 19px/1.35 var(--ui);color:#8C7F79;margin-top:8px">In stock: 18<br>Reorder at 5</div>
        <div style="position:absolute;left:24px;right:24px;bottom:28px;height:14px;border-radius:7px;background:#F4EEEB"><i style="display:block;width:72%;height:100%;border-radius:7px;background:#FE4D1E"></i></div>` },
    { dark: true, html: `${label('Resources', true)}${ib('armchair', true)}
        <div style="font:800 28px/1.1 var(--ui);margin-top:20px">Treatment Room 2</div>
        <div style="font:500 19px/1.35 var(--ui);color:rgba(255,255,255,0.55);margin-top:8px">Rooms, chairs &amp; equipment</div>
        <div style="position:absolute;left:24px;bottom:26px;display:flex;gap:8px"><span class="pill dark" style="height:36px;font-size:17px">Room</span><span class="pill" style="height:36px;font-size:17px;background:#FE4D1E;color:#fff">Booked 15:30</span></div>` },
  ];
  const cards = defs.map((d) => {
    const c = el('div', '', fan);
    c.style.cssText = base(d.dark);
    if (d.gift) {
      c.style.background = 'linear-gradient(150deg,#FF8A5C 0%,#FE4D1E 45%,#D93A0C 100%)';
      c.style.color = '#fff';
    }
    c.innerHTML = d.html;
    return c;
  });
  const angles = [-24, -14.5, -5, 5, 14.5, 24];
  const PIV = 760; // pivot below the card centre
  gsap.set(cards, { transformOrigin: `50% ${CH / 2 + PIV}px`, transformPerspective: 2400 });

  // order on screen: the gift card should overlap its neighbours at the end
  const I = t0;
  tl.fromTo(cards, { y: 700, rotation: 0, scale: 0.6, opacity: 0 }, { y: 0, scale: 0.86, opacity: 1, duration: 0.45, ease: 'expo.out', stagger: 0.02 }, I);
  cards.forEach((c, i) => {
    tl.to(c, { rotation: angles[i], scale: 1, duration: 0.7, ease: 'back.out(1.4)' }, I + 0.28 + Math.abs(i - 2.5) * 0.03);
  });
  cue(I, 'whoosh', { dur: 0.3, gain: 0.5 });
  cue(I + 0.3, 'shutter', { gain: 0.6 });
  cue(I + 0.36, 'shutter', { gain: 0.45 });
  cue(I + 0.42, 'shutter', { gain: 0.35 });

  // wave: each card lifts in turn
  cards.forEach((c, i) => {
    tl.to(c, { keyframes: [{ y: -46, duration: 0.14, ease: 'power2.out' }, { y: 0, duration: 0.3, ease: 'power2.inOut' }] }, I + 0.9 + i * 0.06);
    cue(I + 0.9 + i * 0.06, 'tick', { gain: 0.3, pitch: 0.9 + i * 0.08 });
  });

  // gift card steps forward, shine sweeps across
  const gift = cards[3];
  const G = I + 1.3;
  tl.set(gift, { zIndex: 5 }, G);
  tl.to(gift, { y: -40, scale: 1.1, rotation: 1, duration: 0.4, ease: 'back.out(2)' }, G);
  tl.fromTo(gift.querySelector('.shine'), { left: '-80%' }, { left: '140%', duration: 0.5, ease: 'power2.inOut' }, G + 0.05);
  cue(G, 'pop', { gain: 0.6, pitch: 1.2 });
  cue(G + 0.08, 'ding', { gain: 0.35, pitch: 1.5 });

  const ch = chips(sec, ['Services', 'Packages', 'Memberships', 'Gift cards', 'Retail stock', 'Rooms &amp; chairs'], 1422);
  gsap.set(ch.list, { opacity: 0 });
  chipsIn(tl, ch.list, I + 0.7, 0.035);

  // exit: cards are "dealt" up and away
  const EX = end - 0.32;
  cards.forEach((c, i) => {
    tl.to(c, { y: -1500, rotation: angles[i] * 1.8, duration: 0.36, ease: 'power3.in' }, EX + i * 0.018);
  });
  tl.to(ch.list, { opacity: 0, y: -20, duration: 0.2, stagger: 0.02 }, EX);
  cue(EX + 0.04, 'whoosh', { dur: 0.35, gain: 0.7 });
}
