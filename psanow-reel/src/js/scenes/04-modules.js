// 12.0 – 19.0s  MODULES: 45 tiles burst out and count up, 10 groups light up, then "45" rolls to "0 paid add-ons".
(function () {
  const { el, T, T3, O, E, tw, kf, inv, lerp, clamp } = R;
  const C = R.C;
  const S = { name: 'modules', vs: 11.95, ve: 19.1, z: 25 };

  const GROUPS = [
    ['Delivery', ['Cl', 'Ct', 'Rc', 'Pj', 'Tk', 'Ms', 'Pt', 'Ir', 'Nt']],
    ['People & Capacity', ['Pe', 'As', 'Rp', 'Ut', 'Lv', 'Dp']],
    ['Time & Expense', ['Ts', 'Ta', 'Ex']],
    ['Billing & Revenue', ['In', 'Py', 'Cn', 'Rt', 'Wp', 'Rv']],
    ['Financial Control', ['Bv', 'Pf', 'Fc', 'Lk']],
    ['Sales & Contracts', ['Op', 'Es', 'Cr']],
    ['Client Portal', ['Cp', 'Sr']],
    ['Accounting', ['Ca', 'Jr', 'Fs', 'Fp']],
    ['Reporting & Analytics', ['Db', 'Re']],
    ['Management & Security', ['Ur', 'Dc', 'An', 'Ev', 'Ap', 'St']],
  ];
  const TS = 52, TG = 7, ROW0 = 706, PITCH = 68, NAMEX = 92, TX = 450;
  const FLY0 = 12.07, FLYSTEP = 0.02, FLYDUR = 0.56;
  const HL0 = 14.25, HLSTEP = 0.25;
  const FLIP0 = 17.0;
  const EXIT = 18.86;

  S.build = (root) => {
    const cam = (S.cam = el(root, 'abs', { width: '1080px', height: '1920px' }));

    // header number + label
    S.numBox = el(cam, 'abs f-disp', { top: '236px', left: '0', width: '1080px', height: '270px', overflow: 'hidden', textAlign: 'center', fontSize: '250px', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '270px', color: C.orange });
    S.num = el(S.numBox, 'abs', { left: '0', top: '0', width: '1080px', textShadow: '0 0 60px rgba(254,77,30,.35)' });
    S.zero = el(S.numBox, 'abs', { left: '0', top: '0', width: '1080px', textShadow: '0 0 60px rgba(254,77,30,.35)' }, '0');
    S.labBox = el(cam, 'abs f-head', { top: '498px', left: '0', width: '1080px', height: '110px', overflow: 'hidden', textAlign: 'center', fontSize: '84px', fontWeight: '800', letterSpacing: '-0.035em', lineHeight: '110px', color: C.text });
    S.lab1 = el(S.labBox, 'abs', { left: '0', top: '0', width: '1080px' }, 'modules');
    S.lab2 = el(S.labBox, 'abs', { left: '0', top: '0', width: '1080px' }, 'paid add-ons.');
    S.sub = el(cam, 'abs f-mono nowrap', { top: '622px', left: '0', width: '1080px', textAlign: 'center', fontSize: '25px', fontWeight: '500', letterSpacing: '0.16em', color: '#B3A99F' });

    // rows + tiles
    S.rows = [];
    S.tiles = [];
    let idx = 0;
    GROUPS.forEach(([name, mods], r) => {
      const y = ROW0 + r * PITCH;
      const bar = el(cam, 'abs', { left: NAMEX - 26 + 'px', top: y + 8 + 'px', width: '6px', height: TS - 16 + 'px', borderRadius: '3px', background: C.orange });
      const nm = el(cam, 'abs f-head nowrap', { left: NAMEX + 'px', top: y + 'px', height: TS + 'px', lineHeight: TS + 'px', fontSize: '27px', fontWeight: '700', letterSpacing: '-0.015em', color: '#CFC6BF' }, name);
      const cnt = el(cam, 'abs f-mono', { left: TX - 58 + 'px', top: y + 'px', width: '40px', height: TS + 'px', lineHeight: TS + 'px', textAlign: 'right', fontSize: '18px', color: '#6f655e' }, String(mods.length));
      S.rows.push({ nm, bar, cnt, r, first: idx, n: mods.length });
      mods.forEach((sym, c) => {
        const x = TX + c * (TS + TG);
        const tile = el(cam, 'abs', { left: x + 'px', top: y + 'px', width: TS + 'px', height: TS + 'px' });
        const front = el(tile, 'abs', { width: TS + 'px', height: TS + 'px', borderRadius: '12px', background: '#221C18', border: '1.5px solid rgba(255,255,255,.08)', display: 'grid', placeItems: 'center' });
        const sy = el(front, 'f-head', { fontSize: '23px', fontWeight: '800', letterSpacing: '-0.02em', color: '#F1EBE6' }, sym);
        el(front, 'abs f-mono', { left: '6px', top: '3px', fontSize: '10px', color: '#7a7069' }, String(idx + 1));
        const back = el(tile, 'abs', { width: TS + 'px', height: TS + 'px', borderRadius: '12px', background: C.orange, display: 'grid', placeItems: 'center', color: '#fff', boxShadow: '0 0 24px rgba(254,77,30,.45)' }, R.svgIcon('check', 30, 3.2));
        const rr = R.rng(idx * 13 + 5);
        S.tiles.push({ tile, front, back, sym: sy, r, c, i: idx, x, y, bend: (rr() - 0.5) * 520, rot: (rr() - 0.5) * 720 });
        idx++;
      });
    });

    // shockwave where the journey card collapsed
    S.shock = [0, 1].map((i) => el(cam, 'abs', { left: '430px', top: '850px', width: '220px', height: '220px', borderRadius: '46px', border: i ? '3px solid rgba(255,255,255,.85)' : '9px solid #FE4D1E' }));
    S.core = el(cam, 'abs', { left: '240px', top: '660px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(254,77,30,.7), rgba(254,77,30,.15) 45%, rgba(254,77,30,0))' });
    // banner
    S.banner = el(cam, 'abs', { left: '120px', top: '972px', width: '840px', height: '150px', borderRadius: '36px', background: '#F7F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '26px', boxShadow: '0 40px 90px rgba(0,0,0,.55)' });
    el(S.banner, '', { width: '84px', height: '84px', borderRadius: '24px', background: C.orange, display: 'grid', placeItems: 'center', color: '#fff' }, R.svgIcon('check', 52, 3.4));
    el(S.banner, 'f-head nowrap', { fontSize: '62px', fontWeight: '800', letterSpacing: '-0.035em', color: C.ink }, 'Everything’s included.');

    R.impact(12.06, 18, 9, 11);
    R.flash(12.06, '#FFD9CC', 0.2, 0.1);
    R.impact(FLIP0, 16, 9, 11);
    R.impact(17.62, 14, 10, 13);
  };

  const flyPos = (tl, t) => {
    const t0 = FLY0 + tl.i * FLYSTEP;
    const p = clamp((t - t0) / FLYDUR);
    const e = E.outExpo(p);
    const sx = 540, sy = 960;
    const dx = tl.x + TS / 2 - sx, dy = tl.y + TS / 2 - sy;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const b = Math.sin(Math.PI * e) * tl.bend;
    return { started: t >= t0, p, x: sx + dx * e + nx * b - (tl.x + TS / 2), y: sy + dy * e + ny * b - (tl.y + TS / 2), s: lerp(0.55, 1, E.outBack(p)), r: tl.rot * (1 - E.outExpo(p)) };
  };

  S.update = (t) => {
    // whip exit
    const wy = -2300 * E.inExpo(inv(EXIT, EXIT + 0.2, t));
    const drift = tw(t, 12, 19, 1, 1.035, E.inOutQuad);
    T(S.cam, { y: wy, s: drift });
    S.cam.style.transformOrigin = '540px 1000px';

    // shockwave
    S.shock.forEach((rg, i) => {
      const p = clamp((t - 12.06 - i * 0.05) / 0.7);
      T(rg, { s: lerp(0.3, 8 + i * 2, E.outCubic(p)), r: lerp(0, i ? -30 : 30, p) });
      O(rg, t < 12.06 + i * 0.05 ? 0 : (1 - p) * (i ? 0.7 : 1));
    });
    const cp = clamp((t - 12.04) / 0.6);
    T(S.core, { s: lerp(0.3, 1.2, E.outCubic(cp)) });
    O(S.core, t < 12.04 ? 0 : 1 - E.inQuad(cp));

    // tiles
    let landed = 0;
    for (const tl of S.tiles) {
      const f = flyPos(tl, t);
      if (f.p >= 1) landed++;
      // row highlight
      const hr = HL0 + tl.r * HLSTEP + tl.c * 0.018;
      const hl = R.env(t, hr, hr + 0.08, hr + 0.22, hr + 0.45);
      // flip
      const ft = FLIP0 + (tl.r + tl.c) * 0.03;
      const fa = 180 * E.inOutCubic(inv(ft, ft + 0.34, t));
      const pop = t > ft + 0.34 ? 1 + 0.08 * (1 - R.spring(t - ft - 0.34, 0.4, 24)) : 1;
      const showBack = fa > 90;
      R.show(tl.front, !showBack);
      R.show(tl.back, showBack);
      const ang = showBack ? fa - 180 : fa;
      if (fa > 0 && fa < 180) T3(tl.tile, { p: 420, x: f.x, y: f.y, ry: ang, s: f.s });
      else T(tl.tile, { x: f.x, y: f.y, s: f.s * (showBack ? pop : 1 + hl * 0.08), r: f.r });
      O(tl.tile, f.started ? 1 : 0);
      tl.front.style.background = hl > 0.01 ? `rgba(254,77,30,${0.2 + 0.8 * hl})` : '#221C18';
      tl.front.style.borderColor = hl > 0.01 ? `rgba(255,160,130,${hl})` : 'rgba(255,255,255,.08)';
    }

    // counter
    const shown = t >= FLIP0 ? 45 : Math.max(1, landed);
    if (S.num._v !== shown) { S.num.textContent = String(shown); S.num._v = shown; }
    // bump on every landing (pure function of t)
    const lastLand = landed > 0 ? FLY0 + (landed - 1) * FLYSTEP + FLYDUR : -1;
    const tick = landed > 0 ? 1 - clamp((t - lastLand) / 0.12) : 0;
    const numIn = E.outExpo(inv(12.42, 12.8, t));
    const roll = E.inOutQuart(inv(FLIP0 - 0.05, FLIP0 + 0.32, t));
    T(S.num, { y: (1 - numIn) * 270 - roll * 270, s: 1 + tick * 0.04 * (t < 13.8 ? 1 : 0) });
    T(S.zero, { y: (1 - roll) * 270 });
    O(S.zero, roll > 0 ? 1 : 0);
    const lroll = E.inOutQuart(inv(FLIP0 + 0.02, FLIP0 + 0.36, t));
    T(S.lab1, { y: (1 - E.outExpo(inv(12.55, 12.95, t))) * 110 - lroll * 110 });
    T(S.lab2, { y: (1 - lroll) * 110 });
    O(S.lab2, lroll > 0 ? 1 : 0);
    // sub line
    const s1 = R.decode('10 GROUPS · ONE PLATFORM', inv(13.75, 14.15, t), 3, t);
    const s2 = R.decode('ALL 45 MODULES · ONE PRICE', inv(FLIP0 + 0.1, FLIP0 + 0.5, t), 5, t);
    const st = t < FLIP0 ? s1 : s2;
    if (S.sub._v !== st) { S.sub.textContent = st; S.sub._v = st; }
    S.sub.style.color = t < FLIP0 ? '#B3A99F' : '#FF9B78';

    // rows
    for (const rw of S.rows) {
      const tl0 = FLY0 + rw.first * FLYSTEP + FLYDUR * 0.5;
      const p = E.outExpo(inv(tl0, tl0 + 0.45, t));
      const hr = HL0 + rw.r * HLSTEP;
      const hl = R.env(t, hr, hr + 0.08, hr + 0.3, hr + 0.55);
      T(rw.nm, { x: (1 - p) * -60 + hl * 10 });
      O(rw.nm, p);
      rw.nm.style.color = hl > 0.01 ? `rgb(${lerp(207, 255, hl)},${lerp(198, 255, hl)},${lerp(191, 255, hl)})` : '#CFC6BF';
      O(rw.cnt, p * 0.9);
      T(rw.bar, { sy: hl });
      O(rw.bar, hl);
    }

    // banner
    const bt = t - 17.55;
    if (bt < 0) O(S.banner, 0);
    else {
      const p = clamp(bt / 0.16);
      O(S.banner, clamp(bt / 0.05));
      T(S.banner, { s: bt < 0.16 ? lerp(1.9, 0.97, E.inQuad(p)) : 0.97 + 0.03 * R.spring(bt - 0.16, 0.35, 26), r: lerp(-7, -2.5, E.outCubic(p)) });
    }
  };

  window.SCENES.push(S);
})();
