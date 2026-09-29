/* SCENE 5 — EVERYTHING ELSE (bars 13–14, 22.5 → 26.25 s)
 * The camera pulls back: the voucher card becomes the centre tile of a 3×3
 * bento grid — the same grid as the logo. Eight more live tiles surround it:
 * dashboard, 5 languages, multi-currency, margins, agent portal, roles,
 * automation… and a hollow slot: "Your agency here." */

const BENTO = { c: BENTO_C, s: BENTO_TILE, gap: 30 };
const bentoCell = (i) => ({
  x: BENTO.c.x + ((i % 3) - 1) * (BENTO.s + BENTO.gap),
  y: BENTO.c.y + (Math.floor(i / 3) - 1) * (BENTO.s + BENTO.gap),
});

function buildBento(tl) {
  const S = scene('s5');
  tl.set(S, { autoAlpha: 1 }, B(47.3));
  tl.set(S, { autoAlpha: 0 }, B(56.6));

  const T = L.bento;
  const langs = T.langs;
  const tiles = {
    0: `<div class="bt-l">${icon('layout-dashboard', 24, 2.2)}${T.dash[0]}</div>
        <div class="bt-ring"><svg viewBox="0 0 160 160"><circle cx="80" cy="80" r="66" class="trk"/><circle cx="80" cy="80" r="66" class="arc"/></svg><b class="tnum">0%</b></div>
        <div class="bt-c">${T.dash[1]}</div>`,
    1: `<div class="bt-l">${icon('languages', 24, 2.2)}${T.langsLabel}</div>
        <div class="bt-word">${langs.map(([w]) => `<span>${w}</span>`).join('')}</div>
        <div class="bt-codes">${langs.map(([, c]) => `<i>${c}</i>`).join('')}</div>`,
    2: `<div class="bt-l">${icon('coins', 24, 2.2)}${T.fx[0]}</div>
        <div class="bt-fx"><b>USD</b><span class="sw">${icon('arrow-left-right', 34, 2.4)}</span><b>AZN</b></div>
        <div class="bt-rate tnum">${T.fx[1]}</div>
        <div class="bt-tape"><div>EUR · TRY · UZS · RUB · GBP · USD · AZN · EUR · TRY · UZS · RUB · GBP · USD · AZN ·</div></div>`,
    3: `<div class="bt-l">${icon('trending-up', 24, 2.2)}${T.margins[0]}</div>
        <div class="bt-big tnum">${L.pct(15.3)}</div>
        <div class="bt-bars">${[46, 62, 38, 74, 90].map((h, k) => `<i style="height:${h}%" class="${k === 4 ? 'hi' : ''}"></i>`).join('')}</div>
        <div class="bt-c">${T.margins[1]}</div>`,
    5: `<div class="bt-l">${icon('store', 24, 2.2)}${T.agent[0]}</div>
        <div class="bt-av"><i style="background:#FF8A5C">SW</i><i style="background:#E0B25C">GT</i><i style="background:#7C8CF8">BX</i><i class="more">+9</i></div>
        <div class="bt-c two">${T.agent[1]}</div>
        <div class="bt-notif">${icon('circle-check-big', 20, 2.6)} ${T.agent[2]}</div>`,
    6: `<div class="bt-l">${icon('user-cog', 24, 2.2)}${T.roles[0]}</div>
        <div class="bt-roles">${T.roles[1].map((r) => `<span><i class="lk">${icon('lock', 16, 2.6)}</i><i class="ok">${icon('check', 16, 3)}</i>${r}</span>`).join('')}</div>`,
    7: `<div class="bt-l">${icon('workflow', 24, 2.2)}${T.auto[0]}</div>
        <div class="bt-flow">
          <div class="nd a">${icon('zap', 22, 2.4)}${T.auto[1]}</div>
          <div class="wire"><i></i></div>
          <div class="nd b">${icon('send', 22, 2.4)}${T.auto[2]}</div>
        </div>`,
    8: `<div class="bt-hol-in"><div class="bt-plus">${icon('plus', 40, 3)}</div><div class="bt-you">${T.you}</div></div>`,
  };
  const nodes = {};
  Object.entries(tiles).forEach(([i, html]) => {
    const p = bentoCell(+i);
    const n = el(`<div class="btile ${+i === 8 ? 'hollow' : ''}" style="left:${p.x - BENTO.s / 2}px;top:${p.y - BENTO.s / 2}px">${html}</div>`);
    S.appendChild(n);
    nodes[i] = n;
  });

  // Pop-in: edge-adjacent tiles first, corners after, hollow slot last.
  const popOrder = [1, 3, 5, 7, 0, 2, 6, 8];
  popOrder.forEach((i, k) => {
    const t0 = B(47.7) + k * 0.06;
    tl.from(nodes[i], { autoAlpha: 0, scale: 0.72, y: 50, duration: 0.55, ease: 'back.out(1.5)' }, t0);
  });
  cue('popcascade', B(47.7), { n: 8, dur: 8 * 0.06 });
  hudStep(tl, T.hud[0], T.hud[1], B(47.5), B(54.8));
  fitWidth($$('.bt-l', S), 248);
  fitWidth($('.bt-you', S), 262);

  /* ── tile micro-animations ─────────────────────────── */
  // dashboard ring + counter
  tl.fromTo($('.bt-ring .arc', nodes[0]), { drawSVG: '0% 0%' }, { drawSVG: '0% 86%', duration: B(1.6), ease: 'power3.inOut', immediateRender: false }, B(48.4));
  gsap.set($('.bt-ring .arc', nodes[0]), { drawSVG: '0% 0%' });
  countUp($('.bt-ring b', nodes[0]), B(48.4), B(50), 0, 86, (v) => Math.round(v) + '%', E.inOutCubic);

  // languages roll (one per beat)
  const words = $$('.bt-word span', nodes[1]), codes = $$('.bt-codes i', nodes[1]);
  gsap.set(words, { yPercent: 110 });
  langs.forEach((_, k) => {
    const t0 = B(48.5 + k);
    tl.to(words[k], { yPercent: 0, duration: 0.3, ease: 'expo.out' }, t0);
    if (k < langs.length - 1) tl.to(words[k], { yPercent: -110, duration: 0.18, ease: 'power3.in' }, B(49.5 + k) - 0.07);
    tl.to(codes[k], { backgroundColor: COLORS.or, color: '#fff', duration: 0.1 }, t0);
    if (k < langs.length - 1) tl.to(codes[k], { backgroundColor: 'rgba(255,255,255,0)', color: '#A69D95', duration: 0.1 }, B(49.5 + k));
    cue('tick', t0, { k: 20 + k });
  });

  // currency swap arrows + tape
  [49.5, 51.5, 53.5].forEach((b) => tl.to($('.bt-fx .sw', nodes[2]), { rotation: '+=180', duration: 0.45, ease: 'back.inOut(1.6)' }, B(b)));
  const tape = $('.bt-tape div', nodes[2]);
  onFrame((t) => { if (t > B(47) && t < B(56.5)) tape.style.transform = `translateX(${(-((t - B(47)) * 60) % 400).toFixed(1)}px)`; });

  // margins bars
  tl.from($$('.bt-bars i', nodes[3]), { scaleY: 0, duration: 0.5, ease: 'back.out(1.8)', stagger: B(0.25) }, B(48.6));
  countUp($('.bt-big', nodes[3]), B(48.6), B(50), 0, 15.3, L.pct, E.outCubic);

  // agent portal
  tl.from($$('.bt-av i', nodes[5]), { scale: 0, duration: 0.35, ease: 'back.out(2.5)', stagger: 0.07 }, B(48.7));
  tl.from($('.bt-notif', nodes[5]), { autoAlpha: 0, y: 26, scale: 0.9, duration: 0.45, ease: 'back.out(2)' }, B(51));
  cue('notif', B(51));

  // roles unlock in sequence
  $$('.bt-roles span', nodes[6]).forEach((r, k) => {
    const t0 = B(49 + k * 0.5);
    tl.to($('.lk', r), { scale: 0, autoAlpha: 0, duration: 0.12 }, t0);
    tl.fromTo($('.ok', r), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: 'back.out(3)', immediateRender: false }, t0 + 0.05);
    tl.to(r, { backgroundColor: 'rgba(254,77,30,.16)', color: '#F6F3EE', duration: 0.15 }, t0);
    if (k % 2 === 0) cue('tick', t0, { k: 30 + k });
  });
  gsap.set($$('.bt-roles .ok', nodes[6]), { scale: 0, autoAlpha: 0 });

  // automation: a pulse travels the wire every bar; node B lights on arrival
  const pulseDot = $('.wire i', nodes[7]), nb = $('.nd.b', nodes[7]);
  onFrame((t) => {
    if (t < B(47) || t > B(56.5)) return;
    const ph = ((t - B(48.5)) / B(2)) % 1;
    const p = t < B(48.5) ? 0 : clamp(ph / 0.45);
    pulseDot.style.transform = `translateY(${(p * 64).toFixed(1)}px)`;
    pulseDot.style.opacity = t < B(48.5) || ph > 0.5 ? 0 : 1;
    const lit = t >= B(48.5) && ph > 0.45 && ph < 0.95;
    nb.classList.toggle('lit', lit);
  });

  // hollow slot breathes on the beat
  [52, 53, 54].forEach((b) => tl.fromTo(nodes[8], { scale: 1 }, { scale: 1.035, duration: 0.09, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, B(b)));

  /* ── contents clear → tiles hand over to the hero squares ─ */
  tl.to(Object.values(nodes).map((n) => n.children), { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, B(54.75));
  const voucher = $('.card.c5');
  tl.to(voucher.children, { autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, B(54.75));
  cue('whoosh', B(55.2), { dir: 'in' });

  const swap = B(55.2);
  tl.set([...Object.values(nodes), voucher], { autoAlpha: 0 }, swap);
  for (let i = 0; i < 9; i++) {
    const p = bentoCell(i);
    tl.set(HEROES[i], {
      autoAlpha: 1, x: p.x, y: p.y, width: BENTO.s, height: BENTO.s, rotation: 0, scale: 1,
      borderRadius: 40, backgroundColor: COLORS.ink2, borderWidth: i === HOLLOW ? 6 : 0,
    }, swap);
  }
}
