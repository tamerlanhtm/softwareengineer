// Language layer: every on-screen string and number format, per language.
// Pick the language with ?lang=az (default: en). Scenes read strings from `T` and format numbers
// with money() / kmoney() / int() so each version reads naturally (e.g. "$24,800" vs "24 800 ₼").

export const LANG = (new URLSearchParams(location.search).get('lang') || 'en').toLowerCase();

const NBSP = ' ';

const EN = {
  hook: {
    lineA: 'I need',
    reel: ['more leads.', 'closed deals.', 'paid invoices.', 'real numbers.', 'less busywork.',
      'happy clients.', 'more time.', 'zero chaos.', 'growth.', 'control.', 'everything.'],
    now: 'Now.',
    morph: true, // "I need" + "Now" letters rearrange into the ineed.now wordmark
    chaos: ['leads_FINAL_v7.xlsx', '5 missed calls', 'Q3 numbers???', 'Invoice #0931 overdue', 'Who owns this deal?',
      '47 unread', 'call Murad back!!', 'quote sent… or not?', 'follow up… when?', 'copy of pipeline (3).xlsx'],
  },
  logo: { sub: 'The sales CRM by <b>ineed.now</b>' },
  leads: {
    label: 'Leads & Contacts',
    t1: 'Capture<br>every <b>lead.</b>',
    t2: 'Convert in<br><b>one click.</b>',
    inbox: 'Lead inbox',
    week: 'this week',
    names: ['Murad Hasanov', 'Elif Demir', 'Anna Petrova', 'James Carter', 'Leyla Aliyeva'],
    initials: ['MH', 'ED', 'AP', 'JC', 'LA'],
    sources: ['Referral', 'Instagram', 'Event', 'Cold call', 'Website'],
    fresh: 'New',
    hot: 'Hot',
    budget: 'Budget',
    decision: 'Decision maker',
    qualified: 'Qualified',
    convert: 'Convert',
    contact: 'Contact',
    deal: 'Deal',
    role: 'Head of Operations',
    source: 'Source: Website',
    stage: 'New · 10%',
    you: 'You',
    youIni: 'YO',
    created: ['Contact created', 'Deal created'],
  },
  pipeline: {
    label: 'Deals & Pipelines',
    title: 'Close deals<br><b>faster.</b>',
    stages: ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    days: (n) => `${n}d`,
    now: 'now',
    won: 'Won',
    weighted: 'Weighted forecast',
    wonMonth: 'Won this month',
  },
  billing: {
    label: 'Quotes · Invoices · Payments',
    title: 'Quote. Invoice.<br><b>Paid.</b>',
    quote: 'Quote',
    invoice: 'Invoice',
    valid: 'Valid until Oct 29',
    due: 'Due Oct 15',
    billTo: 'Bill to',
    person: 'Leyla Aliyeva · Head of Operations',
    th: ['Item', 'Qty', 'Amount'],
    items: ['CRM setup & onboarding', 'Sales seats · annual', 'Automation package'],
    subtotal: 'Subtotal',
    discount: 'Discount (10%)',
    tax: 'Tax (18%)',
    total: 'Total',
    decline: 'Decline',
    accept: 'Accept quote',
    accepted: 'Accepted',
    converted: 'Converted from quote Q-1042',
    amountDue: 'Amount due',
    paidPct: (p) => `${p}% paid`,
    payments: 'Payments',
    pay1: ['Bank transfer', 'Oct 2 · partial'],
    pay2: ['Card •••• 4242', 'Oct 9 · balance'],
    paid: 'Paid',
  },
  dashboard: {
    label: 'Reporting & Analytics',
    title: 'Your numbers,<br><b>live.</b>',
    kpis: ['Pipeline value', 'Won this month', 'New leads'],
    plusLead: '+1 lead',
    revenue: 'Revenue',
    revenueSub: '2026 · monthly',
    export: 'Export CSV',
    file: 'revenue_2026.csv',
    months: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    tip: '21% vs Aug',
    funnel: 'Sales funnel',
    funnelRows: ['Leads', 'Qualified', 'Proposal', 'Won'],
    sources: 'Lead sources',
    leadsWord: 'leads',
    legend: ['Website', 'Instagram', 'Referral', 'Other'],
  },
  automation: {
    label: 'Workflow Automation',
    title: 'Busywork?<br><b>Automated.</b>',
    nodes: [['When', 'Deal moves to Won'], ['If', (m) => `Amount is over ${m(5000)}`], ['Then', 'Create invoice'], ['Then', 'Notify the team']],
    history: 'Run history',
    runs: (n) => `<b class="runs">${n}</b> runs · 100% success`,
    row: 'INV-0142 created · team notified',
    justNow: 'just now',
  },
  modules: {
    label: 'All-in-one CRM',
    title: '<b>21</b> modules.<br><b>4</b> languages.<br><b>1</b> workspace.',
    line2: '4 languages.',
    hello: [['Hello', 'EN'], ['Salam', 'AZ'], ['Merhaba', 'TR'], ['Привет', 'RU']],
    tiles: ['Leads', 'Contacts', 'Companies', 'Pipelines', 'Activities', 'Products', 'Quotes', 'Invoices', 'Payments',
      'Tickets', 'Campaigns', 'Messages', 'Calendar', 'Dashboard', 'Reports', 'Users & Roles', 'Documents',
      'Integrations', 'Automation', 'Custom Fields', 'Settings'],
  },
  end: {
    lines: ['Everything', 'you need.', 'Now.'],
    offer: '14-day <b>free</b> trial',
    demo: 'Try the demo account',
    dm: 'DM @ineednow_',
  },
};

