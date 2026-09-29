/* SCENE 4 — THE JOURNEY (bars 7–12, 11.25 → 22.5 s)
 * The Enquiries tile opens into a full product card; a camera then whip-pans
 * along an orange flow line through six modules, one per bar:
 * enquiry → itinerary → pricing → departure → operations → voucher.
 * Every card plays a real micro-interaction from the module spec. */

const CARD_POS = [[540, 1010], [1180, 2190], [540, 3370], [-100, 4550], [540, 5730], [1180, 6910]];
const ARRIVE = (i) => B(24 + 4 * i);
const MOVE = B(0.875);
const CAM_ANCHOR = { x: 540, y: 1010 };
const BENTO_C = { x: 540, y: 1010 };            // bento grid centre on screen
const BENTO_TILE = 300;
const BENTO_SCALE = BENTO_TILE / 880;
const ZOOM_OUT = [B(47.25), B(48.3)];

function journeyCam(t) {
  let x = CARD_POS[0][0], y = CARD_POS[0][1], s = 1, r = 0;
  for (let i = 1; i < CARD_POS.length; i++) {
    const t1 = ARRIVE(i), t0 = t1 - MOVE;
    if (t >= t1) { x = CARD_POS[i][0]; y = CARD_POS[i][1]; continue; }
    if (t > t0) {
      const p = (t - t0) / MOVE, e = E.inOutQuart(p), bump = Math.sin(Math.PI * p);
      x = lerp(CARD_POS[i - 1][0], CARD_POS[i][0], e);
      y = lerp(CARD_POS[i - 1][1], CARD_POS[i][1], e);
      s = 1 - 0.17 * bump;
      r = (i % 2 ? 1 : -1) * 3.2 * bump;
    }
    break;
  }
  if (t > ZOOM_OUT[0]) {   // pull back: card 6 becomes the centre bento tile
    const p = inv(ZOOM_OUT[0], ZOOM_OUT[1], t), e = E.inOutCubic(p);
    const C5 = CARD_POS[5];
    s = Math.exp(lerp(0, Math.log(BENTO_SCALE), e));   // log-space dolly
    // card centre slides from the camera anchor to the bento centre
    x = C5[0];
    y = C5[1] - lerp(0, BENTO_C.y - CAM_ANCHOR.y, e) / s;
    r = 0;
  }
  return { x, y, s, r };
}

function hudStep(tl, kicker, lines, tIn, tOut) {
  const hud = document.getElementById('hud');
  const k = el(`<div class="hud-kicker"><span class="mask"><span>${kicker}</span></span></div>`);
  const tt = el(`<div class="hud-title">${maskLines(lines)}</div>`);
  hud.append(k, tt);
  const kIn = $('.mask > span', k), lIn = $$('.mask > span', tt);
  gsap.set([kIn, ...lIn], { yPercent: 115 });
  tl.to(kIn, { yPercent: 0, duration: 0.45, ease: 'expo.out' }, tIn);
  tl.to(lIn, { yPercent: 0, duration: 0.6, ease: 'expo.out', stagger: 0.07 }, tIn + 0.05);
  if (tOut != null) tl.to([kIn, ...lIn], { yPercent: -115, duration: 0.22, ease: 'power3.in', stagger: 0.025 }, tOut);
  fitWidth(tt, 880);
  return { k, tt };
}

const CURSOR_SVG = `<svg class="cursor" viewBox="0 0 32 44"><path d="M2 2 L2 36 L11 28 L17.5 42 L24 39 L17.5 25.5 L29 25.5 Z" fill="#fff" stroke="#151110" stroke-width="2.6" stroke-linejoin="round"/></svg>`;

function makeCard(i, ic, name, group, route, body, addon = false) {
  const [x, y] = CARD_POS[i];
  const c = el(`<div class="card c${i}" style="left:${x - 440}px;top:${y - 440}px">
      <div class="card-top">
        <div class="mod-ic ${addon ? 'hollow' : ''}">${icon(ic, 34, 2.2)}</div>
        <div><div class="mod-name">${name}</div><div class="mod-group">${group}${addon ? ` <span class="addon-tag">${L.addonTag}</span>` : ''}</div></div>
        <div class="route">/a/caspian/<b>${route}</b></div>
      </div>
      <div class="card-div"></div>
      <div class="card-body">${body}</div></div>`);
  fitWidth($('.mod-name', c), 400);
  return c;
}

