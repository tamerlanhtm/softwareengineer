// 120 BPM: one beat = 0.5s = 15 frames at 30fps, one bar = 2s.
export const BPM = 120;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
export const DURATION = 30;

// Scene start times (seconds), all on bar downbeats. Group scenes follow the order of the 9 module groups.
export const T = {
  hook: 0,
  logo: 2,
  bookings: 4,
  clients: 8,
  catalogue: 10,
  staff: 12,
  finance: 14,
  accounting: 16,
  messaging: 18,
  analytics: 20,
  admin: 22,
  numbers: 24,
  cta: 26,
  end: 30,
};

export const GROUPS = [
  { key: 'bookings', label: 'Bookings & Calendar', modules: 4 },
  { key: 'clients', label: 'Clients', modules: 3 },
  { key: 'catalogue', label: 'Catalogue', modules: 6 },
  { key: 'staff', label: 'Staff', modules: 4 },
  { key: 'finance', label: 'Finance', modules: 5 },
  { key: 'accounting', label: 'Accounting', modules: 4 },
  { key: 'messaging', label: 'Messaging', modules: 4 },
  { key: 'analytics', label: 'Reporting & Analytics', modules: 2 },
  { key: 'admin', label: 'Management & Security', modules: 5 },
];

export const MODULES = [
  ['Calendar', 'Bookings', 'Online Booking Page', 'Waitlist'],
  ['Clients', 'Forms & Consents', 'Marketing'],
  ['Services', 'Packages', 'Memberships', 'Gift Cards', 'Products & Retail', 'Resources'],
  ['Staff', 'Schedules & Time Off', 'Commissions', 'Leave'],
  ['Invoices', 'Payments & Deposits', 'Refunds & Credit Notes', 'Expenses', 'Daily Cash-up'],
  ['Chart of Accounts', 'Journal', 'Financial Statements', 'Fiscal Periods'],
  ['Message Templates', 'Reminder Rules', 'Message Log', 'Campaigns'],
  ['Dashboard', 'Reports'],
  ['User & Role Management', 'Document Management', 'Announcements', 'Location Settings', 'API & Integrations'],
];
