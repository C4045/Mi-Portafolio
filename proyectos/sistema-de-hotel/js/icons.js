(function (App) {
  'use strict';

  const svg = (paths, viewBox = '0 0 24 24') =>
    `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

  const Icons = {
    bell: svg('<path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M9.5 18a2.5 2.5 0 0 0 5 0"/>'),
    bellRing: svg('<path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M9.5 18a2.5 2.5 0 0 0 5 0"/><path d="M4 3l-1.2 1.2M20 3l1.2 1.2"/>'),
    key: svg('<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.6 12.4 19 4M17 6l2 2M14.5 8.5l2 2"/>'),
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    calendarCheck: svg('<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M8.5 14.5l2 2 4-4"/>'),
    door: svg('<rect x="5" y="2.5" width="14" height="19" rx="1.5"/><circle cx="14.5" cy="12" r="1"/>'),
    users: svg('<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16.5 5.2A3.2 3.2 0 0 1 17 11.5"/><path d="M18.5 14.3c2.5.5 3.9 2.3 3.9 5.7"/>'),
    coins: svg('<ellipse cx="9" cy="7" rx="6" ry="3.2"/><path d="M3 7v5c0 1.8 2.7 3.2 6 3.2s6-1.4 6-3.2V7"/><path d="M3 12v5c0 1.8 2.7 3.2 6 3.2s6-1.4 6-3.2v-5"/><path d="M15.2 8.5c2.6.3 4.3 1.6 4.3 3.1s-1.7 2.8-4.3 3.1"/>'),
    search: svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>'),
    filter: svg('<path d="M4 5h16M7 12h10M10.5 19h3"/>'),
    sun: svg('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.4 19.6 6 18M18 6l1.6-1.6"/>'),
    moon: svg('<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    edit: svg('<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
    trash: svg('<path d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7M18 7l-.8 12.1A2 2 0 0 1 15.2 21H8.8a2 2 0 0 1-2-1.9L6 7"/><path d="M10 11v6M14 11v6"/>'),
    check: svg('<path d="M4 12.5 9.5 18 20 6"/>'),
    logIn: svg('<path d="M11 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21H11M16 16l4-4-4-4M20 12H9"/>'),
    logOut: svg('<path d="M13 3h4.5A1.5 1.5 0 0 1 19 4.5v15A1.5 1.5 0 0 1 17.5 21H13M8 16l-4-4 4-4M4 12h11"/>'),
    history: svg('<path d="M3.5 12a8.5 8.5 0 1 0 2.9-6.4"/><path d="M3.5 4.5v4h4"/><path d="M12 8v4.5l3 2"/>'),
    download: svg('<path d="M12 3v12.5M7 11l5 5 5-5"/><path d="M4.5 17.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-1.5"/>'),
    fileText: svg('<path d="M7 2.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"/><path d="M14 2.5V7h4M9 12.5h6M9 16h6"/>'),
    fileSheet: svg('<path d="M7 2.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"/><path d="M14 2.5V7h4M9 12h6M9 16h6M12 12v6"/>'),
    idCard: svg('<rect x="2.5" y="5" width="19" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M5.5 16.3c.6-1.3 1.6-2 2.5-2s1.9.7 2.5 2M14 9.5h5M14 13h5M14 16h3.5"/>'),
    phone: svg('<path d="M5 4.5h3.2L9.7 9 7.4 10.6a10.5 10.5 0 0 0 5 5l1.6-2.3 4.5 1.5V18a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5Z"/>'),
    mail: svg('<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m4 6.5 8 6.5 8-6.5"/>'),
    building: svg('<path d="M4 21V4.5A1.5 1.5 0 0 1 5.5 3h7A1.5 1.5 0 0 1 14 4.5V21"/><path d="M14 10.5h4.5A1.5 1.5 0 0 1 20 12v9"/><path d="M4 21h16M7 7h2M11 7h0M7 11h2M11 11h0M7 15h2M11 15h0M16.5 14.5h1M16.5 17.5h1"/>'),
    trending: svg('<path d="M3.5 16.5 10 10l4 4 6.5-6.5"/><path d="M15 7h5.5V12.5"/>'),
    chevronDown: svg('<path d="M6 9l6 6 6-6"/>'),
    x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    moreVertical: svg('<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>'),
    clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    alert: svg('<path d="M12 3.5 2.5 20h19Z"/><path d="M12 9.5v4.2M12 17h.01"/>'),
    empty: svg('<path d="M4 8.5 12 4l8 4.5M4 8.5v8L12 21l8-4.5v-8M4 8.5 12 13l8-4.5M12 13v8"/>', '0 0 24 24'),
    sparkle: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'),
  };

  App.Icons = Icons;
})(window.App = window.App || {});
