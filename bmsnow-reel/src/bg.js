import { el, css, rng, W, H, COLOR, rrPath } from './lib.js';

// Persistent background: base colour, drifting glow orbs, a dot grid and a
// field of floating rounded squares (the logo's building block) with depth blur.
export function buildBackground({ layers, onFrame }) {
  const root = layers.bg;
  const base = el('div', 'layer', root);
  base.style.background = COLOR.ink;

  const orb = (size, color) => {
    const o = el('div', 'abs', root);
    css(o, {
      width: size + 'px', height: size + 'px', left: -size / 2 + 'px', top: -size / 2 + 'px',
      borderRadius: '50%', background: `radial-gradient(circle, ${color} 0%, rgba(254,77,30,0) 68%)`,
    });
    return o;
  };
  const orbA = orb(1500, 'rgba(254,77,30,0.34)');
  const orbB = orb(1200, 'rgba(255,120,70,0.22)');

  const dots = el('div', 'layer', root);
  css(dots, {
    backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1.7px, transparent 2px)',
    backgroundSize: '46px 46px',
  });

  const canvas = el('canvas', 'layer', root);
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');

  const vignette = el('div', 'layer', root);
  css(vignette, { background: 'radial-gradient(120% 80% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)' });

  // particle sprites (pre-blurred once)
  const r = rng(7);
  const parts = [];
  for (let i = 0; i < 30; i++) {
    const depth = r();
    const size = 10 + Math.pow(r(), 1.6) * 46;
    const blur = depth < 0.35 ? 0 : (depth - 0.35) * 22;
    const pad = Math.ceil(blur * 2.5 + 4);
    const sc = document.createElement('canvas');
    sc.width = sc.height = Math.ceil(size + pad * 2);
    const sg = sc.getContext('2d');
    sg.filter = blur ? `blur(${blur.toFixed(1)}px)` : 'none';
    sg.fillStyle = r() < 0.86 ? COLOR.orange : '#FFFFFF';
    sg.fill(new Path2D(rrPath(pad, pad, size, size, size * 0.183)));
    parts.push({
      sc, half: sc.width / 2,
      x: r() * W, y: r() * (H + 300),
      vy: -(18 + (1 - depth) * 70),
      vx: (r() - 0.5) * 14,
      rot: r() * Math.PI * 2, vr: (r() - 0.5) * 0.9,
      alpha: 0.25 + (1 - depth) * 0.55,
      wob: r() * 6.28,
    });
  }

  const state = { glow: 0.0, dots: 0.0, particles: 0.0, vignette: 1, orbX: 0.5, orbY: 0.42, speed: 1, lift: 0 };

  // kick-synced glow pulse (120 BPM): a short lift on every beat while the drums play
  const KICK_SPANS = [[2.0, 22.0], [24.0, 29.5]];
  const kickPulse = (t) => {
    for (const [a, b] of KICK_SPANS) {
      if (t >= a && t < b) return Math.exp(-((t - a) % 0.5) / 0.1);
    }
    return 0;
  };

  onFrame((t) => {
    const pulse = 1 + 0.14 * kickPulse(t);
    const ax = state.orbX * W + Math.sin(t * 0.55) * 160;
    const ay = state.orbY * H + Math.cos(t * 0.42) * 190;
    orbA.style.transform = `translate(${ax}px, ${ay}px)`;
    orbA.style.opacity = Math.min(1, state.glow * pulse);
    const bx = (1 - state.orbX) * W + Math.cos(t * 0.37 + 1) * 220;
    const by = (state.orbY + 0.28) * H + Math.sin(t * 0.5 + 2) * 160;
    orbB.style.transform = `translate(${bx}px, ${by}px)`;
    orbB.style.opacity = Math.min(1, state.glow * 0.9 * pulse);
    dots.style.opacity = state.dots;
    dots.style.backgroundPosition = `0px ${(-t * 14 - state.lift).toFixed(2)}px`;
    vignette.style.opacity = state.vignette;

    g.clearRect(0, 0, W, H);
    if (state.particles > 0.001) {
      g.globalAlpha = 1;
      for (const p of parts) {
        const span = H + 300;
        let y = (((p.y + p.vy * t * state.speed - state.lift * (p.alpha)) % span) + span) % span - 150;
        const x = p.x + p.vx * t + Math.sin(t * 0.8 + p.wob) * 18;
        g.save();
        g.globalAlpha = p.alpha * state.particles;
        g.translate(x, y);
        g.rotate(p.rot + p.vr * t);
        g.drawImage(p.sc, -p.half, -p.half);
        g.restore();
      }
    }
  });

  return {
    base,
    state,
    // animate background params at time t
    to(tl, t, { color, dur = 0.4, ease = 'power2.inOut', ...params }) {
      if (color) tl.to(base, { backgroundColor: color, duration: dur, ease }, t);
      if (Object.keys(params).length) tl.to(state, { ...params, duration: dur, ease }, t);
    },
  };
}
