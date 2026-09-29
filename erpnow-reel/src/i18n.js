/* On-screen text translations. Open index.html?lang=az (or render with REEL_LANG=az).
   Keys are the English strings exactly as written in the scenes; missing keys stay English. */
(function () {
  'use strict';
  const AZ = {
    // hook
    'I NEED': 'MƏNƏ LAZIMDIR', 'NOW': 'İNDİ',
    'SALES': 'SATIŞ', 'QUOTES': 'TƏKLİFLƏR', 'INVOICES': 'FAKTURALAR', 'STOCK': 'ANBAR', 'PAYMENTS': 'ÖDƏNİŞLƏR',
    'SUPPLIERS': 'TƏCHİZATÇILAR', 'APPROVALS': 'TƏSDİQLƏR', 'REPORTS': 'HESABATLAR', 'EXPENSES': 'XƏRCLƏR',
    'LEDGERS': 'MÜHASİBAT', 'WAREHOUSES': 'ANBARLAR', 'CUSTOMERS': 'MÜŞTƏRİLƏR', 'CONTRACTS': 'MÜQAVİLƏLƏR',
    'CALENDARS': 'TƏQVİM', 'DOCUMENTS': 'SƏNƏDLƏR', 'IT ALL.': 'HAMISI.',
    // brand + groups
    'BY INEED.NOW': 'INEED.NOW MƏHSULU', 'The all-in-one ERP': 'Kiçik biznes üçün', 'for small business.': 'hamısı bir yerdə ERP.',
    'ERPNOW · 8 GROUPS': 'ERPNOW · 8 QRUP', 'One system.': 'Bir sistem.', 'Every department.': 'Bütün şöbələr.',
    'Sales': 'Satış', 'Inventory': 'Anbar', 'Procurement': 'Satınalma', 'Finance': 'Maliyyə', 'HR': 'Kadrlar',
    'Analytics': 'Analitika', 'Accounting': 'Mühasibat', 'Security': 'Təhlükəsizlik', 'ADD-ON': 'ƏLAVƏ',
    '1 module': '1 modul', '2 modules': '2 modul', '3 modules': '3 modul', '4 modules': '4 modul', '6 modules': '6 modul', 'modules': 'modul',
    // sales
    'Quote.': 'Təklif.', 'Order.': 'Sifariş.', 'Invoice.': 'Faktura.', 'Done.': 'Hazır.',
    'QUOTATION': 'TƏKLİF', 'SALES ORDER': 'SATIŞ SİFARİŞİ', 'INVOICE': 'FAKTURA',
    'Draft': 'Qaralama', 'Confirmed': 'Təsdiqləndi', 'Sent': 'Göndərildi',
    'Nova Trading LLC': 'Nova Trading MMC', 'Valid until 15 Oct 2026': '15 okt 2026-dək etibarlıdır',
    'Delivered · 22 units · stock updated': 'Çatdırıldı · 22 ədəd · anbar yeniləndi', 'Due 29 Oct 2026 · Net 14': 'Son tarix 29 okt 2026 · 14 gün',
    'Office chair': 'Ofis kreslosu', 'Standing desk': 'Ayaqüstü masa', 'Desk lamp': 'Masa lampası',
    'Discount 5%': 'Endirim 5%', 'Tax 18%': 'ƏDV 18%', 'Subtotal': 'Aralıq cəm', 'Warehouse': 'Anbar', 'Baku Central': 'Bakı Mərkəz',
    'Stock out': 'Anbardan çıxış', '−22 units': '−22 ədəd', 'Total': 'Cəmi',
    'Convert to sales order': 'Satış sifarişinə çevir', 'Generate invoice': 'Faktura yarat', 'Invoice sent': 'Faktura göndərildi',
    // inventory
    'INVENTORY': 'ANBAR', 'Live stock.': 'Canlı qalıq.', 'Every warehouse.': 'Hər anbarda.', 'Office chair · Ergo': 'Ofis kreslosu · Ergo',
    'SKU OC-200 · REORDER AT 25': 'SKU OC-200 · MİNİMUM 25', 'Sumqayit': 'Sumqayıt', 'Ganja': 'Gəncə',
    'LOW STOCK': 'AZ QALIQ', 'RESTOCKED': 'DOLDURULDU', 'STOCK MOVEMENTS': 'ANBAR HƏRƏKƏTLƏRİ',
    'Goods receipt · GR-0412': 'Mal qəbulu · GR-0412', 'Supplier': 'Təchizatçı', 'Shipped · SO-2207': 'Göndərildi · SO-2207',
    'Transfer Baku → Ganja': 'Transfer Bakı → Gəncə', 'Internal': 'Daxili',
    // payments
    'FINANCE': 'MALİYYƏ', 'Get paid.': 'Ödənişləri al.', 'Track every cent.': 'Hər qəpiyə nəzarət.',
    'Overdue': 'Gecikir', 'Partial': 'Qismən', 'Paid': 'Ödənilib', 'Amount due': 'Ödəniləcək məbləğ', 'Collected': 'Yığılıb',
    'Card': 'Kart', 'Bank transfer': 'Bank köçürməsi', '14 Oct · •••• 4821': '14 okt · •••• 4821', '21 Oct · ref 88213': '21 okt · ref 88213',
    'Accepts': 'Qəbul edir', 'Cash': 'Nağd', 'PAID': 'ÖDƏNİLİB',
    // accounting
    'ACCOUNTING': 'MÜHASİBAT', 'Your ledger,': 'Mühasibatınız', 'on autopilot.': 'avtopilotda.', 'JOURNAL ENTRY': 'JURNAL YAZILIŞI',
    'Auto-posted': 'Avtomatik', 'From invoice INV-3318 · Nova Trading LLC': 'INV-3318 fakturasından · Nova Trading MMC',
    'ACCOUNT': 'HESAB', 'DEBIT': 'DEBET', 'CREDIT': 'KREDİT', 'Accounts Receivable': 'Debitor borclar', 'Sales Revenue': 'Satış gəliri',
    'Tax Payable': 'Ödəniləcək vergi', 'Balanced': 'Balanslı', 'Trial balance': 'Sınaq balansı', 'Profit & loss': 'Mənfəət və zərər',
    'Balance sheet': 'Balans hesabatı', 'Dr = Cr': 'Dt = Kt', '+18.2% margin': '+18.2% marja', 'Assets = L + E': 'Aktiv = Ö + K',
    'Fiscal period · Sep 2026': 'Maliyyə dövrü · Sen 2026', 'Closed & locked': 'Bağlandı və kilidləndi',
    // dashboard
    'ANALYTICS': 'ANALİTİKA', 'Your business.': 'Bütün biznesiniz.', 'One dashboard.': 'Bir paneldə.', 'Dashboard': 'İdarə paneli',
    'OCT 2026': 'OKT 2026', 'Monthly collections': 'Aylıq yığım', '↑ 12.4% vs last month': '↑ 12.4% keçən aya görə',
    'Receivables': 'Debitor borclar', '4 invoices overdue': '4 faktura gecikir', 'Open orders': 'Açıq sifarişlər',
    '$61.2k in pipeline': '$61.2k gözləmədə', 'Low stock': 'Az qalıq', ' items': ' məhsul', 'Reorder suggested': 'Sifariş tövsiyə olunur',
    'Sales · last 12 months': 'Satış · son 12 ay',
    // approvals
    'PROCUREMENT · HR': 'SATINALMA · KADRLAR', 'Approvals.': 'Təsdiqlər.', 'One tap.': 'Bir toxunuşla.', 'ADD-ONS': 'ƏLAVƏLƏR',
    'Requisitions → purchase orders · Leave requests': 'Tələblər → alış sifarişləri · Məzuniyyət', 'Decline': 'İmtina', 'Approve': 'Təsdiqlə',
    'Purchase requisition': 'Satınalma tələbi', 'Warehouse · 40 × Pallet wrap': 'Anbar · 40 × Streç plyonka',
    'Approved · PO-0907 created': 'Təsdiqləndi · PO-0907 yaradıldı', 'Leave request': 'Məzuniyyət sorğusu',
    'Leyla H. · Annual leave': 'Leyla H. · İllik məzuniyyət', '3 days · 12–14 Nov': '3 gün · 12–14 noy', 'Approved · Leyla notified': 'Təsdiqləndi · Leylaya bildirildi',
    // security + languages
    'SECURITY': 'TƏHLÜKƏSİZLİK', 'LANGUAGES': 'DİLLƏR', '2FA for all.': 'Hamı üçün 2FA.', '4 languages.': '4 dil.',
    'Owner': 'Sahib', 'Manager': 'Menecer', 'Sales Manager': 'Satış meneceri', 'Procurement Officer': 'Satınalma mütəxəssisi',
    'Warehouse Keeper': 'Anbardar', 'Accountant': 'Mühasib', 'HR Manager': 'Kadr meneceri',
    'Role-based access for every department': 'Hər şöbə üçün rola əsaslanan giriş',
    // stats + end card
    'languages': 'dil', 'system.': 'sistem.',
    'Everything your business': 'Biznesinizə lazım olan', 'needs.': 'hər şey.', 'Now.': 'İndi.', 'Request a demo': 'Demo tələb et',
  };
  const lang = new URLSearchParams(location.search).get('lang') || 'en';
  const dict = { az: AZ }[lang] || {};
  document.documentElement.lang = lang;
  // Translate a plain string (surrounding whitespace preserved).
  const T = (s) => {
    if (typeof s !== 'string') return s;
    if (dict[s] !== undefined) return dict[s];
    const m = s.match(/^(\s*)(.*?)(\s*)$/s);
    return m && dict[m[2]] !== undefined ? m[1] + dict[m[2]] + m[3] : s;
  };
  // Translate the text runs of an HTML snippet, leaving tags untouched.
  const TH = (html) => html.replace(/(^|>)([^<]+)(?=<|$)/g, (all, a, txt) => a + T(txt));
  window.I18N = { lang, T, TH };
})();