const AZ = {
  hook: {
    lineA: 'Mənə lazımdır',
    reel: ['daha çox müştəri.', 'daha çox satış.', 'vaxtında ödəniş.', 'real rəqəmlər.', 'daha az rutin.',
      'məmnun müştəri.', 'daha çox vaxt.', 'sıfır xaos.', 'artım.', 'nəzarət.', 'hər şey.'],
    now: 'İndi.',
    morph: false, // the words collapse into the dot and the wordmark bursts out of it
    chaos: ['müştərilər_SON_v7.xlsx', '5 buraxılmış zəng', 'Rüblük rəqəmlər???', 'Faktura #0931 gecikib', 'Bu sövdələşmə kimindir?',
      '47 oxunmamış', 'Murada geri zəng et!!', 'təklif getdi… ya yox?', 'görüş… nə vaxtdır?', 'satış_kopya (3).xlsx'],
  },
  logo: { sub: 'Satış üçün CRM — <b>ineed.now</b>' },
  leads: {
    label: 'Lidlər və kontaktlar',
    t1: 'Heç bir lidi<br><b>qaçırmayın.</b>',
    t2: 'Bir kliklə<br><b>sövdələşmə.</b>',
    inbox: 'Gələn lidlər',
    week: 'bu həftə',
    names: ['Murad Həsənov', 'Elif Demir', 'Anna Petrova', 'James Carter', 'Leyla Əliyeva'],
    initials: ['MH', 'ED', 'AP', 'JC', 'LƏ'],
    sources: ['Tövsiyə', 'Instagram', 'Tədbir', 'Soyuq zəng', 'Vebsayt'],
    fresh: 'Yeni',
    hot: 'İsti',
    budget: 'Büdcə',
    decision: 'Qərar verən',
    qualified: 'Təsdiqləndi',
    convert: 'Çevir',
    contact: 'Kontakt',
    deal: 'Sövdələşmə',
    role: 'Əməliyyatlar rəhbəri',
    source: 'Mənbə: Vebsayt',
    stage: 'Yeni · 10%',
    you: 'Siz',
    youIni: 'S',
    created: ['Kontakt yaradıldı', 'Sövdələşmə yaradıldı'],
  },
  pipeline: {
    label: 'Sövdələşmələr',
    title: 'Sövdələşmələri<br><b>tez bağlayın.</b>',
    stages: ['Yeni', 'Təsdiqlənib', 'Təklif', 'Danışıqlar', 'Qazanıldı', 'İtirildi'],
    days: (n) => `${n} gün`,
    now: 'indi',
    won: 'Qazanıldı',
    weighted: 'Çəkili proqnoz',
    wonMonth: 'Bu ay qazanılan',
  },
  billing: {
    label: 'Təklif · Faktura · Ödəniş',
    title: 'Təklif. Faktura.<br><b>Ödənildi.</b>',
    quote: 'Təklif',
    invoice: 'Faktura',
    valid: 'Etibarlıdır: 29.10',
    due: 'Son tarix: 15.10',
    billTo: 'Alıcı',
    person: 'Leyla Əliyeva · Əməliyyatlar rəhbəri',
    th: ['Xidmət', 'Say', 'Məbləğ'],
    items: ['CRM quraşdırma və təlim', 'Satış lisenziyası · illik', 'Avtomatlaşdırma paketi'],
    subtotal: 'Aralıq cəm',
    discount: 'Endirim (10%)',
    tax: 'ƏDV (18%)',
    total: 'Cəmi',
    decline: 'İmtina',
    accept: 'Təklifi qəbul et',
    accepted: 'Qəbul edildi',
    converted: 'Q-1042 təklifindən yaradılıb',
    amountDue: 'Ödəniləcək məbləğ',
    paidPct: (p) => `${p}% ödənilib`,
    payments: 'Ödənişlər',
    pay1: ['Bank köçürməsi', '02.10 · qismən'],
    pay2: ['Kart •••• 4242', '09.10 · qalıq'],
    paid: 'Ödənildi',
  },
  dashboard: {
    label: 'Hesabat və analitika',
    title: 'Rəqəmləriniz,<br><b>canlı.</b>',
    kpis: ['Açıq sövdələşmələr', 'Bu ay qazanılan', 'Yeni lidlər'],
    plusLead: '+1 lid',
    revenue: 'Gəlir',
    revenueSub: '2026 · aylıq',
    export: 'CSV ixrac',
    file: 'gelir_2026.csv',
    months: ['Y', 'F', 'M', 'A', 'M', 'İ', 'İ', 'A', 'S', 'O', 'N', 'D'],
    tip: '21% ötən aya nisbətən',
    funnel: 'Satış hunisi',
    funnelRows: ['Lidlər', 'Təsdiqlənib', 'Təklif', 'Qazanıldı'],
    sources: 'Lid mənbələri',
    leadsWord: 'lid',
    legend: ['Vebsayt', 'Instagram', 'Tövsiyə', 'Digər'],
  },
  automation: {
    label: 'Avtomatlaşdırma',
    title: 'Rutin işlər?<br><b>Avtomatik.</b>',
    nodes: [['Nə vaxt', 'Sövdələşmə qazanıldı'], ['Əgər', (m) => `Məbləğ ${m(5000)}-dan çox`], ['Onda', 'Faktura yarat'], ['Onda', 'Komandaya bildir']],
    history: 'İcra tarixçəsi',
    runs: (n) => `<b class="runs">${n}</b> icra · 100% uğurlu`,
    row: 'INV-0142 yaradıldı · bildiriş göndərildi',
    justNow: 'indicə',
  },
  modules: {
    label: 'Hamısı bir yerdə',
    title: '<b>21</b> modul.<br><b>4</b> dil.<br><b>1</b> iş sahəsi.',
    line2: '4 dil.',
    hello: [['Salam', 'AZ'], ['Hello', 'EN'], ['Merhaba', 'TR'], ['Привет', 'RU']],
    tiles: ['Lidlər', 'Kontaktlar', 'Şirkətlər', 'Sövdələşmələr', 'Tapşırıqlar', 'Məhsullar', 'Təkliflər', 'Fakturalar', 'Ödənişlər',
      'Müraciətlər', 'Kampaniyalar', 'Bildirişlər', 'Təqvim', 'İdarə paneli', 'Hesabatlar', 'İstifadəçilər', 'Sənədlər',
      'İnteqrasiyalar', 'Avtomatika', 'Xüsusi sahələr', 'Parametrlər'],
  },
  end: {
    lines: ['Sizə lazım olan', 'hər şey.', 'İndi.'],
    offer: '14 gün <b>pulsuz</b> sınaq',
    demo: 'Demo hesabı yoxlayın',
    dm: 'Direkt: @ineednow_',
  },
};

