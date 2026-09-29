import { el, tl, scene, textLine, riseIn, enter, fit, cue, shake, proc, rng, icon, fast, C } from '../lib.js';
import { T } from '../timing.js';

// 0–3s · "Still running your school on… spreadsheets? paperwork? 10 different apps?"
// Desaturated chaos piles up around the question, then everything is sucked
// into a single orange square — the seed of the logo.
export function buildHook({ world }) {
  const s = scene(world, 's-hook', 0, T.drop + 0.02);
  const chaos = el('div', { cls: 'layer' }, s);
  const front = el('div', { cls: 'layer' }, s);
  const items = [];
  const R = rng(42);

  // wrap (implosion) > inner (entrance) > wob (idle jitter) > content
  function item(parent, w, h, cx, cy) {
    const wrap = el('div', { cls: 'abs', css: `left:${cx - w / 2}px;top:${cy - h / 2}px;width:${w}px;height:${h}px;` }, parent);
    const inner = el('div', { cls: 'abs', css: 'inset:0;' }, wrap);
    const wob = el('div', { cls: 'abs', css: 'inset:0;' }, inner);
    const seed = R() * 100;
    proc((t) => {
      const k = t < T.q1 ? 0.4 : 1;
      wob.style.transform = `translate(${Math.sin(t * 3.1 + seed) * 5 * k}px,${Math.cos(t * 2.7 + seed) * 6 * k}px) rotate(${Math.sin(t * 2.3 + seed) * 1.6 * k}deg)`;
    });
    items.push({ wrap, cx, cy, w, h });
    return { inner, wob };
  }

  // ---------------------------------------------------------- spreadsheets
  function sheet(cx, cy, w, h, rot, name, refCell, seed) {
    const { inner, wob } = item(chaos, w, h, cx, cy);
    const r = rng(seed);
    const cols = 5;
    const rows = 7;
    let cells = '';
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const isRef = y === refCell[1] && x === refCell[0];
        const head = y === 0;
        const v = head ? 'ABCDE'[x] : isRef ? '#REF!' : x === 0 ? ['Aylin', 'Murad', 'Leyla', 'Elvin', 'Nigar', 'Kamran'][y - 1] : String(Math.floor(r() * 900 + 40));
        cells += `<div style="padding:0 10px;height:${(h - 58) / rows}px;display:flex;align-items:center;${head ? 'background:#E7E9EE;color:#6B7080;justify-content:center;font-weight:700;' : ''}${isRef ? `background:${C.redSoft};color:${C.red};font-weight:800;` : ''}border-right:1px solid #DADDE3;border-bottom:1px solid #DADDE3;font:600 17px var(--f-ui);white-space:nowrap;overflow:hidden;">${v}</div>`;
      }
    }
    el('div', {
      cls: 'abs',
      css: 'inset:0;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.5);',
      html: `<div style="height:58px;background:#1F7A4D;display:flex;align-items:center;gap:10px;padding:0 18px;color:#fff;font:600 18px var(--f-mono);letter-spacing:.02em">${icon('file-spreadsheet', 24, '#fff', 2)}${name}</div>
             <div style="display:grid;grid-template-columns:1.4fr repeat(4,1fr);">${cells}</div>`,
    }, wob);
    gsap.set(inner, { rotation: rot });
    return inner;
  }
  const sh1 = sheet(250, 300, 470, 300, -9, 'Budget_FINAL_v7(2).xlsx', [3, 3], 3);
  const sh2 = sheet(820, 1530, 440, 300, 8, 'attendance_OLD.xlsx', [2, 5], 9);
  enter(sh1, { x: -700, y: 260, rotation: -40, opacity: 0 }, { x: 0, y: 0, rotation: -9, opacity: 1, duration: 0.55, ease: 'expo.out' }, T.q1 - 0.05);
  enter(sh2, { x: 700, y: 300, rotation: 40, opacity: 0 }, { x: 0, y: 0, rotation: 8, opacity: 1, duration: 0.55, ease: 'expo.out' }, T.q1 + 0.03);

  // ---------------------------------------------------------- paperwork
  const papers = [
    { cx: 850, cy: 285, rot: 13, stamp: true },
    { cx: 185, cy: 1470, rot: -15 },
    { cx: 1085, cy: 1300, rot: 19 },
    { cx: 520, cy: 1720, rot: -4 },
  ];
  papers.forEach((p, i) => {
    const { inner } = item(chaos, 250, 330, p.cx, p.cy);
    let lines = '';
    for (let k = 0; k < 9; k++) lines += `<div style="height:9px;border-radius:5px;background:#CFC8BC;margin:0 0 15px;width:${[92, 80, 88, 60, 90, 75, 84, 50, 70][k]}%"></div>`;
    el('div', {
      cls: 'abs',
      css: 'inset:0;background:#F3EEE4;border-radius:10px;padding:38px 30px;box-shadow:0 26px 50px rgba(0,0,0,.5);',
      html: `<div style="height:16px;width:55%;border-radius:6px;background:#9D958A;margin-bottom:26px"></div>${lines}` +
        (p.stamp ? `<div style="position:absolute;right:18px;bottom:36px;transform:rotate(-14deg);border:5px solid ${C.red};color:${C.red};font:800 30px var(--f-display);padding:6px 14px;border-radius:10px;letter-spacing:.04em;opacity:.85">URGENT</div>` : ''),
    }, inner.firstChild);
    const d = i * 0.06;
    enter(inner, { y: -900, x: (i % 2 ? -1 : 1) * 160, rotation: p.rot + (i % 2 ? 70 : -70), opacity: 0 },
      { y: 0, x: 0, rotation: p.rot, opacity: 1, duration: 0.6, ease: 'back.out(1.1)' }, T.q2 - 0.08 + d);
  });

  // ---------------------------------------------------------- 10 different apps
  const apps = [
    ['message-circle', '#4E9A6B', 70, 470, '12'], ['mail', '#5572C8', 1010, 470, '99+'], ['calendar', '#B7614E', 40, 1290, ''],
    ['table-2', '#3E8C6A', 580, 1395, '3'], ['folder', '#C29A3C', 360, 1320, ''], ['phone', '#4A9C8C', 1000, 1720, '7'],
    ['cloud', '#5E86B8', 560, 170, ''], ['sticky-note', '#C7AE3E', 330, 120, '!'], ['bell', '#8663B8', 760, 1330, '24'],
    ['clipboard-list', '#7C7F88', 110, 1780, ''],
  ];
  apps.forEach(([name, color, cx, cy, badge], i) => {
    const { inner } = item(chaos, 132, 132, cx, cy);
    el('div', {
      cls: 'abs',
      css: `inset:0;border-radius:32px;background:${color};display:grid;place-items:center;box-shadow:0 18px 36px rgba(0,0,0,.45), inset 0 2px 0 rgba(255,255,255,.18);`,
      html: icon(name, 62, '#fff', 2) + (badge ? `<div style="position:absolute;right:-12px;top:-12px;min-width:46px;height:46px;padding:0 10px;border-radius:23px;background:${C.red};color:#fff;font:800 22px var(--f-ui);display:grid;place-items:center;border:4px solid ${C.ink}">${badge}</div>` : ''),
    }, inner.firstChild);
    const rot = (R() - 0.5) * 24;
    enter(inner, { scale: 0, rotation: rot - 60 }, { scale: 1, rotation: rot, duration: 0.5, ease: 'back.out(2.4)' }, T.q3 - 0.06 + i * 0.035);
  });

  // ---------------------------------------------------------- headline + stickers
  const l1 = textLine(front, 'Still running', { y: 600, size: 100 });
  const l2 = textLine(front, 'your school on…', { y: 718, size: 100 });
  const sz = fit(l2.node, 900, 100);
  l1.node.style.fontSize = `${sz}px`;
  items.push({ wrap: l1.box, cx: 540, cy: 600, w: 900, h: 120, text: true });
  items.push({ wrap: l2.box, cx: 540, cy: 718, w: 900, h: 120, text: true });
  // line 1 is on screen from the very first frame: push-in + tracking-in
  enter(l1.box, { scale: 1.12 }, { scale: 1, duration: 0.9, ease: 'expo.out' }, 0);
  enter(l1.node, { letterSpacing: '0.04em' }, { letterSpacing: '-0.035em', duration: 0.9, ease: 'expo.out' }, 0);
  riseIn(l2, 0.22, { stagger: 0.022, dur: 0.6 });

  const stickers = [
    { text: 'spreadsheets?', y: 895, rot: -4, x: 520, bg: '#fff' },
    { text: 'paperwork?', y: 1035, rot: 3.5, x: 585, bg: '#fff' },
    { text: '10 different apps?', y: 1175, rot: -2.5, x: 530, bg: '#fff' },
  ];
  stickers.forEach((st, i) => {
    const t0 = [T.q1, T.q2, T.q3][i];
    const wrap = el('div', { cls: 'abs', css: `left:${st.x}px;top:${st.y}px;` }, front);
    const box = el('div', {
      css: `transform:translate(-50%,-50%);display:inline-block;background:${st.bg};color:${C.ink};border-radius:26px;padding:20px 38px 24px;box-shadow:0 24px 50px rgba(0,0,0,.55);white-space:nowrap;`,
    }, wrap);
    const txt = el('div', { cls: 'display', text: st.text, css: 'font-size:70px;letter-spacing:-0.04em;' }, box);
    fit(txt, 820, 72);
    txt.innerHTML = txt.textContent.replace('?', `<span style="color:${C.orange}">?</span>`);
    items.push({ wrap, cx: st.x, cy: st.y, w: 700, h: 120, text: true });
    enter(wrap, { scale: 0.2, rotation: st.rot - 16, opacity: 0 }, { scale: 1, rotation: st.rot, opacity: 1, duration: 0.42, ease: 'back.out(2.2)' }, t0);
    shake(t0, 0.3, 7 + i * 3, 24);
    cue(t0, 'stab', { n: i });
  });
  cue(T.q1 - 0.06, 'swish', { pan: -0.4 });
  cue(T.q2 - 0.1, 'paper');
  cue(T.q3 - 0.06, 'pops', { n: 10, spacing: 0.035 });

  // ---------------------------------------------------------- implosion
  const cx = 540;
  const cy = 960;
  const tI = T.implode;
  items.forEach((it, i) => {
    const dx = cx - it.cx;
    const dy = cy - it.cy;
    const dist = Math.hypot(dx, dy);
    const lead = Math.min(0.12, dist / 9000);
    it.wrap.style.transformOrigin = '50% 50%';
    tl.to(it.wrap, {
      x: dx, y: dy, scale: 0, rotation: (i % 2 ? 1 : -1) * (120 + R() * 140),
      duration: 0.42 + lead, ease: 'power4.in',
    }, tI - lead + 0.02);
  });
  fast(tI, T.drop, 14);
  cue(tI - 0.05, 'suck', { dur: T.drop - tI + 0.05 });

  // seed square — exactly the centre square of the logo that follows
  const seed = el('div', { cls: 'abs', css: `left:${cx - 70}px;top:${cy - 70}px;width:140px;height:140px;border-radius:25px;background:${C.orange};box-shadow:0 0 80px rgba(254,77,30,.7);` }, front);
  enter(seed, { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.2, ease: 'back.out(3)' }, T.drop - 0.18);
}