function buildJourney(tl) {
  const S = scene('s4');
  S.innerHTML = `
    <div class="s4-back"><div class="s4-bg"></div><div class="s4-dots"></div><div class="s4-glow"></div></div>
    <div class="s4-cam"><svg class="s4-flow" width="1" height="1"><defs>
      <filter id="fglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="fdot" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="10"/></filter></defs></svg></div>
    <div class="s4-morph"><div class="s4-morph-ic">${icon('inbox', 30, 2.2)}</div></div>`;
  const cam = $('.s4-cam', S), dots = $('.s4-dots', S), flow = $('.s4-flow', S);
  tl.set(S, { autoAlpha: 1 }, B(23.2));
  tl.set(S, { autoAlpha: 0 }, B(56.6));

  /* ── tile → card morph, dark world floods in ───────── */
  const tile = enquiriesTileAt();
  const morph = $('.s4-morph', S);
  gsap.set(morph, { x: tile.x, y: tile.y, width: tile.s, height: tile.s, borderRadius: 0.18 * tile.s, backgroundColor: COLORS.or, xPercent: -50, yPercent: -50 });
  tl.set(morph, { autoAlpha: 1 }, B(23.25));
  tl.to(morph, { x: 540, y: 1010, width: 880, height: 880, borderRadius: 48, backgroundColor: COLORS.ink2, duration: B(0.8), ease: 'expo.inOut' }, B(23.25));
  tl.to('.s4-morph-ic', { scale: 0, autoAlpha: 0, duration: 0.15 }, B(23.3));
  tl.set(morph, { autoAlpha: 0 }, B(24.05));
  gsap.set('.s4-back', { clipPath: `circle(0px at ${tile.x}px ${tile.y}px)` });
  tl.to('.s4-back', { clipPath: `circle(2300px at ${tile.x}px ${tile.y}px)`, duration: B(0.8), ease: 'power2.in' }, B(23.3));
  cue('whoosh', B(23.2), { dir: 'zoom' });

  /* ── camera + parallax dots ─────────────────────────── */
  onFrame((t) => {
    if (t < B(23) || t > B(57)) return;
    const c = journeyCam(t);
    cam.style.transform = `translate(${CAM_ANCHOR.x}px, ${CAM_ANCHOR.y}px) rotate(${c.r.toFixed(3)}deg) scale(${c.s.toFixed(5)}) translate(${(-c.x).toFixed(2)}px, ${(-c.y).toFixed(2)}px)`;
    const ds = 56 * Math.max(0.6, c.s);
    dots.style.backgroundSize = `${ds.toFixed(2)}px ${ds.toFixed(2)}px`;
    dots.style.backgroundPosition = `${(-c.x * 0.45 * c.s).toFixed(1)}px ${(-c.y * 0.45 * c.s).toFixed(1)}px`;
  });

  /* ── flow line between cards ───────────────────────── */
  const NS = 'http://www.w3.org/2000/svg';
  const segs = [];
  for (let i = 1; i < CARD_POS.length; i++) {
    const [x0, y0] = CARD_POS[i - 1], [x1, y1] = CARD_POS[i];
    const a = [x0, y0 + 440], b = [x1, y1 - 440];
    const d = `M${a[0]} ${a[1]} C${a[0]} ${a[1] + 170} ${b[0]} ${b[1] - 170} ${b[0]} ${b[1]}`;
    const glow = document.createElementNS(NS, 'path'); glow.setAttribute('d', d); glow.setAttribute('class', 'flow-glow');
    const line = document.createElementNS(NS, 'path'); line.setAttribute('d', d); line.setAttribute('class', 'flow-line');
    const dot = document.createElementNS(NS, 'g'); dot.setAttribute('class', 'flow-dot');
    dot.innerHTML = '<circle r="30" fill="#FE4D1E" opacity=".75" filter="url(#fdot)"/><circle r="11" fill="#fff"/>';
    glow.setAttribute('filter', 'url(#fglow)');
    flow.append(glow, line, dot);
    const len = line.getTotalLength();
    segs.push({ glow, line, dot, len, t0: ARRIVE(i) - MOVE - 0.05, t1: ARRIVE(i) - 0.08 });
  }
  onFrame((t) => {
    for (const s of segs) {
      const p = E.inOutCubic(inv(s.t0, s.t1, t));
      const off = (s.len * (1 - p)).toFixed(1);
      for (const pth of [s.line, s.glow]) { pth.style.strokeDasharray = `${s.len} ${s.len}`; pth.style.strokeDashoffset = off; }
      const pt = s.line.getPointAtLength(s.len * p);
      s.dot.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      s.dot.style.opacity = p > 0 && p < 1 ? 1 : 0;
    }
  });
  for (let i = 1; i < CARD_POS.length; i++) cue('whip', ARRIVE(i) - MOVE, { to: ARRIVE(i), i });

  const cards = [card1(tl), card2(tl), card3(tl), card4(tl), card5(tl), card6(tl)];
  cards.forEach((c) => cam.appendChild(c));
  // A card is only on screen while the camera is on it or travelling to/from it,
  // so neighbours never peek into the frame during holds.
  tl.set(cards, { autoAlpha: 0 }, 0);
  cards.forEach((c, i) => {
    tl.set(c, { autoAlpha: 1 }, i === 0 ? B(24.05) : ARRIVE(i) - MOVE - 0.03);
    if (i < cards.length - 1) tl.set(c, { autoAlpha: 0 }, ARRIVE(i + 1) + 0.02);
  });
  // Before pulling back to the bento, clear everything but card 6.
  tl.to(flow, { autoAlpha: 0, duration: 0.2 }, B(47));
  // Counter-scale the corner radius so on screen it lands on the bento tile radius.
  tl.to(cards[5], { borderRadius: 40 / BENTO_SCALE, duration: ZOOM_OUT[1] - ZOOM_OUT[0], ease: (p) => {
    const s = Math.exp(lerp(0, Math.log(BENTO_SCALE), E.inOutCubic(p)));
    return (lerp(48, 40, E.inOutCubic(p)) / s - 48) / (40 / BENTO_SCALE - 48);
  } }, ZOOM_OUT[0]);

  /* ── HUD headlines ─────────────────────────────────── */
  const H = L.hud;
  H.forEach(([k, lines], i) => {
    const tIn = i === 0 ? B(23.6) : ARRIVE(i) - B(0.45);
    const tOut = ARRIVE(i + 1) - MOVE - 0.02;
    hudStep(tl, k, lines, tIn, tOut);
  });
}

