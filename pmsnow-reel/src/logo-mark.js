// The ineed.now mark: 3x3 rounded squares (r = 24/128), bottom-right hollow
// (stroke = 1/4 of the square, inner radius 6/128). Measured from the brand PNG.
import { add, gsap } from './lib.js';

let uid = 0;
export function makeLogo(parent, { cx, cy, size, color = '#ff4d1f' }) {
  const s = size / 4;
  const root = add(parent, `<div class="logo-mark" style="position:absolute;left:${cx - size / 2}px;top:${cy - size / 2}px;width:${size}px;height:${size}px"></div>`);
  const squares = [];
  const id = `hole${uid++}`;
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
    const hollow = i === 2 && j === 2;
    const sq = add(root, `<div class="lm-sq" style="position:absolute;left:${i * 1.5 * s}px;top:${j * 1.5 * s}px;width:${s}px;height:${s}px"></div>`);
    if (!hollow) {
      sq.style.background = color;
      sq.style.borderRadius = '18.75%';
    } else {
      sq.innerHTML = `<svg viewBox="0 0 128 128" width="${s}" height="${s}" style="display:block;overflow:visible">
        <defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="148" height="148">
          <rect width="128" height="128" rx="24" fill="#fff"/>
          <rect class="hole-r" x="32" y="32" width="64" height="64" rx="6" fill="#000"/>
        </mask></defs>
        <rect class="hollow-body" width="128" height="128" rx="24" fill="${color}" mask="url(#${id})"/>
      </svg><div class="hole-probe" style="position:absolute;left:25%;top:25%;width:50%;height:50%"></div>`;
    }
    squares.push(sq);
  }
  const hole = squares[8].querySelector('.hole-r');
  gsap.set(hole, { transformOrigin: '50% 50%' });
  return {
    el: root, squares, s, size, cx, cy,
    hole, probe: squares[8].querySelector('.hole-probe'),
    /** stage coords of a square's centre */
    center(i, j) { return [cx + (1.5 * i - 1.5) * s, cy + (1.5 * j - 1.5) * s]; },
  };
}
