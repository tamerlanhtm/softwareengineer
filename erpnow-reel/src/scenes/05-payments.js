/* 14.18 - 16.12s  FINANCE / PAYMENTS: INV-3318 goes Overdue -> Partial -> Paid (card + bank transfer),
   then the PAID stamp slams down. Exits through a rounded-square iris into Accounting. */
K.def(() => {
  const { h, set, tw, spr, kf, E, norm, lerp, clamp, px, C } = K;

  K.creamBg = (root) => {
    root.style.background = `radial-gradient(120% 70% at 50% 30%, #FFFAF7 0%, ${C.cream} 55%, #FFE9DE 100%)`;
    const tiles = [[930, 300, 200, 0.07], [120, 1560, 280, 0.06], [990, 1700, 120, 0.08]].map(([x, y, s, o]) =>
      ({ el: h('div', { cls: 'abs', css: { width: px(s), height: px(s), borderRadius: px(s * K.LOGO.r), background: `rgba(254,77,30,${o})` } }, root), x, y, s }));
    return (t, t0) => tiles.forEach((q, i) => set(q.el, { x: q.x - q.s / 2, y: q.y - q.s / 2 - (t - t0) * (20 + 12 * i), r: (t - t0) * (i % 2 ? -10 : 12) }));
  };

  const T0 = K.INV_END;               // revealed by the tile wave
  const IRIS = [15.8, 16.12];
  K.IRIS = IRIS;

  K.scene('payments', T0, IRIS[1], (root) => {
    const bg = K.creamBg(root);
    const content = h('div', { cls: 'fill' }, root);
    const kick = K.kicker(content, { label: 'FINANCE', active: [3], theme: 'light' });
    const head = K.headline(content, ['Get paid.', '<span class="o">Track every cent.</span>'], { x: 84, y: 340, size: 104, color: C.text });

    const card = h('div', { cls: 'card white', css: { left: '84px', top: '628px', width: '912px', height: '744px' } }, content);
    const els = [];
    const add = (el) => (els.push(el), el);
    const r1 = add(h('div', { cls: 'abs row', css: { left: '44px', top: '40px', width: '824px', gap: '16px' } }, card));
    K.pill(r1, 'INVOICE', { bg: 'rgba(254,77,30,0.1)', fg: C.orange, fs: 20 }).classList.add('chip-mono');
    h('div', { cls: 'mono', text: 'INV-3318', css: { font: "600 24px 'Mono'", color: C.muted, letterSpacing: '0.04em' } }, r1);
    const stWrap = h('div', { cls: 'abs', css: { left: 'auto', right: '44px', top: '40px', width: '220px', height: '46px' } }, card);
    const states = [['Overdue', 'rgba(240,68,56,0.12)', C.red, null], ['Partial', 'rgba(245,165,36,0.16)', '#B86E00', null], ['Paid', 'rgba(18,183,106,0.13)', C.green, 'check']]
      .map(([txt, b, f, ic]) => { const p = K.pill(stWrap, txt, { bg: b, fg: f, fs: 22, icon: ic, dot: ic ? null : f }); p.style.position = 'absolute'; p.style.right = '0px'; return p; });
    add(h('div', { cls: 'abs', text: 'Nova Trading LLC', css: { left: '44px', top: '112px', font: "700 40px 'Inter'", letterSpacing: '-0.02em', color: C.text } }, card));
    add(h('div', { cls: 'abs', text: 'Due 29 Oct 2026 · Net 14', css: { left: '44px', top: '166px', font: "500 24px 'Inter'", color: C.muted } }, card));
    add(h('div', { cls: 'abs', text: 'Amount due', css: { left: '44px', top: '236px', font: "600 26px 'Inter'", color: C.muted } }, card));
    const amt = add(h('div', { cls: 'abs display tnum', text: '$4,484.00', css: { left: '40px', top: '270px', fontSize: '112px', fontWeight: 800, color: C.text, letterSpacing: '-0.04em' } }, card));
    const track = add(h('div', { cls: 'abs', css: { left: '44px', top: '414px', width: '824px', height: '22px', borderRadius: '11px', background: 'rgba(20,20,22,0.07)', overflow: 'hidden' } }, card));
    const fill = h('div', { cls: 'abs', css: { height: '22px', borderRadius: '11px' } }, track);
    const pr = add(h('div', { cls: 'abs row', css: { left: '44px', top: '450px', width: '824px', font: "600 23px 'Inter'", color: C.muted } }, card));
    h('div', { text: 'Collected', css: { flex: '1' } }, pr);
    const pct = h('div', { cls: 'tnum', text: '0%' }, pr);
    const PAY = [['card', 'Card', '14 Oct · •••• 4821', '+$2,000.00'], ['bank', 'Bank transfer', '21 Oct · ref 88213', '+$2,484.00']];
    const rows = PAY.map(([ic, ti, sub, a], i) => {
      const r = h('div', { cls: 'abs row', css: { left: '44px', top: px(508 + i * 76), width: '824px', height: '64px', gap: '20px' } }, card);
      const b = h('div', { css: { width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(254,77,30,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' } }, r);
      b.appendChild(window.icon(ic, 32, C.orange, 2.3));
      const tt = h('div', { css: { flex: '1' } }, r);
      h('div', { text: ti, css: { font: "700 28px 'Inter'", color: C.text } }, tt);
      h('div', { text: sub, css: { font: "500 21px 'Inter'", color: C.muted, marginTop: '2px' } }, tt);
      h('div', { cls: 'tnum', text: a, css: { font: "800 30px 'Inter'", color: C.green } }, r);
      return r;
    });
    const meth = add(h('div', { cls: 'abs row', css: { left: '44px', top: '672px', gap: '12px' } }, card));
    h('div', { text: 'Accepts', css: { font: "600 22px 'Inter'", color: C.muted, marginRight: '6px' } }, meth);
    const chips = ['Cash', 'Card', 'Bank transfer'].map((m) => h('div', { text: m, css: { height: '44px', lineHeight: '40px', padding: '0 18px', borderRadius: '22px',
      border: '2px solid rgba(20,20,22,0.12)', font: "600 21px 'Inter'", color: C.text } }, meth));

    const stamp = h('div', { cls: 'abs', css: { width: '470px', height: '190px', border: `12px solid ${C.green}`, borderRadius: '30px',
      boxShadow: `inset 0 0 0 7px #fff, inset 0 0 0 12px ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30,
      background: 'rgba(255,255,255,0.72)' } }, content);
    h('div', { cls: 'display', text: 'PAID', css: { fontSize: '128px', fontWeight: 900, color: C.green, letterSpacing: '0.02em' } }, stamp);
    const STAMP = { x: 712, y: 628 + 330, r: -12 };
    const R = K.rng(21);
    const dust = Array.from({ length: 16 }, (_, i) => ({ el: h('div', { cls: 'abs', css: { width: '14px', height: '14px', borderRadius: '4px', background: i % 3 ? C.green : C.orange, zIndex: 29 } }, content),
      a: (i / 16) * Math.PI * 2, v: 500 + R() * 600 }));

    const P1 = 14.64, P2 = 15.02, ST = 15.36;
    K.fast(ST - 0.14, ST + 0.08); K.fast(IRIS[0] - 0.02, IRIS[1] + 0.02);
    K.sfx('coin', P1 + 0.02); K.sfx('coin', P2 + 0.02, { pitch: 1.25 });
    K.sfx('stamp', ST); K.shake(ST + 0.02, 16, 0.4);
    K.sfx('iris', IRIS[0], { end: IRIS[1] });

    return (t) => {
      bg(t, T0);
      const A = T0 + 0.12; // the tile wave is still clearing until ~A
      kick.update(t, A + 0.02);
      head.update(t, A + 0.04);
      const ce = tw(t, A, 0.6, E.swift);
      card.style.transform = `perspective(1800px) translateY(${((1 - ce) * 240).toFixed(2)}px) rotateX(${((1 - ce) * 20).toFixed(2)}deg)`;
      card.style.opacity = clamp(ce * 3).toFixed(3);
      els.forEach((el, i) => set(el, { y: (1 - tw(t, A + 0.08 + i * 0.03, 0.5)) * 24, o: tw(t, A + 0.08 + i * 0.03, 0.4) }));

      const a1 = tw(t, P1 + 0.02, 0.34, E.out3), a2 = tw(t, P2 + 0.02, 0.3, E.out3);
      const due = 4484 - 2000 * a1 - 2484 * a2;
      amt.textContent = K.money(due);
      const f = (4484 - due) / 4484;
      fill.style.width = px(824 * f);
      fill.style.background = f > 0.995 ? C.green : `linear-gradient(90deg, ${C.orangeDeep}, ${C.orange})`;
      pct.textContent = Math.round(f * 100) + '%';
      rows.forEach((r, i) => { const a = tw(t, (i ? P2 : P1) - 0.04, 0.45, E.swift); set(r, { x: (1 - a) * -140, o: a }); });
      const si = t < P1 + 0.16 ? 0 : t < P2 + 0.26 ? 1 : 2;
      states.forEach((p, i) => { const on = i === si; const tt = [0, P1 + 0.16, P2 + 0.26][i]; set(p, { s: on ? clamp(spr(t, tt, 3.2, 0.45), 0, 1.3) : 0, o: on ? 1 : 0 }); });
      chips.forEach((c, i) => { const hi = (i === 1 && t > P1) || (i === 2 && t > P2); c.style.borderColor = hi ? C.orange : 'rgba(20,20,22,0.12)'; c.style.color = hi ? C.orange : C.text; });

      // stamp slam
      const se = E.outExpo(norm(t, ST - 0.12, ST));
      set(stamp, { x: STAMP.x - 235, y: STAMP.y - 95, r: STAMP.r - (1 - se) * 10, s: t < ST - 0.12 ? 0 : lerp(2.6, 1, se), o: t < ST - 0.12 ? 0 : clamp(se * 2) });
      for (const d of dust) {
        const k = Math.max(0, t - ST), dist = (d.v / 5) * (1 - Math.exp(-5 * k));
        set(d.el, { x: STAMP.x + Math.cos(d.a) * (200 + dist) - 7, y: STAMP.y + Math.sin(d.a) * (80 + dist * 0.6) - 7, r: k * 400, o: t >= ST ? clamp(1 - k / 0.5) : 0, s: 1 - clamp(k / 0.6) * 0.5 });
      }
      // hold, then lean into the iris
      const ex = tw(t, IRIS[0], 0.32, E.in2);
      content.style.transform = `scale(${(1 + 0.05 * ex).toFixed(4)})`;
      content.style.transformOrigin = `${STAMP.x}px ${STAMP.y}px`;
    };
  });
});