/* ═════════════════════ 01 · Enquiries & Quotes ═════════════════════ */
function card1(tl) {
  const T = L.card1;
  const opt = ([n, d, p], k) => `<div class="opt ${k === 1 ? 'best' : ''}"><b>${'ABC'[k]}</b><div class="opt-tx"><div class="opt-n">${n}${k === 1 ? ` <span class="pill or">${T.best}</span>` : ''}</div><div class="opt-d">${d}</div></div><div class="opt-p">${p}<small>${T.pp}</small></div></div>`;
  const c = makeCard(0, 'inbox', T.name, T.group, 'enquiries', `
    <div class="enq-row">
      <div class="avatar">AK</div>
      <div class="enq-who"><div class="enq-name">Aylin Kaya</div><div class="enq-meta">${T.meta}</div></div>
      <span class="pill or">${T.fresh}</span>
    </div>
    <div class="enq-chips">
      <span class="chip">${icon('map-pin', 24, 2.2)}${T.chips[0]}</span>
      <span class="chip">${icon('calendar-days', 24, 2.2)}${T.chips[1]}</span>
      <span class="chip">${icon('users', 24, 2.2)}${T.chips[2]}</span>
    </div>
    <div class="label enq-lbl">${T.label}</div>
    <div class="opts">
      ${T.opts.map(opt).join('\n      ')}
    </div>
    <div class="btn-cta"><span class="a">${T.btn} ${icon('arrow-right', 30, 2.6)}</span><span class="b">${icon('circle-check-big', 32, 2.4)} ${T.done}</span></div>
    ${CURSOR_SVG}<div class="ripple"></div>`);
  const T0 = ARRIVE(0);
  tl.from($('.card-top', c), { autoAlpha: 0, x: -24, duration: 0.45, ease: 'expo.out' }, T0);
  tl.from($('.enq-row', c), { autoAlpha: 0, y: 40, duration: 0.5, ease: 'expo.out' }, T0 + B(0.15));
  tl.from($$('.enq-chips .chip', c), { autoAlpha: 0, scale: 0.6, duration: 0.4, ease: 'back.out(2.2)', stagger: B(0.25) }, T0 + B(0.5));
  $$('.enq-chips .chip', c).forEach((_, k) => cue('tick', T0 + B(0.5 + 0.25 * k)));
  tl.from($('.enq-lbl', c), { autoAlpha: 0, duration: 0.3 }, T0 + B(1.1));
  tl.from($$('.opt', c), { autoAlpha: 0, x: 120, duration: 0.5, ease: 'expo.out', stagger: B(0.25) }, T0 + B(1.2));
  $$('.opt', c).forEach((_, k) => cue('swish', T0 + B(1.2 + 0.25 * k)));
  tl.from($('.opt.best', c), { '--glow': 0, duration: 0.4 }, T0 + B(2));
  tl.from($('.btn-cta', c), { autoAlpha: 0, y: 30, duration: 0.45, ease: 'expo.out' }, T0 + B(1.8));
  const cur = $('.cursor', c), rip = $('.ripple', c);
  gsap.set(cur, { x: 700, y: 700, autoAlpha: 0 });
  tl.to(cur, { autoAlpha: 1, duration: 0.1 }, T0 + B(2.0));
  tl.to(cur, { x: 520, y: 606, duration: B(0.72), ease: 'power3.inOut' }, T0 + B(2.0));
  const click = T0 + B(2.75);
  tl.to(cur, { scale: 0.82, duration: 0.07, ease: 'power2.out', yoyo: true, repeat: 1 }, click - 0.03);
  gsap.set(rip, { x: 530, y: 612, scale: 0.2, autoAlpha: 0 });
  tl.fromTo(rip, { scale: 0.2, autoAlpha: 0.9 }, { scale: 1.6, autoAlpha: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }, click);
  tl.to($('.btn-cta', c), { scale: 0.965, duration: 0.07, yoyo: true, repeat: 1 }, click - 0.02);
  tl.to($('.btn-cta', c), { backgroundColor: COLORS.green, duration: 0.25 }, click + 0.05);
  tl.to($('.btn-cta .a', c), { yPercent: -140, autoAlpha: 0, duration: 0.25, ease: 'power3.in' }, click + 0.03);
  gsap.set($('.btn-cta .b', c), { yPercent: 140, autoAlpha: 0 });
  tl.to($('.btn-cta .b', c), { yPercent: 0, autoAlpha: 1, duration: 0.4, ease: 'expo.out' }, click + 0.12);
  tl.to(cur, { autoAlpha: 0, duration: 0.2 }, click + B(0.6));
  cue('click', click); cue('success', click + 0.1);
  return c;
}

