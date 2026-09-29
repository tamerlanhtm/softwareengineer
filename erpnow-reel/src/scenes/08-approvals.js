/* ~20.1 - 22.12s  PROCUREMENT + HR (add-ons): approve a purchase requisition (-> PO) and a leave request
   with one tap each. Exits through horizontal ink blinds. */
K.def(() => {
  const { h, set, tw, spr, kf, E, norm, lerp, clamp, px, C } = K;
  const T0 = K.DASH_END, BLINDS = 21.45, END = 21.75;
  K.SEC_T0 = END;

  // blinds layer: ink bars sweep in alternately from both sides and cover the frame
  K.layer('blinds', (root) => {
    const bars = Array.from({ length: 10 }, (_, i) => h('div', { cls: 'abs', css: { left: '0px', top: px(i * 192), width: '1080px', height: '193px', background: C.ink } }, root));
    const mb = K.motionBlur('x');
    const bx = (q, i) => (i % 2 ? 1 : -1) * (1 - E.io3(norm(q, BLINDS + i * 0.012, BLINDS + i * 0.012 + 0.18))) * 1100;
    return (t) => {
      const on = t >= BLINDS && t < END;
      root.style.display = on ? '' : 'none';
      if (!on) return;
      bars.forEach((b, i) => set(b, { x: bx(t, i) }));
      mb(root, K.sigma(K.vel((q) => bx(q, 4), t)));
    };
  }, 610);
  K.fast(BLINDS - 0.02, END + 0.02);
  K.sfx('blinds', BLINDS);

  function makeReq(parent, o) {
    const card = h('div', { cls: 'card onorange', css: { left: '84px', top: px(o.y), width: '912px', height: '316px', borderRadius: '38px' } }, parent);
    const ib = h('div', { cls: 'abs', css: { left: '36px', top: '36px', width: '92px', height: '92px', borderRadius: '26px', background: 'rgba(254,77,30,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' } }, card);
    ib.appendChild(window.icon(o.icon, 48, C.orange, 2.2));
    h('div', { text: o.title, css: { position: 'absolute', left: '152px', top: '36px', font: "700 33px 'Inter'", color: C.text, letterSpacing: '-0.02em' } }, card);
    h('div', { cls: 'mono', text: o.code, css: { position: 'absolute', right: '36px', top: '44px', font: "600 22px 'Mono'", color: C.muted } }, card);
    h('div', { text: o.sub, css: { position: 'absolute', left: '152px', top: '84px', font: "500 25px 'Inter'", color: C.muted } }, card);
    h('div', { cls: 'display tnum', text: o.big, css: { position: 'absolute', left: '152px', top: '124px', fontSize: '46px', fontWeight: 800, color: C.text, letterSpacing: '-0.03em' } }, card);
    const dec = h('div', { cls: 'abs btn', text: 'Decline', css: { left: '36px', top: '204px', width: '300px', height: '80px', background: 'rgba(20,20,22,0.06)', color: C.muted } }, card);
    const app = h('div', { cls: 'abs btn', css: { left: '356px', top: '204px', width: '520px', height: '80px', background: C.orange, color: '#fff' } }, card);
    app.appendChild(window.icon('check', 32, '#fff', 2.8)); h('span', { text: 'Approve' }, app);
    const done = h('div', { cls: 'abs btn', css: { left: '36px', top: '204px', width: '840px', height: '80px', background: 'rgba(18,183,106,0.12)', color: C.green } }, card);
    done.appendChild(window.icon('check', 32, C.green, 3)); h('span', { text: o.done }, done);
    return { card, dec, app, done };
  }

  K.scene('approvals', T0, END, (root) => {
    const bg = K.orangeBg(root);
    const content = h('div', { cls: 'fill' }, root);
    const kick = K.kicker(content, { label: 'PROCUREMENT · HR', active: [2, 4], theme: 'orange' });
    const head = K.headline(content, ['Approvals.', `<span style="color:${C.text}">One tap.</span>`], { x: 84, y: 340, size: 112, color: '#fff' });
    const note = h('div', { cls: 'abs row', css: { left: '84px', top: '572px', gap: '12px', font: "600 26px 'Inter'", color: 'rgba(255,255,255,0.88)' } }, content);
    h('span', { cls: 'mono', text: 'ADD-ONS', css: { font: "700 18px 'Mono'", letterSpacing: '0.16em', padding: '6px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', color: '#fff' } }, note);
    h('span', { text: 'Requisitions → purchase orders · Leave requests' }, note);

    const A = makeReq(content, { y: 648, icon: 'procurement', title: 'Purchase requisition', code: 'PR-118', sub: 'Warehouse · 40 × Pallet wrap', big: '$620.00', done: 'Approved · PO-0907 created' });
    const B = makeReq(content, { y: 1000, icon: 'hr', title: 'Leave request', code: 'LR-042', sub: 'Leyla H. · Annual leave', big: '3 days · 12–14 Nov', done: 'Approved · Leyla notified' });
    const touch = h('div', { cls: 'abs', css: { width: '110px', height: '110px', borderRadius: '55px', background: 'rgba(255,255,255,0.35)',
      border: '4px solid rgba(255,255,255,0.95)', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', zIndex: 60 } }, content);
    const ripple = K.ripple(content, 'rgba(255,255,255,0.95)');
    const TAPS = [[20.6, 84 + 356 + 330, 648 + 244, A], [21.05, 84 + 356 + 300, 1000 + 244, B]];

    TAPS.forEach(([tt]) => { K.sfx('tap', tt); K.sfx('success', tt + 0.06, { v: 0.6 }); });
    const mbA = K.motionBlur('x'), mbB = K.motionBlur('x');
    K.fast(T0 + 0.1, T0 + 0.5);

    return (t) => {
      bg(t, T0);
      const A0 = T0 + 0.1; // ink tiles still clearing until ~A0
      kick.update(t, A0 + 0.04);
      head.update(t, A0 + 0.06);
      set(note, { y: (1 - tw(t, A0 + 0.25, 0.5)) * 20, o: tw(t, A0 + 0.25, 0.4) });
      [A, B].forEach((q, i) => {
        const cx = (tt) => (1 - spr(tt, A0 + 0.08 + i * 0.09, 2.3, 0.6)) * 1000;
        const p = 1 - cx(t) / 1000;
        set(q.card, { x: cx(t), r: (1 - clamp(p)) * 6 });
        (i ? mbB : mbA)(q.card, K.sigma(K.vel(cx, t)));
        const [tt] = TAPS[i];
        const k = tw(t, tt + 0.04, 0.3, E.snap);
        const press = t > tt - 0.05 && t < tt + 0.12 ? 0.95 : 1;
        set(q.app, { s: press * (1 - k * 0.1), o: 1 - k });
        set(q.dec, { o: 1 - k, x: -k * 40 });
        set(q.done, { s: lerp(0.92, 1, k), o: k });
      });
      // finger: A -> B
      const [t1, x1, y1] = TAPS[0], [t2, x2, y2] = TAPS[1];
      const fx = kf(t, [[t1 - 0.3, x1 + 180], [t1 - 0.02, x1, E.out3], [t1 + 0.2, x1 + 20, E.io2], [t2 - 0.04, x2, E.io3], [t2 + 0.3, x2 + 200, E.in2]]);
      const fy = kf(t, [[t1 - 0.3, y1 + 260], [t1 - 0.02, y1, E.out3], [t1 + 0.2, y1 + 30, E.io2], [t2 - 0.04, y2, E.io3], [t2 + 0.3, y2 + 300, E.in2]]);
      const near = (tt) => Math.abs(t - tt) < 0.09;
      set(touch, { x: fx - 55, y: fy - 55, s: near(t1) || near(t2) ? 0.82 : 1, o: t > t1 - 0.3 && t < t2 + 0.28 ? 1 : 0 });
      const last = t < t2 - 0.08 ? TAPS[0] : TAPS[1];
      ripple(t, last[0], last[1], last[2], 180);
    };
  });
});
