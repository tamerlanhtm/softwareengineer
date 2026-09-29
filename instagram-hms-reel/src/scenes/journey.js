// 8.45 – 19.1s  ONE PATIENT, ONE SYSTEM. A continuous camera travels through
// eight live product panels (book → check-in → treat → dental → diagnose →
// dispense → bill → grow), whip-panning between them, then pulls back to
// reveal the whole connected system.
import { h, svg, rng, onFrame, cue, impact, prog, lerp, clamp, noise1, ICONS, fitWidth } from '../lib/core.js';
import { L } from '../i18n.js';

const T = [9.0, 10.0, 11.0, 12.5, 14.0, 15.0, 16.0, 17.0];
const OVERVIEW = 18.0;
const GX = 1180, GY = 1160;
const C = [[0, 0], [GX, 0], [GX, GY], [0, GY], [0, 2 * GY], [GX, 2 * GY], [GX, 3 * GY], [0, 3 * GY]];
const FOCUS_Y = 990;

const STEPS = L.journey.steps;

const E = {
  expoOut: gsap.parseEase('expo.out'),
  expoInOut: gsap.parseEase('expo.inOut'),
  whip: gsap.parseEase('whip'),
  p4in: gsap.parseEase('power4.in'),
  p2in: gsap.parseEase('power2.in'),
  p2io: gsap.parseEase('power2.inOut'),
};

function rrPolygon(cx, cy, half, rad, rotDeg, seg = 6) {
  const r = Math.min(rad, half);
  const k = half - r;
  const corners = [[k, -k, -90], [k, k, 0], [-k, k, 90], [-k, -k, 180]];
  const th = (rotDeg * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
  const pts = [];
  for (const [ox, oy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = ((a0 + (90 * i) / seg) * Math.PI) / 180;
      const x = ox + r * Math.cos(a), y = oy + r * Math.sin(a);
      pts.push(`${(cx + x * c - y * s).toFixed(1)}px ${(cy + x * s + y * c).toFixed(1)}px`);
    }
  }
  return `polygon(${pts.join(',')})`;
}

// Classic ECG complex over one beat, u in [0,1).
function ecg(u) {
  const g = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s));
  return 0.12 * g(u, 0.16, 0.025) - 0.14 * g(u, 0.285, 0.008) + 1.0 * g(u, 0.31, 0.011) - 0.28 * g(u, 0.335, 0.01) + 0.22 * g(u, 0.55, 0.045);
}

