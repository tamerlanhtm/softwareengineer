/* The 9 logo squares are persistent "hero" objects that travel across scenes:
 * the hollow one opens the film (zoom-through), all nine assemble the logo,
 * morph into module tiles, and re-form the logo from the bento grid at the end.
 * Geometry sampled from the brand mark: pitch = 1.5·s, radius ≈ 0.18·s,
 * hollow square: outer radius ≈ 0.3·s, stroke = 0.25·s (hole = 0.5·s). */

const HOLLOW = 8;
const HEROES = [];

function heroInit() {
  const root = document.getElementById('heroes');
  for (let i = 0; i < 9; i++) {
    const d = el(`<div class="hero" data-i="${i}"></div>`);
    if (i === HOLLOW) d.style.background = COLORS.paper;
    root.appendChild(d);
    HEROES.push(d);
  }
  gsap.set(HEROES, { xPercent: -50, yPercent: -50, x: W / 2, y: H / 2, width: 100, height: 100 });
}

function logoCell(i, cx, cy, s, pitch = 1.5) {
  const r = Math.floor(i / 3), c = i % 3;
  return { x: cx + (c - 1) * pitch * s, y: cy + (r - 1) * pitch * s };
}

// GSAP vars that put hero i into the brand-mark layout.
function logoVars(i, cx, cy, s, pitch = 1.5) {
  const p = logoCell(i, cx, cy, s, pitch);
  const hollow = i === HOLLOW;
  return {
    x: p.x, y: p.y, width: s, height: s,
    borderRadius: (hollow ? 0.3 : 0.18) * s,
    borderWidth: hollow ? 0.25 * s : 0,
  };
}

// Order in which squares pop: diagonal wave emanating from the hollow square.
const WAVE_FROM_HOLLOW = [7, 5, 6, 4, 2, 3, 1, 0];
