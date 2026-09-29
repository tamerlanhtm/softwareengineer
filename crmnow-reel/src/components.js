// Reusable, time-driven building blocks shared by the scenes.
import { el, set, css, E, ez, prog, clamp, lerp, wobble, rng, splitText, ORANGE } from './engine.js';

// ------------------------------------------------------------------ logo
// Geometry measured from the supplied logo (2000px artwork): 280px squares, 142px gaps,
// filled corner radius 44px, hollow square = 70px ring with 84px outer / 14px inner radius.
export const LOGO = { gap: 142 / 280, rFill: 44 / 280, ring: 70 / 280, rOuter: 84 / 280 };

export function ringPath(S) {
  const sw = S * LOGO.ring;
  const a = sw / 2;
  const z = S - a;
  const rc = S * LOGO.rOuter - a;
  const d = `M${S / 2} ${a}H${z - rc}A${rc} ${rc} 0 0 1 ${z} ${a + rc}V${z - rc}A${rc} ${rc} 0 0 1 ${z - rc} ${z}` +
    `H${a + rc}A${rc} ${rc} 0 0 1 ${a} ${z - rc}V${a + rc}A${rc} ${rc} 0 0 1 ${a + rc} ${a}Z`;
  const len = 4 * (S - sw - 2 * rc) + 2 * Math.PI * rc;
  return { d, len, sw };
}

/**
 * 3x3 logo made of DOM squares (+ an SVG ring for the hollow cell) so every cell can be animated.
 * Returns { wrap, cells[9], S, G, size }. cells[8] is the hollow ring; use ring.draw(p).
 */
export function buildLogo(parent, { S, x = 0, y = 0, color = ORANGE, cls = '' }) {
  const G = S * LOGO.gap;
  const size = 3 * S + 2 * G;
  const wrap = el('div', 'logo ' + cls, null, parent);
  wrap.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;`;
  const cells = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const left = c * (S + G);
      const top = r * (S + G);
      const node = el('div', 'lg-cell', null, wrap);
      node.style.cssText = `position:absolute;left:${left}px;top:${top}px;width:${S}px;height:${S}px;`;
      const cell = { node, r, c, cx: left + S / 2, cy: top + S / 2, hollow: r === 2 && c === 2 };
      if (cell.hollow) {
        const { d, len, sw } = ringPath(S);
        node.innerHTML = `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" style="display:block;overflow:visible"><path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}"/></svg>`;
        const path = node.querySelector('path');
        cell.path = path;
        cell.draw = (p) => {
          const v = p >= 0.999 ? 'none' : `${len} ${len}`;
          css(path, 'stroke-dasharray', v);
          css(path, 'stroke-dashoffset', p >= 0.999 ? '0' : `${len * (1 - p)}`);
        };
        cell.setColor = (col) => css(path, 'stroke', col);
      } else {
        node.style.borderRadius = `${S * LOGO.rFill}px`;
        node.style.background = color;
        cell.setColor = (col) => css(node, 'background', col);
      }
      cells.push(cell);
    }
  }
  return { wrap, cells, S, G, size };
}

/** A small static logo as an HTML string (for UI chrome). */
export function logoMarkHTML(S, color = ORANGE, ringColor = color) {
  const G = S * LOGO.gap;
  const size = 3 * S + 2 * G;
  const { d, sw } = ringPath(S);
  let s = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;overflow:visible">`;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = c * (S + G);
      const y = r * (S + G);
      if (r === 2 && c === 2) s += `<path transform="translate(${x} ${y})" d="${d}" fill="none" stroke="${ringColor}" stroke-width="${sw}"/>`;
      else s += `<rect x="${x}" y="${y}" width="${S}" height="${S}" rx="${S * LOGO.rFill}" fill="${color}"/>`;
    }
  }
  return s + '</svg>';
}

// ------------------------------------------------------------------ scene heading
/**
 * Overline + one or more titles that swap in/out.
 * titles: [{ html, tin, tout }], times in scene-local seconds. Words wrapped in <b> render orange.
 */
export function buildHead(parent, { num, label, titles, top = 262, size = 112 }) {
  const head = el('div', 'head', null, parent);
  head.style.top = `${top}px`;
  const over = el('div', 'over', null, head);
  const num_ = el('span', 'num', num, over);
  const bar = el('span', 'bar', null, over);
  const lbl = el('span', 'lbl', label, over);
  const tbox = el('div', 'title', null, head);
  tbox.style.fontSize = `${size}px`;
  for (const ti of titles) {
    ti.node = el('div', 't', ti.html, tbox);
    ti.words = splitText(ti.node).words;
  }
  const tin = titles[0].tin;
  const tout = titles[titles.length - 1].tout;
  const lift = size * 1.25;
  return {
    head,
    update(tau) {
      // overline
      const oi = ez(tau, tin - 0.1, tin + 0.45, E.outExpo);
      const oo = ez(tau, tout - 0.05, tout + 0.25, E.inCubic);
      set(num_, { x: (1 - oi) * -30, o: oi * (1 - oo) });
      set(bar, { sx: Math.max(0.001, oi * (1 - oo)), o: 1 });
      set(lbl, { x: (1 - oi) * 40 - oo * 20, o: oi * (1 - oo) });
      // titles
      for (const ti of titles) {
        const n = ti.words.length;
        let vis = false;
        const st = ti.stagger ?? 0.05;
        ti.words.forEach((w, i) => {
          const a = ez(tau, ti.tin + i * st, ti.tin + i * st + 0.6, E.outExpo);
          const d = ez(tau, ti.tout + i * 0.03, ti.tout + i * 0.03 + 0.26, E.inQuart);
          const y = (1 - a) * lift - d * lift;
          if (a > 0 && d < 1) vis = true;
          set(w.inner, { y, r: (1 - a) * 4 });
        });
        set(ti.node, { o: vis ? 1 : 0 });
        void n;
      }
    },
  };
}