export default function journey({ root, tl }) {
  const S = h('section.scene.dark#s-journey');
  root.append(S);
  tl.set(S, { visibility: 'visible' }, 8.44);
  tl.set(S, { visibility: 'hidden' }, 19.12);

  const bgDots = h('div.dots');
  const persp = h('div.abs', { style: { inset: '0', perspective: '2200px', perspectiveOrigin: `540px ${FOCUS_Y}px` } });
  const world = h('div#world');
  persp.append(world);
  S.append(bgDots, persp);

  /* ---------- connecting path ---------- */
  const pad = 800;
  const pathSvg = svg(`<svg class="path-svg" width="${GX + 2 * pad}" height="${3 * GY + 2 * pad}" viewBox="${-pad} ${-pad} ${GX + 2 * pad} ${3 * GY + 2 * pad}" style="left:${-pad}px;top:${-pad}px">
    <path class="p-glow" fill="none" stroke="rgba(254,77,30,0.22)" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="p-main" fill="none" stroke="#fe4d1e" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="p-pulse" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
  </svg>`);
  world.append(pathSvg);
  const d = `M ${C[0][0]} ${C[0][1] - 700} ` + C.map(([x, y]) => `L ${x} ${y}`).join(' ');
  const segLen = [700];
  for (let i = 1; i < C.length; i++) segLen.push(Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]));
  const cum = segLen.reduce((acc, v) => (acc.push((acc.at(-1) || 0) + v), acc), []);
  const total = cum.at(-1);
  const [pGlow, pMain, pPulse] = pathSvg.querySelectorAll('path');
  for (const p of [pGlow, pMain]) {
    p.setAttribute('d', d);
    p.style.strokeDasharray = `${total} ${total}`;
  }
  pPulse.setAttribute('d', d);
  pPulse.style.strokeDasharray = `260 ${total}`;

  // ports where the thread enters and leaves each card
  const ports = [];
  C.forEach(([x, y], i) => {
    const mk = (px, py) => {
      const p = h('div.abs', { style: { left: `${px - 15}px`, top: `${py - 15}px`, width: '30px', height: '30px', borderRadius: '9px', background: '#fe4d1e', boxShadow: '0 0 0 8px rgba(254,77,30,0.18)' } });
      world.append(p);
      ports.push(p);
    };
    if (i > 0) {
      const [ax, ay] = C[i - 1];
      if (ay === y) mk(x + (ax > x ? 440 : -440), y);
      else mk(x, y - 430);
    }
    if (i < C.length - 1) {
      const [bx, by] = C[i + 1];
      if (by === y) mk(x + (bx > x ? 440 : -440), y);
      else mk(x, y + 430);
    }
  });

  /* ---------- cards ---------- */
  const cards = [];
  const mkCard = (i, icon, title, meta) => {
    const [x, y] = C[i];
    const el = h('div.card', { style: { left: `${x}px`, top: `${y}px` } });
    const ttl = h('div.card-ttl', {}, title);
    const head = h('div.card-head', {},
      h('div.card-ico', { html: ICONS[icon] }),
      ttl,
      h('div.card-meta', {}, meta));
    const body = h('div.card-body');
    const sheen = h('div.sheen');
    el.append(head, body, sheen);
    world.append(el);
    fitWidth(ttl, 470);
    tl.fromTo(sheen, { x: 0 }, { x: 1500, duration: 0.8, ease: 'power2.inOut', immediateRender: false }, T[i] + 0.05);
    cards.push({ el, body });
    return body;
  };

  const K = L.cards;
  buildAppointments(mkCard(0, 'calendar', K.appt.title, K.appt.meta), tl);
  buildQueue(mkCard(1, 'queue', K.queue.title, K.queue.meta), tl);
  buildSoap(mkCard(2, 'notes', K.soap.title, K.soap.meta), tl);
  buildDental(mkCard(3, 'tooth', K.dental.title, K.dental.meta), tl);
  buildLab(mkCard(4, 'flask', K.lab.title, K.lab.meta), tl);
  buildPharmacy(mkCard(5, 'pill', K.rx.title, K.rx.meta), tl);
  buildBilling(mkCard(6, 'receipt', K.bill.title, K.bill.meta), tl);
  buildDashboard(mkCard(7, 'chart', K.dash.title, K.dash.meta), tl);

  /* ---------- camera ---------- */
  function camAt(t) {
    let x = C[0][0], y = C[0][1], z = 1, r = 0, rx = 0, oy = 0;
    if (t < T[0]) {
      const p = E.p2in(clamp((t - 8.45) / 0.55));
      z = lerp(0.62, 1.0, p);
      r = lerp(-14, 0, p);
    } else {
      z = 1 + 0.03 * prog(t, T[0], T[1] - 0.2);
    }
    for (let k = 1; k < T.length; k++) {
      const ts = T[k] - 0.22, te = T[k] + 0.2;
      if (t < ts) break;
      const p = clamp((t - ts) / (te - ts));
      const e = E.whip(p);
      const [ax, ay] = C[k - 1], [bx, by] = C[k];
      x = lerp(ax, bx, e);
      y = lerp(ay, by, e);
      const bump = Math.sin(Math.PI * p);
      const next = T[k + 1] ?? OVERVIEW;
      z = (1 - 0.2 * bump) * (1 + 0.03 * prog(t, te, next - 0.22));
      const dir = bx !== ax ? Math.sign(bx - ax) : Math.sign(by - ay);
      r = (bx !== ax ? 4 : -3) * dir * bump;
      rx = (by !== ay ? 9 : 0) * bump;
    }
    if (t >= OVERVIEW) {
      const p = E.expoInOut(clamp((t - OVERVIEW) / 0.7));
      const [ax, ay] = C[7];
      x = lerp(ax, GX / 2, p);
      y = lerp(ay, 1.5 * GY + 60, p);
      z = lerp(1.03, 0.31, p) * (1 + 0.04 * prog(t, OVERVIEW + 0.7, 19.1));
      r = lerp(0, -7, p) - 2 * prog(t, OVERVIEW + 0.7, 19.1);
      rx = lerp(0, 22, p);
      oy = lerp(0, 150, p);
    }
    return { x, y, z, r, rx, oy };
  }

  const packet = h('div.cursor-sq', { style: { left: `${540 - 36}px`, top: `${FOCUS_Y - 36}px`, zIndex: '4' } });
  S.append(packet);
  const scrimTop = h('div.abs', { style: { left: '0', right: '0', top: '0', height: '640px', background: 'linear-gradient(180deg, rgba(11,11,13,0.97) 0%, rgba(11,11,13,0.9) 62%, rgba(11,11,13,0) 100%)', zIndex: '5' } });
  const scrimBot = h('div.abs', { style: { left: '0', right: '0', bottom: '0', height: '520px', background: 'linear-gradient(0deg, rgba(11,11,13,0.96) 0%, rgba(11,11,13,0.6) 45%, rgba(11,11,13,0) 100%)', zIndex: '5' } });
  S.append(scrimTop, scrimBot);

  onFrame((t) => {
    if (t < 8.4 || t > 19.15) return;
    const c = camAt(t);
    world.style.transform = `translate(540px, ${FOCUS_Y + c.oy}px) rotateX(${c.rx.toFixed(3)}deg) rotate(${c.r.toFixed(3)}deg) scale(${c.z.toFixed(4)}) translate(${(-c.x).toFixed(2)}px, ${(-c.y).toFixed(2)}px)`;
    const tx = ((-c.x * 0.35 * c.z) % 54) - 54, ty = ((-c.y * 0.35 * c.z) % 54) - 54;
    bgDots.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;

    // thread drawn up to the camera position
    let drawn = 0;
    const along = (k, e) => cum[k - 1] + segLen[k] * e;
    drawn = cum[0];
    for (let k = 1; k < T.length; k++) {
      const ts = T[k] - 0.22, te = T[k] + 0.2;
      if (t < ts) break;
      drawn = along(k, E.whip(clamp((t - ts) / (te - ts))));
    }
    if (t < T[0]) drawn = cum[0] * E.expoOut(prog(t, 8.5, 9.2));
    for (const p of [pGlow, pMain]) p.style.strokeDashoffset = String(total - drawn);
    // light pulse racing along the thread in the overview
    const pp = prog(t, OVERVIEW + 0.25, OVERVIEW + 1.0, 'power2.inOut');
    pPulse.style.opacity = pp > 0 && pp < 1 ? '1' : '0';
    pPulse.style.strokeDashoffset = String(-pp * total);

    // the brand cursor rides each whip at the centre of the frame
    let pk = 0, spin = 0;
    for (let k = 1; k < T.length; k++) {
      const ts = T[k] - 0.26, te = T[k] + 0.26;
      if (t >= ts && t <= te) {
        const p = (t - ts) / (te - ts);
        pk = Math.sin(Math.PI * p);
        spin = p * 180 * (k % 2 ? 1 : -1);
      }
    }
    packet.style.opacity = pk > 0.02 ? '1' : '0';
    packet.style.transform = `scale(${(0.2 + pk * 1.1).toFixed(3)}) rotate(${spin.toFixed(1)}deg)`;

    // portal clip while we fly through the hollow square
    const hole = window.__portalHole ? window.__portalHole(t) : null;
    if (hole && t < 9.0) S.style.clipPath = rrPolygon(540, 960, hole.half, hole.radius, hole.rot);
    else S.style.clipPath = 'none';
  });

  for (let k = 1; k < T.length; k++) cue(T[k] - 0.2, 'whoosh', { dur: 0.45, dir: k % 2 });
  cue(OVERVIEW, 'whoosh_rev', { dur: 0.8 });
  cue(OVERVIEW + 0.3, 'shimmer', { dur: 0.8 });

  /* ---------- step labels (screen space) ---------- */
  const label = h('div.step-wrap', { style: { zIndex: '6' } });
  S.append(label);
  const numMask = h('div.mask', { style: { left: '0', top: '0', height: '40px', width: '400px' } });
  label.append(numMask);
  const noTexts = STEPS.map((_, i) => {
    const el = h('div.step-no', { style: { position: 'absolute' } }, i < 8 ? L.journey.stepLabel(i + 1) : L.journey.every);
    numMask.append(el);
    gsap.set(el, { yPercent: 110 });
    return el;
  });

  const starts = [...T, OVERVIEW];
  STEPS.forEach(([title, sub], i) => {
    const t0 = i === 0 ? 8.98 : starts[i] - 0.06;
    const t1 = starts[i + 1] !== undefined ? starts[i + 1] - 0.2 : null;
    const tm = h('div.mask', { style: { left: '-10px', top: '44px', right: '-100px', height: '140px' } });
    const te = h('div.step-title', { style: { top: '12px', left: '10px' } });
    tm.append(te);
    label.append(tm);
    const chars = [...title].map((ch) => {
      const s = h('span', { style: { display: 'inline-block' } }, ch === ' ' ? ' ' : ch);
      te.append(s);
      return s;
    });
    if (i === 8) te.style.color = 'var(--orange)';
    const fit = Math.min(1, 900 / te.scrollWidth);
    if (fit < 1) te.style.fontSize = `${Math.floor(112 * fit)}px`;
    gsap.set(chars, { y: 132, autoAlpha: 0 });
    tl.set(chars, { autoAlpha: 1 }, t0);
    tl.to(chars, { y: 0, duration: 0.55, ease: 'expo.out', stagger: 0.022 }, t0);
    const se = h('div.step-sub', {}, sub);
    label.append(se);
    gsap.set(se, { autoAlpha: 0 });
    tl.fromTo(se, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out', immediateRender: false }, t0 + 0.1);
    tl.fromTo(noTexts[i], { yPercent: 110 }, { yPercent: 0, duration: 0.45, ease: 'expo.out', immediateRender: false }, t0);
    if (t1 !== null) {
      tl.to(chars, { y: -132, duration: 0.2, ease: 'power3.in', stagger: 0.012 }, t1);
      tl.set(chars, { autoAlpha: 0 }, t1 + 0.4);
      tl.to(se, { autoAlpha: 0, y: -16, duration: 0.18, ease: 'power2.in' }, t1);
      tl.to(noTexts[i], { yPercent: -110, duration: 0.2, ease: 'power3.in' }, t1);
    } else {
      tl.to([...chars, se, noTexts[i]], { autoAlpha: 0, duration: 0.2 }, 18.9);
    }
  });
}

