/* 11.9 - 14.18s  INVENTORY: live stock per warehouse, low-stock alert, movements (the SO-2207 shipment),
   a transfer that resolves the alert. Exits through an orange tile wave. */
K.def(() => {
  const { h, set, tw, spr, kf, E, norm, lerp, clamp, px, C } = K;

  // Shared dark stage background.
  K.darkBg = (root, glowAt = [540, 1000]) => {
    root.style.background = C.ink;
    const g1 = K.glow(root, { x: glowAt[0], y: glowAt[1], r: 900, o: 0.2 });
    const g2 = K.glow(root, { x: 980, y: 260, r: 520, o: 0.12 });
    const grid = h('div', { cls: 'fill', css: { opacity: 0.5,
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1.6px, transparent 1.8px)', backgroundSize: '48px 48px' } }, root);
    return (t, t0) => {
      set(g1, { o: 0.2 + 0.04 * Math.sin((t - t0) * 3), s: 1 + 0.03 * Math.sin((t - t0) * 2) });
      grid.style.backgroundPosition = `0px ${(-(t - t0) * 24).toFixed(2)}px`;
    };
  };

  const WAVE_T = 13.78;
  const SWAP = K.tileWave({ t0: WAVE_T, color: C.orange, ox: 0, oy: 1920, spread: 0.16, grow: 0.18, shrink: 0.24 });
  K.INV_END = SWAP;

  K.scene('inventory', 11.9, SWAP, (root) => {
    const bg = K.darkBg(root, [540, 1050]);
    const content = h('div', { cls: 'fill' }, root);
    const kick = K.kicker(content, { label: 'INVENTORY', active: [1], theme: 'dark' });
    const head = K.headline(content, ['Live stock.', '<span class="o">Every warehouse.</span>'], { x: 84, y: 340, size: 104, color: '#fff' });

    const card = h('div', { cls: 'card dark', css: { left: '84px', top: '628px', width: '912px', height: '764px' } }, content);
    const els = [];
    const add = (el) => (els.push(el), el);
    // product header
    const ph = add(h('div', { cls: 'abs row', css: { left: '40px', top: '38px', gap: '24px' } }, card));
    const thumb = h('div', { css: { width: '84px', height: '84px', borderRadius: px(84 * 0.24), background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, ph);
    thumb.appendChild(window.icon('box', 46, '#fff', 2.1));
    const pt = h('div', {}, ph);
    h('div', { text: 'Office chair · Ergo', css: { font: "700 36px 'Inter'", color: '#fff', letterSpacing: '-0.02em' } }, pt);
    h('div', { cls: 'mono', text: 'SKU OC-200 · REORDER AT 25', css: { font: "500 21px 'Mono'", color: 'rgba(255,255,255,0.5)', marginTop: '6px', letterSpacing: '0.08em' } }, pt);

    // warehouse bars
    const WH = [['Baku Central', 240, 200], ['Sumqayit', 96, 96], ['Ganja', 18, 58]];
    const MAX = 280, TRACK = 832;
    const bars = WH.map(([name, v0, v1], i) => {
      const r = add(h('div', { cls: 'abs', css: { left: '40px', top: px(168 + i * 112), width: px(TRACK), height: '96px' } }, card));
      h('div', { text: name, css: { position: 'absolute', left: '0px', top: '0px', font: "600 29px 'Inter'", color: '#fff' } }, r);
      const val = h('div', { cls: 'tnum', css: { position: 'absolute', right: '0px', top: '-2px', font: "700 32px 'Inter'", color: '#fff' } }, r);
      const track = h('div', { css: { position: 'absolute', left: '0px', top: '54px', width: px(TRACK), height: '18px', borderRadius: '9px', background: 'rgba(255,255,255,0.07)' } }, r);
      const fill = h('div', { css: { position: 'absolute', left: '0px', top: '0px', height: '18px', borderRadius: '9px',
        background: `linear-gradient(90deg, ${C.orangeDeep}, ${C.orange} 60%, ${C.orange2})` } }, track);
      h('div', { css: { position: 'absolute', left: px(TRACK * 25 / MAX), top: '-8px', width: '3px', height: '34px', borderRadius: '2px', background: 'rgba(255,255,255,0.35)' } }, track);
      return { r, val, fill, v0, v1 };
    });
    const low = h('div', { cls: 'pill', css: { position: 'absolute', left: '150px', top: '-6px', height: '42px', background: 'rgba(245,165,36,0.16)', color: C.amber, font: "700 19px 'Mono'", letterSpacing: '0.12em' } }, bars[2].r);
    const lowDot = h('span', { css: { width: '12px', height: '12px', borderRadius: '6px', background: C.amber } }, low);
    const lowTxt = h('span', { text: 'LOW STOCK' }, low);
    const ok = h('div', { cls: 'pill', css: { position: 'absolute', left: '150px', top: '-6px', height: '42px', background: 'rgba(18,183,106,0.16)', color: C.green, font: "700 19px 'Mono'", letterSpacing: '0.12em' } }, bars[2].r);
    ok.appendChild(window.icon('check', 22, C.green, 3)); h('span', { text: 'RESTOCKED' }, ok);

    // movements
    add(h('div', { cls: 'abs mono', text: 'STOCK MOVEMENTS', css: { left: '40px', top: '508px', font: "700 20px 'Mono'", color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em' } }, card));
    const MOV = [['down', C.green, '+120', 'Goods receipt · GR-0412', 'Supplier'], ['up', C.orange, '−8', 'Shipped · SO-2207', 'Nova Trading'], ['swap', '#8AB4FF', '40', 'Transfer Baku → Ganja', 'Internal']];
    const movs = MOV.map(([ic, col, q, txt, who], i) => {
      const r = h('div', { cls: 'abs row', css: { left: '40px', top: px(552 + i * 66), width: px(TRACK), height: '56px', gap: '18px' } }, card);
      const b = h('div', { css: { width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' } }, r);
      b.appendChild(window.icon(ic, 26, col, 2.6));
      h('div', { cls: 'tnum', text: q, css: { font: "800 28px 'Inter'", color: col, width: '72px' } }, r);
      h('div', { text: txt, css: { font: "500 26px 'Inter'", color: 'rgba(255,255,255,0.86)', flex: '1' } }, r);
      h('div', { text: who, css: { font: "500 22px 'Inter'", color: 'rgba(255,255,255,0.42)' } }, r);
      return r;
    });

    // transfer packet
    const packet = h('div', { cls: 'abs', css: { width: '26px', height: '26px', borderRadius: '6px', background: '#fff', boxShadow: `0 0 24px 6px ${C.orange}`, zIndex: 20 } }, content);

    K.sfx('pop', 12.95, { pitch: 1.4, v: 0.6 }); K.sfx('alert', 12.9);
    [13.1, 13.2, 13.3].forEach((tt) => K.sfx('tick', tt, { v: 0.45, hi: 1 }));
    K.sfx('swoosh', 13.3, { v: 0.5, dur: 0.35 }); K.sfx('success', 13.64, { v: 0.6 });

    const TP = [13.32, 13.62]; // transfer
    const mbRoot = K.motionBlur('x');
    K.fast(13.76, 14.55);
    return (t) => {
      bg(t, 11.9);
      const [, xi] = K.whip(t, 11.9, 0.3);
      set(root, { x: xi });
      mbRoot(root, K.sigma(K.vel((q) => K.whip(q, 11.9, 0.3)[1], t)));
      kick.update(t, 12.08);
      head.update(t, 12.1);
      const ce = tw(t, 12.02, 0.6, E.swift);
      card.style.transform = `perspective(1800px) translateY(${((1 - ce) * 220).toFixed(2)}px) rotateX(${((1 - ce) * 18).toFixed(2)}deg)`;
      card.style.opacity = clamp(ce * 3).toFixed(3);
      els.forEach((el, i) => set(el, { y: (1 - tw(t, 12.12 + i * 0.03, 0.5)) * 24, o: tw(t, 12.12 + i * 0.03, 0.4) }));

      const tr = tw(t, TP[1] - 0.04, 0.4, E.swift);
      bars.forEach((b, i) => {
        const g = tw(t, 12.3 + i * 0.09, 0.7, E.swift);
        const v = lerp(0, b.v0, g) + (b.v1 - b.v0) * tr;
        b.val.textContent = K.int(v);
        b.fill.style.width = px(Math.max(18, (TRACK * v) / MAX));
        if (i === 2) b.fill.style.background = tr > 0.5 ? `linear-gradient(90deg, ${C.orangeDeep}, ${C.orange} 60%, ${C.orange2})` : `linear-gradient(90deg, #C77700, ${C.amber})`;
      });
      const lp = spr(t, 12.9, 3, 0.5), pulse = 0.5 + 0.5 * Math.sin((t - 12.9) * 14);
      set(low, { s: clamp(lp, 0, 1.3) * (1 - tw(t, 13.62, 0.16, E.in3)), o: t >= 12.9 && t < 13.78 ? 1 : 0 });
      lowDot.style.opacity = (0.4 + 0.6 * pulse).toFixed(3);
      set(ok, { s: clamp(spr(t, 13.7, 3, 0.5), 0, 1.3), o: t >= 13.7 ? 1 : 0 });
      movs.forEach((r, i) => { const a = tw(t, 13.05 + i * 0.12, 0.45, E.swift); set(r, { x: (1 - a) * 160, o: a }); });

      // packet travels from Baku's bar end to Ganja's bar end along an arc
      const pp = norm(t, TP[0], TP[1]);
      const x0 = 84 + 40 + (TRACK * 240) / MAX, y0 = 628 + 168 + 63, x1 = 84 + 40 + (TRACK * 18) / MAX + 40, y1 = 628 + 168 + 224 + 63;
      const e = E.io3(pp), cx = 1040, cy = (y0 + y1) / 2;
      const bx = (1 - e) ** 2 * x0 + 2 * (1 - e) * e * cx + e * e * x1, by = (1 - e) ** 2 * y0 + 2 * (1 - e) * e * cy + e * e * y1;
      set(packet, { x: bx - 13, y: by - 13, r: e * 270, s: 1 + Math.sin(Math.PI * pp) * 0.5, o: pp > 0 && pp < 1 ? 1 : 0 });

      // exit: subtle push-in while the wave covers
      const ex = tw(t, WAVE_T, 0.4, E.in2);
      content.style.transform = `scale(${(1 + 0.04 * ex).toFixed(4)})`;
    };
  });
});