export const T = { en: EN, az: AZ }[LANG] || EN;

// ------------------------------------------------------------------ number formats
function group(v, dec, sep, point) {
  const [i, f] = Math.abs(v).toFixed(dec).split('.');
  return (v < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, sep) + (f ? point + f : '');
}

const FMTS = {
  en: {
    money: (v, dec = 0) => '$' + group(v, dec, ',', '.'),
    kmoney: (v, dec = 1) => `$${v.toFixed(dec)}K`,
    int: (v) => group(Math.round(v), 0, ',', '.'),
  },
  az: {
    money: (v, dec = 0) => `${group(v, dec, NBSP, ',')}${NBSP}₼`,
    kmoney: (v, dec = 1) => `${v.toFixed(dec).replace('.', ',')}K${NBSP}₼`,
    int: (v) => group(Math.round(v), 0, NBSP, ','),
  },
};
const F = FMTS[LANG] || FMTS.en;

/** Currency amount, e.g. money(8411.04, 2) -> "$8,411.04" / "8 411,04 ₼" */
export const money = (v, dec = 0) => F.money(v, dec);
/** Thousands with a K, e.g. kmoney(482.9) -> "$482.9K" / "482,9K ₼" */
export const kmoney = (v, dec = 1) => F.kmoney(v, dec);
/** Grouped integer, e.g. int(1284) -> "1,284" / "1 284" */
export const int = (v) => F.int(v);
