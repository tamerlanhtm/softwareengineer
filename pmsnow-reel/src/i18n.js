// Localisation. Pick the language with ?lang=az (default: en).
// Every on-screen string, illustrative price and number format lives here.
export const LANG = (new URLSearchParams(location.search).get('lang') || 'en').toLowerCase();
// needed so CSS `text-transform: uppercase` maps i → İ in Azerbaijani
document.documentElement.lang = LANG;

const NB = ' ';

const en = {
  hook: { lines: [['RUNNING', 0], ['A HOTEL', 1]] },
  chips: [
    ['Overbooking!', 'Room 204 · two guests, one bed'],
    ['12 rooms not cleaned', 'Arrivals in 40 min'],
    ['Invoice missing', 'Corporate · Caspian Tours'],
    ['Walk-in at the desk', 'Which rooms are free?'],
    ['Deposit not received', 'Booking #4821'],
    ['Night audit', 'Still not closed · 02:14'],
    ['New 2★ review', '“Nobody answered the phone”'],
    ['Rates not updated', 'Weekend +20%?'],
    ['AC broken', 'Room 118 · since Monday'],
    ['Group booking', '18 rooms · still in Excel'],
    ['Linen out of stock', 'Floor 3'],
    ['Owner calling…', '3 missed calls'],
  ],
  dash: {
    hl: ['Your hotel,', '<span class="accent">live.</span>'], hud: 'Dashboard',
    kpi: ['Occupancy', 'ADR', 'RevPAR', 'Revenue'],
    chart: 'Occupancy', sub: 'Last 14 days', arrivals: '24 arrivals', departures: '18 departures', tip: 'Today · 87%',
  },
  resv: {
    hl: ['Every booking.', '<span class="accent">One view.</span>'], hud: 'Reservations',
    days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
    types: ['Deluxe', 'Deluxe', 'Twin', 'Twin', 'Deluxe', 'Suite', 'Twin', 'Deluxe'],
    n: (k) => `${k}n`, group: 'Group', waitlist: 'Waitlist',
    legend: ['Confirmed', 'In-house', 'Group', 'Waitlist'],
    guest: 'Ayşe K.', quote: 'Auto rate quote',
  },
  desk: {
    hl: ['Check-in in', '<span class="accent">seconds.</span>'], hud: 'Front desk',
    name: 'Ayşe Kaya', initials: 'AK', sub: '3 nights · Deluxe King · 2 adults',
    arriving: 'Arriving today', inhouse: 'In-house', room: 'Room', roomSub: 'Floor 3 · Deluxe King · Upgrade-ready',
    checks: ['ID scanned', 'Deposit received', 'Registration card'], sig: 'Guest signature',
    btn: 'Check in', done: 'Checked in',
  },
  hk: {
    hl: ['Rooms ready.', '<span class="accent">In real time.</span>'], hud: 'Housekeeping',
    floors: ['All floors', 'F2', 'F3', 'F4', 'F5'], ready: 'Ready',
    st: { occ: 'Occupied', dirty: 'Dirty', clean: 'Clean', insp: 'Inspected', cleaning: 'Cleaning', inhouse: 'Checked in' },
  },
  bill: {
    hl: ['Split bills.', '<span class="w">Instant invoices.</span>'], hud: 'Billing & payments',
    folio: 'Folio #10482', folioSub: 'Room 305 · Ayşe Kaya · 3 nights', split: 'Split bill',
    items: ['Room · 3 nights', 'Restaurant · room charge', 'Spa · massage', 'Minibar'],
    subtotal: 'Subtotal', vat: 'VAT 18%', total: 'Total', methods: ['Cash', 'Card', 'Bank transfer'],
    guest: 'Guest', company: 'Company', guestName: 'Ayşe Kaya', card: 'Card ···· 4821', bank: 'Bank transfer', paid: 'PAID',
  },
  audit: {
    hl: ['Night audit,', '<span class="accent">automated.</span>'], hud: 'Night audit',
    running: 'Closing the day…', done: '✓ Day closed',
    items: ['Room charges posted', 'No-shows processed'], date: 'Business date', d0: '26 SEP', d1: '27 SEP',
  },
  guest: {
    hl: ['Know every', '<span class="accent">guest.</span>'], hud: 'Guest CRM',
    name: 'Murat Yılmaz', initials: 'MY', sub: 'Corporate · Istanbul',
    tags: ['Loyalty · Gold', 'Late check-out', 'High floor'], note: 'Prefers a quiet room · extra pillows',
    stats: ['Stays', 'Nights', 'Lifetime value'],
    fb: 'Guest feedback', fbSub: 'From the in-room QR card', alert: 'Low-score alerts on', qr: 'SCAN · RATE · SHARE',
  },
  lang: {
    hl: ['Speaks your', '<span class="accent">language.</span>'], hud: 'EN · AZ · TR · RU',
    words: [
      ['EN', 'English', ['Welcome']],
      ['AZ', 'Azərbaycanca', ['Xoş', 'gəlmisiniz']],
      ['TR', 'Türkçe', ['Hoş', 'geldiniz']],
      ['RU', 'Русский', ['Добро', 'пожаловать']],
    ],
  },
  mods: {
    names: ['Reservations', 'Front Desk', 'Rooms', 'Housekeeping', 'Guest CRM', 'Guest Feedback', 'Billing', 'Payments',
      'Revenue', 'Accounting', 'Night Audit', 'Channel Manager', 'Booking Engine', 'Corporate', 'Maintenance', 'Inventory',
      'Staff', 'Restaurant POS', 'Spa & Wellness', 'Events', 'Dashboard', 'Reports', 'Users & Roles', 'Notifications',
      'Documents', 'API', 'Settings'],
    label: 'modules', core: 'Core — included', addons: 'Add-ons — as you grow',
    hl: ['27 modules.', '<span class="accent">One system.</span>'],
  },
  cta: { tag: ['Everything your', 'hotel needs.'], now: 'Now.', nowDy: 0, btn: 'Book a demo' },
  // illustrative figures (RevPAR = ADR × occupancy; folio totals add up incl. 18% VAT)
  num: { adr: 124, revpar: 108, revenueK: 48.9, room: 372, rest: 64, spa: 90, mini: 18, sub: 544, vat: 97.92, total: 641.92,
    guestPays: 202.96, companyPays: 438.96, ltv: 4200 },
  money: (v, d = 0) => '$' + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }),
  moneyK: (v) => '$' + v.toFixed(1) + '<small>K</small>',
  ltv: (v) => '$' + (v / 1000).toFixed(1) + 'K',
  dec: (v, d) => v.toFixed(d),
};

