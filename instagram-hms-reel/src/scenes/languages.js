// 22.75 – 25.1s  LANGUAGES. Rapid-fire greetings in the five supported
// languages, then the five language keys light up.
import { h, onFrame, cue, impact, prog, lerp, clamp, fitWidth } from '../lib/core.js';
import { L } from '../i18n.js';

const ALL = {
  EN: ['English', 'Hello'],
  AZ: ['Azərbaycan', 'Salam'],
  TR: ['Türkçe', 'Merhaba'],
  RU: ['Русский', 'Привет'],
  UZ: ['Oʻzbek', 'Salom'],
};
// The viewer's own language comes first.
const LANGS = L.languages.order.map((code) => [code, ...ALL[code]]);
const T = [22.96, 23.25, 23.5, 23.75, 24.0];

export default function languages({ root, tl }) {
  const S = h('section.scene.dark#s-lang');
  root.append(S);
  tl.set(S, { visibility: 'visible' }, 22.76);
  tl.set(S, { visibility: 'hidden' }, 25.1);
  gsap.set(S, { y: 1920 });
  tl.to(S, { y: 0, duration: 0.3, ease: 'expo.inOut' }, 22.76);
  cue(22.76, 'whoosh', { dur: 0.35 });

  const dots = h('div.dots');
  S.append(dots);
  onFrame((t) => {
    if (t < 22.7 || t > 25.2) return;
    dots.style.transform = `translate(${(-(t - 22.7) * 30).toFixed(1)}px, 0px)`;
  });

  const codeMask = h('div.mask', { style: { left: '0', right: '0', top: '676px', height: '56px' } });
  S.append(codeMask);

  LANGS.forEach(([code, name, word], i) => {
    const t0 = T[i];
    const t1 = T[i + 1] ?? 24.28;
    const m = h('div.mask', { style: { left: '0', right: '0', top: '760px', height: '230px' } });
    const el = h('div.lang-word', { style: { top: '12px', color: i % 2 ? 'var(--orange)' : '#fff' } });
    m.append(el);
    S.append(m);
    const chars = [...word].map((c) => {
      const s = h('span', { style: { display: 'inline-block' } }, c);
      el.append(s);
      return s;
    });
    gsap.set(chars, { yPercent: 105, autoAlpha: 0 });
    tl.set(chars, { autoAlpha: 1 }, t0);
    tl.to(chars, { yPercent: 0, duration: 0.24, ease: 'expo.out', stagger: 0.014 }, t0);
    tl.to(chars, { yPercent: -105, duration: 0.1, ease: 'power2.in', stagger: 0.008 }, t1 - 0.06);
    tl.set(chars, { autoAlpha: 0 }, t1 + 0.1);

    const lab = h('div.lang-code', { style: { top: '6px' } }, `${code} — ${name}`);
    lab.style.fontFamily = 'var(--ui)';
    lab.style.fontWeight = '700';
    lab.style.letterSpacing = '0.18em';
    codeMask.append(lab);
    gsap.set(lab, { yPercent: 110 });
    tl.to(lab, { yPercent: 0, duration: 0.2, ease: 'expo.out' }, t0);
    tl.to(lab, { yPercent: -110, duration: 0.1, ease: 'power2.in' }, t1 - 0.05);
    cue(t0, 'stab', { n: i });
    impact(t0, 5, 14, 20);
  });

  // language keys
  const pills = LANGS.map(([code], i) => {
    const el = h('div.lang-pill', { style: { left: `${127 + i * 164}px` } }, code);
    S.append(el);
    gsap.set(el, { autoAlpha: 0, y: 40 });
    tl.to(el, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' }, 22.95 + i * 0.03);
    tl.to(el, { backgroundColor: '#fe4d1e', borderColor: '#fe4d1e', scale: 1.08, duration: 0.08 }, T[i]);
    tl.to(el, { backgroundColor: 'rgba(254,77,30,0)', borderColor: 'rgba(255,255,255,0.18)', scale: 1, duration: 0.16 }, T[i] + 0.16);
    tl.to(el, { backgroundColor: '#fe4d1e', borderColor: '#fe4d1e', scale: 1, duration: 0.2, ease: 'power2.out' }, 24.3 + i * 0.04);
    return el;
  });
  tl.to(pills, { y: 120, autoAlpha: 0, duration: 0.25, ease: 'power3.in', stagger: 0.02 }, 24.8);

  // final line
  const fm = h('div.mask', { style: { left: '0', right: '0', top: '800px', height: '150px' } });
  const fin = h('div.lang-word', { style: { top: '10px', fontSize: '100px' } });
  fm.append(fin);
  S.append(fm);
  const fchars = [...L.languages.final].map((c) => {
    const s = h('span', { style: { display: 'inline-block' } }, c === ' ' ? ' ' : c);
    if (c === '5') s.style.color = 'var(--orange)';
    fin.append(s);
    return s;
  });
  gsap.set(fchars, { yPercent: 110, autoAlpha: 0 });
  tl.set(fchars, { autoAlpha: 1 }, 24.28);
  tl.to(fchars, { yPercent: 0, duration: 0.45, ease: 'expo.out', stagger: 0.02 }, 24.28);
  const sub = h('div.sec-sub', { style: { top: '972px', color: '#a4a4ae' } }, L.languages.sub);
  S.append(sub);
  gsap.set(sub, { autoAlpha: 0 });
  tl.fromTo(sub, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out', immediateRender: false }, 24.4);
  tl.to([...fchars], { yPercent: -110, duration: 0.2, ease: 'power3.in', stagger: 0.01 }, 24.8);
  tl.to(sub, { autoAlpha: 0, duration: 0.15 }, 24.82);
  cue(24.28, 'chord');
}
