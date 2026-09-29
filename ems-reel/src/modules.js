// The 36 shipped EMSNow modules, grouped as sold (EMS/01/config/ems.php).
// Order: the five BASE groups first, then the two paid add-on groups, so the
// add-ons fill the bottom of the 6×6 grid.
export const GROUPS = [
  { key: 'core', label: 'Core Academics', base: true },
  { key: 'learning', label: 'Teaching & Learning', base: true },
  { key: 'finance', label: 'Finance & Billing', base: true },
  { key: 'analytics', label: 'Reporting & Analytics', base: true },
  { key: 'admin', label: 'Management & Security', base: true },
  { key: 'services', label: 'Student Services', base: false },
  { key: 'engagement', label: 'Community & Engagement', base: false },
];

export const MODULES = [
  // core
  { key: 'students', name: 'Students', group: 'core', icon: 'users' },
  { key: 'admissions', name: 'Admissions', group: 'core', icon: 'user-plus' },
  { key: 'academics', name: 'Classes & Curriculum', group: 'core', icon: 'layers' },
  { key: 'timetable', name: 'Timetable', group: 'core', icon: 'calendar-clock' },
  { key: 'attendance', name: 'Attendance', group: 'core', icon: 'clipboard-check' },
  // learning
  { key: 'exams', name: 'Exams & Grading', group: 'learning', icon: 'graduation-cap' },
  { key: 'assignments', name: 'Homework', group: 'learning', icon: 'notebook-pen' },
  { key: 'lms', name: 'E-Learning', group: 'learning', icon: 'monitor-play' },
  { key: 'lesson_plans', name: 'Lesson Plans', group: 'learning', icon: 'book-open-check' },
  // finance
  { key: 'fees', name: 'Fees & Invoicing', group: 'finance', icon: 'receipt' },
  { key: 'payments', name: 'Payments', group: 'finance', icon: 'credit-card' },
  { key: 'payroll', name: 'Payroll', group: 'finance', icon: 'banknote' },
  { key: 'accounting', name: 'Accounting', group: 'finance', icon: 'calculator' },
  // analytics
  { key: 'dashboard', name: 'Dashboard', group: 'analytics', icon: 'layout-dashboard' },
  { key: 'reports', name: 'Advanced Reporting', group: 'analytics', icon: 'chart-column' },
  // admin
  { key: 'staff_hr', name: 'Staff & HR', group: 'admin', icon: 'briefcase' },
  { key: 'staff_leave', name: 'Staff Leave', group: 'admin', icon: 'calendar-off' },
  { key: 'inventory', name: 'Inventory', group: 'admin', icon: 'package' },
  { key: 'users_roles', name: 'Users & Roles', group: 'admin', icon: 'shield-check' },
  { key: 'documents', name: 'Documents', group: 'admin', icon: 'folder-open' },
  { key: 'integrations', name: 'Integrations', group: 'admin', icon: 'plug' },
  { key: 'settings', name: 'Settings', group: 'admin', icon: 'settings' },
  // services (add-on)
  { key: 'library', name: 'Library', group: 'services', icon: 'library' },
  { key: 'transport', name: 'Transport', group: 'services', icon: 'bus' },
  { key: 'hostel', name: 'Hostel', group: 'services', icon: 'bed-double' },
  { key: 'health', name: 'Health', group: 'services', icon: 'heart-pulse' },
  { key: 'discipline', name: 'Discipline', group: 'services', icon: 'scale' },
  { key: 'special_education', name: 'Special Education', group: 'services', icon: 'puzzle' },
  { key: 'front_desk', name: 'Front Desk', group: 'services', icon: 'concierge-bell' },
  { key: 'cafeteria', name: 'Cafeteria', group: 'services', icon: 'utensils' },
  // engagement (add-on)
  { key: 'portal', name: 'Parent Portal', group: 'engagement', icon: 'smartphone' },
  { key: 'communications', name: 'Notifications', group: 'engagement', icon: 'bell-ring' },
  { key: 'events_calendar', name: 'Events', group: 'engagement', icon: 'calendar-heart' },
  { key: 'activities', name: 'Clubs & Activities', group: 'engagement', icon: 'trophy' },
  { key: 'certificates', name: 'Certificates & ID', group: 'engagement', icon: 'id-card' },
  { key: 'alumni', name: 'Alumni', group: 'engagement', icon: 'heart-handshake' },
];

export const ICON_NAMES = [
  ...new Set([
    ...MODULES.map((m) => m.icon),
    // hook "chaos" apps
    'message-circle', 'mail', 'calendar', 'table-2', 'folder', 'phone', 'cloud', 'sticky-note', 'file-spreadsheet', 'clipboard-list', 'bell',
    // feature UIs
    'triangle-alert', 'check', 'circle-check', 'award', 'book-open', 'wallet', 'download', 'trending-up', 'mouse-pointer-2',
    'lock', 'shield', 'languages', 'globe', 'arrow-right', 'sparkles', 'at-sign', 'plus', 'clock', 'user-check', 'user-round', 'landmark',
  ]),
];
