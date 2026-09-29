import { el, css, icon, headline, lineIn, lineOut, chips, chipsIn, COLOR, W } from '../lib.js';
import { T } from '../timing.js';

// 0:22–0:24  Group 9 — Management & Security: department access (module grants
// per department, straight from config/departments.php) + 5 interface languages.
export default function admin({ layers, tl, bg, hud, cue }) {
  const t0 = T.admin;
  const end = T.numbers;
  const sec = el('section', 'scene', layers.scenes);
  tl.set(sec, { visibility: 'visible' }, t0 - 0.05);
  tl.set(sec, { visibility: 'hidden' }, end + 0.05);
  hud.setGroup(tl, t0, 8);
  bg.to(tl, t0 - 0.2, { glow: 0.5, orbY: 0.5, dur: 0.6 });

  const h = headline(sec, ['Right access', '<span class="accent">for every role.</span>']);
  gsap.set(h.spans, { yPercent: 115 });
  lineIn(tl, h.spans, t0 + 0.02);
  lineOut(tl, h.spans, end - 0.3);

  const st = el('div', 'abs', sec);
  css(st, { left: 0, top: 0, width: W + 'px', height: '1920px', perspective: '2400px' });

  // ---------------- departments ----------------
  const roles = [
    ['store', 'Front Desk', 16],
    ['scissors', 'Practitioner / Stylist', 10],
    ['calculator', 'Finance & Accounting', 15],
    ['megaphone', 'Marketing', 11],
    ['crown', 'Management', 37],
  ];
  const rc = el('div', 'card', st);
  css(rc, { left: '76px', top: '576px', width: '928px', height: '560px', borderRadius: '34px', padding: '26px 30px' });
  rc.innerHTML = `<div class="row" style="justify-content:space-between"><div><div style="font:800 25px/1.1 var(--ui)">Departments</div><div style="font:500 18px/1.3 var(--ui);color:#8C7F79">Module grants per role</div></div>
    <span class="pill" style="height:40px">${icon('shield-check', 20, 2.4)}Users &amp; roles</span></div>`;
  const rrows = roles.map(([ic, name, n], i) => {
    const r = el('div', 'abs row', rc);
    const all = n === 37;
    css(r, { left: '30px', right: '30px', top: 104 + i * 88 + 'px', height: '76px', gap: '18px', borderRadius: '20px', padding: '0 16px', background: all ? '#1C1512' : '#FFF8F5', color: all ? '#fff' : '#1C1512' });
    r.innerHTML = `<div class="iconbox" style="width:50px;height:50px;border-radius:15px;${all ? 'background:rgba(254,77,30,0.2)' : ''}">${icon(ic, 25, 2.3)}</div>
      <div style="width:290px;font:700 21px/1.1 var(--ui)">${name}</div>
      <div class="grow" style="height:14px;border-radius:7px;background:${all ? 'rgba(255,255,255,0.1)' : '#F1E7E2'}"><i class="rb" style="display:block;height:100%;width:${(n / 37) * 100}%;border-radius:7px;background:${all ? 'linear-gradient(90deg,#FF9B78,#FE4D1E)' : '#FE4D1E'}"></i></div>
      <div class="tnum" style="width:118px;text-align:right;font:800 21px/1 var(--ui);color:${all ? '#FF9B78' : '#1C1512'}">${all ? 'All 37' : n + ' / 37'}</div>`;
    return r;
  });
  const R = t0;
  gsap.set(rc, { transformPerspective: 2400 });
  tl.fromTo(rc, { x: -1000, rotationY: 40, rotationZ: -6 }, { x: 0, rotationY: 6, rotationZ: -1.5, duration: 0.75, ease: 'expo.out' }, R);
  tl.to(rc, { rotationY: -3, duration: 1.2, ease: 'sine.inOut' }, R + 0.7);
  tl.fromTo(rrows, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.4, ease: 'expo.out', stagger: 0.06 }, R + 0.12);
  tl.fromTo(rc.querySelectorAll('.rb'), { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.6, ease: 'expo.out', stagger: 0.07 }, R + 0.2);
  cue(R, 'whoosh', { dur: 0.3, gain: 0.5 });
  roles.forEach((_, i) => cue(R + 0.2 + i * 0.07, 'tick', { gain: 0.3, pitch: 0.9 + i * 0.1 }));

  // ---------------- languages ----------------
  const lg = el('div', 'card dark', st);
  css(lg, { left: '76px', top: '1162px', width: '928px', height: '228px', borderRadius: '34px', padding: '0 34px', zIndex: 3, display: 'flex', alignItems: 'center', gap: '30px' });
  lg.innerHTML = `<div class="iconbox" style="width:84px;height:84px;border-radius:24px;background:rgba(254,77,30,0.16)">${icon('globe', 44, 2)}</div>
    <div style="width:250px"><div style="font:800 26px/1.15 var(--ui)">5 languages</div><div class="row lp" style="gap:7px;margin-top:12px"></div></div>
    <div class="grow gw" style="position:relative;height:130px;overflow:hidden"></div>`;
  const codes = ['EN', 'AZ', 'TR', 'RU', 'UZ'];
  const words = ['Hello', 'Salam', 'Merhaba', 'Привет', 'Salom'];
  const pills = codes.map((c) => {
    const p = el('span', '', lg.querySelector('.lp'), c);
    css(p, { font: '800 15px/1 var(--ui)', padding: '8px 9px', borderRadius: '9px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' });
    return p;
  });
  const gw = lg.querySelector('.gw');
  const wordEls = words.map((w) => {
    const s = el('div', 'abs', gw, w);
    css(s, { left: 0, top: '10px', font: '800 96px/1.1 var(--display)', letterSpacing: '-0.04em', color: '#FE4D1E', whiteSpace: 'nowrap' });
    return s;
  });
  gsap.set(wordEls, { yPercent: 110 });
  const LGt = t0 + 0.42;
  gsap.set(lg, { transformPerspective: 2400 });
  tl.fromTo(lg, { y: 700, rotationX: -40 }, { y: 0, rotationX: 0, duration: 0.7, ease: 'expo.out' }, LGt);
  const step = 0.2;
  words.forEach((w, i) => {
    const t = LGt + 0.25 + i * step;
    tl.fromTo(wordEls[i], { yPercent: 110 }, { yPercent: 0, duration: 0.22, ease: 'expo.out' }, t);
    if (i < words.length - 1) tl.to(wordEls[i], { yPercent: -110, duration: 0.16, ease: 'power3.in', immediateRender: false }, t + step - 0.05);
    tl.to(pills[i], { backgroundColor: '#FE4D1E', color: '#FFFFFF', duration: 0.1 }, t);
    tl.fromTo(pills[i], { scale: 1 }, { keyframes: [{ scale: 1.3, duration: 0.06 }, { scale: 1, duration: 0.2, ease: 'back.out(3)' }], immediateRender: false }, t);
    cue(t, 'tick', { gain: 0.45, pitch: 1 + i * 0.15 });
  });

  const ch = chips(sec, ['Module grants', 'Documents', 'Announcements', 'Opening hours', 'Currency & timezone'], 1422);
  gsap.set(ch.list, { opacity: 0 });
  chipsIn(tl, ch.list, t0 + 1.05, 0.035);

  // exit: everything drops away, HUD leaves (its mini grid becomes the big grid next)
  const EX = end - 0.34;
  tl.to(rc, { y: 1400, rotationX: -30, duration: 0.36, ease: 'power3.in' }, EX);
  tl.to(lg, { y: 1100, rotationX: -30, duration: 0.34, ease: 'power3.in' }, EX + 0.02);
  tl.to(ch.list, { opacity: 0, y: 20, duration: 0.2, stagger: 0.02 }, EX);
  cue(EX, 'reverse', { dur: 0.34, gain: 0.8 });
}
