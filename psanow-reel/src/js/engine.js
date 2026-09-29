// Tiny deterministic motion engine: every visual is a pure function of time t (seconds).
(function () {
  const R = (window.R = {});
  // Language: index.html?lang=az renders the Azerbaijani cut.
  R.LANG = new URLSearchParams(location.search).get('lang') || 'en';
  R.AZ = R.LANG === 'az';
  R.t = (en, az) => (R.AZ ? az : en);
  // Largest font size (px) at which every line fits maxW.
  R.fit = (lines, css, size, maxW) => {
    const w = Math.max(...lines.map((l) => R.measure(l, Object.assign({}, css, { fontSize: size + 'px' }))));
    return w > maxW ? Math.floor((size * maxW) / w) : size;
  };
  R.W = 1080;
  R.H = 1920;

  R.C = {
    bg: '#0B0908',
    surface: '#15110F',
    card: '#1B1613',
    card2: '#231D19',
    line: '#2E2622',
    muted: '#8F857D',
    soft: '#C9C0B9',
    text: '#F7F3F0',
    orange: '#FE4D1E',
    orange2: '#FF7A4D',
    orange3: '#FFB59C',
    ink: '#141110',
  };

  // ---------- math ----------
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, x) => (b === a ? (x >= b ? 1 : 0) : clamp((x - a) / (b - a)));
  R.clamp = clamp;
  R.lerp = lerp;
  R.inv = inv;

  // ---------- easing ----------
  const E = {
    lin: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    inQuart: (t) => t * t * t * t,
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    inQuint: (t) => t * t * t * t * t,
    outQuint: (t) => 1 - Math.pow(1 - t, 5),
    inOutQuint: (t) => (t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2),
    inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutExpo: (t) =>
      t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
    inCirc: (t) => 1 - Math.sqrt(1 - t * t),
    outCirc: (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
    outBack: (t) => {
      const s = 1.70158;
      return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
    },
    inBack: (t) => {
      const s = 1.70158;
      return (s + 1) * t * t * t - s * t * t;
    },
    inOutBack: (t) => {
      const c2 = 1.70158 * 1.525;
      return t < 0.5
        ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
        : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    },
    outElastic: (t) => {
      const c4 = (2 * Math.PI) / 3;
      return t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
  };
  // Back easing with custom overshoot.
  E.back = (s) => (t) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  // Physically based spring step response (dt in seconds). Overshoots, settles at 1.
  R.spring = (dt, zeta = 0.42, omega = 16) => {
    if (dt <= 0) return 0;
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * omega * dt) * (Math.cos(wd * dt) + ((zeta * omega) / wd) * Math.sin(wd * dt));
  };
  R.E = E;

  // value between a and b for t in [t0,t1]
  R.tw = (t, t0, t1, a, b, e = E.outCubic) => lerp(a, b, e(inv(t0, t1, t)));
  // piecewise keyframes: [[time, value, easeIntoThisKey?], ...]
  R.kf = (t, keys, defEase = E.inOutCubic) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i];
      if (t <= k[0]) {
        const p = keys[i - 1];
        return lerp(p[1], k[1], (k[2] || defEase)(inv(p[0], k[0], t)));
      }
    }
    return keys[keys.length - 1][1];
  };
  // 0 -> 1 -> 0 envelope: rise over [a,b], hold, fall over [c,d]
  R.env = (t, a, b, c, d, eIn = E.outCubic, eOut = E.inCubic) => {
    if (t < a || t > d) return 0;
    if (t < b) return eIn(inv(a, b, t));
    if (t <= c) return 1;
    return 1 - eOut(inv(c, d, t));
  };

  // ---------- randomness (deterministic) ----------
  R.rng = (seed) => {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  R.hash = (...n) => {
    let h = 2166136261 >>> 0;
    for (const v of n) {
      h ^= Math.imul((v * 1000) | 0, 2654435761);
      h = Math.imul(h ^ (h >>> 13), 16777619);
    }
    h ^= h >>> 15;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 13;
    return (h >>> 0) / 4294967296;
  };
  // smooth 1D noise in [-1,1]
  R.noise = (x, seed = 0) => {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    const a = R.hash(i, seed) * 2 - 1;
    const b = R.hash(i + 1, seed) * 2 - 1;
    return a + (b - a) * u;
  };

  // ---------- DOM ----------
  R.el = (parent, cls = '', css = null, html = null, tag = 'div') => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (css) Object.assign(n.style, css);
    if (html != null) n.innerHTML = html;
    if (parent) parent.appendChild(n);
    return n;
  };
  R.svgIcon = (name, size, stroke = 2, color = 'currentColor') =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" style="display:block">${window.ICONS[name]}</svg>`;

  const f = (v) => (Math.abs(v) < 1e-4 ? 0 : +v.toFixed(3));
  // 2D transform (keeps text crisp); use T3 for real 3D.
  R.T = (n, o) => {
    const x = o.x || 0, y = o.y || 0, r = o.r || 0;
    const s = o.s == null ? 1 : o.s;
    const sx = (o.sx == null ? 1 : o.sx) * s;
    const sy = (o.sy == null ? 1 : o.sy) * s;
    let tr = `translate(${f(x)}px,${f(y)}px)`;
    if (r) tr += ` rotate(${f(r)}deg)`;
    if (o.skx || o.sky) tr += ` skew(${f(o.skx || 0)}deg,${f(o.sky || 0)}deg)`;
    if (sx !== 1 || sy !== 1) tr += ` scale(${f(sx)},${f(sy)})`;
    n.style.transform = tr;
  };
  R.T3 = (n, o) => {
    const x = o.x || 0, y = o.y || 0, z = o.z || 0;
    const s = o.s == null ? 1 : o.s;
    let tr = o.p ? `perspective(${o.p}px) ` : '';
    tr += `translate3d(${f(x)}px,${f(y)}px,${f(z)}px)`;
    if (o.rx) tr += ` rotateX(${f(o.rx)}deg)`;
    if (o.ry) tr += ` rotateY(${f(o.ry)}deg)`;
    if (o.r) tr += ` rotate(${f(o.r)}deg)`;
    if (s !== 1 || o.sx != null || o.sy != null)
      tr += ` scale(${f(s * (o.sx == null ? 1 : o.sx))},${f(s * (o.sy == null ? 1 : o.sy))})`;
    n.style.transform = tr;
  };
  R.O = (n, v) => {
    v = clamp(v);
    n.style.opacity = f(v);
    n.style.visibility = v <= 0.002 ? 'hidden' : 'visible';
  };
  R.show = (n, on) => {
    n.style.display = on ? '' : 'none';
  };
  R.blur = (n, px) => {
    n.style.filter = px > 0.05 ? `blur(${f(px)}px)` : 'none';
  };

  // split text into inline-block spans
  R.chars = (parent, text, cls = 'ch') =>
    [...text].map((c) => {
      const s = R.el(parent, cls, null, null, 'span');
      s.textContent = c === ' ' ? ' ' : c;
      return s;
    });
  // A line whose words sit in overflow-hidden masks (classic slide-up reveal).
  R.maskWords = (parent, text, cls = '') => {
    const words = text.split(' ');
    return words.map((w, i) => {
      const m = R.el(parent, 'mask ' + cls, null, null, 'span');
      const inner = R.el(m, 'mask-in', null, null, 'span');
      inner.textContent = w;
      if (i < words.length - 1) R.el(parent, 'sp', null, ' ', 'span');
      return inner;
    });
  };
  R.measure = (text, css) => {
    const n = R.el(document.body, '', Object.assign({ position: 'absolute', left: '-9999px', top: '0', whiteSpace: 'pre' }, css));
    n.textContent = text;
    const w = n.getBoundingClientRect().width;
    n.remove();
    return w;
  };
  // "decode" text effect: resolves random glyphs into the target string
  const GL = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=/<>';
  R.decode = (target, p, seed = 1, frameT = 0) => {
    const n = target.length;
    let out = '';
    for (let i = 0; i < n; i++) {
      const c = target[i];
      const th = (i / n) * 0.7;
      if (c === ' ' || c === '·') { out += p > th ? c : ' '; continue; }
      if (p >= th + 0.3) out += c;
      else if (p > th) out += GL[Math.floor(R.hash(i, seed, Math.floor(frameT * 30)) * GL.length)];
      else out += ' ';
    }
    return out;
  };
  R.fmt = (v, dec = 0) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  // ---------- global FX registries ----------
  R.impacts = []; // camera shake impulses
  R.flashes = []; // full screen flashes
  R.impact = (t, amp = 14, dec = 9, freq = 11) => R.impacts.push({ t, amp, dec, freq });
  R.flash = (t, color = '#fff', amp = 0.6, dur = 0.3) => R.flashes.push({ t, color, amp, dur });
  R.shakeAt = (t) => {
    let x = 0, y = 0, r = 0;
    for (const im of R.impacts) {
      const dt = t - im.t;
      if (dt < 0 || dt > 1.2) continue;
      const a = im.amp * Math.exp(-dt * im.dec);
      const w = im.freq * 2 * Math.PI;
      x += a * Math.sin(dt * w + im.t * 7.1);
      y += a * 0.8 * Math.cos(dt * w * 1.31 + im.t * 3.3);
      r += a * 0.035 * Math.sin(dt * w * 0.77 + im.t);
    }
    return { x, y, r };
  };
})();
