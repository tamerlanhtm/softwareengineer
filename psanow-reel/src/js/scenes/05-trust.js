// 19.0 – 22.2s  TRUST: forced 2FA, five languages, multi-currency.
(function () {
  const { el, T, O, E, tw, kf, inv, lerp, clamp } = R;
  const C = R.C;
  const S = { name: 'trust', vs: 18.95, ve: 22.3, z: 26 };
  const Y0 = 330, CH = 300, GAP = 40;
  const TIN = [19.0, 20.0, 21.0];
  const EXIT = 21.88;
  const GREET = R.t(['Hello', 'Salam', 'Merhaba', 'Привет', 'Salom'], ['Salam', 'Hello', 'Merhaba', 'Привет', 'Salom']);
  const LANGS = R.t(['EN', 'AZ', 'TR', 'RU', 'UZ'], ['AZ', 'EN', 'TR', 'RU', 'UZ']);
  const CUR = ['₼', '$', '€', '₺', '₽'];

  S.build = (root) => {
    const cam = (S.cam = el(root, 'abs', { width: '1080px', height: '1920px' }));
    const card = (i, icon, title, sub) => {
      const c = el(cam, 'abs', {
        left: '90px', top: Y0 + i * (CH + GAP) + 'px', width: '900px', height: CH + 'px', borderRadius: '40px',
        background: 'linear-gradient(180deg, #1D1815 0%, #141110 100%)', border: '2px solid rgba(255,255,255,.07)',
        boxShadow: '0 40px 100px rgba(0,0,0,.55)', transformOrigin: '450px 150px',
      });
      el(c, 'abs', { left: '44px', top: '44px', width: '120px', height: '120px', borderRadius: '30px', background: C.orange, display: 'grid', placeItems: 'center', color: '#fff', boxShadow: '0 16px 40px rgba(254,77,30,.35)' }, R.svgIcon(icon, 64, 2));
      el(c, 'abs f-head nowrap', { left: '196px', top: '50px', fontSize: '56px', fontWeight: '800', letterSpacing: '-0.035em', color: C.text }, title);
      el(c, 'abs f-mono nowrap', { left: '198px', top: '124px', fontSize: '21px', letterSpacing: '0.1em', color: '#A59B93' }, sub);
      return c;
    };
    S.cards = [
      card(0, 'shield-check', R.t('2FA for every user', 'Hər istifadəçiyə 2FA'), R.t('FORCED ENROLMENT · EVERY LOGIN', 'MƏCBURİ QOŞULMA · HƏR GİRİŞDƏ')),
      card(1, 'globe', R.t('5 languages', '5 dil'), R.t('EN · AZ · TR · RU · UZ', 'AZ · EN · TR · RU · UZ')),
      card(2, 'coins', R.t('Multi-currency', 'Çoxvalyutalı'), R.t('RATE CARDS · EXCHANGE RATES', 'TARİF KARTLARI · MƏZƏNNƏLƏR')),
    ];

    // 2FA code boxes
    S.otp = '482916'.split('').map((d, i) => {
      const b = el(S.cards[0], 'abs f-disp', { left: 44 + i * 82 + 'px', top: '194px', width: '70px', height: '76px', borderRadius: '16px', background: '#241E1A', border: '2px solid #3A322D', display: 'grid', placeItems: 'center', fontSize: '38px', fontWeight: '700', color: C.text });
      const dg = el(b, '', null, d, 'span');
      return { b, dg };
    });
    S.verified = el(S.cards[0], 'abs f-head nowrap', { left: '560px', top: '198px', height: '68px', padding: '0 26px 0 18px', borderRadius: '34px', background: 'rgba(254,77,30,.14)', border: '2px solid ' + C.orange, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '28px', fontWeight: '800', color: '#FFD2C2' },
      R.svgIcon('check', 30, 3, '#FF7A4D') + '<span>' + R.t('Verified', 'Təsdiqləndi') + '</span>');

    // languages
    S.chips = LANGS.map((l, i) => el(S.cards[1], 'abs f-mono', { left: 44 + i * 94 + 'px', top: '200px', width: '82px', height: '64px', borderRadius: '16px', background: '#241E1A', border: '2px solid #3A322D', display: 'grid', placeItems: 'center', fontSize: '24px', fontWeight: '700', color: '#CFC6BF' }, l));
    S.gBox = el(S.cards[1], 'abs f-disp', { left: '534px', top: '190px', width: '330px', height: '84px', overflow: 'hidden', fontSize: '46px', fontWeight: '700', letterSpacing: '-0.02em', color: C.orange, lineHeight: '84px' });
    S.greets = GREET.map((g) => el(S.gBox, 'abs nowrap', { left: '0', top: '0' }, g));

    // currencies
    S.cur = CUR.map((c, i) => el(S.cards[2], 'abs f-disp', { left: 44 + i * 86 + 'px', top: '196px', width: '74px', height: '74px', borderRadius: '20px', background: '#241E1A', border: '2px solid #3A322D', display: 'grid', placeItems: 'center', fontSize: '34px', fontWeight: '700', color: '#CFC6BF' }, c));
    S.curTxt = el(S.cards[2], 'abs f-head nowrap', { left: '494px', top: '198px', fontSize: '30px', fontWeight: '700', lineHeight: '36px', color: '#D5CCC5', letterSpacing: '-0.01em' }, R.t('Any client.<br><span style="color:#FF9B78">Any currency.</span>', 'İstənilən müştəri.<br><span style="color:#FF9B78">İstənilən valyuta.</span>'));

    TIN.forEach((t0, i) => { if (i) R.impact(t0 + 0.05, 8, 12, 12); });
  };

  S.update = (t) => {
    // whip in from below
    const wy = 2300 * (1 - E.outExpo(inv(19.0, 19.45, t)));
    T(S.cam, { y: wy });
    S.cards.forEach((c, i) => {
      const p = i === 0 ? 1 : E.outExpo(inv(TIN[i], TIN[i] + 0.5, t));
      const q = E.inExpo(inv(EXIT + i * 0.05, EXIT + i * 0.05 + 0.24, t));
      T(c, { x: (1 - p) * 760 - q * 1400, r: (1 - p) * 9 - q * 8, s: lerp(0.9, 1, p) });
      O(c, (i === 0 ? 1 : clamp(p * 3)) * (1 - q));
    });

    // OTP typing
    S.otp.forEach((o, i) => {
      const ti = 19.28 + i * 0.075;
      const p = inv(ti, ti + 0.12, t);
      T(o.dg, { y: (1 - E.outBack(p)) * 24, s: lerp(0.5, 1, E.outBack(p)) });
      O(o.dg, p);
      const active = t >= ti - 0.075 && t < ti + 0.02;
      const done = inv(19.78, 19.86, t);
      o.b.style.borderColor = active || done > 0 ? C.orange : '#3A322D';
      o.b.style.background = done > 0 ? `rgba(254,77,30,${0.18 * (1 - inv(19.9, 20.4, t)) + 0.06})` : '#241E1A';
    });
    const vp = inv(19.84, 20.06, t);
    T(S.verified, { s: lerp(0.4, 1, E.back(2.2)(vp)) });
    O(S.verified, vp);

    // languages cycle
    const lt = t - 20.2;
    const step = 0.28;
    const gi = lt < 0 ? 0 : Math.floor(lt / step) % 5;
    const gp = lt < 0 ? 0 : (lt % step) / step;
    S.greets.forEach((g, i) => {
      let y = 84;
      if (lt < 0) y = i === 0 ? (1 - E.outExpo(inv(TIN[1] + 0.12, TIN[1] + 0.45, t))) * 84 : 84;
      else {
        const roll = E.inOutQuart(clamp((gp - 0.62) / 0.38));
        if (i === gi) y = -roll * 84;
        else if (i === (gi + 1) % 5) y = (1 - roll) * 84;
      }
      T(g, { y });
    });
    S.chips.forEach((c, i) => {
      const on = (lt >= 0 && i === gi) || (lt < 0 && i === 0 && t > TIN[1] + 0.2);
      c.style.background = on ? C.orange : '#241E1A';
      c.style.borderColor = on ? C.orange : '#3A322D';
      c.style.color = on ? '#fff' : '#CFC6BF';
    });

    // currency cycle
    const ct = t - 21.3;
    const ci = ct < 0 ? -1 : Math.floor(ct / 0.14) % 5;
    S.cur.forEach((c, i) => {
      const on = i === ci;
      c.style.background = on ? C.orange : '#241E1A';
      c.style.borderColor = on ? C.orange : '#3A322D';
      c.style.color = on ? '#fff' : '#CFC6BF';
      const pop = on ? 1.08 : 1;
      T(c, { s: pop, y: on ? -4 : 0 });
    });
    const tp = E.outExpo(inv(21.25, 21.6, t));
    T(S.curTxt, { x: (1 - tp) * 40 });
    O(S.curTxt, tp);
  };

  window.SCENES.push(S);
})();
