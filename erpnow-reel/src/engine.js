/* ERPNow reel - a tiny deterministic motion toolkit.
   Every visual property is a pure function of time t (seconds), so frames can be
   rendered in any order, in parallel, and sub-sampled for motion blur. */
(function () {
  'use strict';
  const W = 1080, H = 1920, FPS = 30;

  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const norm = (x, a, b) => clamp((x - a) / (b - a));

  // CSS-style cubic-bezier easing.
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - x, d = dx(t);
        if (Math.abs(e) < 1e-7 || Math.abs(d) < 1e-7) break;
        t -= e / d;
      }
      if (t < 0 || t > 1 || Math.abs(sx(t) - x) > 1e-4) { // bisection fallback
        let lo = 0, hi = 1; t = x;
        for (let i = 0; i < 40; i++) { const v = sx(t); if (v > x) hi = t; else lo = t; t = (lo + hi) / 2; }
      }
      return sy(t);
    };
  }

  const back = (s) => (t) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
  const E = {
    lin: (t) => t,
    in2: (t) => t * t, out2: (t) => 1 - (1 - t) ** 2,
    io2: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
    in3: (t) => t ** 3, out3: (t) => 1 - (1 - t) ** 3,
    io3: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
    in4: (t) => t ** 4, out4: (t) => 1 - (1 - t) ** 4,
    io4: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2),
    in5: (t) => t ** 5, out5: (t) => 1 - (1 - t) ** 5,
    io5: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2),
    inExpo: (t) => (t <= 0 ? 0 : 2 ** (10 * t - 10)),
    outExpo: (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
    ioExpo: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2),
    outCirc: (t) => Math.sqrt(1 - (t - 1) ** 2),
    back, outBack: back(1.70158), outBackSoft: back(1.1), outBackHard: back(2.6),
    inBack: (t) => 2.70158 * t ** 3 - 1.70158 * t * t,
    // house curves
    swift: bezier(0.16, 1, 0.3, 1),     // silky expo-out for entrances
    snap: bezier(0.75, 0, 0.15, 1),     // aggressive in-out for moves / whips
    glide: bezier(0.45, 0, 0.1, 1),
    drop: bezier(0.55, 0, 0.9, 0.3),    // accelerate into a cut
  };

  // Eased progress of a window [t0, t0 + d].
  const tw = (t, t0, d, e = E.swift) => e(norm(t, t0, t0 + d));

  // Under-damped spring step response (0 -> 1 with overshoot), f in Hz, z = damping ratio.
  function spr(t, t0, f = 2.4, z = 0.42) {
    const x = t - t0;
    if (x <= 0) return 0;
    const w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + ((z * w) / wd) * Math.sin(wd * x));
  }

  // Keyframes: kf(t, [[t0, v0], [t1, v1, ease], ...]); values may be numbers or arrays.
  function kf(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, e] = keys[i];
      if (t < t1) {
        const [t0, v0] = keys[i - 1];
        const p = (e || E.io3)((t - t0) / (t1 - t0));
        if (Array.isArray(v0)) return v0.map((a, j) => lerp(a, v1[j], p));
        return lerp(v0, v1, p);
      }
    }
    return keys[keys.length - 1][1];
  }

  // Deterministic randomness / smooth noise.
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let r = Math.imul(a ^ (a >>> 15), 1 | a);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  function noise1(x) { // smooth value noise in [-1, 1]
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(hash(i), hash(i + 1), u) * 2 - 1;
  }

  // DOM helpers.
  function h(tag, o = {}, parent) {
    const n = document.createElement(tag);
    if (o.cls) n.className = o.cls;
    if (o.text != null) n.textContent = o.text;
    if (o.html != null) n.innerHTML = o.html;
    if (o.css) Object.assign(n.style, o.css);
    if (o.attrs) for (const k in o.attrs) n.setAttribute(k, o.attrs[k]);
    (o.parent || parent)?.appendChild(n);
    return n;
  }
  const SVGNS = 'http://www.w3.org/2000/svg';
  function sv(tag, attrs = {}, parent) {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent?.appendChild(n);
    return n;
  }

  const r3 = (v) => Math.round(v * 1000) / 1000;
  function tf(o) {
    let s = '';
    if (o.px != null) s += `perspective(${o.px}px) `;
    if (o.x || o.y || o.z) s += `translate3d(${r3(o.x || 0)}px,${r3(o.y || 0)}px,${r3(o.z || 0)}px) `;
    if (o.rx) s += `rotateX(${r3(o.rx)}deg) `;
    if (o.ry) s += `rotateY(${r3(o.ry)}deg) `;
    if (o.r) s += `rotate(${r3(o.r)}deg) `;
    const sc = o.s ?? 1, sx = sc * (o.sx ?? 1), sy = sc * (o.sy ?? 1);
    if (sx !== 1 || sy !== 1) s += `scale(${r3(sx)},${r3(sy)}) `;
    if (o.skx) s += `skewX(${r3(o.skx)}deg) `;
    return s || 'none';
  }
  // Apply a full animated state to a node (transform + opacity + blur + visibility).
  function set(n, o) {
    const st = n.style;
    st.transform = tf(o);
    const op = o.o ?? 1;
    st.opacity = op < 0.001 ? 0 : op > 0.999 ? '' : r3(op);
    st.visibility = op < 0.001 ? 'hidden' : '';
    if (o.blur !== undefined) st.filter = o.blur > 0.05 ? `blur(${r3(o.blur)}px)` : '';
  }
  const px = (v) => `${r3(v)}px`;

  // Formatting.
  const money = (v, d = 2) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const int = (v) => Math.round(v).toLocaleString('en-US');

  // ---- scene graph -------------------------------------------------------------------
  const K = (window.K = {
    W, H, FPS, clamp, lerp, norm, bezier, E, tw, spr, kf, rng, hash, noise1,
    h, sv, tf, set, px, money, int,
    scenes: [], layers: [], cues: [], shakes: [], flashes: [], defs: [], fastWin: [],
  });
  // Scene files register builders; main.js runs them once fonts are loaded.
  K.def = (fn) => K.defs.push(fn);

  // A scene owns a full-frame root that is only displayed inside [t0, t1).
  K.scene = function (name, t0, t1, build, opts = {}) {
    const root = h('div', { cls: 'scene', parent: document.getElementById('scenes') });
    root.dataset.scene = name;
    if (opts.bg) root.style.background = opts.bg;
    const s = { name, t0, t1, root, on: null };
    root.style.zIndex = String(opts.z ?? 10 + K.scenes.length);
    s.update = build(root, s) || (() => {});
    K.scenes.push(s);
    return s;
  };
  // Free-standing animated layers (transitions) above scenes; update(t) handles visibility.
  K.layer = function (name, build, z = 500) {
    const root = h('div', { cls: 'layer', parent: document.getElementById('scenes') });
    root.dataset.layer = name;
    root.style.zIndex = String(z);
    K.layers.push({ name, root, update: build(root) });
  };
  // Sound cues, camera shakes and flashes registered by scenes (audio reads cues.json).
  K.sfx = (type, t, o = {}) => { K.cues.push({ type, t: Math.round(t * 10000) / 10000, ...o }); };
  K.shake = (t, amp, dur = 0.35) => K.shakes.push({ t, amp, dur });
  K.flash = (t, color = '#fff', peak = 0.7, dur = 0.22) => K.flashes.push({ t, color, peak, dur });
  // Fast-motion windows: the renderer takes more motion-blur sub-frames inside them.
  K.fast = (t0, t1) => K.fastWin.push([t0, t1]);

  // Directional motion blur (SVG Gaussian along one axis), one filter per use-site.
  let mbCount = 0;
  K.motionBlur = (axis) => {
    const id = `mb${mbCount++}`;
    const f = sv('filter', { id, x: axis === 'x' ? '-25%' : '0%', y: axis === 'y' ? '-25%' : '0%',
      width: axis === 'x' ? '150%' : '100%', height: axis === 'y' ? '150%' : '100%', 'color-interpolation-filters': 'sRGB' },
      document.getElementById('fx-defs'));
    const g = sv('feGaussianBlur', { stdDeviation: '0' }, f);
    return (el, sigma) => {
      if (!(sigma > 0.6)) { el.style.filter = ''; return; }
      g.setAttribute('stdDeviation', axis === 'x' ? `${sigma.toFixed(2)} 0` : `0 ${sigma.toFixed(2)}`);
      el.style.filter = `url(#${id})`;
    };
  };
  // Velocity of a position function (px/s) and the blur it deserves for a 180-degree shutter.
  K.vel = (fn, t, dt = 1 / 480) => (fn(t + dt) - fn(t - dt)) / (2 * dt);
  K.sigma = (v) => Math.min(70, (Math.abs(v) * (0.5 / FPS)) / 3.2);

  let world, flashEl, grainEl;
  K.mount = function () {
    world = document.getElementById('world');
    flashEl = document.getElementById('flash');
    grainEl = document.getElementById('grain');
    // Film grain texture (seeded, so every render is identical).
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), img = g.createImageData(256, 256), R = rng(7);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (R() + R() + R() - 1.5) * 150;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    grainEl.style.backgroundImage = `url(${c.toDataURL()})`;
  };

  K.render = function (t) {
    for (const s of K.scenes) {
      const on = t >= s.t0 && t < s.t1;
      if (on !== s.on) { s.root.style.display = on ? '' : 'none'; s.on = on; }
      if (on) s.update(t);
    }
    for (const l of K.layers) l.update(t);

    // Camera shake: decaying smooth noise from every active impact.
    let sx = 0, sy = 0, sr = 0;
    for (const k of K.shakes) {
      const d = t - k.t;
      if (d < 0 || d > k.dur) continue;
      const a = k.amp * (1 - d / k.dur) ** 2;
      sx += a * noise1(t * 26 + k.t * 13);
      sy += a * noise1(t * 29 + k.t * 7 + 50);
      sr += a * 0.04 * noise1(t * 21 + k.t * 3 + 90);
    }
    world.style.transform = sx || sy ? `translate(${r3(sx)}px,${r3(sy)}px) rotate(${r3(sr)}deg)` : '';

    // Flashes.
    let fo = 0, fc = '#fff';
    for (const f of K.flashes) {
      const d = t - f.t;
      if (d < -0.03 || d > f.dur) continue;
      const a = d < 0 ? f.peak * (1 + d / 0.03) : f.peak * (1 - d / f.dur) ** 2;
      if (a > fo) { fo = a; fc = f.color; }
    }
    flashEl.style.opacity = r3(fo);
    flashEl.style.background = fc;

    // Grain: new offset each output frame (constant across motion-blur sub-samples).
    const fi = Math.floor(t * FPS + 1e-6), R = hash(fi * 3.7);
    grainEl.style.backgroundPosition = `${Math.floor(R * 256)}px ${Math.floor(hash(fi * 9.1) * 256)}px`;
  };
})();