// ------------------------------------------------------------------ cursor
const CURSOR_SVG = `<svg viewBox="0 0 32 32" width="64" height="64"><path d="M6.2 3.6v22.6l5.6-5.2 3.8 8.2 4-1.8-3.7-8h7.6z" fill="#fff" stroke="#0d0d10" stroke-width="1.7" stroke-linejoin="round"/></svg>`;
export function buildCursor(parent) {
  const node = el('div', 'cursor', CURSOR_SVG, parent);
  const HX = 12.4;
  const HY = 7.2;
  let req = null;
  return {
    /** Scenes call this during update to place the cursor (screen px of the hotspot). */
    want(x, y, { o = 1, press = 0 } = {}) { req = { x, y, o, press }; },
    apply() {
      if (!req) { set(node, { o: 0 }); return; }
      set(node, { x: req.x - HX, y: req.y - HY, s: 1 - req.press * 0.16, o: req.o, origin: `${HX}px ${HY}px` });
      req = null;
    },
  };
}

// ------------------------------------------------------------------ clicks (ripples)
export function buildRipples(parent, clicks) {
  const nodes = clicks.map((c) => {
    const n = el('div', 'ripple', null, parent);
    if (c.color) n.style.borderColor = c.color;
    return n;
  });
  return {
    update(t) {
      clicks.forEach((c, i) => {
        const p = prog(t, c.t, c.t + 0.55);
        const on = t >= c.t && p < 1;
        set(nodes[i], { x: c.x, y: c.y, s: 0.12 + E.outCubic(p) * (c.scale || 1), o: on ? (1 - p) * 0.95 : 0 });
      });
    },
  };
}

// ------------------------------------------------------------------ particle bursts
/**
 * bursts: [{ t, x, y, n, seed, colors, speed, spread (rad), dir (rad), gravity, size, life }]
 */
export function buildBursts(parent, bursts) {
  const all = [];
  for (const bu of bursts) {
    const R = rng(bu.seed || 1);
    const parts = [];
    for (let i = 0; i < bu.n; i++) {
      const n = el('div', 'pt', null, parent);
      const size = (bu.size || 22) * (0.45 + R() * 0.9);
      n.style.width = n.style.height = `${size}px`;
      n.style.marginLeft = n.style.marginTop = `${-size / 2}px`;
      const col = bu.colors[Math.floor(R() * bu.colors.length)];
      n.style.background = col;
      if (R() < (bu.hollow ?? 0.18)) { n.style.background = 'transparent'; n.style.border = `${Math.max(3, size * 0.22)}px solid ${col}`; }
      const ang = (bu.dir ?? -Math.PI / 2) + (R() - 0.5) * (bu.spread ?? Math.PI * 2);
      const sp = (bu.speed || 1400) * (0.35 + R() * 0.75);
      parts.push({ n, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, spin: (R() - 0.5) * 1400, r0: R() * 90, life: (bu.life || 1.3) * (0.7 + R() * 0.5), drag: 2.4 + R() * 1.2 });
    }
    all.push({ bu, parts });
  }
  return {
    update(t) {
      for (const { bu, parts } of all) {
        const dt = t - bu.t;
        for (const p of parts) {
          if (dt < 0 || dt > p.life) { set(p.n, { o: 0 }); continue; }
          // exponential drag + gravity, integrated analytically
          const k = (1 - Math.exp(-p.drag * dt)) / p.drag;
          const g = bu.gravity ?? 1600;
          const x = bu.x + p.vx * k + (bu.dx ? bu.dx(t) : 0);
          const y = bu.y + p.vy * k + 0.5 * g * dt * dt * 0.55;
          const life = dt / p.life;
          set(p.n, { x, y, r: p.r0 + p.spin * k, s: 1 - life * 0.5, o: life < 0.75 ? 1 : 1 - (life - 0.75) / 0.25 });
        }
      }
    },
  };
}

// ------------------------------------------------------------------ camera hits + flashes
/** hits: [{ t, amp (px), punch (scale), freq, decay }] */
export function cameraAt(t, hits) {
  let x = 0;
  let y = 0;
  let s = 1;
  let r = 0;
  for (const h of hits) {
    const dt = t - h.t;
    if (dt < 0 || dt > 1.2) continue;
    const w = wobble(dt, h.freq || 11, h.decay || 9);
    const w2 = wobble(dt + 0.021, (h.freq || 11) * 1.37, h.decay || 9);
    x += w * (h.amp || 0);
    y += w2 * (h.amp || 0) * 0.8;
    r += w * (h.rot || 0);
    s += (h.punch || 0) * Math.exp(-dt * (h.punchDecay || 10));
  }
  return { x, y, s, r };
}

/** flashes: [{ t, peak, dur, color }] -> {opacity, color} of the strongest active flash */
export function flashAt(t, flashes) {
  let best = { o: 0, color: '#fff' };
  for (const f of flashes) {
    const dt = t - f.t;
    if (dt < -0.02 || dt > f.dur) continue;
    const o = (f.peak ?? 0.8) * (dt < 0 ? 1 + dt / 0.02 : Math.pow(1 - dt / f.dur, 2));
    if (o > best.o) best = { o, color: f.color || '#fff' };
  }
  return best;
}

export { clamp, lerp };
