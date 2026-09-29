/* 17.85 - ~20.1s  ANALYTICS: the dashboard assembles - KPI tiles count up, the sales chart draws,
   the bell rings with 3 pending approvals. Exits through an ink tile wave from the bell. */
K.def(() => {
  const { h, sv, set, tw, spr, kf, E, norm, lerp, clamp, px, C } = K;
  const T0 = K.ACC_WHIP;
  const BELL = [60 + 960 - 150, 610 + 48];
  const SWAP = K.tileWave({ t0: 19.78, color: C.ink, ox: BELL[0], oy: BELL[1], spread: 0.14, grow: 0.16, shrink: 0.22 });
  K.DASH_END = SWAP;

  K.scene('dashboard', T0, SWAP, (root) => {
    const bg = K.creamBg(root);
    const content = h('div', { cls: 'fill' }, root);
    const kick = K.kicker(content, { label: 'ANALYTICS', active: [5], theme: 'light' });
    const head = K.headline(content, ['Your business.', '<span class="o">One dashboard.</span>'], { x: 84, y: 340, size: 104, color: C.text });

    const win = h('div', { cls: 'card white', css: { left: '60px', top: '610px', width: '960px', height: '800px', borderRadius: '44px' } }, content);
    // top bar
    const bar = h('div', { cls: 'abs row', css: { left: '32px', top: '0px', width: '896px', height: '96px', gap: '16px' } }, win);
    const lg = K.logoStatic(bar, 36, {}); lg.style.position = 'relative';
    h('div', { text: 'Dashboard', css: { font: "700 30px 'Inter'", color: C.text, letterSpacing: '-0.02em' } }, bar);
    h('div', { cls: 'mono', text: 'OCT 2026', css: { font: "600 19px 'Mono'", color: C.muted, marginLeft: '8px', letterSpacing: '0.12em' } }, bar);
    h('div', { css: { flex: '1' } }, bar);
    const bell = h('div', { css: { position: 'relative', width: '52px', height: '52px' } }, bar);
    const bellIc = window.icon('bell', 40, C.text, 2.2); Object.assign(bellIc.style, { position: 'absolute', left: '6px', top: '6px', transformOrigin: '50% 10%' }); bell.appendChild(bellIc);
    const badge = h('div', { text: '3', css: { position: 'absolute', right: '-6px', top: '-4px', width: '30px', height: '30px', borderRadius: '15px', background: C.orange,
      color: '#fff', font: "800 18px 'Inter'", display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff' } }, bell);
    h('div', { text: 'AK', css: { width: '52px', height: '52px', borderRadius: '26px', background: C.peach, color: C.orange, font: "800 20px 'Inter'",
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '10px' } }, bar);
    h('div', { cls: 'abs', css: { left: '0px', top: '96px', width: '960px', height: '2px', background: 'rgba(20,20,22,0.06)' } }, win);

    const KPI = [['Monthly collections', 84210, (v) => K.money(v, 0), '↑ 12.4% vs last month', C.green],
      ['Receivables', 23480, (v) => K.money(v, 0), '4 invoices overdue', C.red],
      ['Open orders', 37, (v) => K.int(v), '$61.2k in pipeline', C.muted],
      ['Low stock', 5, (v) => K.int(v) + ' items', 'Reorder suggested', C.orange]];
    const kpis = KPI.map(([lab, v, fmt, foot, fc], i) => {
      const el = h('div', { cls: 'abs', css: { left: px(32 + (i % 2) * 460), top: px(124 + Math.floor(i / 2) * 188), width: '436px', height: '168px',
        borderRadius: '28px', background: '#FAF6F3', border: '1.5px solid rgba(20,20,22,0.05)' } }, win);
      h('div', { text: lab, css: { position: 'absolute', left: '26px', top: '22px', font: "600 22px 'Inter'", color: C.muted } }, el);
      const val = h('div', { cls: 'display tnum', css: { position: 'absolute', left: '24px', top: '56px', fontSize: '58px', fontWeight: 800, color: C.text, letterSpacing: '-0.035em' } }, el);
      h('div', { text: foot, css: { position: 'absolute', left: '26px', top: '126px', font: "600 20px 'Inter'", color: fc } }, el);
      return { el, val, v, fmt };
    });

    // chart
    const panel = h('div', { cls: 'abs', css: { left: '32px', top: '504px', width: '896px', height: '264px', borderRadius: '28px', background: '#FAF6F3', border: '1.5px solid rgba(20,20,22,0.05)' } }, win);
    h('div', { text: 'Sales · last 12 months', css: { position: 'absolute', left: '26px', top: '22px', font: "700 24px 'Inter'", color: C.text } }, panel);
    const up = K.pill(panel, '+32%', { bg: 'rgba(18,183,106,0.12)', fg: C.green, fs: 20, h: 38, icon: 'up', iconSize: 20 });
    Object.assign(up.style, { position: 'absolute', right: '24px', top: '16px' });
    const CW = 836, CH = 160;
    const svg = sv('svg', { width: CW + 20, height: CH + 20, viewBox: `-10 -10 ${CW + 20} ${CH + 20}` }, panel);
    Object.assign(svg.style, { position: 'absolute', left: '20px', top: '80px', overflow: 'visible' });
    const defs = sv('defs', {}, svg);
    const gr = sv('linearGradient', { id: 'ga', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    sv('stop', { offset: '0%', 'stop-color': C.orange, 'stop-opacity': 0.28 }, gr);
    sv('stop', { offset: '100%', 'stop-color': C.orange, 'stop-opacity': 0 }, gr);
    [0, 0.5, 1].forEach((k) => sv('line', { x1: 0, x2: CW, y1: k * CH, y2: k * CH, stroke: 'rgba(20,20,22,0.08)', 'stroke-width': 2, 'stroke-dasharray': '6 8' }, svg));
    const DATA = [38, 42, 40, 47, 45, 52, 58, 55, 63, 68, 74, 84];
    const pts = DATA.map((v, i) => [(i * CW) / 11, CH - ((v - 32) / (88 - 32)) * CH]);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) { // Catmull-Rom -> cubic Bezier
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    const area = sv('path', { d: `${d} L${CW},${CH} L0,${CH} Z`, fill: 'url(#ga)' }, svg);
    const line = sv('path', { d, fill: 'none', stroke: C.orange, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
    const LEN = line.getTotalLength();
    line.style.strokeDasharray = `${LEN}`;
    const dot = sv('circle', { cx: pts[11][0], cy: pts[11][1], r: 11, fill: C.orange, stroke: '#fff', 'stroke-width': 5 }, svg);
    const tip = h('div', { cls: 'abs tnum', text: '$84.2k', css: { left: px(20 + pts[11][0] - 128), top: px(80 + pts[11][1] - 76), height: '50px', lineHeight: '50px', padding: '0 18px',
      borderRadius: '16px', background: C.text, color: '#fff', font: "700 24px 'Inter'", whiteSpace: 'nowrap' } }, panel);

    const mbRoot = K.motionBlur('y');
    K.fast(19.76, 20.5);
    [18.26, 18.33, 18.4, 18.47].forEach((tt, i) => K.sfx('pop', tt, { pitch: 1 + i * 0.1, v: 0.45 }));
    K.sfx('draw', 18.55, { end: 19.25 });
    K.sfx('pop', 19.28, { pitch: 1.5, v: 0.5 });
    K.sfx('notify', 19.42);

    return (t) => {
      bg(t, T0);
      const wy = (q) => (1 - E.io4(norm(q, T0, T0 + 0.3))) * 1920;
      set(root, { y: wy(t) });
      mbRoot(root, K.sigma(K.vel(wy, t)));
      kick.update(t, 18.05);
      head.update(t, 18.08);
      const we = tw(t, 18.08, 0.62, E.swift);
      win.style.transform = `perspective(2000px) translateY(${((1 - we) * 140).toFixed(2)}px) rotateX(${((1 - we) * 16).toFixed(2)}deg) scale(${lerp(0.94, 1, we).toFixed(4)})`;
      win.style.opacity = clamp(we * 3).toFixed(3);
      kpis.forEach((q, i) => {
        const p = spr(t, 18.24 + i * 0.07, 2.8, 0.55);
        set(q.el, { s: lerp(0.86, 1, clamp(p, 0, 1.1)), o: clamp(p * 3) });
        q.val.textContent = q.fmt(q.v * tw(t, 18.3 + i * 0.07, 0.75, E.out3));
      });
      set(panel, { y: (1 - tw(t, 18.4, 0.5)) * 40, o: tw(t, 18.4, 0.4) });
      const dp = tw(t, 18.55, 0.72, E.io2);
      line.style.strokeDashoffset = (LEN * (1 - dp)).toFixed(2);
      area.style.clipPath = `inset(0 ${((1 - dp) * 100).toFixed(2)}% 0 0)`;
      const dpop = spr(t, 19.26, 3, 0.45);
      dot.setAttribute('r', (11 * clamp(dpop, 0, 1.4)).toFixed(2));
      set(tip, { y: (1 - clamp(dpop)) * 16, s: clamp(dpop, 0, 1.2), o: t >= 19.26 ? 1 : 0 });
      const ring = t >= 19.42 ? Math.exp(-(t - 19.42) / 0.3) * Math.sin((t - 19.42) * 40) : 0;
      bellIc.style.transform = `rotate(${(ring * 22).toFixed(2)}deg)`;
      set(badge, { s: t < 19.42 ? 0 : clamp(spr(t, 19.42, 3.2, 0.4), 0, 1.4), o: t >= 19.42 ? 1 : 0 });
      const ex = tw(t, 19.78, 0.4, E.in2);
      content.style.transform = `scale(${(1 + 0.04 * ex).toFixed(4)})`;
      content.style.transformOrigin = `${BELL[0]}px ${BELL[1]}px`;
    };
  });
});
