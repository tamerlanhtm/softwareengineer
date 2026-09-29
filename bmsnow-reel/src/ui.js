import { el, css, icon, svgEl, COLOR } from './lib.js';

// Phone mockup. Returns wrap (3D stage), body (tilting device) and screen (content root).
export function phone(parent, { left, top, width = 480, height = 980 }) {
  const wrap = el('div', 'abs', parent);
  css(wrap, { left: left + 'px', top: top + 'px', width: width + 'px', height: height + 'px', perspective: '2400px' });
  const body = el('div', 'abs', wrap);
  css(body, {
    inset: 0, borderRadius: '74px', background: '#0B0908',
    boxShadow: '0 70px 140px -30px rgba(0,0,0,0.85), 0 0 0 2px #3B302C, inset 0 0 0 2px #564743',
  });
  const screen = el('div', 'abs', body);
  css(screen, { left: '15px', top: '15px', right: '15px', bottom: '15px', borderRadius: '60px', background: '#FFFFFF', overflow: 'hidden' });
  const bar = el('div', 'abs row', screen);
  css(bar, { left: '44px', right: '40px', top: '22px', height: '34px', justifyContent: 'space-between', font: '700 22px/1 var(--ui)', color: '#1C1512', zIndex: 3 });
  bar.innerHTML = `<span>9:41</span><span class="row" style="gap:8px"><i style="display:block;width:26px;height:14px;border-radius:4px;background:#1C1512"></i></span>`;
  const island = el('div', 'abs', body);
  css(island, { left: '50%', top: '30px', width: '136px', height: '40px', marginLeft: '-68px', borderRadius: '20px', background: '#000', zIndex: 4 });
  return { wrap, body, screen };
}

// Expanding tap ripple at (x, y) inside parent.
export function tap(parent, x, y, tl, t, color = 'rgba(254,77,30,0.9)') {
  const r = el('div', 'tap', parent);
  css(r, { left: x + 'px', top: y + 'px', borderColor: color, zIndex: 20 });
  gsap.set(r, { scale: 0, opacity: 0 });
  tl.fromTo(r, { scale: 0.2, opacity: 1 }, { scale: 1.5, opacity: 0, duration: 0.45, ease: 'power2.out', immediateRender: false }, t);
  return r;
}

// Circle with a check mark that draws itself.
export function checkCircle(parent, size, { bg = COLOR.orange, fg = '#fff', stroke } = {}) {
  const w = el('div', 'abs', parent);
  css(w, { width: size + 'px', height: size + 'px', borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' });
  const svg = svgEl('svg', { width: size * 0.56, height: size * 0.56, viewBox: '0 0 24 24', fill: 'none' }, w);
  const p = svgEl('path', { d: 'M4.5 12.5l5 5L19.5 7', stroke: fg, 'stroke-width': stroke || 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
  return { w, path: p };
}

export function avatar(initials, size = 56, bg) {
  const s = size;
  return `<div class="avatar" style="width:${s}px;height:${s}px;font-size:${Math.round(s * 0.36)}px;${bg ? `background:${bg}` : ''}">${initials}</div>`;
}

export const AV_BG = [
  'linear-gradient(135deg,#FF8A5C,#FE4D1E)',
  'linear-gradient(135deg,#3B2F2B,#1C1512)',
  'linear-gradient(135deg,#FFB08F,#FF7447)',
  'linear-gradient(135deg,#7A5A50,#3B2A25)',
  'linear-gradient(135deg,#FFD2BF,#FF9B78)',
];

// A white "floating" panel with header row.
export function panel(parent, { left, top, width, height, dark = false, radius = 32 }) {
  const p = el('div', 'card' + (dark ? ' dark' : ''), parent);
  css(p, { left: left + 'px', top: top + 'px', width: width + 'px', height: height + 'px', borderRadius: radius + 'px' });
  return p;
}

export function iconBox(name, { size = 64, iconSize = 32, bg = '#FFF0E9', color = COLOR.orange, radius = 18 } = {}) {
  return `<div class="iconbox" style="width:${size}px;height:${size}px;border-radius:${radius}px;background:${bg};color:${color}">${icon(name, iconSize, 2.2)}</div>`;
}
