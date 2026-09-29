/* SCENE 1 — HOOK (bars 1–2, 0 → 3.75 s)
 * A storm of spreadsheet / chat / email fragments in 3D depth of field.
 * Kinetic pain points slam on every half bar, then everything is sucked into
 * the brand's hollow square, which zooms through the camera into scene 2. */

function buildChaos(tl) {
  const S = scene('s1');
  S.innerHTML = `
    <div class="s1-bg"></div>
    <div class="s1-glow"></div>
    <div class="s1-cam"><div class="s1-world"></div></div>
    <div class="s1-dim"></div>
    <div class="s1-redwash"></div>
    <div class="s1-text"></div>`;
  const world = $('.s1-world', S), cam = $('.s1-cam', S), text = $('.s1-text', S);

  /* ── fragments ─────────────────────────────────────── */
  const sheet = (title, rows) => `<div class="fr fr-sheet">
      <div class="fr-sheet-top">${icon('file-spreadsheet', 26, 2)}<span>${title}</span></div>
      <table>${rows.map((r) => `<tr>${r.map((c) => `<td class="${/^#/.test(c) ? 'err' : ''}">${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
  const chat = (who, msg, time, light = false) => `<div class="fr fr-chat ${light ? 'light' : ''}">
      <div class="fr-chat-who">${who}</div><div class="fr-chat-text">${msg}</div><div class="fr-chat-time">${time}</div></div>`;
  const mail = (from, subj, tag) => `<div class="fr fr-mail"><div class="fr-mail-ic">${icon('mail', 30, 2)}</div>
      <div class="fr-mail-tx"><div class="fr-mail-from">${from}</div><div class="fr-mail-subj">${subj}</div></div>
      ${tag ? `<span class="fr-tag">${tag}</span>` : '<span class="fr-dot"></span>'}</div>`;
  const sticky = (txt) => `<div class="fr fr-sticky">${txt}</div>`;
  const badge = (n) => `<div class="fr fr-badge">${n}</div>`;
  const file = (name, kind) => `<div class="fr fr-file"><div class="fr-file-ic ${kind}">${kind.toUpperCase()}</div><span>${name}</span></div>`;
  const cal = () => `<div class="fr fr-cal"><div class="fr-cal-h">${icon('calendar-days', 24, 2)}<span>JUNE</span></div>
      <div class="fr-cal-g">${Array.from({ length: 21 }, (_, i) => `<i>${i + 10}</i>`).join('')}</div>
      <div class="fr-cal-bar a">Rashad · Group A</div><div class="fr-cal-bar b">Rashad · Group B</div>
      <div class="fr-cal-x">${icon('triangle-alert', 26, 2.4)}</div></div>`;
  const note = (ic, cls, a, b) => `<div class="fr fr-note ${cls}">${icon(ic, 34, 2.2)}<div><div class="fr-note-a">${a}</div><div class="fr-note-b">${b}</div></div></div>`;

  const F = [
    { h: sheet('rates_2026_FINAL_v7.xlsx', [['Hotel', 'Rate', 'Pax', 'Total'], ['Old City Inn', '85', '12', '1020'], ['Riverside', '110', '??', '#REF!'], ['Guide 3d', '150', '—', '450'], ['TOTAL', '', '', '#VALUE!']]), x: 270, y: 350, z: -60, rz: -9, ry: 14 },
    { h: chat('Hotel Sales', 'Is the hotel confirmed??', '09:41', true), x: 800, y: 250, z: 60, rz: 5 },
    { h: mail('reservations@', 'RE: RE: FW: Rooming list (final)'), x: 700, y: 560, z: -260, rz: -4 },
    { h: sticky('Call guide<br>re: 14 Jun!!'), x: 160, y: 760, z: 120, rz: 11 },
    { h: badge('99+'), x: 950, y: 730, z: 160 },
    { h: file('rooming_list_v7_FINAL(2).xlsx', 'xls'), x: 780, y: 1340, z: 40, rz: -7 },
    { h: chat('Driver', 'Can’t find the group \u{1F629}', '10:02'), x: 260, y: 1420, z: 90, rz: 4 },
    { h: cal(), x: 770, y: 1650, z: -120, rz: 8 },
    { h: mail('Accounts', 'Invoice #0231 unpaid', 'OVERDUE'), x: 330, y: 1720, z: -40, rz: -6 },
    { h: chat('Client', 'Which price did you quote us?', '11:15', true), x: 540, y: 120, z: -420, rz: -3 },
    { h: note('calculator', 'fx', 'USD → AZN → EUR', 'which rate??'), x: 150, y: 1140, z: -230, rz: -12 },
    { h: note('phone-missed', 'miss', '3 missed calls', 'Supplier · Gabala'), x: 930, y: 1070, z: -70, rz: 9 },
    { h: note('id-card', 'pass', 'Passport expires', 'in 2 weeks?!'), x: 560, y: 1560, z: 200, rz: -3 },
    { h: sheet('costs.xlsx', [['A', 'B'], ['#VALUE!', '=SUM('], ['312', '??']]), x: 960, y: 430, z: -560, rz: 10 },
    { h: file('hotel_rates_2026.pdf', 'pdf'), x: 120, y: 480, z: -480, rz: -8 },
    { h: chat('Agent', 'Need rooming list ASAP', '12:30'), x: 380, y: 960, z: -700, rz: 6 },
    { h: sticky('Release<br>date??'), x: 790, y: 900, z: -560, rz: -10 },
    { h: badge('37'), x: 140, y: 1570, z: -330 },
  ];
  // Burst of chat bubbles for "217 unread messages" (pop on 16ths).
  const BURST = [
    ['Guest', 'Any update?? \u{1F64F}', 250, 580, -2],
    ['Hotel', 'Sorry, fully booked', 840, 610, 3],
    ['Client', 'Can you resend the voucher?', 330, 1250, -3],
    ['Guide', 'Sick tomorrow!!', 840, 1210, 4],
    ['Partner', 'Invoice please', 240, 1490, 2],
    ['Driver', 'Which hotel?', 800, 430, -4],
  ];
  const rnd = mulberry32(7);
  const frags = F.map((f, i) => {
    const node = el(f.h);
    world.appendChild(node);
    const blur = f.z < 0 ? Math.max(0, (-f.z - 150) / 110) : Math.max(0, (f.z - 100) / 40);
    if (blur > 0.2) node.style.filter = `blur(${blur.toFixed(1)}px)`;
    return {
      node, ...f, ry: f.ry || 0, i,
      ax: 14 + rnd() * 26, ay: 12 + rnd() * 22, wx: 0.6 + rnd() * 0.9, wy: 0.5 + rnd() * 0.8,
      px: rnd() * 6.28, py: rnd() * 6.28, ar: 2 + rnd() * 4, wr: 0.4 + rnd() * 0.8, pr: rnd() * 6.28,
      vy: 10 + rnd() * 30, spin: rnd() < 0.5 ? -1 : 1, lag: rnd() * 0.12,
    };
  });
  const bursts = BURST.map(([who, msg, x, y, rz], i) => {
    const node = el(chat(who, msg, 'now', i % 2 === 1));
    node.classList.add('burst');
    world.appendChild(node);
    return { node, x, y, z: 0, rz, ry: 0, i: 100 + i, ax: 8, ay: 8, wx: 1.1, wy: 0.9, px: i, py: i * 2, ar: 1.5, wr: 0.7, pr: i, vy: 16, spin: i % 2 ? 1 : -1, lag: 0.03 * i, t0: B(1.75 + i * 0.25) };
  });
  bursts.forEach((b) => cue('ping', b.t0, { i: b.i - 100 }));

  const CX = W / 2, CY = H / 2;
  // Slams on a syncopated 3-3-2 pattern: B0, B1.5, B3, B4.5.
  const slams = [0, B(1.5), B(3), B(4.5)];
  const vortexT0 = B(6.4), vortexT1 = B(7.45);

  onFrame((t) => {
    if (t > B(8.2)) return;
    // camera: slow push-in + beat punches + shake
    let sc = 1 + 0.07 * E.inOutCubic(inv(0, B(7), t));
    let sx = 0, sy = 0, rot = -1.2 + 1.8 * inv(0, B(8), t);
    for (const s0 of slams) {
      sc += 0.045 * pulse(t, s0, 7);
      sx += shake(t, s0, 10, 17, 9);
      sy += shake(t, s0 + 0.013, 8, 13, 9);
    }
    sx += shake(t, B(3), 26, 29, 7) + shake(t, B(3.75), 14, 31, 9);
    cam.style.transform = `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${sc.toFixed(4)})`;

    const vort = (f) => E.inCubic(inv(vortexT0 + f.lag, vortexT1, t));
    for (const f of frags.concat(bursts)) {
      let x = f.x + f.ax * Math.sin(t * f.wx + f.px);
      let y = f.y + f.ay * Math.sin(t * f.wy + f.py) - f.vy * t;
      let rz = f.rz + f.ar * Math.sin(t * f.wr + f.pr);
      let z = f.z, s = 1, o = 1;
      if (f.t0 !== undefined) { // burst bubbles pop in
        const p = inv(f.t0, f.t0 + 0.22, t);
        s = p <= 0 ? 0 : E.outBack(p, 2.4);
        o = p <= 0 ? 0 : 1;
      }
      const v = vort(f);
      if (v > 0) {
        const dx = x - CX, dy = y - CY;
        const ang = v * v * 2.4 * f.spin;
        const r = 1 - v;
        x = CX + (dx * Math.cos(ang) - dy * Math.sin(ang)) * r;
        y = CY + (dx * Math.sin(ang) + dy * Math.cos(ang)) * r;
        rz += v * 220 * f.spin; z *= r; s *= 1 - 0.85 * v; o *= 1 - inv(0.7, 1, v);
      }
      f.node.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${f.ry}deg) rotateZ(${rz.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      f.node.style.opacity = o.toFixed(3);
    }
  });

  /* ── kinetic pain points ───────────────────────────── */
  const phrases = [
    { num: '14', words: ['spreadsheets.'] },
    { num: '217', words: ['unread', 'messages.'] },
    { num: '1', words: ['double-booked', 'guide.'], glitch: true },
    { num: null, words: ['Sound', 'familiar?'] },
  ];
  const P = phrases.map((p, i) => {
    const inner = `${p.num ? `<div class="s1-num tnum">${p.num}</div>` : ''}
      <div class="s1-words">${p.words.map((w, k) => `<div class="${i === 3 && k === 1 ? 'or' : ''}">${w}</div>`).join('')}</div>`;
    const node = el(`<div class="s1-phrase ${p.num ? '' : 'nonum'}">
        ${p.glitch ? `<div class="g g-c">${inner}</div><div class="g g-r">${inner}</div>` : ''}
        <div class="g-main">${inner}</div></div>`);
    text.appendChild(node);
    return node;
  });

  // 1: already on screen and crisp at frame 0 (thumbnail-safe), settles in.
  tl.set(P[0], { autoAlpha: 1 }, 0);
  tl.fromTo(P[0], { scale: 1.1 }, { scale: 1, duration: 0.3, ease: 'expo.out' }, 0);
  tl.to(P[0], { scale: 1.05, duration: slams[1] - 0.3, ease: 'none' }, 0.3);
  cue('slam', 0, { strong: 1 });
  for (let i = 1; i < 4; i++) {
    const t0 = slams[i], t1 = i < 3 ? slams[i + 1] : B(6.45);
    tl.set(P[i - 1], { autoAlpha: 0 }, t0);
    tl.set(P[i], { autoAlpha: 1 }, t0);
    tl.fromTo(P[i], { scale: 1.45, filter: 'blur(20px)' }, { scale: 1, filter: 'blur(0px)', duration: 0.26, ease: 'expo.out', immediateRender: false }, t0);
    tl.to(P[i], { scale: 1.05, duration: t1 - t0 - 0.26, ease: 'none' }, t0 + 0.26);
    cue('slam', t0, { strong: i === 3 ? 0 : 1 });
  }
  countUp($('.g-main .s1-num', P[1]), slams[1], slams[1] + 0.5, 0, 217, fmtInt, E.outExpo);

  // Glitch on "1 double-booked guide."
  const gc = $('.g-c', P[2]), gr = $('.g-r', P[2]), gm = $('.g-main', P[2]);
  onFrame((t) => {
    if (t < B(3) || t > B(4.5)) return;
    const step = Math.floor(t * 30);
    const burst = pulse(t, B(3), 5) + 0.8 * pulse(t, B(3.75), 9) + 0.6 * pulse(t, B(4.125), 12);
    const on = burst > 0.08 && (hash1(3, step) > -0.3);
    const a = on ? burst * 26 : 0;
    const j = hash1(5, step) * a, k = hash1(9, step) * a * 0.6;
    gr.style.transform = `translate(${(j + a * 0.5).toFixed(1)}px, ${k.toFixed(1)}px)`;
    gc.style.transform = `translate(${(-j - a * 0.5).toFixed(1)}px, ${(-k).toFixed(1)}px)`;
    const y1 = Math.round((hash1(11, step) * 0.5 + 0.5) * 70), h1 = 6 + Math.round((hash1(13, step) * 0.5 + 0.5) * 14);
    gm.style.clipPath = on && burst > 0.3 ? `polygon(0 0,100% 0,100% ${y1}%,0 ${y1}%,0 ${y1 + h1}%,100% ${y1 + h1}%,100% 100%,0 100%)` : 'none';
    gr.style.opacity = gc.style.opacity = on ? Math.min(1, burst * 1.4).toFixed(2) : '0';
  });
  cue('glitch', B(3)); cue('glitch', B(3.75), { small: 1 }); cue('glitch', B(4.125), { small: 1 });
  tl.fromTo('.s1-redwash', { opacity: 0 }, { opacity: 0.95, duration: 0.05 }, B(3));
  tl.to('.s1-redwash', { opacity: 0.25, duration: 0.3, ease: 'power2.out' }, B(3) + 0.05);
  tl.to('.s1-redwash', { opacity: 0.6, duration: 0.04 }, B(3.75));
  tl.to('.s1-redwash', { opacity: 0, duration: 0.3, ease: 'power2.out' }, B(3.75) + 0.04);

  // "Sound familiar?" implodes into the vortex.
  tl.to(P[3], { scale: 0.15, autoAlpha: 0, filter: 'blur(14px)', rotation: -25, duration: B(0.5), ease: 'power3.in' }, B(6.45));
  tl.to('.s1-dim', { opacity: 0, duration: 0.3 }, B(6.5));

  /* ── the hollow square: appears, swallows the chaos, zooms through ─ */
  const hol = HEROES[HOLLOW];
  const hv = (s) => ({ width: s, height: s, borderRadius: 0.3 * s, borderWidth: 0.25 * s });
  tl.set(hol, { autoAlpha: 1, x: CX, y: CY, rotation: -120, ...hv(1) }, B(6.75));
  tl.to(hol, { rotation: 0, ...hv(150), duration: B(0.6), ease: 'back.out(1.7)' }, B(6.75));
  tl.to(hol, { ...hv(172), duration: 0.07, ease: 'power2.out' }, B(7));      // beat pulse
  tl.to(hol, { ...hv(150), duration: 0.16, ease: 'power2.inOut' }, B(7) + 0.07);
  tl.fromTo('.s1-glow', { opacity: 1 }, { opacity: 0, duration: B(1.25) }, B(6.75));
  tl.to(hol, { rotation: 45, ...hv(7200), duration: B(0.5), ease: logEase(150, 7200, E.inCubic) }, B(7.5));
  tl.set(S, { autoAlpha: 1 }, 0);
  tl.set(S, { autoAlpha: 0 }, B(8));
  cue('pop', B(6.75), { note: 0 });
  cue('pulse', B(7));
  cue('suck', B(6.4));
  cue('riser', B(5), { to: B(8) });
  cue('zoom', B(7.5), { to: B(8) });
}
