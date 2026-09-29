// 4.0 – 6.0s  DROP: the seed explodes into the logo grid, wordmark, then a dive through the hollow square.
(function () {
  const { el, T, O, E, tw, kf, inv, lerp, clamp } = R;
  const C = R.C;
  const S = { name: 'logo', vs: 3.999, ve: 6.0, z: 30 };

  // logo geometry (measured from the supplied mark: gap = 0.5036u, r = 0.1786u, ring = 0.25u, ring r = 0.32u)
  const U = 150, G = U * 0.5036, P = U + G;
  const CX = 540, CY = 760;
  const HX = CX + P, HY = CY + P; // hollow square centre
  const HOLE = U * 0.5036, HOLE_R = U * 0.32 - U * 0.25;
  S.geom = { U, G, P, CX, CY, HX, HY };

  S.build = (root) => {
    const cam = (S.cam = el(root, 'abs', { width: '1080px', height: '1920px', transformOrigin: `${HX}px ${HY}px` }));

    // Cover with a rounded hole: everything outside the hole hides the next scene.
    const x0 = HX - HOLE / 2, y0 = HY - HOLE / 2, r = HOLE_R;
    const hole = `M${x0 + r},${y0} H${x0 + HOLE - r} A${r},${r} 0 0 1 ${x0 + HOLE},${y0 + r} V${y0 + HOLE - r} A${r},${r} 0 0 1 ${x0 + HOLE - r},${y0 + HOLE} H${x0 + r} A${r},${r} 0 0 1 ${x0},${y0 + HOLE - r} V${y0 + r} A${r},${r} 0 0 1 ${x0 + r},${y0} Z`;
    S.coverWrap = el(cam, 'abs', { width: '1080px', height: '1920px', overflow: 'visible' });
    S.coverWrap.innerHTML = `<svg width="1080" height="1920" style="position:absolute;left:0;top:0;overflow:visible">
      <defs><radialGradient id="lgGlow" cx="${CX}" cy="${CY + 80}" r="820" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#3a160b"/><stop offset="0.45" stop-color="#1a0e0a"/><stop offset="1" stop-color="#0B0908"/></radialGradient></defs>
      <path fill="url(#lgGlow)" fill-rule="evenodd" d="M-4000,-4000 H5080 V5920 H-4000 Z ${hole}"/></svg>`;

    // speed lines
    S.lines = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.2;
      const n = el(cam, 'abs', { left: CX + 'px', top: CY - 2 + 'px', width: '260px', height: '4px', borderRadius: '2px',
        background: i % 2 ? 'linear-gradient(90deg, rgba(254,77,30,0), #FE4D1E)' : 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.9))',
        transformOrigin: '0 2px' });
      S.lines.push({ n, a, len: 200 + (i % 3) * 90 });
    }
    // shockwave rings
    S.rings = [0, 1].map((i) => el(cam, 'abs', {
      left: CX - 110 + 'px', top: CY - 110 + 'px', width: '220px', height: '220px', borderRadius: '44px',
      border: i ? '3px solid rgba(255,255,255,.9)' : '10px solid #FE4D1E',
    }));
    // debris
    const rr = R.rng(42);
    S.debris = [];
    for (let i = 0; i < 42; i++) {
      const s = 6 + rr() * 26;
      const n = el(cam, 'abs', { left: CX - s / 2 + 'px', top: CY - s / 2 + 'px', width: s + 'px', height: s + 'px', borderRadius: s * 0.18 + 'px',
        background: i % 4 === 0 ? '#F7F3F0' : i % 4 === 1 ? '#FF9B78' : C.orange,
        boxShadow: i % 4 ? '0 0 16px rgba(254,77,30,.6)' : 'none' });
      const a = rr() * Math.PI * 2;
      S.debris.push({ n, a, v: 900 + rr() * 1900, rot: (rr() - 0.5) * 900, life: 0.45 + rr() * 0.6, hollow: rr() < 0.25 });
      if (S.debris[i].hollow) { n.style.background = 'transparent'; n.style.border = Math.max(2, s * 0.22) + 'px solid ' + C.orange; n.style.boxShadow = 'none'; }
    }

    // the nine squares
    S.sq = [];
    const rot = R.rng(9);
    for (let rI = 0; rI < 3; rI++) for (let cI = 0; cI < 3; cI++) {
      const hollow = rI === 2 && cI === 2;
      const n = el(cam, 'abs', {
        left: CX - U / 2 + 'px', top: CY - U / 2 + 'px', width: U + 'px', height: U + 'px',
        borderRadius: U * 0.1786 + 'px', background: hollow ? 'transparent' : C.orange,
        border: hollow ? `${U / 2}px solid ${C.orange}` : 'none',
      });
      const dist = Math.abs(rI - 1) + Math.abs(cI - 1);
      S.sq.push({ n, hollow, tx: (cI - 1) * P, ty: (rI - 1) * P, dist, r0: (rot() - 0.5) * 400, k: rI * 3 + cI });
    }
    S.bloom = el(cam, 'abs', { left: CX - 520 + 'px', top: CY - 520 + 'px', width: '1040px', height: '1040px', borderRadius: '50%',
      background: 'radial-gradient(closest-side, rgba(254,77,30,.55), rgba(254,77,30,.12) 50%, rgba(254,77,30,0))' });
    cam.insertBefore(S.bloom, S.lines[0].n);

    // wordmark
    S.word = el(cam, 'abs f-disp nowrap', { top: '1108px', left: '0', width: '1080px', textAlign: 'center', fontSize: '132px', fontWeight: '700', letterSpacing: '-0.025em', lineHeight: '1' });
    const wm = el(S.word, 'mask', { padding: '0.12em 0.05em 0.14em' }, null, 'span');
    S.chars = R.chars(wm, 'PSANow');
    S.chars.forEach((c, i) => { c.style.color = i >= 3 ? C.orange : C.text; });
    // tagline
    S.tag = el(cam, 'abs f-mono nowrap', { top: '1296px', left: '0', width: '1080px', textAlign: 'center', fontSize: R.t('29px', '25px'), fontWeight: '500', letterSpacing: R.t('0.22em', '0.16em'), color: '#C4BAB2' });
    S.tagText = el(S.tag, '', null, null, 'span');
    S.cursor = el(S.tag, '', { display: 'inline-block', width: '17px', height: '33px', background: C.orange, verticalAlign: '-5px', marginLeft: '4px', borderRadius: '3px' }, null, 'span');

    R.flash(4.0, '#FFE2D6', 0.55, 0.13);
    R.impact(4.0, 34, 7, 9);
    R.impact(4.34, 10, 12, 14);
  };

  const TAG = R.t('PROFESSIONAL SERVICES AUTOMATION', 'PEŞƏKAR XİDMƏTLƏRİN AVTOMATLAŞDIRILMASI');

  S.update = (t) => {
    const dt = t - 4.0;
    // squares
    for (const q of S.sq) {
      const d0 = q.dist * 0.035;
      const lt = dt - d0;
      const p = lt <= 0 ? 0 : R.spring(lt, 0.5, 14);
      const scale0 = q.k === 4 ? 0.5 : 0.15;
      let s = lt <= 0 ? (q.k === 4 ? 0.5 : 0) : lerp(scale0, 1, R.spring(lt, 0.45, 16));
      // idle breathing wave
      const br = 0.022 * Math.sin((t - 4.8) * 5.2 - q.dist * 0.9) * R.env(t, 4.7, 5.0, 5.3, 5.45);
      s *= 1 + br;
      T(q.n, { x: q.tx * p, y: q.ty * p, s, r: q.r0 * (1 - R.spring(lt, 0.6, 12)) });
      O(q.n, lt <= 0 && q.k !== 4 ? 0 : 1);
      if (q.hollow) {
        const pp = t < 4.34 ? 0 : R.spring(t - 4.34, 0.38, 22);
        const bw = lerp(U / 2, U * 0.25, pp);
        q.n.style.borderWidth = Math.max(U * 0.18, Math.min(U / 2, bw)).toFixed(2) + 'px';
        q.n.style.borderRadius = lerp(U * 0.1786, U * 0.32, clamp(pp)).toFixed(2) + 'px';
      }
    }
    // bloom
    O(S.bloom, dt < 0 ? 0 : lerp(1, 0.38, E.outCubic(clamp(dt / 0.9))));
    T(S.bloom, { s: lerp(0.4, 1.1, E.outCubic(clamp(dt / 0.6))) });
    // speed lines
    for (const L of S.lines) {
      const p = clamp(dt / 0.45);
      const start = lerp(40, 900, E.outCubic(p));
      T(L.n, { x: Math.cos(L.a) * start, y: Math.sin(L.a) * start, r: (L.a * 180) / Math.PI, sx: lerp(1.6, 0.2, p) * (L.len / 260) });
      O(L.n, dt < 0 ? 0 : (1 - p) * 0.95);
    }
    // rings
    S.rings.forEach((rg, i) => {
      const p = clamp((dt - i * 0.06) / 0.75);
      T(rg, { s: lerp(0.4, 9 + i * 2, E.outCubic(p)), r: lerp(0, 25 * (i ? -1 : 1), p) });
      O(rg, dt - i * 0.06 < 0 ? 0 : (1 - p) * (i ? 0.7 : 1));
    });
    // debris
    for (const d of S.debris) {
      const p = clamp(dt / d.life);
      const dist = (d.v * (1 - Math.exp(-dt * 4.5))) / 4.5;
      T(d.n, { x: Math.cos(d.a) * dist, y: Math.sin(d.a) * dist + 120 * dt * dt, r: d.rot * dt, s: 1 - 0.6 * p });
      O(d.n, dt < 0 ? 0 : 1 - E.inQuad(p));
    }
    // wordmark
    S.chars.forEach((c, i) => {
      const t0 = 4.36 + i * 0.045;
      const p = E.outExpo(inv(t0, t0 + 0.55, t));
      T(c, { y: (1 - p) * 170, r: (1 - p) * 10 });
    });
    // tagline typing
    const n = Math.floor(clamp(inv(4.78, 5.22, t)) * TAG.length);
    const txt = TAG.slice(0, n);
    if (S.tagText._v !== txt) { S.tagText.textContent = txt; S.tagText._v = txt; }
    const blink = t < 5.22 ? 1 : Math.floor((t - 5.22) / 0.12) % 2 === 0 ? 1 : 0.15;
    O(S.cursor, t < 4.74 ? 0 : blink);
    O(S.tag, 1);

    // dive through the hollow square
    const sc = kf(t, [[5.3, 1], [5.42, 0.93, E.outQuad], [5.97, 34, E.inExpo]]);
    T(S.cam, { s: sc, r: kf(t, [[5.42, 0], [5.97, 14, E.inCubic]]) });
    O(S.cam, 1 - inv(5.975, 6.0, t));
  };

  window.SCENES.push(S);
})();
