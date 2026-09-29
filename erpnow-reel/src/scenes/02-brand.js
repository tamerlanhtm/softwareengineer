/* 4.0 - 10.0s  BRAND: tile burst -> logo + wordmark -> tiles flip into the 8 module groups
   (the hollow tile becomes the 26-module counter) -> camera dives into the Sales tile. */
K.def(() => {
  const { h, set, tw, spr, kf, E, norm, lerp, clamp, px, C } = K;

  const GROUPS = [
    { key: 'sales', label: 'Sales', n: 3 },
    { key: 'inventory', label: 'Inventory', n: 2 },
    { key: 'procurement', label: 'Procurement', n: 2, addon: true },
    { key: 'finance', label: 'Finance', n: 6 },
    { key: 'hr', label: 'HR', n: 1, addon: true },
    { key: 'analytics', label: 'Analytics', n: 2 },
    { key: 'accounting', label: 'Accounting', n: 4 },
    { key: 'security', label: 'Security', n: 6 },
  ];
  const BASE = 260;                          // card base size (grid tile size)
  const LOGO = { cx: 540, cy: 745, size: 440 }; // logo layout (tile 110)
  const GRID = { x0: 120, y0: 650, pitch: 290 };
  const logoPos = (i) => { const [dx, dy] = K.logoOffset(i, LOGO.size); return [LOGO.cx + dx, LOGO.cy + dy]; };
  const gridPos = (i) => [GRID.x0 + BASE / 2 + (i % 3) * GRID.pitch, GRID.y0 + BASE / 2 + Math.floor(i / 3) * GRID.pitch];
  const TILE0 = 110;

  K.scene('brand', 4.0, 10.0, (root) => {
    root.style.background = `radial-gradient(120% 70% at 50% 40%, #FFFAF7 0%, ${C.cream} 55%, #FFEADF 100%)`;
    const cam = h('div', { cls: 'fill', css: { transformOrigin: '0 0' } }, root);

    // shockwave ring + confetti tiles
    const ring = h('div', { cls: 'abs', css: { width: '200px', height: '200px', borderRadius: '50%', border: `10px solid ${C.orange}` } }, cam);
    const R = K.rng(4);
    const confetti = Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2 + R() * 0.3, v = 1100 + R() * 1700, s = 12 + R() * 24;
      const col = [C.orange, C.orange, C.text, '#FFB59C'][i % 4];
      const el = h('div', { cls: 'abs', css: { width: px(s), height: px(s), borderRadius: px(s * 0.2), background: col } }, cam);
      return { el, a, v, s, spin: (R() - 0.5) * 900 };
    });

    // cards: front (plain logo tile) + face (module group) for 0..7, hollow for 8
    const cards = GROUPS.map((g, i) => {
      const front = h('div', { cls: 'abs', css: { width: px(BASE), height: px(BASE), borderRadius: px(BASE * K.LOGO.r), background: C.orange } }, cam);
      const face = h('div', { cls: 'abs', css: { width: px(BASE), height: px(BASE), borderRadius: px(BASE * K.LOGO.r), background: C.orange,
        color: '#fff', boxShadow: '0 24px 50px rgba(217,56,13,0.28)' } }, cam);
      const inner = h('div', { cls: 'fill' }, face);
      const ic = window.icon(g.key, 54, '#fff', 2.1); ic.style.position = 'absolute'; ic.style.left = '28px'; ic.style.top = '28px';
      inner.appendChild(ic);
      if (g.addon) h('div', { cls: 'abs mono', text: 'ADD-ON', css: { left: 'auto', right: '22px', top: '30px', height: '32px', lineHeight: '32px', padding: '0 12px',
        borderRadius: '16px', background: 'rgba(255,255,255,0.22)', font: "700 15px 'Mono'", letterSpacing: '0.14em' } }, inner);
      K.fit(h('div', { cls: 'abs', text: g.label, css: { left: '28px', top: 'auto', bottom: '62px', font: "700 35px 'Inter'", letterSpacing: '-0.02em', whiteSpace: 'nowrap' } }, inner), 204);
      h('div', { cls: 'abs', text: `${g.n} module${g.n > 1 ? 's' : ''}`, css: { left: '28px', top: 'auto', bottom: '28px', font: "500 23px 'Inter'", opacity: 0.82 } }, inner);
      const flash = h('div', { cls: 'fill', css: { background: '#fff', opacity: 0 } }, face);
      return { front, face, inner, flash };
    });
    const hollow = h('div', { cls: 'abs', css: { width: px(BASE), height: px(BASE), border: `solid ${C.orange}`, boxSizing: 'border-box' } }, cam);
    const counter = h('div', { cls: 'fill', css: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } }, hollow);
    const num = h('div', { cls: 'display tnum', text: '26', css: { fontSize: '118px', fontWeight: 900, color: C.orange, letterSpacing: '-0.05em', lineHeight: 0.9 } }, counter);
    h('div', { text: 'modules', css: { font: "700 27px 'Inter'", color: C.text, marginTop: '8px', letterSpacing: '-0.01em' } }, counter);

    // wordmark + lines
    const wm = h('div', { cls: 'abs display row', css: { left: '0px', top: '1030px', width: '1080px', justifyContent: 'center', fontSize: '176px',
      fontWeight: 900, letterSpacing: '-0.055em', color: C.text, lineHeight: 1 } }, cam);
    const wmWrap = h('div', { cls: 'line-wrap row' }, wm);
    const wmL = ['E', 'R', 'P', 'N', 'o', 'w'].map((ch, i) => h('span', { text: ch, css: { display: 'inline-block', color: i >= 3 ? C.orange : C.text } }, wmWrap));
    const by = h('div', { cls: 'abs mono', text: 'BY INEED.NOW', css: { left: '0px', top: '1232px', width: '1080px', textAlign: 'center',
      font: "700 26px 'Mono'", letterSpacing: '0.34em', color: C.muted } }, cam);
    const tag = K.headline(cam, ['The all-in-one ERP', 'for small business.'], { x: 90, y: 1308, w: 900, size: 58, weight: 700, align: 'center', color: C.text, lh: 1.08, ls: '-0.03em' });

    const kick = h('div', { cls: 'abs mono', text: 'ERPNOW · 8 GROUPS', css: { left: '120px', top: '288px', font: "700 25px 'Mono'", letterSpacing: '0.2em', color: C.orange } }, cam);
    const head = K.headline(cam, ['One system.', '<span class="o">Every department.</span>'], { x: 116, y: 340, w: 900, size: 104, color: C.text, ls: '-0.045em' });

    // cues
    K.sfx('drop', 4.0); K.shake(4.0, 18, 0.45); K.flash(4.0, '#fff', 0.5, 0.2);
    for (let i = 0; i < 9; i++) K.sfx('pluck', 4.02 + i * 0.035, { note: [0, 3, 5, 7, 10, 12, 15, 17, 19][i], root: 440, v: 0.55 });
    K.sfx('swoosh', 4.3, { v: 0.5 });
    K.sfx('swoosh', 6.28, { v: 0.8, dur: 0.6 });
    for (let d = 0; d < 5; d++) K.sfx('flip', 6.52 + d * 0.05, { v: 0.6 });
    for (let k = 0; k < 13; k++) K.sfx('tick', 7.35 + E.out3(k / 12) * 0.9, { v: 0.45, hi: 1 });
    for (let i = 0; i < 8; i++) K.sfx('pluck', 8.0 + i * 0.13, { note: [0, 2, 4, 7, 9, 7, 11, 12][i], root: 523.25, v: 0.7 });
    K.sfx('zoom', 9.42, { end: 10.0 });

    const flipStart = (i) => 6.4 + ((i % 3) + Math.floor(i / 3)) * 0.05;
    K.fast(3.98, 4.5); K.fast(6.28, 7.02); K.fast(9.3, 10.02);

    return (t) => {
      // ---- camera: slow push on the logo, anticipation pull-back, dive into the Sales tile
      const push = lerp(1, 1.03, E.io2(norm(t, 4.4, 6.3))) * lerp(1, 1 / 1.03, E.io3(norm(t, 6.2, 6.9)));
      const [zx, zy] = gridPos(0);
      const ls = kf(t, [[9.18, 0], [9.36, Math.log(0.955), E.io2], [10.0, Math.log(9.5), E.in2]]);
      const zs = Math.exp(ls) * push;
      const c = E.io2(norm(t, 9.36, 9.97));
      const tx = lerp(zx, 540, c), ty = lerp(zy, 960, c);
      const ox = t < 9.2 ? 540 - 540 * push : tx - zs * zx;
      const oy = t < 9.2 ? 900 - 900 * push : ty - zs * zy;
      cam.style.transform = `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px) scale(${zs.toFixed(4)})`;

      // ---- burst FX
      const rp = norm(t, 4.0, 4.7);
      set(ring, { x: 540 - 100, y: 960 - 100, s: lerp(0.3, 9, E.out3(rp)), o: rp > 0 && rp < 1 ? 0.5 * (1 - rp) : 0 });
      ring.style.borderWidth = px(lerp(14, 1, rp));
      for (const q of confetti) {
        const d = Math.max(0, t - 4.0), k = 3.2, dist = (q.v / k) * (1 - Math.exp(-k * d));
        const g = 380 * d * d; // gravity
        set(q.el, { x: 540 + Math.cos(q.a) * dist - q.s / 2, y: 960 + Math.sin(q.a) * dist + g - q.s / 2, r: q.spin * d,
          o: t < 4.0 ? 0 : 1 - norm(t, 4.5, 5.2), s: lerp(0.4, 1, tw(t, 4.0, 0.2)) });
      }

      // ---- tiles
      const waveT = 5.55;
      for (let i = 0; i < 9; i++) {
        const [lx, ly] = logoPos(i), [gx, gy] = gridPos(i);
        const b = spr(t, 4.0 + i * 0.03, 2.3, 0.52);
        const burstX = lerp(540, lx, b), burstY = lerp(960, ly, b);
        const mv = tw(t, 6.32 + ((i % 3) + Math.floor(i / 3)) * 0.035, 0.62, E.snap);
        const cx = lerp(burstX, gx, mv), cy = lerp(burstY, gy, mv);
        const wave = Math.sin(Math.PI * norm(t, waveT + ((i % 3) + Math.floor(i / 3)) * 0.06, waveT + ((i % 3) + Math.floor(i / 3)) * 0.06 + 0.3)) * 0.1;
        const size = lerp(TILE0, BASE, mv) * (1 + wave) * lerp(0.82, 1, clamp(b * 1.6));
        const rot = (1 - clamp(b)) * (i % 2 ? 70 : -70);
        const hl = i < 8 ? Math.exp(-Math.max(0, t - (8.0 + i * 0.13)) / 0.18) * (t >= 8.0 + i * 0.13) : 0;
        const k = (size / BASE) * (1 + 0.06 * hl);
        if (i < 8) {
          const a = 180 * E.io3(norm(t, flipStart(i), flipStart(i) + 0.5));
          const cd = cards[i];
          const tr = `translate(${(cx - BASE / 2).toFixed(2)}px, ${(cy - BASE / 2).toFixed(2)}px) perspective(1400px)`;
          cd.front.style.transform = `${tr} rotate(${rot.toFixed(2)}deg) rotateY(${a.toFixed(2)}deg) scale(${k.toFixed(4)})`;
          cd.face.style.transform = `${tr} rotateY(${(a - 180).toFixed(2)}deg) scale(${k.toFixed(4)})`;
          cd.front.style.visibility = a < 90 && t >= 4.0 ? '' : 'hidden';
          cd.face.style.visibility = a >= 90 ? '' : 'hidden';
          // sheen across the logo
          const band = lerp(-0.6, 1.6, norm(t, 5.15, 5.85)) * 1080 - (cx - size / 2);
          const bp = (band / size) * 100;
          cd.front.style.background = bp > -40 && bp < 140
            ? `linear-gradient(105deg, ${C.orange} ${(bp - 22).toFixed(1)}%, #FF9C7C ${bp.toFixed(1)}%, ${C.orange} ${(bp + 22).toFixed(1)}%)` : C.orange;
          cd.flash.style.opacity = (0.28 * hl).toFixed(3);
          cd.inner.style.opacity = (1 - norm(t, 9.45, 9.7)).toFixed(3);
        } else {
          const stroke = lerp(BASE * K.LOGO.stroke, 10, mv), rad = lerp(BASE * K.LOGO.hr, 54, mv);
          hollow.style.borderWidth = px(stroke);
          hollow.style.borderRadius = px(rad);
          hollow.style.transform = `translate(${(cx - BASE / 2).toFixed(2)}px, ${(cy - BASE / 2).toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${k.toFixed(4)})`;
          hollow.style.visibility = t >= 4.0 ? '' : 'hidden';
          const cp = tw(t, 7.3, 0.95, E.out3);
          num.textContent = String(Math.round(26 * cp));
          set(counter, { o: tw(t, 7.05, 0.3), s: lerp(0.7, 1, tw(t, 7.05, 0.5, E.outBack)) });
        }
      }

      // ---- wordmark + tagline (logo phase)
      wmL.forEach((el, i) => {
        const a = tw(t, 4.3 + i * 0.04, 0.7, E.swift), b = tw(t, 6.12 + i * 0.015, 0.3, E.in3);
        el.style.transform = `translateY(${((1 - a) * 105 + b * 105).toFixed(2)}%)`;
      });
      set(by, { y: lerp(20, 0, tw(t, 4.65, 0.6)) + tw(t, 6.12, 0.3, E.in3) * 40, o: tw(t, 4.65, 0.5) * (1 - tw(t, 6.12, 0.25)) });
      tag.update(t, 4.85, 6.16);

      // ---- groups headline
      set(kick, { x: lerp(-30, 0, tw(t, 6.75, 0.5)), o: tw(t, 6.75, 0.4) * (1 - norm(t, 9.4, 9.6)) });
      head.update(t, 6.8, 99);
      head.el.style.opacity = (1 - norm(t, 9.4, 9.6)).toFixed(3);
    };
  });
});
