/* Assembles the master timeline and exposes the render API:
 *   window.__seek(t)   render the composition at time t (seconds)
 *   window.__duration  total length (30 s)
 *   window.__cues      audio sync cues
 *   window.__ready     true once fonts are loaded and the timeline is built */
(async function main() {
  gsap.registerPlugin(CustomEase, SplitText, DrawSVGPlugin);
  heroInit();
  const tl = gsap.timeline({ paused: true });
  buildChaos(tl);
  buildLogo(tl);
  buildModules(tl);
  buildJourney(tl);
  buildBento(tl);
  buildCTA(tl);
  tl.set({}, {}, DURATION);

  // Lines parked outside their mask (|yPercent| ≥ 99) are fully hidden: tall
  // diacritics such as İ, Ü, Ö rise above the line box and would otherwise peek
  // into the mask's padding.
  const parked = $$('.mask > span, .s2-roll > span, .bt-word > span');
  onFrame(() => {
    for (const n of parked) {
      const v = Math.abs(gsap.getProperty(n, 'yPercent')) >= 99 ? 'hidden' : '';
      if (n.style.visibility !== v) n.style.visibility = v;
    }
  });

  // Initialise every tween once, in timeline order, so arbitrary seeks are exact.
  tl.progress(1).progress(0);

  window.__seek = (t) => {
    tl.seek(t, false);
    for (const f of FRAME_HOOKS) f(t);
  };
  window.__duration = DURATION;
  window.__cues = CUES.slice().sort((a, b) => a.t - b.t);
  window.__tl = tl;

  const fams = ['Unbounded Variable', 'Inter Tight Variable', 'Inter Variable', 'JetBrains Mono Variable'];
  const sample = 'Aa Xoş gəlmisiniz Hoş geldiniz Привет Salom 0123456789 $ · —';
  await Promise.all(fams.flatMap((f) => [400, 600, 800].map((w) => document.fonts.load(`${w} 40px "${f}"`, sample))));
  await document.fonts.ready;
  applyFits();   // after fonts: long translations shrink to their slots
  window.__seek(0);
  window.__ready = true;
})();
