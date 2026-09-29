/* 22.12 - 24.0s  SECURITY + LANGUAGES: forced 2FA for every user (split-flap code + shield + orbiting roles),
   then the same split-flap board speaks EN / AZ / TR / RU. Hard cut to the stats slam at 24.0. */
K.def(() => {
  const { h, sv, set, tw, spr, kf, E, norm, lerp, clamp, px, C } = K;
  const T0 = K.SEC_T0, END = 24.0, LANG = 22.7, WSTEP = 0.28, CHECK = 22.42;

  // ---- split-flap cell -------------------------------------------------------------------
  const CW = 108, CHT = 150, RAD = 18;
  function flapCell(parent, x, y) {
    const cell = h('div', { cls: 'abs', css: { left: px(x), top: px(y), width: px(CW), height: px(CHT) } }, parent);
    const mk = (top, z) => {
      const half = h('div', { css: { position: 'absolute', left: '0px', top: top ? '0px' : px(CHT / 2), width: px(CW), height: px(CHT / 2), overflow: 'hidden', zIndex: z,
        background: top ? 'linear-gradient(180deg,#2a2a31,#222228)' : 'linear-gradient(180deg,#1e1e23,#19191d)',
        borderRadius: top ? `${RAD}px ${RAD}px 0 0` : `0 0 ${RAD}px ${RAD}px`, transformOrigin: top ? '50% 100%' : '50% 0%' } }, cell);
      const ch = h('div', { cls: 'display', css: { position: 'absolute', left: '0px', top: top ? '0px' : px(-CHT / 2), width: px(CW), height: px(CHT),
        lineHeight: px(CHT), textAlign: 'center', fontSize: '100px', fontWeight: 800, letterSpacing: '0', color: '#fff' } }, half);
      const shade = h('div', { cls: 'fill', css: { background: '#000', opacity: 0 } }, half);
      return { half, ch, shade, c: null };
    };
    const q = { cell, topS: mk(true, 1), botS: mk(false, 1), flapT: mk(true, 3), flapB: mk(false, 3) };
    h('div', { css: { position: 'absolute', left: '0px', top: px(CHT / 2 - 1.5), width: px(CW), height: '3px', background: 'rgba(0,0,0,0.7)', zIndex: 6 } }, cell);
    return q;
  }
  const setCh = (p, c, col) => { const key = c + col; if (p.c !== key) { p.ch.textContent = c; p.ch.style.color = col; p.c = key; } };
  function flapUpdate(q, seq, t) {
    let k = -1;
    for (let i = 0; i < seq.length; i++) if (t >= seq[i][0]) k = i;
    const cur = k >= 0 ? seq[k] : [0, '', '#fff', 0.1], prev = k >= 1 ? seq[k - 1] : [0, '', '#fff'];
    const p = k >= 0 ? clamp((t - cur[0]) / (cur[3] || 0.13)) : 1;
    setCh(q.topS, cur[1], cur[2]);
    setCh(q.botS, p < 1 ? prev[1] : cur[1], p < 1 ? prev[2] : cur[2]);
    if (p < 0.5) {
      setCh(q.flapT, prev[1], prev[2]);
      q.flapT.half.style.visibility = ''; q.flapB.half.style.visibility = 'hidden';
      q.flapT.half.style.transform = `perspective(600px) rotateX(${(-90 * E.in2(p * 2)).toFixed(2)}deg)`;
      q.flapT.shade.style.opacity = (0.55 * p * 2).toFixed(3);
    } else if (p < 1) {
      setCh(q.flapB, cur[1], cur[2]);
      q.flapT.half.style.visibility = 'hidden'; q.flapB.half.style.visibility = '';
      q.flapB.half.style.transform = `perspective(600px) rotateX(${(90 * (1 - E.out2((p - 0.5) * 2))).toFixed(2)}deg)`;
      q.flapB.shade.style.opacity = (0.45 * (1 - (p - 0.5) * 2)).toFixed(3);
    } else { q.flapT.half.style.visibility = 'hidden'; q.flapB.half.style.visibility = 'hidden'; }
  }

  K.scene('security', T0, END, (root) => {
    const bg = K.darkBg(root, [540, 800]);
    const content = h('div', { cls: 'fill' }, root);
    const kickA = K.kicker(content, { label: 'SECURITY', active: [7], theme: 'dark' });
    const kickB = K.kicker(content, { label: 'LANGUAGES', active: [], theme: 'dark' });
    const head = K.headline(content, ['<span class="l1">2FA for all.</span>', '<span class="o l2">4 languages.</span>'], { x: 84, y: 340, size: 116, color: '#fff' });
    const l1 = head.el.querySelector('.l1'), l2 = head.el.querySelector('.l2');

    // shield + orbiting roles
    const glow = K.glow(content, { x: 540, y: 770, r: 420, o: 0.35 });
    const shieldWrap = h('div', { cls: 'abs', css: { width: '250px', height: '250px', zIndex: 2 } }, content);
    const sh = sv('svg', { width: 250, height: 250, viewBox: '0 0 24 24', fill: 'none', stroke: C.orange, 'stroke-width': 1.25, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, shieldWrap);
    sv('path', { d: 'M12 2.5l7.5 3v5.8c0 4.7-3.2 8.4-7.5 10.2-4.3-1.8-7.5-5.5-7.5-10.2V5.5z', fill: 'rgba(254,77,30,0.12)' }, sh);
    const ck = sv('path', { d: 'M8.6 12.2l2.4 2.4 4.6-4.8', 'stroke-width': 1.6, stroke: '#fff' }, sh);
    const ckLen = ck.getTotalLength(); ck.style.strokeDasharray = `${ckLen}`;
    const ROLES = ['Owner', 'Manager', 'Sales Manager', 'Procurement Officer', 'Warehouse Keeper', 'Accountant', 'HR Manager'];
    const chips = ROLES.map((r) => {
      const el = h('div', { cls: 'abs row', css: { height: '58px', padding: '0 22px 0 16px', gap: '10px', borderRadius: '29px', background: '#1E1E23',
        border: '1.5px solid rgba(255,255,255,0.12)', font: "600 25px 'Inter'", color: '#fff', whiteSpace: 'nowrap', boxShadow: '0 12px 30px rgba(0,0,0,0.4)' } }, content);
      el.appendChild(window.icon('user', 26, C.orange, 2.4)); h('span', { text: r }, el);
      return { el, w: 0 };
    });
    chips.forEach((c) => { c.w = c.el.offsetWidth; });

    // language chips
    const LC = ['EN', 'AZ', 'TR', 'RU'];
    const lchips = LC.map((code, i) => h('div', { cls: 'abs mono', text: code, css: { left: px(210 + i * 170), top: '700px', width: '150px', height: '88px', lineHeight: '88px',
      textAlign: 'center', borderRadius: '26px', font: "700 38px 'Mono'", letterSpacing: '0.06em' } }, content));

    // split-flap board
    const BX = 126, BY = 990;
    const board = h('div', { cls: 'abs', css: { left: px(BX - 18), top: px(BY - 18), width: px(7 * CW + 6 * 12 + 36), height: px(CHT + 36), borderRadius: '30px',
      background: '#101013', border: '1.5px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' } }, content);
    const cells = Array.from({ length: 7 }, (_, i) => flapCell(content, BX + i * (CW + 12), BY));
    const R = K.rng(99);
    const seqs = cells.map(() => []);
    const CODE = '482913';
    for (let i = 0; i < 6; i++) {
      const base = 21.95 + i * 0.03;
      for (let j = 0; j < 4; j++) seqs[i].push([base + j * 0.06, String(Math.floor(R() * 10)), '#fff', 0.06]);
      seqs[i].push([base + 4 * 0.06, CODE[i], '#fff', 0.11]);
    }
    seqs[6].push([CHECK, '✓', '#3CD68C', 0.14]);
    const WORDS = [' HELLO ', ' SALAM ', 'MERHABA', 'ПРИВЕТ '];
    const LANGN = ['English', 'Azərbaycan', 'Türkçe', 'Русский'];
    WORDS.forEach((w, k) => {
      const T = LANG + k * WSTEP;
      for (let i = 0; i < 7; i++) {
        const c = w[i] === ' ' ? '' : w[i];
        const last = seqs[i].length ? seqs[i][seqs[i].length - 1][1] : '';
        if (c !== last) seqs[i].push([T + i * 0.012, c, '#fff', 0.11]);
      }
    });
    seqs.forEach((s) => s.forEach(([tt], j) => j % 2 === 0 && K.sfx('flap', tt, { v: 0.35 })));
    K.sfx('success', CHECK + 0.02, { v: 0.6 });

    const capA = h('div', { cls: 'abs', text: 'Role-based access for every department', css: { left: '0px', top: '1196px', width: '1080px', textAlign: 'center',
      font: "500 31px 'Inter'", color: 'rgba(255,255,255,0.62)' } }, content);
    const capB = LANGN.map((n) => h('div', { cls: 'abs', text: n, css: { left: '0px', top: '1190px', width: '1080px', textAlign: 'center', font: "700 42px 'Inter'", color: '#fff' } }, content));

    return (t) => {
      bg(t, T0);
      kickA.update(t, T0 + 0.04, LANG - 0.24);
      kickB.update(t, LANG + 0.02);
      head.update(t, T0 + 0.06);
      const lp = tw(t, LANG - 0.05, 0.25, E.out2);
      l1.style.opacity = (1 - 0.55 * lp).toFixed(3);
      l2.style.opacity = (0.3 + 0.7 * lp).toFixed(3);

      // shield in, check draws when the code lands; shield + orbit leave for the language part
      const sp = spr(t, T0 + 0.05, 2.4, 0.5), out = tw(t, LANG - 0.12, 0.26, E.in3);
      set(shieldWrap, { x: 540 - 125, y: 770 - 125, s: clamp(sp, 0, 1.2) * (1 - out * 0.6), o: clamp(sp * 3) * (1 - out) });
      ck.style.strokeDashoffset = (ckLen * (1 - tw(t, CHECK, 0.25, E.io2))).toFixed(3);
      set(glow, { o: (0.3 + 0.25 * Math.exp(-Math.max(0, t - CHECK) / 0.3) * (t >= CHECK)) * (1 - out * 0.6), s: 1 + 0.05 * Math.sin(t * 5) });
      chips.forEach((c, i) => {
        const a = (i / chips.length) * Math.PI * 2 + (t - T0) * 0.85 - 0.6;
        const depth = Math.sin(a), x = 540 + Math.cos(a) * 420, y = 770 + depth * 150;
        const inp = spr(t, T0 + 0.15 + i * 0.04, 2.6, 0.55);
        c.el.style.zIndex = depth > 0 ? 3 : 1;
        set(c.el, { x: x - c.w / 2, y: y - 29, s: lerp(0.78, 1.04, (depth + 1) / 2) * clamp(inp, 0, 1.2) * (1 - out * 0.5), o: lerp(0.45, 1, (depth + 1) / 2) * clamp(inp * 3) * (1 - out) });
      });

      // language chips
      const li = t < LANG ? -1 : Math.min(3, Math.floor((t - LANG + 0.02) / WSTEP));
      lchips.forEach((c, i) => {
        const p = spr(t, LANG + 0.02 + i * 0.05, 2.8, 0.5);
        const on = i === li;
        c.style.background = on ? C.orange : '#1E1E23';
        c.style.color = on ? '#fff' : 'rgba(255,255,255,0.55)';
        c.style.border = on ? `1.5px solid ${C.orange}` : '1.5px solid rgba(255,255,255,0.1)';
        set(c, { y: (1 - clamp(p)) * 40, s: clamp(p, 0, 1.2) * (on ? 1.08 : 1), o: t >= LANG ? clamp(p * 3) : 0 });
      });

      const bp = tw(t, T0 + 0.05, 0.45, E.swift);
      set(board, { y: (1 - bp) * 80, o: bp });
      cells.forEach((q, i) => { set(q.cell, { y: (1 - tw(t, T0 + 0.08 + i * 0.03, 0.45)) * 80, o: tw(t, T0 + 0.08 + i * 0.03, 0.3) }); flapUpdate(q, seqs[i], t); });
      const ok = Math.exp(-Math.max(0, t - CHECK) / 0.35) * (t >= CHECK && t < LANG);
      board.style.borderColor = ok > 0.02 ? `rgba(60,214,140,${(0.08 + 0.8 * ok).toFixed(3)})` : 'rgba(255,255,255,0.08)';

      set(capA, { o: tw(t, T0 + 0.3, 0.4) * (1 - tw(t, LANG - 0.1, 0.15)), y: (1 - tw(t, T0 + 0.3, 0.5)) * 20 });
      capB.forEach((c, i) => { const on = i === li; const a = on ? tw(t, LANG + i * WSTEP + 0.05, 0.18) : 0; set(c, { o: a, y: (1 - a) * 18 }); });
    };
  });
});
