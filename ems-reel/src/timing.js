// Master cue sheet (seconds). The soundtrack is written at 120 BPM with the
// drop on 3.0s, so every section boundary below lands on a beat.
export const T = {
  // 1 · hook — "Still running your school on …?"
  hook: 0.0,
  q1: 1.0,
  q2: 1.5,
  q3: 2.0,
  implode: 2.5,

  // 2 · logo build + lockup
  drop: 3.0,
  split2: 3.25,
  punch: 3.5,
  lockup: 3.85,

  // 3 · "One system. Your entire school." → dive through the logo's open square
  one: 4.95,
  zoom: 6.3,

  // 4 · 36 modules  ·  5 · core + add-ons
  mods: 6.75,
  flips: 7.5,
  core: 9.0,
  addons: 10.0,
  toCard: 10.62,

  // 6 · feature spotlights (one bar each)
  f1: 11.0, // timetable
  f2: 13.0, // exams
  f3: 15.0, // finance
  f4: 17.0, // parent portal
  f5: 19.0, // dashboard

  // 7 · breadth
  blitz: 21.0,
  lang: 22.5,
  roles: 23.75,

  // 8 · finale
  fin: 25.0,
  morph: 26.05,
  end: 26.7,
  click: 27.85,
  total: 30.0,
};