/* ═════════════════════ 02 · Itinerary builder ═════════════════════ */
function card2(tl) {
  const T = L.card2;
  const days = T.plan;
  const c = makeCard(1, 'map', T.name, T.group, 'tours', `
    <div class="it-head"><div class="it-title">${T.title}</div><span class="pill or">${T.days}</span></div>
    <div class="it-rail"><i></i></div>
    <div class="it-days">${days.map(([d, svcs], k) => `
      <div class="day"><div class="day-b">${T.badges[k]}</div><div class="day-c"><div class="day-t">${d}</div>
      <div class="svc-row">${svcs.map(([ic, n]) => `<span class="chip svc">${icon(ic, 24, 2.2)}${n}</span>`).join('')}</div></div></div>`).join('')}
    </div>
    <div class="it-foot">${icon('plus', 22, 2.4)} ${T.foot[0]} <span>·</span> ${icon('check', 22, 2.6)} ${T.foot[1]} <span>·</span> ${icon('check', 22, 2.6)} ${T.foot[2]}</div>`);
  const T0 = ARRIVE(1);
  tl.from($('.it-head', c), { autoAlpha: 0, y: 24, duration: 0.45, ease: 'expo.out' }, T0);
  tl.from($('.it-rail i', c), { scaleY: 0, duration: B(2.4), ease: 'power2.inOut' }, T0 + B(0.2));
  $$('.day', c).forEach((d, k) => {
    const t0 = T0 + B(0.25 + k * 0.55);
    tl.from($('.day-b', d), { scale: 0, duration: 0.35, ease: 'back.out(2.5)' }, t0);
    tl.from($('.day-t', d), { autoAlpha: 0, x: -20, duration: 0.4, ease: 'expo.out' }, t0 + 0.04);
    $$('.svc', d).forEach((s, j) => {
      const ts = t0 + B(0.2 + j * 0.25);
      tl.from(s, { autoAlpha: 0, x: 220, y: -30, rotation: 8, duration: 0.45, ease: 'back.out(1.6)' }, ts);
      cue('drop', ts + 0.12, { k: k * 2 + j });
    });
  });
  tl.from($('.it-foot', c), { autoAlpha: 0, y: 16, duration: 0.4, ease: 'expo.out' }, T0 + B(2.7));
  return c;
}

