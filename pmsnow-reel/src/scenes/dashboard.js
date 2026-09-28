// 5.625 – 7.5s  01 DASHBOARD — we land inside the hollow square; KPIs count up,
// occupancy chart draws itself.
import { tl, b, add, gsap, onFrame, cue, prog, counter, headline, hlIn, windowed, clipToTarget, icon } from '../lib.js';
import { PORTAL_T0, PORTAL_T1, portalProbe } from './logo.js';
import { T } from '../i18n.js';
const D = T.dash, NUM = T.num;

export const T_OUT = b(16);

export function smoothPath(pts, tension = 0.5) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2, p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2, p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export function build({ world, hud }) {
  const T_IN = PORTAL_T1;
  const scene = add(world, `<div class="scene" id="s-dash"></div>`);
  windowed(scene, PORTAL_T0 - 0.35, T_OUT + 0.3);

  add(document.head, `<style>
    #s-dash .kpi { width:436px; height:196px; }
    #s-dash .kpi .label { position:absolute; left:30px; top:28px; }
    #s-dash .kpi .val { position:absolute; left:28px; top:78px; font-family:var(--display); font-weight:700; font-size:72px; letter-spacing:-0.04em; line-height:1; }
    #s-dash .kpi .val small { font-size:.55em; color:var(--muted); margin-left:4px; letter-spacing:0; }
    #s-dash .kpi .pill { position:absolute; right:24px; top:22px; height:44px; font-size:22px; padding:0 16px; }
    #s-dash .ring { position:absolute; right:24px; top:44px; width:112px; height:112px; }
    #s-dash .chart .title { position:absolute; left:30px; top:28px; font-weight:700; font-size:30px; }
    #s-dash .chart .sub { position:absolute; left:30px; top:68px; font-weight:500; font-size:23px; color:var(--muted); }
    #s-dash .chart .pills { position:absolute; right:24px; top:24px; display:flex; gap:12px; }
    #s-dash .chart .pill { height:48px; font-size:22px; padding:0 16px; }
    #s-dash .tip { position:absolute; padding:10px 18px; border-radius:16px; background:var(--text); color:var(--ink);
      font-weight:700; font-size:24px; white-space:nowrap; box-shadow:0 12px 30px rgba(0,0,0,.4); }
    #s-dash .tip:after { content:''; position:absolute; left:50%; bottom:-9px; margin-left:-9px; border:9px solid transparent; border-bottom:0; border-top-color:var(--text); }
  </style>`);

  const portal = add(scene, `<div class="layer portal"><div class="dots"></div></div>`);
  const content = add(portal, `<div class="layer content"></div>`);
  clipToTarget(portal, portalProbe, PORTAL_T0 - 0.35, T_IN, 6 / 64);
  gsap.set(content, { transformOrigin: '540px 960px' });
  tl.fromTo(content, { scale: 0.42 }, { scale: 1.05, duration: T_IN - (PORTAL_T0 - 0.35), ease: 'power3.in' }, PORTAL_T0 - 0.35)
    .to(content, { scale: 1, duration: 0.7, ease: 'expo.out' }, T_IN);
  cue('land', T_IN);

  const hl = headline(content, D.hl, { top: 312 });
  hlIn(hl, T_IN - 0.02);
  hud.step(0, D.hud, T_IN);

  const panel = add(content, `<div class="card" style="left:60px;top:590px;width:960px;height:870px"></div>`);
  const kpis = [
    [D.kpi[0], 87, (v) => Math.round(v) + '<small>%</small>', null],
    [D.kpi[1], NUM.adr, (v) => T.money(Math.round(v)), '+4%'],
    [D.kpi[2], NUM.revpar, (v) => T.money(Math.round(v)), '+11%'],
    [D.kpi[3], NUM.revenueK, (v) => T.moneyK(v), '+12%'],
  ];
  const tiles = kpis.map(([label, val, fmt, delta], k) => {
    const x = 32 + (k % 2) * 460, y = 32 + Math.floor(k / 2) * 218;
    const tile = add(panel, `<div class="tile kpi" style="left:${x}px;top:${y}px">
      <div class="label">${label}</div><div class="val"></div>
      ${delta ? `<div class="pill green">${icon('trending-up', { size: 22, sw: 2.6 })}${delta}</div>` : ''}</div>`);
    const v = tile.querySelector('.val');
    onFrame((t) => {
      const s = fmt(val * prog(t, T_IN - 0.15, 1.25, 'expo.out'));
      if (v.__s !== s) { v.innerHTML = s; v.__s = s; }
    });
    return tile;
  });
  // occupancy ring
  tiles[0].insertAdjacentHTML('beforeend', `<svg class="ring" viewBox="0 0 112 112">
    <circle cx="56" cy="56" r="44" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="13"/>
    <circle class="arc" cx="56" cy="56" r="44" fill="none" stroke="#ff4d1f" stroke-width="13" stroke-linecap="round" transform="rotate(-90 56 56)"/></svg>`);
  tl.fromTo(tiles[0].querySelector('.arc'), { drawSVG: '0% 0%' }, { drawSVG: '0% 87%', duration: 1.25, ease: 'expo.out' }, T_IN - 0.15);
  tl.fromTo(tiles, { y: 40, opacity: 0.0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.05 }, PORTAL_T0 - 0.35);
  tl.fromTo(panel.querySelectorAll('.kpi .pill'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.5)', stagger: 0.08 }, T_IN + 0.45);
  for (let k = 0; k < 14; k++) cue('tick', T_IN - 0.1 + k * 0.045, { v: k / 14 });

  // chart
  const chart = add(panel, `<div class="tile chart" style="left:32px;top:468px;width:896px;height:370px">
    <div class="title">${D.chart}</div><div class="sub">${D.sub}</div>
    <div class="pills"><div class="pill blue">${icon('arrow-down-left', { size: 22, sw: 2.6 })}${D.arrivals}</div>
    <div class="pill orange">${icon('arrow-up-right', { size: 22, sw: 2.6 })}${D.departures}</div></div></div>`);
  const data = [58, 55, 63, 69, 66, 72, 79, 74, 70, 77, 83, 80, 84, 87];
  const X0 = 36, X1 = 820, Y0 = 330, Y1 = 128;
  const pts = data.map((v, i) => [X0 + (i * (X1 - X0)) / (data.length - 1), Y0 - ((v - 45) / 50) * (Y0 - Y1)]);
  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  chart.insertAdjacentHTML('beforeend', `<svg style="position:absolute;left:0;top:0" width="896" height="370" viewBox="0 0 896 370">
    <defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4d1f" stop-opacity=".42"/><stop offset="1" stop-color="#ff4d1f" stop-opacity="0"/></linearGradient>
    <clipPath id="dclip"><rect class="reveal" x="0" y="0" width="0" height="370"/></clipPath></defs>
    ${[0, 1, 2].map((k) => `<line x1="36" x2="860" y1="${150 + k * 70}" y2="${150 + k * 70}" stroke="rgba(255,255,255,.06)" stroke-width="2" stroke-dasharray="6 10"/>`).join('')}
    <path d="${line} L${X1},${Y0 + 30} L${X0},${Y0 + 30} Z" fill="url(#dg)" clip-path="url(#dclip)"/>
    <path class="line" d="${line}" fill="none" stroke="#ff4d1f" stroke-width="6" stroke-linecap="round" style="filter:drop-shadow(0 6px 14px rgba(255,77,31,.6))"/>
    <circle class="pulse" cx="${last[0]}" cy="${last[1]}" r="12" fill="none" stroke="#ff4d1f" stroke-width="4"/>
    <circle class="dot" cx="${last[0]}" cy="${last[1]}" r="11" fill="#f6f3ef" stroke="#ff4d1f" stroke-width="6"/></svg>`);
  const tip = add(chart, `<div class="tip" style="left:${last[0] - 104}px;top:${last[1] - 84}px">${D.tip}</div>`);
  const DRAW = T_IN + 0.02;
  tl.fromTo(chart.querySelector('.line'), { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.95, ease: 'power2.inOut' }, DRAW);
  tl.fromTo(chart.querySelector('.reveal'), { attr: { width: 0 } }, { attr: { width: 896 }, duration: 0.95, ease: 'power2.inOut' }, DRAW);
  tl.fromTo(chart.querySelector('.dot'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, DRAW + 0.9);
  tl.fromTo(chart.querySelector('.pulse'), { scale: 1, opacity: 0.9, transformOrigin: '50% 50%' }, { scale: 3.2, opacity: 0, duration: 0.8, ease: 'expo.out' }, DRAW + 0.95);
  tl.fromTo(tip, { scale: 0.4, opacity: 0, y: 16, transformOrigin: '50% 100%' }, { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'back.out(2.5)' }, DRAW + 1.0);
  tl.fromTo(chart.querySelectorAll('.pills .pill'), { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.08 }, T_IN + 0.3);
  cue('pop', DRAW + 0.92); cue('pop', DRAW + 1.0);
  tl.fromTo(chart, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out' }, PORTAL_T0 - 0.2);

  // slow push while we read
  tl.fromTo(panel, { scale: 1 }, { scale: 1.03, duration: T_OUT - T_IN, ease: 'none' }, T_IN);

  // whip-pan out to the left
  tl.to(portal, { x: -1350, skewX: 6, duration: b(0.5), ease: 'power3.in' }, T_OUT - b(0.5));
  cue('whoosh', T_OUT - b(0.4));
}
