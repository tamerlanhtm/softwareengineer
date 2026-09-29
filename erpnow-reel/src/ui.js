/* Shared brand components: logo tiles, kickers, headlines, cards, cursor, transitions. */
(function () {
  'use strict';
  const { h, set, tw, E, norm, lerp, clamp, px } = K;

  const C = (K.C = {
    orange: '#FE4D1E', orange2: '#FF7446', orangeDeep: '#D9380D', peach: '#FFE4D9',
    ink: '#0B0B0D', ink2: '#141417', ink3: '#1D1D22', cream: '#FFF5EF', paper: '#FFFFFF',
    text: '#151517', muted: '#6E6E76', green: '#12B76A', amber: '#F5A524', red: '#F04438',
  });

  // ---- logo geometry (measured from the supplied mark) -------------------------------
  // 3x3 grid on an 8-unit square: tile = 2u, gap = 1u. Filled tiles: radius 0.186*tile.
  // Hollow tile (index 8): outer radius 0.317*tile, stroke 0.25*tile.
  const LOGO = (K.LOGO = { r: 0.186, hr: 0.317, stroke: 0.25 });
  K.logoOffset = (i, size) => { // tile centre relative to logo centre, for a logo `size` px wide
    const u = size / 8;
    return [((i % 3) - 1) * 3 * u, (Math.floor(i / 3) - 1) * 3 * u];
  };
  K.makeTiles = (parent, n = 9, hollowIndex = 8) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const el = h('div', { cls: i === hollowIndex ? 'lt hollow' : 'lt' }, parent);
      el._hollow = i === hollowIndex;
      out.push(el);
    }
    return out;
  };
  // Place a tile by centre (cx, cy) and edge length; o: {r, s, o, color, sx, sy, ry, rx, blur}
  K.placeTile = (el, cx, cy, size, o = {}) => {
    const st = el.style;
    const sz = Math.max(0.01, size);
    st.width = st.height = px(sz);
    if (el._hollow) {
      st.borderRadius = px(LOGO.hr * sz);
      st.borderWidth = px(LOGO.stroke * sz);
      if (o.color) st.borderColor = o.color;
      if (o.fill) st.background = o.fill; else st.background = 'transparent';
    } else {
      st.borderRadius = px((o.radius ?? LOGO.r) * sz);
      if (o.color) st.background = o.color;
    }
    set(el, { x: cx - sz / 2, y: cy - sz / 2, r: o.r || 0, s: o.s ?? 1, sx: o.sx, sy: o.sy,
      rx: o.rx, ry: o.ry, o: o.o ?? 1, blur: o.blur });
  };
  // Static logo element (for kickers, end card etc.)
  K.logoStatic = (parent, size, o = {}) => {
    const wrap = h('div', { cls: 'abs', css: { width: px(size), height: px(size) } }, parent);
    const tiles = K.makeTiles(wrap);
    tiles.forEach((el, i) => {
      const [dx, dy] = K.logoOffset(i, size);
      const active = !o.active || o.active.includes(i) || i === 8;
      const col = o.active ? (o.active.includes(i) ? o.on : o.off) : o.color || C.orange;
      K.placeTile(el, size / 2 + dx, size / 2 + dy, size / 4, { color: i === 8 ? (o.hollow || o.off || col) : col });
      if (!active && i !== 8) el.style.background = o.off;
    });
    wrap._tiles = tiles;
    return wrap;
  };

  // ---- kicker: [mini logo with active tile] LABEL ----------------------------------
  K.kicker = (parent, { x = 84, y = 292, label, active = [], theme = 'dark' }) => {
    const on = theme === 'orange' ? '#fff' : C.orange;
    const off = theme === 'dark' ? 'rgba(255,255,255,0.16)' : theme === 'orange' ? 'rgba(255,255,255,0.28)' : 'rgba(20,20,22,0.13)';
    const col = theme === 'light' ? C.text : '#fff';
    const el = h('div', { cls: 'abs row', css: { left: px(x), top: px(y), gap: '20px' } }, parent);
    const logo = K.logoStatic(el, 44, { active, on, off, hollow: off });
    logo.style.position = 'relative';
    const lab = h('div', { cls: 'mono', text: label, css: { font: "700 25px 'Mono'", letterSpacing: '0.2em', color: col } }, el);
    return {
      el,
      update(t, tIn, tOut = 99) {
        const a = tw(t, tIn, 0.55), b = tw(t, tOut, 0.3, E.in3);
        set(el, { x: lerp(-40, 0, a) - b * 30, o: a * (1 - b) });
        logo._tiles.forEach((tl, i) => {
          const p = K.spr(t, tIn + 0.04 * i, 3, 0.5);
          const [dx, dy] = K.logoOffset(i, 44);
          K.placeTile(tl, 22 + dx, 22 + dy, 11 * clamp(p, 0, 1.3), {});
        });
      },
    };
  };

  // ---- headline with masked line reveals -------------------------------------------
  // lines: array of HTML strings. Returns { el, lines: [inner...], update(t, tIn, tOut) }
  K.headline = (parent, lines, o = {}) => {
    const el = h('div', { cls: 'abs display', css: {
      left: px(o.x ?? 84), top: px(o.y ?? 360), width: px(o.w ?? 912),
      fontSize: px(o.size ?? 96), color: o.color ?? '#fff', fontWeight: o.weight ?? 800,
      textAlign: o.align ?? 'left', lineHeight: o.lh ?? 1.0, letterSpacing: o.ls ?? '-0.04em',
    } }, parent);
    const inners = lines.map((html) => {
      const wrap = h('div', { cls: 'line-wrap' }, el);
      return h('div', { cls: 'line', html }, wrap);
    });
    return {
      el, lines: inners,
      update(t, tIn, tOut = 99, stagger = 0.075, outDur = 0.26) {
        inners.forEach((ln, i) => {
          const a = tw(t, tIn + i * stagger, 0.7, E.swift);
          const b = tw(t, tOut + i * 0.035, outDur, E.in2);
          const y = ((1 - a) * 1.3 - b * 1.3) * 100;
          ln.style.transform = `translateY(${y.toFixed(3)}%) rotate(${((1 - a) * 2).toFixed(3)}deg)`;
          ln.style.visibility = a < 0.001 || b > 0.999 ? 'hidden' : '';
        });
      },
    };
  };

  // ---- small UI atoms -----------------------------------------------------------------
  K.pill = (parent, text, o = {}) => {
    const el = h('div', { cls: 'pill', css: { background: o.bg ?? 'rgba(254,77,30,0.12)', color: o.fg ?? C.orange,
      height: o.h ? px(o.h) : undefined, fontSize: o.fs ? px(o.fs) : undefined, padding: o.pad } }, parent);
    if (o.dot) h('span', { css: { width: '12px', height: '12px', borderRadius: '6px', background: o.dot, flex: 'none' } }, el);
    if (o.icon) el.appendChild(window.icon(o.icon, o.iconSize ?? 24, o.fg ?? C.orange, 2.6));
    const label = h('span', { text }, el);
    el._label = label;
    return el;
  };
  K.glow = (parent, { x, y, r, color = C.orange, o = 0.5 }) => h('div', { cls: 'abs', css: {
    left: px(x - r), top: px(y - r), width: px(2 * r), height: px(2 * r), borderRadius: '50%', opacity: o,
    background: `radial-gradient(circle, ${color} 0%, rgba(254,77,30,0) 70%)` } }, parent);

  // Mouse pointer (macOS-like) with click squash.
  K.cursor = (parent) => {
    const el = h('div', { cls: 'abs', css: { width: '64px', height: '64px', zIndex: 50,
      filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.35))' } }, parent);
    el.innerHTML = '<svg width="64" height="64" viewBox="0 0 32 32"><path d="M6 3.5v21.8l5.6-5.3 3.6 8.2 3.9-1.7-3.5-8h7.8z" fill="#111" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    return el;
  };
  // Expanding ring feedback at a point.
  K.ripple = (parent, color = 'rgba(255,255,255,0.9)') => {
    const el = h('div', { cls: 'abs', css: { width: '100px', height: '100px', borderRadius: '50%', border: `5px solid ${color}`, zIndex: 49 } }, parent);
    return (t, t0, x, y, size = 150) => {
      const p = norm(t, t0, t0 + 0.45);
      const s = lerp(0.2, 1, E.out3(p)) * size / 100;
      set(el, { x: x - 50, y: y - 50, s, o: p > 0 && p < 1 ? 1 - E.in2(p) : 0 });
    };
  };

  // Cursor path helper: keys [[t, x, y], ...] with eased segments; clicks [t...]
  K.cursorState = (t, keys, clicks = []) => {
    const x = K.kf(t, keys.map(([tt, xx]) => [tt, xx, E.io3]));
    const y = K.kf(t, keys.map(([tt, , yy]) => [tt, yy, E.io3]));
    let s = 1;
    for (const c of clicks) { const d = t - c; if (d > -0.08 && d < 0.2) s = Math.min(s, d < 0 ? 1 - 0.18 * (1 + d / 0.08) : 0.82 + 0.18 * E.out2(d / 0.2)); }
    return { x, y, s };
  };

  // Tile matrix background (dim LED-like grid of logo tiles).
  K.tileMatrix = (parent, { cols = 9, rows = 16, pitch = 120, size = 64, color = 'rgba(255,255,255,0.05)', x0, y0 } = {}) => {
    const wrap = h('div', { cls: 'fill' }, parent);
    const tiles = [];
    const ox = x0 ?? (1080 - (cols - 1) * pitch) / 2, oy = y0 ?? (1920 - (rows - 1) * pitch) / 2;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const el = h('div', { cls: 'abs', css: { width: px(size), height: px(size), borderRadius: px(size * 0.186), background: color } }, wrap);
      tiles.push({ el, c, r, x: ox + c * pitch - size / 2, y: oy + r * pitch - size / 2 });
    }
    return { wrap, tiles };
  };

  // Money counter helper.
  K.countMoney = (t, t0, d, from, to, e = E.out3) => K.money(lerp(from, to, tw(t, t0, d, e)));

  // Signature transition: a wave of logo tiles covers the frame from an origin, then clears.
  // Returns the time at which the frame is fully covered (swap scenes there).
  K.tileWave = ({ t0, color, ox, oy, cols = 7, rows = 13, spread = 0.2, grow = 0.2, hold = 0.03, shrink = 0.26, spin = 70, z = 600 }) => {
    const tFull = t0 + spread + grow;
    K.layer('wave@' + t0, (root) => {
      const cw = 1080 / cols, ch = 1920 / rows, size = Math.max(cw, ch) * 1.34;
      const tiles = [];
      let maxD = 1;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const cx = (c + 0.5) * cw, cy = (r + 0.5) * ch, d = Math.hypot(cx - ox, cy - oy);
        maxD = Math.max(maxD, d);
        tiles.push({ cx, cy, d, el: h('div', { cls: 'abs', css: { width: px(size), height: px(size), borderRadius: px(size * K.LOGO.r), background: color } }, root) });
      }
      tiles.forEach((q) => { q.delay = (q.d / maxD) * spread; });
      return (t) => {
        const on = t >= t0 && t < tFull + hold + spread + shrink;
        root.style.display = on ? '' : 'none';
        if (!on) return;
        for (const q of tiles) {
          const g = E.out3(norm(t, t0 + q.delay, t0 + q.delay + grow));
          const s2 = E.in3(norm(t, tFull + hold + q.delay, tFull + hold + q.delay + shrink));
          set(q.el, { x: q.cx - size / 2, y: q.cy - size / 2, r: (1 - g) * spin - s2 * spin, s: g * (1 - s2), o: g * (1 - s2) > 0.001 ? 1 : 0 });
        }
      };
    }, z);
    K.sfx('wave', t0, { dur: tFull - t0 + 0.3 });
    return tFull;
  };

  // Rounded-rect clip path (for iris transitions); works beyond the element bounds.
  K.rrPath = (x, y, w, hh, r) => {
    r = Math.max(0, Math.min(r, w / 2, hh / 2));
    const f = (v) => v.toFixed(2);
    return `path('M${f(x + r)},${f(y)} H${f(x + w - r)} A${f(r)},${f(r)} 0 0 1 ${f(x + w)},${f(y + r)} V${f(y + hh - r)} A${f(r)},${f(r)} 0 0 1 ${f(x + w - r)},${f(y + hh)} H${f(x + r)} A${f(r)},${f(r)} 0 0 1 ${f(x)},${f(y + hh - r)} V${f(y + r)} A${f(r)},${f(r)} 0 0 1 ${f(x + r)},${f(y)} Z')`;
  };
})();
