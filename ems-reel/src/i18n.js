// Language packs. Pick one with ?lang=az (default: en).
// Every on-screen word lives here; scenes only read from `S`.

export const LANG = (new URLSearchParams(location.search).get('lang') || 'en').toLowerCase();

// ---------------------------------------------------------------- numbers
const NBSP = ' ';
function group(v, dec, sep, point) {
  const [i, f] = Math.abs(v).toFixed(dec).split('.');
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return (v < 0 ? '−' : '') + int + (f ? point + f : '');
}
const enNum = (v, dec = 0) => group(v, dec, ',', '.');
const azNum = (v, dec = 0) => group(v, dec, NBSP, ',');

// Timetable subjects are keyed; each pack gives the label + teacher.
const SUBJECTS = ['Math', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Literature', 'Art', 'PE'];

const EN = {
  htmlLang: 'en',
  num: enNum,
  money: (v, dec = 0) => '$' + enNum(v, dec),
  pct: (v, dec = 1) => `${v.toFixed(dec)}%`,
  dec: (v, d) => v.toFixed(d),

  hook: {
    lines: ['Still running', 'your school on…'],
    stickers: ['spreadsheets?', 'paperwork?', '10 different apps?'],
    files: ['Budget_FINAL_v7(2).xlsx', 'attendance_OLD.xlsx'],
    urgent: 'URGENT',
  },
  logo: { sub: 'School management system', one: 'One system.', whole: 'Your entire school.' },
  mods: {
    label: 'modules. one platform.',
    core: ['Start with', 'the core.'],
    add: ['Add what', 'you need.'],
    labCore: 'CORE · 22 MODULES',
    labAdd: 'ADD-ONS · 14',
  },
  tt: {
    kicker: 'Timetable & scheduling', head: ['Clash-free', 'timetables.'],
    title: 'Timetable', sub: 'Grade 9A · Week 12',
    auto: 'Auto-check on', clash: 'Teacher clash', ok: 'No clashes',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    subj: Object.fromEntries(SUBJECTS.map((s) => [s, s])),
    teach: { Math: 'A. Hasanova', English: 'L. Mammadli', Physics: 'R. Aliyev', Chemistry: 'N. Karimova', Biology: 'T. Ismayilov', History: 'S. Guliyev', Literature: 'G. Huseynova', Art: 'F. Rzayev', PE: 'E. Babayev' },
    tooltip: 'N. Karimova is teaching 9B',
  },
  ex: {
    kicker: 'Examinations & grading', head: ['Marks in.', 'Report cards out.'],
    initials: 'AM', name: 'Aylin Mammadova', sub: 'Grade 9A · Term 1 report card',
    cols: ['SUBJECT', 'MARK', 'GRADE'],
    rows: [['Mathematics', 96, 'A+'], ['Physics', 91, 'A'], ['English', 88, 'A−'], ['History', 84, 'B+'], ['Biology', 93, 'A'], ['Literature', 90, 'A']],
    avg: { value: 3.83, max: 4, dec: 2, label: 'GPA 3.83' },
    rank: 'Class rank 2 of 28', ready: 'Report card ready',
  },
  fin: {
    kicker: 'Fees · payments · payroll · accounting', head: ['Finance,', 'finally sorted.'],
    title: 'Invoice', who: 'Murad Aliyev · Grade 7B', due: 'DUE', paid: 'PAID',
    items: ['Tuition — Term 1', 'Transport', 'Sibling discount'],
    total: 'Total', payWith: 'Pay with', methods: ['Cash', 'Card', 'Bank transfer'],
    stamp: 'PAID', receipt: 'Receipt #R-10492 · Card · $1,290.00',
  },
  portal: {
    kicker: 'Parent portal · notifications', head: ['Parents,', 'always in the loop.'],
    app: 'Parent', hello: 'Good morning, Leyla', child: 'Aylin · Grade 9A', now: 'now',
    notes: [['New grade', 'Mathematics · A+'], ['Attendance', 'Checked in at 08:02'], ['Homework', 'Physics · due Friday'], ['Fee balance', '$0.00 · all paid'], ['PTA meeting', 'Thursday · 18:00']],
  },
  dash: {
    kicker: 'Dashboard & advanced reporting', head: ['Your whole school,', 'at a glance.'],
    enroll: 'Enrollment', growth: '+4.2% this year', att: 'Attendance today', present: '1,203 of 1,248 present',
    fees: 'Fees collected · this term', months: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
    dues: 'Dues', billed: '7% of billed', exams: 'Upcoming exams', next: 'Next: Math · Mon',
    reports: 'Reports', export: 'Export CSV', file: 'fees_term1.csv',
  },
  blitz: {
    words: ['Admissions', 'Attendance', 'Library', 'Transport', 'Hostel', 'Health', 'Cafeteria', 'Alumni'],
    count: (n) => `${n} / 36 modules`,
  },
  langs: { head: 'Speaks your language.', kicker: 'EN · AZ · TR · RU', words: [['School', 'EN'], ['Məktəb', 'AZ'], ['Okul', 'TR'], ['Школа', 'RU']] },
  roles: { head: ['The right access', 'for every role.'], names: ['Owner', 'Principal', 'Teacher', 'Registrar', 'Accountant', 'Librarian'] },
  finale: {
    // the last line morphs into "ineed.now"; map = [source char, target char]
    lines: ['Everything', 'your school', 'needs.'],
    ys: [740, 890, 1040],
    bigY: 890,
    map: [[0, 1], [1, 2], [2, 3], [3, 4]],
    sub: 'School management system',
    cta: 'Book a demo',
  },
};

const AZ = {
  htmlLang: 'az',
  num: azNum,
  money: (v, dec = 0) => azNum(v, dec) + NBSP + '₼',
  pct: (v, dec = 1) => `${azNum(v, dec)}%`,
  dec: (v, d) => azNum(v, d),

  hook: {
    lines: ['Məktəbiniz', 'hələ də…'],
    stickers: ['cədvəllərdə?', 'kağızlarda?', '10 fərqli proqramda?'],
    files: ['Büdcə_SON_v7(2).xlsx', 'davamiyyət_KÖHNƏ.xlsx'],
    urgent: 'TƏCİLİ',
  },
  logo: { sub: 'Məktəb idarəetmə sistemi', one: 'Bir sistem.', whole: 'Bütün məktəbiniz.' },
  mods: {
    label: 'modul. bir platforma.',
    core: ['Əsasdan', 'başlayın.'],
    add: ['Lazım olanı', 'əlavə edin.'],
    labCore: 'ƏSAS · 22 MODUL',
    labAdd: 'ƏLAVƏLƏR · 14',
  },
  tt: {
    kicker: 'Dərs cədvəli və planlama', head: ['Toqquşmasız', 'dərs cədvəli.'],
    title: 'Dərs cədvəli', sub: '9A sinfi · 12-ci həftə',
    auto: 'Avto-yoxlama aktiv', clash: 'Müəllim məşğuldur', ok: 'Toqquşma yoxdur',
    days: ['B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.'],
    subj: { Math: 'Riyaziyyat', English: 'İngilis', Physics: 'Fizika', Chemistry: 'Kimya', Biology: 'Biologiya', History: 'Tarix', Literature: 'Ədəbiyyat', Art: 'Rəsm', PE: 'İdman' },
    teach: { Math: 'A. Həsənova', English: 'L. Məmmədli', Physics: 'R. Əliyev', Chemistry: 'N. Kərimova', Biology: 'T. İsmayılov', History: 'S. Quliyev', Literature: 'G. Hüseynova', Art: 'F. Rzayev', PE: 'E. Babayev' },
    tooltip: 'N. Kərimova 9B-də dərsdədir',
  },
  ex: {
    kicker: 'İmtahanlar və qiymətləndirmə', head: ['Balları yazın.', 'Hesabatı alın.'],
    initials: 'AM', name: 'Aylin Məmmədova', sub: '9A sinfi · I yarımil hesabatı',
    cols: ['FƏNN', 'BAL', 'QİYMƏT'],
    rows: [['Riyaziyyat', 96, 'A+'], ['Fizika', 91, 'A'], ['İngilis dili', 88, 'A−'], ['Tarix', 84, 'B+'], ['Biologiya', 93, 'A'], ['Ədəbiyyat', 90, 'A']],
    avg: { value: 90.3, max: 100, dec: 1, label: 'Orta bal 90,3' },
    rank: 'Sinif reytinqi: 2 / 28', ready: 'Hesabat hazırdır',
  },
  fin: {
    kicker: 'Təhsil haqqı · ödəniş · maaş · mühasibat', head: ['Maliyyə', 'tam nəzarətdə.'],
    title: 'Hesab-faktura', who: 'Murad Əliyev · 7B sinfi', due: 'BORC', paid: 'ÖDƏNİLDİ',
    items: ['Təhsil haqqı — I yarımil', 'Nəqliyyat', 'Qardaş-bacı endirimi'],
    total: 'Cəmi', payWith: 'Ödəniş üsulu', methods: ['Nağd', 'Kart', 'Bank köçürməsi'],
    stamp: 'ÖDƏNİLDİ', receipt: 'Qəbz #R-10492 · Kart · 1 290,00 AZN',
  },
  portal: {
    kicker: 'Valideyn portalı · bildirişlər', head: ['Valideynlər', 'hər an xəbərdar.'],
    app: 'Valideyn', hello: 'Sabahınız xeyir, Leyla', child: 'Aylin · 9A sinfi', now: 'indi',
    notes: [['Yeni qiymət', 'Riyaziyyat · A+'], ['Davamiyyət', '08:02-də məktəbə gəldi'], ['Ev tapşırığı', 'Fizika · cüməyədək'], ['Balans', `0,00${NBSP}₼ · borc yoxdur`], ['Valideyn iclası', 'Cümə axşamı · 18:00']],
  },
  dash: {
    kicker: 'İdarə paneli və hesabatlar', head: ['Bütün məktəb', 'bir baxışda.'],
    enroll: 'Şagird sayı', growth: 'bu il +4,2%', att: 'Bugünkü davamiyyət', present: `1${NBSP}203 / 1${NBSP}248 məktəbdədir`,
    fees: 'Toplanan ödənişlər · bu yarımil', months: ['Sen', 'Okt', 'Noy', 'Dek', 'Yan', 'Fev', 'Mar', 'Apr'],
    dues: 'Borclar', billed: 'hesablananın 7%-i', exams: 'İmtahanlar', next: 'Riyaziyyat · B.e.',
    reports: 'Hesabatlar', export: 'CSV ixrac', file: 'ödənişlər_I.csv',
  },
  blitz: {
    words: ['Qəbul', 'Davamiyyət', 'Kitabxana', 'Nəqliyyat', 'Yataqxana', 'Sağlamlıq', 'Yeməkxana', 'Məzunlar'],
    count: (n) => `${n} / 36 modul`,
  },
  langs: { head: 'Sizin dilinizdə danışır.', kicker: 'AZ · EN · TR · RU', words: [['Məktəb', 'AZ'], ['School', 'EN'], ['Okul', 'TR'], ['Школа', 'RU']] },
  roles: { head: ['Hər rol üçün', 'düzgün icazələr.'], names: ['Təsisçi', 'Direktor', 'Müəllim', 'Qeydiyyatçı', 'Mühasib', 'Kitabxanaçı'] },
  finale: {
    // "…hər şey — indi." : indi (= now) turns into ineed.now — i, n, d and "." stay
    lines: ['Məktəbinizə', 'lazım olan', 'hər şey —', 'indi.'],
    ys: [680, 810, 940, 1070],
    bigY: 890,
    map: [[0, 0], [1, 1], [2, 4], [4, 5]],
    sub: 'Məktəb idarəetmə sistemi',
    cta: 'Demo sifariş edin',
  },
};

const PACKS = { en: EN, az: AZ };
export const S = PACKS[LANG] || EN;
