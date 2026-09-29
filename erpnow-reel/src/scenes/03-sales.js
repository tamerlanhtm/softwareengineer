/* 10.0 - 12.2s  SALES: Quotation -> (click, 3D flip) -> Sales order -> (click, stack push) -> Invoice. Done.
   The same order (Nova Trading, $4,484.00) flows through inventory, payments and the ledger later on. */
K.def(() => {
  const { h, set, tw, spr, kf, E, norm, lerp, clamp, px, C } = K;

  // Shared "orange stage" background used by orange scenes.
  K.orangeBg = (root) => {
    root.style.background = `radial-gradient(130% 90% at 20% 10%, #FF6A3E 0%, ${C.orange} 45%, #EE4312 100%)`;
    const ghosts = [];
    [[880, 1540, 760, 0.1], [140, 380, 420, 0.07]].forEach(([x, y, s, o]) => {
      const g = h('div', { cls: 'abs', css: { width: px(s), height: px(s), border: `${px(s * 0.09)} solid rgba(255,255,255,${o})`,
        borderRadius: px(s * K.LOGO.hr) } }, root);
      ghosts.push({ g, x, y, s });
    });
    return (t, t0) => ghosts.forEach((q, i) => set(q.g, { x: q.x - q.s / 2, y: q.y - q.s / 2 - (t - t0) * 30 * (i ? -1 : 1), r: (t - t0) * (i ? -6 : 8) }));
  };

  // Whip-pan push between two scenes: returns x offsets for outgoing / incoming roots.
  K.whip = (t, t0, d = 0.3, dir = -1) => { const p = E.io4(norm(t, t0, t0 + d)); return [dir * p * 1080, dir * (p - 1) * 1080]; };

  const ITEMS = [['Office chair', '8 × 250.00', '2,000.00'], ['Standing desk', '4 × 400.00', '1,600.00'], ['Desk lamp', '10 × 40.00', '400.00']];

  function makeDoc(parent, d) {
    const card = h('div', { cls: 'card onorange', css: { left: '0px', top: '0px', width: '912px', height: '780px' } }, parent);
    const els = [];
    const add = (el) => (els.push(el), el);
    // header
    const r1 = add(h('div', { cls: 'abs row', css: { left: '44px', top: '40px', width: '824px', gap: '16px' } }, card));
    K.pill(r1, d.type, { bg: 'rgba(254,77,30,0.1)', fg: C.orange, fs: 20 }).classList.add('chip-mono');
    h('div', { cls: 'mono', text: d.no, css: { font: "600 24px 'Mono'", color: C.muted, letterSpacing: '0.04em' } }, r1);
    h('div', { css: { flex: '1' } }, r1);
    const status = K.pill(r1, d.status, { bg: d.statusBg, fg: d.statusFg, icon: d.statusIcon, fs: 22 });
    // customer
    add(h('div', { cls: 'abs', text: 'Nova Trading LLC', css: { left: '44px', top: '112px', font: "700 40px 'Inter'", letterSpacing: '-0.02em', color: C.text } }, card));
    const sub = add(h('div', { cls: 'abs row', css: { left: '44px', top: '166px', font: "500 24px 'Inter'", color: C.muted, gap: '10px' } }, card));
    if (d.subIcon) sub.appendChild(window.icon(d.subIcon, 26, C.muted, 2.2));
    h('span', { text: d.sub }, sub);
    add(h('div', { cls: 'abs', css: { left: '44px', top: '220px', width: '824px', height: '2px', background: 'rgba(20,20,22,0.07)' } }, card));
    // items
    ITEMS.forEach(([name, qty, amt], i) => {
      const r = add(h('div', { cls: 'abs row', css: { left: '44px', top: px(240 + i * 58), width: '824px', height: '52px' } }, card));
      h('div', { text: name, css: { font: "600 28px 'Inter'", color: C.text, width: '300px' } }, r);
      h('div', { cls: 'mono', text: qty, css: { font: "500 22px 'Mono'", color: C.muted, letterSpacing: '0.02em', flex: '1' } }, r);
      h('div', { cls: 'tnum', text: amt, css: { font: "700 28px 'Inter'", color: C.text } }, r);
      if (d.shipped) { const ck = h('div', { css: { marginLeft: '14px', width: '34px', height: '34px', borderRadius: '17px', background: 'rgba(18,183,106,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' } }, r); ck.appendChild(window.icon('check', 22, C.green, 3)); }
    });
    add(h('div', { cls: 'abs', css: { left: '44px', top: '428px', width: '824px', height: '2px', background: 'rgba(20,20,22,0.07)' } }, card));
    // summary
    d.summary.forEach(([k, v], i) => {
      const r = add(h('div', { cls: 'abs row', css: { left: '44px', top: px(446 + i * 36), width: '824px', font: "500 24px 'Inter'", color: C.muted } }, card));
      h('div', { text: k, css: { flex: '1' } }, r); h('div', { cls: 'tnum', text: v }, r);
    });
    const tot = add(h('div', { cls: 'abs row', css: { left: '44px', top: '530px', width: '824px', alignItems: 'baseline' } }, card));
    h('div', { text: 'Total', css: { font: "600 28px 'Inter'", color: C.muted, flex: '1' } }, tot);
    h('div', { cls: 'display tnum', text: '$4,484.00', css: { fontSize: '60px', fontWeight: 800, color: C.text, letterSpacing: '-0.03em' } }, tot);
    // action
    const btn = add(h('div', { cls: 'abs btn', css: { left: '44px', top: '648px', width: '824px', background: d.btnBg, color: d.btnFg } }, card));
    if (d.btnIcon) btn.appendChild(window.icon(d.btnIcon, 34, d.btnFg, 2.6));
    h('span', { text: d.btn }, btn);
    if (d.btnArrow) btn.appendChild(window.icon('arrow', 34, d.btnFg, 2.6));
    return { card, els, btn, status };
  }

  K.scene('sales', 10.0, 12.2, (root) => {
    const bg = K.orangeBg(root);
    const content = h('div', { cls: 'fill' }, root);
    const kick = K.kicker(content, { label: 'SALES', active: [0], theme: 'orange' });

    // headline with per-word highlight
    const words = [['Quote.', 10.12], ['Order.', 10.74], ['Invoice.', 11.34], ['Done.', 11.72]];
    const head = K.headline(content, ['<span class="w">Quote.</span> <span class="w">Order.</span>', '<span class="w">Invoice.</span> <span class="w">Done.</span>'],
      { x: 84, y: 340, size: 112, color: '#fff', ls: '-0.045em' });
    const wordEls = [...head.el.querySelectorAll('.w')];

    const stage = h('div', { cls: 'abs', css: { left: '84px', top: '624px', width: '912px', height: '780px' } }, content);
    const Q = makeDoc(stage, { type: 'QUOTATION', no: 'Q-1042', status: 'Draft', statusBg: 'rgba(20,20,22,0.07)', statusFg: C.muted,
      sub: 'Valid until 15 Oct 2026', subIcon: 'calendar', summary: [['Discount 5%', '−200.00'], ['Tax 18%', '+684.00']],
      btn: 'Convert to sales order', btnArrow: true, btnBg: C.orange, btnFg: '#fff' });
    const S = makeDoc(stage, { type: 'SALES ORDER', no: 'SO-2207', status: 'Confirmed', statusBg: 'rgba(18,183,106,0.13)', statusFg: C.green, statusIcon: 'check',
      sub: 'Delivered · 22 units · stock updated', subIcon: 'truck', shipped: true, summary: [['Warehouse', 'Baku Central'], ['Stock out', '−22 units']],
      btn: 'Generate invoice', btnArrow: true, btnBg: C.text, btnFg: '#fff' });
    const I = makeDoc(stage, { type: 'INVOICE', no: 'INV-3318', status: 'Sent', statusBg: 'rgba(254,77,30,0.12)', statusFg: C.orange, statusIcon: 'arrow',
      sub: 'Due 29 Oct 2026 · Net 14', subIcon: 'calendar', summary: [['Subtotal', '3,800.00'], ['Tax 18%', '684.00']],
      btn: 'Invoice sent', btnIcon: 'check', btnBg: 'rgba(18,183,106,0.12)', btnFg: C.green });
    [Q, S, I].forEach((d) => { d.card.style.transformOrigin = '50% 50%'; });

    const badge = h('div', { cls: 'abs', css: { width: '132px', height: '132px', borderRadius: '66px', background: C.green, display: 'flex',
      alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,80,40,0.35)', border: '8px solid #fff', zIndex: 40 } }, content);
    badge.appendChild(window.icon('check', 70, '#fff', 3.2));

    const cursor = K.cursor(content);
    const ripple = K.ripple(content, 'rgba(255,255,255,0.95)');
    const CLICK1 = 10.6, CLICK2 = 11.24;
    const BTN = [684, 624 + 648 + 46];

    const mbRoot = K.motionBlur('x'), mbCard = K.motionBlur('y');
    K.fast(10.62, 11.08); K.fast(11.3, 11.76); K.fast(11.86, 12.26);
    K.sfx('whoosh', 11.88, { v: 0.9 });
    K.sfx('click', CLICK1); K.sfx('flip', CLICK1 + 0.12, { v: 0.9 });
    K.sfx('click', CLICK2); K.sfx('swoosh', CLICK2 + 0.08, { v: 0.6, dur: 0.3 });
    K.sfx('success', 11.72);
    words.forEach(([, tt], i) => i && K.sfx('tick', tt, { v: 0.5, hi: 1 }));

    return (t) => {
      bg(t, 10);
      const [xo] = K.whip(t, 11.9, 0.3);
      set(root, { x: xo });
      mbRoot(root, K.sigma(K.vel((q) => K.whip(q, 11.9, 0.3)[0], t)));
      kick.update(t, 10.02);
      head.update(t, 10.04);
      wordEls.forEach((w, i) => { w.style.opacity = (0.36 + 0.64 * tw(t, words[i][1], 0.25, E.out2)).toFixed(3); });

      // card entrance
      const ce = tw(t, 10.0, 0.6, E.swift);
      set(stage, { y: (1 - ce) * 260, rx: 0, o: clamp(ce * 3) });
      stage.style.transform = `perspective(1800px) translateY(${((1 - ce) * 300).toFixed(2)}px) rotateX(${((1 - ce) * 24).toFixed(2)}deg)`;
      Q.els.forEach((el, i) => set(el, { y: (1 - tw(t, 10.08 + i * 0.022, 0.5)) * 30, o: tw(t, 10.08 + i * 0.022, 0.35) }));

      // flip Q -> S
      const f = norm(t, CLICK1 + 0.1, CLICK1 + 0.44);
      const fa = f < 0.5 ? 90 * E.in2(f * 2) : -90 * (1 - E.out3((f - 0.5) * 2));
      const fs = 1 - 0.08 * Math.sin(Math.PI * f);
      Q.card.style.transform = `perspective(2200px) rotateY(${f < 0.5 ? fa.toFixed(2) : 90}deg) scale(${fs.toFixed(4)})`;
      Q.card.style.visibility = f < 0.5 ? '' : 'hidden';
      // stack push S -> I
      const sp = tw(t, CLICK2 + 0.08, 0.4, E.snap);
      S.card.style.transform = `perspective(2200px) rotateY(${f >= 0.5 ? fa.toFixed(2) : -90}deg) translateY(${(-sp * 90).toFixed(2)}px) scale(${(fs * (1 - 0.1 * sp)).toFixed(4)})`;
      S.card.style.visibility = f >= 0.5 && sp < 0.999 ? '' : 'hidden';
      S.card.style.opacity = (1 - E.in2(sp)).toFixed(3);
      set(I.card, { y: (1 - sp) * 420, s: lerp(0.94, 1, sp), o: clamp(sp * 2.5) });
      mbCard(I.card, K.sigma(K.vel((q) => (1 - tw(q, CLICK2 + 0.08, 0.4, E.snap)) * 420, t)));
      I.card.style.zIndex = 5;

      // button press feedback
      const press = (tc) => { const d = t - tc; return d > -0.06 && d < 0.2 ? 1 - 0.04 * Math.sin(Math.PI * clamp((d + 0.06) / 0.26)) : 1; };
      set(Q.btn, { s: press(CLICK1) }); set(S.btn, { s: press(CLICK2) });

      // done badge
      const bp = spr(t, 11.7, 2.6, 0.45);
      set(badge, { x: 84 + 912 - 108, y: 624 - 42, s: clamp(bp, 0, 1.5), r: (1 - clamp(bp)) * -40, o: t >= 11.7 ? 1 : 0 });

      // cursor
      const cs = K.cursorState(t, [[10.15, 1180, 1750], [10.52, BTN[0], BTN[1]], [10.9, BTN[0] + 40, BTN[1] + 50], [11.18, BTN[0] - 30, BTN[1] + 4], [11.5, BTN[0] - 20, BTN[1] + 20], [11.9, 1200, 1800]], [CLICK1, CLICK2]);
      set(cursor, { x: cs.x - 12, y: cs.y - 6, s: cs.s, o: t > 10.12 && t < 11.9 ? 1 : 0 });
      ripple(t, t < CLICK2 - 0.05 ? CLICK1 : CLICK2, t < CLICK2 - 0.05 ? BTN[0] : BTN[0] - 30, BTN[1] + (t < CLICK2 - 0.05 ? 0 : 4));
    };
  });
});
