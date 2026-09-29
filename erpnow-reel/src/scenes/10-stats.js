/* 24.0 - 26.0s  STATS SLAM: 26 modules / 4 languages / 1 system - odometer digits on the beat,
   a build-up, then everything implodes into a point that detonates the end card. */
K.def(() => {
  const { h, set, tw, spr, kf, E, norm, lerp, clamp, px, C } = K;
  const T0 = 24.0, END = 26.0;
  const FS = 330, NH = 292;

  K.scene('stats', T0, END, (root) => {
    const bg = K.orangeBg(root);
    const group = h('div', { cls: 'fill', css: { transformOrigin: '540px 900px' } }, root);
    const probe = h('span', { cls: 'display tnum', text: '0', css: { fontSize: px(FS), fontWeight: 900, position: 'absolute', visibility: 'hidden' } }, group);
    const DW = probe.offsetWidth * 0.94;
    probe.remove();

    const ROWS = [
      { y: 318, digits: [2, 6], label: 'modules', lc: '#fff', ts: 24.0 },
      { y: 690, digits: [4], label: 'languages', lc: '#fff', ts: 24.5 },
      { y: 1062, digits: [1], label: 'system.', lc: C.text, ts: 25.0 },
    ];
    const rows = ROWS.map((r) => {
      const row = h('div', { cls: 'abs row', css: { left: '76px', top: px(r.y), alignItems: 'flex-end', gap: '26px' } }, group);
      const num = h('div', { cls: 'row' }, row);
      const cols = r.digits.map((d) => {
        const col = h('div', { css: { position: 'relative', width: px(DW), height: px(NH), overflow: 'hidden' } }, num);
        const strip = h('div', { cls: 'display tnum', css: { position: 'absolute', left: '0px', top: '0px', width: px(DW), textAlign: 'center',
          fontSize: px(FS), fontWeight: 900, lineHeight: px(NH), color: '#fff', letterSpacing: '-0.04em' } }, col);
        strip.innerHTML = Array.from({ length: 30 }, (_, k) => `<div>${k % 10}</div>`).join('');
        return { strip, d };
      });
      const lw = h('div', { cls: 'line-wrap', css: { marginBottom: '14px' } }, row);
      const lab = h('div', { cls: 'line display', text: r.label, css: { fontSize: '112px', fontWeight: 800, color: r.lc, letterSpacing: '-0.045em', lineHeight: 1 } }, lw);
      K.sfx('slam', r.ts, { v: 1, big: 1 }); K.shake(r.ts + 0.06, 16, 0.35);
      for (let k = 0; k < 8; k++) K.sfx('tick', r.ts + 0.03 + E.out3(k / 7) * 0.4, { v: 0.35, hi: 1 });
      return { row, cols, lab, ...r };
    });
    K.flash(T0, '#fff', 0.45, 0.2);
    rows.forEach((r) => { r.mb = K.motionBlur('x'); K.fast(r.ts - 0.02, r.ts + 0.3); });
    K.fast(25.76, 26.02);
    K.sfx('riser', 25.0, { end: 26.0 });

    return (t) => {
      bg(t, T0);
      rows.forEach((r, i) => {
        const rx = (q) => (i % 2 ? 1 : -1) * (1 - E.outExpo(norm(q, r.ts, r.ts + 0.32))) * 820;
        const e = E.outExpo(norm(t, r.ts, r.ts + 0.32));
        set(r.row, { x: rx(t), skx: (i % 2 ? 1 : -1) * (1 - e) * -16, o: t >= r.ts ? 1 : 0 });
        r.mb(r.row, t >= r.ts ? K.sigma(K.vel(rx, t)) : 0);
        r.cols.forEach((c, j) => {
          const spins = 10 * (r.cols.length - j);
          const v = (c.d + spins) * E.out3(norm(t, r.ts, r.ts + 0.36 + j * 0.1));
          c.strip.style.transform = `translateY(${(-v * NH).toFixed(2)}px)`;
        });
        const a = tw(t, r.ts + 0.1, 0.5, E.swift);
        r.lab.style.transform = `translateY(${((1 - a) * 115).toFixed(2)}%)`;
        r.lab.style.visibility = a > 0.001 ? '' : 'hidden';
      });
      // build-up then implode
      const build = E.in2(norm(t, 25.1, 25.84));
      const imp = E.in3(norm(t, 25.8, 26.0));
      const jit = build * 5;
      group.style.transform = `translate(${(K.noise1(t * 30) * jit).toFixed(2)}px, ${(K.noise1(t * 33 + 9) * jit).toFixed(2)}px) scale(${((1 + 0.07 * build) * (1 - 0.94 * imp)).toFixed(4)}) rotate(${(imp * 14).toFixed(2)}deg)`;
      group.style.opacity = (1 - E.in2(norm(t, 25.9, 26.0))).toFixed(3);
      group.style.filter = imp > 0.05 ? `blur(${(imp * 10).toFixed(2)}px)` : '';
    };
  });
});
