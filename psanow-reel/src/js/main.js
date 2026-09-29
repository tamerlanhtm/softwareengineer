// Boots the composition and exposes window.renderAt(t) for the frame renderer.
(async function () {
  const faces = [
    '400 40px "Inter Variable"', '600 40px "Inter Variable"', '700 40px "Inter Variable"',
    '700 40px "Inter Tight Variable"', '800 40px "Inter Tight Variable"', '900 40px "Inter Tight Variable"',
    '700 40px "Unbounded Variable"', '800 40px "Unbounded Variable"',
    '400 40px "JetBrains Mono Variable"', '600 40px "JetBrains Mono Variable"',
  ];
  await Promise.all(faces.map((f) => document.fonts.load(f, 'AaЯяƏəŞşĞğİı₼$€₺₽0123456789')));
  await document.fonts.ready;

  const cam = document.getElementById('cam');
  const flash = document.getElementById('flash');
  const vignette = document.getElementById('vignette');
  const scenes = window.SCENES.slice().sort((a, b) => (a.z || 0) - (b.z || 0));
  for (const s of scenes) {
    s.root = R.el(cam, 'scene scene-' + s.name);
    s.build(s.root);
    s._on = true;
  }
  if (window.GLOBAL && window.GLOBAL.build) window.GLOBAL.build();

  window.DURATION = 30;
  window.renderAt = (t) => {
    t = Math.max(0, Math.min(t, window.DURATION - 1e-6));
    for (const s of scenes) {
      const on = t >= s.vs && t < s.ve;
      if (on !== s._on) {
        R.show(s.root, on);
        s._on = on;
      }
      if (on) s.update(t);
    }
    const sh = R.shakeAt(t);
    R.T(cam, { x: sh.x, y: sh.y, r: sh.r });

    // strongest active flash wins
    let fa = 0, fc = '#fff';
    for (const fl of R.flashes) {
      const dt = t - fl.t;
      if (dt < 0 || dt > fl.dur) continue;
      const a = fl.amp * Math.pow(1 - dt / fl.dur, 2);
      if (a > fa) { fa = a; fc = fl.color; }
    }
    flash.style.background = fc;
    R.O(flash, fa);
    if (window.GLOBAL && window.GLOBAL.update) window.GLOBAL.update(t, { vignette });
  };
  window.__ready = true;

  const q = new URLSearchParams(location.search);
  if (q.has('t')) window.renderAt(parseFloat(q.get('t')));
})();
