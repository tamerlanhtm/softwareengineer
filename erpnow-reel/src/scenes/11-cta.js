/* 26.0 - 30.0s  END CARD: the logo detonates back together, "Everything your business needs. Now.",
   tap on "Request a demo", www.ineed.now + @ineednow_. Holds long enough to read. */
K.def(() => {
  const { h, set, tw, spr, kf, E, norm, lerp, clamp, px, C } = K;
  const T0 = 26.0, END = 30.01;
  const LOGO = { cx: 540, cy: 556, size: 330 };
  const BURST = [540, 900];

  K.scene('cta', T0, END, (root) => {
    const bg = K.darkBg(root, [540, 640]);
    const M = K.tileMatrix(root, { cols: 9, rows: 17, pitch: 124, size: 60, color: 'rgba(255,255,255,0.035)' });
    const glow = K.glow(root, { x: 540, y: 560, r: 640, o: 0.4 });
    const content = h('div', { cls: 'fill' }, root);

    const ring = h('div', { cls: 'abs', css: { width: '200px', height: '200px', borderRadius: '50%', border: `10px solid ${C.orange}` } }, content);
    const R = K.rng(8);
    const confetti = Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2 + R() * 0.25, v = 1200 + R() * 1800, s = 10 + R() * 22;
      return { el: h('div', { cls: 'abs', css: { width: px(s), height: px(s), borderRadius: px(s * 0.2), background: [C.orange, '#fff', C.orange2][i % 3] } }, content), a, v, s, spin: (R() - 0.5) * 900 };
    });
    const tiles = K.makeTiles(content);

    const wm = h('div', { cls: 'abs display row', css: { left: '0px', top: '790px', width: '1080px', justifyContent: 'center', fontSize: '166px', fontWeight: 900,
      letterSpacing: '-0.055em', color: '#fff', lineHeight: 1 } }, content);
    const wmWrap = h('div', { cls: 'line-wrap row' }, wm);
    const wmL = ['E', 'R', 'P', 'N', 'o', 'w'].map((ch, i) => h('span', { text: ch, css: { display: 'inline-block', color: i >= 3 ? C.orange : '#fff' } }, wmWrap));
    const tag = K.headline(content, ['Everything your business', 'needs. <span class="o">Now.</span>'], { x: 40, y: 988, w: 1000, size: 64, weight: 700, align: 'center', color: 'rgba(255,255,255,0.92)', lh: 1.1, ls: '-0.035em' });

    const btn = h('div', { cls: 'abs btn', css: { left: '190px', top: '1176px', width: '700px', height: '128px', borderRadius: '64px', background: C.orange, color: '#fff',
      font: "700 46px 'InterDisplay'", letterSpacing: '-0.02em', gap: '18px', boxShadow: '0 24px 60px rgba(254,77,30,0.45)', overflow: 'hidden' } }, content);
    h('span', { text: 'Request a demo' }, btn);
    btn.appendChild(window.icon('arrow', 46, '#fff', 2.8));
    const sheen = h('div', { cls: 'abs', css: { top: '-20px', width: '120px', height: '170px', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.45), rgba(255,255,255,0))' } }, btn);
    const halo = h('div', { cls: 'abs', css: { left: '190px', top: '1176px', width: '700px', height: '128px', borderRadius: '64px', border: `4px solid ${C.orange}` } }, content);
    const url = h('div', { cls: 'abs display', text: 'www.ineed.now', css: { left: '0px', top: '1338px', width: '1080px', textAlign: 'center', fontSize: '70px', fontWeight: 800, color: '#fff', letterSpacing: '-0.035em' } }, content);
    const handle = h('div', { cls: 'abs row', css: { left: '0px', top: '1432px', width: '1080px', justifyContent: 'center', gap: '14px', font: "700 32px 'Mono'", color: 'rgba(255,255,255,0.72)', letterSpacing: '0.06em' } }, content);
    h('span', { text: 'DM' , css: { padding: '4px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)', color: '#fff' } }, handle);
    h('span', { text: '@ineednow_' }, handle);

    const touch = h('div', { cls: 'abs', css: { width: '110px', height: '110px', borderRadius: '55px', background: 'rgba(255,255,255,0.3)', border: '4px solid rgba(255,255,255,0.95)', zIndex: 20 } }, content);
    const ripple = K.ripple(content, 'rgba(255,255,255,0.9)');
    const TAP = [28.0, 700, 1240];

    K.fast(T0 - 0.02, T0 + 0.5);
    K.sfx('drop', T0, { big: 1 }); K.shake(T0 + 0.02, 22, 0.5); K.flash(T0, '#fff', 0.55, 0.22);
    for (let i = 0; i < 9; i++) K.sfx('pluck', T0 + 0.02 + i * 0.03, { note: [0, 4, 7, 12, 16, 19, 24, 19, 24][i], root: 261.63, v: 0.55 });
    K.sfx('swoosh', 26.28, { v: 0.5 });
    K.sfx('pop', 27.02, { pitch: 0.8, v: 0.8 });
    K.sfx('tap', TAP[0]); K.sfx('success', TAP[0] + 0.05, { v: 0.8 });
    K.sfx('shimmer', 28.9);

    return (t) => {
      bg(t, T0);
      M.tiles.forEach((q, i) => {
        const d = Math.hypot(q.x + 30 - BURST[0], q.y + 30 - BURST[1]), tw0 = T0 + d / 2400;
        const b = t >= tw0 ? Math.exp(-(t - tw0) / 0.25) : 0;
        const tw1 = TAP[0] + Math.hypot(q.x + 30 - TAP[1], q.y + 30 - TAP[2]) / 2000;
        const b2 = t >= tw1 ? 0.5 * Math.exp(-(t - tw1) / 0.3) : 0;
        const bb = Math.max(b, b2);
        q.el.style.background = bb > 0.02 ? `rgba(254,77,30,${(0.05 + 0.6 * bb).toFixed(3)})` : 'rgba(255,255,255,0.035)';
        set(q.el, { x: q.x, y: q.y - (t - T0) * 18 });
      });
      set(glow, { o: 0.32 + 0.08 * Math.sin((t - T0) * 3.2) + 0.4 * Math.exp(-Math.max(0, t - T0) / 0.3), s: 1 + 0.04 * Math.sin((t - T0) * 2.4) });

      const rp = norm(t, T0, T0 + 0.7);
      set(ring, { x: BURST[0] - 100, y: BURST[1] - 100, s: lerp(0.3, 10, E.out3(rp)), o: rp > 0 && rp < 1 ? 0.55 * (1 - rp) : 0 });
      ring.style.borderWidth = px(lerp(16, 1, rp));
      for (const q of confetti) {
        const d = Math.max(0, t - T0), k = 3, dist = (q.v / k) * (1 - Math.exp(-k * d)), g = 420 * d * d;
        set(q.el, { x: BURST[0] + Math.cos(q.a) * dist - q.s / 2, y: BURST[1] + Math.sin(q.a) * dist + g - q.s / 2, r: q.spin * d, o: 1 - norm(t, T0 + 0.5, T0 + 1.3) });
      }
      const u = LOGO.size / 8;
      tiles.forEach((el, i) => {
        const [dx, dy] = K.logoOffset(i, LOGO.size);
        const b = spr(t, T0 + i * 0.03, 2.2, 0.5);
        const wave = Math.sin(Math.PI * norm(t, 28.7 + ((i % 3) + Math.floor(i / 3)) * 0.07, 29.0 + ((i % 3) + Math.floor(i / 3)) * 0.07)) * 0.08;
        const breathe = i === 8 ? 0.04 * Math.sin((t - T0) * 4) * tw(t, 27.0, 0.5) : 0;
        K.placeTile(el, lerp(BURST[0], LOGO.cx + dx, b), lerp(BURST[1], LOGO.cy + dy, b), 2 * u * lerp(0.6, 1, clamp(b)) * (1 + wave + breathe),
          { r: (1 - clamp(b)) * (i % 2 ? 90 : -90) });
      });
      wmL.forEach((el, i) => {
        const a = tw(t, 26.26 + i * 0.04, 0.7, E.swift);
        el.style.transform = `translateY(${((1 - a) * 105).toFixed(2)}%)`;
      });
      tag.update(t, 26.6);
      const bp = spr(t, 27.0, 2.4, 0.45);
      const press = Math.abs(t - TAP[0]) < 0.08 ? 0.96 : 1;
      set(btn, { s: clamp(bp, 0, 1.3) * press, o: t >= 27.0 ? 1 : 0 });
      const sw = ((t - 27.3) % 1.6) / 1.6;
      set(sheen, { x: lerp(-160, 760, E.io2(clamp(sw * 1.6))), r: 18, o: t > 27.3 ? 1 : 0 });
      const hp = ((t - 27.5) % 0.9) / 0.9;
      set(halo, { s: 1 + 0.18 * E.out2(hp), o: t > 27.5 ? 0.7 * (1 - hp) : 0 });
      halo.style.transform = `scale(${(1 + 0.1 * E.out2(hp)).toFixed(4)}, ${(1 + 0.3 * E.out2(hp)).toFixed(4)})`;
      set(url, { y: (1 - tw(t, 27.35, 0.6)) * 40, o: tw(t, 27.35, 0.5) });
      set(handle, { y: (1 - tw(t, 27.5, 0.6)) * 30, o: tw(t, 27.5, 0.5) });
      const fx = kf(t, [[27.7, 900], [27.97, TAP[1], E.out3], [28.3, TAP[1] + 60, E.io2], [28.6, 1150, E.in2]]);
      const fy = kf(t, [[27.7, 1500], [27.97, TAP[2], E.out3], [28.3, TAP[2] + 80, E.io2], [28.6, 1700, E.in2]]);
      set(touch, { x: fx - 55, y: fy - 55, s: Math.abs(t - TAP[0]) < 0.08 ? 0.82 : 1, o: t > 27.7 ? tw(t, 27.7, 0.12) * (1 - tw(t, 28.12, 0.2, E.in2)) : 0 });
      ripple(t, TAP[0], TAP[1], TAP[2], 200);
    };
  });
});
