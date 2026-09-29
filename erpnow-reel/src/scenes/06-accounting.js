/* 15.8 - 18.15s  ACCOUNTING: the invoice auto-posts a balanced journal entry, statements update,
   the fiscal period closes & locks. Enters via rounded-square iris, exits with a vertical whip. */
K.def(() => {
  const { h, sv, set, tw, spr, kf, E, norm, lerp, clamp, px, C } = K;
  const IRIS = K.IRIS, END = 18.15, WHIP = 17.85;
  K.ACC_WHIP = WHIP;

  K.scene('accounting', IRIS[0], END, (root) => {
    const bg = K.darkBg(root, [540, 900]);
    const content = h('div', { cls: 'fill' }, root);
    const kick = K.kicker(content, { label: 'ACCOUNTING', active: [6], theme: 'dark' });
    const head = K.headline(content, ['Your ledger,', '<span class="o">on autopilot.</span>'], { x: 84, y: 340, size: 104, color: '#fff' });

    // journal entry card
    const card = h('div', { cls: 'card dark', css: { left: '84px', top: '628px', width: '912px', height: '486px' } }, content);
    const hdr = h('div', { cls: 'abs row', css: { left: '40px', top: '36px', width: '832px', gap: '14px' } }, card);
    hdr.appendChild(window.icon('bolt', 32, C.orange, 2.4));
    h('div', { cls: 'mono', text: 'JOURNAL ENTRY', css: { font: "700 22px 'Mono'", color: 'rgba(255,255,255,0.86)', letterSpacing: '0.16em' } }, hdr);
    h('div', { cls: 'mono', text: 'JE-5521', css: { font: "500 22px 'Mono'", color: 'rgba(255,255,255,0.45)' } }, hdr);
    h('div', { css: { flex: '1' } }, hdr);
    K.pill(hdr, 'Auto-posted', { bg: 'rgba(254,77,30,0.16)', fg: C.orange2, fs: 21, h: 42 });
    const sub = h('div', { cls: 'abs', text: 'From invoice INV-3318 · Nova Trading LLC', css: { left: '40px', top: '94px', font: "500 24px 'Inter'", color: 'rgba(255,255,255,0.5)' } }, card);
    const colh = h('div', { cls: 'abs mono', css: { left: '40px', top: '152px', width: '832px', height: '24px', font: "700 18px 'Mono'", color: 'rgba(255,255,255,0.38)', letterSpacing: '0.16em' } }, card);
    h('div', { text: 'ACCOUNT', css: { position: 'absolute', left: '0px' } }, colh);
    h('div', { text: 'DEBIT', css: { position: 'absolute', right: '252px' } }, colh);
    h('div', { text: 'CREDIT', css: { position: 'absolute', right: '0px' } }, colh);
    const LINES = [['Accounts Receivable', 4484, 0], ['Sales Revenue', 0, 3800], ['Tax Payable', 0, 684]];
    const rows = LINES.map(([acc, dr, cr], i) => {
      const r = h('div', { cls: 'abs', css: { left: '40px', top: px(194 + i * 64), width: '832px', height: '52px' } }, card);
      h('div', { text: acc, css: { position: 'absolute', left: '0px', top: '6px', font: "600 29px 'Inter'", color: '#fff' } }, r);
      const d = h('div', { cls: 'tnum', css: { position: 'absolute', right: '252px', top: '6px', font: "700 29px 'Inter'", color: dr ? '#fff' : 'rgba(255,255,255,0.25)' } }, r);
      const c = h('div', { cls: 'tnum', css: { position: 'absolute', right: '0px', top: '6px', font: "700 29px 'Inter'", color: cr ? '#fff' : 'rgba(255,255,255,0.25)' } }, r);
      return { r, d, c, dr, cr };
    });
    const div = h('div', { cls: 'abs', css: { left: '40px', top: '392px', width: '832px', height: '2px', background: 'rgba(255,255,255,0.1)' } }, card);
    const tot = h('div', { cls: 'abs', css: { left: '40px', top: '412px', width: '832px', height: '52px' } }, card);
    h('div', { text: 'Total', css: { position: 'absolute', left: '0px', top: '6px', font: "700 29px 'Inter'", color: '#fff' } }, tot);
    const bal = K.pill(tot, 'Balanced', { bg: 'rgba(18,183,106,0.16)', fg: '#3CD68C', icon: 'check', fs: 21, h: 44 });
    Object.assign(bal.style, { position: 'absolute', left: '104px', top: '2px' });
    h('div', { cls: 'tnum', text: '4,484.00', css: { position: 'absolute', right: '252px', top: '6px', font: "800 29px 'Inter'", color: '#fff' } }, tot);
    h('div', { cls: 'tnum', text: '4,484.00', css: { position: 'absolute', right: '0px', top: '6px', font: "800 29px 'Inter'", color: '#fff' } }, tot);
    const cardEls = [hdr, sub, colh, div, tot];

    // statement tiles
    const tiles = ['Trial balance', 'Profit & loss', 'Balance sheet'].map((ti, i) => {
      const el = h('div', { cls: 'card dark', css: { left: px(84 + i * 312), top: '1140px', width: '288px', height: '196px', borderRadius: '32px' } }, content);
      h('div', { text: ti, css: { position: 'absolute', left: '28px', top: '26px', font: "700 26px 'Inter'", color: '#fff' } }, el);
      const art = sv('svg', { width: 232, height: 70, viewBox: '0 0 232 70' }, el);
      Object.assign(art.style, { position: 'absolute', left: '28px', top: '72px' });
      let draw = null;
      if (i === 0) {
        const c = h('div', { css: { position: 'absolute', left: '28px', top: '84px', width: '56px', height: '56px', borderRadius: '28px', background: 'rgba(18,183,106,0.16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' } }, el);
        c.appendChild(window.icon('check', 32, '#3CD68C', 3));
        h('div', { cls: 'tnum', text: 'Dr = Cr', css: { position: 'absolute', left: '100px', top: '96px', font: "700 26px 'Inter'", color: 'rgba(255,255,255,0.8)' } }, el);
      } else if (i === 1) {
        const p = sv('polyline', { points: '0,62 30,54 58,58 88,40 118,46 148,28 178,32 208,12 232,8', fill: 'none', stroke: C.orange, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, art);
        const len = p.getTotalLength(); p.style.strokeDasharray = `${len}`;
        draw = (k) => { p.style.strokeDashoffset = `${(len * (1 - k)).toFixed(2)}`; };
      } else {
        [[0, 70, 'rgba(255,255,255,0.85)'], [60, 42, C.orange], [60, 28, 'rgba(255,255,255,0.3)']].forEach(([x, hgt, col], k) =>
          sv('rect', { x: 20 + (k ? 90 : 0), y: k === 2 ? 0 : 70 - hgt - (k === 1 ? 0 : 0), width: 70, height: hgt, rx: 8, fill: col }, art));
      }
      const foot = h('div', { text: ['Balanced', '+18.2% margin', 'Assets = L + E'][i], css: { position: 'absolute', left: '28px', bottom: '22px', font: "600 20px 'Inter'",
        color: i === 1 ? '#3CD68C' : 'rgba(255,255,255,0.5)' } }, el);
      if (i === 0) foot.style.display = 'none';
      return { el, draw };
    });

    // period close pill
    const per = h('div', { cls: 'card dark row', css: { left: '84px', top: '1360px', width: '912px', height: '92px', borderRadius: '30px', padding: '0 28px', gap: '20px' } }, content);
    const lock = sv('svg', { width: 44, height: 44, viewBox: '0 0 24 24', fill: 'none', stroke: C.orange, 'stroke-width': 2.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, per);
    sv('rect', { x: 4.5, y: 10.5, width: 15, height: 11, rx: 3 }, lock);
    const shackle = sv('path', { d: 'M8 10.5V7.5a4 4 0 0 1 8 0v3' }, lock);
    h('div', { text: 'Fiscal period · Sep 2026', css: { font: "700 28px 'Inter'", color: '#fff', flex: '1' } }, per);
    const closed = K.pill(per, 'Closed & locked', { bg: 'rgba(254,77,30,0.16)', fg: C.orange2, fs: 22, h: 46 });

    const mbRoot = K.motionBlur('y');
    K.fast(WHIP - 0.03, WHIP + 0.35);
    K.sfx('success', 16.78, { v: 0.7 });
    [16.3, 16.42, 16.54].forEach((tt) => K.sfx('tick', tt, { v: 0.5 }));
    [16.95, 17.05, 17.15].forEach((tt, i) => K.sfx('pop', tt, { pitch: 1 + i * 0.12, v: 0.5 }));
    K.sfx('lock', 17.5);
    K.sfx('whoosh', WHIP - 0.02, { v: 0.9, up: 1 });

    return (t) => {
      bg(t, IRIS[0]);
      // iris in
      const ip = tw(t, IRIS[0], IRIS[1] - IRIS[0], E.in3);
      if (ip < 1) {
        const a = lerp(10, 1400, ip), cx = 712, cy = 958;
        root.style.clipPath = K.rrPath(cx - a, cy - a, 2 * a, 2 * a, a * 0.372);
      } else root.style.clipPath = 'none';
      // whip out (up)
      const wy = (q) => -E.io4(norm(q, WHIP, WHIP + 0.3)) * 1920;
      set(root, { y: wy(t) });
      mbRoot(root, K.sigma(K.vel(wy, t)));

      const zi = lerp(1.12, 1, tw(t, IRIS[0], 0.6, E.swift));
      content.style.transform = `scale(${zi.toFixed(4)})`;
      content.style.transformOrigin = '712px 958px';
      kick.update(t, 15.98);
      head.update(t, 16.0);
      const ce = tw(t, 16.0, 0.55, E.swift);
      set(card, { y: (1 - ce) * 120, o: clamp(ce * 2.5) });
      cardEls.forEach((el, i) => set(el, { o: i === 4 ? tw(t, 16.7, 0.3) : tw(t, 16.1 + i * 0.04, 0.35) }));
      set(tot, { o: tw(t, 16.66, 0.3), x: (1 - tw(t, 16.66, 0.4)) * -40 });
      rows.forEach((q, i) => {
        const a = tw(t, 16.28 + i * 0.12, 0.45, E.swift);
        set(q.r, { x: (1 - a) * -120, o: a });
        const k = tw(t, 16.3 + i * 0.12, 0.35, E.out3);
        q.d.textContent = q.dr ? K.money(q.dr * k).slice(1) : '—';
        q.c.textContent = q.cr ? K.money(q.cr * k).slice(1) : '—';
      });
      set(bal, { s: clamp(spr(t, 16.76, 3, 0.45), 0, 1.3), o: t >= 16.76 ? 1 : 0 });
      tiles.forEach((q, i) => {
        const p = spr(t, 16.93 + i * 0.1, 2.6, 0.55);
        set(q.el, { y: (1 - clamp(p)) * 60, s: lerp(0.8, 1, clamp(p, 0, 1.2)), o: clamp(p * 3) });
        if (q.draw) q.draw(tw(t, 17.02, 0.5, E.io2));
      });
      const pe = tw(t, 17.28, 0.5, E.swift);
      set(per, { y: (1 - pe) * 80, o: pe });
      const lk = E.outBack(norm(t, 17.44, 17.56));
      shackle.setAttribute('transform', `translate(0 ${(-(1 - lk) * 3.5).toFixed(3)})`);
      set(closed, { s: clamp(spr(t, 17.5, 3, 0.45), 0, 1.3), o: t >= 17.5 ? 1 : 0 });
    };
  });
});
