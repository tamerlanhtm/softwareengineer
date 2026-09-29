/* Copy deck — every on-screen string of the reel, per language.
 * Pick the language with ?lang=az (default: en). Timing never depends on the
 * copy, so every language shares the same edit, cue sheet and soundtrack. */

const LANG = (new URLSearchParams(location.search).get('lang') || 'en').toLowerCase();
document.documentElement.lang = LANG; // language-aware text-transform (az: i → İ)

const I18N = {
  en: {
    title: 'TOSNow — Instagram Reel',
    money: (v) => '$' + Math.round(v).toLocaleString('en-US'),
    pct: (v) => v.toFixed(1) + '%',

    chaos: {
      sheet: ['rates_2026_FINAL_v7.xlsx', [['Hotel', 'Rate', 'Pax', 'Total'], ['Old City Inn', '85', '12', '1020'], ['Riverside', '110', '??', '#REF!'], ['Guide 3d', '150', '—', '450'], ['TOTAL', '', '', '#VALUE!']]],
      chat1: ['Hotel Sales', 'Is the hotel confirmed??'],
      mail1: ['reservations@', 'RE: RE: FW: Rooming list (final)'],
      sticky1: 'Call guide<br>re: 14 Jun!!',
      file1: 'rooming_list_v7_FINAL(2).xlsx',
      chat2: ['Driver', 'Can’t find the group \u{1F629}'],
      cal: ['JUNE', 'Rashad · Group A', 'Rashad · Group B'],
      mail2: ['Accounts', 'Invoice #0231 unpaid', 'OVERDUE'],
      chat3: ['Client', 'Which price did you quote us?'],
      fx: ['USD → AZN → EUR', 'which rate??'],
      missed: ['3 missed calls', 'Supplier · Gabala'],
      pass: ['Passport expires', 'in 2 weeks?!'],
      sheet2: ['costs.xlsx', [['A', 'B'], ['#VALUE!', '=SUM('], ['312', '??']]],
      file2: 'hotel_rates_2026.pdf',
      chat4: ['Agent', 'Need rooming list ASAP'],
      sticky2: 'Release<br>date??',
      now: 'now',
      burst: [['Guest', 'Any update?? \u{1F64F}'], ['Hotel', 'Sorry, fully booked'], ['Client', 'Can you resend the voucher?'],
        ['Guide', 'Sick tomorrow!!'], ['Partner', 'Invoice please'], ['Driver', 'Which hotel?']],
      phrases: [
        { num: '14', words: ['spreadsheets.'] },
        { num: '217', words: ['unread', 'messages.'] },
        { num: '1', words: ['double-booked', 'guide.'] },
        { num: null, words: ['Sound', 'familiar?'] },
      ],
    },

    logo: {
      sub: 'TOUR OPERATOR SYSTEM',
      line: 'One system for your',
      roll: ['enquiries.', 'itineraries.', 'suppliers.', 'departures.', 'vouchers.'],
    },

    modules: {
      kicker: '6 CORE &nbsp;·&nbsp; 2 ADD-ONS',
      modules: 'modules', groups: 'groups', core: 'CORE', addon: 'ADD-ON',
      labels: ['Suppliers & Contracts', 'Tours & Products', 'Sales & Reservations', 'Operations', 'Finance',
        'Agents & Distribution', 'Reporting & Analytics', 'Management & Security'],
    },

    hud: [
      ['01 · Sales & Reservations', ['Enquiries become', 'bookings.']],
      ['02 · Tours & Products', ['Itineraries,', 'day by day.']],
      ['03 · Pricing & Markup', ['Cost. Markup.', 'Sell price. Done.']],
      ['04 · Departures & Seats', ['Every seat,', 'tracked live.']],
      ['05 · Operations board', ['Ops board.', 'Zero clashes.']],
      ['06 · Documents & Vouchers', ['Vouchers with', 'QR check.']],
    ],
    addonTag: 'ADD-ON',
    card1: {
      name: 'Enquiries & Quotes', group: 'Sales & Reservations',
      meta: 'New enquiry · Istanbul · 2 min ago', fresh: 'NEW',
      chips: ['Baku · Gabala', '14–20 Jun', '12 pax'],
      label: 'Quote options', best: 'BEST VALUE', pp: 'pp',
      opts: [['Standard', '3-star hotels · group transfers', '$1,240'], ['Superior', '4-star hotels · English guide', '$1,480'], ['Deluxe', '5-star hotels · private car', '$1,890']],
      btn: 'Convert to booking', done: 'Booking TOS-2481 confirmed',
    },
    card2: {
      name: 'Tours & Packages', group: 'Tours & Products',
      title: 'Baku &amp; Gabala Explorer', days: '7 DAYS', badges: ['D1', 'D2', 'D3', 'D4'],
      plan: [
        ['Day 1 · Baku', [['plane', 'Airport pickup'], ['hotel', 'Old City Inn']]],
        ['Day 2 · Baku', [['compass', 'Guided city tour'], ['ticket', 'Gobustan']]],
        ['Day 3 · Gabala', [['bus', 'Transfer'], ['cable-car', 'Tufandag cable car']]],
        ['Day 4 · Gabala', [['utensils', 'Lakeside dinner'], ['hotel', 'Riverside Hotel']]],
      ],
      foot: ['3 more days', 'Inclusions', 'Terms'],
    },
    card3: {
      name: 'Pricing & Markup', group: 'Tours & Products',
      title: 'Cost build-up · Option B', pill: '12 PAX · DBL',
      segs: ['Hotels', 'Transport', 'Guides', 'Entrances', 'Meals'],
      rows: ['Total cost', 'Markup rule · groups 10+', 'Sell price', 'Per person'], margin: 'MARGIN 15.3%',
    },
    card4: {
      name: 'Departures & Seats', group: 'Tours & Products',
      title: 'Dep. 14 Jun 2026', sub: 'Baku &amp; Gabala Explorer', onRequest: 'ON REQUEST', guaranteed: 'GUARANTEED',
      sold: 'Seats sold', min: 'Min <b>12 pax</b> to guarantee', cutoff: 'Booking cutoff · 7 Jun', allot: 'Allotment · 6 rooms',
    },
    card5: {
      name: 'Operations Board', group: 'Operations',
      title: 'Dispatch · 14–20 Jun', unconfirmed: '3 UNCONFIRMED', allOk: 'ALL CONFIRMED',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      res: [['user-round', 'Rashad', 'Guide · EN'], ['car-front', 'Elvin', 'Driver'], ['car-front', 'Kamran', 'Driver'], ['bus', 'Van 10-AB', 'Vehicle']],
      bars: ['TOS-2481 · Tour', 'TOS-2477', 'TOS-2470', 'TOS-2481 · Transfer'],
      clash: 'Double-booking detected · Elvin · Wed', fixed: 'Resolved · reassigned to Kamran',
      conf: 'Supplier confirmations', confItems: ['Hotel', 'Transfer', 'Guide'],
    },
    card6: {
      name: 'Documents & Files', group: 'Management & Security',
      title: 'Supplier voucher', kicker: 'SERVICE VOUCHER', hotel: 'Riverside Hotel', place: 'Gabala, Azerbaijan',
      grid: [['CHECK-IN', '16 Jun'], ['NIGHTS', '2'], ['ROOMS', '6 DBL'], ['GUESTS', '12']],
      lead: 'Lead guest · Aylin Kaya', stamp: 'VERIFIED', file: 'voucher_TOS-2481.pdf', sent: 'SENT TO SUPPLIER',
    },

    bento: {
      hud: ['All 30 modules · one login', ['Plus everything', 'else you need.']],
      dash: ['Dashboard', 'Departures loading'],
      langsLabel: '5 languages',
      langs: [['Hello', 'EN'], ['Salam', 'AZ'], ['Merhaba', 'TR'], ['Привет', 'RU'], ['Salom', 'UZ']],
      fx: ['Multi-currency', '1 USD = 1.70 AZN'],
      margins: ['Margins', 'Booking · departure · agent'],
      agent: ['Agent portal', 'Partners quote &amp; book<br>themselves', 'New agent booking'],
      roles: ['Roles &amp; access', ['Reservations', 'Operations', 'Finance', 'Sales', 'Product', 'Management']],
      auto: ['Automation', 'Payment received', 'Send voucher'],
      you: 'Your agency<br>here.',
    },

    cta: {
      kicker: 'TOSNOW · TOUR OPERATOR SYSTEM',
      head: ['Everything your tour', 'company needs.'],
      now: 'Now.',
      btn: 'Book a demo',
      dm: 'DM us <b>@ineednow_</b>',
    },
  },

  az: {
    title: 'TOSNow — Instagram Reels (AZ)',
    // az style (15.050 $), formatted by hand: headless Chromium ships without az number data
    money: (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' $',
    pct: (v) => v.toFixed(1).replace('.', ',') + '%',

    chaos: {
      sheet: ['qiymətlər_2026_SON_v7.xlsx', [['Otel', 'Qiymət', 'Nəfər', 'Cəmi'], ['İçərişəhər', '85', '12', '1020'], ['Riverside', '110', '??', '#REF!'], ['Bələdçi 3g', '150', '—', '450'], ['CƏMİ', '', '', '#VALUE!']]],
      chat1: ['Otel satışı', 'Otel təsdiqləndi??'],
      mail1: ['rezervasiya@', 'RE: RE: FW: Otaq siyahısı (son)'],
      sticky1: 'Bələdçiyə<br>zəng et!<br>14 iyun!!',
      file1: 'otaq_siyahısı_v7_SON(2).xlsx',
      chat2: ['Sürücü', 'Qrupu tapa bilmirəm \u{1F629}'],
      cal: ['İYUN', 'Rəşad · A qrupu', 'Rəşad · B qrupu'],
      mail2: ['Mühasibatlıq', 'Hesab-faktura #0231 ödənilməyib', 'GECİKİB'],
      chat3: ['Müştəri', 'Bizə hansı qiyməti demişdiniz?'],
      fx: ['USD → AZN → EUR', 'hansı məzənnə??'],
      missed: ['3 buraxılmış zəng', 'Təchizatçı · Qəbələ'],
      pass: ['Pasportun vaxtı bitir', '2 həftəyə?!'],
      sheet2: ['xərclər.xlsx', [['A', 'B'], ['#VALUE!', '=SUM('], ['312', '??']]],
      file2: 'otel_qiymətləri_2026.pdf',
      chat4: ['Agent', 'Otaq siyahısı təcili lazımdır'],
      sticky2: 'Kvota<br>tarixi??',
      now: 'indi',
      burst: [['Qonaq', 'Xəbər var?? \u{1F64F}'], ['Otel', 'Bağışlayın, yer yoxdur'], ['Müştəri', 'Vauçeri yenidən göndərin?'],
        ['Bələdçi', 'Sabah xəstəyəm!!'], ['Tərəfdaş', 'Hesab-faktura lazımdır'], ['Sürücü', 'Hansı otel?']],
      phrases: [
        { num: '14', words: ['Excel cədvəli.'] },
        { num: '217', words: ['oxunmamış', 'mesaj.'] },
        { num: '1', words: ['bələdçi,', 'iki qrup.'] },
        { num: null, words: ['Tanış', 'gəlir?'] },
      ],
    },

    logo: {
      sub: 'TUROPERATORLAR ÜÇÜN SİSTEM',
      line: 'Hamısı bir sistemdə:',
      roll: ['sorğular.', 'marşrutlar.', 'təchizatçılar.', 'gedişlər.', 'vauçerlər.'],
    },

    modules: {
      kicker: '6 ƏSAS &nbsp;·&nbsp; 2 ƏLAVƏ',
      modules: 'modul', groups: 'qrup', core: 'ƏSAS', addon: 'ƏLAVƏ',
      labels: ['Təchizatçılar və müqavilələr', 'Turlar və məhsullar', 'Satış və rezervasiyalar', 'Əməliyyatlar', 'Maliyyə',
        'Agentlər və distribusiya', 'Hesabatlar və analitika', 'İdarəetmə və təhlükəsizlik'],
    },

    hud: [
      ['01 · Satış və rezervasiyalar', ['Sorğudan', 'rezervasiyaya.']],
      ['02 · Turlar və məhsullar', ['Tur proqramı,', 'gün-gün.']],
      ['03 · Qiymət və əlavələr', ['Maya dəyərindən', 'satış qiymətinə.']],
      ['04 · Gedişlər və yerlər', ['Hər yer', 'canlı izlənir.']],
      ['05 · Əməliyyat lövhəsi', ['Bir lövhə.', 'Sıfır konflikt.']],
      ['06 · Sənədlər və vauçerlər', ['QR yoxlamalı', 'vauçerlər.']],
    ],
    addonTag: 'ƏLAVƏ',
    card1: {
      name: 'Sorğular və təkliflər', group: 'Satış və rezervasiyalar',
      meta: 'Yeni sorğu · İstanbul · 2 dəq. əvvəl', fresh: 'YENİ',
      chips: ['Bakı · Qəbələ', '14–20 iyun', '12 nəfər'],
      label: 'Təklif variantları', best: 'ƏN SƏRFƏLİ', pp: '/nəfər',
      opts: [['Standart', '3 ulduzlu otellər · qrup transferi', '1.240 $'], ['Komfort', '4 ulduzlu otellər · bələdçi', '1.480 $'], ['Lüks', '5 ulduzlu otellər · fərdi avtomobil', '1.890 $']],
      btn: 'Rezervasiyaya çevir', done: 'TOS-2481 rezervasiyası təsdiqləndi',
    },
    card2: {
      name: 'Turlar və paketlər', group: 'Turlar və məhsullar',
      title: 'Bakı və Qəbələ turu', days: '7 GÜN', badges: ['1', '2', '3', '4'],
      plan: [
        ['1-ci gün · Bakı', [['plane', 'Hava limanında qarşılama'], ['hotel', 'İçərişəhər Otel']]],
        ['2-ci gün · Bakı', [['compass', 'Bələdçili şəhər turu'], ['ticket', 'Qobustan']]],
        ['3-cü gün · Qəbələ', [['bus', 'Transfer'], ['cable-car', 'Tufandağ kanat yolu']]],
        ['4-cü gün · Qəbələ', [['utensils', 'Göl kənarında şam yeməyi'], ['hotel', 'Riverside Hotel']]],
      ],
      foot: ['daha 3 gün', 'Daxildir', 'Şərtlər'],
    },
    card3: {
      name: 'Qiymət və əlavələr', group: 'Turlar və məhsullar',
      title: 'Maya dəyəri · Variant B', pill: '12 NƏFƏR · DBL',
      segs: ['Otellər', 'Nəqliyyat', 'Bələdçilər', 'Biletlər', 'Yemək'],
      rows: ['Ümumi maya dəyəri', 'Əlavə qaydası · 10+ nəfər', 'Satış qiyməti', 'Nəfər başına'], margin: 'MARJA 15,3%',
    },
    card4: {
      name: 'Gedişlər və yerlər', group: 'Turlar və məhsullar',
      title: 'Gediş · 14 iyun 2026', sub: 'Bakı və Qəbələ turu', onRequest: 'SORĞU ÜZRƏ', guaranteed: 'ZƏMANƏTLİ',
      sold: 'Satılan yerlər', min: 'Zəmanət üçün min. <b>12 nəfər</b>', cutoff: 'Satışın sonu · 7 iyun', allot: 'Kvota · 6 otaq',
    },
    card5: {
      name: 'Əməliyyat lövhəsi', group: 'Əməliyyatlar',
      title: 'Təyinatlar · 14–20 iyun', unconfirmed: '3 TƏSDİQSİZ', allOk: 'HAMISI TƏSDİQLİ',
      days: ['B.E.', 'Ç.A.', 'Ç.', 'C.A.', 'C.', 'Ş.', 'B.'],
      res: [['user-round', 'Rəşad', 'Bələdçi · EN'], ['car-front', 'Elvin', 'Sürücü'], ['car-front', 'Kamran', 'Sürücü'], ['bus', '10-AB-123', 'Mikroavtobus']],
      bars: ['TOS-2481 · Tur', 'TOS-2477', 'TOS-2470', 'TOS-2481 · Transfer'],
      clash: 'İkiqat təyinat aşkarlandı · Elvin', fixed: 'Həll olundu · Kamrana təyin edildi',
      conf: 'Təchizatçı təsdiqləri', confItems: ['Otel', 'Transfer', 'Bələdçi'],
    },
    card6: {
      name: 'Sənədlər və fayllar', group: 'İdarəetmə və təhlükəsizlik',
      title: 'Təchizatçı vauçeri', kicker: 'XİDMƏT VAUÇERİ', hotel: 'Riverside Hotel', place: 'Qəbələ, Azərbaycan',
      grid: [['GİRİŞ', '16 iyun'], ['GECƏ', '2'], ['OTAQ', '6 DBL'], ['QONAQ', '12']],
      lead: 'Əsas qonaq · Aylin Kaya', stamp: 'YOXLANILDI', file: 'vauçer_TOS-2481.pdf', sent: 'TƏCHİZATÇIYA GÖNDƏRİLDİ',
    },

    bento: {
      hud: ['30 modulun hamısı · bir giriş', ['Və sizə lazım olan', 'hər şey.']],
      dash: ['İdarə paneli', 'Gedişlərin doluluğu'],
      langsLabel: '5 dil',
      langs: [['Salam', 'AZ'], ['Hello', 'EN'], ['Merhaba', 'TR'], ['Привет', 'RU'], ['Salom', 'UZ']],
      fx: ['Çoxvalyutalı', '1 USD = 1,70 AZN'],
      margins: ['Marja', 'Rezerv · gediş · agent'],
      agent: ['Agent portalı', 'Tərəfdaşlar özləri<br>sifariş edir', 'Yeni agent sifarişi'],
      roles: ['Rollar və giriş', ['Rezervasiya', 'Əməliyyat', 'Maliyyə', 'Satış', 'Məhsul', 'İdarəetmə']],
      auto: ['Avtomatlaşdırma', 'Ödəniş alındı', 'Vauçer göndər'],
      you: 'Sizin agentlik<br>burada.',
    },

    cta: {
      kicker: 'TOSNOW · TUROPERATORLAR ÜÇÜN SİSTEM',
      head: ['Tur şirkətinizə', 'lazım olan hər şey.'],
      now: 'İndi.',
      btn: 'Demo sifariş edin',
      dm: 'Bizə yazın <b>@ineednow_</b>',
    },
  },
};

const L = I18N[LANG] || I18N.en;
document.title = L.title;
