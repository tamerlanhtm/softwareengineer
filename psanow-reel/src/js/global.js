// Global background glow + vignette that sit behind/above every scene.
(function () {
  const { el, O, T, kf, E } = R;
  const G = (window.GLOBAL = {});
  G.build = () => {
    const bg = document.getElementById('bg');
    G.glowA = el(bg, 'abs', { width: '1400px', height: '1400px', left: '-160px', top: '60px', borderRadius: '50%',
      background: 'radial-gradient(closest-side, rgba(254,77,30,0.30), rgba(254,77,30,0.10) 45%, rgba(254,77,30,0) 100%)' });
    G.glowB = el(bg, 'abs', { width: '1100px', height: '1100px', left: '300px', top: '1100px', borderRadius: '50%',
      background: 'radial-gradient(closest-side, rgba(255,122,77,0.20), rgba(255,122,77,0) 100%)' });
    G.cool = el(bg, 'abs', { width: '1500px', height: '1500px', left: '-210px', top: '100px', borderRadius: '50%',
      background: 'radial-gradient(closest-side, rgba(255,255,255,0.07), rgba(255,255,255,0) 100%)' });
  };
  G.update = (t, { vignette }) => {
    const warm = kf(t, [[0, 0], [3.98, 0], [4.02, 1], [24.4, 1], [24.84, 0]]);
    O(G.glowA, warm * (0.85 + 0.15 * Math.sin(t * 1.3)));
    O(G.glowB, warm * (0.7 + 0.3 * Math.sin(t * 0.9 + 1)));
    O(G.cool, 1 - warm);
    T(G.glowA, { x: R.noise(t * 0.25, 1) * 120, y: R.noise(t * 0.2, 2) * 160 });
    T(G.glowB, { x: R.noise(t * 0.22, 3) * 160, y: R.noise(t * 0.18, 4) * 140 });
    O(vignette, kf(t, [[0, 1], [24.42, 1], [24.84, 0]]));
  };
})();