/* =====================================================================
   Card contents
   ===================================================================== */

function buildAppointments(body, tl) {
  const K = L.cards.appt;
  const colW = (788 - 96) / 3;
  const docs = K.docs.map(([name, ini], i) => [name, ini, ['#fe4d1e', '#4c8dff', '#2fd67f'][i]]);
  docs.forEach(([name, ini, col], c) => {
    body.append(h('div.cal-col-head', { style: { left: `${96 + c * colW + 6}px` } },
      h('div.avatar', { style: { background: col } }, ini), name));
  });
  ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'].forEach((tm, i) => {
    const y = 76 + i * 80;
    body.append(h('div.cal-line', { style: { top: `${y}px` } }));
    body.append(h('div.cal-time', { style: { top: `${y + 8}px` } }, tm));
  });
  // [column, first slot, end slot, colour] + name and visit type from the copy table
  const blocks = [
    [0, 0, 1, 'or'], [0, 2, 4, 'bl'], [0, 5, 6, 'gn'],
    [1, 1, 2, 'gn'], [1, 3, 5, 'or'], [1, 6, 7, 'bl'],
    [2, 0, 1, 'bl'], [2, 2, 3, 'or'], [2, 4, 6, 'gn'],
  ].map(([c, a, b, col], i) => [c, a, b, ...K.blocks[i], col]);
  const els = blocks.map(([c, a, b, name, type, col]) => {
    const el = h(`div.appt.${col}`, {
      style: { left: `${96 + c * colW + 6}px`, top: `${76 + a * 80 + 5}px`, width: `${colW - 12}px`, height: `${(b - a) * 80 - 10}px` },
    }, h('div.a-name', {}, name), h('div.a-type', {}, type));
    body.append(el);
    return el;
  });
  gsap.set(els, { autoAlpha: 0, scale: 0.7, transformOrigin: '50% 50%' });
  tl.to(els, { autoAlpha: 1, scale: 1, duration: 0.42, ease: 'back.out(1.8)', stagger: { each: 0.035, from: 'start' } }, 8.72);

  const nowLine = h('div.now-line', { style: { top: `${76 + 2.4 * 80}px` } });
  body.append(nowLine);
  gsap.set(nowLine, { scaleX: 0, transformOrigin: '0% 50%' });
  tl.to(nowLine, { scaleX: 1, duration: 0.6, ease: 'expo.out' }, 9.0);

  const slot = { left: `${96 + 2 * colW + 6}px`, top: `${76 + 6 * 80 + 5}px`, width: `${colW - 12}px`, height: '70px' };
  const ghost = h('div.appt.new', { style: slot }, h('div.a-name', { style: { color: 'var(--orange)' } }, K.newBooking));
  const booked = h('div.appt.or', { style: slot }, h('div.a-name', {}, K.booked[0]), h('div.a-type', {}, K.booked[1]));
  body.append(ghost, booked);
  gsap.set([ghost, booked], { autoAlpha: 0 });
  tl.fromTo(ghost, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.5)', immediateRender: false }, 9.3);
  tl.fromTo(booked, { autoAlpha: 0, scale: 1.15 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'expo.out', immediateRender: false }, 9.55);
  tl.set(ghost, { autoAlpha: 0 }, 9.6);
  cue(9.3, 'tick');
  cue(9.55, 'confirm');

  const toast = h('div.toast-mini', {}, h('div.check', { html: ICONS.check }), K.toast);
  body.append(toast);
  gsap.set(toast, { autoAlpha: 0, xPercent: -50 });
  tl.fromTo(toast, { autoAlpha: 0, y: 90 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'back.out(1.8)', immediateRender: false }, 9.62);
  cue(9.62, 'notify');
}

function buildQueue(body, tl) {
  const K = L.cards.queue;
  body.append(h('div.abs.mono', { style: { left: '0', top: '0', fontSize: '22px', letterSpacing: '0.25em', color: '#8b8b96', fontWeight: '700' } }, K.nowServing));
  const row = h('div.flap-row.abs', { style: { left: '0', top: '40px' } });
  body.append(row);
  const from = 'A-014', to = 'A-015';
  [...from].forEach((ch, i) => {
    const nc = to[i];
    const f = h('div.flap');
    const topStatic = h('div.half.top', {}, h('span', {}, nc));
    const botStatic = h('div.half.bot', {}, h('span', {}, ch));
    const topFlip = h('div.half.top', {}, h('span', {}, ch));
    const botFlip = h('div.half.bot', {}, h('span', {}, nc));
    f.append(topStatic, botStatic, topFlip, botFlip, h('div.seam'));
    row.append(f);
    if (i === 1) f.querySelectorAll('span').forEach((s) => (s.style.color = 'var(--orange)'));
    const t0 = 10.12 + i * 0.06;
    gsap.set(botFlip, { rotationX: 90 });
    tl.fromTo(topFlip, { rotationX: 0 }, { rotationX: -90, duration: 0.11, ease: 'power2.in', immediateRender: false }, t0);
    tl.fromTo(botFlip, { rotationX: 90 }, { rotationX: 0, duration: 0.2, ease: 'back.out(2.2)', immediateRender: false }, t0 + 0.11);
    cue(t0 + 0.11, 'flap', { n: i });
  });
  body.append(h('div.abs', { style: { left: '598px', top: '40px', width: '2px', height: '158px', background: 'rgba(255,255,255,0.12)' } }));
  body.append(h('div.abs', { style: { left: '632px', top: '46px', fontFamily: 'var(--mono)', fontSize: '20px', letterSpacing: '0.2em', color: '#8b8b96', fontWeight: '700' } }, K.room));
  body.append(h('div.abs', { style: { left: '628px', top: '80px', fontFamily: 'var(--display)', fontSize: '104px', fontWeight: '800', lineHeight: '1', color: 'var(--orange)' } }, '3'));
  body.append(h('div.abs', { style: { left: '0', top: '222px', fontSize: '27px', fontWeight: '600', color: '#a5a5b0' } }, K.line));

  const rows = K.rows.map(([tok, name, s1, s2]) => [tok, name, [s1, 'gr'], s2 ? [s2, 'ok'] : undefined]);
  rows.forEach(([tok, name, [s1, c1], after], i) => {
    const r = h('div.q-row', { style: { top: `${292 + i * 96}px` } },
      h('div.q-tok', {}, tok), h('div.q-name', {}, name));
    const p1 = h(`div.pill.${c1}`, {}, s1);
    r.append(p1);
    body.append(r);
    if (after) {
      const p2 = h(`div.pill.${after[1]}`, { style: { position: 'absolute', right: '22px' } }, after[0]);
      r.append(p2);
      gsap.set(p2, { autoAlpha: 0 });
      tl.to(p1, { autoAlpha: 0, scale: 0.8, duration: 0.12 }, 10.5);
      tl.fromTo(p2, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.4)', immediateRender: false }, 10.52);
      tl.fromTo(r, { backgroundColor: 'rgba(255,255,255,0.045)' }, { backgroundColor: 'rgba(47,214,127,0.10)', duration: 0.3, immediateRender: false }, 10.52);
      cue(10.52, 'confirm');
    }
  });
  const foot = h('div.abs', { style: { left: '0', top: '600px', fontSize: '26px', fontWeight: '600', color: '#8b8b96' } });
  const wait = h('span', { style: { color: '#fff', fontFamily: 'var(--mono)', fontWeight: '700' } }, '6');
  foot.append(`${K.waiting}  `, wait, `   ·   ${K.avg}  `, h('span', { style: { color: '#fff', fontFamily: 'var(--mono)', fontWeight: '700' } }, K.avgValue));
  body.append(foot);
  onFrame((t) => {
    if (t < 9 || t > 19.2) return;
    const v = t >= 10.3 ? '5' : '6';
    if (wait.textContent !== v) wait.textContent = v;
  });
}

