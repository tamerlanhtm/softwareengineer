/* Boot: load fonts, build scenes, expose renderFrame(t) for the capture tool,
   and provide a small scrub/play preview when opened directly in a browser. */
(async function () {
  'use strict';
  const DURATION = 30;
  const capture = new URLSearchParams(location.search).has('capture');

  const faces = [
    "500 40px InterDisplay", "600 40px InterDisplay", "700 40px InterDisplay", "800 40px InterDisplay", "900 40px InterDisplay",
    "400 20px Inter", "500 20px Inter", "600 20px Inter", "700 20px Inter", "800 20px Inter",
    "500 20px Mono", "700 20px Mono",
  ];
  const sample = 'AaZz09$€₼ÇçƏəĞğİıÖöŞşÜü ПРИВЕТ привет';
  await Promise.all(faces.map((f) => document.fonts.load(f, sample)));
  await document.fonts.ready;

  K.mount();
  for (const def of K.defs) def();
  K.cues.sort((a, b) => a.t - b.t);

  window.renderFrame = (t) => K.render(t);
  window.getCues = () => K.cues;
  window.getFast = () => K.fastWin;
  window.DURATION = DURATION;
  K.render(0);

  if (!capture) {
    const vp = document.getElementById('viewport');
    const fit = () => {
      const s = Math.min((innerHeight - 70) / 1920, innerWidth / 1080);
      vp.style.transform = `translate(${(innerWidth - 1080 * s) / 2}px, 8px) scale(${s})`;
    };
    addEventListener('resize', fit); fit();
    const ui = document.getElementById('player'); ui.hidden = false;
    const btn = document.getElementById('play'), scrub = document.getElementById('scrub'), lab = document.getElementById('time');
    const audio = document.getElementById('audio');
    audio.src = '../out/ERPNow_Reel_soundtrack.wav';
    let playing = false, t = 0, t0 = 0, w0 = 0;
    const show = () => { K.render(t); scrub.value = t; lab.textContent = t.toFixed(2) + 's'; };
    const loop = (now) => {
      if (!playing) return;
      t = (w0 + (now - t0) / 1000) % DURATION;
      show(); requestAnimationFrame(loop);
    };
    const play = (on) => {
      playing = on; btn.textContent = on ? 'Pause' : 'Play';
      if (on) { t0 = performance.now(); w0 = t; audio.currentTime = t; audio.play().catch(() => {}); requestAnimationFrame(loop); }
      else audio.pause();
    };
    btn.onclick = () => play(!playing);
    scrub.oninput = () => { t = +scrub.value; if (playing) play(true); show(); };
    addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); play(!playing); }
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        const d = (e.shiftKey ? 1 : 1 / 30) * (e.code === 'ArrowRight' ? 1 : -1);
        t = Math.min(DURATION - 1e-3, Math.max(0, t + d)); play(false); show();
      }
    });
    show();
  }
  window.__ready = true;
})();
