// 18.8 – 23.05s  SECURITY. The brand square floods the frame orange, becomes a
// padlock, then: forced 2FA → chart access log → role-based access.
import { h, svg, rng, onFrame, cue, impact, prog, lerp, clamp, fitWidth } from '../lib/core.js';
import { L } from '../i18n.js';

const DEPTS = L.security.depts;

export default function security({ root, tl }) {
  const S = h('section.scene#s-security', { style: { color: '#fff' } });
  root.append(S);
  tl.set(S, { visibility: 'visible' }, 18.76);
  tl.set(S, { visibility: 'hidden' }, 23.1);
  tl.set(S, { backgroundColor: 'rgba(254,77,30,0)' }, 18.76);
  tl.set(S, { backgroundColor: '#fe4d1e' }, 19.12);

  /* ---------- flood: hollow square → filled → full frame ---------- */
  const flood = h('div.abs', { style: { borderStyle: 'solid', borderColor: 'var(--orange)' } });
  S.append(flood);
  const ein = gsap.parseEase('expo.in'), eout = gsap.parseEase('back.out(2)');
  onFrame((t) => {
    if (t < 18.7 || t > 19.2) { flood.style.visibility = 'hidden'; return; }
    flood.style.visibility = t >= 18.76 && t < 19.13 ? 'visible' : 'hidden';
    const appear = eout(clamp((t - 18.76) / 0.2));
    const grow = ein(clamp((t - 18.92) / 0.2));
    const size = lerp(0, 190, appear) + grow * 2600;
    const fill = clamp((t - 18.88) / 0.1);
    const bw = lerp(size * 0.243, size / 2, fill);
    const rad = size * lerp(0.314, 0.12, grow);
    Object.assign(flood.style, {
      width: `${size}px`, height: `${size}px`, left: `${540 - size / 2}px`, top: `${990 - size / 2}px`,
      borderWidth: `${bw.toFixed(2)}px`, borderRadius: `${rad.toFixed(2)}px`,
      transform: `rotate(${lerp(-90, 0, appear).toFixed(2)}deg)`,
    });
  });
  cue(18.78, 'pop', { n: 5 });
  cue(18.92, 'whoosh', { dur: 0.3, gain: 0.8 });

  /* ---------- outlined marquee of departments ---------- */
  const mq = h('div.abs', { style: { inset: '-400px', transform: 'rotate(-9deg)' } });
  S.append(mq);
  const rows = [];
  // Only ~36 characters per row: enough to cover the frame for the whole scroll,
  // and cheap to rasterise (stroked text is expensive in software rendering).
  for (let i = 0; i < 6; i++) {
    const text = (DEPTS + DEPTS).slice(i * 23, i * 23 + 56);
    const el = h('div.marquee', { style: { top: `${220 + i * 430}px`, left: '0' } }, text);
    mq.append(el);
    rows.push({ el, dir: i % 2 ? 1 : -1 });
  }
  gsap.set(mq, { autoAlpha: 0 });
  tl.to(mq, { autoAlpha: 1, duration: 0.4 }, 19.1);
  onFrame((t) => {
    if (t < 19 || t > 23.1) return;
    for (const r of rows) {
      const x = (r.dir > 0 ? -900 : -200) + r.dir * ((t - 19) * 150);
      r.el.style.transform = `translateX(${x.toFixed(1)}px)`;
    }
  });

  /* ---------- padlock (the hollow brand square is the lock body) ---------- */
  const lockWrap = h('div.abs', { style: { left: `${540 - 130}px`, top: '300px', width: '260px', height: '330px' } });
  const lock = svg(`<svg width="260" height="330" viewBox="0 0 260 330" style="overflow:visible">
    <path class="shackle" d="M72 176 V118 A58 58 0 0 1 188 118 V176" fill="none" stroke="#fff" stroke-width="30" stroke-linecap="round"/>
    <rect x="54" y="150" width="152" height="152" rx="22" fill="none" stroke="#fff" stroke-width="37"/>
    <rect class="keyhole" x="120" y="206" width="20" height="40" rx="10" fill="#fff"/>
  </svg>`);
  lockWrap.append(lock);
  S.append(lockWrap);
  const shackle = lock.querySelector('.shackle');
  const sl = 300;
  shackle.style.strokeDasharray = `${sl} ${sl}`;
  gsap.set(lockWrap, { autoAlpha: 0, scale: 0.2, transformOrigin: '50% 70%' });
  gsap.set(shackle, { strokeDashoffset: sl, y: -26 });
  tl.to(lockWrap, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(2)' }, 19.1);
  tl.to(shackle, { strokeDashoffset: 0, duration: 0.25, ease: 'power2.out' }, 19.22);
  tl.to(shackle, { y: 0, duration: 0.14, ease: 'power4.in' }, 19.44);
  tl.to(lockWrap, { scaleY: 0.92, scaleX: 1.05, duration: 0.06, yoyo: true, repeat: 1 }, 19.58);
  impact(19.58, 9, 11, 18);
  cue(19.58, 'lock');
  tl.to(lockWrap, { y: -40, scale: 0.8, duration: 0.5, ease: 'expo.inOut' }, 20.8);

  /* ---------- titles ---------- */
  const titles = [[19.32, 20.82], [20.94, 21.86], [21.98, 22.78]].map((times, i) => [...L.security.titles[i], ...times]);
  titles.forEach(([tt, sub, t0, t1]) => {
    const m = h('div.mask', { style: { left: '0', right: '0', top: '690px', height: '124px' } });
    const el = h('div.sec-title', { style: { top: '6px' } });
    m.append(el);
    const chars = [...tt].map((c) => {
      const s = h('span', { style: { display: 'inline-block' } }, c === ' ' ? ' ' : c);
      el.append(s);
      return s;
    });
    const se = h('div.sec-sub', {}, sub);
    S.append(m, se);
    fitWidth(el, 980);
    fitWidth(se, 960);
    gsap.set(chars, { y: 125, autoAlpha: 0 });
    tl.set(chars, { autoAlpha: 1 }, t0);
    gsap.set(se, { autoAlpha: 0 });
    tl.to(chars, { y: 0, duration: 0.5, ease: 'expo.out', stagger: 0.022 }, t0);
    tl.fromTo(se, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'expo.out', immediateRender: false }, t0 + 0.12);
    tl.to(chars, { y: -125, duration: 0.2, ease: 'power3.in', stagger: 0.01 }, t1);
    tl.set(chars, { autoAlpha: 0 }, t1 + 0.35);
    tl.to(se, { autoAlpha: 0, y: -16, duration: 0.18, ease: 'power2.in' }, t1);
    cue(t0, 'swish', { gain: 0.6 });
  });

  /* ---------- 2FA code ---------- */
  const code = '482917';
  const r = rng(9);
  const boxes = [...code].map((dgt, i) => {
    const box = h('div.code-box', { style: { left: `${123 + i * 142}px`, top: '936px' } });
    const col = h('div.abs', { style: { left: '0', right: '0', top: '0', textAlign: 'center' } });
    const seq = Array.from({ length: 9 }, () => Math.floor(r() * 10)).concat([+dgt]);
    seq.forEach((n) => col.append(h('div', { style: { height: '150px', lineHeight: '150px' } }, String(n))));
    box.append(col);
    S.append(box);
    const t0 = 19.66 + i * 0.09;
    gsap.set(box, { autoAlpha: 0, y: 60, scale: 0.8 });
    tl.to(box, { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(2)' }, 19.5 + i * 0.03);
    gsap.set(col, { y: 0 });
    tl.to(col, { y: -(seq.length - 1) * 150, duration: 0.42, ease: 'expo.out' }, t0);
    cue(t0 + 0.12, 'beep', { n: i });
    tl.to(box, { backgroundColor: '#0b0b0d', color: '#fff', duration: 0.12 }, 20.28 + i * 0.03);
    tl.to(box, { y: 70, autoAlpha: 0, duration: 0.22, ease: 'power3.in' }, 20.8 + i * 0.015);
    return box;
  });
  const verified = h('div.abs', { style: { left: '0', right: '0', top: '1130px', display: 'flex', justifyContent: 'center' } },
    h('div.pill', { style: { background: '#0b0b0d', color: '#fff', height: '76px', padding: '0 34px', borderRadius: '38px', fontSize: '32px', gap: '14px' } },
      h('span', { style: { color: 'var(--ok)', fontWeight: '900' } }, '✓'), L.security.verified));
  S.append(verified);
  gsap.set(verified, { autoAlpha: 0, scale: 0.6 });
  tl.to(verified, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2.4)' }, 20.36);
  tl.to(verified, { autoAlpha: 0, y: 40, duration: 0.2, ease: 'power2.in' }, 20.8);
  cue(20.34, 'confirm');

  /* ---------- access log ---------- */
  const log = h('div.log', { style: { top: '930px', height: '372px' } });
  log.append(h('div.abs', { style: { left: '30px', right: '30px', top: '26px', display: 'flex', alignItems: 'center' } },
    h('div.mono', { style: { fontSize: '21px', letterSpacing: '0.2em', color: '#8b8b96', fontWeight: '700' } }, L.security.logHead),
    h('div', { style: { marginLeft: 'auto', fontSize: '21px', color: '#8b8b96', fontWeight: '600' } }, L.security.logFilter)));
  const entries = [['10:42', 'MRN-10234'], ['10:44', 'MRN-10871'], ['10:47', 'MRN-10234']].map(([tm, mrn], i) => [tm, L.security.who[i], mrn]);
  entries.forEach(([tm, who, mrn], i) => {
    const row = h('div.log-row', { style: { top: `${78 + i * 96}px` } },
      h('div.log-time', {}, tm), h('div.log-who', {}, who), h('div.log-what', {}, L.security.opened), h('div.log-mrn', {}, mrn));
    log.append(row);
    gsap.set(row, { autoAlpha: 0, x: 120 });
    tl.to(row, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'expo.out' }, 21.1 + i * 0.12);
    cue(21.1 + i * 0.12, 'tick', { gain: 0.6 });
  });
  const scanBar = h('div.abs', { style: { left: '0', right: '0', top: '78px', height: '96px', background: 'linear-gradient(90deg, rgba(254,77,30,0), rgba(254,77,30,0.25), rgba(254,77,30,0))' } });
  log.append(scanBar);
  gsap.set(scanBar, { autoAlpha: 0 });
  tl.fromTo(scanBar, { autoAlpha: 1, y: 0 }, { y: 192, duration: 0.45, ease: 'power2.inOut', immediateRender: false }, 21.45);
  tl.to(scanBar, { autoAlpha: 0, duration: 0.1 }, 21.9);
  S.append(log);
  gsap.set(log, { autoAlpha: 0, y: 90 });
  tl.to(log, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, 21.06);
  tl.to(log, { autoAlpha: 0, y: -50, duration: 0.25, ease: 'power2.in' }, 21.86);

  /* ---------- roles ---------- */
  const ROLES = L.security.roles;
  const rr = rng(4);
  let k = 0;
  ROLES.forEach((row, ri) => {
    const els = row.map((name, ci) => {
      const dark = (ri + ci) % 2 === 1;
      const el = h(`div.role${dark ? '.dark' : ''}`, { style: { top: `${944 + ri * 108}px` } }, h('i'), name);
      S.append(el);
      return el;
    });
    const widths = els.map((e) => e.offsetWidth);
    const total = widths.reduce((a, b) => a + b, 0) + 16 * (els.length - 1);
    let x = 520 - total / 2;
    els.forEach((el, ci) => {
      el.style.left = `${x}px`;
      x += widths[ci] + 16;
      const t0 = 22.02 + k * 0.045 + rr() * 0.02;
      gsap.set(el, { autoAlpha: 0, scale: 0.3, rotation: rr.range(-14, 14) });
      tl.to(el, { autoAlpha: 1, scale: 1, rotation: rr.range(-3, 3), duration: 0.42, ease: 'back.out(2.2)' }, t0);
      cue(t0, 'blip', { n: k % 6, gain: 0.35 });
      k++;
    });
  });

  // push out: everything slides up as the next scene pushes in from below
  const content = [...S.children].filter((c) => c !== flood);
  tl.to(content, { y: '-=260', duration: 0.32, ease: 'expo.in' }, 22.76);
}
