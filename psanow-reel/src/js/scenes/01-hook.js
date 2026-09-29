// 0.0 – 4.0s  HOOK: "Still running your firm on spreadsheets?" + pain stamps, then implosion.
(function () {
  const { el, T, O, E, tw, kf, inv, lerp, clamp } = R;
  const C = R.C;
  const S = { name: 'hook', vs: 0, ve: 4.02, z: 10 };
  const OX = 540, OY = 760; // implosion point = logo centre

  const COLS = [
    { h: R.t('Project', 'Layihə'), w: 270 },
    { h: R.t('Client', 'Müştəri'), w: 220 },
    { h: R.t('Hours', 'Saat'), w: 140 },
    { h: R.t('Rate', 'Tarif'), w: 130 },
    { h: R.t('Billed', 'Hesablanıb'), w: 200 },
    { h: R.t('Status', 'Status'), w: 170 },
    { h: R.t('Owner', 'Məsul'), w: 130 },
  ];
  const PROJ = R.t(['Website relaunch', 'Brand refresh', 'ERP rollout', 'Mobile app v2', 'Audit FY25', 'SEO retainer',
    'Data migration', 'CRM setup', 'Cloud move', 'UX research', 'Q3 campaign', 'Payroll fix'],
  ['Saytın yenilənməsi', 'Brend yeniləmə', 'ERP tətbiqi', 'Mobil tətbiq v2', 'Audit 2025', 'SEO xidməti',
    'Data miqrasiyası', 'CRM qurulması', 'Buluda keçid', 'UX tədqiqatı', 'Q3 kampaniyası', 'Əmək haqqı']);
  const CLI = ['Nova Studio', 'Orbit Labs', 'Atlas Group', 'Kite Media', 'Lumen & Co', 'Delta Foods', 'Pixel Forge', 'Vertex Co'];
  const STAT = R.t(['Draft', 'Sent?', 'Overdue', '??', 'Pending', 'Unpaid', 'Late'], ['Qaralama', 'Göndərilib?', 'Gecikib', '??', 'Gözləyir', 'Ödənməyib', 'Gec']);
  const ERR = ['#REF!', '#N/A', '#VALUE!', '#DIV/0!', '#NAME?', 'ERR'];
  const OWN = ['AM', 'LK', 'RS', 'TN', 'MB', 'GH'];
  const ROWS = 40;

  const STAMPS = [
    { t: 1.5, text: R.t('Lost hours.', 'İtən saatlar.'), icon: 'clock', x: 395, y: 935, r: -4 },
    { t: 2.0, text: R.t('Late invoices.', 'Gecikən fakturalar.'), icon: 'file-warning', x: 650, y: 1075, r: 3.2 },
    { t: 2.5, text: R.t('Overbooked team.', 'Yüklənmiş komanda.'), icon: 'users', x: 440, y: 1215, r: -2.4 },
    { t: 3.0, text: R.t('Leaking revenue.', 'Sızan gəlir.'), icon: 'trending-down', x: 610, y: 1355, r: 4.2 },
  ];

  S.build = (root) => {
    const cam = (S.cam = el(root, 'abs', { width: '1080px', height: '1920px', transformOrigin: `${OX}px ${OY}px` }));

    // ---- 3D spreadsheet backdrop ----
    const wrap = el(cam, 'abs', { width: '1080px', height: '1920px', perspective: '1400px', perspectiveOrigin: '540px 760px', overflow: 'hidden' });
    const sheet = (S.sheet = el(wrap, 'abs', {
      width: '1330px', left: '-125px', top: '-260px',
      fontFamily: "'JetBrains Mono Variable'", fontSize: '21px', color: '#7a7069',
      transformOrigin: '665px 1100px', background: '#0E0C0B',
      border: '1px solid #2A2420',
    }));
    const row = (cells, cls) => {
      const r = el(sheet, '', { display: 'flex', height: '54px', borderBottom: '1px solid #26201C' });
      return cells.map((c, i) => el(r, '', {
        width: (i === 0 ? 70 : COLS[i - 1].w) + 'px', flex: 'none', lineHeight: '54px', padding: '0 14px',
        borderRight: '1px solid #26201C', whiteSpace: 'nowrap', overflow: 'hidden',
        ...(cls || {}),
      }, c));
    };
    row(['', ...'ABCDEFG'.split('')], { background: '#171412', color: '#5a524c', textAlign: 'center' });
    row(['1', ...COLS.map((c) => c.h)], { background: '#141110', color: '#9a918a', fontWeight: '600' });
    const rnd = R.rng(7);
    S.cells = [];
    for (let i = 0; i < ROWS; i++) {
      const hours = (8 + Math.floor(rnd() * 190) + (rnd() < 0.5 ? 0.5 : 0));
      const rate = 45 + Math.floor(rnd() * 16) * 5;
      const vals = [
        String(i + 2),
        PROJ[Math.floor(rnd() * PROJ.length)],
        CLI[Math.floor(rnd() * CLI.length)],
        hours.toFixed(1),
        '₼ ' + rate,
        '₼ ' + R.fmt(hours * rate, 2),
        STAT[Math.floor(rnd() * STAT.length)],
        OWN[Math.floor(rnd() * OWN.length)],
      ];
      const cs = row(vals);
      cs[0].style.color = '#4d4640';
      cs[0].style.textAlign = 'center';
      cs[0].style.background = '#131110';
      cs.forEach((c, j) => { if (j >= 3 && j <= 5) c.style.textAlign = 'right'; });
      S.cells.push({ nodes: cs, vals, i });
    }
    S.fade = el(wrap, 'abs', {
      width: '1080px', height: '1920px',
      background: 'linear-gradient(180deg, rgba(11,9,8,.97) 0%, rgba(11,9,8,.5) 20%, rgba(11,9,8,.22) 50%, rgba(11,9,8,.6) 78%, rgba(11,9,8,1) 100%)',
    });

    // ---- headline ----
    const lines = R.t(['Still running', 'your firm on', 'spreadsheets?'], ['Şirkətinizi hələ də', 'Excel cədvəllərində', 'idarə edirsiniz?']);
    const selLine = R.t(2, 1);
    const hcss = { fontFamily: "'Inter Tight Variable'", fontWeight: '800', letterSpacing: '-0.038em' };
    const fs = R.fit(lines, hcss, 118, 900);
    const hl = (S.hl = el(cam, 'abs f-head', {
      left: '84px', top: 395 + (118 - fs) * 1.5 + 'px', fontSize: fs + 'px', fontWeight: '800', lineHeight: '1.03',
      letterSpacing: '-0.038em', color: C.text,
    }));
    S.lines = lines.map((txt) => {
      const ln = el(hl, 'nowrap', { position: 'relative' });
      return { ln, words: R.maskWords(ln, txt) };
    });
    // marching-ants selection around "spreadsheets?"
    const w3 = R.measure(lines[selLine], Object.assign({}, hcss, { fontSize: fs + 'px' }));
    S.selW = w3 + 34;
    S.selH = Math.round(fs * 1.12);
    const sel = (S.sel = el(S.lines[selLine].ln, 'abs', { left: '-16px', top: Math.round(fs * 0.068) + 'px', width: S.selW + 'px', height: S.selH + 'px', overflow: 'visible' }));
    sel.innerHTML = `<svg width="${S.selW + 20}" height="${S.selH + 18}" style="position:absolute;left:0;top:0;overflow:visible">
      <rect x="0" y="0" width="${S.selW}" height="${S.selH}" fill="rgba(247,243,240,0.06)" stroke="#F7F3F0" stroke-width="4" stroke-dasharray="16 11" rx="6"/></svg>`;
    S.selRect = sel.querySelector('rect');
    S.handle = el(sel, 'abs', { width: '22px', height: '22px', background: C.text, borderRadius: '4px', border: '3px solid #0B0908' });

    // ---- pain stamps ----
    S.stamps = STAMPS.map((d) => {
      const n = el(cam, 'abs', {
        display: 'flex', alignItems: 'center', gap: '22px', padding: '18px 36px 18px 18px',
        background: '#F4F0EC', color: '#0E0C0B', borderRadius: '28px', whiteSpace: 'nowrap',
        boxShadow: '0 30px 70px rgba(0,0,0,.65), 0 2px 0 rgba(255,255,255,.6) inset',
      });
      el(n, '', { width: '78px', height: '78px', borderRadius: '20px', background: '#0E0C0B', color: '#F4F0EC', display: 'grid', placeItems: 'center' }, R.svgIcon(d.icon, 44, 2.3));
      el(n, 'f-head', { fontSize: '58px', fontWeight: '800', letterSpacing: '-0.035em', lineHeight: '1' }, d.text);
      const w = n.getBoundingClientRect().width, h = n.getBoundingClientRect().height;
      d.x = clamp(d.x, 60 + w / 2, 1020 - w / 2);
      Object.assign(n.style, { left: d.x - w / 2 + 'px', top: d.y - h / 2 + 'px' });
      // dust burst
      const dust = [];
      const rr = R.rng(Math.floor(d.t * 100));
      for (let k = 0; k < 10; k++) {
        const s = 6 + rr() * 12;
        const p = el(cam, 'abs', { width: s + 'px', height: s + 'px', borderRadius: s * 0.2 + 'px', background: k % 3 ? '#8f877f' : '#F4F0EC', left: d.x + 'px', top: d.y + 'px' });
        const side = rr() < 0.5 ? -1 : 1;
        dust.push({ p, a: (side < 0 ? Math.PI : 0) + (rr() - 0.5) * 1.6, v: 380 + rr() * 520, rot: (rr() - 0.5) * 720, sx: side * (w / 2 - 20) * rr(), s });
      }
      return { ...d, n, w, h, dust };
    });

    // ---- the seed (first appearance of brand orange) ----
    S.seed = el(root, 'abs', {
      width: '76px', height: '76px', left: OX - 38 + 'px', top: OY - 38 + 'px', borderRadius: '14px',
      background: C.orange, boxShadow: '0 0 50px 12px rgba(254,77,30,.55), 0 0 140px 40px rgba(254,77,30,.25)',
    });

    STAMPS.forEach((d, i) => {
      R.impact(d.t, 15 + i * 3, 10, 12);
      R.flash(d.t, '#ffffff', 0.10 + i * 0.02, 0.14);
    });
  };

  S.update = (t) => {
    // ---- spreadsheet motion ----
    const push = tw(t, 0, 3.4, 0, 1, E.inOutQuad);
    const shakeUp = R.env(t, 1.4, 1.6, 3.3, 3.5);
    S.sheet.style.transform = 'rotateX(' + (36 + shakeUp * R.noise(t * 14, 3) * 2) + 'deg) rotateZ(' + (-13 + push * 3) + 'deg) translate3d(0,' + lerp(80, -320, push) + 'px,' + lerp(-140, 170, push) + 'px)';
    const errP = kf(t, [[0, 0.02], [1.45, 0.05], [3.3, 0.55, E.inQuad]]);
    const tick = Math.floor(t * 12);
    for (const c of S.cells) {
      for (let j = 3; j <= 6; j++) {
        const node = c.nodes[j];
        const h = R.hash(c.i, j, 17);
        let v = c.vals[j];
        let err = false;
        if (h < errP) { v = ERR[Math.floor(R.hash(c.i, j, 5) * ERR.length)]; err = true; }
        else if (j === 3 && R.hash(c.i, tick, 9) < 0.18) v = (R.hash(c.i, tick) * 200).toFixed(1);
        else if (j === 5 && R.hash(c.i, tick, 4) < 0.14) v = '₼ ' + R.fmt(R.hash(c.i, tick, 2) * 24000, 2);
        if (node._v !== v) { node.textContent = v; node._v = v; }
        const ec = err ? 1 : 0;
        if (node._e !== ec) {
          node._e = ec;
          node.style.background = err ? 'rgba(247,243,240,0.1)' : '';
          node.style.color = err ? '#E9E3DE' : '';
        }
      }
    }
    O(S.sheet, tw(t, 0, 0.6, 0.45, 0.95, E.outQuad));

    // ---- headline ----
    const starts = [-0.12, 0.42, 0.95];
    S.lines.forEach((L, li) => {
      L.words.forEach((w, wi) => {
        const t0 = starts[li] + wi * 0.075;
        const p = E.outExpo(inv(t0, t0 + 0.6, t));
        T(w, { y: (1 - p) * 135, r: (1 - p) * 6 });
      });
      // glitch slices on each stamp impact
      let gx = 0, split = 0;
      for (const s of STAMPS) {
        const dt = t - s.t;
        if (dt >= 0 && dt < 0.12) {
          gx += (R.hash(li, Math.floor(dt * 60), s.t * 10) - 0.5) * 60;
          split = Math.max(split, 1 - dt / 0.12);
        }
      }
      T(L.ln, { x: gx });
      L.ln.style.textShadow = split > 0 ? `${-7 * split}px 0 rgba(255,40,80,${0.75 * split}), ${7 * split}px 0 rgba(0,210,255,${0.75 * split})` : 'none';
    });
    // selection box drag
    const sp = E.outCubic(inv(1.2, 1.45, t));
    const sw = Math.max(1, S.selW * sp);
    S.selRect.setAttribute('width', sw.toFixed(1));
    S.selRect.setAttribute('stroke-dashoffset', (-t * 60).toFixed(1));
    O(S.sel, sp > 0 ? 1 : 0);
    T(S.handle, { x: sw - 11, y: S.selH - 11, s: E.outBack(inv(1.3, 1.5, t)) });

    // ---- stamps ----
    for (const s of S.stamps) {
      const dt = t - s.t;
      if (dt < -0.02) { O(s.n, 0); s.dust.forEach((d) => O(d.p, 0)); continue; }
      const p = clamp(dt / 0.17);
      const sc = dt < 0.17 ? lerp(2.5, 0.965, E.inQuad(p)) : 0.965 + 0.035 * R.spring(dt - 0.17, 0.35, 30);
      O(s.n, clamp(dt / 0.05));
      T(s.n, { s: sc, r: s.r + (1 - E.outCubic(p)) * 14 * (s.r > 0 ? 1 : -1) });
      s.n.style.boxShadow = `0 ${lerp(90, 30, p)}px ${lerp(120, 70, p)}px rgba(0,0,0,.6)`;
      // dust
      const ddt = dt - 0.16;
      s.dust.forEach((d) => {
        if (ddt < 0 || ddt > 0.7) { O(d.p, 0); return; }
        const dist = d.v * (1 - Math.exp(-ddt * 6)) / 6;
        T(d.p, { x: d.sx + Math.cos(d.a) * dist, y: Math.sin(d.a) * dist + 260 * ddt * ddt, r: d.rot * ddt, s: 1 - ddt / 0.7 });
        O(d.p, 1 - ddt / 0.7);
      });
    }

    // ---- implosion into the seed ----
    const anticip = E.outQuad(inv(3.3, 3.46, t));
    const col = E.inQuart(inv(3.46, 3.95, t));
    const sc = (1 + anticip * 0.05) * (1 - col);
    T(S.cam, { s: Math.max(0.0001, sc), r: -38 * E.inCubic(inv(3.46, 3.95, t)) });
    O(S.cam, 1 - inv(3.86, 3.96, t));
    // push-in over the whole hook
    // seed
    const sd = t - 3.62;
    if (sd < 0) O(S.seed, 0);
    else {
      O(S.seed, 1);
      const pop = E.back(2.2)(clamp(sd / 0.28));
      const squeeze = 1 - 0.3 * E.inQuad(inv(3.86, 3.99, t));
      T(S.seed, { s: pop * squeeze, r: (1 - E.outCubic(clamp(sd / 0.3))) * 135 });
    }
  };

  window.SCENES.push(S);
})();