/* ═════════════════════ 03 · Pricing & Markup ═════════════════════ */
function card3(tl) {
  const T = L.card3;
  const segs = [46, 18, 14, 10, 12].map((w, k) => [T.segs[k], w]);
  const c = makeCard(2, 'percent', T.name, T.group, 'pricing', `
    <div class="pr-head"><div class="pr-title">${T.title}</div><span class="pill or">${T.pill}</span></div>
    <div class="pr-bar">${segs.map(([n, w], k) => `<i class="s${k}" style="width:${w}%"></i>`).join('')}</div>
    <div class="pr-legend">${segs.map(([n], k) => `<span><i class="d${k}"></i>${n}</span>`).join('')}</div>
    <div class="pr-rows">
      <div class="pr-row"><span>${T.rows[0]}</span><b class="pr-cost tnum">${L.money(0)}</b></div>
      <div class="pr-row"><span>${T.rows[1]}</span><span class="pill or pr-mk">+18%</span></div>
      <div class="pr-sep"></div>
      <div class="pr-row big"><span>${T.rows[2]}</span><b class="pr-sell tnum">${L.money(17760)}</b></div>
      <div class="pr-row"><span>${T.rows[3]}</span><span class="pr-right"><span class="pill green pr-mg">${T.margin}</span><b class="pr-pp tnum">${L.money(1254)}</b></span></div>
    </div>`);
  fitWidth($('.pr-sell', c), 520);   // sized at the widest value it counts to
  const T0 = ARRIVE(2);
  tl.from($('.pr-head', c), { autoAlpha: 0, y: 24, duration: 0.45, ease: 'expo.out' }, T0);
  const bars = $$('.pr-bar i', c);
  bars.forEach((b, k) => {
    tl.from(b, { scaleX: 0, duration: B(0.3), ease: 'power2.out' }, T0 + B(0.25 + k * 0.25));
    cue('tick', T0 + B(0.25 + k * 0.25), { k });
  });
  tl.from($$('.pr-legend span', c), { autoAlpha: 0, y: 10, duration: 0.3, stagger: B(0.25) }, T0 + B(0.3));
  tl.from($$('.pr-row, .pr-sep', c), { autoAlpha: 0, y: 20, duration: 0.4, ease: 'expo.out', stagger: 0.05 }, T0 + B(0.35));
  countUp($('.pr-cost', c), T0 + B(0.25), T0 + B(1.55), 0, 15050, L.money, (p) => p);
  tl.from($('.pr-mk', c), { scale: 0, duration: 0.4, ease: 'back.out(3)' }, T0 + B(1.75));
  cue('pop', T0 + B(1.75), { note: 4 });
  countUp($('.pr-sell', c), T0 + B(2), T0 + B(2.8), 15050, 17760, L.money, E.outCubic);
  countUp($('.pr-pp', c), T0 + B(2), T0 + B(2.8), 1254, 1480, L.money, E.outCubic);
  cue('countroll', T0 + B(2), { to: T0 + B(2.8), n: 14 });
  tl.fromTo($('.pr-sell', c), { textShadow: '0 0 0px rgba(254,77,30,0)' }, { textShadow: '0 0 40px rgba(254,77,30,.9)', duration: 0.12, yoyo: true, repeat: 1, immediateRender: false }, T0 + B(2.8));
  tl.from($('.pr-mg', c), { scale: 0, autoAlpha: 0, duration: 0.4, ease: 'back.out(2.5)' }, T0 + B(2.9));
  cue('ding', T0 + B(2.85));
  return c;
}

