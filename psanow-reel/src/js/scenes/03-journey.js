// 6.0 – 12.0s  JOURNEY: Sell it. Plan it. Staff it. Track it. Bill it. Grow it.
// One orange "token" travels through every screen: deal -> task bar -> allocation -> approval -> invoice -> profit.
(function () {
  const { el, T, O, E, tw, kf, inv, lerp, clamp } = R;
  const C = R.C;
  const S = { name: 'journey', vs: 4.3, ve: 12.2, z: 20 };

  const VERBS = ['Sell', 'Plan', 'Staff', 'Track', 'Bill', 'Grow'];
  const TK = [6, 7, 8, 9, 10, 11]; // stage start times
  const END = 11.9; // exit start
  const CAPS = [
    'OPPORTUNITIES · ESTIMATES · CONTRACTS',
    'PROJECTS · TASKS · MILESTONES',
    'RESOURCE PLANNER · UTILIZATION',
    'TIMESHEETS · APPROVALS · EXPENSES',
    'INVOICES · PAYMENTS · RETAINERS',
    'PROFITABILITY · FORECAST · LEAKAGE',
  ];
  const CARD = { x: 90, y: 560, w: 900, h: 800 };

  // token rectangles (card-local): x, y, w, h, radius
  const RECT = {
    dealA: [328, 212, 244, 112, 22],
    dealB: [600, 340, 244, 112, 22],
    dev: [472.75, 386, 297, 50, 14],
    chipA: [478.6, 292, 76, 36, 12],
    chipB: [478.6, 500, 76, 36, 12],
    pill: [560, 584, 284, 76, 38],
    total: [56, 522, 788, 88, 22],
    bar: [740, 266, 88, 470, 18],
  };
  const TOKEN_KEYS = [
    [6.0, 'dealA'], [6.45, 'dealA'], [6.75, 'dealB', E.inOutCubic, 70],
    [6.88, 'dealB'], [7.28, 'dev', E.inOutCubic, 90],
    [7.88, 'dev'], [8.28, 'chipA', E.inOutCubic, 80],
    [8.5, 'chipA'], [8.74, 'chipB', E.inOutCubic, -40],
    [8.88, 'chipB'], [9.28, 'pill', E.inOutCubic, 90],
    [9.88, 'pill'], [10.28, 'total', E.inOutCubic, 60],
    [10.88, 'total'], [11.3, 'bar', E.inOutCubic, 110],
  ];

  let layers = [];

  function mkCard(parent) {
    return el(parent, 'abs', {
      left: CARD.x + 'px', top: CARD.y + 'px', width: CARD.w + 'px', height: CARD.h + 'px', borderRadius: '48px',
      background: 'linear-gradient(180deg, #1D1815 0%, #141110 100%)',
      border: '2px solid rgba(255,255,255,0.07)',
      boxShadow: '0 50px 120px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.06)',
      transformOrigin: '450px 400px',
    });
  }

  S.build = (root) => {
    const cam = (S.cam = el(root, 'abs', { width: '1080px', height: '1920px', transformOrigin: `${R.SC_HX || 765}px ${R.SC_HY || 986}px` }));

    // ---- verb headline ----
    const vcss = { fontFamily: "'Unbounded Variable'", fontSize: '122px', fontWeight: '700', letterSpacing: '-0.03em' };
    S.vw = VERBS.map((v) => R.measure(v, vcss));
    S.itW = R.measure(' it.', vcss);
    S.verbBox = el(cam, 'abs f-disp nowrap', { top: '286px', left: '0', height: '170px', width: '1080px', ...{ fontSize: '122px', fontWeight: '700', letterSpacing: '-0.03em', lineHeight: '170px' } });
    S.verbMask = el(S.verbBox, 'abs', { top: '0', height: '170px', overflow: 'hidden', width: '700px' });
    S.verbs = VERBS.map((v) => el(S.verbMask, 'abs', { left: '0', top: '0', color: C.text }, v));
    S.it = el(S.verbBox, 'abs', { top: '0', color: C.orange }, ' it.');

    // ---- progress squares ----
    S.steps = VERBS.map((v, i) => el(cam, 'abs', { left: 433 + i * 38 + 'px', top: '478px', width: '24px', height: '24px', borderRadius: '5px', background: '#3A322D' }));

    // ---- card ----
    const card = (S.card = mkCard(cam));
    S.cardGlow = el(card, 'abs', { left: '-2px', top: '-2px', width: CARD.w + 'px', height: CARD.h + 'px', borderRadius: '48px', border: '2px solid rgba(254,77,30,.9)', boxShadow: '0 0 40px rgba(254,77,30,.35), inset 0 0 30px rgba(254,77,30,.12)' });
    S.divider = el(card, 'abs', { left: '56px', top: '128px', width: '788px', height: '2px', background: 'rgba(255,255,255,.07)' });

    layers = TK.map((t0, k) => {
      const L = el(card, 'abs', { width: CARD.w + 'px', height: CARD.h + 'px' });
      return { L, k, t0, t1: k < 5 ? TK[k + 1] : 99, items: [] };
    });
    const add = (k, css, html, anim, cls = '') => {
      const n = el(layers[k].L, 'abs ' + cls, css, html);
      layers[k].items.push({ n, anim, j: layers[k].items.length });
      return n;
    };
    const head = (k, title, meta) => {
      add(k, { left: '56px', top: '42px', fontSize: '42px', fontWeight: '800', letterSpacing: '-0.03em', color: C.text }, title, null, 'f-head nowrap');
      return add(k, { right: '56px', top: '56px', fontSize: '23px', fontWeight: '500', letterSpacing: '0.08em', color: '#A59B93', textAlign: 'right' }, meta, null, 'f-mono nowrap');
    };
    const mono = { fontFamily: "'JetBrains Mono Variable'" };

    // ===== Stage 0: SELL (pipeline) =====
    S.pipeMeta = head(0, 'Pipeline', '');
    ['LEAD · 3', 'PROPOSAL · 2', 'WON'].forEach((h, i) =>
      add(0, { left: 56 + i * 272 + 'px', top: '164px', fontSize: '20px', letterSpacing: '0.12em', color: '#8F857D', ...mono }, h));
    const deal = (k, x, y, name, val, pct, hot) => add(k, {
      left: x + 'px', top: y + 'px', width: '244px', height: '112px', borderRadius: '22px', background: '#241E1A',
      border: '1px solid rgba(255,255,255,.06)', padding: '18px 20px',
    }, `<div class="f-head" style="font-size:27px;font-weight:700;letter-spacing:-0.02em;color:#F2EDE9">${name}</div>
        <div class="f-mono" style="font-size:21px;color:#A59B93;margin-top:10px;display:flex;justify-content:space-between"><span>${val}</span><span style="color:${hot ? '#FFB59C' : '#7d736b'}">${pct}</span></div>`);
    deal(0, 56, 212, 'Kite Media', '₼ 18,000', '20%');
    deal(0, 56, 340, 'Lumen & Co', '₼ 24,000', '20%');
    deal(0, 56, 468, 'Pixel Forge', '₼ 12,500', '10%');
    S.atlas = deal(0, 328, 340, 'Atlas Group', '₼ 32,000', '60%', true);
    deal(0, 600, 212, 'Nova Studio', '₼ 64,000', '100%', true);

    // ===== Stage 1: PLAN (gantt) =====
    head(1, 'Website relaunch', '320 H BUDGET');
    const wk = 74.25, gx = 250;
    for (let i = 0; i < 8; i++) {
      add(1, { left: gx + i * wk + 'px', top: '164px', width: wk + 'px', textAlign: 'center', fontSize: '19px', color: '#8F857D', ...mono }, 'W' + (i + 1));
      add(1, { left: gx + i * wk + 'px', top: '200px', width: '1px', height: '420px', background: 'rgba(255,255,255,.05)' });
    }
    const tasks = ['Discovery', 'UX design', 'Development', 'QA', 'Launch'];
    tasks.forEach((n, i) => add(1, { left: '56px', top: 214 + i * 86 + 10 + 'px', fontSize: '25px', fontWeight: '600', color: '#D5CCC5' }, n, null, 'nowrap'));
    const bar = (x, w, row) => add(1, { left: x + 'px', top: 214 + row * 86 + 'px', width: w + 'px', height: '50px', borderRadius: '14px', background: '#3B312B', transformOrigin: 'left center' }, null,
      (n, t, p) => T(n, { sx: E.outExpo(inv(7.02 + row * 0.07, 7.4 + row * 0.07, t)) }));
    bar(gx, wk * 2, 0);
    bar(gx + wk * 2, wk * 2, 1);
    bar(gx + wk * 7, wk, 3);
    // dependency drops
    const dep = (x, row) => add(1, { left: x - 1.5 + 'px', top: 214 + row * 86 + 50 + 'px', width: '3px', height: '36px', background: '#6D625A', transformOrigin: 'top' }, null,
      (n, t) => T(n, { sy: E.outCubic(inv(7.3 + row * 0.06, 7.5 + row * 0.06, t)) }));
    dep(gx + wk * 2, 0);
    dep(gx + wk * 7, 2);
    dep(gx + wk * 8 - 18, 3);
    add(1, { left: gx + wk * 8 - 36 + 'px', top: 214 + 4 * 86 + 8 + 'px', width: '34px', height: '34px', border: '5px solid ' + C.orange, borderRadius: '6px', background: '#141110' }, null,
      (n, t) => T(n, { r: 45, s: E.back(2.5)(inv(7.4, 7.65, t)) }));
    S.today = add(1, { left: '0', top: '196px', width: '3px', height: '440px', background: C.orange, boxShadow: '0 0 14px rgba(254,77,30,.8)' },
      '<div class="f-mono" style="position:absolute;left:-40px;top:-30px;width:84px;text-align:center;font-size:15px;font-weight:700;color:#fff;background:#FE4D1E;border-radius:6px;padding:3px 0">TODAY</div>',
      (n, t) => T(n, { x: lerp(gx, gx + wk * 3.45, E.inOutCubic(inv(7.15, 7.7, t))) }));

    // ===== Stage 2: STAFF (resource planner) =====
    head(2, 'Resource planner', 'W23 – W28');
    const cw = 92.3, cx0 = 290;
    for (let i = 0; i < 6; i++) add(2, { left: cx0 + i * cw + 'px', top: '164px', width: '84px', textAlign: 'center', fontSize: '19px', color: '#8F857D', ...mono }, 'W' + (23 + i));
    const people = [['Aysel', 'AY', [80, 100, 100, 80, 60, 40]], ['Murad', 'MR', [100, 100, 130, 100, 80, 60]], ['Leyla', 'LY', [60, 80, 80, 100, 100, 80]], ['Tural', 'TR', [40, 60, 60, 60, 40, 20]]];
    S.alloc = {};
    people.forEach(([name, ini, al], r) => {
      const y = 206 + r * 104;
      add(2, { left: '56px', top: y + 14 + 'px', width: '56px', height: '56px', borderRadius: '50%', background: ['#5A3A2E', '#FE4D1E', '#4A3F39', '#6B4A3C'][r], display: 'grid', placeItems: 'center', fontSize: '20px', fontWeight: '700', color: '#fff' }, ini);
      add(2, { left: '128px', top: y + 26 + 'px', fontSize: '26px', fontWeight: '600', color: '#D5CCC5' }, name);
      al.forEach((a, i) => {
        const n = add(2, { left: cx0 + i * cw + 'px', top: y + 'px', width: '84px', height: '84px', borderRadius: '16px', display: 'grid', placeItems: 'center', fontSize: '21px', fontWeight: '600', ...mono }, a + '%');
        S.alloc[r + ':' + i] = { n, a };
        paintAlloc(n, a);
      });
    });

    // ===== Stage 3: TRACK (timesheet) =====
    S.tsMeta = head(3, 'Timesheet · W24', '');
    ['MON', 'TUE', 'WED', 'THU', 'FRI'].forEach((d, i) => add(3, { left: 300 + i * 90 + 'px', top: '164px', width: '80px', textAlign: 'center', fontSize: '19px', color: '#8F857D', ...mono }, d));
    add(3, { left: '756px', top: '164px', width: '88px', textAlign: 'center', fontSize: '19px', color: '#8F857D', ...mono }, 'TOTAL');
    const tsRows = [['Website relaunch', 'BILLABLE', [6, 7, 8, 6.5, 5]], ['Nova Studio', 'BILLABLE', [2, 1, 0, 1.5, 0.5]], ['Internal', 'NON-BILLABLE', [0, 0, 0, 0, 1]]];
    S.tsCells = [];
    S.tsTotals = [];
    tsRows.forEach(([n, tag, vals], r) => {
      const y = 206 + r * 92;
      add(3, { left: '56px', top: y + 8 + 'px', fontSize: '24px', fontWeight: '600', color: '#D5CCC5' }, n, null, 'nowrap');
      add(3, { left: '56px', top: y + 44 + 'px', fontSize: '15px', letterSpacing: '0.1em', color: r < 2 ? '#FF9B78' : '#7d736b', ...mono }, tag);
      vals.forEach((v, i) => {
        const c = add(3, { left: 300 + i * 90 + 'px', top: y + 'px', width: '80px', height: '76px', borderRadius: '14px', background: '#241E1A', display: 'grid', placeItems: 'center', fontSize: '30px', fontWeight: '700', color: '#F2EDE9', border: '2px solid transparent' }, '', null, 'f-head');
        S.tsCells.push({ c, v, idx: r * 5 + i, r });
      });
      S.tsTotals.push({ n: add(3, { left: '756px', top: y + 'px', width: '88px', height: '76px', display: 'grid', placeItems: 'center', fontSize: '30px', fontWeight: '800', color: C.text }, '', null, 'f-head'), vals });
    });
    add(3, { left: '56px', top: '608px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '19px', color: '#8F857D', letterSpacing: '0.06em', ...mono },
      R.svgIcon('lock', 26, 2.2, '#8F857D') + '<span>LOCKED AFTER INVOICING</span>', (n, t) => O(n, inv(9.6, 9.75, t) * (1 - inv(TK[4] - 0.15, TK[4], t))));

    // ===== Stage 4: BILL (invoice) =====
    head(4, 'Invoice #1042', 'ORBIT LABS');
    const lines = [['Development', '64h × ₼85', '₼ 5,440'], ['UX design', '22h × ₼70', '₼ 1,540'], ['Expenses', 'rebillable', '₼ 320']];
    lines.forEach(([a, b, c], i) => {
      const y = 172 + i * 66;
      add(4, { left: '56px', top: y + 'px', width: '788px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
        `<span style="font-size:26px;font-weight:600;color:#E3DBD5">${a}<span class="f-mono" style="font-size:20px;color:#8F857D;margin-left:18px">${b}</span></span><span class="f-head" style="font-size:30px;font-weight:700;color:#F2EDE9">${c}</span>`, null);
    });
    add(4, { left: '56px', top: '382px', width: '788px', height: '2px', background: 'rgba(255,255,255,.08)' });
    [['Subtotal', '₼ 7,300'], ['VAT 18%', '₼ 1,314']].forEach(([a, b], i) =>
      add(4, { left: '56px', top: 400 + i * 54 + 'px', width: '788px', display: 'flex', justifyContent: 'space-between', fontSize: '25px', color: '#A59B93' }, `<span>${a}</span><span class="f-head" style="font-weight:700">${b}</span>`));
    S.paid = add(4, { left: '470px', top: '640px', padding: '6px 26px', border: '7px solid ' + C.orange, borderRadius: '18px', fontSize: '58px', fontWeight: '800', color: C.orange, letterSpacing: '0.04em' }, 'PAID', null, 'f-disp');
    add(4, { left: '56px', top: '668px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '19px', color: '#8F857D', letterSpacing: '0.04em', ...mono },
      R.svgIcon('circle-check', 26, 2.2, '#FF9B78') + '<span>PAYMENT RECEIVED</span>', (n, t) => O(n, inv(10.62, 10.75, t) * (1 - inv(TK[5] - 0.15, TK[5], t))));

    // ===== Stage 5: GROW (profitability) =====
    S.mgMeta = head(5, 'Profitability · Q3', '');
    const hs = [190, 250, 230, 320, 380, 470];
    const months = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP'];
    S.barTops = [];
    hs.forEach((h, i) => {
      const x = 70 + i * 134;
      if (i < 5) add(5, { left: x + 'px', top: 736 - h + 'px', width: '88px', height: h + 'px', borderRadius: '18px', background: 'linear-gradient(180deg, #4A3C34, #2B231F)', transformOrigin: 'bottom' }, null,
        (n, t) => T(n, { sy: E.outExpo(inv(11.02 + i * 0.05, 11.45 + i * 0.05, t)) }));
      add(5, { left: x + 'px', top: '748px', width: '88px', textAlign: 'center', fontSize: '17px', color: '#8F857D', ...mono }, months[i]);
      S.barTops.push([x + 44, 736 - h - 46]);
    });
    const pts = S.barTops.map(([x, y]) => `${x},${y}`).join(' ');
    let len = 0;
    for (let i = 1; i < S.barTops.length; i++) len += Math.hypot(S.barTops[i][0] - S.barTops[i - 1][0], S.barTops[i][1] - S.barTops[i - 1][1]);
    S.lineLen = len;
    S.mline = add(5, { left: '0', top: '0', width: '900px', height: '800px' },
      `<svg width="900" height="800" style="position:absolute;left:0;top:0;overflow:visible"><polyline points="${pts}" fill="none" stroke="#F7F3F0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${len}" stroke-dashoffset="${len}"/>
      ${S.barTops.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#141110" stroke="#F7F3F0" stroke-width="4"/>`).join('')}</svg>`,
      (n, t) => {
        n.querySelector('polyline').setAttribute('stroke-dashoffset', (len * (1 - E.inOutCubic(inv(11.28, 11.7, t)))).toFixed(1));
        n.querySelectorAll('circle').forEach((c, i) => c.setAttribute('r', (9 * E.back(2)(inv(11.28 + i * 0.07, 11.42 + i * 0.07, t))).toFixed(2)));
      });
    add(5, { left: '56px', top: '168px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 22px 12px 16px', borderRadius: '40px', border: '2px solid ' + C.orange, background: 'rgba(254,77,30,.12)', fontSize: '22px', fontWeight: '600', color: '#FFD2C2' },
      R.svgIcon('triangle-alert', 26, 2.2, '#FF7A4D') + '<span>Leakage caught · <b style="color:#fff">₼ 4,280</b> unbilled</span>',
      (n, t) => { const p = inv(11.5, 11.72, t); T(n, { s: lerp(0.6, 1, E.back(2.2)(p)) }); O(n, p); });

    // ---- the token ----
    const tok = (S.token = el(card, 'abs', { left: '0', top: '0', background: C.orange, boxShadow: '0 18px 50px rgba(254,77,30,.45), inset 0 1px 0 rgba(255,255,255,.35)', overflow: 'hidden' }));
    const lab = (html, css) => el(tok, 'abs', Object.assign({ left: '0', top: '0', right: '0', bottom: '0', color: '#fff' }, css || {}), html);
    S.labs = {
      deal: lab(`<div class="f-head" style="position:absolute;left:20px;top:18px;font-size:27px;font-weight:800;letter-spacing:-0.02em;white-space:nowrap">Orbit Labs</div>
        <div class="f-mono" style="position:absolute;left:20px;top:62px;font-size:21px;white-space:nowrap">₼ 48,000</div>
        <div class="f-mono won" style="position:absolute;right:16px;top:60px;font-size:19px;font-weight:700;background:#fff;color:#FE4D1E;border-radius:10px;padding:2px 10px;white-space:nowrap">WON ✓</div>`),
      dev: lab(`<div class="f-head" style="position:absolute;left:18px;top:0;line-height:50px;font-size:23px;font-weight:700;white-space:nowrap">Development · 160h</div>`),
      chip: lab(`<div class="f-mono" style="position:absolute;left:0;right:0;top:0;line-height:36px;text-align:center;font-size:19px;font-weight:700">+30%</div>`),
      pill: lab(`<div class="f-head sub" style="position:absolute;left:0;right:0;top:0;line-height:76px;text-align:center;font-size:30px;font-weight:800;white-space:nowrap">Submit</div>
                 <div class="f-head ok" style="position:absolute;left:0;right:0;top:0;line-height:76px;text-align:center;font-size:30px;font-weight:800;white-space:nowrap">✓ Approved</div>`),
      total: lab(`<div class="f-head" style="position:absolute;left:28px;top:0;line-height:88px;font-size:34px;font-weight:800;white-space:nowrap">Total</div>
        <div class="f-disp" style="position:absolute;right:28px;top:0;line-height:88px;font-size:40px;font-weight:700;white-space:nowrap">₼ 8,614</div>`),
      bar: lab(`<div class="f-disp" style="position:absolute;left:0;right:0;top:18px;text-align:center;font-size:24px;font-weight:700">38%</div>`),
    };
    S.won = S.labs.deal.querySelector('.won');
    S.sub = S.labs.pill.querySelector('.sub');
    S.ok = S.labs.pill.querySelector('.ok');

    // ---- caption ----
    S.cap = el(cam, 'abs f-mono nowrap', { top: '1400px', left: '0', width: '1080px', textAlign: 'center', fontSize: '25px', fontWeight: '500', letterSpacing: '0.14em', color: '#B3A99F' });

    TK.forEach((t0, i) => { if (i > 0) R.impact(t0, 5, 14, 13); });
    R.impact(10.55, 12, 12, 14);
  };

  function paintAlloc(n, a) {
    if (a > 100) {
      n.style.background = 'repeating-linear-gradient(45deg, #FE4D1E 0 10px, #B8330F 10px 20px)';
      n.style.color = '#fff';
    } else if (a >= 100) {
      n.style.background = 'rgba(254,77,30,.62)';
      n.style.color = '#fff';
    } else if (a >= 80) {
      n.style.background = 'rgba(254,77,30,.32)';
      n.style.color = '#FFD2C2';
    } else {
      n.style.background = 'rgba(254,77,30,.13)';
      n.style.color = '#FFB59C';
    }
  }

  function rectAt(t) {
    const K = TOKEN_KEYS;
    if (t <= K[0][0]) return { r: RECT[K[0][1]].slice(), arc: 0, p: 0 };
    for (let i = 1; i < K.length; i++) {
      if (t <= K[i][0]) {
        const a = RECT[K[i - 1][1]], b = RECT[K[i][1]];
        const e = K[i][2] || E.inOutCubic;
        const p = e(inv(K[i - 1][0], K[i][0], t));
        const r = a.map((v, j) => lerp(v, b[j], p));
        const arc = (K[i][3] || 0) * Math.sin(Math.PI * p);
        return { r, arc, p, moving: a !== b, from: K[i - 1][1], to: K[i][1] };
      }
    }
    return { r: RECT[K[K.length - 1][1]].slice(), arc: 0, p: 1 };
  }

  S.update = (t) => {
    // counter-zoom while flying through the portal
    const z = kf(t, [[5.35, 0.42], [6.08, 1, E.outCubic]]);
    const ex = E.inQuart(inv(END, END + 0.2, t));
    T(S.cam, { s: z * (1 - ex * 0.94), r: ex * 16 });
    S.cam.style.transformOrigin = t < 6.2 ? '765px 986px' : '540px 960px';
    O(S.cam, 1 - inv(END + 0.15, END + 0.2, t));

    // stage index
    let k = 0;
    for (let i = 0; i < TK.length; i++) if (t >= TK[i] - 0.1) k = i;

    // ---- verbs ----
    const VX = (i) => 540 - (S.vw[i] + S.itW) / 2;
    let wNow = S.vw[0], xNow = VX(0);
    for (let i = 1; i < 6; i++) {
      const p = E.inOutCubic(inv(TK[i] - 0.14, TK[i] + 0.22, t));
      if (p > 0) { wNow = lerp(S.vw[i - 1], S.vw[i], p); xNow = lerp(VX(i - 1), VX(i), p); }
    }
    S.verbMask.style.left = xNow.toFixed(2) + 'px';
    S.verbMask.style.width = wNow + 30 + 'px';
    T(S.it, { x: xNow + wNow });
    // slot-machine roll: outgoing and incoming verbs move as one strip
    const roll = (i) => (i === 0 ? E.outExpo(inv(5.92, 6.3, t)) : E.inOutQuart(inv(TK[i] - 0.13, TK[i] + 0.2, t)));
    S.verbs.forEach((v, i) => {
      const pin = roll(i);
      const pout = i < 5 ? roll(i + 1) : 0;
      T(v, { y: (1 - pin) * 170 - pout * 170 });
      O(v, pin > 0 && pout < 1 ? 1 : 0);
    });
    const itIn = E.outExpo(inv(5.96, 6.34, t));
    T(S.it, { x: xNow + wNow, y: (1 - itIn) * 60 });
    O(S.it, itIn);

    // ---- steps ----
    S.steps.forEach((n, i) => {
      const on = E.back(2.5)(inv(TK[i] - 0.05, TK[i] + 0.2, t));
      const done = inv(TK[i] + 0.9, TK[i] + 1.05, t);
      const cur = on * (1 - done);
      n.style.background = on > 0.01 ? C.orange : '#3A322D';
      O(n, (on > 0.01 ? 1 - done * 0.45 : 1) * inv(5.9, 6.1, t));
      T(n, { s: 1 + cur * 0.35, r: cur * 45 });
      n.style.boxShadow = cur > 0.1 ? `0 0 ${24 * cur}px rgba(254,77,30,.9)` : 'none';
    });

    // ---- card bump ----
    let bump = 0;
    for (let i = 1; i < 6; i++) { const d = t - TK[i]; if (d > -0.05 && d < 0.8) bump += (1 - R.spring(d + 0.05, 0.35, 22)) * 0.018; }
    T(S.card, { s: 1 - bump, y: R.noise(t * 0.5, 7) * 6, r: R.noise(t * 0.4, 9) * 0.6 });
    O(S.cardGlow, 0.25 + 0.55 * R.env(t, 5.95, 6.1, 6.2, 6.5));

    // ---- stage layers (cascade in / out) ----
    for (const Ly of layers) {
      const vis = t >= Ly.t0 - 0.2 && t <= Ly.t1 + 0.25;
      R.show(Ly.L, vis);
      if (!vis) continue;
      const stg = Math.min(0.016, 0.3 / Ly.items.length);
      for (const it of Ly.items) {
        const tin = Ly.t0 - 0.02 + it.j * stg;
        const p = E.outCubic(inv(tin, tin + 0.36, t));
        const tout = Ly.t1 - 0.2 + it.j * stg * 0.4;
        const q = E.inCubic(inv(tout, tout + 0.16, t));
        T(it.n, { y: (1 - p) * 34 - q * 26, s: lerp(0.96, 1, p) });
        O(it.n, p * (1 - q));
        if (it.anim) it.anim(it.n, t, p, q);
      }
    }
    R.show(S.divider, true);
    O(S.divider, inv(5.95, 6.2, t));

    // stage specific updates
    // SELL: atlas card slides up, weighted value counts
    T(S.atlas, { y: -128 * E.inOutCubic(inv(6.55, 6.85, t)) });
    const wv = lerp(293200, 312400, E.outCubic(inv(6.55, 6.9, t)));
    S.pipeMeta.innerHTML = 'WEIGHTED <span style="color:#FF9B78">₼ ' + R.fmt(Math.round(wv / 100) * 100) + '</span>';
    // STAFF: rebalancing
    const moved = t >= 8.74;
    const m = S.alloc['1:2'], tu = S.alloc['3:2'];
    const mv = moved ? 100 : 130, tv = moved ? 90 : 60;
    if (m.n._v !== mv) { m.n.textContent = mv + '%'; paintAlloc(m.n, mv); m.n._v = mv; }
    if (tu.n._v !== tv) { tu.n.textContent = tv + '%'; paintAlloc(tu.n, tv); tu.n._v = tv; }
    const warn = !moved ? 0.5 + 0.5 * Math.sin(t * 28) : 0;
    m.n.style.boxShadow = warn ? `0 0 ${20 * warn}px rgba(254,77,30,.9)` : 'none';
    // TRACK: typing
    const typed = Math.floor(clamp(inv(9.08, 9.52, t)) * 15.999);
    let sum = 0;
    S.tsCells.forEach((c) => {
      const on = c.idx < typed || t > 9.53;
      const txt = on ? (c.v === 0 ? '–' : String(c.v)) : '';
      if (c.c._v !== txt) { c.c.textContent = txt; c.c._v = txt; }
      if (on) sum += c.v;
      const cur = c.idx === typed && t < 9.53 && t > 9.05;
      c.c.style.borderColor = cur ? C.orange : 'transparent';
      c.c.style.color = c.v === 0 ? '#6d625a' : '#F2EDE9';
    });
    S.tsTotals.forEach((tt, r) => {
      let s = 0;
      tt.vals.forEach((v, i) => { if (r * 5 + i < typed || t > 9.53) s += v; });
      const txt = s ? String(s) : '';
      if (tt.n._v !== txt) { tt.n.textContent = txt; tt.n._v = txt; }
    });
    S.tsMeta.innerHTML = '<span style="color:#FF9B78">' + sum.toFixed(1) + ' H</span> LOGGED';
    // BILL: PAID stamp
    const ps = t - 10.52;
    if (ps > 0) {
      const p = clamp(ps / 0.14);
      T(S.paid, { s: ps < 0.14 ? lerp(2.6, 0.96, E.inQuad(p)) : 0.96 + 0.04 * R.spring(ps - 0.14, 0.35, 30), r: -11 - (1 - p) * 8 });
      O(S.paid, clamp(ps / 0.04) * (1 - inv(TK[5] - 0.15, TK[5], t)));
    } else O(S.paid, 0);
    // GROW: margin counter
    const mg = Math.round(38 * E.outCubic(inv(11.1, 11.6, t)));
    S.mgMeta.innerHTML = 'MARGIN <span style="color:#FF9B78">' + mg + '%</span>';

    // ---- token ----
    const rk = rectAt(t);
    const [x, y, w, h, rad] = rk.r;
    // perpendicular arc offset for organic motion
    const ay = -rk.arc;
    const tokIn = E.back(1.8)(inv(6.0, 6.3, t));
    const tokOut = 0;
    Object.assign(S.token.style, { left: x.toFixed(2) + 'px', top: (y + ay).toFixed(2) + 'px', width: w.toFixed(2) + 'px', height: h.toFixed(2) + 'px', borderRadius: rad.toFixed(2) + 'px' });
    T(S.token, { s: tokIn * (1 - tokOut * 0.3), r: rk.moving ? Math.sin(Math.PI * rk.p) * 5 : 0 });
    O(S.token, (t < 6.0 ? 0 : 1) * (1 - tokOut));
    S.token.style.transformOrigin = 'center';
    // bar grows from bottom when it becomes the chart bar
    // label crossfades
    const labW = {
      deal: 1 - inv(6.9, 7.0, t),
      dev: inv(7.16, 7.28, t) * (1 - inv(7.9, 8.0, t)),
      chip: inv(8.16, 8.28, t) * (1 - inv(8.9, 9.0, t)),
      pill: inv(9.16, 9.28, t) * (1 - inv(9.9, 10.0, t)),
      total: inv(10.16, 10.28, t) * (1 - inv(10.9, 11.0, t)),
      bar: inv(11.22, 11.34, t),
    };
    for (const kk in S.labs) O(S.labs[kk], labW[kk]);
    O(S.won, inv(6.72, 6.8, t));
    T(S.won, { s: E.back(2.4)(inv(6.72, 6.92, t)) });
    O(S.sub, 1 - inv(9.56, 9.62, t));
    O(S.ok, inv(9.56, 9.62, t));
    const okPulse = R.env(t, 9.56, 9.62, 9.62, 9.9);
    S.token.style.boxShadow = `0 18px 50px rgba(254,77,30,${0.45 + okPulse * 0.4}), 0 0 ${okPulse * 60}px rgba(254,77,30,.9), inset 0 1px 0 rgba(255,255,255,.35)`;

    // ---- caption decode ----
    const ci = k;
    const cp = inv(TK[ci] - 0.05, TK[ci] + 0.35, t);
    const txt = R.decode(CAPS[ci], cp, ci + 1, t);
    if (S.cap._v !== txt) { S.cap.textContent = txt; S.cap._v = txt; }
    O(S.cap, inv(5.95, 6.1, t));
  };

  window.SCENES.push(S);
})();
