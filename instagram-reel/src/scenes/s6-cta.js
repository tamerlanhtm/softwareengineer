/* SCENE 6 — CALL TO ACTION (bars 15–16, 26.25 → 30 s)
 * The nine bento tiles collapse back into the brand mark — the hollow
 * "Your agency" slot becomes the hollow square — as the stage floods to paper.
 * Brand line lands on the beat: "Everything your tour company needs. Now."
 * then the demo button, the URL typing itself, and the Instagram handle. */

const CTA_LOGO = { cx: 540, cy: 520, s: 92 };

function buildCTA(tl) {
  const S = scene('s6');
  S.innerHTML = `
    <div class="s6-bg"></div>
    <div class="s6-kicker"></div>
    <div class="s6-head">${maskLines(['Everything your tour', 'company needs.'])}</div>
    <div class="s6-now"><span class="mask"><span>Now.</span></span></div>
    <div class="s6-btn"><span>Book a demo</span>${icon('arrow-right', 42, 2.8)}<i class="shine"></i></div>
    <div class="s6-url"><span class="tx"></span><span class="caret"></span></div>
    <div class="s6-handle">${icon('message-circle', 30, 2.2)}<span>DM us <b>@ineednow_</b></span></div>
    ${CURSOR_SVG}<div class="ripple"></div>`;
  tl.set(S, { autoAlpha: 1 }, B(55.2));

  /* ── tiles → brand mark, paper floods in ───────────── */
  const { cx, cy, s } = CTA_LOGO;
  const order = [4, 1, 3, 5, 7, 0, 2, 6, 8];
  // Tiles light up orange first (no muddy mid-flight colour), then fly home.
  order.forEach((i, k) => {
    tl.to(HEROES[i], { backgroundColor: i === HOLLOW ? COLORS.paper : COLORS.or, duration: 0.05, ease: 'none' }, B(55.2) + k * 0.018);
    tl.to(HEROES[i], { ...logoVars(i, cx, cy, s), duration: B(0.8), ease: 'power4.inOut' }, B(55.25) + k * 0.015);
  });
  cue('lightup', B(55.2));
  gsap.set('.s6-bg', { clipPath: `circle(0px at ${cx}px ${cy}px)` });
  tl.to('.s6-bg', { clipPath: `circle(2400px at ${cx}px ${cy}px)`, duration: B(0.4), ease: 'power2.in' }, B(55.8));
  cue('impact', B(56), { big: 1, cta: 1 });
  tl.to(HEROES[HOLLOW], { backgroundColor: 'rgba(246,243,238,0)', duration: 0.2 }, B(56.3)); // hole shows the stage
  // settle: a ripple of tiny bounces through the mark
  WAVE_FROM_HOLLOW.concat([HOLLOW]).forEach((i, k) => {
    tl.fromTo(HEROES[i], { scale: 1 }, { scale: 1.1, duration: 0.09, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, B(56.5) + k * 0.03);
  });

  /* ── brand line ────────────────────────────────────── */
  scrambleIn($('.s6-kicker', S), 'TOSNOW · TOUR OPERATOR SYSTEM', B(56.4), 0.55);
  cue('scramble', B(56.4), { dur: 0.55 });
  const lines = $$('.s6-head .mask > span', S);
  gsap.set(lines, { yPercent: 115 });
  tl.to(lines, { yPercent: 0, duration: 0.65, ease: 'expo.out', stagger: B(0.5) }, B(56.6));
  cue('whoosh', B(56.6), { dir: 'soft' });
  const now = $('.s6-now .mask > span', S);
  gsap.set(now, { yPercent: 105 });
  tl.fromTo(now, { yPercent: 105, scale: 1.25 }, { yPercent: 0, scale: 1, duration: 0.5, ease: 'expo.out', immediateRender: false }, B(58));
  cue('slam', B(58), { strong: 1, final: 1 });
  tl.fromTo(HEROES[HOLLOW], { scale: 1 }, { scale: 1.16, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, B(58));

  /* ── CTA ───────────────────────────────────────────── */
  const btn = $('.s6-btn', S);
  gsap.set(btn, { xPercent: -50 });
  tl.from(btn, { scale: 0.4, autoAlpha: 0, duration: 0.55, ease: 'back.out(2.2)' }, B(58.6));
  cue('pop', B(58.6), { note: 7 });
  const url = 'www.ineed.now';
  const tx = $('.s6-url .tx', S), caret = $('.s6-url .caret', S);
  const typeT0 = B(59.1), typeDt = 0.045;
  onFrame((t) => {
    const n = clamp(Math.floor((t - typeT0) / typeDt) + 1, 0, url.length);
    const str = t < typeT0 ? '' : url.slice(0, n);
    if (tx.__txt !== str) { tx.textContent = str; tx.__txt = str; }
    const typing = t >= typeT0 && n < url.length;
    caret.style.opacity = t < typeT0 - 0.15 ? 0 : typing ? 1 : (Math.floor((t - typeT0) / B(0.5)) % 2 === 0 ? 1 : 0);
  });
  for (let k = 0; k < url.length; k++) cue('type', typeT0 + k * typeDt, { k });
  tl.from('.s6-handle', { autoAlpha: 0, y: 24, duration: 0.5, ease: 'expo.out' }, B(59.9));

  // A cursor taps the button — the viewer's cue to act.
  const cur = $('.cursor', S), rip = $('.ripple', S);
  gsap.set(cur, { x: 980, y: 1700, autoAlpha: 0 });
  tl.to(cur, { autoAlpha: 1, duration: 0.15 }, B(60.4));
  tl.to(cur, { x: 650, y: 1316, duration: B(1), ease: 'power3.inOut' }, B(60.4));
  const click = B(61.5);
  tl.to(cur, { scale: 0.82, duration: 0.07, yoyo: true, repeat: 1 }, click - 0.03);
  gsap.set(rip, { x: 662, y: 1320, scale: 0.2, autoAlpha: 0 });
  tl.fromTo(rip, { scale: 0.2, autoAlpha: 0.9 }, { scale: 1.8, autoAlpha: 0, duration: 0.55, ease: 'power2.out', immediateRender: false }, click);
  tl.fromTo(btn, { scale: 1 }, { scale: 0.95, duration: 0.08, yoyo: true, repeat: 1, immediateRender: false }, click - 0.02);
  cue('click', click);
  tl.fromTo('.s6-btn .shine', { xPercent: -150 }, { xPercent: 800, duration: 0.8, ease: 'power2.inOut', immediateRender: false }, B(62.3));
  gsap.set('.s6-btn .shine', { xPercent: -150 });
  tl.to(cur, { x: 760, y: 1480, autoAlpha: 0, duration: B(1.2), ease: 'power2.in' }, B(62.4));
  [62, 63].forEach((b) => tl.fromTo(HEROES[HOLLOW], { scale: 1 }, { scale: 1.08, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.out', immediateRender: false }, B(b)));
}
