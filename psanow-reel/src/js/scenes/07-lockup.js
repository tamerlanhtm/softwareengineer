// 24.0 – 30.0s  "Now." slam, white flood, logo lockup + call to action.
(function () {
  const { el, T, O, E, tw, kf, inv, lerp, clamp } = R;
  const C = R.C;
  const S = { name: 'lockup', vs: 23.98, ve: 30.1, z: 40 };

  const U = 112, G = U * 0.5036, P = U + G;
  const LX = 540, LY = 588;
  const WORD_TOP = 866, WS = 120;
  const NOW_T = 24.0, FLOOD = 24.42, SHRINK = 24.86;
  const INK = '#141110';

  S.build = (root) => {
    const cam = (S.cam = el(root, 'abs', { width: '1080px', height: '1920px' }));

    // white flood
    S.flood = el(cam, 'abs', { left: '420px', top: '840px', width: '240px', height: '240px', borderRadius: '54px', background: '#FFFFFF' });
    S.white = el(cam, 'abs', { width: '1080px', height: '1920px', background: 'radial-gradient(120% 80% at 50% 40%, #FFFFFF 0%, #FFFFFF 55%, #FFF3EE 100%)' });
    S.grid = el(cam, 'abs', {
      width: '1080px', height: '1920px',
      backgroundImage: 'radial-gradient(rgba(20,17,16,.13) 1.7px, transparent 2px)', backgroundSize: '36px 36px', backgroundPosition: '18px 18px',
      WebkitMaskImage: 'radial-gradient(70% 55% at 50% 45%, transparent 35%, #000 90%)', maskImage: 'radial-gradient(70% 55% at 50% 45%, transparent 35%, #000 90%)',
    });
    S.warm = el(cam, 'abs', { left: LX - 450 + 'px', top: LY - 450 + 'px', width: '900px', height: '900px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(254,77,30,.13), rgba(254,77,30,0))' });

    // logo squares
    S.sq = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const hollow = r === 2 && c === 2;
      const n = el(cam, 'abs', {
        left: LX + (c - 1) * P - U / 2 + 'px', top: LY + (r - 1) * P - U / 2 + 'px', width: U + 'px', height: U + 'px',
        borderRadius: U * 0.1786 + 'px', background: hollow ? 'transparent' : C.orange,
        border: hollow ? `${U / 2}px solid ${C.orange}` : 'none', transformOrigin: '50% 100%',
      });
      S.sq.push({ n, r, c, k: r * 3 + c, hollow });
    }
    S.ring = el(cam, 'abs', { left: LX + P - U / 2 + 'px', top: LY + P - U / 2 + 'px', width: U + 'px', height: U + 'px', borderRadius: U * 0.32 + 'px', border: '6px solid ' + C.orange });

    // wordmark
    const wcss = { fontFamily: "'Unbounded Variable'", fontSize: WS + 'px', fontWeight: '700', letterSpacing: '-0.025em' };
    S.wPSA = R.measure('PSA', wcss);
    S.wNow = R.measure('Now', wcss);
    S.wDot = R.measure('.', wcss);
    const L = 540 - (S.wPSA + S.wNow) / 2;
    S.nowLeft = L + S.wPSA;
    S.psa = el(cam, 'abs f-disp nowrap', { left: L + 'px', top: WORD_TOP + 'px', fontSize: WS + 'px', fontWeight: '700', letterSpacing: '-0.025em', lineHeight: '1', color: INK });
    const pm = el(S.psa, 'mask', { padding: '0.12em 0.02em 0.16em' }, null, 'span');
    S.psaCh = R.chars(pm, 'PSA');
    S.now = el(cam, 'abs f-disp nowrap', { left: S.nowLeft + 'px', top: WORD_TOP + 'px', fontSize: WS + 'px', fontWeight: '700', letterSpacing: '-0.025em', lineHeight: '1', color: C.orange, transformOrigin: `${S.wNow / 2}px 60px` });
    S.nowCh = R.chars(S.now, 'Now');
    S.dot = el(S.now, '', { display: 'inline-block' }, '.', 'span');
    if (R.AZ) {
      // Azerbaijani cut slams "İndi." and morphs it into the wordmark's "Now".
      const wIndi = R.measure('İndi.', wcss);
      S.indi = el(S.now, 'abs', { left: (S.wNow + S.wDot) / 2 - wIndi / 2 + 'px', top: '0' }, 'İndi.');
    }

    // tagline
    S.tag = el(cam, 'abs f-mono nowrap', { top: '1016px', left: '0', width: '1080px', textAlign: 'center', fontSize: '26px', fontWeight: '500', letterSpacing: '0.2em', color: '#7A7069' });

    // CTA button
    S.btn = el(cam, 'abs', { left: '250px', top: '1112px', width: '580px', height: '118px', borderRadius: '59px', background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', boxShadow: '0 22px 50px rgba(254,77,30,.38), inset 0 2px 0 rgba(255,255,255,.3)', overflow: 'hidden' });
    S.btnTxt = el(S.btn, 'f-head nowrap', { fontSize: '52px', fontWeight: '800', letterSpacing: '-0.03em', color: '#fff' }, R.t('Book a demo', 'Demo sifariş et'));
    S.btnArrow = el(S.btn, '', { color: '#fff' }, R.svgIcon('arrow-right', 50, 3));
    S.shine = el(S.btn, 'abs', { left: '0', top: '-40px', width: '120px', height: '200px', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.45), rgba(255,255,255,0))' });
    S.ripple = el(cam, 'abs', { left: '0', top: '0', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,.55)' });
    S.btnWrap = S.btn;

    // website + handle
    S.site = el(cam, 'abs f-head nowrap', { top: '1262px', left: '0', width: '1080px', textAlign: 'center', fontSize: '68px', fontWeight: '800', letterSpacing: '-0.035em', lineHeight: '1', color: INK });
    const sm = el(S.site, 'mask', null, null, 'span');
    S.siteIn = el(sm, 'mask-in', null, 'www.<span style="color:#FE4D1E">ineed</span>.now', 'span');
    S.handle = el(cam, 'abs f-mono nowrap', { top: '1372px', left: '0', width: '1080px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', fontSize: '32px', fontWeight: '500', color: '#6B625B', letterSpacing: '0.02em' },
      R.svgIcon('instagram', 38, 2, '#6B625B') + '<span>@ineednow_</span><span style="color:#B7ACA4">·</span><span>' + R.t('DM us', 'Bizə yazın') + '</span>');

    // confetti from the click
    S.bits = [];
    const rr = R.rng(99);
    for (let i = 0; i < 16; i++) {
      const s = 10 + rr() * 16;
      const n = el(cam, 'abs', { left: '0', top: '0', width: s + 'px', height: s + 'px', borderRadius: s * 0.2 + 'px', background: i % 3 ? C.orange : INK });
      if (i % 5 === 0) { n.style.background = 'transparent'; n.style.border = Math.max(2.5, s * 0.25) + 'px solid ' + C.orange; }
      S.bits.push({ n, a: -Math.PI / 2 + (rr() - 0.5) * 2.6, v: 500 + rr() * 700, rot: (rr() - 0.5) * 800, s });
    }

    // cursor
    S.cur = el(cam, 'abs', { left: '0', top: '0', width: '64px', height: '64px' },
      `<svg width="64" height="64" viewBox="0 0 24 24" style="overflow:visible;filter:drop-shadow(0 6px 10px rgba(0,0,0,.28))"><path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" fill="#141110" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`);

    R.flash(NOW_T, '#FE4D1E', 0.55, 0.16);
    R.impact(NOW_T, 30, 7, 9);
    R.impact(27.3, 6, 14, 14);
  };

  const TAG = R.t('PROFESSIONAL SERVICES AUTOMATION', 'PEŞƏKAR XİDMƏTLƏRİN AVTOMATLAŞDIRILMASI');

  S.update = (t) => {
    // --- "Now." slam -> hold -> becomes the wordmark's "Now"
    const cxBig = 540 - (S.nowLeft + S.wNow / 2) + (S.wDot * 2.6) / 2 * 0;
    const cyBig = 960 - (WORD_TOP + 60);
    const sd = t - NOW_T;
    const slam = sd < 0 ? 0 : sd < 0.14 ? lerp(4.6, 2.55, E.inQuad(sd / 0.14)) : 2.55 + 0.1 * (1 - R.spring(sd - 0.14, 0.3, 26)) + 0.08 * inv(24.14, SHRINK, t);
    const sh = E.inOutQuart(inv(SHRINK, SHRINK + 0.42, t));
    T(S.now, { x: lerp(cxBig - (S.wDot * 2.6) / 2, 0, sh), y: lerp(cyBig, 0, sh), s: lerp(slam, 1, sh), r: sd < 0.14 ? lerp(-8, 0, sd / 0.14) : 0 });
    O(S.now, clamp(sd / 0.03));
    O(S.dot, 1 - inv(SHRINK, SHRINK + 0.14, t));
    if (S.indi) {
      const x = inv(SHRINK + 0.04, SHRINK + 0.24, t);
      O(S.indi, 1 - x);
      S.nowCh.forEach((c) => O(c, x));
      O(S.dot, 0);
    }
    S.now.style.textShadow = t < FLOOD + 0.3 ? `0 0 ${lerp(80, 0, inv(24.0, FLOOD + 0.3, t))}px rgba(254,77,30,.6)` : 'none';

    // --- flood
    const fp = E.inOutQuart(inv(FLOOD, FLOOD + 0.42, t));
    T(S.flood, { s: lerp(0.0001, 15, fp), r: lerp(45, 0, fp) });
    O(S.flood, t >= FLOOD ? 1 : 0);
    O(S.white, t >= FLOOD + 0.42 ? 1 : 0);
    O(S.grid, inv(24.9, 25.6, t) * 0.8);
    O(S.warm, inv(25.0, 25.8, t));
    T(S.grid, { y: -((t - 24.9) * 10) });

    // --- logo squares drop in
    for (const q of S.sq) {
      const t0 = 24.96 + q.k * 0.05;
      const fall = inv(t0, t0 + 0.3, t);
      const land = t - (t0 + 0.3);
      let y = -(1 - E.inQuad(fall)) * 900;
      let sx = 1, sy = 1;
      if (land > 0) {
        const b = 1 - R.spring(land, 0.32, 26);
        sy = 1 - 0.24 * b;
        sx = 1 + 0.18 * b;
      }
      const br = 0.03 * Math.sin((t - 25.9) * 4.2 - (q.r + q.c) * 0.8) * inv(25.9, 26.4, t);
      T(q.n, { y, sx: sx * (1 + br), sy: sy * (1 + br), r: (1 - E.outCubic(fall)) * (q.k % 2 ? 40 : -40) });
      O(q.n, t >= t0 ? 1 : 0);
      if (q.hollow) {
        const pp = t < 25.62 ? 0 : R.spring(t - 25.62, 0.38, 22);
        const bw = lerp(U / 2, U * 0.25, pp);
        q.n.style.borderWidth = Math.max(U * 0.18, Math.min(U / 2, bw)).toFixed(2) + 'px';
        q.n.style.borderRadius = lerp(U * 0.1786, U * 0.32, clamp(pp)).toFixed(2) + 'px';
      }
    }
    // pulse rings from the hollow square
    const rp = (t0) => clamp((t - t0) / 0.8);
    const ra = t >= 28.4 ? rp(28.4) : t >= 25.62 ? rp(25.62) : -1;
    if (ra >= 0 && ra < 1) { O(S.ring, (1 - ra) * 0.9); T(S.ring, { s: 1 + ra * 1.6 }); } else O(S.ring, 0);

    // --- wordmark PSA
    S.psaCh.forEach((c, i) => {
      const p = E.outExpo(inv(25.1 + i * 0.05, 25.6 + i * 0.05, t));
      T(c, { y: (1 - p) * 160 });
    });
    O(S.psa, t > 25.05 ? 1 : 0);

    // --- tagline
    const tg = R.decode(TAG, inv(25.45, 25.95, t), 11, t);
    if (S.tag._v !== tg) { S.tag.textContent = tg; S.tag._v = tg; }

    // --- button
    const bp = inv(25.92, 26.3, t);
    let press = 0;
    if (t > 27.28) press = t < 27.4 ? E.outQuad(inv(27.28, 27.36, t)) : 1 - R.spring(t - 27.4, 0.35, 28);
    T(S.btn, { s: E.back(1.9)(bp) * (1 - 0.06 * press) });
    O(S.btn, bp > 0 ? 1 : 0);
    T(S.btnTxt, { y: (1 - E.outExpo(inv(26.0, 26.4, t))) * 90 });
    const nudge = t > 26.5 ? Math.max(0, Math.sin((t - 26.5) * Math.PI * 2 / 1.0)) ** 3 * 12 : 0;
    T(S.btnArrow, { x: (1 - E.outExpo(inv(26.08, 26.45, t))) * -60 + nudge });
    O(S.btnArrow, inv(26.08, 26.2, t));
    const shp = inv(28.8, 29.35, t);
    T(S.shine, { x: lerp(-160, 640, E.inOutCubic(shp)), r: 18 });
    O(S.shine, shp > 0 && shp < 1 ? 1 : 0);

    // --- website + handle
    T(S.siteIn, { y: (1 - E.outExpo(inv(26.28, 26.75, t))) * 110 });
    const hp = E.outExpo(inv(26.45, 26.9, t));
    T(S.handle, { y: (1 - hp) * 30 });
    O(S.handle, hp);

    // --- cursor + click
    const cp = E.inOutCubic(inv(26.72, 27.22, t));
    const cx = lerp(1000, 690, cp) + Math.sin(cp * Math.PI) * -40;
    const cy = lerp(1720, 1166, cp);
    const away = E.inOutCubic(inv(27.7, 28.3, t));
    const cs = 1 - 0.14 * (t > 27.26 && t < 27.44 ? R.env(t, 27.26, 27.3, 27.36, 27.44) : 0);
    T(S.cur, { x: lerp(cx, 880, away) - 8, y: lerp(cy, 1480, away) - 8, s: cs });
    O(S.cur, inv(26.7, 26.8, t) * (1 - inv(28.2, 28.4, t)));
    const rip = inv(27.3, 27.85, t);
    T(S.ripple, { x: 690 - 20, y: 1166 - 20, s: lerp(0.2, 13, E.outCubic(rip)) });
    O(S.ripple, rip > 0 && rip < 1 ? 0.5 * (1 - rip) : 0);
    // confetti burst from the button
    const bt = t - 27.32;
    for (const b of S.bits) {
      if (bt < 0 || bt > 0.9) { O(b.n, 0); continue; }
      const d = (b.v * (1 - Math.exp(-bt * 5))) / 5;
      T(b.n, { x: 690 + Math.cos(b.a) * d - b.s / 2, y: 1166 + Math.sin(b.a) * d + 900 * bt * bt - b.s / 2, r: b.rot * bt });
      O(b.n, 1 - E.inQuad(bt / 0.9));
    }
  };

  window.SCENES.push(S);
})();
