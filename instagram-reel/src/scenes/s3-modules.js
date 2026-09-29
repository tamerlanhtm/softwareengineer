/* SCENE 3 — SCALE (bars 5–6, 7.5 → 11.25 s)
 * The mark becomes the centre block of a 5×6 grid: 30 module tiles. Icons light
 * up in a diagonal sweep while the counter runs to 30. Then every tile sorts
 * itself into its group row — 8 groups; add-ons drawn hollow, like the logo. */

const GROUPS = [
  { key: 'supply', addon: false, mods: [['suppliers', 'building-2'], ['contracts', 'file-signature'], ['services', 'package'], ['allotments', 'calendar-range']] },
  { key: 'product', addon: false, mods: [['tours', 'map'], ['departures', 'plane-takeoff'], ['pricing', 'percent']] },
  { key: 'sales', addon: false, mods: [['enquiries', 'inbox'], ['reservations', 'calendar-check'], ['passengers', 'id-card'], ['payments', 'credit-card'], ['activities', 'list-checks']] },
  { key: 'ops', addon: true, mods: [['operations', 'kanban'], ['manifests', 'clipboard-list'], ['resources', 'bus']] },
  { key: 'finance', addon: false, mods: [['invoices', 'receipt'], ['supplier_bills', 'hand-coins'], ['fx', 'arrow-left-right'], ['margins', 'trending-up']] },
  { key: 'partners', addon: true, mods: [['agents', 'handshake'], ['agent_portal', 'store']] },
  { key: 'analytics', addon: false, mods: [['dashboard', 'layout-dashboard'], ['reports', 'chart-column']] },
  { key: 'admin', addon: false, mods: [['documents', 'folder-open'], ['users_roles', 'user-cog'], ['settings', 'settings'], ['integrations', 'plug'], ['automation', 'workflow'], ['custom_fields', 'text-cursor-input'], ['communications', 'megaphone']] },
];

const GRID = { s: 124, pitch: 146, x0: 248, y0: 648 };       // layout A cell centres
const ROWS = { s: 56, pitch: 64, x0: 560, y0: 604, rowH: 104 }; // layout B
const TILE_SCALE_B = ROWS.s / GRID.s;
const enquiriesTileAt = () => ({ x: ROWS.x0, y: ROWS.y0 + 2 * ROWS.rowH, s: ROWS.s });

