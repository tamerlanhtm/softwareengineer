// 22.0 – 24.5s  CLOSING LINE: "Everything your firm needs." -> "Now."
(function () {
  const { el, T, O, E, tw, kf, inv, lerp, clamp } = R;
  const C = R.C;
  const S = { name: 'closing', vs: 21.95, ve: 24.9, z: 27 };
  const WORDS = [
    { txt: 'Everything', t: 22.0, y: 598 },
    { txt: 'your firm', t: 22.5, y: 760 },
    { txt: 'needs.', t: 23.0, y: 922 },
  ];
  S.NOW_T = 24.0;

  S.build = (root) => {
    const cam = (S.cam = el(root, 'abs', { width: '1080px', height: '1920px', transformOrigin: '540px 900px' }));
    S.words = WORDS.map((w, wi) => {
      const line = el(cam, 'abs f-head nowrap', { left: '80px', top: w.y + 'px', fontSize: '156px', fontWeight: '900', letterSpacing: '-0.05em', lineHeight: '1', color: C.text });
      const chars = R.chars(line, w.txt);
      const rr = R.rng(wi * 7 + 3);
      return { ...w, line, chars: chars.map((c) => ({ c, vx: (rr() - 0.35) * 2600, vy: (rr() - 0.5) * 2600, vr: (rr() - 0.5) * 900 })) };
    });
    S.under = el(cam, 'abs', { left: '84px', top: '1098px', width: '520px', height: '16px', borderRadius: '8px', background: C.orange, transformOrigin: 'left center' });
    R.impact(22.0, 9, 12, 12);
    R.impact(22.5, 9, 12, 12);
    R.impact(23.0, 11, 12, 12);
  };

  S.update = (t) => {
    const build = E.inQuad(inv(23.0, 23.95, t));
    const jitter = build * 3;
    T(S.cam, { s: 1 + build * 0.05 - 0.03 * E.inQuad(inv(23.86, 23.99, t)), x: R.noise(t * 30, 1) * jitter, y: R.noise(t * 30, 2) * jitter, r: -0.8 * (1 - build) });
    const blast = t - S.NOW_T; // everything blows apart when "Now." lands
    for (const w of S.words) {
      w.chars.forEach((ch, i) => {
        const t0 = w.t - 0.03 + i * 0.016;
        const p = E.outExpo(inv(t0, t0 + 0.5, t));
        if (blast > 0) {
          const d = (1 - Math.exp(-blast * 4)) / 4;
          T(ch.c, { x: ch.vx * 1.7 * d, y: ch.vy * 1.7 * d, r: ch.vr * d, s: 1 + blast * 7 });
          O(ch.c, 1 - clamp(blast / 0.2));
        } else {
          T(ch.c, { x: (1 - p) * 420, skx: (1 - p) * -18, s: lerp(1.15, 1, p) });
          O(ch.c, clamp(p * 2.5));
        }
      });
    }
    const up = E.outExpo(inv(23.25, 23.6, t));
    T(S.under, { sx: up });
    O(S.under, up > 0 ? 1 - clamp(blast / 0.1) : 0);
  };

  window.SCENES.push(S);
})();
