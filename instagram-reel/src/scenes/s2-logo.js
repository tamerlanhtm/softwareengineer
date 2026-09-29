/* SCENE 2 — LOGO REVEAL (bars 3–4, 3.75 → 7.5 s)
 * We land inside the hollow square's hole; it pulls back to its slot while the
 * other eight squares pop in a diagonal wave (one per 16th note). The mark then
 * lifts, "TOSNow" rises letter by letter and a slot-machine line rolls through
 * what the system runs: enquiries → itineraries → suppliers → departures → vouchers. */

function buildLogo(tl) {
  const S = scene('s2');
  S.innerHTML = `
    <div class="s2-bg"></div>
    <div class="s2-word"><span class="tos">TOS</span><span class="now">Now</span></div>
    <div class="s2-sub"></div>
    <div class="s2-line"><span class="mask"><span>One system for your</span></span></div>
    <div class="s2-roll"></div>`;
  const words = ['enquiries.', 'itineraries.', 'suppliers.', 'departures.', 'vouchers.'];
  const roll = $('.s2-roll', S);
  const W8 = words.map((w) => { const n = el(`<span>${w}</span>`); roll.appendChild(n); return n; });

  tl.set(S, { autoAlpha: 1 }, B(8));
  tl.set(S, { autoAlpha: 0 }, B(16.5));

  /* ── assemble the mark ─────────────────────────────── */
  const L1 = { cx: 540, cy: 900, s: 150 };
  const L2 = { cx: 540, cy: 560, s: 110 };
  const hol = HEROES[HOLLOW];
  const hp = logoVars(HOLLOW, L1.cx, L1.cy, L1.s);
  tl.to(hol, { ...hp, rotation: 90, duration: B(1.1), ease: logEase(7200, L1.s, E.outExpo) }, B(8));
  cue('impact', B(8), { big: 1 });
  tl.to(hol, { backgroundColor: 'rgba(246,243,238,0)', duration: 0.2 }, B(9.3)); // hole shows the stage

  WAVE_FROM_HOLLOW.forEach((i, k) => {
    const t0 = B(8.25 + k * 0.25);
    tl.set(HEROES[i], { autoAlpha: 1, ...logoVars(i, L1.cx, L1.cy, L1.s), scale: 0, rotation: -90 }, B(8));
    tl.to(HEROES[i], { scale: 1, rotation: 0, duration: B(0.5), ease: 'back.out(2.2)' }, t0);
    cue('blip', t0, { note: k });
  });

  /* ── lift + wordmark ───────────────────────────────── */
  for (let i = 0; i < 9; i++) {
    tl.to(HEROES[i], { ...logoVars(i, L2.cx, L2.cy, L2.s), duration: B(0.85), ease: 'power4.inOut' }, B(10.25) + i * 0.02);
  }
  cue('whoosh', B(10.25), { dir: 'up' });
  const chars = SplitText.create($('.s2-word', S), { type: 'chars', mask: 'chars' }).chars;
  tl.fromTo(chars, { yPercent: 115 }, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.04, immediateRender: false }, B(10.85));
  gsap.set(chars, { yPercent: 115 });
  scrambleIn($('.s2-sub', S), 'TOUR OPERATOR SYSTEM', B(11.25), 0.5);
  cue('scramble', B(11.25), { dur: 0.5 });

  /* ── rolling value line ────────────────────────────── */
  const line = $('.s2-line .mask > span', S);
  gsap.set(line, { yPercent: 110 });
  tl.to(line, { yPercent: 0, duration: 0.55, ease: 'expo.out' }, B(11.5));
  gsap.set(W8, { yPercent: 110 });
  const rollAt = (k) => B(12 + k * 0.75);
  words.forEach((w, k) => {
    tl.to(W8[k], { yPercent: 0, duration: 0.3, ease: 'expo.out' }, rollAt(k));
    if (k < words.length - 1) tl.to(W8[k], { yPercent: -110, duration: 0.18, ease: 'power3.in' }, rollAt(k + 1) - 0.08);
    cue('tick', rollAt(k), { roll: k });
  });

  /* ── exit ──────────────────────────────────────────── */
  tl.to([line, W8[4]], { yPercent: 110, duration: 0.26, ease: 'power3.in', stagger: 0.04 }, B(15.5));
  tl.to(chars, { yPercent: -115, duration: 0.26, ease: 'power3.in', stagger: 0.015 }, B(15.5));
  tl.to('.s2-sub', { autoAlpha: 0, y: -20, duration: 0.22, ease: 'power2.in' }, B(15.5));
}
