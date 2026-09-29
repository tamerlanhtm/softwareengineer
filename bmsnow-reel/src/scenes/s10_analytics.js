import { el, css, icon, headline, lineIn, lineOut, chips, chipsIn, countTo, svgEl, COLOR, W } from '../lib.js';
import { T } from '../timing.js';
import { avatar, AV_BG } from '../ui.js';

// 0:20–0:22  Group 8 — Reporting & Analytics: KPI tiles count up, weekly revenue
// bars grow with a retention line drawn over them, top staff ranked.
export default function analytics({ layers, tl, bg, hud, cue }) {
  const t0 = T.analytics;
  const end = T.admin;
  const sec = el('section', 'scene', layers.scenes);
  tl.set(sec, { visibility: 'visible' }, t0 - 0.05);
  tl.set(sec, { visibility: 'hidden' }, end + 0.05);
  hud.setGroup(tl, t0, 7);
  bg.to(tl, t0 - 0.2, { glow: 0.6, orbY: 0.6, dur: 0.6 });

  const h = headline(sec, ["See what's", '<span class="accent">working.</span>']);
  gsap.set(h.spans, { yPercent: 115 });
  lineIn(tl, h.spans, t0 + 0.02);
  lineOut(tl, h.spans, end - 0.26);

  const st = el('div', 'abs', sec);
  css(st, { left: 0, top: 0, width: W + 'px', height: '1920px', perspective: '2400px' });

  // ---------------- KPI tiles ----------------
  const kpis = [
    { label: 'Revenue today', val: 2340, fmt: (v) => '₼ ' + Math.round(v).toLocaleString('en-US'), delta: '▲ 12% vs last Tue', hot: true },
    { label: 'Bookings', val: 38, fmt: (v) => String(Math.round(v)), delta: '▲ 5 vs last Tue' },
    { label: 'Utilisation', val: 86, fmt: (v) => Math.round(v) + '%', delta: 'Chairs & rooms', ring: true },
  ];
  const TW = (928 - 32) / 3;
  const tiles = kpis.map((k, i) => {
    const t = el('div', 'card', st);
    css(t, { left: 76 + i * (TW + 16) + 'px', top: '576px', width: TW + 'px', height: '184px', borderRadius: '30px', padding: '24px 24px', background: k.hot ? 'linear-gradient(150deg,#FF7A4D,#FE4D1E 60%,#E3400F)' : '#fff', color: k.hot ? '#fff' : '#1C1512' });
    t.innerHTML = `<div style="font:700 18px/1 var(--ui);letter-spacing:0.02em;opacity:${k.hot ? 0.85 : 0.6}">${k.label}</div>
      <div class="tnum kv" style="font:800 50px/1 var(--display);letter-spacing:-0.05em;margin-top:20px">${k.fmt(0)}</div>
      <div style="font:700 17px/1 var(--ui);margin-top:18px;color:${k.hot ? 'rgba(255,255,255,0.9)' : '#FE4D1E'}">${k.delta}</div>`;
    if (k.ring) {
      const svg = svgEl('svg', { width: 70, height: 70, viewBox: '0 0 40 40' }, t);
      css(svg, { position: 'absolute', right: '20px', top: '20px' });
      svgEl('circle', { cx: 20, cy: 20, r: 15, fill: 'none', stroke: '#F4EEEB', 'stroke-width': 6 }, svg);
      const arc = svgEl('circle', { cx: 20, cy: 20, r: 15, fill: 'none', stroke: '#FE4D1E', 'stroke-width': 6, 'stroke-linecap': 'round', transform: 'rotate(-90 20 20)' }, svg);
      k.arc = arc;
    }
    return t;
  });
  const K = t0;
  tl.fromTo(tiles, { y: 120, scale: 0.7, opacity: 0, rotation: (i) => (i - 1) * 6 }, { y: 0, scale: 1, opacity: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.8)', stagger: 0.07 }, K);
  kpis.forEach((k, i) => countTo(tl, tiles[i].querySelector('.kv'), K + 0.15 + i * 0.07, 0.8, 0, k.val, k.fmt, 'expo.out'));
  const ringK = kpis[2];
  tl.fromTo(ringK.arc, { drawSVG: '0%' }, { drawSVG: '86%', duration: 0.8, ease: 'expo.out' }, K + 0.3);
  cue(K, 'pop', { gain: 0.5, pitch: 0.9 });
  cue(K + 0.07, 'pop', { gain: 0.5, pitch: 1.05 });
  cue(K + 0.14, 'pop', { gain: 0.5, pitch: 1.2 });
  cue(K + 0.15, 'count', { dur: 0.6, gain: 0.3 });

  // ---------------- revenue chart ----------------
  const ch = el('div', 'card dark', st);
  css(ch, { left: '76px', top: '786px', width: '928px', height: '520px', borderRadius: '34px', padding: '28px 30px' });
  ch.innerHTML = `<div class="row" style="justify-content:space-between"><div><div style="font:800 25px/1.1 var(--ui)">Revenue last week</div><div style="font:500 18px/1.3 var(--ui);color:rgba(255,255,255,0.5)">By day · retention overlay</div></div>
    <div class="row" style="gap:18px;font:600 17px/1 var(--ui);color:rgba(255,255,255,0.6)"><span class="row" style="gap:8px"><i style="width:14px;height:14px;border-radius:4px;background:#FE4D1E"></i>Revenue</span><span class="row" style="gap:8px"><i style="width:18px;height:4px;border-radius:2px;background:#FFC3AE"></i>Retention</span></div></div>`;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const vals = [0.46, 0.62, 0.55, 0.7, 1.0, 0.88, 0.3];
  const CHX = 30, CHY = 120, CHW = 560, CHH = 330;
  const bw = CHW / 7;
  const barEls = vals.map((v, i) => {
    const b = el('div', 'abs', ch);
    css(b, { left: CHX + i * bw + 12 + 'px', top: CHY + 'px', width: bw - 24 + 'px', height: CHH + 'px' });
    const fill = el('div', 'abs', b);
    css(fill, { left: 0, right: 0, bottom: 0, height: v * CHH + 'px', borderRadius: '12px', background: i === 4 ? 'linear-gradient(180deg,#FF7A4D,#FE4D1E)' : 'rgba(255,255,255,0.14)' });
    const lb = el('div', 'abs', ch, days[i]);
    css(lb, { left: CHX + i * bw + 'px', width: bw + 'px', top: CHY + CHH + 16 + 'px', textAlign: 'center', font: '600 17px/1 var(--ui)', color: i === 4 ? '#FE4D1E' : 'rgba(255,255,255,0.45)' });
    return fill;
  });
  // retention line
  const svg = svgEl('svg', { width: CHW, height: CHH, viewBox: `0 0 ${CHW} ${CHH}`, fill: 'none' }, ch);
  css(svg, { position: 'absolute', left: CHX + 'px', top: CHY + 'px', overflow: 'visible' });
  const rv = [0.55, 0.52, 0.6, 0.64, 0.7, 0.76, 0.82];
  const pts = rv.map((v, i) => [i * bw + bw / 2, CHH - v * CHH - 40]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  const line = svgEl('path', { d, stroke: '#FFC3AE', 'stroke-width': 5, 'stroke-linecap': 'round' }, svg);
  const dots = pts.map(([x, y]) => svgEl('circle', { cx: x, cy: y, r: 7, fill: '#1A1412', stroke: '#FFC3AE', 'stroke-width': 4 }, svg));
  // tooltip on the best day
  const tip = el('div', 'abs', ch);
  css(tip, { left: CHX + 4 * bw + bw / 2 - 80 + 'px', top: CHY - 8 + 'px', width: '160px', padding: '10px 0', borderRadius: '14px', background: '#fff', color: '#1C1512', textAlign: 'center', font: '800 20px/1.2 var(--ui)', boxShadow: '0 14px 30px -8px rgba(0,0,0,0.6)', zIndex: 3 });
  tip.innerHTML = `₼ 3,410<div style="font:600 14px/1.2 var(--ui);color:#8C7F79">Best day · Fri</div>`;

  // top staff list
  const top = el('div', 'abs', ch);
  css(top, { left: '630px', top: '120px', width: '270px' });
  top.innerHTML = `<div style="font:700 16px/1 var(--ui);letter-spacing:0.12em;color:rgba(255,255,255,0.45)">TOP STAFF</div>`;
  const staff = [['Aysel', 'AY', '₼ 4,120', 1], ['Emre', 'EM', '₼ 3,340', 0.81], ['Olga', 'OL', '₼ 2,980', 0.72], ['Nigora', 'NI', '₼ 2,450', 0.6]];
  const srows = staff.map(([n, ini, v, f], i) => {
    const r = el('div', 'row', top);
    css(r, { gap: '12px', marginTop: i === 0 ? '20px' : '16px' });
    r.innerHTML = `${avatar(ini, 44, AV_BG[i])}<div class="grow"><div class="row" style="justify-content:space-between;font:700 18px/1 var(--ui)"><span>${n}</span><span class="tnum">${v}</span></div>
      <div style="margin-top:8px;height:8px;border-radius:4px;background:rgba(255,255,255,0.08)"><i class="sb" style="display:block;height:100%;width:${f * 100}%;border-radius:4px;background:${i === 0 ? '#FE4D1E' : 'rgba(255,255,255,0.35)'}"></i></div></div>`;
    return r;
  });

  const C = t0 + 0.22;
  gsap.set(ch, { transformPerspective: 2400, transformOrigin: '50% 100%' });
  tl.fromTo(ch, { y: 900, rotationX: -40 }, { y: 0, rotationX: 6, duration: 0.75, ease: 'expo.out' }, C);
  tl.to(ch, { rotationX: 0, rotationY: -3, duration: 1.2, ease: 'sine.inOut' }, C + 0.7);
  tl.fromTo(barEls, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.045 }, C + 0.25);
  tl.fromTo(line, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.7, ease: 'power2.inOut' }, C + 0.5);
  tl.fromTo(dots, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.3, ease: 'back.out(3)', stagger: 0.08 }, C + 0.55);
  tl.fromTo(srows, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out', stagger: 0.06 }, C + 0.45);
  tl.fromTo(top.querySelectorAll('.sb'), { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.6, ease: 'expo.out', stagger: 0.06 }, C + 0.5);
  tl.fromTo(tip, { opacity: 0, y: 20, scale: 0.7 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, C + 0.95);
  cue(C, 'whoosh', { dur: 0.3, gain: 0.45 });
  cue(C + 0.25, 'count', { dur: 0.35, gain: 0.25 });
  cue(C + 0.95, 'pop', { gain: 0.55, pitch: 1.35 });

  const cp = chips(sec, ['Revenue by service', 'By staff', 'Utilisation', 'Retention', 'Commission statements'], 1422);
  gsap.set(cp.list, { opacity: 0 });
  chipsIn(tl, cp.list, t0 + 1.0, 0.035);

  const EX = end - 0.32;
  tl.to(tiles, { y: -1200, duration: 0.34, ease: 'power3.in', stagger: 0.02 }, EX);
  tl.to(ch, { y: -1300, rotationX: 30, duration: 0.36, ease: 'power3.in' }, EX + 0.04);
  tl.to(cp.list, { opacity: 0, y: -20, duration: 0.2, stagger: 0.02 }, EX);
  cue(EX + 0.04, 'whoosh', { dur: 0.35, gain: 0.7 });
}