function buildSoap(body, tl) {
  const K = L.cards.soap;
  const vit = K.vitals;
  const vEls = vit.map(([k, v, u], i) => {
    const el = h('div.vital.abs', { style: { left: `${i * 200.5}px`, top: '0', width: '186px' } },
      h('div.v-k', {}, k), h('div.v-v', {}, v, u ? h('small', {}, u) : null));
    body.append(el);
    return el;
  });
  gsap.set(vEls, { autoAlpha: 0, y: 24 });
  tl.to(vEls, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out', stagger: 0.05 }, 10.9);

  const W = 788, Hh = 120;
  const ecgSvg = svg(`<svg class="abs" style="left:0;top:116px;overflow:visible" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}">
    <rect x="0" y="0" width="${W}" height="${Hh}" rx="22" fill="rgba(255,255,255,0.035)"/>
    <path class="old" fill="none" stroke="rgba(254,77,30,0.45)" stroke-width="4" stroke-linejoin="round"/>
    <path class="new" fill="none" stroke="#fe4d1e" stroke-width="5" stroke-linejoin="round"/>
    <circle class="head" r="8" fill="#fff"/>
  </svg>`);
  body.append(ecgSvg);
  const pOld = ecgSvg.querySelector('.old'), pNew = ecgSvg.querySelector('.new'), headDot = ecgSvg.querySelector('.head');
  const speed = 330, period = 60 / 88;
  const yAt = (tau) => Hh * 0.62 - ecg(((tau / period) % 1 + 1) % 1) * 62;
  onFrame((t) => {
    if (t < 9 || t > 19.2) return;
    const sweep = W / speed;
    const s0 = Math.floor(t / sweep) * sweep;
    const head = (t - s0) * speed;
    let dn = '', dO = '';
    for (let x = 0; x <= W; x += 3) {
      if (x <= head) dn += `${dn ? 'L' : 'M'}${x} ${yAt(s0 + x / speed).toFixed(1)} `;
      else if (x > head + 36) dO += `${dO ? 'L' : 'M'}${x} ${yAt(s0 - sweep + x / speed).toFixed(1)} `;
    }
    pNew.setAttribute('d', dn || 'M0 0');
    pOld.setAttribute('d', dO || 'M0 0');
    headDot.setAttribute('cx', head.toFixed(1));
    headDot.setAttribute('cy', yAt(t).toFixed(1));
  });

  const rows = K.rows;
  rows.forEach(([k, v], i) => {
    const r = h('div.soap-row', { style: { top: `${262 + i * 74}px` } });
    const key = h('div.soap-k', {}, k);
    const val = h('div.soap-v', {}, v);
    const caret = h('div.abs', { style: { width: '4px', height: '36px', background: 'var(--orange)', top: '14px' } });
    const wrap = h('div', { style: { position: 'relative' } }, val, caret);
    r.append(key, wrap);
    body.append(r);
    const w = val.scrollWidth;
    const t0 = 11.12 + i * 0.2;
    gsap.set(key, { autoAlpha: 0, scale: 0.4 });
    tl.to(key, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2.5)' }, t0 - 0.04);
    gsap.set(val, { clipPath: 'inset(0 100% 0 0)' });
    tl.to(val, { clipPath: 'inset(0 0% 0 0)', duration: 0.26, ease: 'none' }, t0);
    gsap.set(caret, { autoAlpha: 0, x: 0 });
    tl.set(caret, { autoAlpha: 1 }, t0);
    tl.to(caret, { x: w, duration: 0.26, ease: 'none' }, t0);
    tl.set(caret, { autoAlpha: 0 }, t0 + 0.34);
    cue(t0, 'type', { dur: 0.26 });
    if (k === 'A') {
      const chip = h('div.pill.or', { style: { position: 'absolute', left: `${w + 20}px`, top: '10px', fontFamily: 'var(--mono)', fontWeight: '800' } }, K.icd);
      wrap.append(chip);
      gsap.set(chip, { autoAlpha: 0, scale: 0.5, transformOrigin: '0% 50%' });
      tl.to(chip, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.5)' }, 11.78);
      cue(11.78, 'pop', { n: 3 });
    }
  });

  const btn = h('div.btn', { style: { left: '0', top: '590px', background: '#fff', color: 'var(--text)' } }, K.sign);
  const done = h('div.btn', { style: { left: '0', top: '590px', background: 'rgba(47,214,127,0.16)', color: 'var(--ok)' } },
    h('span', { html: ICONS.lock.replace('stroke="#fff"', 'stroke="#2fd67f"'), style: { width: '32px', height: '32px', display: 'inline-block' } }), K.signed);
  body.append(btn, done);
  body.append(h('div.abs', { style: { right: '0', top: '612px', fontSize: '25px', fontWeight: '600', color: '#8b8b96' } }, K.doctor));
  gsap.set(done, { autoAlpha: 0 });
  tl.to(btn, { scale: 0.9, duration: 0.07, ease: 'power2.in' }, 12.02);
  tl.to(btn, { autoAlpha: 0, duration: 0.05 }, 12.09);
  tl.fromTo(done, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.5)', immediateRender: false }, 12.09);
  cue(12.05, 'lock');
}

function buildDental(body, tl) {
  const K = L.cards.dental;
  const upper = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lower = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
  const cond = { 16: 'caries', 24: 'caries', 45: 'caries', 26: 'filling', 12: 'filling', 47: 'filling', 36: 'crown', 21: 'crown', 46: 'missing', 38: 'missing', 18: 'missing' };
  const xAt = (i) => i * 48 + (i >= 8 ? 20 : 0);
  const midX = xAt(7) + 42 + 13;
  body.append(h('div.abs', { style: { left: `${midX - 1}px`, top: '22px', width: '2px', height: '150px', background: 'rgba(255,255,255,0.12)' } }));
  body.append(h('div.abs', { style: { left: '0', right: '0', top: '96px', height: '2px', background: 'rgba(255,255,255,0.08)' } }));
  const teeth = {};
  [[upper, 26, 0], [lower, 116, 174]].forEach(([arr, ty, ny]) => {
    arr.forEach((n, i) => {
      const x = xAt(i);
      const tooth = h('div.tooth', { style: { left: `${x}px`, top: `${ty}px` } });
      const num = h('div.t-num', { style: { left: `${x}px`, top: `${ny}px` } }, n);
      body.append(tooth, num);
      const d = Math.abs(i - 7.5);
      gsap.set([tooth, num], { autoAlpha: 0, scale: 0.2 });
      tl.to([tooth, num], { autoAlpha: 1, scale: 1, duration: 0.32, ease: 'back.out(2.6)' }, 12.52 + d * 0.02);
      teeth[n] = tooth;
    });
  });
  cue(12.52, 'ripple', { dur: 0.3 });
  const condTeeth = Object.keys(cond).map(Number).sort((a, b) => {
    const ia = upper.includes(a) ? upper.indexOf(a) : lower.indexOf(a);
    const ib = upper.includes(b) ? upper.indexOf(b) : lower.indexOf(b);
    return ia - ib;
  });
  condTeeth.forEach((n, j) => {
    const kind = cond[n];
    const tooth = teeth[n];
    const ov = h(`div.tooth.${kind}`, { style: { left: tooth.style.left, top: tooth.style.top } });
    body.append(ov);
    gsap.set(ov, { autoAlpha: 0, scale: 1.6 });
    const t0 = 12.9 + j * 0.035;
    tl.to(ov, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'expo.out' }, t0);
    if (kind === 'missing') tl.to(tooth, { autoAlpha: 0, duration: 0.15 }, t0);
  });
  cue(12.9, 'sparkle', { dur: 0.4 });

  // selection cursor on tooth 16
  const t16 = teeth[16];
  const sel = h('div.abs', { style: { left: `${parseFloat(t16.style.left) - 13}px`, top: `${parseFloat(t16.style.top) - 13}px`, width: '68px', height: '76px', border: '6px solid #fff', borderRadius: '18px' } });
  body.append(sel);
  gsap.set(sel, { autoAlpha: 0, scale: 2.2, rotation: 45 });
  tl.to(sel, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.4, ease: 'expo.out' }, 13.2);
  cue(13.2, 'select');

  // five-surface diagram of tooth 16 (M D B L O)
  const s = 220, c = 84, o = (s - c) / 2;
  const diag = svg(`<svg class="abs" style="left:0;top:236px" width="${s}" height="${s}" viewBox="-6 -6 ${s + 12} ${s + 12}">
    <g stroke="#0b0b0d" stroke-width="5" stroke-linejoin="round">
      <path class="sf B" d="M0 0 L${s} 0 L${o + c} ${o} L${o} ${o} Z" fill="#2a2a31"/>
      <path class="sf D" d="M${s} 0 L${s} ${s} L${o + c} ${o + c} L${o + c} ${o} Z" fill="#2a2a31"/>
      <path class="sf L" d="M${s} ${s} L0 ${s} L${o} ${o + c} L${o + c} ${o + c} Z" fill="#2a2a31"/>
      <path class="sf M" d="M0 ${s} L0 0 L${o} ${o} L${o} ${o + c} Z" fill="#2a2a31"/>
      <rect class="sf O" x="${o}" y="${o}" width="${c}" height="${c}" rx="10" fill="#2a2a31"/>
    </g>
    <rect x="0" y="0" width="${s}" height="${s}" rx="34" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="3" class="outline"/>
    <g font-family="JetBrains Mono Variable" font-weight="700" font-size="20" fill="rgba(255,255,255,0.75)" text-anchor="middle">
      <text x="${s / 2}" y="${o / 2 + 7}">B</text><text x="${s - o / 2}" y="${s / 2 + 7}">D</text>
      <text x="${s / 2}" y="${s - o / 2 + 7}">L</text><text x="${o / 2}" y="${s / 2 + 7}">M</text>
      <text x="${s / 2}" y="${s / 2 + 7}">O</text>
    </g>
  </svg>`);
  body.append(diag);
  gsap.set(diag, { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' });
  tl.to(diag, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'expo.out' }, 13.26);
  const surfM = diag.querySelector('.M'), surfO = diag.querySelector('.O');
  tl.to(surfM, { fill: '#fe4d1e', duration: 0.12 }, 13.46);
  tl.to(surfO, { fill: '#fe4d1e', duration: 0.12 }, 13.54);
  cue(13.46, 'pop', { n: 1 });
  cue(13.54, 'pop', { n: 4 });

  const info = h('div.abs', { style: { left: '262px', top: '248px' } },
    h('div', { style: { fontFamily: 'var(--display)', fontWeight: '800', fontSize: '46px', letterSpacing: '-0.03em' } }, K.tooth),
    h('div', { style: { fontSize: '27px', fontWeight: '550', color: '#a9a9b4', marginTop: '10px' } }, K.finding),
    h('div', { style: { display: 'flex', gap: '12px', marginTop: '22px' } },
      h('div.pill.or', {}, K.plan), h('div.pill.gr', {}, K.perio)));
  body.append(info);
  gsap.set(info, { autoAlpha: 0, x: 30 });
  tl.to(info, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'expo.out' }, 13.34);

  const legend = h('div.legend.abs', { style: { left: '0', top: '500px' } },
    ...K.legend.map((n, i) => [n, ['var(--orange)', 'var(--blue)', 'var(--gold)', 'transparent'][i]]).map(([n, col]) =>
      h('div.lg', {}, h('div.sw', { style: { background: col, border: col === 'transparent' ? '3px dashed #5d5d68' : 'none' } }), n)));
  body.append(legend);
  const plan = h('div.stmt', { style: { top: '572px' } },
    h('div', { style: { fontFamily: 'var(--mono)', fontWeight: '800', color: 'var(--orange)' } }, '3'),
    K.planned,
    h('div.pill.ok', { style: { marginLeft: 'auto' } }, K.accepted));
  body.append(plan);
  gsap.set([legend, plan], { autoAlpha: 0, y: 20 });
  tl.to([legend, plan], { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out', stagger: 0.08 }, 13.5);
}

function buildLab(body, tl) {
  const K = L.cards.lab;
  const chips = h('div.abs', { style: { left: '0', top: '0', display: 'flex', gap: '12px' } },
    h('div.pill.or', {}, K.chips[0]), h('div.pill.ok', {}, K.chips[1]), h('div.pill.gr', {}, K.chips[2]));
  body.append(chips);
  const hdr = h('div.abs.mono', { style: { left: '0', right: '0', top: '70px', fontSize: '18px', letterSpacing: '0.2em', color: '#6d6d79', fontWeight: '700', display: 'flex' } },
    h('div', { style: { width: '230px' } }, K.head[0]), h('div', { style: { width: '190px' } }, K.head[1]), h('div', {}, K.head[2]), h('div', { style: { marginLeft: 'auto' } }, K.head[3]));
  body.append(hdr);
  // [reference zone, value position, flag] + name, value and unit from the copy table
  const rows = [
    [[0.33, 0.67], 0.48, 'n'], [[0.25, 0.62], 0.8, 'h'], [[0.0, 0.17], 0.62, 'h'], [[0.27, 0.54], 0.44, 'n'],
  ].map((r, i) => [...K.rows[i], ...r]);
  rows.forEach(([name, val, unit, [z0, z1], v, flag], i) => {
    const dot = h('div.dot');
    const range = h('div.range', {}, h('div.ok-zone', { style: { left: `${z0 * 100}%`, width: `${(z1 - z0) * 100}%` } }), dot);
    const fl = h(`div.flag.${flag}`, {}, flag === 'h' ? K.high : '—');
    const r = h('div.lab-row', { style: { top: `${104 + i * 76}px` } },
      h('div.lab-name', {}, name), h('div.lab-val', {}, val, h('small', {}, unit)), range, fl);
    body.append(r);
    const t0 = 13.98 + i * 0.05;
    gsap.set(r, { autoAlpha: 0, x: -30 });
    tl.to(r, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'expo.out' }, t0);
    gsap.set(dot, { left: '0%' });
    tl.to(dot, { left: `${v * 100}%`, duration: 0.6, ease: 'expo.out' }, t0 + 0.08);
    if (flag === 'h') {
      tl.to(dot, { backgroundColor: '#fe4d1e', boxShadow: '0 0 0 6px rgba(254,77,30,0.3)', duration: 0.15 }, t0 + 0.4);
      gsap.set(fl, { scale: 0.3, autoAlpha: 0 });
      tl.to(fl, { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'back.out(3)' }, t0 + 0.42);
      cue(t0 + 0.42, 'alert', { n: i });
    }
  });

  // stylised panoramic X-ray (OPG) with a scanning line
  const xr = h('div.xray', { style: { left: '0', top: '430px', width: '400px', height: '236px' } });
  const r = rng(5);
  let teethSvg = '';
  for (let i = 0; i < 14; i++) {
    const u = (i - 6.5) / 6.5;
    const x = 34 + i * 24.5;
    const yU = 64 + 26 * u * u, yL = 128 - 14 * u * u;
    const w = 18 + (Math.abs(u) > 0.55 ? 5 : 0);
    teethSvg += `<rect x="${x}" y="${yU}" width="${w}" height="${50 - 6 * Math.abs(u)}" rx="7" fill="url(#tg)" opacity="${0.75 + r() * 0.2}"/>`;
    teethSvg += `<rect x="${x + 4}" y="${yU - 34}" width="${w - 8}" height="40" rx="5" fill="#c9d2dc" opacity="0.18"/>`;
    teethSvg += `<rect x="${x}" y="${yL}" width="${w}" height="${46 - 5 * Math.abs(u)}" rx="7" fill="url(#tg)" opacity="${0.72 + r() * 0.2}"/>`;
    teethSvg += `<rect x="${x + 4}" y="${yL + 40}" width="${w - 8}" height="42" rx="5" fill="#c9d2dc" opacity="0.16"/>`;
  }
  const opg = svg(`<svg class="abs" style="left:0;top:0" width="400" height="236" viewBox="0 0 400 236">
    <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef3f8"/><stop offset="1" stop-color="#9fb0c2"/></linearGradient>
    <filter id="xb"><feGaussianBlur stdDeviation="1.4"/></filter></defs>
    <path d="M20 40 Q200 -10 380 40 L380 200 Q200 250 20 200 Z" fill="rgba(160,180,200,0.10)"/>
    <g filter="url(#xb)">${teethSvg}</g>
    <circle cx="${34 + 10 * 24.5 + 10}" cy="${128 - 14 * 0.29 + 18}" r="22" fill="none" stroke="#fe4d1e" stroke-width="4" class="ring16" opacity="0"/>
  </svg>`);
  const scan = h('div.scanline');
  xr.append(opg, scan);
  body.append(xr);
  gsap.set(scan, { left: -10 });
  tl.fromTo(scan, { left: -10 }, { left: 405, duration: 0.7, ease: 'power1.inOut', immediateRender: false }, 14.12);
  tl.to(opg.querySelector('.ring16'), { opacity: 1, duration: 0.15 }, 14.55);
  cue(14.12, 'scan', { dur: 0.7 });

  const side = h('div.abs', { style: { left: '430px', top: '440px' } },
    h('div', { style: { fontSize: '30px', fontWeight: '700' } }, K.imaging),
    h('div', { style: { fontSize: '24px', fontWeight: '500', color: '#9a9aa6', marginTop: '10px' } }, K.modalities),
    h('div', { style: { fontSize: '24px', fontWeight: '500', color: '#9a9aa6', marginTop: '6px' } }, K.report));
  body.append(side);
  const ver = h('div.pill.ok', { style: { position: 'absolute', left: '430px', top: '604px' } }, K.verified);
  body.append(ver);
  gsap.set(side, { autoAlpha: 0, x: 24 });
  tl.to(side, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'expo.out' }, 14.2);
  gsap.set(ver, { autoAlpha: 0, scale: 0.5, transformOrigin: '0% 50%' });
  tl.to(ver, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2.5)' }, 14.72);
  cue(14.72, 'confirm');
}