/* ═════════════════════ 04 · Departures & Seats ═════════════════════ */
function card4(tl) {
  const seats = Array.from({ length: 24 }, (_, k) => k);
  const T = L.card4;
  const c = makeCard(3, 'plane-takeoff', T.name, T.group, 'departures', `
    <div class="dp-head"><div><div class="dp-title">${T.title}</div><div class="dp-sub">${T.sub}</div></div>
      <div class="dp-st"><span class="pill amber a">${T.onRequest}</span><span class="pill green b">${icon('check', 18, 3)} ${T.guaranteed}</span></div></div>
    <div class="seats">${seats.map((k) => `<i style="left:${(k % 4) * 74 + (k % 4 > 1 ? 40 : 0)}px;top:${Math.floor(k / 4) * 74}px"></i>`).join('')}</div>
    <div class="dp-side">
      <div class="label">${T.sold}</div>
      <div class="dp-count"><b class="tnum">0</b><span>/24</span></div>
      <div class="dp-bar"><i class="fill"></i><i class="min"></i></div>
      <div class="dp-min">${T.min}</div>
      <div class="dp-meta">${icon('clock', 24, 2.2)} ${T.cutoff}</div>
      <div class="dp-meta">${icon('hotel', 24, 2.2)} ${T.allot}</div>
    </div>`);
  const T0 = ARRIVE(3);
  tl.from($('.dp-head', c), { autoAlpha: 0, y: 24, duration: 0.45, ease: 'expo.out' }, T0);
  tl.from($$('.seats i', c), { scale: 0, duration: 0.3, ease: 'back.out(2)', stagger: { each: 0.008, from: 'start' } }, T0 + B(0.1));
  tl.from($('.dp-side', c), { autoAlpha: 0, x: 30, duration: 0.45, ease: 'expo.out' }, T0 + B(0.2));
  const order = [5, 14, 2, 21, 9, 17, 0, 12, 7, 19, 3, 23, 10, 15, 6, 20];
  const seatEls = $$('.seats i', c);
  const tSeat = (k) => T0 + B(0.5 + k * 0.125);
  order.forEach((si, k) => {
    tl.to(seatEls[si], { backgroundColor: COLORS.or, boxShadow: '0 0 24px rgba(254,77,30,.55)', duration: 0.12 }, tSeat(k));
    tl.fromTo(seatEls[si], { scale: 1.25 }, { scale: 1, duration: 0.25, ease: 'back.out(3)', immediateRender: false }, tSeat(k));
    if (k % 2 === 0) cue('seat', tSeat(k), { k });
  });
  const cnt = $('.dp-count b', c);
  onFrame((t) => {
    let n = 0; for (let k = 0; k < order.length; k++) if (t >= tSeat(k)) n = k + 1;
    if (cnt.__n !== n) { cnt.textContent = n; cnt.__n = n; }
  });
  tl.fromTo($('.dp-bar .fill', c), { scaleX: 0 }, { scaleX: 16 / 24, duration: tSeat(15) - tSeat(0), ease: 'none', immediateRender: false }, tSeat(0));
  gsap.set($('.dp-bar .fill', c), { scaleX: 0 });
  const g = tSeat(11);
  tl.to($('.dp-st .a', c), { yPercent: -150, autoAlpha: 0, duration: 0.2, ease: 'power3.in' }, g);
  gsap.set($('.dp-st .b', c), { yPercent: 150, autoAlpha: 0 });
  tl.to($('.dp-st .b', c), { yPercent: 0, autoAlpha: 1, duration: 0.45, ease: 'back.out(2)' }, g + 0.08);
  tl.fromTo(c, { '--flash': 0 }, { '--flash': 1, duration: 0.06, yoyo: true, repeat: 1, immediateRender: false }, g);
  cue('success', g);
  return c;
}