const az = {
  hook: { lines: [['OTEL', 0], ['İDARƏ', 1], ['EDİRSİNİZ', 1.4]] },
  chips: [
    ['İkiqat bron!', 'Otaq 204 · iki qonaq, bir çarpayı'],
    ['12 otaq təmizlənməyib', 'Qonaqlar 40 dəqiqəyə gəlir'],
    ['Hesab-faktura yoxdur', 'Korporativ · Caspian Tours'],
    ['Resepşnda qonaq gözləyir', 'Hansı otaqlar boşdur?'],
    ['Depozit ödənilməyib', 'Bron #4821'],
    ['Gecə auditi', 'Hələ bağlanmayıb · 02:14'],
    ['Yeni 2★ rəy', '“Telefona heç kim cavab vermədi”'],
    ['Qiymətlər yenilənməyib', 'Həftəsonu +20%?'],
    ['Kondisioner işləmir', 'Otaq 118 · bazar ertəsindən'],
    ['Qrup bronu', '18 otaq · hələ də Excel-də'],
    ['Yataq dəstləri bitib', '3-cü mərtəbə'],
    ['Otel sahibi zəng edir…', '3 cavabsız zəng'],
  ],
  dash: {
    hl: ['Otelinizi', '<span class="accent">canlı izləyin.</span>'], hud: 'İdarə paneli',
    kpi: ['Doluluq', 'ADR', 'RevPAR', 'Gəlir'],
    chart: 'Doluluq', sub: 'Son 14 gün', arrivals: '24 gəliş', departures: '18 gediş', tip: 'Bu gün · 87%',
  },
  resv: {
    hl: ['Bütün bronlar', '<span class="accent">bir ekranda.</span>'], hud: 'Rezervasiyalar',
    days: ['B.E', 'Ç.A', 'Ç', 'C.A', 'C', 'Ş', 'B'],
    types: ['Delüks', 'Delüks', 'İkiyerlik', 'İkiyerlik', 'Delüks', 'Lüks', 'İkiyerlik', 'Delüks'],
    n: (k) => `${k} gecə`, group: 'Qrup', waitlist: 'Gözləmə siyahısı',
    legend: ['Təsdiqlənib', 'Oteldə', 'Qrup', 'Gözləmə'],
    guest: 'Aysel K.', quote: 'Avtomatik qiymət',
  },
  desk: {
    hl: ['Qeydiyyat', '<span class="accent">saniyələr içində.</span>'], hud: 'Resepşn',
    name: 'Aysel Kərimova', initials: 'AK', sub: '3 gecə · Delüks King · 2 nəfər',
    arriving: 'Bu gün gəlir', inhouse: 'Oteldə', room: 'Otaq', roomSub: '3-cü mərtəbə · Delüks King · Yüksəltmə mümkün',
    checks: ['Sənəd skan edildi', 'Depozit alındı', 'Qeydiyyat kartı'], sig: 'Qonağın imzası',
    btn: 'Qeydiyyat et', done: 'Qeydiyyat tamamlandı',
  },
  hk: {
    hl: ['Otaqlar hazır.', '<span class="accent">Real vaxtda.</span>'], hud: 'Təmizlik xidməti',
    floors: ['Bütün mərtəbələr', '2-ci', '3-cü', '4-cü', '5-ci'], ready: 'Hazır',
    st: { occ: 'Dolu', dirty: 'Çirkli', clean: 'Təmiz', insp: 'Yoxlanılıb', cleaning: 'Təmizlənir', inhouse: 'Yerləşib' },
  },
  bill: {
    hl: ['Hesabı bölün.', '<span class="w">Faktura — bir anda.</span>'], hud: 'Hesab və ödəniş',
    folio: 'Hesab #10482', folioSub: 'Otaq 305 · Aysel Kərimova · 3 gecə', split: 'Hesabı böl',
    items: ['Otaq · 3 gecə', 'Restoran · otağa yazılıb', 'Spa · masaj', 'Minibar'],
    subtotal: 'Cəmi', vat: 'ƏDV 18%', total: 'Yekun', methods: ['Nağd', 'Kart', 'Bank köçürməsi'],
    guest: 'Qonaq', company: 'Şirkət', guestName: 'Aysel Kərimova', card: 'Kart ···· 4821', bank: 'Bank köçürməsi', paid: 'ÖDƏNİLİB',
  },
  audit: {
    hl: ['Gecə auditi', '<span class="accent">avtomatik.</span>'], hud: 'Gecə auditi',
    running: 'Gün bağlanır…', done: '✓ Gün bağlandı',
    items: ['Otaq haqları yazıldı', 'Gəlməyənlər işləndi'], date: 'İş günü', d0: '26 SEN', d1: '27 SEN',
  },
  guest: {
    hl: ['Hər qonağı', '<span class="accent">tanıyın.</span>'], hud: 'Qonaq CRM',
    name: 'Murat Yılmaz', initials: 'MY', sub: 'Korporativ · İstanbul',
    tags: ['Loyallıq · Qızıl', 'Gec çıxış', 'Yuxarı mərtəbə'], note: 'Sakit otaq · əlavə yastıq',
    stats: ['Səfərlər', 'Gecələr', 'Ümumi gəlir'],
    fb: 'Qonaq rəyləri', fbSub: 'Otaqdakı QR kartdan', alert: 'Aşağı bal xəbərdarlığı', qr: 'SKAN ET · RƏY YAZ',
  },
  lang: {
    hl: ['Sizin dilinizdə', '<span class="accent">danışır.</span>'], hud: 'AZ · EN · TR · RU',
    words: [
      ['AZ', 'Azərbaycan dili', ['Xoş', 'gəlmisiniz']],
      ['EN', 'İngilis dili', ['Welcome']],
      ['TR', 'Türk dili', ['Hoş', 'geldiniz']],
      ['RU', 'Rus dili', ['Добро', 'пожаловать']],
    ],
  },
  mods: {
    names: ['Rezervasiyalar', 'Resepşn', 'Otaqlar', 'Təmizlik', 'Qonaq CRM', 'Qonaq rəyləri', 'Hesablar', 'Ödənişlər',
      'Gəlir idarəsi', 'Mühasibat', 'Gecə auditi', 'Kanal meneceri', 'Onlayn bron', 'Korporativ', 'Texniki xidmət', 'Anbar',
      'Personal', 'Restoran POS', 'Spa və sağlamlıq', 'Tədbirlər', 'İdarə paneli', 'Hesabatlar', 'İstifadəçilər və rollar',
      'Bildirişlər', 'Sənədlər', 'API', 'Tənzimləmələr'],
    label: 'modul', core: 'Əsas — daxildir', addons: 'Əlavələr — böyüdükcə',
    hl: ['27 modul.', '<span class="accent">Bir sistem.</span>'],
  },
  cta: { tag: ['Otelinizə lazım', 'olan hər şey.'], now: 'İndi.', nowDy: 26, btn: 'Demo sifariş edin' },   // İ's dot needs headroom
  // same story in manat (RevPAR = ADR × occupancy; folio incl. 18% ƏDV)
  num: { adr: 210, revpar: 183, revenueK: 83.1, room: 630, rest: 108, spa: 150, mini: 30, sub: 918, vat: 165.24, total: 1083.24,
    guestPays: 339.84, companyPays: 743.40, ltv: 7100 },
  money: (v, d = 0) => azNum(v, d) + NB + '₼',
  moneyK: (v) => azNum(v, 1) + '<small>' + NB + 'min' + NB + '₼</small>',
  ltv: (v) => azNum(Math.round(v / 100) * 100, 0) + NB + '₼',
  dec: (v, d) => azNum(v, d),
};

function azNum(v, d) {
  const [i, f] = v.toFixed(d).split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, NB) + (f ? ',' + f : '');
}

export const T = { en, az }[LANG] || en;