function buildModules(tl) {
  const S = scene('s3');
  S.innerHTML = `
    <div class="s2-bg"></div>
    <div class="s3-kicker"><span class="mask"><span>${L.modules.kicker}</span></span></div>
    <div class="s3-head a"><span class="mask"><span><b class="s3-num tnum">0</b> ${L.modules.modules}</span></span></div>
    <div class="s3-head b"><span class="mask"><span><b class="s3-num">8</b> ${L.modules.groups}</span></span></div>
    <div class="s3-tiles"></div>
    <div class="s3-labels"></div>`;
  tl.set(S, { autoAlpha: 1 }, B(15.75));
  tl.set(S, { autoAlpha: 0 }, B(24.2));

  /* ── tiles: add-ons live in hollow cells ───────────── */
  const hollowCells = ['0,4', '2,0', '3,3', '4,1', '5,4'];
  const base = [], addon = [];
  GROUPS.forEach((g, gi) => g.mods.forEach(([key, ic], k) => (g.addon ? addon : base).push({ key, ic, gi, k, addon: g.addon })));
  const cells = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) cells.push({ r, c });
  const tiles = [];
  let bi = 0, ai = 0;
  for (const cell of cells) {
    const m = hollowCells.includes(`${cell.r},${cell.c}`) ? addon[ai++] : base[bi++];
    const node = el(`<div class="tile ${m.addon ? 'hollow' : ''}"><div class="tile-ic">${icon(m.ic, m.addon ? 34 : 54, 2)}</div></div>`);
    $('.s3-tiles', S).appendChild(node);
    const A = { x: GRID.x0 + cell.c * GRID.pitch, y: GRID.y0 + cell.r * GRID.pitch };
    const Bp = { x: ROWS.x0 + m.k * ROWS.pitch, y: ROWS.y0 + m.gi * ROWS.rowH };
    const inBlock = cell.r >= 1 && cell.r <= 3 && cell.c >= 1 && cell.c <= 3;
    tiles.push({ node, ...m, ...cell, A, Bp, inBlock, hero: inBlock ? (cell.r - 1) * 3 + (cell.c - 1) : -1 });
  }
  tiles.forEach((t) => gsap.set(t.node, { x: t.A.x, y: t.A.y, scale: 0, autoAlpha: 0 }));
  gsap.set($$('.tile-ic', S), { scale: 0 });

  /* ── the mark flies into the centre block ──────────── */
  const blockC = { x: GRID.x0 + 2 * GRID.pitch, y: GRID.y0 + 2 * GRID.pitch };
  for (let i = 0; i < 9; i++) {
    tl.to(HEROES[i], { ...logoVars(i, blockC.x, blockC.y, GRID.s, GRID.pitch / GRID.s), duration: B(0.8), ease: 'power3.inOut' }, B(15.7) + (8 - i) * 0.015);
  }
  cue('whoosh', B(15.7), { dir: 'down' });
  const swapT = B(16.75);
  tl.set(HEROES, { autoAlpha: 0 }, swapT);
  tiles.filter((t) => t.inBlock).forEach((t) => tl.set(t.node, { autoAlpha: 1, scale: 1 }, swapT));

  // Remaining 21 tiles pop outward from the block.
  const others = tiles.filter((t) => !t.inBlock)
    .map((t) => ({ t, d: Math.hypot(t.A.x - blockC.x, t.A.y - blockC.y) }))
    .sort((a, b) => a.d - b.d);
  others.forEach(({ t }, k) => {
    const t0 = B(16.1) + k * 0.028;
    tl.set(t.node, { autoAlpha: 1 }, t0);
    tl.fromTo(t.node, { scale: 0, rotation: -60 }, { scale: 1, rotation: 0, duration: 0.42, ease: 'back.out(2)', immediateRender: false }, t0);
  });
  cue('popcascade', B(16.1), { n: 21, dur: 21 * 0.028 });

  /* ── icons light up, counter runs to 30 ────────────── */
  const order = tiles.slice().sort((a, b) => (a.r + a.c) - (b.r + b.c) || a.r - b.r);
  const i0 = B(17), i1 = B(19);
  order.forEach((t, k) => {
    tl.to($('.tile-ic', t.node), { scale: 1, duration: 0.3, ease: 'back.out(3)' }, i0 + (k / 30) * (i1 - i0));
  });
  const num = $('.s3-head.a .s3-num', S);
  onFrame((t) => {
    const n = t < i0 ? 0 : Math.min(30, 1 + Math.floor(((t - i0) / (i1 - i0)) * 30));
    if (num.__n !== n) { num.textContent = String(n); num.__n = n; }
  });
  cue('countroll', i0, { to: i1, n: 30 });
  const headA = $('.s3-head.a .mask > span', S), headB = $('.s3-head.b .mask > span', S), kick = $('.s3-kicker .mask > span', S);
  gsap.set([headA, headB, kick], { yPercent: 110 });
  tl.to(headA, { yPercent: 0, duration: 0.6, ease: 'expo.out' }, B(16.25));
  tl.fromTo(num, { scale: 1 }, { scale: 1.18, duration: 0.08, ease: 'power2.out', yoyo: true, repeat: 1, immediateRender: false }, i1);
  cue('ding', i1);

  /* ── sort into 8 group rows ────────────────────────── */
  tl.to(headA, { yPercent: -110, duration: 0.3, ease: 'power3.in' }, B(19.6));
  tl.to(headB, { yPercent: 0, duration: 0.6, ease: 'expo.out' }, B(19.6) + 0.25);
  tl.to(kick, { yPercent: 0, duration: 0.5, ease: 'expo.out' }, B(19.6) + 0.35);
  const sorted = tiles.slice().sort((a, b) => a.gi - b.gi || a.k - b.k);
  sorted.forEach((t, n) => {
    tl.to(t.node, { x: t.Bp.x, y: t.Bp.y, scale: TILE_SCALE_B, duration: B(1.1), ease: 'power3.inOut' }, B(19.9) + n * 0.011);
  });
  cue('shuffle', B(19.9), { dur: B(1.1) + 0.33 });

  const labels = $('.s3-labels', S);
  GROUPS.forEach((g, gi) => {
    const row = el(`<div class="grp ${g.addon ? 'addon' : ''}" style="top:${ROWS.y0 + gi * ROWS.rowH - 34}px">
        <div class="grp-name">${L.modules.labels[gi]}</div><div class="grp-tag">${g.addon ? L.modules.addon : L.modules.core} · ${g.mods.length}</div></div>`);
    labels.appendChild(row);
    tl.fromTo(row, { x: -60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.5, ease: 'expo.out', immediateRender: false }, B(20.6) + gi * 0.05);
  });
  gsap.set($$('.grp', labels), { autoAlpha: 0 });
  fitWidth($$('.grp-name', labels), 430);   // label column ends before the tiles

  /* ── exit: everything clears except the Enquiries tile ─ */
  const enq = tiles.find((t) => t.key === 'enquiries');
  tl.to($$('.grp', labels), { x: -40, autoAlpha: 0, duration: 0.25, ease: 'power2.in', stagger: 0.02 }, B(23));
  tl.to([headB, kick], { yPercent: -110, duration: 0.28, ease: 'power3.in' }, B(23));
  tiles.filter((t) => t !== enq).forEach((t, n) => {
    tl.to(t.node, { scale: 0, duration: 0.24, ease: 'power3.in' }, B(23) + ((n * 7) % 13) * 0.012);
  });
  tl.set(enq.node, { autoAlpha: 0 }, B(23.25));
}
