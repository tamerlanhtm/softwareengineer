/* Line icons on a 24px grid (stroke-based, round joins). */
(function () {
  'use strict';
  const I = {
    sales: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    inventory: '<path d="M12 2.8l8.5 4.7v9L12 21.2 3.5 16.5v-9z"/><path d="M3.5 7.5L12 12.2l8.5-4.7"/><path d="M12 12.2v9"/>',
    procurement: '<path d="M2.5 3.5h2.6l2.4 11.3a1.8 1.8 0 0 0 1.8 1.4h8.2a1.8 1.8 0 0 0 1.7-1.3L21.5 7.5H6"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/>',
    finance: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19"/><path d="M6.5 15h4"/>',
    hr: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4"/><path d="M18 14.4c2 .9 3.5 3 3.5 6.1"/>',
    analytics: '<path d="M3.5 20.5h17"/><rect x="5" y="11" width="3.2" height="6.5" rx="1"/><rect x="10.4" y="6" width="3.2" height="11.5" rx="1"/><rect x="15.8" y="13" width="3.2" height="4.5" rx="1"/>',
    accounting: '<rect x="4.5" y="2.5" width="15" height="19" rx="3"/><path d="M8 7h8"/><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01M8 15h.01M12 15h.01M16 15h.01M8 18.5h.01M12 18.5h.01M16 18.5h.01"/>',
    security: '<path d="M12 2.5l7.5 3v5.8c0 4.7-3.2 8.4-7.5 10.2-4.3-1.8-7.5-5.5-7.5-10.2V5.5z"/><path d="M8.6 12.2l2.4 2.4 4.6-4.8"/>',
    shield: '<path d="M12 2.5l7.5 3v5.8c0 4.7-3.2 8.4-7.5 10.2-4.3-1.8-7.5-5.5-7.5-10.2V5.5z"/>',
    check: '<path d="M4.5 12.5l4.8 4.8L19.5 7"/>',
    arrow: '<path d="M4.5 12h15"/><path d="M13.5 6l6 6-6 6"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="11" rx="3"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    truck: '<path d="M2.5 6.5h11v10h-11z"/><path d="M13.5 10h4.2l3.3 3.4v3.1h-7.5"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19"/><path d="M6.5 15h4"/>',
    bank: '<path d="M3 9.5L12 4l9 5.5"/><path d="M5.5 10.5v7M9.8 10.5v7M14.2 10.5v7M18.5 10.5v7"/><path d="M3 20.5h18"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>',
    bell: '<path d="M6 9.5a6 6 0 0 1 12 0c0 5.5 2.5 7 2.5 7h-17S6 15 6 9.5z"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/>',
    globe: '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19"/><path d="M12 2.5c2.6 2.6 4 6 4 9.5s-1.4 6.9-4 9.5c-2.6-2.6-4-6-4-9.5s1.4-6.9 4-9.5z"/>',
    bolt: '<path d="M13 2.5L4.5 13.5H12l-1 8 8.5-11H12z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    swap: '<path d="M4 8h14l-3.5-3.5"/><path d="M20 16H6l3.5 3.5"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    doc: '<path d="M6 2.5h8l4.5 4.5v14.5H6z"/><path d="M14 2.5V7h4.5"/><path d="M9 12h6M9 16h6"/>',
    box: '<rect x="3" y="7" width="18" height="13.5" rx="2.5"/><path d="M3 11h18"/><path d="M10 15h4"/><path d="M5.5 7l1.8-3.5h9.4L18.5 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    key: '<circle cx="8" cy="15" r="4.5"/><path d="M11.2 11.8L20.5 2.5M17 6l3 3M14.5 8.5l2 2"/>',
    home: '<path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5v11h13v-11"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
  };

  // icon(name, size, color, strokeWidth) -> <svg> element
  window.icon = function (name, size = 24, color = 'currentColor', sw = 2) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('width', size);
    s.setAttribute('height', size);
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', color);
    s.setAttribute('stroke-width', sw);
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    s.innerHTML = I[name] || '';
    s.style.display = 'block';
    return s;
  };
  window.ICONS = I;
})();
