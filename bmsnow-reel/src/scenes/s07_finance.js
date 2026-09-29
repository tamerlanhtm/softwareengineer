import { el, css, icon, headline, lineIn, lineOut, chips, chipsIn, countTo, COLOR, W } from '../lib.js';
import { T } from '../timing.js';
import { tap, checkCircle } from '../ui.js';

// 0:14–0:16  Group 5 — Finance: invoice with deposit + tip, paid by card (PAID
// stamp), then the daily cash-up balances to zero variance.
export default function finance({ layers, tl, bg, hud, cue }) {
  const t0 = T.finance;
  const end = T.accounting;
  const sec = el('section', 'scene', layers.scenes);
  tl.set(sec, { visibility: 'visible' }, t0 - 0.05);
  tl.set(sec, { visibility: 'hidden' }, end + 0.05);
  hud.setGroup(tl, t0, 4);
  bg.to(tl, t0 - 0.2, { glow: 0.55, orbY: 0.5, dur: 0.6 });

  const h = headline(sec, ['Get paid.', '<span class="accent">Close the till.</span>']);
  gsap.set(h.spans, { yPercent: 115 });
  lineIn(tl, h.spans, t0 + 0.02);
  lineOut(tl, h.spans, end - 0.26);

  const st = el('div', 'abs', sec);
  css(st, { left: 0, top: 0, width: W + 'px', height: '1920px', perspective: '2400px' });

  // ---------------- invoice ----------------
  const inv = el('div', 'card', st);
  css(inv, { left: '76px', top: '574px', width: '620px', height: '640px', borderRadius: '34px', padding: '34px 36px', overflow: 'hidden' });
  const line = (a, b, cls = '', style = '') =>
    `<div class="row ${cls}" style="justify-content:space-between;font:600 22px/1 var(--ui);color:#3B302C;padding:13px 0;${style}"><span>${a}</span><span class="tnum">${b}</span></div>`;
  inv.innerHTML = `
    <div class="row" style="justify-content:space-between;align-items:flex-start">
      <div><div style="font:700 17px/1 var(--ui);letter-spacing:0.14em;color:#A89C96">INVOICE</div>
      <div style="font:800 34px/1.1 var(--ui);margin-top:10px;letter-spacing:-0.01em">INV-0142</div>
      <div style="font:500 19px/1.3 var(--ui);color:#8C7F79;margin-top:4px">Leyla Mammadova · 13 Oct</div></div>
      <div class="iconbox" style="width:62px;height:62px">${icon('receipt', 30, 2.2)}</div>
    </div>
    <div class="divider" style="margin:24px 0 8px"></div>
    <div class="items">
      ${line('Haircut &amp; Styling', '₼ 35.00', 'it')}
      ${line('Argan Hair Oil', '₼ 24.00', 'it')}
      ${line('Tip for Aysel', '₼ 5.00', 'it')}
      ${line('Deposit paid', '− ₼ 10.00', 'it', 'color:#FE4D1E')}
    </div>
    <div class="divider" style="margin:8px 0 18px"></div>
    <div class="row" style="justify-content:space-between;align-items:baseline"><span style="font:700 24px/1 var(--ui)">Total due</span><span class="tnum tot" style="font:800 52px/1 var(--display);letter-spacing:-0.04em">₼ 54.00</span></div>
    <div class="row pm" style="gap:10px;margin-top:26px">
      <div class="m" style="flex:1;height:64px;border-radius:18px;background:#F6EFEB;display:flex;align-items:center;justify-content:center;gap:10px;font:700 21px/1 var(--ui);color:#6E625C">${icon('banknote', 24, 2.2)}Cash</div>
      <div class="m card-m" style="flex:1;height:64px;border-radius:18px;background:#F6EFEB;display:flex;align-items:center;justify-content:center;gap:10px;font:700 21px/1 var(--ui);color:#6E625C">${icon('credit-card', 24, 2.2)}Card</div>
      <div class="m" style="flex:1.2;height:64px;border-radius:18px;background:#F6EFEB;display:flex;align-items:center;justify-content:center;gap:10px;font:700 21px/1 var(--ui);color:#6E625C">${icon('landmark', 24, 2.2)}Transfer</div>
    </div>`;
  const stamp = el('div', 'abs', inv);
  css(stamp, { left: '205px', top: '232px', padding: '12px 28px', border: '7px solid #FE4D1E', borderRadius: '20px', color: '#FE4D1E', font: '900 76px/1 var(--display)', letterSpacing: '0.02em', transform: 'rotate(-14deg)', opacity: 0, mixBlendMode: 'multiply', background: 'rgba(254,77,30,0.06)' });
  stamp.textContent = 'PAID';

  const I = t0;
  gsap.set(inv, { transformPerspective: 2400 });
  tl.fromTo(inv, { x: -900, rotationY: 40, rotationZ: -8 }, { x: 0, rotationY: 8, rotationZ: -3, duration: 0.75, ease: 'expo.out' }, I);
  tl.to(inv, { rotationY: -4, duration: 1.2, ease: 'sine.inOut' }, I + 0.7);
  tl.fromTo(inv.querySelectorAll('.it'), { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out', stagger: 0.05 }, I + 0.12);
  countTo(tl, inv.querySelector('.tot'), I + 0.15, 0.4, 0, 54, (v) => '₼ ' + v.toFixed(2), 'power2.out');
  cue(I, 'whoosh', { dur: 0.3, gain: 0.5 });
  [0, 1, 2, 3].forEach((k) => cue(I + 0.12 + k * 0.05, 'tick', { gain: 0.25, pitch: 1 + k * 0.08 }));

  const PM = I + 0.45;
  const cardM = inv.querySelector('.card-m');
  tl.to(cardM, { backgroundColor: '#1C1512', color: '#FFFFFF', duration: 0.12 }, PM);
  tl.fromTo(cardM, { scale: 1 }, { keyframes: [{ scale: 0.93, duration: 0.07 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }], immediateRender: false }, PM - 0.02);
  tap(inv.querySelector('.pm'), 290, 32, tl, PM);
  cue(PM, 'click', { gain: 0.7 });

  const ST = I + 0.62;
  tl.fromTo(stamp, { opacity: 0, scale: 3.2, rotation: -4 }, { opacity: 1, scale: 1, rotation: -14, duration: 0.24, ease: 'power4.in' }, ST);
  tl.to(inv, { keyframes: [{ xPercent: -1.6, yPercent: 1.2, duration: 0.04 }, { xPercent: 1.1, yPercent: -0.6, duration: 0.05 }, { xPercent: -0.5, yPercent: 0.3, duration: 0.05 }, { xPercent: 0, yPercent: 0, duration: 0.06 }] }, ST + 0.24);
  cue(ST + 0.23, 'stamp', { gain: 1.0 });

  // ---------------- daily cash-up ----------------
  const cu = el('div', 'card dark', st);
  css(cu, { left: '414px', top: '968px', width: '590px', height: '430px', borderRadius: '34px', padding: '30px 34px', zIndex: 3 });
  const crow = (a, b, cls = '', style = '') =>
    `<div class="row ${cls}" style="justify-content:space-between;font:600 21px/1 var(--ui);color:rgba(255,255,255,0.72);padding:11px 0;${style}"><span>${a}</span><span class="tnum">${b}</span></div>`;
  cu.innerHTML = `
    <div class="row" style="gap:14px">
      <div class="iconbox" style="width:56px;height:56px;background:rgba(254,77,30,0.16)">${icon('wallet', 28, 2.2)}</div>
      <div class="grow"><div style="font:800 25px/1.1 var(--ui)">Daily cash-up</div><div style="font:500 18px/1.3 var(--ui);color:rgba(255,255,255,0.5)">Till 1 · Tue 13 Oct</div></div>
    </div>
    <div style="height:2px;background:rgba(255,255,255,0.08);margin:18px 0 6px"></div>
    ${crow('Opening float', '₼ 200.00', 'cr')}
    ${crow('Cash taken', '₼ 1,260.00', 'cr')}
    ${crow('Expected in till', '₼ 1,460.00', 'cr')}
    ${crow('Counted', '<span class="cnt">₼ 0.00</span>', 'cr', 'color:#fff;font-weight:800')}
    <div class="row var" style="justify-content:space-between;align-items:center;margin-top:14px;background:rgba(254,77,30,0.14);border-radius:18px;padding:14px 18px">
      <span style="font:700 21px/1 var(--ui);color:#FFC3AE">Variance</span>
      <span class="row" style="gap:12px"><span class="tnum vv" style="font:800 30px/1 var(--display);color:#fff;letter-spacing:-0.03em">₼ 0.00</span><span class="okc"></span></span>
    </div>`;
  const ok = checkCircle(cu.querySelector('.okc'), 44, { stroke: 3.4 });
  css(ok.w, { position: 'relative' });
  const CU = I + 0.8;
  tl.to(inv, { scale: 0.86, x: -26, y: -34, transformOrigin: '0% 0%', duration: 0.6, ease: 'expo.out' }, CU);
  gsap.set(cu, { transformPerspective: 2400 });
  tl.fromTo(cu, { x: 900, rotationY: -40, rotationZ: 8 }, { x: 0, rotationY: -6, rotationZ: 2.5, duration: 0.7, ease: 'expo.out' }, CU);
  tl.fromTo(cu.querySelectorAll('.cr'), { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.35, ease: 'expo.out', stagger: 0.04 }, CU + 0.1);
  {
    // counted cash climbs to the expected amount; variance follows it down to zero
    const cnt = cu.querySelector('.cnt');
    const vv = cu.querySelector('.vv');
    const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const o = { v: 0 };
    cnt.textContent = '₼ 0.00';
    vv.textContent = '−₼ 1,460.00';
    tl.to(o, {
      v: 1460, duration: 0.4, ease: 'power2.out',
      onUpdate: () => {
        cnt.textContent = '₼ ' + fmt(o.v);
        const d = Math.round((1460 - o.v) * 100) / 100;
        vv.textContent = d <= 0.004 ? '₼ 0.00' : '−₼ ' + fmt(d);
      },
    }, CU + 0.18);
  }
  tl.fromTo(cu.querySelector('.var'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out' }, CU + 0.3);
  tl.fromTo(ok.w, { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, CU + 0.6);
  tl.fromTo(ok.path, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.2 }, CU + 0.68);
  cue(CU, 'whoosh', { dur: 0.3, gain: 0.45 });
  cue(CU + 0.18, 'count', { dur: 0.38, gain: 0.3 });
  cue(CU + 0.62, 'ding', { gain: 0.6, pitch: 1.0 });

  const ch = chips(sec, ['Invoices', 'Deposits', 'Partial payments', 'Tips', 'Refunds', 'Expenses'], 1422);
  gsap.set(ch.list, { opacity: 0 });
  chipsIn(tl, ch.list, t0 + 1.0, 0.035);

  const EX = end - 0.32;
  tl.to(inv, { x: -1100, rotationY: 30, duration: 0.34, ease: 'power3.in' }, EX);
  tl.to(cu, { x: 1100, rotationY: -30, duration: 0.34, ease: 'power3.in' }, EX + 0.03);
  tl.to(ch.list, { opacity: 0, y: -20, duration: 0.2, stagger: 0.02 }, EX);
  cue(EX + 0.04, 'whoosh', { dur: 0.35, gain: 0.7 });
}
