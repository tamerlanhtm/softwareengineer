// Language switch: index.html?lang=az renders the Azerbaijani version.
// Static text is translated by walking the built DOM (see translateTree);
// strings set later by the timeline go through tr().
export const LANG = new URLSearchParams(location.search).get('lang') || 'en';

const AZ = {
  // hook / brand
  'Quick question': 'Qısa sual',
  // headlines
  'Clients book': 'Müştəri özü', 'online,': 'yazılır,',
  'The whole team.': 'Bütün komanda.', 'One calendar.': 'Bir təqvim.',
  'Know every': 'Hər müştərini', 'client.': 'tanıyın.',
  'Sell more than': 'Təkcə xidmət', 'services.': 'satmayın.',
  'Shifts, leave &': 'Növbələr, izinlər', 'commissions.': 'və komissiyalar.',
  'Get paid.': 'Ödənişi alın.', 'Close the till.': 'Kassanı bağlayın.',
  'Accounting,': 'Mühasibatlıq', 'built right in.': 'artıq daxildir.',
  'Reminders on': 'Xatırlatmalar', 'autopilot.': 'avtopilotda.',
  "See what's": 'Nəyin işlədiyini', 'working.': 'görün.',
  'Right access': 'Hər rola', 'for every role.': 'doğru giriş.',
  // HUD group labels
  'Bookings & Calendar': 'Yazılışlar və təqvim', 'Clients': 'Müştərilər', 'Catalogue': 'Kataloq', 'Staff': 'Əməkdaşlar',
  'Finance': 'Maliyyə', 'Accounting': 'Mühasibatlıq', 'Messaging': 'Mesajlar', 'Reporting & Analytics': 'Hesabat və analitika',
  'Management & Security': 'İdarəetmə və təhlükəsizlik',
  '2 modules': '2 modul', '3 modules': '3 modul', '4 modules': '4 modul', '5 modules': '5 modul', '6 modules': '6 modul',
  // weekdays / dates
  Mon: 'B.e', Tue: 'Ç.a', Wed: 'Çər', Thu: 'C.a', Fri: 'Cüm', Sat: 'Şən', Sun: 'Baz',
  'Tue, 13 Oct': '13 okt, ç.a.', '12 – 18 Oct': '12 – 18 okt', Today: 'Bu gün', Day: 'Gün', Week: 'Həftə',
  // 01 bookings
  '★ 4.9 · Hair, nails & skin': '★ 4.9 · Saç, dırnaq və dəri', 'BOOK ONLINE · OPEN 24/7': 'ONLAYN YAZILIŞ · 24/7',
  'Choose a service': 'Xidməti seçin', 'Step 1 of 2': 'Addım 1 / 2', 'Haircut & Styling': 'Saç kəsimi və üslub',
  '45 min': '45 dəq', '60 min': '60 dəq', '50 min': '50 dəq', Manicure: 'Manikür', 'Hydra Facial': 'Hidra üz baxımı',
  'Relax Massage': 'Relaks masaj', 'Pick a time': 'Vaxtı seçin', 'Haircut & Styling · with Aysel': 'Saç kəsimi və üslub · Aysel ilə',
  "You're booked!": 'Yazıldınız!', Colour: 'Rəngləmə', Balayage: 'Balayaj', 'Beard & Cut': 'Saqqal və kəsim', Haircut: 'Saç kəsimi',
  'Kids Cut': 'Uşaq kəsimi', Facial: 'Üz baxımı', Brows: 'Qaşlar', Massage: 'Masaj', Pedicure: 'Pedikür', 'Blow-dry': 'Fen düzümü',
  Shave: 'Üz qırxımı', Cancelled: 'Ləğv edildi', 'Nigar R. · waitlist': 'Nigar R. · gözləmə',
  'Waitlist match found': 'Gözləmə siyahısında uyğunluq', 'Nigar R. wants 16:00 with Olga': 'Nigar R. Olga ilə 16:00-ı istəyir',
  Book: 'Yaz', 'Group classes': 'Qrup dərsləri', Waitlist: 'Gözləmə siyahısı', 'No-show handling': 'Gəlməyənlərə nəzarət',
  'Self-reschedule': 'Vaxtı özü dəyişmə',
  // 02 clients
  'Leyla Mammadova': 'Leyla Məmmədova', 'Client since 2023 · +994 50 ••• •• 17': '2023-dən müştəri · +994 50 ••• •• 17',
  'Prefers Aysel': 'Ustası: Aysel', 'Hair · Skin': 'Saç · Dəri', Visits: 'Gəlişlər', 'Lifetime spend': 'Ümumi xərc',
  'No-shows': 'Gəlməmə', 'Note · Sensitive skin, patch test first': 'Qeyd · Həssas dəri, əvvəlcə test',
  'Next visit: Tue 13 Oct, 15:30 · Haircut & Styling': 'Növbəti gəliş: 13 okt, 15:30 · Saç kəsimi və üslub',
  'Consent form': 'Razılıq forması', 'Hydra Facial · intake': 'Hidra üz baxımı · anket',
  'I have read the aftercare advice': 'Baxım tövsiyələrini oxudum', 'No allergies to listed products': 'Sadalanan məhsullara allergiyam yoxdur',
  'Photos may be kept on file': 'Fotolar arxivdə saxlanıla bilər', SIGNATURE: 'İMZA', 'Signed & locked': 'İmzalandı, kilidləndi',
  'Client cards': 'Müştəri kartları', Notes: 'Qeydlər', 'Intake forms': 'Anketlər', Consents: 'Razılıqlar', Segments: 'Seqmentlər',
  // 03 catalogue
  Services: 'Xidmətlər', '45 min + 10 min buffer': '45 dəq + 10 dəq fasilə', '3 stylists': '3 stilist', Packages: 'Paketlər',
  '5 × Massage': '5 × Masaj', 'Session bundle': 'Seans paketi', '3 of 5 left': '5-dən 3-ü qalıb', Memberships: 'Üzvlüklər',
  '2 credits / month': 'Ayda 2 seans', '10% member discount': 'Üzvlərə 10% endirim', '/mo': '/ay', 'Gift card': 'Hədiyyə kartı',
  'Balance tracked': 'Balans izlənilir', 'Expires 12/2026': 'Son tarix 12/2026', Retail: 'Məhsullar', 'Argan Hair Oil': 'Arqan saç yağı',
  'In stock: 18': 'Anbarda: 18', 'Reorder at 5': '5 qalanda sifariş', Resources: 'Resurslar', 'Treatment Room 2': 'Baxım otağı 2',
  'Rooms, chairs & equipment': 'Otaq, kreslo və avadanlıq', Room: 'Otaq', 'Booked 15:30': '15:30 tutulub', 'Gift cards': 'Hədiyyə kartları',
  'Retail stock': 'Məhsul anbarı', 'Rooms & chairs': 'Otaq və kreslolar',
  // 04 staff
  'This week': 'Bu həftə', Schedules: 'Qrafiklər', Off: 'İstirahət', 'Leave?': 'İzin?', 'Leave ✓': 'İzin ✓', 'Approve leave': 'İzni təsdiqlə',
  'Aysel · October commission': 'Aysel · Oktyabr komissiyası', 'Tiered · paid in next payout batch': 'Pilləli · növbəti ödənişdə',
  'Tier 2': '2-ci pillə', 'Services 40%': 'Xidmət 40%', 'Retail 10%': 'Məhsul 10%', 'Tier 1': '1-ci pillə', 'Tier 2 · 45%': '2-ci pillə · 45%',
  'Tier 3': '3-cü pillə', 'Weekly hours': 'Həftəlik saatlar', 'Split shifts': 'Bölünmüş növbələr', 'Time off': 'İstirahət günləri',
  'Leave approvals': 'İzin təsdiqləri', 'Payout batches': 'Ödəniş paketləri',
  // 05 finance
  INVOICE: 'HESAB-FAKTURA', 'Leyla Mammadova · 13 Oct': 'Leyla Məmmədova · 13 okt', 'Tip for Aysel': 'Aysel üçün bəxşiş',
  'Deposit paid': 'Ödənilmiş depozit', 'Total due': 'Ödəniləcək', Cash: 'Nağd', Card: 'Kart', Transfer: 'Köçürmə', PAID: 'ÖDƏNİLDİ',
  'Daily cash-up': 'Gündəlik kassa', 'Till 1 · Tue 13 Oct': 'Kassa 1 · 13 okt', 'Opening float': 'Açılış qalığı',
  'Cash taken': 'Nağd daxilolma', 'Expected in till': 'Kassada gözlənilən', Counted: 'Sayılıb', Variance: 'Fərq',
  Invoices: 'Hesab-fakturalar', Deposits: 'Depozitlər', 'Partial payments': 'Qismən ödəniş', Tips: 'Bəxşişlər', Refunds: 'Geri qaytarma',
  Expenses: 'Xərclər',
  // 06 accounting
  'Journal · JE-2041': 'Jurnal · JE-2041', 'Posted from INV-0142': 'INV-0142 əsasında', ACCOUNT: 'HESAB', DEBIT: 'DEBET', CREDIT: 'KREDİT',
  'Card clearing': 'Kart hesablaşması', 'Customer deposits': 'Müştəri depozitləri', 'Service revenue': 'Xidmət gəliri',
  'Retail revenue': 'Satış gəliri', 'Tips payable': 'Ödəniləcək bəxşiş', Balanced: 'Balanslıdır', 'Profit & loss': 'Mənfəət və zərər',
  'October · all services': 'Oktyabr · bütün xidmətlər', Statements: 'Hesabatlar', Revenue: 'Gəlir', 'Net profit': 'Xalis mənfəət',
  'FISCAL PERIOD': 'MALİYYƏ DÖVRÜ', September: 'Sentyabr', 'Closing…': 'Bağlanır…', 'Closed & locked': 'Bağlandı, kilidləndi',
  'Chart of accounts': 'Hesablar planı', Journal: 'Jurnal', 'Trial balance': 'Sınaq balansı', 'P&L': 'Mənfəət və zərər',
  'Balance sheet': 'Balans', 'Period close': 'Dövrün bağlanması',
  // 07 messaging
  'to leyla.m@mail.com': 'kimə: leyla.m@mail.com', '24 h before': '24 saat əvvəl', 'See you tomorrow,': 'Sabah görüşərik,',
  Your: '', 'with Aysel is booked for': '— Aysel ilə,', 'Tue 13 Oct at 15:30': '13 oktyabr, saat 15:30',
  'Manage booking': 'Yazılışı idarə et', Reschedule: 'Vaxtı dəyiş', 'Message log': 'Mesaj jurnalı', Email: 'E-poçt',
  'Reminder · 24 h': 'Xatırlatma · 24 saat', Sent: 'Göndərildi', 'Reminder · 2 h': 'Xatırlatma · 2 saat',
  'Campaign · no consent': 'Kampaniya · razılıq yoxdur', Skipped: 'Ötürüldü', 'Address bounced': 'Ünvan qəbul etmədi', Retry: 'Təkrarla',
  'Email templates': 'E-poçt şablonları', 'Merge tags': 'Dinamik sahələr', 'Any lead time': 'İstənilən vaxt öncədən',
  Campaigns: 'Kampaniyalar', 'Consent-aware': 'Razılığa uyğun',
  // 08 analytics
  'Revenue today': 'Bugünkü gəlir', '▲ 12% vs last Tue': '▲ 12% keçən həftəyə görə', Bookings: 'Yazılışlar',
  '▲ 5 vs last Tue': '▲ 5 keçən həftəyə görə', Utilisation: 'Yüklənmə', 'Chairs & rooms': 'Kreslo və otaqlar',
  'Revenue last week': 'Keçən həftənin gəliri', 'By day · retention overlay': 'Günlər üzrə · qayıdış xətti', Retention: 'Qayıdış',
  'Best day · Fri': 'Ən yaxşı gün · Cüm', 'TOP STAFF': 'ƏN YAXŞI USTALAR', 'Revenue by service': 'Xidmətlər üzrə gəlir',
  'By staff': 'Ustalar üzrə', 'Commission statements': 'Komissiya hesabatları',
  // 09 admin
  Departments: 'Şöbələr', 'Module grants per role': 'Rollar üzrə modul icazələri', 'Users & roles': 'İstifadəçilər və rollar',
  'Front Desk': 'Resepşn', 'Practitioner / Stylist': 'Usta / Stilist', 'Finance & Accounting': 'Maliyyə və mühasibat',
  Marketing: 'Marketinq', Management: 'Rəhbərlik', 'All 37': '37 / 37', '5 languages': '5 dil', 'Module grants': 'Modul icazələri',
  Documents: 'Sənədlər', Announcements: 'Elanlar', 'Opening hours': 'İş saatları', 'Currency & timezone': 'Valyuta və saat qurşağı',
  // numbers
  Reports: 'Hesabatlar', Admin: 'İdarəetmə', '9 groups': '9 qrup', modules: 'modul', 'paid add-ons.': 'ödənişli əlavə.',
  'Every module': 'Bütün modullar', 'included.': 'daxildir.',
  // CTA
  Everything: 'Lazım olan', 'you need.': 'hər şey.', 'Now.': 'İndi.', "Let's talk: DM": 'Bizə yazın: DM',
  // module names (module wall)
  Calendar: 'Təqvim', 'Online Booking Page': 'Onlayn yazılış', 'Forms & Consents': 'Formalar və razılıqlar',
  'Products & Retail': 'Məhsullar', Commissions: 'Komissiyalar', Leave: 'İzinlər', 'Schedules & Time Off': 'Qrafiklər',
  'Payments & Deposits': 'Ödənişlər', 'Refunds & Credit Notes': 'Geri qaytarmalar', 'Daily Cash-up': 'Gündəlik kassa',
  'Chart of Accounts': 'Hesablar planı', 'Financial Statements': 'Maliyyə hesabatları', 'Fiscal Periods': 'Maliyyə dövrləri',
  'Message Templates': 'Mesaj şablonları', 'Reminder Rules': 'Xatırlatma qaydaları', 'Message Log': 'Mesaj jurnalı',
  Dashboard: 'İdarə paneli', 'User & Role Management': 'İstifadəçilər və rollar', 'Document Management': 'Sənədlər',
  'Location Settings': 'Filial ayarları', 'API & Integrations': 'API və inteqrasiyalar', 'Gift Cards': 'Hədiyyə kartları',
};

const DICT = LANG === 'az' ? AZ : {};

export function tr(s) {
  return Object.prototype.hasOwnProperty.call(DICT, s) ? DICT[s] : s;
}

// Translate every text node under root (keeps surrounding whitespace).
export function translateTree(root) {
  if (LANG === 'en') return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let n;
  while ((n = w.nextNode())) nodes.push(n);
  for (const node of nodes) {
    const raw = node.nodeValue;
    const t = raw.trim();
    if (t.length < 2 || !Object.prototype.hasOwnProperty.call(DICT, t)) continue;
    node.nodeValue = raw.replace(t, DICT[t]);
  }
}

// Shrink headlines whose translated lines are wider than the safe width.
export function fitHeadlines(root, max = 920) {
  for (const h of root.querySelectorAll('.headline')) {
    const widest = Math.max(...[...h.querySelectorAll('.mask > span')].map((s) => s.getBoundingClientRect().width));
    if (widest > max) h.style.fontSize = (parseFloat(getComputedStyle(h).fontSize) * max) / widest + 'px';
  }
}