/* ═════════════════════ 05 · Operations board (add-on) ═════════════════════ */
function card5(tl) {
  const T = L.card5;
  const res = T.res;
  const COLW = 78, X0 = 246, ROWH = 86, Y0 = 52;
  const bar = (cls, row, d0, d1, label) => `<div class="op-bar ${cls}" style="left:${X0 + d0 * COLW + 4}px;top:${Y0 + row * ROWH + 14}px;width:${(d1 - d0) * COLW - 8}px">${label}</div>`;
  const c = makeCard(4, 'kanban', T.name, T.group, 'operations', `
    <div class="op-head"><div class="op-title">${T.title}</div>
      <div class="op-st"><span class="pill amber a">${T.unconfirmed}</span><span class="pill green b">${T.allOk}</span></div></div>
    <div class="op-grid">
      <div class="op-days">${T.days.map((d, k) => `<span style="left:${X0 + k * COLW}px;width:${COLW}px">${d}</span>`).join('')}</div>
      ${res.map(([ic, n, r], k) => `<div class="op-res" style="top:${Y0 + k * ROWH}px">${icon(ic, 26, 2.2)}<div><b>${n}</b><small>${r}</small></div></div>`).join('')}
      ${res.map((_, k) => `<div class="op-line" style="top:${Y0 + k * ROWH}px"></div>`).join('')}
      ${bar('e1', 0, 0, 3, T.bars[0])}
      ${bar('e2', 1, 1, 4, T.bars[1])}
      ${bar('e3', 3, 0, 2, T.bars[2])}
      ${bar('nw', 1, 2, 5, T.bars[3])}
    </div>
    <div class="op-alert red">${icon('triangle-alert', 28, 2.4)}<span>${T.clash}</span></div>
    <div class="op-alert green">${icon('circle-check-big', 28, 2.4)}<span>${T.fixed}</span></div>
    <div class="op-conf"><div class="label">${T.conf}</div>
      <div class="op-chips">${T.confItems.map((n) => `<span class="chip cf"><span class="st">${icon('clock', 24, 2.4)}</span><span class="ok">${icon('circle-check-big', 24, 2.4)}</span>${n}</span>`).join('')}</div></div>`, true);
  fitWidth($$('.op-alert span', c), 700);
  const T0 = ARRIVE(4);
  tl.from($('.op-head', c), { autoAlpha: 0, y: 24, duration: 0.45, ease: 'expo.out' }, T0);
  tl.from($$('.op-res, .op-days span', c), { autoAlpha: 0, x: -16, duration: 0.35, ease: 'expo.out', stagger: 0.02 }, T0 + B(0.1));
  tl.from($$('.op-bar.e1, .op-bar.e2, .op-bar.e3', c), { scaleX: 0, transformOrigin: '0 50%', duration: 0.4, ease: 'expo.out', stagger: 0.08 }, T0 + B(0.35));
  const nw = $('.op-bar.nw', c);
  tl.from(nw, { y: -260, autoAlpha: 0, rotation: -6, duration: B(0.5), ease: 'power3.in' }, T0 + B(0.75));
  const hit = T0 + B(1.25);
  tl.to([nw, $('.op-bar.e2', c)], { backgroundColor: COLORS.red, color: '#fff', duration: 0.08 }, hit);
  tl.fromTo(c, { x: 0 }, { keyframes: { x: [0, -16, 14, -10, 7, -3, 0] }, duration: 0.42, ease: 'none', immediateRender: false }, hit);
  const red = $('.op-alert.red', c), green = $('.op-alert.green', c);
  gsap.set([red, green], { autoAlpha: 0, y: 30 });
  tl.to(red, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, hit + 0.05);
  cue('error', hit);
  const fix = T0 + B(2.1);
  tl.to(nw, { y: `+=${ROWH}`, duration: B(0.55), ease: 'back.inOut(1.4)' }, fix);
  tl.to(nw, { backgroundColor: COLORS.green, color: '#0c1a12', duration: 0.2 }, fix + B(0.35));
  tl.to($('.op-bar.e2', c), { backgroundColor: 'rgba(254,77,30,.55)', color: '#fff', duration: 0.2 }, fix + B(0.2));
  tl.to(red, { autoAlpha: 0, y: -20, duration: 0.2 }, fix + B(0.3));
  tl.to(green, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'back.out(2)' }, fix + B(0.4));
  cue('swoosh', fix); cue('success', fix + B(0.4));
  $$('.cf', c).forEach((chip, k) => {
    const tc = T0 + B(2.75 + k * 0.2);
    tl.to($('.st', chip), { scale: 0, autoAlpha: 0, duration: 0.12 }, tc);
    tl.fromTo($('.ok', chip), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, tc + 0.05);
    tl.to(chip, { backgroundColor: 'rgba(34,197,127,.16)', duration: 0.2 }, tc);
    cue('tick', tc, { k: 5 + k });
  });
  gsap.set($$('.cf .ok', c), { scale: 0, autoAlpha: 0 });
  tl.from($('.op-conf', c), { autoAlpha: 0, y: 20, duration: 0.4, ease: 'expo.out' }, T0 + B(0.6));
  const allOk = T0 + B(3.2);
  tl.to($('.op-st .a', c), { yPercent: -150, autoAlpha: 0, duration: 0.2 }, allOk);
  gsap.set($('.op-st .b', c), { yPercent: 150, autoAlpha: 0 });
  tl.to($('.op-st .b', c), { yPercent: 0, autoAlpha: 1, duration: 0.4, ease: 'back.out(2)' }, allOk + 0.06);
  return c;
}

