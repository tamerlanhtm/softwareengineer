// S1 — HOOK (0 → 3.75s). "I need … everything. Now." collapses into the ineed.now wordmark,
// the scattered chaos of spreadsheets & missed calls gets sucked into its dot, and the dot floods the screen.
import { b, el, set, css, E, ez, kf, lerp, wobble, charLayout, textWidth, icon, noise1, ORANGE } from '../engine.js';

const REEL = ['more leads.', 'closed deals.', 'paid invoices.', 'real numbers.', 'less busywork.',
  'happy clients.', 'more time.', 'zero chaos.', 'growth.', 'control.', 'everything.'];

// Which reel word sits in the slot over time (fractional = rolling between words).
const REEL_POS = [
  [0.06, -1], [0.40, 0, E.outExpo],
  [0.70, 0], [0.98, 1, E.outExpo],
  [1.17, 1], [1.45, 2, E.outExpo],
  [1.64, 2], [1.84, 3, E.outExpo],
  [1.875, 3], [2.06, 4, E.outExpo],
  [2.11, 4], [2.39, 10.07, E.outCubic], [2.48, 10, E.inOutQuad],
  [2.81, 10], [3.0, 11, E.outExpo],
];

const CHAOS = [
  { ic: 'file-spreadsheet', t: 'leads_FINAL_v7.xlsx', x: 70, y: 318, r: -7, d: 1.0 },
  { ic: 'phone-missed', t: '5 missed calls', x: 628, y: 262, r: 6, d: 0.86, warn: true },
  { ic: 'chart-column', t: 'Q3 numbers???', x: 96, y: 500, r: 4, d: 0.8 },
  { ic: 'triangle-alert', t: 'Invoice #0931 overdue', x: 520, y: 470, r: -4, d: 0.95, warn: true },
  { ic: 'circle-help', t: 'Who owns this deal?', x: 60, y: 1235, r: 5, d: 1.0 },
  { ic: 'mail', t: '47 unread', x: 664, y: 1180, r: -6, d: 0.82 },
  { sticky: true, t: 'call Murad back!!', x: 520, y: 1400, r: 7, d: 1.05 },
  { ic: 'file-text', t: 'quote sent… or not?', x: 80, y: 1440, r: -5, d: 0.9 },
  { ic: 'calendar-clock', t: 'follow up… when?', x: 600, y: 1640, r: -3, d: 0.72 },
  { ic: 'file-spreadsheet', t: 'copy of pipeline (3).xlsx', x: 40, y: 1690, r: 3, d: 0.7 },
];