function buildPharmacy(body, tl) {
  const K = L.cards.rx;
  const rx = h('div.rx');
  const name = h('div.rx-name', {},
    h('div', { style: { width: '58px', height: '58px', borderRadius: '16px', background: 'var(--orange)', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: '800', fontSize: '24px' } }, 'Rx'),
    K.drug);
  const chipEls = K.chips.map((c) => h('div.chip', {}, c));
  rx.append(name, h('div.chips', {}, ...chipEls));
  body.append(rx);
  gsap.set(chipEls, { autoAlpha: 0, y: 14 });
  tl.to(chipEls, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'back.out(2)', stagger: 0.04 }, 14.96);

  const allergy = h('div.pill.ok', { style: { position: 'absolute', left: '0', top: '218px', height: '54px', fontSize: '24px' } }, K.allergy);
  const hand = h('div.pill.solid', { style: { position: 'absolute', right: '0', top: '218px', height: '54px', fontSize: '24px' } }, K.sent);
  body.append(allergy, hand);
  gsap.set(allergy, { autoAlpha: 0, scale: 0.6, transformOrigin: '0% 50%' });
  tl.to(allergy, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.5)' }, 15.18);
  gsap.set(hand, { autoAlpha: 0, x: -40 });
  tl.to(hand, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'expo.out' }, 15.26);
  cue(15.18, 'confirm');

  body.append(h('div.abs.mono', { style: { left: '0', top: '300px', fontSize: '19px', letterSpacing: '0.2em', color: '#6d6d79', fontWeight: '700' } }, K.stock));
  const batches = [['B-2291', `${K.exp} 11/2026`, 120, 0.4], ['B-2310', `${K.exp} 03/2027`, 300, 1.0], ['B-2355', `${K.exp} 08/2027`, 240, 0.8]];
  let qtyEl, pickRow;
  batches.forEach(([id, exp, q, lvl], i) => {
    const bar = h('div', { style: { flex: '1', height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' } },
      h('div', { style: { position: 'absolute', left: '0', top: '0', bottom: '0', width: `${lvl * 100}%`, background: i === 0 ? 'var(--orange)' : '#4a4a55', borderRadius: '5px' } }));
    const qty = h('div.b-qty', {}, String(q));
    const row = h('div.batch', { style: { top: `${340 + i * 98}px` } }, h('div.b-id', {}, id), h('div.b-exp', {}, exp), bar, qty);
    body.append(row);
    gsap.set(row, { autoAlpha: 0, y: 30 });
    tl.to(row, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' }, 15.3 + i * 0.05);
    if (i === 0) { qtyEl = qty; pickRow = row; }
  });
  const fefo = h('div.pill.solid', { style: { position: 'absolute', right: '150px', top: `${340 + 20}px`, height: '46px', fontSize: '21px', fontFamily: 'var(--mono)', fontWeight: '800' } }, 'FEFO ✓');
  body.append(fefo);
  tl.to(pickRow, { borderColor: '#fe4d1e', backgroundColor: 'rgba(254,77,30,0.12)', duration: 0.2 }, 15.52);
  gsap.set(fefo, { autoAlpha: 0, scale: 0.4 });
  tl.to(fefo, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, 15.54);
  cue(15.52, 'select');
  onFrame((t) => {
    if (t < 14.5 || t > 19.2) return;
    const v = Math.round(lerp(120, 99, prog(t, 15.58, 15.88, 'power2.out')));
    if (qtyEl.textContent !== String(v)) qtyEl.textContent = String(v);
  });
  const toast = h('div.toast-mini', {}, h('div.check', { html: ICONS.check }), K.toast);
  body.append(toast);
  gsap.set(toast, { autoAlpha: 0, xPercent: -50 });
  tl.fromTo(toast, { autoAlpha: 0, y: 90 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'back.out(1.8)', immediateRender: false }, 15.8);
  cue(15.8, 'notify');
}

function buildBilling(body, tl) {
  const K = L.cards.bill;
  body.append(h('div.abs', { style: { left: '0', top: '0', display: 'flex', alignItems: 'center', gap: '18px', right: '0' } },
    h('div', { style: { fontFamily: 'var(--mono)', fontWeight: '800', fontSize: '27px', color: 'var(--orange-hi)' } }, 'INV-1043'),
    h('div', { style: { fontSize: '28px', fontWeight: '650' } }, K.patient),
    h('div.pill.gr', { style: { marginLeft: 'auto' } }, K.due)));
  const lines = K.lines.map((n, i) => [n, L.amount([60, 45, 12.6][i])]);
  lines.forEach(([n, a], i) => {
    const el = h('div.inv-line', { style: { top: `${68 + i * 58}px` } }, n, h('div.amt', {}, a));
    body.append(el);
    gsap.set(el, { autoAlpha: 0, x: -24 });
    tl.to(el, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'expo.out' }, 15.98 + i * 0.05);
    cue(15.98 + i * 0.05, 'tick', { gain: 0.4 });
  });
  body.append(h('div.abs', { style: { left: '0', right: '0', top: '252px', height: '2px', background: 'rgba(255,255,255,0.1)' } }));
  const amt = h('div.amt', {}, L.money(0));
  body.append(h('div.inv-total', { style: { top: '262px' } }, h('div.lbl', {}, K.total), amt));
  onFrame((t) => {
    if (t < 15 || t > 19.2) return;
    const v = lerp(0, 117.6, prog(t, 16.08, 16.45, 'expo.out'));
    const s = L.money(v);
    if (amt.textContent !== s) amt.textContent = s;
  });

  const ins = h('div', { style: { width: '80%', height: '100%', background: 'var(--orange)' } });
  const pat = h('div', { style: { width: '20%', height: '100%', background: 'rgba(255,255,255,0.75)' } });
  const split = h('div.split', { style: { top: '368px' } }, ins, pat);
  body.append(split);
  gsap.set([ins, pat], { scaleX: 0, transformOrigin: '0% 50%' });
  tl.to(ins, { scaleX: 1, duration: 0.4, ease: 'expo.out' }, 16.22);
  tl.to(pat, { scaleX: 1, duration: 0.3, ease: 'expo.out' }, 16.34);
  body.append(h('div.abs', { style: { left: '0', top: '398px', fontSize: '22px', fontWeight: '600', color: '#a3a3ae' } }, `${K.insurer} 80% · ${L.money(94.08)}`));
  body.append(h('div.abs', { style: { right: '0', top: '398px', fontSize: '22px', fontWeight: '600', color: '#a3a3ae' } }, `${K.patientShare} 20% · ${L.money(23.52)}`));

  const xs = [40, 276, 512, 748];
  const track = h('div.abs', { style: { left: '40px', width: '708px', top: '492px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' } });
  const fill = h('div.abs', { style: { left: '40px', width: '708px', top: '492px', height: '6px', borderRadius: '3px', background: 'var(--orange)' } });
  body.append(track, fill);
  gsap.set(fill, { scaleX: 0, transformOrigin: '0% 50%' });
  tl.to(fill, { scaleX: 1, duration: 0.42, ease: 'none' }, 16.3);
  K.claim.forEach((lbl, i) => {
    const node = h('div.claim-node', { style: { left: `${xs[i]}px`, top: '478px' } });
    body.append(node, h('div.claim-lbl', { style: { left: `${xs[i]}px`, top: '528px' } }, lbl));
    tl.to(node, { backgroundColor: '#fe4d1e', borderColor: '#fe4d1e', scale: 1.25, duration: 0.1 }, 16.3 + i * 0.14);
    tl.to(node, { scale: 1, duration: 0.2, ease: 'back.out(3)' }, 16.4 + i * 0.14);
    cue(16.3 + i * 0.14, 'blip', { n: 2 + i, gain: 0.45 });
  });

  const stamp = h('div.stamp', { style: { left: '410px', top: '446px' } }, K.stamp);
  body.append(stamp);
  // longer words get a smaller stamp that still sits inside the card
  const fs0 = parseFloat(getComputedStyle(stamp).fontSize);
  fitWidth(stamp, 360);
  const k = parseFloat(stamp.style.fontSize || fs0) / fs0;
  if (k < 1) {
    stamp.style.borderWidth = `${Math.max(7, 11 * k).toFixed(1)}px`;
    stamp.style.left = `${Math.min(410, 770 - stamp.offsetWidth)}px`;
  }
  gsap.set(stamp, { autoAlpha: 0, rotation: -14, scale: 2.6, transformOrigin: '50% 50%' });
  tl.to(stamp, { autoAlpha: 1, scale: 1, duration: 0.13, ease: 'power4.in' }, 16.62);
  tl.to(stamp, { scale: 1.06, duration: 0.06, yoyo: true, repeat: 1, ease: 'power1.out' }, 16.75);
  impact(16.75, 12, 10, 16);
  cue(16.75, 'stamp');
  const pr = rng(33);
  for (let i = 0; i < 10; i++) {
    const p = h('div.particle');
    body.append(p);
    const a = pr.range(0, Math.PI * 2), dist = pr.range(120, 260), sz = pr.range(8, 20);
    gsap.set(p, { left: 580, top: 510, width: sz, height: sz, autoAlpha: 0 });
    tl.fromTo(p, { x: 0, y: 0, autoAlpha: 1, rotation: 0 }, { x: Math.cos(a) * dist, y: Math.sin(a) * dist, autoAlpha: 0, rotation: pr.range(-200, 200), duration: 0.7, ease: 'expo.out', immediateRender: false }, 16.75);
  }
}

function buildDashboard(body, tl) {
  const K = L.cards.dash;
  const kpis = [
    [K.kpis[0], 48.2, L.kilo, K.deltas[0]],
    [K.kpis[1], 64, (v) => `${Math.round(v)}`, K.deltas[1]],
    [K.kpis[2], 96, (v) => `${Math.round(v)}%`, K.deltas[2]],
  ];
  kpis.forEach(([k, target, fmt, delta], i) => {
    const val = h('div.k-v', {}, fmt(0));
    const el = h('div.kpi', { style: { left: `${i * 268}px`, width: '252px' } }, h('div.k-k', {}, k), val, h('div.k-d', {}, delta));
    body.append(el);
    // size the counter for its final value so it never outgrows the tile
    val.textContent = fmt(target);
    el.querySelectorAll('.k-k, .k-v, .k-d').forEach((n) => fitWidth(n, 204));
    val.textContent = fmt(0);
    gsap.set(el, { autoAlpha: 0, y: 30 });
    tl.to(el, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' }, 16.98 + i * 0.05);
    onFrame((t) => {
      if (t < 16 || t > 19.2) return;
      const s = fmt(target * prog(t, 17.02 + i * 0.05, 17.55 + i * 0.05, 'expo.out'));
      if (val.textContent !== s) val.textContent = s;
    });
  });
  const chart = h('div.abs', { style: { left: '0', right: '0', top: '206px', height: '262px' } });
  body.append(chart);
  [0, 0.5, 1].forEach((g) => chart.append(h('div.abs', { style: { left: '0', right: '0', top: `${g * 230 + 10}px`, height: '1px', background: 'rgba(255,255,255,0.07)' } })));
  const hs = [0.5, 0.6, 0.56, 0.7, 0.78, 0.94];
  const months = K.months;
  const gap = (788 - 6 * 70) / 5;
  hs.forEach((v, i) => {
    const bar = h(`div.bar${i < 5 ? '.dim' : ''}`, { style: { left: `${i * (70 + gap)}px`, height: `${v * 230}px`, bottom: '22px' } });
    chart.append(bar, h('div.bar-lbl', { style: { left: `${i * (70 + gap)}px`, bottom: '-8px' } }, months[i]));
    gsap.set(bar, { scaleY: 0 });
    tl.to(bar, { scaleY: 1, duration: 0.55, ease: 'expo.out' }, 17.08 + i * 0.045);
  });
  const pts = [0.3, 0.36, 0.33, 0.45, 0.5, 0.64].map((v, i) => [i * (70 + gap) + 35, 240 - v * 230]);
  const line = svg(`<svg class="abs" style="left:0;top:0;overflow:visible" width="788" height="262"><path d="M ${pts.map((p) => p.join(' ')).join(' L ')}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#0b0b0d" stroke="#fff" stroke-width="4"/>`).join('')}</svg>`);
  chart.append(line);
  const lp = line.querySelector('path');
  const len = Math.ceil(lp.getTotalLength()) + 2;
  lp.style.strokeDasharray = `${len} ${len}`;
  gsap.set(lp, { strokeDashoffset: len });
  tl.to(lp, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.inOut' }, 17.3);
  gsap.set(line.querySelectorAll('circle'), { autoAlpha: 0 });
  tl.to(line.querySelectorAll('circle'), { autoAlpha: 1, duration: 0.1, stagger: 0.06 }, 17.32);
  const tag = h('div.pill.solid', { style: { position: 'absolute', left: `${5 * (70 + gap) - 60}px`, top: '-12px', fontFamily: /₼/.test(L.kilo(48.2)) ? 'var(--ui)' : 'var(--mono)', fontWeight: '800' } }, L.kilo(48.2));
  chart.append(tag);
  gsap.set(tag, { autoAlpha: 0, scale: 0.4, y: 20 });
  tl.to(tag, { autoAlpha: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(2.5)' }, 17.52);
  cue(17.08, 'rise', { dur: 0.4 });

  const rows = [
    [ICONS.check, ...K.rows[0]],
    [ICONS.lock, ...K.rows[1]],
  ];
  rows.forEach(([icon, a, b], i) => {
    const el = h('div.stmt', { style: { top: `${512 + i * 80}px` } },
      h('div.check', { html: icon, style: { background: i ? 'var(--orange)' : 'var(--ok)' } }), a,
      h('div', { style: { marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '20px', color: '#a0a0ab', fontWeight: '600' } }, b));
    body.append(el);
    gsap.set(el, { autoAlpha: 0, x: -24 });
    tl.to(el, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'expo.out' }, 17.5 + i * 0.1);
    cue(17.5 + i * 0.1, 'confirm', { gain: 0.5 });
  });
}