/* ═════════════════════ 06 · Vouchers & QR verification ═════════════════════ */
function card6(tl) {
  const q = window.QR;
  const T = L.card6;
  const c = makeCard(5, 'folder-open', T.name, T.group, 'documents', `
    <div class="vc-head"><div class="vc-title">${T.title}</div><span class="pill or">TOS-2481</span></div>
    <div class="ticket">
      <div class="tk-l">
        <div class="tk-k">${T.kicker}</div>
        <div class="tk-h">${T.hotel}</div>
        <div class="tk-s">${T.place}</div>
        <div class="tk-grid">
          ${T.grid.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('')}
        </div>
        <div class="tk-lead">${icon('user-round', 22, 2.2)} ${T.lead}</div>
      </div>
      <div class="tk-perf"></div>
      <div class="tk-r">
        <svg class="qr" viewBox="-1 -1 ${q.size + 2} ${q.size + 2}" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${q.size + 2}" height="${q.size + 2}" fill="#fff"/><path d="${q.path}" fill="#151110"/></svg>
        <div class="scan"></div>
        <div class="stamp">${icon('badge-check', 34, 2.4)}${T.stamp}</div>
      </div>
    </div>
    <div class="vc-files"><span class="chip">${icon('file-text', 24, 2.2)}${T.file}</span><span class="pill green">${icon('send', 17, 2.6)} ${T.sent}</span></div>`);
  fitWidth($('.stamp', c), 250);
  const T0 = ARRIVE(5);
  tl.from($('.vc-head', c), { autoAlpha: 0, y: 24, duration: 0.45, ease: 'expo.out' }, T0);
  tl.from($('.ticket', c), { autoAlpha: 0, y: 90, rotation: -3, duration: 0.6, ease: 'expo.out' }, T0 + B(0.15));
  tl.from($$('.tk-l > *', c), { autoAlpha: 0, y: 18, duration: 0.4, ease: 'expo.out', stagger: 0.05 }, T0 + B(0.4));
  tl.from($('.qr', c), { clipPath: 'inset(0 0 100% 0)', duration: B(0.6), ease: 'power2.inOut' }, T0 + B(0.7));
  const scan = $('.scan', c);
  gsap.set(scan, { autoAlpha: 0, y: 0 });
  tl.to(scan, { autoAlpha: 1, duration: 0.08 }, T0 + B(1.45));
  tl.to(scan, { y: 236, duration: B(1), ease: 'power1.inOut', yoyo: true, repeat: 1 }, T0 + B(1.45));
  tl.to(scan, { autoAlpha: 0, duration: 0.1 }, T0 + B(3.3));
  cue('scan', T0 + B(1.45), { to: T0 + B(3.3) });
  const st = T0 + B(2.5);
  tl.from($('.stamp', c), { scale: 2.6, autoAlpha: 0, rotation: -24, duration: 0.3, ease: 'power4.in' }, st - 0.3);
  tl.fromTo($('.ticket', c), { scale: 1 }, { scale: 0.975, duration: 0.06, yoyo: true, repeat: 1, immediateRender: false }, st);
  cue('stamp', st);
  tl.from($$('.vc-files > *', c), { autoAlpha: 0, y: 20, duration: 0.4, ease: 'expo.out', stagger: 0.1 }, T0 + B(2.8));
  cue('tick', T0 + B(2.8));
  return c;
}
