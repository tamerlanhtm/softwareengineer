/* 0.0 - 4.0s  HOOK: "I NEED [slot reel]" -> "IT ALL." -> "NOW." -> the period becomes the logo tile. */
K.def(() => {
  const { h, set, tw, spr, kf, E, norm, lerp, clamp, px, C } = K;

  K.offsetIn = (el, anc) => {
    let x = 0, y = 0, n = el;
    while (n && n !== anc) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return [x, y];
  };

  K.scene('hook', 0, 4.0, (root) => {
    root.style.background = C.ink;

    // ---- background: glow + LED tile matrix ------------------------------------------
    const glow = K.glow(root, { x: 540, y: 960, r: 1000, o: 0.2 });
    const M = K.tileMatrix(root, { cols: 9, rows: 17, pitch: 124, size: 60, color: 'rgba(255,255,255,0.05)' });
    const R = K.rng(11);
    const sparks = M.tiles.map(() => []);
    for (let tb = 0.5; tb < 3.45; tb += 0.125) {
      const n = Math.round(lerp(1, 6, norm(tb, 0.5, 3.4)));
      for (let k = 0; k < n; k++) sparks[Math.floor(R() * M.tiles.length)].push(tb);
    }

    // ---- "I NEED" ---------------------------------------------------------------------
    const group = h('div', { cls: 'fill' }, root);
    const word = h('div', { cls: 'abs display row', css: { left: '0px', top: '590px', width: '1080px', justifyContent: 'center',
      fontSize: '220px', fontWeight: 900, color: '#fff', letterSpacing: '-0.055em', lineHeight: 1 } }, group);
    const HW = K.T('I NEED').split(' ');
    const L = [];
    HW.forEach((w, wi) => [...w].forEach((ch, ci) => {
      const el = document.createElement('span'); el.textContent = ch;
      Object.assign(el.style, { display: 'inline-block', marginRight: wi < HW.length - 1 && ci === w.length - 1 ? '0.2em' : '0px' });
      word.appendChild(el); el._w = wi; el._c = ci; L.push(el);
    }));
    const textW = L.reduce((a, el) => a + el.getBoundingClientRect().width + parseFloat(el.style.marginRight || 0) * 0, 0) + (HW.length - 1) * 0.2 * 220;
    if (textW > 940) word.style.fontSize = px(220 * 940 / textW);

    // ---- slot: the logo's hollow tile stretched into an input field --------------------
    const BOX = { cx: 540, cy: 1000, w: 960, h: 236, b: 10, r: 46 };
    const box = h('div', { cls: 'abs', css: { border: `solid ${C.orange}`, boxSizing: 'border-box' } }, group);
    const clip = h('div', { cls: 'abs', css: { overflow: 'hidden',
      webkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 24%, #000 76%, transparent 100%)' } }, group);
    const strip = h('div', { cls: 'abs', css: { width: '1080px' } }, clip);
    const WORDS = ['SALES', 'QUOTES', 'INVOICES', 'STOCK', 'PAYMENTS', 'SUPPLIERS', 'APPROVALS', 'REPORTS',
      'EXPENSES', 'LEDGERS', 'WAREHOUSES', 'CUSTOMERS', 'CONTRACTS', 'CALENDARS', 'DOCUMENTS', 'IT ALL.'];
    const S = BOX.h - 2 * BOX.b; // reel pitch = inner height
    const wordEls = WORDS.map((w, k) => {
      const el = h('div', { cls: 'abs display', text: w, css: { top: px(k * S), width: '1080px', height: px(S), lineHeight: px(S),
        textAlign: 'center', fontSize: '138px', fontWeight: 900, letterSpacing: '-0.045em',
        color: k === WORDS.length - 1 ? '#fff' : C.orange, whiteSpace: 'nowrap' } }, strip);
      return el;
    });
    wordEls.forEach((el) => { // fit every word inside the slot
      const span = h('span', { text: el.textContent }, null);
      el.textContent = ''; el.appendChild(span);
      const wd = span.offsetWidth;
      if (wd > 860) el.style.fontSize = px(138 * 860 / wd);
    });
    const LAST = WORDS.length - 1;

    // Reel position p(t): stepped ticks that accelerate, a blurred spin, then a landing bounce.
    const steps = [[1.0, 1], [1.25, 2], [1.5, 3], [1.75, 4], [2.0, 5], [2.125, 6], [2.25, 7], [2.375, 8]];
    const reel = (t) => {
      if (t < 1.0) return lerp(-0.7, 0, E.outBack(norm(t, 0.74, 0.95)));
      if (t < 2.5) {
        let p = 0;
        for (const [ts, k] of steps) if (t >= ts) p = k - 1 + E.outBackSoft(norm(t, ts, ts + 0.1));
        return p;
      }
      return kf(t, [[2.5, 8], [2.76, 12.3, E.in2], [3.0, LAST, E.back(1.3)]]);
    };
    // ticks for the audio: every step, and each word crossing during the spin
    K.sfx('tick', 0.8, { v: 0.8 });
    steps.forEach(([ts], i) => K.sfx('tick', ts + 0.03, { v: 0.8 + i * 0.03 }));
    for (let k = 9; k <= LAST; k++) {
      let lo = 2.5, hi = 3.0;
      for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (reel(m) < k - 0.5) lo = m; else hi = m; }
      if (k < LAST) K.sfx('tick', lo, { v: 0.9 });
    }

    // ---- "NOW." --------------------------------------------------------------------------
    const now = h('div', { cls: 'abs display row', css: { left: '0px', top: '805px', width: '1080px', justifyContent: 'center',
      fontSize: '300px', fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1, alignItems: 'baseline' } }, root);
    const NL = [...K.T('NOW')].map((ch) => { const el = document.createElement('span'); el.textContent = ch; el.style.display = 'inline-block'; now.appendChild(el); return el; });
    const dot = h('span', { css: { display: 'inline-block', width: '74px', height: '74px', marginLeft: '14px',
      borderRadius: px(74 * 0.186), background: C.orange } }, now);
    const [dx0, dy0] = K.offsetIn(dot, root);
    const DOT0 = { x: dx0 + 37, y: dy0 + 37, s: 74 };
    const dotFree = K.makeTiles(root, 1, -1)[0];

    const mbReel = K.motionBlur('y');
    K.fast(-0.1, 0.55); K.fast(2.4, 3.12); K.fast(3.44, 4.02);

    // ---- audio / camera events --------------------------------------------------------------
    K.sfx('slam', 0.0, { v: 1.0 }); K.shake(0.03, 8, 0.3);
    K.sfx('slam', 0.25, { v: 1.0 }); K.shake(0.28, 11, 0.35);
    K.sfx('pop', 0.42, { pitch: 1 });
    K.sfx('stretch', 0.56);
    K.sfx('land', 3.0); K.shake(3.02, 12, 0.4); K.flash(3.0, C.orange, 0.16, 0.3);
    K.sfx('boom', 3.5); K.shake(3.5, 26, 0.5); K.flash(3.5, '#fff', 0.32, 0.16);
    K.sfx('reverse', 3.52, { end: 4.0 });

    return (t) => {
      // background
      const tension = norm(t, 0.3, 3.4);
      set(glow, { s: 1 + 0.08 * Math.sin(t * Math.PI * 4) * tension, o: lerp(0.1, 0.34, tension) + 0.4 * Math.exp(-Math.max(0, t - 3.5) / 0.2) * (t >= 3.5) });
      for (let i = 0; i < M.tiles.length; i++) {
        const T = M.tiles[i];
        let b = 0;
        for (const ts of sparks[i]) if (t >= ts) b = Math.max(b, Math.exp(-(t - ts) / 0.22));
        const d = Math.hypot(T.x + 30 - 540, T.y + 30 - 960);
        const tw0 = 3.5 + d / 2600;
        if (t >= tw0) b = Math.max(b, Math.exp(-(t - tw0) / 0.16));
        T.el.style.background = b > 0.02 ? `rgba(254,77,30,${(0.08 + 0.85 * b).toFixed(3)})` : 'rgba(255,255,255,0.05)';
        set(T.el, { x: T.x, y: T.y - t * 22, s: 1 + 0.12 * b });
      }

      // group push-in then blow past camera on "NOW."
      const push = lerp(1, 1.05, E.io2(norm(t, 3.0, 3.5)));
      const out = tw(t, 3.46, 0.2, E.in3);
      set(group, { s: push + out * 1.6, o: 1 - out, blur: out * 14 });
      group.style.transformOrigin = '540px 880px';

      // letters
      L.forEach((el) => {
        const t0 = el._w === 0 ? -0.06 + el._c * 0.012 : 0.19 + el._c * 0.028;
        const p = norm(t, t0, t0 + 0.34);
        const e = E.outExpo(p);
        set(el, { y: lerp(-40, 0, e), s: lerp(2.6, 1, e), o: clamp(p * 4), blur: (1 - e) * 22 });
      });

      // slot box morph: hollow tile -> wide field
      const pop = spr(t, 0.38, 3.2, 0.5);
      const st = tw(t, 0.54, 0.34, E.snap);
      const tile = 96 * clamp(pop, 0, 1.4);
      const bw = lerp(tile, BOX.w, st), bh = lerp(tile, BOX.h, st);
      const bb = lerp(tile * 0.25, BOX.b, st), br = lerp(tile * 0.317, BOX.r, st);
      const land = Math.exp(-Math.max(0, t - 3.0) / 0.25) * (t >= 3.0);
      box.style.width = px(bw); box.style.height = px(bh);
      box.style.borderWidth = px(bb + land * 6); box.style.borderRadius = px(br);
      box.style.borderColor = land > 0.02 ? `rgb(255,${Math.round(77 + 150 * land)},${Math.round(30 + 190 * land)})` : C.orange;
      set(box, { x: BOX.cx - bw / 2, y: BOX.cy - bh / 2, o: t < 0.38 ? 0 : 1 });
      const iw = bw - 2 * BOX.b, ih = bh - 2 * BOX.b;
      clip.style.width = px(Math.max(0, iw)); clip.style.height = px(Math.max(0, ih));
      set(clip, { x: BOX.cx - iw / 2, y: BOX.cy - ih / 2, o: st > 0.6 ? 1 : 0 });
      const p = reel(t);
      set(strip, { x: -(1080 - iw) / 2, y: -p * S, o: t < 0.72 ? 0 : 1 });
      mbReel(strip, K.sigma(K.vel(reel, t) * S));
      const lastPop = spr(t, 3.0, 3, 0.35);
      set(wordEls[LAST], { s: 1 + 0.12 * (1 - clamp(lastPop)) * (t >= 3.0) });

      // NOW.
      const n0 = 3.5;
      const ne = E.outExpo(norm(t, n0, n0 + 0.22));
      set(now, { s: t < n0 ? 0 : lerp(1.7, 1, ne), o: t < n0 ? 0 : 1, blur: (1 - ne) * 16 * (t >= n0) });
      NL.forEach((el, i) => {
        const q = tw(t, 3.7 + i * 0.04, 0.24, E.in3);
        set(el, { y: q * 150, s: 1 - q * 0.35, r: q * (i - (NL.length - 1) / 2) * 8, o: 1 - q, blur: q * 12 });
      });
      // the period detaches and becomes the first logo tile, charging up before the drop
      const m = tw(t, 3.72, 0.22, E.snap);
      const charge = E.in2(norm(t, 3.86, 4.0));
      const free = t >= 3.7;
      dot.style.visibility = free ? 'hidden' : '';
      const size = lerp(DOT0.s, 110, m);
      K.placeTile(dotFree, lerp(DOT0.x, 540, m), lerp(DOT0.y, 960, m), size,
        { sx: 1 + 0.22 * charge, sy: 1 - 0.18 * charge, r: m * 90, o: free ? 1 : 0 });
    };
  });
});
