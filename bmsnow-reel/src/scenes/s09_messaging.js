import { el, css, icon, headline, lineIn, lineOut, chips, chipsIn, scrambleTo, COLOR, W } from '../lib.js';
import { T } from '../timing.js';
import { tr } from '../i18n.js';
import { tap, checkCircle } from '../ui.js';

// 0:18–0:20  Group 7 — Messaging: an email reminder template resolves its merge
// tag, reminders fly out, and the message log fills (sent / consent-skipped / retry).
export default function messaging({ layers, tl, bg, hud, cue }) {
  const t0 = T.messaging;
  const end = T.analytics;
  const sec = el('section', 'scene', layers.scenes);
  tl.set(sec, { visibility: 'visible' }, t0 - 0.05);
  tl.set(sec, { visibility: 'hidden' }, end + 0.05);
  hud.setGroup(tl, t0, 6);
  bg.to(tl, t0 - 0.2, { glow: 0.5, orbY: 0.48, dur: 0.6 });

  const h = headline(sec, ['Reminders on', '<span class="accent">autopilot.</span>']);
  gsap.set(h.spans, { yPercent: 115 });
  lineIn(tl, h.spans, t0 + 0.02);
  lineOut(tl, h.spans, end - 0.26);

  const st = el('div', 'abs', sec);
  css(st, { left: 0, top: 0, width: W + 'px', height: '1920px', perspective: '2400px' });

  // ---------------- email reminder ----------------
  const em = el('div', 'card', st);
  css(em, { left: '76px', top: '576px', width: '720px', height: '450px', borderRadius: '34px', padding: '30px 34px', overflow: 'hidden' });
  em.innerHTML = `
    <div class="row" style="gap:14px">
      <div style="width:56px;height:56px;border-radius:17px;background:#FE4D1E;display:flex;align-items:center;justify-content:center;font:800 26px/1 var(--display);color:#fff">A</div>
      <div class="grow"><div style="font:800 22px/1.15 var(--ui)">Aura Studio</div><div style="font:500 17px/1.3 var(--ui);color:#8C7F79">to leyla.m@mail.com</div></div>
      <span class="pill" style="height:40px">${icon('clock', 20, 2.4)}24 h before</span>
    </div>
    <div class="divider" style="margin:22px 0 22px"></div>
    <div style="font:800 36px/1.2 var(--ui);letter-spacing:-0.02em;color:#1C1512;white-space:nowrap">See you tomorrow, <span class="mt" style="display:inline-block;padding:2px 10px;border-radius:10px;background:#FFE6DC;color:#FE4D1E">{{first_name}}</span>!</div>
    <div style="font:500 22px/1.45 var(--ui);color:#6E625C;margin-top:14px">Your <b style="color:#1C1512">Haircut &amp; Styling</b> with Aysel is booked for <b style="color:#1C1512">Tue 13 Oct at 15:30</b>.</div>
    <div class="row" style="gap:12px;margin-top:26px">
      <div class="btn" style="height:66px;font-size:22px;border-radius:18px;padding:0 26px">${icon('calendar-check', 24, 2.4)}Manage booking</div>
      <div class="btn" style="height:66px;font-size:22px;border-radius:18px;padding:0 24px;background:#F6EFEB;color:#1C1512">Reschedule</div>
    </div>`;
  const mt = em.querySelector('.mt');
  const E = t0;
  gsap.set(em, { transformPerspective: 2400, transformOrigin: '50% 100%' });
  tl.fromTo(em, { y: 1000, rotationX: -45, rotationZ: 4 }, { y: 0, rotationX: 0, rotationZ: -2, duration: 0.8, ease: 'expo.out' }, E);
  tl.to(em, { rotationY: 6, duration: 1.2, ease: 'sine.inOut' }, E + 0.7);
  const SC = E + 0.36;
  scrambleTo(tl, mt, '{{first_name}}', 'Leyla', SC, 0.34);
  tl.to(mt, { backgroundColor: 'rgba(255,230,220,0)', color: '#1C1512', padding: '2px 0px', duration: 0.2 }, SC + 0.3);
  cue(E, 'whoosh', { dur: 0.3, gain: 0.5 });
  cue(SC, 'glitch', { gain: 0.45 });
  cue(SC + 0.32, 'tick', { gain: 0.5, pitch: 1.3 });

  // ---------------- message log ----------------
  const lg = el('div', 'card dark', st);
  css(lg, { left: '404px', top: '984px', width: '600px', height: '396px', borderRadius: '34px', padding: '28px 30px', zIndex: 3 });
  lg.innerHTML = `<div class="row" style="justify-content:space-between"><div style="font:800 25px/1.1 var(--ui)">Message log</div><span class="pill dark" style="height:40px">${icon('mail-check', 20, 2.4)}Email</span></div>`;
  const entries = [
    ['Leyla M.', 'Reminder · 24 h', 'Sent', 'ok'],
    ['Murad A.', 'Reminder · 2 h', 'Sent', 'ok'],
    ['Sevda K.', 'Campaign · no consent', 'Skipped', 'skip'],
    ['Orkhan T.', 'Address bounced', 'Retry', 'fail'],
  ];
  const logRows = entries.map(([n, d, s, k], i) => {
    const r = el('div', 'abs row', lg);
    css(r, { left: '30px', right: '30px', top: 92 + i * 72 + 'px', height: '62px', gap: '16px' });
    const badgeBg = k === 'ok' ? 'rgba(254,77,30,0.16)' : k === 'skip' ? 'rgba(255,255,255,0.08)' : '#FE4D1E';
    const badgeFg = k === 'ok' ? '#FF9B78' : k === 'skip' ? 'rgba(255,255,255,0.55)' : '#fff';
    r.innerHTML = `<div class="st" style="width:42px;height:42px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;background:${k === 'skip' ? 'rgba(255,255,255,0.08)' : 'rgba(254,77,30,0.16)'};color:${k === 'skip' ? 'rgba(255,255,255,0.5)' : '#FE4D1E'}">${icon(k === 'ok' ? 'check' : k === 'skip' ? 'shield-check' : 'refresh-cw', 22, 2.8)}</div>
      <div class="grow"><div style="font:700 21px/1.1 var(--ui)">${n}</div><div style="font:500 17px/1.3 var(--ui);color:rgba(255,255,255,0.5)">${d}</div></div>
      <span class="bdg" style="font:800 17px/1 var(--ui);padding:10px 14px;border-radius:12px;background:${badgeBg};color:${badgeFg}">${s}</span>`;
    return r;
  });
  const L = t0 + 0.42;
  gsap.set(lg, { transformPerspective: 2400 });
  tl.fromTo(lg, { x: 900, rotationY: -40 }, { x: 0, rotationY: -8, rotationZ: 2, duration: 0.7, ease: 'expo.out' }, L);

  // envelopes fly from the email to the log
  const envs = [0, 1, 3].map((row, i) => {
    const e = el('div', 'abs center', st);
    css(e, { left: 0, top: 0, width: '64px', height: '64px', borderRadius: '18px', background: '#FE4D1E', color: '#fff', boxShadow: '0 14px 30px -6px rgba(254,77,30,0.6)', zIndex: 6 });
    e.innerHTML = icon('mail', 32, 2.4);
    gsap.set(e, { opacity: 0 });
    const t = L + 0.18 + i * 0.12;
    const sx = 250, sy = 1000, ex = 404 + 30 + 21 - 32 + 8, ey = 984 + 92 + row * 72 + 31 - 32;
    tl.set(e, { opacity: 1, x: sx, y: sy, scale: 0.4, rotation: -20 }, t);
    tl.to(e, { x: ex, duration: 0.36, ease: 'power2.inOut' }, t);
    tl.to(e, { keyframes: [{ y: sy - 170 - i * 30, duration: 0.18, ease: 'power2.out' }, { y: ey, duration: 0.18, ease: 'power2.in' }] }, t);
    tl.to(e, { scale: 1, rotation: 10, duration: 0.2, ease: 'power2.out' }, t);
    tl.to(e, { scale: 0.3, opacity: 0, duration: 0.1, ease: 'power2.in' }, t + 0.34);
    cue(t, 'swish', { gain: 0.3 });
    return e;
  });
  logRows.forEach((r, i) => {
    tl.fromTo(r, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.35, ease: 'expo.out' }, L + 0.5 + i * 0.1);
    cue(L + 0.5 + i * 0.1, i === 2 ? 'tick' : 'pop', { gain: 0.35, pitch: 1 + i * 0.1 });
  });

  // retry the bounced one
  const RT = L + 0.9;
  const fr = logRows[3];
  tap(fr, 490, 31, tl, RT);
  tl.set(fr.querySelector('.bdg'), { textContent: tr('Sent'), backgroundColor: 'rgba(254,77,30,0.16)', color: '#FF9B78' }, RT + 0.12);
  tl.fromTo(fr.querySelector('.bdg'), { scale: 1 }, { keyframes: [{ scale: 1.25, duration: 0.08 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }], immediateRender: false }, RT + 0.12);
  cue(RT, 'click', { gain: 0.55 });
  cue(RT + 0.14, 'ding', { gain: 0.45, pitch: 1.25 });

  const ch = chips(sec, ['Email templates', 'Merge tags', 'Any lead time', 'Campaigns', 'Consent-aware'], 1422);
  gsap.set(ch.list, { opacity: 0 });
  chipsIn(tl, ch.list, t0 + 1.0, 0.035);

  const EX = end - 0.32;
  tl.to(em, { y: -1300, rotationX: 30, duration: 0.36, ease: 'power3.in' }, EX);
  tl.to(lg, { y: -1100, rotationX: 20, duration: 0.36, ease: 'power3.in' }, EX + 0.04);
  tl.to(ch.list, { opacity: 0, y: -20, duration: 0.2, stagger: 0.02 }, EX);
  cue(EX + 0.04, 'whoosh', { dur: 0.35, gain: 0.7 });
}