export default {
  id: 'hook',
  a: 0,
  b: b(8),
  pre: 0,
  post: 0.42,
  z: 10,

  build(layer, ctx, fx) {
    const X0 = 90;
    // Fit the widest phrase into 900px.
    const probe = (s) => textWidth(s, '800 100px "Inter Tight Variable"', -4.5);
    const widest = Math.max(...REEL.map(probe), probe('I need'));
    const F = Math.min(150, Math.floor((900 / widest) * 100));
    const TR = -0.045 * F;
    const font = `800 ${F}px "Inter Tight Variable"`;
    const LH = 1.3 * F;
    const yA = 905 - 0.1 * F;           // baseline of "I need"
    const yB = yA + 1.04 * F;           // baseline of the slot line
    const baseOff = measureBaseline(font, F);

    this.F = F;
    this.layer = layer;
    this.baseOff = baseOff;
    const glyph = (parent, ch, color = 'var(--tx)') => {
      const n = el('span', 'hk-g', null, parent);
      n.textContent = ch;
      n.style.cssText = `position:absolute;left:0;top:0;font:${font};line-height:${F}px;white-space:pre;color:${color};transform-origin:0 ${baseOff}px`;
      return n;
    };

    // ---- chaos chips (behind the type)
    const chaosLayer = el('div', 'layer', null, layer);
    this.chips = CHAOS.map((c, i) => {
      const n = el('div', 'hk-chip' + (c.warn ? ' warn' : '') + (c.sticky ? ' sticky' : ''),
        c.sticky ? `<span>${c.t}</span>` : `${icon(c.ic, 34, 2.2)}<span>${c.t}</span>`, chaosLayer);
      return { ...c, n, i };
    });
    for (const c of this.chips) { c.w = c.n.offsetWidth; c.h = c.n.offsetHeight; }

    // ---- line A: "I need" (free glyphs so they can morph)
    const lineA = el('div', 'layer', null, layer);
    const la = charLayout('I need', font, TR, 0.1 * F);
    this.A = [...'I need'].map((ch, i) => ({ ch, n: ch === ' ' ? null : glyph(lineA, ch), x: X0 + la.xs[i], y: yA - baseOff }));
    this.lineA = lineA;
    this.maskA = { top: yA - 0.98 * F, bottom: yA + 0.3 * F };

    // ---- slot reel (masked)
    const slotTop = yB - 1.0 * F;
    const slot = el('div', 'hk-slot', null, layer);
    slot.style.cssText = `position:absolute;left:0;top:${slotTop}px;width:1080px;height:${1.3 * F}px;overflow:hidden;`;
    this.reel = REEL.map((w, wi) => {
      const lay = charLayout(w, font, TR, 0.05 * F);
      return [...w].map((ch, ci) => ({ n: ch === ' ' ? null : glyph(slot, ch, ORANGE), x: X0 + lay.xs[ci], ci, wi }));
    }).flat().filter((g) => g.n);
    this.slotRest = yB - baseOff - slotTop;
    this.LH = LH;

    // ---- "Now." (free glyphs, slams in, then morphs)
    const lnow = charLayout('Now.', font, TR);
    const nowLayer = el('div', 'layer', null, layer);
    this.NOW = [...'Now.'].map((ch, i) => ({ ch, n: glyph(nowLayer, ch, ORANGE), x: X0 + lnow.xs[i], y: yB - baseOff }));

    // ---- wordmark target layout: "ineed" + ■ + "now"
    const Wf = 176;
    const fontW = `800 ${Wf}px "Inter Tight Variable"`;
    const trW = -0.04 * Wf;
    const k = Wf / F;
    const l1 = charLayout('ineed', fontW, trW);
    const l2 = charLayout('now', fontW, trW);
    const dot = 0.235 * Wf;
    const gap = 0.075 * Wf;
    const total = l1.width + gap + dot + gap + l2.width;
    const wx = 540 - total / 2;
    const yW = 1010;
    const baseOffW = baseOff * k;
    const tgt = (x) => ({ x, y: yW - baseOffW, s: k });
    this.targetsA = { I: tgt(wx + l1.xs[0]), n: tgt(wx + l1.xs[1]), e1: tgt(wx + l1.xs[2]), e2: tgt(wx + l1.xs[3]), d: tgt(wx + l1.xs[4]) };
    const nx = wx + l1.width + gap + dot + gap;
    this.targetsN = [tgt(nx + l2.xs[0]), tgt(nx + l2.xs[1]), tgt(nx + l2.xs[2])];
    this.dotT = { x: wx + l1.width + gap, y: yW - dot, size: dot };
    ctx.shared.dot = { x: this.dotT.x + dot / 2, y: this.dotT.y + dot / 2 };
    this.wordmarkCenter = { x: 540, y: yW - 0.36 * Wf };

    // lowercase stand-ins that cross-fade in during the morph
    this.iG = glyph(nowLayer, 'i', 'var(--tx)');
    this.nG = glyph(nowLayer, 'n', ORANGE);

    // the brand dot (also the flood)
    this.dot = el('div', 'hk-dot', null, layer);
    this.dot.style.cssText = `position:absolute;left:0;top:0;width:${dot}px;height:${dot}px;border-radius:${dot * 0.157}px;background:${ORANGE};`;
    this.dotSize = dot;
    this.periodSize = 0.2 * F;

    // ---- audio + camera
    const C = fx.cues;
    [0.08, 0.70, 1.17, 1.64, 1.875].forEach((t, i) => C.push({ t, type: 'tick', i }));
    C.push({ t: 2.11, type: 'spin' }, { t: 2.40, type: 'land' }, { t: 2.81, type: 'slam' },
      { t: 3.05, type: 'morph' }, { t: 3.15, type: 'suck' }, { t: 3.75, type: 'drop' });
    this.chips.forEach((c) => C.push({ t: 0.04 + c.i * 0.13, type: 'blip', i: c.i }));
    fx.hits.push({ t: 2.81, amp: 14, punch: 0.035, freq: 13, decay: 10 }, { t: 3.75, amp: 20, punch: 0.05, freq: 10, decay: 7 });
  },

  update(tau) {
    const t = tau;
    const F = this.F;

    // ---- chaos chips: pop in, float, get sucked into the dot
    const dc = { x: this.dotT.x + this.dotSize / 2, y: this.dotT.y + this.dotSize / 2 };
    for (const c of this.chips) {
      const t0 = 0.04 + c.i * 0.13;
      const a = ez(t, t0, t0 + 0.5, E.outBackSoft);
      const ts = 3.08 + ((c.i * 7) % 10) * 0.028;
      const su = ez(t, ts, ts + 0.5, E.inCubic);
      const fx_ = noise1(t * 0.9, c.i) * 14;
      const fy = Math.sin(t * 1.7 + c.i) * 10;
      const { w, h } = c;
      const cx = c.x + w / 2 + fx_;
      const cy = c.y + h / 2 + fy;
      const x = lerp(cx, dc.x, su) - w / 2;
      const y = lerp(cy, dc.y, su) - h / 2;
      set(c.n, {
        x, y,
        r: c.r + Math.sin(t * 1.1 + c.i) * 1.5 + su * 220 * (c.i % 2 ? 1 : -1),
        s: (0.6 + 0.4 * a) * c.d * (1 - su * 0.95),
        o: Math.min(1, a) * (c.d > 0.8 ? 0.95 : 0.7) * (1 - ez(t, ts + 0.3, ts + 0.5)),
        blur: (1 - c.d) * 7 + su * 3,
      });
    }

    // ---- line A reveal (masked rise), then morph
    const clipOn = t < 1.0;
    css(this.lineA, 'clip-path', clipOn ? `inset(${this.maskA.top}px 0 ${1920 - this.maskA.bottom}px 0)` : 'none');
    const mStart = 3.05;
    const idx = { 0: 'I', 2: 'n', 3: 'e1', 4: 'e2', 5: 'd' };
    let order = 0;
    this.A.forEach((g, i) => {
      if (!g.n) return;
      const a = ez(t, -0.4 + i * 0.04, 0.2 + i * 0.04, E.outExpo);
      const tg = this.targetsA[idx[i]];
      const m = ez(t, mStart + order * 0.018, mStart + 0.33 + order * 0.018, E.inOutQuart);
      order++;
      const arc = Math.sin(m * Math.PI) * -26;
      const x = lerp(g.x, tg.x, m);
      const y = lerp(g.y + (1 - a) * F * 1.1, tg.y, m) + arc;
      const s = lerp(1, tg.s, m);
      const fadeI = g.ch === 'I' ? 1 - ez(t, mStart + 0.08, mStart + 0.26) : 1;
      set(g.n, { x, y, s, o: fadeI });
      if (g.ch === 'I') set(this.iG, { x, y, s, o: ez(t, mStart + 0.08, mStart + 0.26) });
    });

    // ---- slot reel
    for (const g of this.reel) {
      const p = kf(t - g.ci * 0.009, REEL_POS);
      const d = g.wi - p;
      if (Math.abs(d) > 1.02 || t > 3.05) { set(g.n, { o: 0 }); continue; }
      set(g.n, { x: g.x, y: this.slotRest + d * this.LH, o: 1 });
    }

    // ---- "Now." slam + morph
    const nowIn = 2.81;
    this.NOW.forEach((g, i) => {
      const a = ez(t, nowIn + i * 0.03, nowIn + 0.24 + i * 0.03, E.outExpo);
      const op = ez(t, nowIn + i * 0.03, nowIn + 0.07 + i * 0.03, E.linear);
      if (g.ch === '.') {
        // the period hands over to the brand dot
        set(g.n, { x: g.x, y: g.y, s: 2.2 - 1.2 * a, o: op * (1 - ez(t, mStart, mStart + 0.1)), origin: '50% 70%' });
        return;
      }
      const tg = this.targetsN[i];
      const m = ez(t, mStart + (i + 2) * 0.02, mStart + 0.33 + (i + 2) * 0.02, E.inOutQuart);
      const s0 = 2.2 - 1.2 * a;
      const x = lerp(g.x, tg.x, m);
      const y = lerp(g.y, tg.y, m) + Math.sin(m * Math.PI) * 30;
      const s = lerp(s0, tg.s, m);
      const col = m > 0 ? mixColor(ORANGE, '#F7F5F3', ez(t, mStart + 0.05, mStart + 0.3)) : ORANGE;
      css(g.n, 'color', col);
      const fadeN = i === 0 ? 1 - ez(t, mStart + 0.1, mStart + 0.28) : 1;
      set(g.n, { x, y, s, o: op * fadeN });
      if (i === 0) {
        css(this.nG, 'color', col);
        set(this.nG, { x, y, s, o: ez(t, mStart + 0.1, mStart + 0.28) });
      }
    });

    // ---- brand dot: period -> dot -> anticipation -> flood
    const per = this.NOW[3];
    const pStart = { x: per.x + 0.02 * F, y: per.y + 0.66 * F, size: this.periodSize };
    const m = ez(t, mStart + 0.02, mStart + 0.36, E.inOutQuart);
    const ds = this.dotSize;
    const x = lerp(pStart.x, this.dotT.x, m);
    const y = lerp(pStart.y, this.dotT.y, m) + Math.sin(m * Math.PI) * -60;
    const sz = lerp(pStart.size, ds, m) / ds;
    const land = wobble(t - (mStart + 0.36), 5, 9) * 0.18;
    const antic = kf(t, [[3.5, 1], [3.72, 0.78, E.inOutQuad]]);
    const flood = ez(t, 3.75, 4.08, E.inOutCubic);
    const floodS = 1 + flood * 95;
    set(this.dot, {
      x, y,
      s: (sz + land) * antic * floodS,
      r: flood * 90,
      o: t >= mStart ? 1 : 0,
      origin: '50% 50%',
    });

    // gentle push-in on the finished wordmark
    const push = 1 + ez(t, 3.38, 3.75, E.inQuad) * 0.035;
    set(this.layer, { s: push, origin: `${this.wordmarkCenter.x}px ${this.wordmarkCenter.y}px` });
  },
};

// ------------------------------------------------------------------ helpers
function measureBaseline(font, lh) {
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:absolute;left:-9999px;top:0;font:${font};line-height:${lh}px;white-space:nowrap`;
  wrap.innerHTML = 'Hxg<span style="display:inline-block;width:1px;height:0;vertical-align:baseline"></span>';
  document.body.appendChild(wrap);
  const off = wrap.lastChild.getBoundingClientRect().top - wrap.getBoundingClientRect().top;
  wrap.remove();
  return off;
}

function mixColor(a, c, k) {
  const pa = hex(a);
  const pc = hex(c);
  const m = pa.map((v, i) => Math.round(lerp(v, pc[i], k)));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
function hex(h) { return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); }
