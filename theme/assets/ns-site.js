/* ns-site.js: the ArviStay hotel-website renderer. Built from web/site/*.js (joined by name).
   The same file draws the owner's live preview (in the app), the hosted page (<app>/_/api/s/<slug>) and the
   exported site (inlined into index.html). It must not depend on the app: no window.UI, no server calls.

   Part 1 (this file): the catalog. Icons, place categories, palettes, typography, hotel amenities, room tags,
   the 30 guest profiles ("personas") and the section list. */
(function () {
  'use strict';
  var NS = window.NSSite = window.NSSite || {};
  NS.version = 1;

  /* ------------------------------------------------------------------ icons (24px line icons) */
  NS.ICONS = {
    bed: '<path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M3 18v2M21 18v2"/><path d="M6 9V6.5A1.5 1.5 0 0 1 7.5 5h3A1.5 1.5 0 0 1 12 6.5V9M12 9V6.5A1.5 1.5 0 0 1 13.5 5h3A1.5 1.5 0 0 1 18 6.5V9"/>',
    cup: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3.5c0 1.5 1 1.5 1 3M12 3.5c0 1.5 1 1.5 1 3"/>',
    fork: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 21V3c-2 1-3.5 4-3.5 8h3.5"/>',
    glass: '<path d="M7 3h10l-1 7a4 4 0 0 1-8 0z"/><path d="M12 14v7M8.5 21h7M7.6 7h8.8"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    column: '<path d="M3 21h18M4 8h16M12 3 3.5 8M12 3l8.5 5M6 8v10M10 8v10M14 8v10M18 8v10M4.5 18h15"/>',
    frame: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><rect x="7.5" y="6.5" width="9" height="11" rx="1"/><path d="m8 15 2.5-3 2 2 1.5-1.5 2 2.5"/>',
    sight: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    church: '<path d="M12 2v4M10 4h4M12 6l-5 5v10h10V11z"/><path d="M4 21v-6l3-2M20 21v-6l-3-2M10.5 21v-3.5a1.5 1.5 0 0 1 3 0V21"/>',
    tree: '<path d="M12 21v-6"/><path d="M12 15c-4.5 0-7-2.6-7-5.6 0-2.4 1.8-4.4 4.2-4.7A4 4 0 0 1 12 3a4 4 0 0 1 2.8 1.7c2.4.3 4.2 2.3 4.2 4.7 0 3-2.5 5.6-7 5.6z"/><path d="M9 21h6"/>',
    bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
    basket: '<path d="M3 10h18l-2 10H5z"/><path d="m7 10 4-6M17 10l-4-6M9 14v3M12 14v3M15 14v3"/>',
    leaf: '<path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15"/><path d="M5 19c3-4 6-6.5 10-8.5"/>',
    dumbbell: '<path d="M6 7v10M3.5 9.5v5M18 7v10M20.5 9.5v5M6 12h12"/>',
    mask: '<path d="M4 4h16v6a8 8 0 0 1-16 0z"/><path d="M8 9h2M14 9h2M9 14c1.8 1.6 4.2 1.6 6 0"/>',
    kids: '<circle cx="12" cy="8" r="5"/><path d="M12 13v4M10 21l2-4 2 4M12 3c1 1 1 2.5 0 3.5"/>',
    train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l1.5-4M15 21l-1.5-4"/><circle cx="9" cy="14" r=".8"/><circle cx="15" cy="14" r=".8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    medical: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    walk: '<circle cx="13" cy="4" r="1.8"/><path d="m10 21 2-6-2.5-3 1-5 3 2.5 3 1M9.5 7 7 9v3M12 15l3 2 1 4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/>',
    fire: '<path d="M12 21c-4 0-7-2.8-7-6.5C5 10 9 8 9 4c3 1.5 4.5 4 4.5 6.5C15 9.5 15.5 8 15.5 7 18 9 19 11.7 19 14.5 19 18.2 16 21 12 21z"/><path d="M12 21c-1.7 0-3-1.3-3-3 0-2 2-3 2-5 1.8 1 4 2.6 4 5 0 1.7-1.3 3-3 3z"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H11v17H5.5A1.5 1.5 0 0 0 4 21.5zM20 4.5A1.5 1.5 0 0 0 18.5 3H13v17h5.5a1.5 1.5 0 0 1 1.5 1.5z"/>',
    bike: '<circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="M5.5 16.5 9 9h6l3.5 7.5M9 9 12 16.5h3M14 6h2.5l1 3"/>',
    lift: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 3v18M7.5 9 9 7l1.5 2M13.5 15l1.5 2 1.5-2"/>',
    suitcase: '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M8 7v13M16 7v13"/>',
    plane: '<path d="M10.5 13 3 11l1.5-2 7 .5L16 4.5a2 2 0 0 1 3 3L14 12l.5 7-2 1.5-2-7.5-3 3v2.5L6 20l-1-3-3-1 1.5-1.5H6z"/>',
    parking: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M9.5 17V7h3.5a3 3 0 0 1 0 6H9.5"/>',
    paw: '<circle cx="7" cy="9" r="1.8"/><circle cx="11" cy="5.8" r="1.8"/><circle cx="15.5" cy="6.5" r="1.8"/><circle cx="18.5" cy="10.5" r="1.8"/><path d="M8 17.5c0-3 2.5-6 5-6s5 3.5 4 6.5c-.7 2-3 1.5-4.5 1.5S8.3 20 8 17.5z"/>',
    access: '<circle cx="12" cy="4.5" r="1.8"/><path d="M12 7v6h5l2 5M12 9.5H8"/><path d="M8.5 12.5a5 5 0 1 0 6.8 6.5"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12.5h18"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    snow: '<path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17"/><path d="m9.5 3.5 2.5 2 2.5-2M9.5 20.5l2.5-2 2.5 2"/>',
    beer: '<path d="M5 6h11v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M16 9h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M8.5 10v7M12.5 10v7"/><path d="M5 6a3 3 0 0 1 3-3c1 0 1.5.5 2.5.5S12 3 13 3a3 3 0 0 1 3 3"/>',
    ship: '<path d="M3 17c1.5 1.3 3 2 4.5 2s3-.7 4.5-2c1.5 1.3 3 2 4.5 2s3-.7 4.5-2"/><path d="m4.5 15-1-4h17l-1 4M6 11V7h12v4M12 3v4"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3z" transform="translate(0 2)"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
    building: '<path d="M4 21V5l8-2v18M12 7h8v14M2 21h20M7 8h2M7 12h2M7 16h2M15 11h2M15 15h2"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.7c2.2.6 3.5 2.4 3.5 5.3"/>',
    run: '<circle cx="15" cy="4" r="1.8"/><path d="m6 20 4-4.5 2.5 1.5L14 12l3 2.5h3M8.5 11.5l2-3.5h4.5l-1 4"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="m10 8.5 5.5 3.5-5.5 3.5z" fill="currentColor"/>',
    cube: '<path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z"/><path d="M3.5 7 12 11.5 20.5 7M12 11.5v10"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    left: '<path d="M15 6l-6 6 6 6"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    quote: '<path d="M9.5 7C6.5 8 5 10.5 5 14v3h5v-5H7.3c.2-1.8 1.1-3 2.7-3.6zM19 7c-3 1-4.5 3.5-4.5 7v3h5v-5h-2.7c.2-1.8 1.1-3 2.7-3.6z"/>',
    sparkle: '<path d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7zM19 16c.2 1.4.8 2 2.2 2.2-1.4.2-2 .8-2.2 2.2-.2-1.4-.8-2-2.2-2.2 1.4-.2 2-.8 2.2-2.2z"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5M10 21v-6h4v6"/>',
    ruler: '<path d="m3 16 13-13 5 5L8 21z"/><path d="m7 12 2 2M10 9l2 2M13 6l2 2"/>',
    shower: '<path d="M4 21V7a4 4 0 0 1 8 0"/><path d="M9 9h6M10 13v1M13 13v1M16 13v1M11 16.5v1M14 16.5v1M12.5 19.5v1"/>',
    window: '<path d="M5 21V10a7 7 0 0 1 14 0v11z"/><path d="M12 3v18M5 13h14M3 21h18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    euro: '<path d="M17.5 6.5A7 7 0 0 0 6 12a7 7 0 0 0 11.5 5.5M4 10h9M4 14h8"/>',
    baby: '<circle cx="12" cy="9" r="5"/><path d="M10 9h.01M14 9h.01M10.5 11c.9.7 2.1.7 3 0M7 15.5 5 21M17 15.5l2 6M9 14.5h6"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    sofa: '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2zM5 18v2M19 18v2"/>',
    tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
    door: '<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18"/><circle cx="15" cy="12.5" r=".9"/>'
  };
  NS.icon = function (name, cls) {
    return '<svg class="ns-ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (NS.ICONS[name] || NS.ICONS.sparkle) + '</svg>';
  };

  /* ------------------------------------------------------------------ place categories
     color: the pin colour on maps. verb: how a stay story mentions a visit. */
  NS.CATS = {
    sight:      { label: 'Sight', plural: 'sights', icon: 'sight', color: '#b4832c', verbs: ['See {n}', 'Stand in front of {n}', 'Wander over to {n}'] },
    museum:     { label: 'Museum', plural: 'museums', icon: 'column', color: '#7a4f8f', verbs: ['Explore {n}', 'An hour or two at {n}', 'Step into {n}'] },
    gallery:    { label: 'Gallery', plural: 'galleries', icon: 'frame', color: '#9a5a7c', verbs: ['Browse {n}', 'Look in at {n}'] },
    church:     { label: 'Church', plural: 'churches', icon: 'church', color: '#6a6f8c', verbs: ['Visit {n}', 'Quiet moment at {n}', 'Climb or look up at {n}'] },
    culture:    { label: 'Stage & screen', plural: 'theatres & concert halls', icon: 'mask', color: '#a5525c', verbs: ['A performance at {n}', 'Tickets for {n}'] },
    cafe:       { label: 'Café', plural: 'cafés', icon: 'cup', color: '#8a5a3c', verbs: ['Coffee at {n}', 'Slow coffee at {n}', 'Cake and coffee at {n}'] },
    restaurant: { label: 'Restaurant', plural: 'restaurants', icon: 'fork', color: '#c0603a', verbs: ['Eat at {n}', 'A table at {n}', 'Dinner at {n}'] },
    bar:        { label: 'Bar', plural: 'bars & pubs', icon: 'glass', color: '#8f2f47', verbs: ['Drinks at {n}', 'A glass at {n}', 'Nightcap at {n}'] },
    nightlife:  { label: 'Nightlife', plural: 'clubs & late venues', icon: 'music', color: '#5b3d8f', verbs: ['Dance at {n}', 'Late night at {n}'] },
    park:       { label: 'Park', plural: 'parks & gardens', icon: 'tree', color: '#3f7f4f', verbs: ['Stroll through {n}', 'Fresh air in {n}', 'A bench in {n}'] },
    shop:       { label: 'Shop', plural: 'shops & boutiques', icon: 'bag', color: '#b0646b', verbs: ['Browse {n}', 'Shopping at {n}'] },
    market:     { label: 'Market & food shop', plural: 'markets & food shops', icon: 'basket', color: '#a07a2a', verbs: ['Pick up treats at {n}', 'Wander {n}'] },
    wellness:   { label: 'Wellness', plural: 'spas & wellness', icon: 'leaf', color: '#4f8f86', verbs: ['Unwind at {n}', 'Treat yourself at {n}'] },
    sport:      { label: 'Sport', plural: 'gyms & sport', icon: 'dumbbell', color: '#4a6f9a', verbs: ['Work out at {n}', 'Swim or train at {n}'] },
    kids:       { label: 'For kids', plural: 'places for kids', icon: 'kids', color: '#d08a2e', verbs: ['Let the kids loose at {n}', 'Family time at {n}'] },
    coworking:  { label: 'Coworking', plural: 'coworking spaces', icon: 'laptop', color: '#3d6f7f', verbs: ['Work a few hours at {n}'] },
    transport:  { label: 'Transport', plural: 'stations & stops', icon: 'train', color: '#4e5d6c', verbs: ['Head to {n}'] },
    essentials: { label: 'Essentials', plural: 'pharmacies & ATMs', icon: 'medical', color: '#5f7d6a', verbs: ['Pop into {n}'] }
  };
  NS.CAT_ORDER = ['sight', 'museum', 'gallery', 'church', 'culture', 'cafe', 'restaurant', 'bar', 'nightlife', 'park', 'shop', 'market',
    'wellness', 'sport', 'kids', 'coworking', 'transport', 'essentials'];

  /* ------------------------------------------------------------------ palettes (each one is a whole site look) */
  NS.PALETTES = {
    riga:    { name: 'Riga Jugend', note: 'Verdigris and gilt on parchment', dark: false,
               c: { bg: '#f3ecdf', surface: '#fbf6ec', ink: '#1c2a27', muted: '#5a6660', line: '#dccdb2', brand: '#1f5c55', brandInk: '#fbf6ec', accent: '#b4832c', soft: '#e1ebe4', deep: '#132a26' } },
    mucha:   { name: 'Mucha', note: 'Dusty rose, sage and gold', dark: false,
               c: { bg: '#f6eee5', surface: '#fffaf4', ink: '#3b2a2b', muted: '#7a6662', line: '#ead6c6', brand: '#a3585f', brandInk: '#fffaf4', accent: '#b98d3e', soft: '#f2dfdc', deep: '#3b2427' } },
    horta:   { name: 'Horta', note: 'Wrought iron, copper and ivory', dark: true,
               c: { bg: '#142019', surface: '#1b2a23', ink: '#efe7d6', muted: '#a8b4a7', line: '#2e4037', brand: '#cf8a55', brandInk: '#142019', accent: '#9cc5a1', soft: '#26372f', deep: '#0c1511' } },
    klimt:   { name: 'Klimt', note: 'Black lacquer and gold leaf', dark: true,
               c: { bg: '#12110f', surface: '#1c1a16', ink: '#f3e9d2', muted: '#b3a98f', line: '#3a3327', brand: '#d8ac44', brandInk: '#12110f', accent: '#b5434f', soft: '#2a251b', deep: '#080706' } },
    peacock: { name: 'Peacock', note: 'Peacock blue, emerald and brass', dark: false,
               c: { bg: '#eef3f0', surface: '#ffffff', ink: '#0f2a33', muted: '#4c6670', line: '#cddcd9', brand: '#0f5a6b', brandInk: '#ffffff', accent: '#b8932a', soft: '#d9ecee', deep: '#0a2730' } },
    lily:    { name: 'Lily', note: 'White lily, lilac and moss', dark: false,
               c: { bg: '#fbfaf7', surface: '#ffffff', ink: '#2b2d2a', muted: '#6b6f69', line: '#e6e2d9', brand: '#6b5b95', brandInk: '#ffffff', accent: '#7a8c4e', soft: '#eeeaf5', deep: '#2b2440' } }
  };

  /* ------------------------------------------------------------------ typography pairs (Google Fonts)
     Jost (Google Fonts) draws the Latvian macrons (ā ē ī ū) on the wrong letter, like Fraunces (APP_MAKER/ANVIL_NOTES.md).
     So Belle Époque loads Jost only for basic Latin, Western European and Cyrillic letters (css2: the text= parameter) and
     every other letter (Latvian, Lithuanian, Polish…) falls back to Figtree, a near-identical geometric sans. */
  var JOST_TEXT = (function () {
    var s = '', c;
    for (c = 32; c < 127; c++) s += String.fromCharCode(c);
    for (c = 160; c < 256; c++) s += String.fromCharCode(c);
    for (c = 0x400; c < 0x460; c++) s += String.fromCharCode(c);
    return s + '\u2013\u2014\u2018\u2019\u201c\u201d\u201e\u00ab\u00bb\u2026\u20ac\u2022\u00b7\u2116';
  })();
  NS.FONTS = {
    belle:     { name: 'Belle Époque', display: 'Cormorant Garamond', body: 'Jost', fallback: 'Figtree',
                 css: 'family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Figtree:wght@400;500;600',
                 css2: 'family=Jost:wght@400;500;600&text=' + encodeURIComponent(JOST_TEXT) },
    secession: { name: 'Secession', display: 'Federo', body: 'Lora',
                 css: 'family=Federo&family=Lora:ital,wght@0,400;0,500;0,600;1,400' },
    atelier:   { name: 'Atelier', display: 'Playfair Display', body: 'Karla',
                 css: 'family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Karla:wght@400;500;600' },
    facade:    { name: 'Façade', display: 'Marcellus', body: 'Mulish',
                 css: 'family=Marcellus&family=Mulish:wght@400;500;600;700' }
  };
  NS.fontsUrl = function (key) {
    var f = NS.FONTS[key] || NS.FONTS.belle;
    return 'https://fonts.googleapis.com/css2?' + f.css + '&display=swap';
  };
  /* Every stylesheet a pair needs (Belle Époque: two, see above). */
  NS.fontsUrls = function (key) {
    var f = NS.FONTS[key] || NS.FONTS.belle;
    return [NS.fontsUrl(key)].concat(f.css2 ? ['https://fonts.googleapis.com/css2?' + f.css2 + '&display=swap'] : []);
  };
  NS.bodyStack = function (key) {
    var f = NS.FONTS[key] || NS.FONTS.belle;
    return '"' + f.body + '", ' + (f.fallback ? '"' + f.fallback + '", ' : '') + 'system-ui, sans-serif';
  };

  /* ------------------------------------------------------------------ hotel amenities (highlights + persona perks) */
  NS.FEATURES = {
    breakfast: { label: 'Breakfast included', icon: 'cup' },
    restaurant: { label: 'Restaurant in the house', icon: 'fork' },
    bar: { label: 'Bar', icon: 'glass' },
    wifi: { label: 'Free Wi-Fi', icon: 'wifi' },
    fireplace: { label: 'Lobby fireplace', icon: 'fire' },
    library: { label: 'Guest library', icon: 'book' },
    bikes: { label: 'Bikes to rent', icon: 'bike' },
    lift: { label: 'Lift', icon: 'lift' },
    luggage: { label: 'Luggage storage', icon: 'suitcase' },
    airport: { label: 'Airport transfer', icon: 'plane' },
    parking: { label: 'Parking nearby', icon: 'parking' },
    family: { label: 'Cots for little ones', icon: 'baby' },
    pets: { label: 'Pets welcome', icon: 'paw' },
    accessible: { label: 'Step-free access', icon: 'access' },
    late: { label: 'Late check-in', icon: 'moon' },
    desk: { label: 'Work desk', icon: 'laptop' },
    kettle: { label: 'Tea & coffee in rooms', icon: 'cup' },
    quiet: { label: 'Quiet rooms', icon: 'moon' },
    ac: { label: 'Air conditioning', icon: 'snow' },
    spa: { label: 'Sauna or spa', icon: 'leaf' },
    gym: { label: 'Gym', icon: 'dumbbell' },
    reception: { label: '24-hour reception', icon: 'key' },
    tours: { label: 'Tours & tickets desk', icon: 'ticket' }
  };

  /* Room tags: owners tag rooms; personas prefer some. */
  NS.ROOM_TAGS = {
    double: 'Double bed', twin: 'Twin beds', single: 'Single', family: 'Family-sized', large: 'Spacious', quiet: 'Quiet side',
    view: 'Street view', courtyard: 'Courtyard side', romantic: 'Romantic', workspace: 'Good for work', accessible: 'Step-free',
    budget: 'Best price', pets: 'Pet-friendly'
  };

  /* ------------------------------------------------------------------ the 30 guest profiles
     w: how much each place category matters (0-3). rhythm: early | normal | late (sets the day's timing).
     rooms: room tags they like. perks: amenities to put first. walk: how far they like to walk (1 normal, <1 less). */
  NS.PERSONAS = [
    { id: 'artnouveau', name: 'Art Nouveau Admirer', icon: 'building', line: 'Here for facades, stained glass and the curve of a staircase.',
      hook: 'Wake up among the finest facades in Europe.', w: { sight: 3, gallery: 2, museum: 2, cafe: 1.5, church: 1 }, rhythm: 'normal', rooms: ['view'], perks: ['location', 'breakfast', 'library'] },
    { id: 'history', name: 'History Buff', icon: 'column', line: 'Every cobblestone has a story, and they want all of them.',
      hook: 'Centuries of history start at the front door.', w: { museum: 3, sight: 3, church: 2, cafe: 1 }, rhythm: 'early', rooms: ['quiet'], perks: ['location', 'tours', 'library'] },
    { id: 'foodie', name: 'Foodie', icon: 'fork', line: 'Plans the trip around lunch and dinner. Breakfast too.',
      hook: 'Your table is never more than a few minutes away.', w: { restaurant: 3, market: 3, cafe: 2, bar: 1.5 }, rhythm: 'normal', rooms: [], perks: ['restaurant', 'breakfast'] },
    { id: 'coffee', name: 'Coffee Lover', icon: 'cup', line: 'Judges a city by its flat whites and its cinnamon buns.',
      hook: 'A great cup of coffee around every corner.', w: { cafe: 3, gallery: 1, park: 1, shop: 1, market: 1 }, rhythm: 'normal', rooms: [], perks: ['breakfast', 'kettle'] },
    { id: 'romantic', name: 'Romantic Couple', icon: 'heart', line: 'Candle-lit dinners, late mornings, a walk by the water.',
      hook: 'Candle-lit dinners and cobbled lanes for two.', w: { restaurant: 3, bar: 2, sight: 2, park: 2, culture: 1.5, wellness: 1 }, rhythm: 'late', rooms: ['romantic', 'double', 'view', 'quiet'], perks: ['restaurant', 'fireplace', 'breakfast'] },
    { id: 'family', name: 'Family with Kids', icon: 'kids', line: 'Little legs, big curiosity, and snacks at all times.',
      hook: 'Short walks, big adventures, room for everyone.', w: { kids: 3, park: 3, museum: 2, restaurant: 1.5, essentials: 1, market: 1 }, rhythm: 'early', rooms: ['family', 'large'], perks: ['family', 'breakfast', 'lift'], walk: 0.7 },
    { id: 'business', name: 'Business Traveller', icon: 'briefcase', line: 'Meetings by day, a good dinner and a quiet room by night.',
      hook: 'Close to everything, quiet when you need it.', w: { transport: 3, cafe: 2, restaurant: 2, coworking: 2, essentials: 1, bar: 1 }, rhythm: 'early', rooms: ['workspace', 'quiet', 'single'], perks: ['wifi', 'desk', 'breakfast', 'airport'], nights: 2 },
    { id: 'nomad', name: 'Digital Nomad', icon: 'laptop', line: 'Laptop, good Wi-Fi, better coffee, a city to explore after five.',
      hook: 'Work from anywhere, then explore everything.', w: { coworking: 3, cafe: 3, sport: 1, market: 1.5, bar: 1 }, rhythm: 'normal', rooms: ['workspace', 'quiet'], perks: ['wifi', 'desk', 'kettle'], nights: 4 },
    { id: 'nightowl', name: 'Night Owl', icon: 'moon', line: 'The city really starts after 10 pm.',
      hook: 'The bars are close, and so is your bed.', w: { bar: 3, nightlife: 3, restaurant: 2, cafe: 1 }, rhythm: 'late', rooms: ['quiet'], perks: ['late', 'reception', 'bar'] },
    { id: 'culture', name: 'Concert & Opera Goer', icon: 'music', line: 'Has the opera schedule open in another tab.',
      hook: 'Curtain up, then a short walk home.', w: { culture: 3, restaurant: 2, bar: 1.5, sight: 1, church: 1 }, rhythm: 'late', rooms: ['quiet', 'double'], perks: ['location', 'tours'] },
    { id: 'shopper', name: 'Shopper', icon: 'bag', line: 'Leaves with one more bag than they arrived with.',
      hook: 'Boutiques, markets and makers on your doorstep.', w: { shop: 3, market: 2, cafe: 2, gallery: 1 }, rhythm: 'normal', rooms: ['large'], perks: ['luggage', 'location'] },
    { id: 'wellness', name: 'Wellness Seeker', icon: 'leaf', line: 'Saunas, slow mornings, green spaces and early nights.',
      hook: 'Slow mornings, green parks, a city that breathes.', w: { wellness: 3, park: 2, sport: 2, cafe: 1, market: 1 }, rhythm: 'early', rooms: ['quiet', 'courtyard'], perks: ['spa', 'quiet', 'breakfast'] },
    { id: 'runner', name: 'Morning Runner', icon: 'run', line: 'Laces up before breakfast and maps every route.',
      hook: 'Run the canal at sunrise, breakfast when you are back.', w: { park: 3, sport: 2, cafe: 1.5, sight: 1 }, rhythm: 'early', rooms: ['quiet'], perks: ['breakfast', 'gym'] },
    { id: 'cyclist', name: 'Cyclist', icon: 'bike', line: 'Sees the city on two wheels, from the river to the suburbs.',
      hook: 'Grab a bike and the whole city is yours.', w: { park: 2, sight: 2, cafe: 2, transport: 1 }, rhythm: 'normal', rooms: [], perks: ['bikes', 'luggage'], walk: 1.6 },
    { id: 'photographer', name: 'Photographer', icon: 'camera', line: 'Chases golden hour, rooftops and quiet streets at dawn.',
      hook: 'Golden hour starts outside your window.', w: { sight: 3, church: 2, park: 2, gallery: 1, culture: 0.5 }, rhythm: 'early', rooms: ['view'], perks: ['location', 'breakfast'] },
    { id: 'budget', name: 'Budget Explorer', icon: 'compass', line: 'Wants the most city for the least money.',
      hook: 'Walk everywhere. Spend it on experiences.', w: { market: 2, sight: 2, park: 2, restaurant: 1, transport: 1.5 }, rhythm: 'normal', rooms: ['budget', 'twin', 'single'], perks: ['breakfast', 'wifi', 'location'] },
    { id: 'solo', name: 'Solo Traveller', icon: 'walk', line: 'Their own pace, their own plans, and a good book.',
      hook: 'Your own pace, in a city that is easy to love.', w: { cafe: 2, museum: 2, sight: 2, bar: 1, culture: 1 }, rhythm: 'normal', rooms: ['single', 'quiet'], perks: ['reception', 'library', 'location'] },
    { id: 'friends', name: "Friends' Weekend", icon: 'users', line: 'Three friends, two days, one group chat full of plans.',
      hook: 'Dinner, drinks and stories you will retell for years.', w: { bar: 3, restaurant: 2, nightlife: 2, sight: 1, market: 1 }, rhythm: 'late', rooms: ['twin', 'family', 'large'], perks: ['late', 'bar', 'location'] },
    { id: 'unhurried', name: 'Unhurried Travellers', icon: 'clock', line: 'Retired, curious and in no rush at all.',
      hook: 'Everything worth seeing, within an easy stroll.', w: { sight: 2, church: 2, cafe: 2, culture: 2, park: 1, museum: 1 }, rhythm: 'normal', rooms: ['quiet', 'double'], perks: ['lift', 'breakfast', 'reception'], walk: 0.6 },
    { id: 'stepfree', name: 'Step-free Traveller', icon: 'access', line: 'Needs smooth routes, lifts and no surprises.',
      hook: 'Short, smooth routes and help when you need it.', w: { essentials: 2, sight: 2, cafe: 2, transport: 2, restaurant: 1 }, rhythm: 'normal', rooms: ['accessible'], perks: ['lift', 'accessible', 'reception'], walk: 0.5 },
    { id: 'dog', name: 'Travelling with a Dog', icon: 'paw', line: 'The best friend comes too.',
      hook: 'Parks for them, cafés for you.', w: { park: 3, cafe: 2, essentials: 1, restaurant: 1 }, rhythm: 'early', rooms: ['pets'], perks: ['pets'] },
    { id: 'winter', name: 'Winter & Christmas Market', icon: 'snow', line: 'Mulled wine, candlelight and markets under falling snow.',
      hook: 'Christmas markets and candlelit cafés, a short walk away.', w: { market: 3, church: 2, cafe: 2, culture: 1.5, restaurant: 1 }, rhythm: 'normal', rooms: ['quiet'], perks: ['fireplace', 'breakfast'], season: 'winter' },
    { id: 'summer', name: 'White Nights Summer', icon: 'sun', line: 'Long evenings, terraces and sunsets after ten.',
      hook: 'Long light evenings on the terraces outside.', w: { park: 3, bar: 2, sight: 2, restaurant: 1.5 }, rhythm: 'late', rooms: ['view'], perks: ['bikes', 'location'], season: 'summer' },
    { id: 'beer', name: 'Craft Beer Fan', icon: 'beer', line: 'Has a list of breweries and taprooms to tick off.',
      hook: 'Taprooms and beer gardens within a short wander.', w: { bar: 3, restaurant: 2, market: 1 }, rhythm: 'late', rooms: [], perks: ['location', 'late'] },
    { id: 'plantbased', name: 'Plant-based Eater', icon: 'leaf', line: 'Vegetarian or vegan, and always hunting the best menus.',
      hook: 'Fresh, green food all around the block.', w: { restaurant: 3, cafe: 2, market: 2 }, rhythm: 'normal', rooms: [], perks: ['breakfast', 'restaurant'], diet: true },
    { id: 'layover', name: 'Short Layover', icon: 'plane', line: 'One night, a few hours of city, an early flight.',
      hook: 'One night is enough to fall for the city.', w: { transport: 3, restaurant: 2, sight: 2, bar: 1 }, rhythm: 'normal', rooms: ['single', 'quiet'], perks: ['airport', 'late', 'luggage'], nights: 1 },
    { id: 'cruise', name: 'Ferry & Cruise Day', icon: 'ship', line: 'Arrives by sea and wants the highlights before sailing.',
      hook: 'The best of the old town, then back to the port.', w: { sight: 3, restaurant: 2, shop: 1, transport: 2, church: 1 }, rhythm: 'early', rooms: [], perks: ['luggage', 'location'], nights: 1 },
    { id: 'architect', name: 'Architecture Student', icon: 'cap', line: 'Sketchbook in hand, from Gothic to Jugendstil to Soviet modern.',
      hook: 'Seven centuries of architecture in one walk.', w: { sight: 3, gallery: 2, museum: 2, church: 2, cafe: 1 }, rhythm: 'early', rooms: ['budget', 'twin'], perks: ['location', 'library', 'wifi'] },
    { id: 'conference', name: 'Event & Conference Visitor', icon: 'ticket', line: 'In town for an event, with evenings free.',
      hook: 'Walk to the venue, unwind in the old town.', w: { transport: 2, culture: 1.5, restaurant: 2, cafe: 2, coworking: 1, bar: 1 }, rhythm: 'early', rooms: ['workspace', 'quiet'], perks: ['wifi', 'breakfast', 'desk'], nights: 3 },
    { id: 'longstay', name: 'Long Stay', icon: 'calendar', line: 'Here for weeks: groceries, a gym and a favourite café matter.',
      hook: 'Live like a local, from market to morning run.', w: { market: 3, essentials: 3, sport: 2, coworking: 1, park: 1, cafe: 1 }, rhythm: 'normal', rooms: ['large', 'workspace', 'quiet'], perks: ['kettle', 'wifi', 'luggage'], nights: 4 }
  ];
  NS.persona = function (id) {
    for (var i = 0; i < NS.PERSONAS.length; i++) if (NS.PERSONAS[i].id === id) return NS.PERSONAS[i];
    return null;
  };

  /* ------------------------------------------------------------------ sections of a site, in their default order */
  NS.SECTIONS = [
    { id: 'hero', label: 'Opening', icon: 'home', note: 'The first screen: photo, video or a film made from your photos.' },
    { id: 'personas', label: 'Who is coming?', icon: 'users', note: 'Guests pick who they are; the site adapts to them.' },
    { id: 'story', label: 'Our story', icon: 'book', note: 'A few words from you, with a photo.' },
    { id: 'highlights', label: 'Why stay here', icon: 'star', note: 'Your best reasons, with numbers about the area.' },
    { id: 'rooms', label: 'Rooms', icon: 'bed', note: 'Every room with photos, size, beds, video and 360° tour.' },
    { id: 'walkthrough', label: '360° & tours', icon: 'cube', note: 'A 360° photo, a Matterport tour or a photo walk.' },
    { id: 'gallery', label: 'Gallery', icon: 'grid', note: 'Your photos in a modern layout.' },
    { id: 'stay', label: 'Your stay', icon: 'route', note: 'An hour-by-hour stay, written automatically for each kind of guest.' },
    { id: 'neighborhood', label: 'Neighbourhood', icon: 'map', note: 'A 3D map and everything nearby, in walking minutes.' },
    { id: 'film', label: 'Videos', icon: 'film', note: 'Your videos (uploads, YouTube or Vimeo).' },
    { id: 'dining', label: 'Dining', icon: 'fork', note: 'Your restaurant, bar or breakfast.' },
    { id: 'reviews', label: 'Guest reviews', icon: 'quote', note: 'Scores and words from your guests.' },
    { id: 'booking', label: 'Booking & payment', icon: 'card', note: 'How to book, when you pay, and the house rules.' },
    { id: 'faq', label: 'Questions', icon: 'info', note: 'Answers before guests have to ask.' },
    { id: 'contact', label: 'Contact & directions', icon: 'pin', note: 'Address, phone, email and how to get here.' }
  ];
  NS.ICONS.map = '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>';

  /* Booking channels and payment methods (named as text: no third-party logos). */
  NS.CHANNELS = {
    booking: { label: 'Booking.com', icon: 'calendar' }, hotels: { label: 'Hotels.com', icon: 'calendar' },
    expedia: { label: 'Expedia', icon: 'calendar' }, airbnb: { label: 'Airbnb', icon: 'home' },
    direct: { label: 'Book direct', icon: 'star' }, phone: { label: 'Call us', icon: 'phone' },
    email: { label: 'Email us', icon: 'mail' }, whatsapp: { label: 'WhatsApp', icon: 'chat' }, other: { label: 'Book online', icon: 'globe' }
  };
  NS.PAYMENTS = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express', maestro: 'Maestro', applepay: 'Apple Pay',
    googlepay: 'Google Pay', cash: 'Cash', transfer: 'Bank transfer', paypal: 'PayPal' };
})();

/* Part 1b: languages. A hotel site is written in English and can also be shown in Latvian, Russian, German and French.

     NS.LANGS            the languages a site can offer (code -> {name, short, locale})
     NS.lang             the language the page is drawn in now ('en' unless the guest or the page picked another)
     NS.t(s, vars)       the site's own words (buttons, headings, the automatic stay plan): s is the English text,
                         looked up in DICT below; {name} placeholders are filled from vars (plain text)
     NS.th(s, vars)      the same, HTML-escaped, with vars that are already HTML (for <b>…</b> inside a sentence)
     NS.tr(s)            the owner's own texts (story, rooms, FAQ…): their translation in data.i18n[lang][english],
                         else DICT (default kinds/titles), else the English as written
     NS.siteLangs(data)  ['en'] + the languages the owner switched on (data.langs)
     NS.setLang(code, data)
   Translations of the owner's texts are keyed by the English text itself, so a changed English sentence simply
   shows in English until it is translated again (no wrong, out-of-date translation). The editor's Languages tab
   (theme/assets/ns-editor.js) fills data.i18n.
   DICT: English -> [Latvian, Russian, German, French] (tools/i18n_dict.py checks that every row has all four, with the
   English key's {placeholders}; check.py runs it). French is neutral and Quebec-friendly: a no-break space before ':' and
   inside the guillemets, none before ! ? ;, 'courriel', 'stationnement', meals named without the dejeuner/diner clash.
   Place names are never declined: the sentences are built so a name
   can stand as it is ("Kafija: X", «X»). Add a line here for every new English string the renderer shows. */
(function () {
  'use strict';
  var NS = window.NSSite;
  NS.LANGS = {
    en: { name: 'English', short: 'EN', locale: 'en_GB' },
    lv: { name: 'Latviešu', short: 'LV', locale: 'lv_LV' },
    ru: { name: 'Русский', short: 'RU', locale: 'ru_RU' },
    de: { name: 'Deutsch', short: 'DE', locale: 'de_DE' },
    fr: { name: 'Français', short: 'FR', locale: 'fr_FR' }
  };
  NS.LANG_ORDER = ['en', 'lv', 'ru', 'de', 'fr'];
  NS.lang = 'en';
  var IDX = { lv: 0, ru: 1, de: 2, fr: 3 };
  var owner = {};   // data.i18n[NS.lang] of the site being drawn

  var DICT = {
    /* ---------------------------------------------------------------- frame */
    "Rooms": ["Numuri", "Номера", "Zimmer", "Chambres"],
    "Your stay": ["Jūsu brauciens", "Ваша поездка", "Ihr Aufenthalt", "Votre séjour"],
    "Neighbourhood": ["Apkārtne", "Окрестности", "Umgebung", "Quartier"],
    "Booking": ["Rezervācija", "Бронирование", "Buchung", "Réservation"],
    "Book": ["Rezervēt", "Забронировать", "Buchen", "Réserver"],
    "Menu": ["Izvēlne", "Меню", "Menü", "Menu"],
    "Contact": ["Kontakti", "Контакты", "Kontakt", "Contact"],
    "Language": ["Valoda", "Язык", "Sprache", "Langue"],
    "Show everything": ["Rādīt visu", "Показать всё", "Alles zeigen", "Tout afficher"],
    "Photo and data credits": ["Foto un datu avoti", "Источники фото и данных", "Foto- und Datenquellen", "Crédits photos et données"],
    "Website made with {platform}": ["Mājaslapa veidota ar {platform}", "Сайт создан в {platform}", "Website erstellt mit {platform}", "Site créé avec {platform}"],
    "Scroll down": ["Ritināt uz leju", "Прокрутить вниз", "Nach unten scrollen", "Défiler vers le bas"],
    "Hotel": ["Viesnīca", "Отель", "Hotel", "Hôtel"],
    "Your hotel": ["Jūsu viesnīca", "Ваш отель", "Ihr Hotel", "Votre hôtel"],
    "Close": ["Aizvērt", "Закрыть", "Schließen", "Fermer"],
    "Previous": ["Iepriekšējā", "Назад", "Zurück", "Précédent"],
    "Next": ["Nākamā", "Вперёд", "Weiter", "Suivant"],

    /* ---------------------------------------------------------------- hero + profiles */
    "Check availability": ["Pārbaudīt pieejamību", "Проверить наличие мест", "Verfügbarkeit prüfen", "Voir les disponibilités"],
    "Plan your stay": ["Plānot braucienu", "Спланировать поездку", "Aufenthalt planen", "Préparez votre séjour"],
    "For {who}:": ["Ja esat {who}:", "Если вы — {who}:", "Als {who}:", "Pour le profil « {who} » :"],
    "Made for you": ["Veidots jums", "Специально для вас", "Für Sie gemacht", "Pensé pour vous"],
    "Who is coming?": ["Kas brauc?", "Кто едет?", "Wer kommt?", "Qui sera du voyage?"],
    "Pick the traveller you are. The whole page rearranges itself: rooms, places, and a stay planned hour by hour.": [
      "Izvēlieties, kāds ceļotājs esat. Visa lapa pielāgojas jums: numuri, vietas un brauciens, saplānots pa stundām.",
      "Выберите, какой вы путешественник. Вся страница подстроится под вас: номера, места и поездка, расписанная по часам.",
      "Wählen Sie, welcher Reisetyp Sie sind. Die ganze Seite passt sich an: Zimmer, Orte und ein Aufenthalt, Stunde für Stunde geplant.", "Choisissez votre profil de voyage. Toute la page se réorganise : chambres, adresses et un séjour planifié heure par heure."],
    "Choose your kind of trip": ["Izvēlieties brauciena veidu", "Выберите тип поездки", "Wählen Sie Ihre Art zu reisen", "Choisissez votre type de voyage"],
    "Everyone": ["Visiem", "Для всех", "Alle", "Tout le monde"],
    "Show me everything": ["Parādiet man visu", "Покажите мне всё", "Alles anzeigen", "Montrez-moi tout"],
    "Showing the site for {who}.": ["Lapa parādīta: {who}.", "Сайт показан для: {who}.", "Die Seite für: {who}.", "Site adapté au profil {who}."],
    "See your stay": ["Skatīt jūsu braucienu", "Посмотреть вашу поездку", "Ihren Aufenthalt ansehen", "Voir votre séjour"],

    /* ---------------------------------------------------------------- sections */
    "Our story": ["Mūsu stāsts", "Наша история", "Unsere Geschichte", "Notre histoire"],
    "Welcome": ["Laipni lūdzam", "Добро пожаловать", "Willkommen", "Bienvenue"],
    "Why stay here": ["Kāpēc šeit", "Почему здесь", "Warum hier", "Pourquoi séjourner ici"],
    "The best address in the neighbourhood": ["Labākā adrese apkārtnē", "Лучший адрес в округе", "Die beste Adresse im Viertel", "La meilleure adresse du quartier"],
    "for you": ["jums", "для вас", "für Sie", "pour vous"],
    "Sleep well": ["Labu nakti", "Спокойной ночи", "Gut schlafen", "Dormez bien"],
    "Rooms are coming soon.": ["Numuri drīzumā būs redzami.", "Номера скоро появятся.", "Die Zimmer folgen in Kürze.", "Les chambres seront bientôt en ligne."],
    "{room} photo {n}": ["{room}, foto {n}", "{room}, фото {n}", "{room}, Foto {n}", "{room}, photo {n}"],
    "Previous photo": ["Iepriekšējā foto", "Предыдущее фото", "Vorheriges Foto", "Photo précédente"],
    "Next photo": ["Nākamā foto", "Следующее фото", "Nächstes Foto", "Photo suivante"],
    "Photos coming soon": ["Foto drīzumā", "Фото скоро", "Fotos folgen", "Photos à venir"],
    "Drawing of the room": ["Numura zīmējums", "Рисунок номера", "Zeichnung des Zimmers", "Dessin de la chambre"],
    "Up to {n}": ["Līdz {n}", "До {n}", "Bis {n}", "Jusqu'à {n}"],
    "{n} photos": ["{n} foto", "Фото: {n}", "{n} Fotos", "{n} photos"],
    "3D tour": ["3D tūre", "3D-тур", "3D-Rundgang", "Visite 3D"],
    "Video": ["Video", "Видео", "Video", "Vidéo"],
    "Perfect for you": ["Ideāli jums", "Идеально для вас", "Perfekt für Sie", "Idéal pour vous"],
    "from {price} / night": ["no {price} / nakts", "от {price} / ночь", "ab {price} / Nacht", "dès {price} / nuit"],
    "Check dates": ["Pārbaudīt datumus", "Проверить даты", "Termine prüfen", "Voir les dates"],
    "Tour {n}": ["Tūre {n}", "Тур {n}", "Rundgang {n}", "Visite {n}"],
    "Drag to look around": ["Velciet, lai paskatītos apkārt", "Потяните, чтобы осмотреться", "Ziehen, um sich umzusehen", "Faites glisser pour explorer"],
    "Full screen": ["Pilnekrāns", "Во весь экран", "Vollbild", "Plein écran"],
    "Virtual tour": ["Virtuālā tūre", "Виртуальный тур", "Virtueller Rundgang", "Visite virtuelle"],
    "Back": ["Atpakaļ", "Назад", "Zurück", "Retour"],
    "Walk on": ["Iet tālāk", "Идти дальше", "Weitergehen", "Continuer"],
    "Look around": ["Paskatieties apkārt", "Осмотритесь", "Schauen Sie sich um", "Faites le tour"],
    "Step inside": ["Ienāciet", "Заходите", "Treten Sie ein", "Poussez la porte"],
    "{room}: drag to look around.": ["{room}: velciet, lai paskatītos apkārt.", "{room}: потяните, чтобы осмотреться.", "{room}: ziehen, um sich umzusehen.", "{room} : faites glisser pour explorer."],
    "Gallery": ["Galerija", "Галерея", "Galerie", "Galerie"],
    "A closer look": ["Tuvāk", "Поближе", "Genauer hingesehen", "De plus près"],
    "Your stay, planned": ["Jūsu brauciens, saplānots", "Ваша поездка, уже спланирована", "Ihr Aufenthalt, geplant", "Votre séjour, tout planifié"],
    "Your stay, hour by hour": ["Jūsu brauciens pa stundām", "Ваша поездка по часам", "Ihr Aufenthalt, Stunde für Stunde", "Votre séjour, heure par heure"],
    "Written for the way you travel, from the places around us. Change the trip and watch it rewrite itself.": [
      "Uzrakstīts tieši jūsu ceļošanas veidam, no vietām mums apkārt. Mainiet braucienu, un plāns pārrakstīsies pats.",
      "Написано под ваш стиль путешествий, по местам вокруг нас. Измените поездку, и план перепишется сам.",
      "Geschrieben für Ihre Art zu reisen, aus den Orten rund um uns. Ändern Sie die Reise, und der Plan schreibt sich neu.", "Écrit selon votre façon de voyager, avec les adresses du quartier. Modifiez le voyage : le programme se réécrit sous vos yeux."],
    "Travelling as": ["Ceļoju kā", "Я путешествую как", "Ich reise als", "Votre profil"],
    "Nights": ["Naktis", "Ночей", "Nächte", "Nuits"],
    "Season": ["Sezona", "Сезон", "Jahreszeit", "Saison"],
    "Day {n}": ["{n}. diena", "День {n}", "Tag {n}", "Jour {n}"],
    "Show on map": ["Rādīt kartē", "Показать на карте", "Auf der Karte zeigen", "Voir sur la carte"],
    "Google Maps": ["Google Maps", "Google Карты", "Google Maps", "Google Maps"],
    "Walk this day on the map": ["Izstaigāt šo dienu kartē", "Пройти этот день по карте", "Diesen Tag auf der Karte ablaufen", "Parcourir cette journée sur la carte"],
    "Our pick for you: {room}": ["Mūsu izvēle jums: {room}", "Наш выбор для вас: {room}", "Unsere Wahl für Sie: {room}", "Notre choix pour vous : {room}"],
    "Book this stay": ["Rezervēt šo braucienu", "Забронировать эту поездку", "Diesen Aufenthalt buchen", "Réserver ce séjour"],
    "The neighbourhood": ["Apkārtne", "Окрестности", "Die Umgebung", "Le quartier"],
    "Everything is a short walk away": ["Viss ir pāris soļu attālumā", "Всё в нескольких шагах", "Alles ist nur ein paar Schritte entfernt", "Tout est à deux pas"],
    "Drag to turn · tap a pin for details": ["Velciet, lai pagrieztu · pieskarieties punktam", "Потяните, чтобы повернуть · нажмите на точку", "Ziehen zum Drehen · Punkt antippen für Details", "Glissez pour pivoter · touchez un repère pour plus de détails"],
    "All": ["Visi", "Все", "Alle", "Tous"],
    "No places in this filter yet.": ["Šajā filtrā vietu vēl nav.", "В этом фильтре пока нет мест.", "In diesem Filter gibt es noch keine Orte.", "Aucune adresse dans ce filtre pour l'instant."],
    "{n} min": ["{n} min", "{n} мин", "{n} Min.", "{n} min"],
    "min": ["min", "мин", "Min.", "min"],
    "Read more": ["Lasīt vairāk", "Читать дальше", "Mehr lesen", "En savoir plus"],
    "Watch": ["Skatieties", "Смотрите", "Ansehen", "En vidéo"],
    "See it for yourself": ["Pārliecinieties paši", "Убедитесь сами", "Überzeugen Sie sich selbst", "Voyez par vous-même"],
    "Video {n}": ["Video {n}", "Видео {n}", "Video {n}", "Vidéo {n}"],
    "Eat & drink": ["Ēst un dzert", "Еда и напитки", "Essen & Trinken", "Manger et boire"],
    "See the menu": ["Skatīt ēdienkarti", "Посмотреть меню", "Zur Speisekarte", "Voir le menu"],
    "Reserve a table": ["Rezervēt galdiņu", "Забронировать столик", "Tisch reservieren", "Réserver une table"],
    "Guests say": ["Viesi saka", "Гости говорят", "Gäste sagen", "Paroles de clients"],
    "Loved by our guests": ["Mūsu viesu iecienīta", "Любимый отель наших гостей", "Von unseren Gästen geliebt", "Ils ont adoré"],
    "{n} reviews": ["{n} atsauksmes", "Отзывов: {n}", "{n} Bewertungen", "{n} avis"],
    "A guest": ["Viesis", "Гость", "Ein Gast", "Un client"],
    "Book with confidence": ["Rezervējiet droši", "Бронируйте спокойно", "Sicher buchen", "Réservez en toute confiance"],
    "How booking and payment work": ["Kā notiek rezervācija un apmaksa", "Как работают бронирование и оплата", "So funktionieren Buchung und Bezahlung", "Comment réserver et payer"],
    "Choose your dates": ["Izvēlieties datumus", "Выберите даты", "Wählen Sie Ihre Daten", "Choisissez vos dates"],
    "Check prices and availability on the booking site you trust, or contact us directly.": [
      "Pārbaudiet cenas un brīvos numurus savā uzticamajā rezervāciju vietnē vai sazinieties ar mums tieši.",
      "Проверьте цены и наличие мест на привычном сайте бронирования или свяжитесь с нами напрямую.",
      "Prüfen Sie Preise und Verfügbarkeit auf der Buchungsseite Ihres Vertrauens oder kontaktieren Sie uns direkt.", "Consultez les prix et les disponibilités sur votre site de réservation préféré, ou contactez-nous directement."],
    "Pay the way you like": ["Maksājiet, kā jums ērtāk", "Оплачивайте как удобно", "Bezahlen Sie, wie Sie möchten", "Payez à votre façon"],
    "You pay when you book or at the hotel, depending on the rate you choose.": [
      "Jūs maksājat rezervējot vai viesnīcā, atkarībā no izvēlētā tarifa.",
      "Вы платите при бронировании или в отеле, в зависимости от выбранного тарифа.",
      "Sie bezahlen bei der Buchung oder im Hotel, je nach gewähltem Tarif.", "Vous payez à la réservation ou à l'hôtel, selon le tarif choisi."],
    "Arrive and relax": ["Ierodieties un atpūtieties", "Приезжайте и отдыхайте", "Ankommen und entspannen", "Arrivez et détendez-vous"],
    "Check-in from {in}, check-out until {out}. We will have your room ready.": [
      "Reģistrācija no {in}, izrakstīšanās līdz {out}. Jūsu numurs būs gatavs.",
      "Заезд с {in}, выезд до {out}. Ваш номер будет готов.",
      "Check-in ab {in}, Check-out bis {out}. Ihr Zimmer wartet auf Sie.", "Arrivée dès {in}, départ jusqu'à {out}. Votre chambre sera prête."],
    "Good to know": ["Noderīgi zināt", "Полезно знать", "Gut zu wissen", "Bon à savoir"],
    "Questions guests ask": ["Viesu jautājumi", "Вопросы гостей", "Fragen unserer Gäste", "Les questions de nos clients"],
    "Didn't find your answer?": ["Neatradāt atbildi?", "Не нашли ответ?", "Keine Antwort gefunden?", "Vous ne trouvez pas votre réponse?"],
    "Ask us": ["Jautājiet mums", "Спросите нас", "Fragen Sie uns", "Écrivez-nous"],
    "Find us": ["Kā mūs atrast", "Как нас найти", "So finden Sie uns", "Nous trouver"],
    "Getting here": ["Kā nokļūt", "Как добраться", "Anreise", "Comment venir"],
    "Directions": ["Maršruts", "Маршрут", "Route", "Itinéraire"],

    /* ---------------------------------------------------------------- the question form */
    "Ask us a question": ["Uzdodiet mums jautājumu", "Задайте нам вопрос", "Stellen Sie uns eine Frage", "Posez-nous une question"],
    "We usually answer within a day, by email.": ["Parasti atbildam dienas laikā, pa e-pastu.", "Обычно мы отвечаем в течение дня по электронной почте.", "Wir antworten meist innerhalb eines Tages per E-Mail.", "Nous répondons habituellement en moins de 24 heures, par courriel."],
    "Your name": ["Jūsu vārds", "Ваше имя", "Ihr Name", "Votre nom"],
    "Your email": ["Jūsu e-pasts", "Ваш e-mail", "Ihre E-Mail", "Votre courriel"],
    "Your question": ["Jūsu jautājums", "Ваш вопрос", "Ihre Frage", "Votre question"],
    "Send question": ["Sūtīt jautājumu", "Отправить вопрос", "Frage senden", "Envoyer la question"],
    "Sending…": ["Sūta…", "Отправка…", "Wird gesendet…", "Envoi en cours…"],
    "Thank you! {hotel} will answer you by email soon.": ["Paldies! {hotel} drīz jums atbildēs pa e-pastu.", "Спасибо! {hotel} скоро ответит вам по электронной почте.", "Danke! {hotel} antwortet Ihnen bald per E-Mail.", "Merci! {hotel} vous répondra bientôt par courriel."],
    "Ask another question": ["Uzdot vēl vienu jautājumu", "Задать ещё вопрос", "Noch eine Frage stellen", "Poser une autre question"],
    "Your message goes only to {hotel}, who use your email to reply.": [
      "Jūsu ziņa nonāk tikai pie {hotel}, un jūsu e-pasts tiek izmantots tikai atbildei.",
      "Ваше сообщение получит только {hotel}; ваш e-mail нужен лишь для ответа.",
      "Ihre Nachricht geht nur an {hotel}; Ihre E-Mail wird nur für die Antwort verwendet.", "{hotel} est le seul destinataire de votre message; votre courriel ne sert qu'à vous répondre."],
    "Please check your email address.": ["Lūdzu, pārbaudiet e-pasta adresi.", "Пожалуйста, проверьте адрес e-mail.", "Bitte prüfen Sie Ihre E-Mail-Adresse.", "Veuillez vérifier votre adresse courriel."],
    "Please write a little more.": ["Lūdzu, uzrakstiet nedaudz vairāk.", "Пожалуйста, напишите чуть подробнее.", "Bitte schreiben Sie etwas mehr.", "Veuillez en dire un peu plus."],
    "Too many questions right now. Please try again later, or email us.": [
      "Pašlaik pārāk daudz jautājumu. Lūdzu, mēģiniet vēlāk vai rakstiet mums e-pastu.",
      "Сейчас слишком много вопросов. Попробуйте позже или напишите нам на e-mail.",
      "Gerade sind es zu viele Fragen. Bitte versuchen Sie es später oder schreiben Sie uns eine E-Mail.", "Trop de questions en ce moment. Veuillez réessayer plus tard ou nous écrire par courriel."],
    "Sorry, the question could not be sent. Please email us instead.": [
      "Atvainojiet, jautājumu neizdevās nosūtīt. Lūdzu, rakstiet mums e-pastu.",
      "Извините, вопрос не удалось отправить. Пожалуйста, напишите нам на e-mail.",
      "Leider konnte die Frage nicht gesendet werden. Bitte schreiben Sie uns eine E-Mail.", "Désolés, la question n'a pas pu être envoyée. Écrivez-nous plutôt par courriel."],
    "The form works on the published site.": ["Forma darbojas publicētajā lapā.", "Форма работает на опубликованном сайте.", "Das Formular funktioniert auf der veröffentlichten Seite.", "Le formulaire fonctionne sur le site publié."],

    /* ---------------------------------------------------------------- the reception QR card (ns-app.js NSApp.qrCard) */
    "Scan to plan your stay": ["Skenējiet un plānojiet braucienu", "Отсканируйте и спланируйте поездку", "Scannen und Aufenthalt planen", "Scannez pour préparer votre séjour"],
    "Your stay hour by hour, the neighbourhood map, and a place to ask us anything.": [
      "Jūsu brauciens pa stundām, apkārtnes karte un vieta, kur uzdot mums jebkuru jautājumu.",
      "Ваша поездка по часам, карта окрестностей и место, где можно задать нам любой вопрос.",
      "Ihr Aufenthalt Stunde für Stunde, die Karte der Umgebung und ein Ort für all Ihre Fragen.", "Votre séjour heure par heure, la carte du quartier et un espace pour toutes vos questions."],

    /* ---------------------------------------------------------------- the date request form (booking section, booking.request.on) */
    "Ask us for your dates": [
      "Jautājiet mums cenu saviem datumiem",
      "Узнайте у нас цену на ваши даты",
      "Fragen Sie uns direkt nach Ihren Daten",
      "Demandez-nous un prix pour vos dates"],
    "Tell us when you would like to come. We email you our best direct price, usually within a day.": [
      "Pastāstiet, kad vēlaties ierasties. Mēs atsūtīsim jums savu labāko tiešo cenu pa e-pastu, parasti dienas laikā.",
      "Напишите, когда хотите приехать. Мы пришлём вам нашу лучшую прямую цену по электронной почте, обычно в течение дня.",
      "Sagen Sie uns, wann Sie kommen möchten. Wir schicken Ihnen unseren besten Direktpreis per E-Mail, meist innerhalb eines Tages.",
      "Dites-nous quand vous aimeriez venir. Nous vous envoyons notre meilleur prix direct par courriel, en général dans la journée."],
    "Adults": ["Pieaugušie", "Взрослые", "Erwachsene", "Adultes"],
    "Children": ["Bērni", "Дети", "Kinder", "Enfants"],
    "Room": ["Numurs", "Номер", "Zimmer", "Chambre"],
    "Any room": ["Jebkurš numurs", "Любой номер", "Beliebiges Zimmer", "Peu importe la chambre"],
    "Phone (optional)": ["Tālrunis (nav obligāts)", "Телефон (необязательно)", "Telefon (optional)", "Téléphone (facultatif)"],
    "Anything we should know? (optional)": [
      "Kas mums būtu jāzina? (nav obligāti)",
      "Что нам стоит знать? (необязательно)",
      "Gibt es etwas, das wir wissen sollten? (optional)",
      "Quelque chose à nous dire? (facultatif)"],
    "Ask for a price": ["Pajautāt cenu", "Узнать цену", "Preis anfragen", "Demander un prix"],
    "Not a booking yet: you decide once you have our offer.": [
      "Tā vēl nav rezervācija: jūs izlemjat, kad esat saņēmis mūsu piedāvājumu.",
      "Это ещё не бронирование: вы решите, когда получите наше предложение.",
      "Noch keine Buchung: Sie entscheiden, wenn Sie unser Angebot haben.",
      "Ce n'est pas encore une réservation : vous décidez une fois notre offre reçue."],
    "Please check your dates.": ["Lūdzu, pārbaudiet datumus.", "Пожалуйста, проверьте даты.", "Bitte prüfen Sie Ihre Daten.", "Veuillez vérifier vos dates."],
    "Please tell us your name.": [
      "Lūdzu, norādiet savu vārdu.",
      "Пожалуйста, укажите ваше имя.",
      "Bitte nennen Sie uns Ihren Namen.",
      "Veuillez nous indiquer votre nom."],
    "Thank you!": ["Paldies!", "Спасибо!", "Danke!", "Merci!"],
    "{hotel} will email you a price for your dates soon.": [
      "{hotel} drīz atsūtīs jums cenu jūsu datumiem pa e-pastu.",
      "{hotel} скоро пришлёт вам цену на ваши даты по электронной почте.",
      "{hotel} schickt Ihnen bald einen Preis für Ihre Daten per E-Mail.",
      "{hotel} vous enverra bientôt un prix pour vos dates par courriel."],
    "Ask about other dates": ["Jautāt par citiem datumiem", "Спросить о других датах", "Nach anderen Daten fragen", "Demander d'autres dates"],
    "Ask us directly": ["Jautājiet tieši mums", "Спросите нас напрямую", "Direkt bei uns anfragen", "Demandez-nous directement"],
    "Sorry, the request could not be sent. Please email us instead.": [
      "Diemžēl pieprasījumu neizdevās nosūtīt. Lūdzu, rakstiet mums e-pastu.",
      "К сожалению, запрос не удалось отправить. Пожалуйста, напишите нам по электронной почте.",
      "Leider konnte die Anfrage nicht gesendet werden. Bitte schreiben Sie uns eine E-Mail.",
      "Désolés, la demande n'a pas pu être envoyée. Écrivez-nous plutôt par courriel."],
    "Too many requests right now. Please try again later, or email us.": [
      "Šobrīd ir pārāk daudz pieprasījumu. Lūdzu, mēģiniet vēlāk vai rakstiet mums e-pastu.",
      "Сейчас слишком много запросов. Попробуйте позже или напишите нам по электронной почте.",
      "Gerade gibt es zu viele Anfragen. Bitte versuchen Sie es später oder schreiben Sie uns eine E-Mail.",
      "Trop de demandes en ce moment. Réessayez plus tard ou écrivez-nous par courriel."],
    "This form is closed right now. Please email us instead.": [
      "Šī forma pašlaik ir slēgta. Lūdzu, rakstiet mums e-pastu.",
      "Эта форма сейчас закрыта. Пожалуйста, напишите нам по электронной почте.",
      "Dieses Formular ist gerade geschlossen. Bitte schreiben Sie uns eine E-Mail.",
      "Ce formulaire est fermé pour l'instant. Écrivez-nous plutôt par courriel."],
    "Come-back code: {code}": ["Atgriešanās kods: {code}", "Код возвращения: {code}", "Rückkehr-Code: {code}", "Code de retour : {code}"],

    /* ---------------------------------------------------------------- the thank-you sheet (#thanks, from the check-out QR card) */
    "Thank you for staying with us": [
      "Paldies, ka palikāt pie mums",
      "Спасибо, что остановились у нас",
      "Danke, dass Sie bei uns waren",
      "Merci d'avoir séjourné chez nous"],
    "Tell others about your stay": [
      "Pastāstiet citiem par savu viesošanos",
      "Расскажите другим о своём пребывании",
      "Erzählen Sie anderen von Ihrem Aufenthalt",
      "Racontez votre séjour aux autres voyageurs"],
    "A few words on any of these sites helps a small hotel more than you think.": [
      "Daži vārdi kādā no šīm vietnēm mazai viesnīcai palīdz vairāk, nekā domājat.",
      "Пара слов на любом из этих сайтов помогает маленькому отелю больше, чем кажется.",
      "Ein paar Worte auf einer dieser Seiten helfen einem kleinen Hotel mehr, als Sie denken.",
      "Quelques mots sur l'un de ces sites aident un petit hôtel plus que vous ne le pensez."],
    "Tell us privately": ["Pastāstiet mums privāti", "Напишите нам лично", "Sagen Sie es uns persönlich", "Dites-le-nous en privé"],
    "Something we could do better, or a thank-you just for us? Only {hotel} reads it.": [
      "Kaut kas, ko varam darīt labāk, vai paldies tikai mums? To lasīs tikai {hotel}.",
      "Что-то, что мы могли бы сделать лучше, или благодарность только для нас? Это прочитает только {hotel}.",
      "Etwas, das wir besser machen könnten, oder ein Dank nur für uns? Das liest nur {hotel}.",
      "Une chose à améliorer, ou un merci rien que pour nous? Votre message ira seulement à {hotel}."],
    "Write to us": ["Rakstiet mums", "Написать нам", "Schreiben Sie uns", "Écrivez-nous"],
    "Come back direct": ["Atgriezieties, rezervējot tieši", "Возвращайтесь, бронируя напрямую", "Kommen Sie direkt wieder", "Revenez en réservant en direct"],
    "Your code": ["Jūsu kods", "Ваш код", "Ihr Code", "Votre code"],
    "Copy": ["Kopēt", "Копировать", "Kopieren", "Copier"],
    "Copied": ["Nokopēts", "Скопировано", "Kopiert", "Copié"],
    "Ask for your dates": ["Jautāt par saviem datumiem", "Спросить о своих датах", "Nach Ihren Daten fragen", "Demander vos dates"],

    /* ---------------------------------------------------------------- the owner's offer email (Items/QuestionRow: written in the guest's language with NSSite.tIn) */
    "Hello {name},": ["Labdien, {name}!", "Здравствуйте, {name}!", "Hallo {name},", "Bonjour {name},"],
    "Thank you for asking us directly. For your dates we can offer:": [
      "Paldies, ka jautājāt tieši mums. Jūsu datumiem varam piedāvāt:",
      "Спасибо, что обратились к нам напрямую. На ваши даты мы можем предложить:",
      "Danke, dass Sie direkt bei uns anfragen. Für Ihre Daten können wir Ihnen anbieten:",
      "Merci de nous avoir écrit directement. Pour vos dates, nous pouvons vous proposer :"],
    "__ {cur} a night, __ {cur} in total.": [
      "__ {cur} par nakti, kopā __ {cur}.",
      "__ {cur} за ночь, всего __ {cur}.",
      "__ {cur} pro Nacht, insgesamt __ {cur}.",
      "__ {cur} la nuit, __ {cur} au total."],
    "Reply to this email to confirm, and we will hold the room for you for 48 hours.": [
      "Atbildiet uz šo e-pastu, lai apstiprinātu, un mēs turēsim numuru jums 48 stundas.",
      "Ответьте на это письмо, чтобы подтвердить, и мы придержим для вас номер на 48 часов.",
      "Antworten Sie auf diese E-Mail, um zu bestätigen, und wir halten das Zimmer 48 Stunden für Sie frei.",
      "Répondez à ce courriel pour confirmer, et nous vous gardons la chambre pendant 48 heures."],
    "Best wishes,": ["Ar cieņu,", "С наилучшими пожеланиями,", "Viele Grüße", "Au plaisir de vous accueillir,"],

    /* ---------------------------------------------------------------- widgets */
    "This 360° photo could not be loaded.": ["Šo 360° foto neizdevās ielādēt.", "Не удалось загрузить фото 360°.", "Dieses 360°-Foto konnte nicht geladen werden.", "Impossible de charger cette photo 360°."],
    "Open in Google Maps": ["Atvērt Google Maps", "Открыть в Google Картах", "In Google Maps öffnen", "Ouvrir dans Google Maps"],
    "Map of places around the hotel": ["Vietu karte ap viesnīcu", "Карта мест вокруг отеля", "Karte der Orte rund um das Hotel", "Carte des lieux autour de l'hôtel"],
    "Illustrated map: directions are true, distances are walking minutes.": [
      "Zīmēta karte: virzieni ir precīzi, attālumi ir minūtes kājām.",
      "Рисованная карта: направления точные, расстояния в минутах пешком.",
      "Gezeichnete Karte: Richtungen stimmen, Entfernungen sind Gehminuten.", "Carte illustrée : les directions sont exactes, les distances sont en minutes de marche."],
    "Hotel video": ["Viesnīcas video", "Видео отеля", "Hotelvideo", "Vidéo de l'hôtel"],
    "Room video": ["Numura video", "Видео номера", "Zimmervideo", "Vidéo de la chambre"],

    /* ---------------------------------------------------------------- walking, seasons, numbers */
    "1 min walk": ["1 min kājām", "1 мин пешком", "1 Min. zu Fuß", "1 min à pied"],
    "{n} min walk": ["{n} min kājām", "{n} мин пешком", "{n} Min. zu Fuß", "{n} min à pied"],
    "{n} min by tram or taxi": ["{n} min ar tramvaju vai taksi", "{n} мин на трамвае или такси", "{n} Min. mit Tram oder Taxi", "{n} min en tram ou en taxi"],
    "Winter": ["Ziema", "Зима", "Winter", "Hiver"],
    "Spring": ["Pavasaris", "Весна", "Frühling", "Printemps"],
    "Summer": ["Vasara", "Лето", "Sommer", "Été"],
    "Autumn": ["Rudens", "Осень", "Herbst", "Automne"],
    "on foot to {place}": ["kājām līdz {place}", "пешком до «{place}»", "zu Fuß zu {place}", "à pied : {place}"],
    "{things} within 10 minutes": ["{things} 10 minūšu attālumā", "{things} в 10 минутах", "{things} in 10 Minuten", "{things} à moins de 10 minutes"],
    "to {place}": ["līdz {place}", "до «{place}»", "zu {place}", "direction {place}"],
    "places within 15 minutes on foot": ["vietas 15 minūšu gājienā", "мест в 15 минутах пешком", "Orte in 15 Minuten zu Fuß", "lieux à moins de 15 minutes à pied"],

    /* ---------------------------------------------------------------- place kinds: label, plural */
    "Sight": ["Apskates vieta", "Достопримечательность", "Sehenswürdigkeit", "À voir"],
    "sights": ["apskates vietas", "достопримечательности", "Sehenswürdigkeiten", "lieux à voir"],
    "Museum": ["Muzejs", "Музей", "Museum", "Musée"],
    "museums": ["muzeji", "музеи", "Museen", "musées"],
    "galleries": ["galerijas", "галереи", "Galerien", "galeries d'art"],
    "Church": ["Baznīca", "Церковь", "Kirche", "Église"],
    "churches": ["baznīcas", "церкви", "Kirchen", "églises"],
    "Stage & screen": ["Skatuve un kino", "Сцена и кино", "Bühne & Kino", "Spectacles & cinéma"],
    "theatres & concert halls": ["teātri un koncertzāles", "театры и концертные залы", "Theater & Konzertsäle", "théâtres & salles de concert"],
    "Café": ["Kafejnīca", "Кафе", "Café", "Café"],
    "cafés": ["kafejnīcas", "кафе", "Cafés", "cafés"],
    "Restaurant": ["Restorāns", "Ресторан", "Restaurant", "Restaurant"],
    "restaurants": ["restorāni", "рестораны", "Restaurants", "restaurants"],
    "Bar": ["Bārs", "Бар", "Bar", "Bar"],
    "bars & pubs": ["bāri un krodziņi", "бары и пабы", "Bars & Kneipen", "bars & pubs"],
    "Nightlife": ["Naktsdzīve", "Ночная жизнь", "Nachtleben", "Vie nocturne"],
    "clubs & late venues": ["klubi un vēlās vietas", "клубы и ночные заведения", "Clubs & Nachtlokale", "clubs & adresses de nuit"],
    "Park": ["Parks", "Парк", "Park", "Parc"],
    "parks & gardens": ["parki un dārzi", "парки и сады", "Parks & Gärten", "parcs & jardins"],
    "Shop": ["Veikals", "Магазин", "Geschäft", "Boutique"],
    "shops & boutiques": ["veikali un butiki", "магазины и бутики", "Geschäfte & Boutiquen", "magasins & boutiques"],
    "Market & food shop": ["Tirgus un pārtika", "Рынок и продукты", "Markt & Feinkost", "Marché & épicerie"],
    "markets & food shops": ["tirgi un pārtikas veikali", "рынки и продуктовые лавки", "Märkte & Feinkostläden", "marchés & épiceries"],
    "Wellness": ["Labsajūta", "Велнес", "Wellness", "Bien-être"],
    "spas & wellness": ["spa un labsajūta", "спа и велнес", "Spas & Wellness", "spas & bien-être"],
    "Sport": ["Sports", "Спорт", "Sport", "Sport"],
    "gyms & sport": ["sporta zāles un sports", "спортзалы и спорт", "Fitness & Sport", "lieux sportifs"],
    "For kids": ["Bērniem", "Для детей", "Für Kinder", "Pour les enfants"],
    "places for kids": ["vietas bērniem", "места для детей", "Orte für Kinder", "lieux pour enfants"],
    "Coworking": ["Kopstrādes telpa", "Коворкинг", "Coworking", "Coworking"],
    "coworking spaces": ["kopstrādes telpas", "коворкинги", "Coworking-Spaces", "espaces de coworking"],
    "Transport": ["Transports", "Транспорт", "Verkehr", "Transports"],
    "stations & stops": ["stacijas un pieturas", "вокзалы и остановки", "Bahnhöfe & Haltestellen", "gares & arrêts"],
    "Essentials": ["Ikdienas lietas", "Самое нужное", "Das Nötigste", "Essentiels"],
    "pharmacies & ATMs": ["aptiekas un bankomāti", "аптеки и банкоматы", "Apotheken & Geldautomaten", "pharmacies & guichets automatiques"],

    /* place verbs ({n} = the place's name, never declined) */
    "See {n}": ["Apskatiet: {n}", "Посмотрите «{n}»", "Sehen Sie {n}", "Admirer {n}"],
    "Stand in front of {n}": ["Pastāviet pie: {n}", "Постойте у «{n}»", "Stehen Sie vor {n}", "Halte devant {n}"],
    "Wander over to {n}": ["Aizklīstiet līdz: {n}", "Прогуляйтесь до «{n}»", "Schlendern Sie zu {n}", "Flâner vers {n}"],
    "Explore {n}": ["Izpētiet: {n}", "Исследуйте «{n}»", "Entdecken Sie {n}", "Explorer {n}"],
    "An hour or two at {n}": ["Stunda vai divas: {n}", "Час-другой в «{n}»", "Ein, zwei Stunden in {n}", "Une heure ou deux à {n}"],
    "Step into {n}": ["Ieejiet: {n}", "Загляните в «{n}»", "Treten Sie ein: {n}", "Un détour par {n}"],
    "Browse {n}": ["Paraugieties: {n}", "Загляните в «{n}»", "Stöbern Sie in {n}", "Fureter dans {n}"],
    "Look in at {n}": ["Ieskatieties: {n}", "Зайдите в «{n}»", "Schauen Sie vorbei: {n}", "Passer voir {n}"],
    "Visit {n}": ["Apmeklējiet: {n}", "Посетите «{n}»", "Besuchen Sie {n}", "Visiter {n}"],
    "Quiet moment at {n}": ["Kluss brīdis: {n}", "Тихая минута в «{n}»", "Ein stiller Moment: {n}", "Un moment de calme dans {n}"],
    "Climb or look up at {n}": ["Uzkāpiet vai paskatieties augšup: {n}", "Поднимитесь или полюбуйтесь: «{n}»", "Hinaufsteigen oder hinaufschauen: {n}", "Gravir ou admirer {n}"],
    "A performance at {n}": ["Izrāde: {n}", "Спектакль в «{n}»", "Eine Vorstellung: {n}", "Un spectacle à {n}"],
    "Tickets for {n}": ["Biļetes: {n}", "Билеты в «{n}»", "Karten für {n}", "Des billets pour {n}"],
    "Coffee at {n}": ["Kafija: {n}", "Кофе в «{n}»", "Kaffee bei {n}", "Un café chez {n}"],
    "Slow coffee at {n}": ["Nesteidzīga kafija: {n}", "Неспешный кофе в «{n}»", "Kaffee in Ruhe bei {n}", "Café tranquille chez {n}"],
    "Cake and coffee at {n}": ["Kūka un kafija: {n}", "Кофе с пирожным в «{n}»", "Kaffee und Kuchen bei {n}", "Café et gâteau chez {n}"],
    "Eat at {n}": ["Paēdiet: {n}", "Поешьте в «{n}»", "Essen bei {n}", "À table chez {n}"],
    "A table at {n}": ["Galdiņš: {n}", "Столик в «{n}»", "Ein Tisch bei {n}", "Une table chez {n}"],
    "Dinner at {n}": ["Vakariņas: {n}", "Ужин в «{n}»", "Abendessen bei {n}", "Repas du soir chez {n}"],
    "Drinks at {n}": ["Dzērieni: {n}", "Напитки в «{n}»", "Drinks bei {n}", "Un verre chez {n}"],
    "A glass at {n}": ["Glāze: {n}", "Бокал в «{n}»", "Ein Glas bei {n}", "Trinquer chez {n}"],
    "Nightcap at {n}": ["Pēdējā glāze: {n}", "Последний бокал в «{n}»", "Absacker bei {n}", "Dernier verre chez {n}"],
    "Dance at {n}": ["Dejas: {n}", "Танцы в «{n}»", "Tanzen bei {n}", "Danser chez {n}"],
    "Late night at {n}": ["Vēls vakars: {n}", "Поздний вечер в «{n}»", "Späte Stunden bei {n}", "Fin de soirée chez {n}"],
    "Stroll through {n}": ["Pastaiga: {n}", "Прогулка по «{n}»", "Spaziergang durch {n}", "Balade dans {n}"],
    "Fresh air in {n}": ["Svaigs gaiss: {n}", "Свежий воздух в «{n}»", "Frische Luft: {n}", "Prendre l'air dans {n}"],
    "A bench in {n}": ["Soliņš: {n}", "Скамейка в «{n}»", "Eine Bank in {n}", "Un banc dans {n}"],
    "Shopping at {n}": ["Iepirkšanās: {n}", "Покупки в «{n}»", "Einkaufen bei {n}", "Emplettes chez {n}"],
    "Pick up treats at {n}": ["Gardumi līdzi: {n}", "Вкусности в «{n}»", "Leckereien holen bei {n}", "Des gourmandises chez {n}"],
    "Wander {n}": ["Izstaigājiet: {n}", "Побродите по «{n}»", "Bummeln Sie über {n}", "Arpenter {n}"],
    "Unwind at {n}": ["Atpūta: {n}", "Расслабьтесь в «{n}»", "Entspannen bei {n}", "Détente chez {n}"],
    "Treat yourself at {n}": ["Palutiniet sevi: {n}", "Побалуйте себя в «{n}»", "Gönnen Sie sich etwas: {n}", "Se faire dorloter chez {n}"],
    "Work out at {n}": ["Treniņš: {n}", "Тренировка в «{n}»", "Training bei {n}", "Entraînement chez {n}"],
    "Swim or train at {n}": ["Peldēšana vai treniņš: {n}", "Плавание или тренировка в «{n}»", "Schwimmen oder trainieren: {n}", "Nager ou s'entraîner à {n}"],
    "Let the kids loose at {n}": ["Ļaujiet bērniem izskrieties: {n}", "Дайте детям порезвиться в «{n}»", "Kinder toben lassen: {n}", "Les enfants se défoulent à {n}"],
    "Family time at {n}": ["Ģimenes laiks: {n}", "Время всей семьёй в «{n}»", "Familienzeit: {n}", "En famille à {n}"],
    "Work a few hours at {n}": ["Dažas darba stundas: {n}", "Пара рабочих часов в «{n}»", "Ein paar Stunden arbeiten: {n}", "Travailler un peu chez {n}"],
    "Head to {n}": ["Dodieties uz: {n}", "Направляйтесь к «{n}»", "Weiter zu {n}", "Direction {n}"],
    "Pop into {n}": ["Ieskrieniet: {n}", "Загляните в «{n}»", "Kurz rein: {n}", "Un saut chez {n}"],

    /* ---------------------------------------------------------------- describing a place */
    "A café": ["Kafejnīca", "Кафе", "Ein Café", "Un café"],
    "A restaurant": ["Restorāns", "Ресторан", "Ein Restaurant", "Un restaurant"],
    "A bar": ["Bārs", "Бар", "Eine Bar", "Un bar"],
    "A late-night venue": ["Vieta vēlām stundām", "Ночное заведение", "Ein Ort für die späten Stunden", "Un lieu ouvert tard le soir"],
    "A museum": ["Muzejs", "Музей", "Ein Museum", "Un musée"],
    "A gallery": ["Galerija", "Галерея", "Eine Galerie", "Une galerie d'art"],
    "A local landmark": ["Vietējā apskates vieta", "Местная достопримечательность", "Ein Wahrzeichen der Gegend", "Un incontournable du quartier"],
    "A historic church": ["Vēsturiska baznīca", "Историческая церковь", "Eine historische Kirche", "Une église historique"],
    "A green space": ["Zaļā zona", "Зелёный уголок", "Eine grüne Oase", "Un espace vert"],
    "A shop": ["Veikals", "Магазин", "Ein Geschäft", "Une boutique"],
    "A food shop": ["Pārtikas veikals", "Продуктовая лавка", "Ein Lebensmittelladen", "Une épicerie"],
    "A place to unwind": ["Vieta atpūtai", "Место, чтобы расслабиться", "Ein Ort zum Entspannen", "Un lieu pour se détendre"],
    "A place to train": ["Vieta treniņiem", "Место для тренировок", "Ein Ort zum Trainieren", "Un lieu pour s'entraîner"],
    "Fun for children": ["Prieks bērniem", "Радость для детей", "Spaß für Kinder", "Pour le plaisir des enfants"],
    "A coworking space": ["Kopstrādes telpa", "Коворкинг", "Ein Coworking-Space", "Un espace de coworking"],
    "Transport link": ["Transporta mezgls", "Транспорт", "Verkehrsanbindung", "Accès aux transports"],
    "Everyday essentials": ["Ikdienas vajadzībām", "Всё необходимое", "Alles für den Alltag", "L'essentiel du quotidien"],
    "A stage for music and theatre": ["Skatuve mūzikai un teātrim", "Сцена для музыки и театра", "Eine Bühne für Musik und Theater", "Une scène pour la musique et le théâtre"],
    "Our tip: {note}": ["Mūsu padoms: {note}", "Наш совет: {note}", "Unser Tipp: {note}", "Notre conseil : {note}"],
    "Plant-based dishes too.": ["Ir arī augu ēdieni.", "Есть и растительные блюда.", "Auch pflanzliche Gerichte.", "Options végétales aussi."],

    /* ---------------------------------------------------------------- the stay plan */
    "the hotel": ["viesnīca", "отель", "das Hotel", "l'hôtel"],
    "Wrap up warm: the old town glows in the snow.": ["Saģērbieties silti: vecpilsēta mirdz sniegā.", "Одевайтесь теплее: старый город сияет в снегу.", "Ziehen Sie sich warm an: Die Altstadt leuchtet im Schnee.", "Couvrez-vous bien : la vieille ville scintille sous la neige."],
    "Evenings stay light until late, so take your time.": ["Vakari ilgi paliek gaiši, tāpēc nesteidzieties.", "Вечера светлые до поздна, так что не спешите.", "Die Abende bleiben lange hell, lassen Sie sich Zeit.", "Le soleil se couche tard, alors prenez votre temps."],
    "Café terraces start opening in spring.": ["Pavasarī atveras kafejnīcu terases.", "Весной открываются летние террасы кафе.", "Im Frühling öffnen die Café-Terrassen.", "Les terrasses des cafés ouvrent au printemps."],
    "Golden trees and fewer crowds.": ["Zelta koki un mazāk ļaužu.", "Золотые деревья и меньше туристов.", "Goldene Bäume und weniger Trubel.", "Arbres dorés et moins de foule."],
    "Breakfast at {hotel}": ["Brokastis: {hotel}", "Завтрак в «{hotel}»", "Frühstück im {hotel}", "Petit-déjeuner à {hotel}"],
    "Breakfast is included and served downstairs.": ["Brokastis ir iekļautas un tiek pasniegtas lejā.", "Завтрак включён и подаётся внизу.", "Das Frühstück ist inbegriffen und wird unten serviert.", "Le petit-déjeuner est inclus et servi en bas."],
    "A good start to the day.": ["Labs dienas sākums.", "Хорошее начало дня.", "Ein guter Start in den Tag.", "Pour bien commencer la journée."],
    "Breakfast nearby": ["Brokastis tuvumā", "Завтрак рядом", "Frühstück in der Nähe", "Petit-déjeuner tout près"],
    "Ask at the desk for our favourite breakfast spot.": ["Pajautājiet reģistratūrā par mūsu iecienītāko brokastu vietu.", "Спросите на ресепшене о нашем любимом месте для завтрака.", "Fragen Sie an der Rezeption nach unserem Lieblingsort fürs Frühstück.", "Demandez à la réception notre adresse préférée."],
    "Wander the neighbourhood": ["Izstaigājiet apkārtni", "Прогуляйтесь по округе", "Streifzug durchs Viertel", "Flâner dans le quartier"],
    "Pick a street you have not walked yet. Everything here is close.": ["Izvēlieties ielu, pa kuru vēl neesat gājuši. Šeit viss ir tuvu.", "Выберите улицу, по которой ещё не гуляли. Здесь всё рядом.", "Nehmen Sie eine Straße, die Sie noch nicht kennen. Hier ist alles nah.", "Choisissez une rue encore inconnue. Ici, tout est à deux pas."],
    "Ask us for a table nearby. We know the good ones.": ["Pajautājiet mums par galdiņu tuvumā. Mēs zinām labās vietas.", "Спросите нас о столике поблизости. Мы знаем хорошие места.", "Fragen Sie uns nach einem Tisch in der Nähe. Wir kennen die guten Adressen.", "Demandez-nous une table tout près. Nous connaissons les bonnes adresses."],
    "Lunch": ["Pusdienas", "Обед", "Mittagessen", "Repas du midi"],
    "Dinner": ["Vakariņas", "Ужин", "Abendessen", "Repas du soir"],
    "Pick up lunch at {place}": ["Pusdienas līdzi: {place}", "Обед с собой в «{place}»", "Mittagessen holen bei {place}", "Le midi, à emporter chez {place}"],
    "Lunch at {place}": ["Pusdienas: {place}", "Обед в «{place}»", "Mittagessen bei {place}", "Repas du midi chez {place}"],
    "Dinner at {place}": ["Vakariņas: {place}", "Ужин в «{place}»", "Abendessen bei {place}", "Repas du soir chez {place}"],
    "Late night at {place}": ["Vēls vakars: {place}", "Поздний вечер в «{place}»", "Späte Stunden bei {place}", "Fin de soirée chez {place}"],
    "Nightcap at {place}": ["Pēdējā glāze: {place}", "Последний бокал в «{place}»", "Absacker bei {place}", "Dernier verre chez {place}"],
    "Drinks at {place}": ["Dzērieni: {place}", "Напитки в «{place}»", "Drinks bei {place}", "Un verre chez {place}"],
    "Back by the fireplace": ["Atpakaļ pie kamīna", "Обратно к камину", "Zurück am Kamin", "Retour au coin du feu"],
    "End the day with a book by the lobby fire.": ["Noslēdziet dienu ar grāmatu pie kamīna vestibilā.", "Завершите день с книгой у камина в лобби.", "Beenden Sie den Tag mit einem Buch am Kamin in der Lobby.", "Finissez la journée un livre à la main, près du feu dans le hall."],
    "Beautiful after dark, too.": ["Skaisti arī pēc tumsas iestāšanās.", "Красиво и после заката.", "Auch nach Einbruch der Dunkelheit schön.", "Superbe aussi à la nuit tombée."],
    "An early night": ["Agri gulēt", "Ранний отбой", "Früh schlafen", "Au lit de bonne heure"],
    "Sleep well: tomorrow there is more to see.": ["Guliet saldi: rīt būs vēl ko redzēt.", "Спокойной ночи: завтра будет ещё что посмотреть.", "Schlafen Sie gut: Morgen gibt es noch mehr zu sehen.", "Dormez bien : demain, il y a encore tant à voir."],
    "Check in at {hotel}": ["Reģistrācija: {hotel}", "Заселение в «{hotel}»", "Check-in im {hotel}", "Installation à {hotel}"],
    "Drop your bags, freshen up and pick up a map at the desk.": ["Atstājiet somas, atsvaidzinieties un paņemiet karti reģistratūrā.", "Оставьте сумки, освежитесь и возьмите карту на ресепшене.", "Taschen abstellen, frisch machen und an der Rezeption eine Karte mitnehmen.", "Posez vos valises, rafraîchissez-vous et prenez une carte à la réception."],
    "First walk: {what}": ["Pirmā pastaiga: {what}", "Первая прогулка: {what}", "Erster Spaziergang: {what}", "Première sortie : {what}"],
    "To start the trip.": ["Brauciena sākumam.", "Для начала поездки.", "Zum Auftakt der Reise.", "Pour bien lancer le séjour."],
    "An aperitif at {place}": ["Aperitīvs: {place}", "Аперитив в «{place}»", "Ein Aperitif bei {place}", "Un apéritif chez {place}"],
    "Dinner downstairs at {place}": ["Vakariņas lejā: {place}", "Ужин внизу, в «{place}»", "Abendessen unten im {place}", "À table en bas, chez {place}"],
    "No need to go far on your first night.": ["Pirmajā vakarā nav jāiet tālu.", "В первый вечер не нужно далеко идти.", "Am ersten Abend müssen Sie nicht weit gehen.", "Inutile d'aller loin le premier soir."],
    "Arrival": ["Ierašanās", "Приезд", "Anreise", "Arrivée"],
    "Before breakfast, while the streets are quiet.": ["Pirms brokastīm, kamēr ielas ir klusas.", "До завтрака, пока улицы тихие.", "Vor dem Frühstück, solange die Straßen ruhig sind.", "Avant le petit-déjeuner, quand les rues sont calmes."],
    "Fast Wi-Fi and good coffee.": ["Ātrs Wi-Fi un laba kafija.", "Быстрый Wi-Fi и хороший кофе.", "Schnelles WLAN und guter Kaffee.", "Wi-Fi rapide et bon café."],
    "Warm up for a while.": ["Mazliet sasildieties.", "Немного согрейтесь.", "Wärmen Sie sich ein wenig auf.", "Le temps de vous réchauffer."],
    "Check what is on tonight: most performances start around 19:00.": ["Paskatieties, kas šovakar notiek: lielākā daļa izrāžu sākas ap 19:00.", "Посмотрите, что идёт сегодня: большинство спектаклей начинается около 19:00.", "Schauen Sie, was heute läuft: Die meisten Vorstellungen beginnen gegen 19:00.", "Consultez le programme du soir : la plupart des spectacles commencent vers 19 h."],
    "An evening performance at {place}": ["Vakara izrāde: {place}", "Вечерний спектакль в «{place}»", "Eine Abendvorstellung: {place}", "Soirée spectacle : {place}"],
    "A late supper after the show.": ["Vēlas vakariņas pēc izrādes.", "Поздний ужин после спектакля.", "Ein spätes Essen nach der Vorstellung.", "Un repas tardif après le spectacle."],
    "Late supper at {place}": ["Vēlas vakariņas: {place}", "Поздний ужин в «{place}»", "Spätes Essen bei {place}", "Repas tardif chez {place}"],
    "Departure": ["Aizbraukšana", "Отъезд", "Abreise", "Départ"],
    "One last look before you go.": ["Pēdējais skats pirms aizbraukšanas.", "Последний взгляд перед отъездом.", "Ein letzter Blick vor der Abreise.", "Un dernier coup d'œil avant de partir."],
    "Check out": ["Izrakstīšanās", "Выезд", "Check-out", "Remise des clés"],
    "Leave your bags with us and enjoy the rest of the day.": ["Atstājiet somas pie mums un baudiet atlikušo dienu.", "Оставьте сумки у нас и наслаждайтесь остатком дня.", "Lassen Sie Ihr Gepäck bei uns und genießen Sie den Rest des Tages.", "Laissez-nous vos bagages et profitez du reste de la journée."],
    "Thank you for staying with us.": ["Paldies, ka bijāt pie mums.", "Спасибо, что остановились у нас.", "Danke, dass Sie bei uns waren.", "Merci d'avoir séjourné chez nous."],
    "To the airport": ["Uz lidostu", "В аэропорт", "Zum Flughafen", "Direction l'aéroport"],
    "{hotel} is {walk} from {place}": ["No {hotel} līdz {place} ir {walk}", "От «{hotel}» до «{place}» — {walk}", "Vom {hotel} sind es {walk} bis {place}", "Depuis {hotel}, {place} est à {walk}"],
    ", with {list} within ten minutes on foot.": [", un desmit minūšu gājienā: {list}.", ", а в десяти минутах пешком: {list}.", ", und in zehn Minuten zu Fuß: {list}.", ", et vous trouverez {list} à moins de dix minutes de marche."],
    "{n} {things}": ["{things}: {n}", "{things} — {n}", "{n} {things}", "{n} {things}"],
    " and ": [" un ", " и ", " und ", " et "],

    /* ---------------------------------------------------------------- drafted texts (shown while the owner's are empty) */
    "Welcome to {hotel}": ["Laipni lūdzam {hotel}", "Добро пожаловать в «{hotel}»", "Willkommen im {hotel}", "Bienvenue à {hotel}"],
    ", in the heart of {area}": [", pašā {area} sirdī", ", в самом сердце района {area}", ", mitten in {area}", ", au cœur du quartier {area}"],
    "our hotel": ["mūsu viesnīcā", "наш отель", "unserem Hotel", "notre hôtel"],
    "From our door it is {list}. ": ["No mūsu durvīm: {list}. ", "От наших дверей: {list}. ", "Von unserer Tür sind es {list}. ", "Depuis notre porte : {list}. "],
    "{walk} to {place}": ["{walk} līdz {place}", "{walk} до «{place}»", "{walk} bis {place}", "{place} à {walk}"],
    "We are a small, personal hotel: we know our guests by name, and we love sharing the places we go ourselves.": [
      "Mēs esam neliela, personiska viesnīca: mēs zinām savus viesus pēc vārda un labprāt dalāmies ar vietām, kur ejam paši.",
      "Мы небольшой, уютный отель: знаем гостей по имени и с радостью делимся местами, куда ходим сами.",
      "Wir sind ein kleines, persönliches Hotel: Wir kennen unsere Gäste beim Namen und teilen gern die Orte, an die wir selbst gehen.", "Nous sommes un petit hôtel chaleureux : nous connaissons nos clients par leur nom et aimons partager les adresses que nous fréquentons nous-mêmes."],
    "the city": ["pilsēta", "город", "die Stadt", "la ville"],
    "Step outside and {area} is yours: {n} places within a fifteen-minute walk, including {cafes} cafés and {rest} restaurants within ten minutes": [
      "Izejiet ārā, un {area} ir jūsu: {n} vietas piecpadsmit minūšu gājienā, tostarp desmit minūšu attālumā kafejnīcas ({cafes}) un restorāni ({rest})",
      "Выйдите за дверь, и {area} ваш: мест в пятнадцати минутах пешком — {n}, из них в десяти минутах кафе ({cafes}) и рестораны ({rest})",
      "Treten Sie hinaus, und {area} gehört Ihnen: {n} Orte in fünfzehn Gehminuten, darunter {cafes} Cafés und {rest} Restaurants in zehn Minuten", "Passez la porte, et {area} est à vous : {n} lieux à moins de quinze minutes à pied, dont {cafes} cafés et {rest} restaurants à moins de dix minutes"],
    ", and {mus} museums": [", kā arī muzeji ({mus})", ", а также музеи ({mus})", " sowie {mus} Museen", ", ainsi que {mus} musées"],
    ". Leave the car; you will not need it.": [". Atstājiet auto; tas jums nebūs vajadzīgs.", ". Оставьте машину: она вам не понадобится.", ". Lassen Sie das Auto stehen; Sie brauchen es nicht.", ". Laissez la voiture : vous n'en aurez pas besoin."],
    "{n} minutes {label}": ["{n} minūtes {label}", "{n} мин {label}", "{n} Minuten {label}", "{n} minutes {label}"],
    "Right in the middle of everything, on a quiet street.": ["Pašā centrā, klusā ielā.", "В самом центре, на тихой улице.", "Mitten im Geschehen, in einer ruhigen Straße.", "Au cœur de l'action, dans une rue tranquille."],
    "What time is check-in and check-out?": ["Cikos ir reģistrācija un izrakstīšanās?", "Во сколько заезд и выезд?", "Wann sind Check-in und Check-out?", "Quels sont les horaires d'arrivée et de départ?"],
    "Check-in is from {in} and check-out is until {out}.": ["Reģistrācija no {in}, izrakstīšanās līdz {out}.", "Заезд с {in}, выезд до {out}.", "Check-in ab {in}, Check-out bis {out}.", "L'arrivée se fait dès {in} et le départ jusqu'à {out}."],
    "Is breakfast included?": ["Vai brokastis ir iekļautas?", "Завтрак включён?", "Ist das Frühstück inbegriffen?", "Le petit-déjeuner est-il inclus?"],
    "Yes, breakfast is included.": ["Jā, brokastis ir iekļautas.", "Да, завтрак включён.", "Ja, das Frühstück ist inbegriffen.", "Oui, le petit-déjeuner est inclus."],
    "When do I pay?": ["Kad man jāmaksā?", "Когда нужно платить?", "Wann bezahle ich?", "Quand dois-je payer?"],
    "Is there parking?": ["Vai ir stāvvieta?", "Есть ли парковка?", "Gibt es Parkplätze?", "Y a-t-il du stationnement?"],
    "How do I get here from the airport?": ["Kā nokļūt šeit no lidostas?", "Как добраться из аэропорта?", "Wie komme ich vom Flughafen hierher?", "Comment venir depuis l'aéroport?"],

    /* ---------------------------------------------------------------- amenities, channels, payments, kinds */
    "Breakfast included": ["Brokastis iekļautas", "Завтрак включён", "Frühstück inbegriffen", "Petit-déjeuner inclus"],
    "Restaurant in the house": ["Restorāns viesnīcā", "Ресторан в отеле", "Restaurant im Haus", "Restaurant sur place"],
    "Free Wi-Fi": ["Bezmaksas Wi-Fi", "Бесплатный Wi-Fi", "Kostenloses WLAN", "Wi-Fi gratuit"],
    "Lobby fireplace": ["Kamīns vestibilā", "Камин в лобби", "Kamin in der Lobby", "Cheminée dans le hall"],
    "Guest library": ["Viesu bibliotēka", "Библиотека для гостей", "Gästebibliothek", "Bibliothèque des clients"],
    "Bikes to rent": ["Velosipēdu noma", "Прокат велосипедов", "Fahrradverleih", "Vélos en location"],
    "Lift": ["Lifts", "Лифт", "Aufzug", "Ascenseur"],
    "Luggage storage": ["Bagāžas glabāšana", "Камера хранения", "Gepäckaufbewahrung", "Consigne à bagages"],
    "Airport transfer": ["Transfērs no lidostas", "Трансфер из аэропорта", "Flughafentransfer", "Navette aéroport"],
    "Parking nearby": ["Stāvvieta tuvumā", "Парковка рядом", "Parken in der Nähe", "Stationnement à proximité"],
    "Cots for little ones": ["Gultiņas mazuļiem", "Детские кроватки", "Babybetten", "Lits pour bébé"],
    "Pets welcome": ["Mājdzīvnieki laipni gaidīti", "Можно с животными", "Haustiere willkommen", "Animaux bienvenus"],
    "Step-free access": ["Piekļuve bez pakāpieniem", "Доступ без ступенек", "Stufenloser Zugang", "Accès sans marches"],
    "Late check-in": ["Vēla reģistrācija", "Поздний заезд", "Später Check-in", "Arrivée tardive"],
    "Work desk": ["Darba galds", "Рабочий стол", "Schreibtisch", "Bureau de travail"],
    "Tea & coffee in rooms": ["Tēja un kafija numuros", "Чай и кофе в номерах", "Tee & Kaffee im Zimmer", "Thé et café en chambre"],
    "Quiet rooms": ["Klusi numuri", "Тихие номера", "Ruhige Zimmer", "Chambres calmes"],
    "Air conditioning": ["Gaisa kondicionieris", "Кондиционер", "Klimaanlage", "Climatisation"],
    "Sauna or spa": ["Pirts vai spa", "Сауна или спа", "Sauna oder Spa", "Sauna ou spa"],
    "Gym": ["Sporta zāle", "Спортзал", "Fitnessraum", "Salle d'entraînement"],
    "24-hour reception": ["Diennakts reģistratūra", "Круглосуточный ресепшен", "Rezeption rund um die Uhr", "Réception 24 h sur 24"],
    "Tours & tickets desk": ["Ekskursijas un biļetes", "Экскурсии и билеты", "Touren & Tickets", "Visites et billetterie"],
    "Book direct": ["Rezervēt tieši", "Забронировать напрямую", "Direkt buchen", "Réserver en direct"],
    "Call us": ["Zvaniet mums", "Позвоните нам", "Rufen Sie uns an", "Appelez-nous"],
    "Email us": ["Rakstiet mums", "Напишите нам", "Schreiben Sie uns", "Écrivez-nous"],
    "Book online": ["Rezervēt tiešsaistē", "Забронировать онлайн", "Online buchen", "Réserver en ligne"],
    "Cash": ["Skaidra nauda", "Наличные", "Bargeld", "Argent comptant"],
    "Bank transfer": ["Bankas pārskaitījums", "Банковский перевод", "Banküberweisung", "Virement bancaire"],
    "Boutique hotel": ["Butika viesnīca", "Бутик-отель", "Boutique-Hotel", "Hôtel-boutique"],
    "Guesthouse": ["Viesu nams", "Гостевой дом", "Gästehaus", "Maison d'hôtes"],
    "Bed & breakfast": ["Viesu māja ar brokastīm", "Мини-отель с завтраком", "Bed & Breakfast", "Chambre d'hôtes"],
    "Aparthotel": ["Apartviesnīca", "Апарт-отель", "Aparthotel", "Appart-hôtel"],
    "Hostel": ["Hostelis", "Хостел", "Hostel", "Auberge de jeunesse"],
    "Inn": ["Krogs ar naktsmājām", "Гостиница", "Gasthof", "Auberge"],
    "Villa": ["Villa", "Вилла", "Villa", "Villa"],

    /* ---------------------------------------------------------------- the 30 guest profiles: name, line, hook */
    "Art Nouveau Admirer": ["Jūgendstila cienītājs", "Ценитель модерна", "Jugendstil-Liebhaber", "Amoureux de l'Art nouveau"],
    "Here for facades, stained glass and the curve of a staircase.": ["Brauc fasāžu, vitrāžu un kāpņu līkumu dēļ.", "Едет ради фасадов, витражей и изгибов лестниц.", "Kommt für Fassaden, Buntglas und den Schwung einer Treppe.", "Pour les façades, les vitraux et la courbe d'un escalier."],
    "Wake up among the finest facades in Europe.": ["Mostieties starp Eiropas skaistākajām fasādēm.", "Просыпайтесь среди лучших фасадов Европы.", "Wachen Sie zwischen den schönsten Fassaden Europas auf.", "Réveillez-vous parmi les plus belles façades d'Europe."],
    "History Buff": ["Vēstures mīļotājs", "Любитель истории", "Geschichtsfan", "Passionné d'histoire"],
    "Every cobblestone has a story, and they want all of them.": ["Katram bruģakmenim ir stāsts, un viņš grib dzirdēt visus.", "У каждого камня мостовой своя история, и он хочет услышать все.", "Jeder Pflasterstein hat eine Geschichte, und er will alle hören.", "Chaque pavé a son histoire, et pas question d'en manquer une."],
    "Centuries of history start at the front door.": ["Gadsimtiem sena vēsture sākas aiz durvīm.", "Века истории начинаются прямо за дверью.", "Jahrhunderte Geschichte beginnen vor der Haustür.", "Des siècles d'histoire, dès le pas de la porte."],
    "Foodie": ["Gardēdis", "Гурман", "Feinschmecker", "Gourmet"],
    "Plans the trip around lunch and dinner. Breakfast too.": ["Plāno braucienu ap pusdienām un vakariņām. Un brokastīm.", "Планирует поездку вокруг обедов и ужинов. И завтраков.", "Plant die Reise rund um Mittag- und Abendessen. Und Frühstück.", "Organise tout le voyage autour des repas. Petit-déjeuner compris."],
    "Your table is never more than a few minutes away.": ["Jūsu galdiņš vienmēr ir tikai dažu minūšu attālumā.", "Ваш столик всегда в паре минут.", "Ihr Tisch ist nie mehr als ein paar Minuten entfernt.", "Votre table n'est jamais à plus de quelques minutes."],
    "Coffee Lover": ["Kafijas cienītājs", "Любитель кофе", "Kaffeeliebhaber", "Amateur de café"],
    "Judges a city by its flat whites and its cinnamon buns.": ["Vērtē pilsētu pēc tās kafijas un kanēļmaizītēm.", "Судит о городе по его флэт уайту и булочкам с корицей.", "Beurteilt eine Stadt nach ihrem Flat White und ihren Zimtschnecken.", "Juge une ville à ses flat whites et à ses brioches à la cannelle."],
    "A great cup of coffee around every corner.": ["Lieliska kafija aiz katra stūra.", "Отличный кофе за каждым углом.", "Großartiger Kaffee an jeder Ecke.", "Un excellent café à chaque coin de rue."],
    "Romantic Couple": ["Romantisks pāris", "Романтичная пара", "Romantisches Paar", "Couple romantique"],
    "Candle-lit dinners, late mornings, a walk by the water.": ["Vakariņas sveču gaismā, vēli rīti, pastaiga gar ūdeni.", "Ужины при свечах, поздние утра, прогулка у воды.", "Dinner bei Kerzenlicht, späte Morgen, ein Spaziergang am Wasser.", "Repas aux chandelles, grasses matinées, balade au bord de l'eau."],
    "Candle-lit dinners and cobbled lanes for two.": ["Vakariņas sveču gaismā un bruģētas ieliņas diviem.", "Ужины при свечах и мощёные улочки для двоих.", "Dinner bei Kerzenlicht und Gassen für zwei.", "Repas aux chandelles et ruelles pavées, en amoureux."],
    "Family with Kids": ["Ģimene ar bērniem", "Семья с детьми", "Familie mit Kindern", "Famille avec enfants"],
    "Little legs, big curiosity, and snacks at all times.": ["Mazas kājiņas, liela ziņkārība un uzkodas vienmēr.", "Маленькие ножки, большое любопытство и перекусы всегда под рукой.", "Kleine Beine, große Neugier und immer Snacks dabei.", "Petites jambes, grande curiosité et collations à toute heure."],
    "Short walks, big adventures, room for everyone.": ["Īsas pastaigas, lieli piedzīvojumi, vieta visiem.", "Короткие прогулки, большие приключения, место для всех.", "Kurze Wege, große Abenteuer, Platz für alle.", "Petits trajets, grandes aventures, de la place pour tous."],
    "Business Traveller": ["Darba ceļotājs", "Деловой путешественник", "Geschäftsreisender", "Voyageur d'affaires"],
    "Meetings by day, a good dinner and a quiet room by night.": ["Dienā tikšanās, vakarā labas vakariņas un kluss numurs.", "Днём встречи, вечером хороший ужин и тихий номер.", "Tagsüber Termine, abends ein gutes Essen und ein ruhiges Zimmer.", "Réunions le jour, bonne table et chambre calme le soir."],
    "Close to everything, quiet when you need it.": ["Tuvu visam, klusi, kad tas vajadzīgs.", "Рядом со всем, тихо, когда нужно.", "Nah an allem, ruhig, wenn Sie es brauchen.", "Près de tout, au calme quand il le faut."],
    "Digital Nomad": ["Digitālais nomads", "Цифровой кочевник", "Digitaler Nomade", "Nomade numérique"],
    "Laptop, good Wi-Fi, better coffee, a city to explore after five.": ["Klēpjdators, labs Wi-Fi, vēl labāka kafija un pilsēta, ko izpētīt pēc pieciem.", "Ноутбук, хороший Wi-Fi, кофе ещё лучше и город, который можно исследовать после пяти.", "Laptop, gutes WLAN, noch besserer Kaffee und eine Stadt zum Entdecken nach fünf.", "Ordinateur portable, bon Wi-Fi, café encore meilleur et une ville à explorer après 17 h."],
    "Work from anywhere, then explore everything.": ["Strādājiet no jebkurienes, pēc tam izpētiet visu.", "Работайте откуда угодно, а потом исследуйте всё.", "Arbeiten Sie von überall, dann entdecken Sie alles.", "Travaillez d'où vous voulez, puis explorez tout."],
    "Night Owl": ["Naktspūce", "Сова", "Nachteule", "Noctambule"],
    "The city really starts after 10 pm.": ["Pilsēta īsti sākas pēc desmitiem vakarā.", "Город по-настоящему оживает после десяти вечера.", "Die Stadt beginnt erst nach 22 Uhr richtig.", "La ville commence vraiment après 22 h."],
    "The bars are close, and so is your bed.": ["Bāri ir tuvu, un tāpat arī jūsu gulta.", "Бары рядом, и ваша кровать тоже.", "Die Bars sind nah, und Ihr Bett auch.", "Les bars sont tout près, votre lit aussi."],
    "Concert & Opera Goer": ["Koncertu un operas apmeklētājs", "Любитель концертов и оперы", "Konzert- und Operngänger", "Mélomane"],
    "Has the opera schedule open in another tab.": ["Operas repertuārs jau atvērts citā cilnē.", "Афиша оперы уже открыта в соседней вкладке.", "Hat den Opernspielplan im anderen Tab offen.", "Garde la programmation de l'opéra ouverte dans un autre onglet."],
    "Curtain up, then a short walk home.": ["Priekškars veras, pēc tam īsa pastaiga mājup.", "Занавес, а потом короткая прогулка домой.", "Vorhang auf, danach ein kurzer Weg nach Hause.", "Lever de rideau, puis un court retour à pied."],
    "Shopper": ["Iepirkšanās mīļotājs", "Любитель шопинга", "Shopping-Fan", "Amateur de boutiques"],
    "Leaves with one more bag than they arrived with.": ["Aizbrauc ar vienu somu vairāk nekā atbrauca.", "Уезжает с одной сумкой больше, чем приехал.", "Reist mit einer Tasche mehr ab, als er gekommen ist.", "Repart toujours avec un sac de plus qu'à l'arrivée."],
    "Boutiques, markets and makers on your doorstep.": ["Butiki, tirgi un amatnieki pie jūsu durvīm.", "Бутики, рынки и мастера прямо у порога.", "Boutiquen, Märkte und Manufakturen vor der Tür.", "Boutiques, marchés et artisans à votre porte."],
    "Wellness Seeker": ["Labsajūtas meklētājs", "Ищущий гармонии", "Wellness-Suchender", "Adepte du bien-être"],
    "Saunas, slow mornings, green spaces and early nights.": ["Pirtis, nesteidzīgi rīti, zaļas vietas un agri vakari.", "Сауны, неспешные утра, зелень и ранний отбой.", "Saunen, ruhige Morgen, viel Grün und frühe Nächte.", "Saunas, matins paisibles, verdure et nuits qui commencent tôt."],
    "Slow mornings, green parks, a city that breathes.": ["Nesteidzīgi rīti, zaļi parki, pilsēta, kas elpo.", "Неспешные утра, зелёные парки, город, который дышит.", "Ruhige Morgen, grüne Parks, eine Stadt, die atmet.", "Matins paisibles, parcs verdoyants, une ville qui respire."],
    "Morning Runner": ["Rīta skrējējs", "Утренний бегун", "Morgenläufer", "Coureur matinal"],
    "Laces up before breakfast and maps every route.": ["Pirms brokastīm sasien kurpes un izplāno katru maršrutu.", "Зашнуровывается до завтрака и прокладывает каждый маршрут.", "Schnürt vor dem Frühstück die Schuhe und plant jede Strecke.", "Lacets noués avant le petit-déjeuner, chaque parcours repéré."],
    "Run the canal at sunrise, breakfast when you are back.": ["Skrējiens gar kanālu saullēktā, brokastis pēc atgriešanās.", "Пробежка вдоль канала на рассвете, завтрак по возвращении.", "Bei Sonnenaufgang am Kanal laufen, danach frühstücken.", "Courez le long du canal au lever du soleil, petit-déjeuner au retour."],
    "Cyclist": ["Riteņbraucējs", "Велосипедист", "Radfahrer", "Cycliste"],
    "Sees the city on two wheels, from the river to the suburbs.": ["Redz pilsētu no diviem riteņiem, no upes līdz priekšpilsētām.", "Смотрит город с велосипеда, от реки до окраин.", "Erkundet die Stadt auf zwei Rädern, vom Fluss bis in die Vororte.", "Découvre la ville sur deux roues, des quais jusqu'en banlieue."],
    "Grab a bike and the whole city is yours.": ["Paņemiet velosipēdu, un visa pilsēta ir jūsu.", "Берите велосипед, и весь город ваш.", "Schnappen Sie sich ein Rad, und die ganze Stadt gehört Ihnen.", "Prenez un vélo, et toute la ville est à vous."],
    "Photographer": ["Fotogrāfs", "Фотограф", "Fotograf", "Photographe"],
    "Chases golden hour, rooftops and quiet streets at dawn.": ["Medī zelta stundu, jumtus un klusas ielas rītausmā.", "Охотится за золотым часом, крышами и тихими улицами на рассвете.", "Jagt die goldene Stunde, Dächer und stille Straßen im Morgengrauen.", "Traque l'heure dorée, les toits et les rues calmes à l'aube."],
    "Golden hour starts outside your window.": ["Zelta stunda sākas aiz jūsu loga.", "Золотой час начинается за вашим окном.", "Die goldene Stunde beginnt vor Ihrem Fenster.", "L'heure dorée commence sous vos fenêtres."],
    "Budget Explorer": ["Taupīgs ceļotājs", "Экономный путешественник", "Sparfuchs", "Petit budget"],
    "Wants the most city for the least money.": ["Grib redzēt visvairāk par vismazāko naudu.", "Хочет увидеть больше всего за меньшие деньги.", "Will am meisten Stadt fürs wenigste Geld.", "Un maximum de ville pour un minimum d'argent."],
    "Walk everywhere. Spend it on experiences.": ["Ejiet visur kājām. Tērējiet piedzīvojumiem.", "Ходите везде пешком. Тратьте на впечатления.", "Gehen Sie überall zu Fuß. Geben Sie es für Erlebnisse aus.", "Allez partout à pied. Gardez l'argent pour les expériences."],
    "Solo Traveller": ["Ceļotājs vienatnē", "Путешественник-одиночка", "Alleinreisender", "Voyageur en solo"],
    "Their own pace, their own plans, and a good book.": ["Savs temps, savi plāni un laba grāmata.", "Свой темп, свои планы и хорошая книга.", "Eigenes Tempo, eigene Pläne und ein gutes Buch.", "Son rythme, ses projets et un bon livre."],
    "Your own pace, in a city that is easy to love.": ["Savā tempā, pilsētā, kuru ir viegli iemīlēt.", "В своём темпе, в городе, который легко полюбить.", "In Ihrem Tempo, in einer Stadt, die man leicht lieben kann.", "À votre rythme, dans une ville facile à aimer."],
    "Friends' Weekend": ["Draugu nedēļas nogale", "Выходные с друзьями", "Wochenende mit Freunden", "Fin de semaine entre amis"],
    "Three friends, two days, one group chat full of plans.": ["Trīs draugi, divas dienas un viena čata grupa, pilna plānu.", "Трое друзей, два дня и один групповой чат, полный планов.", "Drei Freunde, zwei Tage, ein Gruppenchat voller Pläne.", "Trois amis, deux jours, une conversation de groupe pleine de projets."],
    "Dinner, drinks and stories you will retell for years.": ["Vakariņas, dzērieni un stāsti, ko stāstīsiet gadiem.", "Ужин, напитки и истории, которые вы будете пересказывать годами.", "Abendessen, Drinks und Geschichten, die Sie noch jahrelang erzählen.", "Bonne table, verres et histoires à raconter pendant des années."],
    "Unhurried Travellers": ["Nesteidzīgi ceļotāji", "Неторопливые путешественники", "Gemütlich Reisende", "Voyageurs sans hâte"],
    "Retired, curious and in no rush at all.": ["Pensijā, ziņkārīgi un nekur nesteidzas.", "На пенсии, любознательны и никуда не спешат.", "Im Ruhestand, neugierig und ganz ohne Eile.", "Retraités, curieux et pas pressés du tout."],
    "Everything worth seeing, within an easy stroll.": ["Viss, ko vērts redzēt, vieglas pastaigas attālumā.", "Всё, что стоит увидеть, в лёгкой прогулке.", "Alles Sehenswerte, gemütlich zu Fuß erreichbar.", "L'essentiel à voir, au fil d'une promenade tranquille."],
    "Step-free Traveller": ["Ceļotājs bez pakāpieniem", "Путешественник без ступенек", "Stufenlos Reisende", "Mobilité réduite"],
    "Needs smooth routes, lifts and no surprises.": ["Vajag līdzenus maršrutus, liftus un bez pārsteigumiem.", "Нужны ровные маршруты, лифты и никаких сюрпризов.", "Braucht ebene Wege, Aufzüge und keine Überraschungen.", "Trajets sans obstacles, ascenseurs, et pas de mauvaises surprises."],
    "Short, smooth routes and help when you need it.": ["Īsi, līdzeni maršruti un palīdzība, kad tā vajadzīga.", "Короткие ровные маршруты и помощь, когда нужна.", "Kurze, ebene Wege und Hilfe, wenn Sie sie brauchen.", "Des trajets courts et sans obstacles, et de l'aide au besoin."],
    "Travelling with a Dog": ["Ceļojums ar suni", "Путешествие с собакой", "Reisen mit Hund", "En voyage avec son chien"],
    "The best friend comes too.": ["Labākais draugs brauc līdzi.", "Лучший друг едет с вами.", "Der beste Freund kommt mit.", "Le meilleur ami est du voyage."],
    "Parks for them, cafés for you.": ["Parki viņam, kafejnīcas jums.", "Парки для него, кафе для вас.", "Parks für ihn, Cafés für Sie.", "Des parcs pour lui, des cafés pour vous."],
    "Winter & Christmas Market": ["Ziema un Ziemassvētku tirdziņš", "Зима и рождественская ярмарка", "Winter & Weihnachtsmarkt", "Hiver et marché de Noël"],
    "Mulled wine, candlelight and markets under falling snow.": ["Karstvīns, sveču gaisma un tirdziņi krītošā sniegā.", "Глинтвейн, свечи и ярмарки под падающим снегом.", "Glühwein, Kerzenlicht und Märkte im fallenden Schnee.", "Vin chaud, lueur des chandelles et marchés sous les flocons."],
    "Christmas markets and candlelit cafés, a short walk away.": ["Ziemassvētku tirdziņi un kafejnīcas sveču gaismā, pāris soļu attālumā.", "Рождественские ярмарки и кафе при свечах в паре шагов.", "Weihnachtsmärkte und Cafés bei Kerzenlicht, nur ein paar Schritte entfernt.", "Marchés de Noël et cafés aux chandelles, à quelques pas."],
    "White Nights Summer": ["Baltās naktis vasarā", "Лето белых ночей", "Sommer der hellen Nächte", "Été des nuits claires"],
    "Long evenings, terraces and sunsets after ten.": ["Gari vakari, terases un saulrieti pēc desmitiem.", "Долгие вечера, террасы и закаты после десяти.", "Lange Abende, Terrassen und Sonnenuntergänge nach zehn.", "Longues soirées, terrasses et couchers de soleil après 22 h."],
    "Long light evenings on the terraces outside.": ["Gari, gaiši vakari uz terasēm turpat blakus.", "Долгие светлые вечера на террасах рядом.", "Lange helle Abende auf den Terrassen ringsum.", "De longues soirées lumineuses en terrasse, tout près."],
    "Craft Beer Fan": ["Amatniecības alus cienītājs", "Любитель крафтового пива", "Craft-Beer-Fan", "Fan de bière artisanale"],
    "Has a list of breweries and taprooms to tick off.": ["Viņam ir saraksts ar alus darītavām un krogiem, ko apmeklēt.", "У него список пивоварен и тапрумов, которые надо обойти.", "Hat eine Liste von Brauereien und Taprooms zum Abhaken.", "Tient une liste de microbrasseries et de bars à bières à cocher."],
    "Taprooms and beer gardens within a short wander.": ["Alus krodziņi un dārzi īsas pastaigas attālumā.", "Пивные бары и сады в короткой прогулке.", "Taprooms und Biergärten nur einen kurzen Bummel entfernt.", "Bars à bières et terrasses, à deux pas."],
    "Plant-based Eater": ["Augu ēdienu cienītājs", "Растительное питание", "Pflanzlich Essende", "Cuisine végétale"],
    "Vegetarian or vegan, and always hunting the best menus.": ["Veģetārietis vai vegāns, vienmēr meklē labākās ēdienkartes.", "Вегетарианец или веган, всегда ищет лучшие меню.", "Vegetarisch oder vegan und immer auf der Suche nach den besten Speisekarten.", "Végétarien ou végane, toujours à l'affût des meilleurs menus."],
    "Fresh, green food all around the block.": ["Svaigs, zaļš ēdiens visapkārt.", "Свежая растительная еда по всему кварталу.", "Frisches, grünes Essen rund um den Block.", "Une cuisine fraîche et végétale, partout dans le quartier."],
    "Short Layover": ["Īsa pārsēšanās", "Короткая пересадка", "Kurzer Zwischenstopp", "Courte escale"],
    "One night, a few hours of city, an early flight.": ["Viena nakts, dažas stundas pilsētā un agrs lidojums.", "Одна ночь, пара часов в городе и ранний рейс.", "Eine Nacht, ein paar Stunden Stadt, ein früher Flug.", "Une nuit, quelques heures en ville, un vol au petit matin."],
    "One night is enough to fall for the city.": ["Ar vienu nakti pietiek, lai iemīlētu pilsētu.", "Одной ночи хватит, чтобы влюбиться в город.", "Eine Nacht reicht, um sich in die Stadt zu verlieben.", "Une nuit suffit pour tomber sous le charme de la ville."],
    "Ferry & Cruise Day": ["Prāmja un kruīza diena", "День с парома или круиза", "Fähr- & Kreuzfahrttag", "Escale en bateau"],
    "Arrives by sea and wants the highlights before sailing.": ["Ierodas pa jūru un grib redzēt labāko pirms atiešanas.", "Прибывает морем и хочет увидеть главное до отплытия.", "Kommt übers Meer und will die Highlights vor dem Ablegen sehen.", "Arrive par la mer et veut voir l'essentiel avant de repartir."],
    "The best of the old town, then back to the port.": ["Labākais no vecpilsētas, tad atpakaļ uz ostu.", "Лучшее в старом городе, а потом обратно в порт.", "Das Beste der Altstadt, dann zurück zum Hafen.", "Le meilleur de la vieille ville, puis retour au port."],
    "Architecture Student": ["Arhitektūras students", "Студент-архитектор", "Architekturstudent", "Étudiant en architecture"],
    "Sketchbook in hand, from Gothic to Jugendstil to Soviet modern.": ["Ar skiču bloknotu rokā: no gotikas līdz jūgendstilam un padomju modernismam.", "С альбомом в руках: от готики до модерна и советского модернизма.", "Skizzenbuch in der Hand, von Gotik über Jugendstil bis zur sowjetischen Moderne.", "Carnet de croquis en main, du gothique à l'Art nouveau jusqu'au modernisme soviétique."],
    "Seven centuries of architecture in one walk.": ["Septiņi arhitektūras gadsimti vienā pastaigā.", "Семь веков архитектуры за одну прогулку.", "Sieben Jahrhunderte Architektur auf einem Spaziergang.", "Sept siècles d'architecture en une seule promenade."],
    "Event & Conference Visitor": ["Pasākuma vai konferences viesis", "Гость мероприятия или конференции", "Event- & Konferenzgast", "Événement ou congrès"],
    "In town for an event, with evenings free.": ["Pilsētā pasākuma dēļ, vakari brīvi.", "В городе ради мероприятия, вечера свободны.", "Wegen eines Events in der Stadt, die Abende sind frei.", "En ville pour un événement, les soirées libres."],
    "Walk to the venue, unwind in the old town.": ["Kājām līdz norises vietai, atpūta vecpilsētā.", "Пешком до площадки, отдых в старом городе.", "Zu Fuß zum Veranstaltungsort, entspannen in der Altstadt.", "Allez à pied à l'événement, détendez-vous dans la vieille ville."],
    "Long Stay": ["Ilga uzturēšanās", "Долгое пребывание", "Langer Aufenthalt", "Long séjour"],
    "Here for weeks: groceries, a gym and a favourite café matter.": ["Šeit uz nedēļām: svarīgs ir veikals, sporta zāle un iemīļota kafejnīca.", "Здесь на недели: важны продукты, спортзал и любимое кафе.", "Für Wochen hier: Supermarkt, Fitnessstudio und ein Lieblingscafé zählen.", "Ici pour des semaines : épicerie, salle d'entraînement et café préféré, c'est essentiel."],
    "Live like a local, from market to morning run.": ["Dzīvojiet kā vietējais: no tirgus līdz rīta skrējienam.", "Живите как местный: от рынка до утренней пробежки.", "Leben Sie wie ein Einheimischer, vom Markt bis zum Morgenlauf.", "Vivez comme les gens d'ici, du marché à la course du matin."]
  };

  NS.t = function (s, vars) {
    var row = NS.lang !== 'en' ? DICT[s] : null;
    var out = (row && row[IDX[NS.lang]]) || String(s == null ? '' : s);
    if (vars) out = out.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return out;
  };
  NS.th = function (s, vars) {
    var out = NS.esc(NS.t(s));
    if (vars) out = out.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return out;
  };
  NS.tr = function (s) {
    if (s == null || s === '' || NS.lang === 'en') return s;
    var k = String(s);
    if (owner[k]) return owner[k];
    var row = DICT[k];
    return (row && row[IDX[NS.lang]]) || s;
  };
  NS.hasWord = function (s) { return !!DICT[s]; };
  NS.tIn = function (lang, s) { var row = DICT[s]; return (row && IDX[lang] != null && row[IDX[lang]]) || ''; };
  NS.siteLangs = function (data) {
    var on = (data && data.langs) || [];
    return NS.LANG_ORDER.filter(function (c) { return c === 'en' || on.indexOf(c) >= 0; });
  };
  NS.setLang = function (code, data) {
    NS.lang = NS.LANGS[code] ? code : 'en';
    owner = (data && data.i18n && data.i18n[NS.lang]) || {};
    return NS.lang;
  };
  /* Lower-case the first letter where the language allows it (German nouns keep their capital). */
  NS.lcFirst = function (s) {
    s = String(s || '');
    return NS.lang === 'de' ? s : s.charAt(0).toLowerCase() + s.slice(1);
  };
  /* The language a guest's browser prefers, if the site offers it. */
  NS.browserLang = function (offered) {
    var prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']);
    for (var i = 0; i < prefs.length; i++) {
      var c = String(prefs[i] || '').slice(0, 2).toLowerCase();
      if (offered.indexOf(c) >= 0) return c;
    }
    return null;
  };
})();

/* Part 2: the stay engine. Pure functions over the site data: distances and walking times, how well the
   neighbourhood suits each guest profile (fit), "in numbers" facts, and the automatic hour-by-hour stay story.
   Deterministic: the same data, profile and options always give the same story. */
(function () {
  'use strict';
  var NS = window.NSSite;

  /* ------------------------------------------------------------------ small helpers */
  NS.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  NS.hash = function (str) {
    var h = 2166136261;
    str = String(str);
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  NS.rng = function (seed) {   // mulberry32
    var a = NS.hash(seed);
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  NS.get = function (obj, path, dflt) {
    var cur = obj, parts = String(path).split('.');
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return dflt;
      cur = cur[parts[i]];
    }
    return cur == null ? dflt : cur;
  };
  /* metres between two points (haversine) */
  NS.dist = function (lat1, lng1, lat2, lng2) {
    var R = 6371000, toR = Math.PI / 180;
    var dLat = (lat2 - lat1) * toR, dLng = (lng2 - lng1) * toR;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  };
  /* walking minutes: streets are ~30% longer than a straight line, 80 m a minute */
  NS.walkMin = function (m) { return Math.max(1, Math.round(m * 1.3 / 80)); };
  NS.fmtWalk = function (min) { return min <= 1 ? NS.t('1 min walk') : min > 45 ? NS.t('{n} min by tram or taxi', { n: Math.round(min / 6) }) : NS.t('{n} min walk', { n: min }); };
  NS.firstSentence = function (text, max) {
    text = String(text || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    var m = text.match(/^(.{20,}?[.!?])\s/);
    var s = m ? m[1] : text;
    max = max || 170;
    if (s.length > max) s = s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
    return s;
  };
  NS.season = function (date) {
    var m = (date || new Date()).getMonth();
    return m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn';
  };
  NS.SEASONS = { winter: 'Winter', spring: 'Spring', summer: 'Summer', autumn: 'Autumn' };

  /* Places with distance and walking time from the hotel; hidden ones left out. Cached per data object. */
  NS.places = function (data) {
    var h = (data && data.hotel) || {};
    var key = (data.places || []).length + ':' + h.lat + ':' + h.lng + ':' + (data._rev || 0);
    if (data.__placesKey === key && data.__places) return data.__places;
    var out = (data.places || []).filter(function (p) { return p && !p.hidden && NS.CATS[p.cat] && p.name; }).map(function (p) {
      var d = (h.lat != null && p.lat != null) ? NS.dist(h.lat, h.lng, p.lat, p.lng) : (p.dist || 600);
      var c = {};
      for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k)) c[k] = p[k];
      c.dist = Math.round(d);
      c.walk = NS.walkMin(d);
      return c;
    }).sort(function (a, b) { return a.dist - b.dist; });
    try {
      Object.defineProperty(data, '__places', { value: out, configurable: true, writable: true, enumerable: false });
      Object.defineProperty(data, '__placesKey', { value: key, configurable: true, writable: true, enumerable: false });
    } catch (e) {}
    return out;
  };
  NS.countWithin = function (places, cat, minutes) {
    var n = 0;
    for (var i = 0; i < places.length; i++) if (places[i].cat === cat && places[i].walk <= minutes) n++;
    return n;
  };
  NS.nearest = function (places, cat, filter) {
    for (var i = 0; i < places.length; i++) if (places[i].cat === cat && (!filter || filter(places[i]))) return places[i];
    return null;
  };
  NS.hasFeature = function (data, key) {
    if (key === 'location') return true;
    return (NS.get(data, 'hotel.features', []) || []).indexOf(key) >= 0;
  };

  /* ------------------------------------------------------------------ fit: how well the area suits a profile (0-10) */
  var TARGET = { sight: 6, museum: 3, gallery: 3, church: 3, culture: 2.5, cafe: 8, restaurant: 10, bar: 6, nightlife: 2.5, park: 2.5,
    shop: 8, market: 3, wellness: 2, sport: 2, kids: 2, coworking: 1.2, transport: 2, essentials: 3 };
  /* Each place counts less the further it is (a 4-minute café is worth more than a 14-minute one); a category
     "fills up" smoothly, and the categories a profile cares most about weigh more than the rest. */
  NS.fit = function (data, p) {
    if (typeof p === 'string') p = NS.persona(p);
    if (!p) return { score: 0, counts: {} };
    var places = NS.places(data), pace = p.walk || 1, reach = 12 * pace, sum = 0, wsum = 0, counts = {}, eff = {};
    places.forEach(function (x) {
      if (!p.w[x.cat]) return;
      if (x.walk <= reach) counts[x.cat] = (counts[x.cat] || 0) + 1;
      eff[x.cat] = (eff[x.cat] || 0) + Math.exp(-x.walk / (7 * pace)) * (x.wiki || x.pinned ? 1.5 : 1);
    });
    Object.keys(p.w).forEach(function (cat) {
      var wt = Math.pow(p.w[cat], 1.6);
      sum += wt * (1 - Math.exp(-(eff[cat] || 0) / (TARGET[cat] || 3)));
      wsum += wt;
      counts[cat] = counts[cat] || 0;
    });
    var base = wsum ? sum / wsum : 0;
    var perks = (p.perks || []).filter(function (k) { return k !== 'location' && NS.hasFeature(data, k); }).length;
    var rooms = (data.rooms || []).some(function (r) { return (r.tags || []).some(function (t) { return (p.rooms || []).indexOf(t) >= 0; }); }) ? 0.05 : 0;
    var score = Math.min(10, (base * 0.82 + Math.min(0.12, perks * 0.04) + rooms) * 10);
    return { score: Math.round(score * 10) / 10, counts: counts };
  };
  NS.rankPersonas = function (data) {
    return NS.PERSONAS.map(function (p) { return { p: p, fit: NS.fit(data, p) }; })
      .sort(function (a, b) { return b.fit.score - a.fit.score; });
  };
  /* The profiles a site shows: the owner's choice, or the best eight. */
  NS.enabledPersonas = function (data) {
    var ids = NS.get(data, 'personas.enabled', null);
    var list = ids && ids.length ? ids.map(NS.persona).filter(Boolean) : NS.rankPersonas(data).slice(0, 8).map(function (x) { return x.p; });
    return list;
  };

  /* ------------------------------------------------------------------ "in numbers": facts for the highlights band */
  NS.numbers = function (data, p) {
    var places = NS.places(data), out = [];
    var landmark = places.filter(function (x) { return x.cat === 'sight' && x.wiki; })[0] || NS.nearest(places, 'sight');
    if (landmark) out.push({ n: landmark.walk, unit: NS.t('min'), label: NS.t('on foot to {place}', { place: landmark.name }), icon: 'walk' });
    var cats = p ? Object.keys(p.w).sort(function (a, b) { return p.w[b] - p.w[a]; }) : ['cafe', 'restaurant', 'museum', 'park', 'bar'];
    cats.forEach(function (cat) {
      if (out.length >= 4 || cat === 'transport' || cat === 'essentials') return;
      var n = NS.countWithin(places, cat, 10);
      if (n >= 2) out.push({ n: n, unit: '', label: NS.t('{things} within 10 minutes', { things: NS.t(NS.CATS[cat].plural) }), icon: NS.CATS[cat].icon });
    });
    var st = NS.nearest(places, 'transport', function (x) { return /station|stacija|bahnhof|terminal|vokzal/i.test(x.name + ' ' + (x.sub || '')); });
    if (st && out.length < 4) out.push({ n: st.walk, unit: NS.t('min'), label: NS.t('to {place}', { place: st.name }), icon: 'train' });
    var total = places.filter(function (x) { return x.walk <= 15; }).length;
    if (out.length < 4 && total) out.push({ n: total, unit: '', label: NS.t('places within 15 minutes on foot'), icon: 'pin' });
    return out.slice(0, 4);
  };

  /* ------------------------------------------------------------------ describing a place in a few words */
  var SUB = {
    cafe: 'A café', restaurant: 'A restaurant', bar: 'A bar', nightlife: 'A late-night venue', museum: 'A museum', gallery: 'A gallery',
    sight: 'A local landmark', church: 'A historic church', park: 'A green space', shop: 'A shop', market: 'A food shop',
    wellness: 'A place to unwind', sport: 'A place to train', kids: 'Fun for children', coworking: 'A coworking space',
    transport: 'Transport link', essentials: 'Everyday essentials', culture: 'A stage for music and theatre'
  };
  NS.describe = function (p) {
    if (p.note) return NS.t('Our tip: {note}', { note: NS.tr(p.note) });
    if (p.wiki && p.wiki.extract) return NS.firstSentence(p.wiki.extract, 180);
    if (NS.lang !== 'en') {
      var sub = p.sub ? String(p.sub).replace(/_/g, ' ') : '';
      return NS.t(SUB[p.cat]) + (sub ? ' (' + sub + ')' : '') + '.' + (p.diet ? ' ' + NS.t('Plant-based dishes too.') : '');
    }
    if (p.sub) {
      var s = String(p.sub).replace(/_/g, ' ');
      if (p.cat === 'restaurant' || p.cat === 'cafe') return s.charAt(0).toUpperCase() + s.slice(1) + ' ' + (p.cat === 'cafe' ? 'café' : 'kitchen') + (p.diet ? ', with plant-based dishes' : '') + '.';
      return SUB[p.cat] + ' (' + s + ').';
    }
    return SUB[p.cat] + (p.diet ? ' with plant-based dishes' : '') + '.';
  };
  /* ------------------------------------------------------------------ the stay story */
  var RHYTHM = {
    early:  { breakfast: '07:30', morning: '09:00', late: '11:00', lunch: '12:30', afternoon: '14:30', coffee: '16:30', evening: '18:00', dinner: '19:00', night: '21:00' },
    normal: { breakfast: '08:30', morning: '10:00', late: '11:30', lunch: '13:00', afternoon: '14:30', coffee: '16:30', evening: '18:00', dinner: '19:30', night: '21:30' },
    late:   { breakfast: '09:30', morning: '11:00', late: '12:30', lunch: '13:30', afternoon: '15:00', coffee: '17:00', evening: '18:30', dinner: '20:00', night: '22:00', late_night: '23:30' }
  };
  var MEALS = { restaurant: 1, cafe: 1, bar: 1, nightlife: 1, market: 0, transport: 1, essentials: 1, coworking: 0 };
  function addMinutes(hhmm, mins) {
    var p = String(hhmm || '15:00').split(':'), t = (+p[0] || 0) * 60 + (+p[1] || 0) + mins;
    t = Math.max(0, Math.min(23 * 60 + 59, t));
    var h = Math.floor(t / 60), m = t % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  NS.addMinutes = addMinutes;

  NS.story = function (data, pid, opts) {
    opts = opts || {};
    var p = NS.persona(pid) || NS.PERSONAS[0];
    var hotel = data.hotel || {}, name = hotel.name || NS.t('the hotel');
    var nights = Math.max(1, Math.min(5, +opts.nights || p.nights || 2));
    var season = opts.season || p.season || NS.season(opts.date);
    var R = RHYTHM[p.rhythm] || RHYTHM.normal;
    var rnd = NS.rng(p.id + ':' + nights + ':' + season + ':' + (data.places || []).length);
    var pace = p.walk || 1;
    var places = NS.places(data);
    var ov = NS.get(data, 'personas.overrides.' + p.id, {}) || {};
    var used = {};
    var w = {};
    Object.keys(NS.CATS).forEach(function (c) { w[c] = p.w[c] || 0; });
    if (season === 'winter') { w.park *= 0.55; w.wellness = (w.wellness || 0.5) * 1.3; w.cafe = Math.max(w.cafe, 1) * 1.2; w.market *= 1.25; }
    if (season === 'summer') { w.park = Math.max(w.park, 1) * 1.3; w.bar *= 1.1; }
    var hiddenCats = ov.hide || [];
    hiddenCats.forEach(function (c) { w[c] = 0; });
    var pinned = {};
    (ov.pins || []).forEach(function (id) { pinned[id] = 1; });

    function score(pl) {
      var weight = w[pl.cat] || 0;
      if (!weight) return 0;
      var prox = 1 / (1 + Math.pow(pl.walk / (14 * pace), 2));
      var q = 1 + (pl.wiki ? 0.7 : 0) + (pl.pinned || pinned[pl.id] ? 3 : 0) + (pl.note ? 0.6 : 0) + (p.diet && pl.diet ? 2 : 0);
      return weight * prox * q * (0.85 + 0.3 * NS.rng(p.id + pl.id + nights)());
    }
    function pick(cats, maxWalk) {
      var best = null, bs = 0;
      for (var i = 0; i < places.length; i++) {
        var pl = places[i];
        if (used[pl.id || pl.name] || cats.indexOf(pl.cat) < 0) continue;
        if (maxWalk && pl.walk > maxWalk) continue;
        var s = score(pl);
        if (s > bs) { bs = s; best = pl; }
      }
      if (best) used[best.id || best.name] = 1;
      return best;
    }
    function verb(pl) {
      var vs = NS.CATS[pl.cat].verbs;
      return NS.t(vs[Math.floor(rnd() * vs.length)]).replace('{n}', pl.name);
    }
    function placeSlot(time, pl, extra, title) {
      return { time: time, cat: pl.cat, icon: NS.CATS[pl.cat].icon, title: title || verb(pl), text: NS.describe(pl) + (extra ? ' ' + extra : ''),
        walk: pl.walk, place: { id: pl.id, name: pl.name, lat: pl.lat, lng: pl.lng, cat: pl.cat, thumb: pl.wiki && pl.wiki.thumb, url: pl.url } };
    }
    function hotelSlot(time, icon, title, text) { return { time: time, icon: icon, title: title, text: text, walk: 0, hotel: true }; }

    var activityCats = Object.keys(w).filter(function (c) { return w[c] > 0 && !MEALS[c]; }).sort(function (a, b) { return w[b] - w[a]; });
    if (!activityCats.length) activityCats = ['sight', 'park', 'museum'];
    var mealCats = ['restaurant'];
    var lunchCats = w.market >= 2 ? ['market', 'cafe', 'restaurant'] : ['cafe', 'restaurant'];
    var inHouse = NS.get(data, 'dining.name', '') && (data.sections || []).some(function (s) { return s.id === 'dining' && s.on !== false; });
    var breakfastIncluded = NS.hasFeature(data, 'breakfast');

    var flavour = {
      winter: NS.t('Wrap up warm: the old town glows in the snow.'), summer: NS.t('Evenings stay light until late, so take your time.'),
      spring: NS.t('Café terraces start opening in spring.'), autumn: NS.t('Golden trees and fewer crowds.')
    };

    function breakfast(time) {
      if (breakfastIncluded) return hotelSlot(time, 'cup', NS.t('Breakfast at {hotel}', { hotel: name }), NS.tr(hotel.breakfast) || NS.t('Breakfast is included and served downstairs.'));
      var c = pick(['cafe'], 8);
      return c ? placeSlot(time, c, NS.t('A good start to the day.')) : hotelSlot(time, 'cup', NS.t('Breakfast nearby'), NS.t('Ask at the desk for our favourite breakfast spot.'));
    }
    function activity(time, k, dayIndex, maxWalk) {
      for (var t = 0; t < activityCats.length; t++) {
        var cat = activityCats[(dayIndex * 2 + k + t) % activityCats.length];
        var pl = pick([cat], maxWalk);
        if (pl) return placeSlot(time, pl);
      }
      var any = pick(activityCats);
      return any ? placeSlot(time, any) : hotelSlot(time, 'walk', NS.t('Wander the neighbourhood'), NS.t('Pick a street you have not walked yet. Everything here is close.'));
    }
    function meal(time, cats, label) {
      var pl = pick(cats, 15 * pace);
      if (!pl) return hotelSlot(time, 'fork', NS.t(label), NS.t('Ask us for a table nearby. We know the good ones.'));
      return placeSlot(time, pl, '', NS.t(pl.cat === 'market' ? 'Pick up lunch at {place}' : label + ' at {place}', { place: pl.name }));
    }
    function evening(time) {
      if (p.rhythm === 'late' || w.bar >= 2 || w.nightlife >= 2) {
        var b = pick(['bar', 'nightlife'], 15);
        if (b) return placeSlot(time, b, '', NS.t(b.cat === 'nightlife' ? 'Late night at {place}' : rnd() < 0.5 ? 'Nightcap at {place}' : 'Drinks at {place}', { place: b.name }));
      }
      if (NS.hasFeature(data, 'fireplace')) return hotelSlot(time, 'fire', NS.t('Back by the fireplace'), NS.t('End the day with a book by the lobby fire.'));
      var s = pick(['sight', 'church', 'park'], 10);
      return s ? placeSlot(time, s, NS.t('Beautiful after dark, too.')) : hotelSlot(time, 'moon', NS.t('An early night'), NS.t('Sleep well: tomorrow there is more to see.'));
    }

    var days = [];
    // Arrival
    var arrive = hotel.checkin || '15:00';
    var d0 = [hotelSlot(arrive, 'key', NS.t('Check in at {hotel}', { hotel: name }), (NS.tr(hotel.checkin_note) || NS.t('Drop your bags, freshen up and pick up a map at the desk.')))];
    var first = activity(addMinutes(arrive, 60), 0, 0, 8);
    first.title = NS.t('First walk: {what}', { what: NS.lcFirst(first.title) });
    d0.push(first);
    if (p.rhythm === 'late' || w.bar >= 1.5) { var ap = pick(['bar'], 10); if (ap) d0.push(placeSlot(R.evening, ap, NS.t('To start the trip.'), NS.t('An aperitif at {place}', { place: ap.name }))); }
    if (inHouse && (w.restaurant >= 1 || nights === 1)) {
      d0.push(hotelSlot(R.dinner, 'fork', NS.t('Dinner downstairs at {place}', { place: data.dining.name }),
        NS.firstSentence(NS.tr(data.dining.short) || NS.tr(data.dining.body) || NS.t('No need to go far on your first night.'), 170)));
    } else d0.push(meal(R.dinner, mealCats, 'Dinner'));
    d0.push(evening(R.night));
    days.push({ title: NS.t('Arrival'), slots: d0 });

    // Full days
    for (var d = 1; d < nights; d++) {
      var s = [breakfast(R.breakfast)];
      if (p.id === 'runner' || w.sport >= 2) { var run = pick(['park', 'sport'], 15); if (run) s.unshift(placeSlot(addMinutes(R.breakfast, -60), run, NS.t('Before breakfast, while the streets are quiet.'))); }
      if (w.coworking >= 2) { var cw = pick(['coworking', 'cafe'], 15); if (cw) s.push(placeSlot(R.morning, cw, NS.t('Fast Wi-Fi and good coffee.'))); }
      else s.push(activity(R.morning, 0, d));
      if (p.rhythm === 'early') s.push(activity(R.late, 1, d));
      s.push(meal(R.lunch, lunchCats, 'Lunch'));
      s.push(activity(R.afternoon, 2, d));
      var cf = pick(season === 'summer' && w.park ? ['park', 'cafe'] : (w.wellness >= 2 ? ['wellness', 'cafe'] : ['cafe']), 10);
      if (cf) s.push(placeSlot(R.coffee, cf, season === 'winter' ? NS.t('Warm up for a while.') : ''));
      if (w.shop >= 2) { var sh = pick(['shop', 'market'], 12); if (sh) s.push(placeSlot(R.evening, sh)); }
      var perf = w.culture >= 1.5 ? pick(['culture'], 20) : null;
      if (perf) {
        s.push(placeSlot('19:00', perf, NS.t('Check what is on tonight: most performances start around 19:00.'), NS.t('An evening performance at {place}', { place: perf.name })));
        var sup = pick(['restaurant', 'bar'], 12);
        if (sup) s.push(placeSlot('21:45', sup, NS.t('A late supper after the show.'), NS.t('Late supper at {place}', { place: sup.name })));
      } else {
        s.push(meal(R.dinner, mealCats, 'Dinner'));
        s.push(evening(R.night));
      }
      if (R.late_night && (w.nightlife >= 2)) { var nl = pick(['nightlife', 'bar'], 15); if (nl) s.push(placeSlot(R.late_night, nl)); }
      days.push({ title: NS.t('Day {n}', { n: d + 1 }), slots: s });
    }

    // Departure
    var out = hotel.checkout || '12:00';
    var dl = [breakfast(R.breakfast)];
    var last = pick(activityCats.slice(0, 3).concat(['cafe']), 8);
    if (last) dl.push(placeSlot(addMinutes(out, -90), last, NS.t('One last look before you go.')));
    dl.push(hotelSlot(out, 'suitcase', NS.t('Check out'), NS.hasFeature(data, 'luggage') ? NS.t('Leave your bags with us and enjoy the rest of the day.') : NS.t('Thank you for staying with us.')));
    var station = NS.nearest(places, 'transport', function (x) { return /station|stacija|terminal|bus|airport/i.test(x.name + ' ' + (x.sub || '')); });
    if (station) dl.push(placeSlot(addMinutes(out, 60), station, hotel.airport ? NS.tr(hotel.airport) : ''));
    else if (hotel.airport) dl.push(hotelSlot(addMinutes(out, 60), 'plane', NS.t('To the airport'), NS.tr(hotel.airport)));
    days.push({ title: NS.t('Departure'), slots: dl });

    // Intro, tips and rooms
    var landmark = places.filter(function (x) { return x.cat === 'sight' && x.wiki; })[0] || places.filter(function (x) { return w[x.cat] > 0; })[0];
    var top2 = activityCats.concat(['cafe', 'restaurant', 'bar']).filter(function (c, i, a) { return a.indexOf(c) === i && w[c] > 0; }).slice(0, 2);
    var counts = top2.map(function (c) { return { c: c, n: NS.countWithin(places, c, 10) }; }).filter(function (x) { return x.n > 0; });
    var intro = NS.tr(ov.intro) || (NS.t(p.hook) + ' ' + (landmark ? NS.t('{hotel} is {walk} from {place}', { hotel: name, walk: NS.fmtWalk(landmark.walk), place: landmark.name }) +
      (counts.length ? NS.t(', with {list} within ten minutes on foot.', { list: counts.map(function (x) { return NS.t('{n} {things}', { n: x.n, things: NS.t(NS.CATS[x.c].plural) }); }).join(NS.t(' and ')) }) : '.') : ''));
    var tips = [];
    (p.perks || []).forEach(function (k) {
      if (k === 'location' || !NS.hasFeature(data, k)) return;
      tips.push({ icon: NS.FEATURES[k].icon, text: NS.t(NS.FEATURES[k].label) });
    });
    if (ov.tip) tips.unshift({ icon: 'sparkle', text: NS.tr(ov.tip), own: true });
    tips.push({ icon: season === 'winter' ? 'snow' : season === 'summer' ? 'sun' : 'leaf', text: flavour[season] });

    var rooms = NS.roomsFor(data, p);
    var route = [];
    days.forEach(function (day) { day.route = day.slots.filter(function (x) { return x.place && x.place.lat != null; }).map(function (x) { return x.place; }); });
    return { persona: p, nights: nights, season: season, intro: intro, days: days, tips: tips.slice(0, 5), rooms: rooms, route: route };
  };

  /* Rooms that suit a profile: the owner's picks first, then by matching tags. */
  NS.roomsFor = function (data, p) {
    if (typeof p === 'string') p = NS.persona(p);
    var rooms = (data.rooms || []).filter(function (r) { return r && r.name; });
    if (!p) return [];
    var picks = NS.get(data, 'personas.overrides.' + p.id + '.rooms', []) || [];
    return rooms.map(function (r) {
      var s = picks.indexOf(r.id) >= 0 ? 10 : 0;
      (r.tags || []).forEach(function (t) { if ((p.rooms || []).indexOf(t) >= 0) s += 2; });
      return { r: r, s: s };
    }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.r.id; }).slice(0, 2);
  };

  /* Draft texts from the facts ("Write it for me" in the editor). */
  NS.draft = {
    story: function (data) {
      var h = data.hotel || {}, places = NS.places(data);
      var lm = places.filter(function (x) { return x.cat === 'sight' && x.wiki; }).slice(0, 2);
      return NS.t('Welcome to {hotel}', { hotel: h.name || NS.t('our hotel') }) + (h.area ? NS.t(', in the heart of {area}', { area: h.area }) : '') + '. ' +
        (h.building ? NS.tr(h.building) + ' ' : '') +
        (lm.length ? NS.t('From our door it is {list}. ', { list: lm.map(function (x) { return NS.t('{walk} to {place}', { walk: NS.fmtWalk(x.walk), place: x.name }); }).join(NS.t(' and ')) }) : '') +
        NS.t('We are a small, personal hotel: we know our guests by name, and we love sharing the places we go ourselves.');
    },
    neighborhood: function (data) {
      var h = data.hotel || {}, places = NS.places(data);
      var n15 = places.filter(function (x) { return x.walk <= 15; }).length;
      var cafes = NS.countWithin(places, 'cafe', 10), rest = NS.countWithin(places, 'restaurant', 10), mus = NS.countWithin(places, 'museum', 15);
      return NS.t('Step outside and {area} is yours: {n} places within a fifteen-minute walk, including {cafes} cafés and {rest} restaurants within ten minutes',
        { area: h.area || NS.t('the city'), n: n15, cafes: cafes, rest: rest }) + (mus ? NS.t(', and {mus} museums', { mus: mus }) : '') + NS.t('. Leave the car; you will not need it.');
    },
    highlights: function (data) {
      var feats = NS.get(data, 'hotel.features', []) || [];
      var out = [];
      var nums = NS.numbers(data);
      if (nums[0]) out.push({ icon: 'walk', title: NS.t('{n} minutes {label}', { n: nums[0].n, label: nums[0].label }), text: NS.t('Right in the middle of everything, on a quiet street.') });
      feats.slice(0, 5).forEach(function (k) { if (NS.FEATURES[k]) out.push({ icon: NS.FEATURES[k].icon, title: NS.t(NS.FEATURES[k].label), text: '' }); });
      return out.slice(0, 6);
    },
    faq: function (data) {
      var h = data.hotel || {}, b = data.booking || {};
      var out = [];
      if (h.checkin || h.checkout) out.push({ q: NS.t('What time is check-in and check-out?'), a: NS.t('Check-in is from {in} and check-out is until {out}.', { 'in': h.checkin || '15:00', out: h.checkout || '12:00' }) });
      if (NS.hasFeature(data, 'breakfast')) out.push({ q: NS.t('Is breakfast included?'), a: NS.tr(h.breakfast) || NS.t('Yes, breakfast is included.') });
      if (NS.get(b, 'payment.when')) out.push({ q: NS.t('When do I pay?'), a: NS.tr(b.payment.when) });
      if (h.parking) out.push({ q: NS.t('Is there parking?'), a: NS.tr(h.parking) });
      if (h.airport) out.push({ q: NS.t('How do I get here from the airport?'), a: NS.tr(h.airport) });
      return out;
    }
  };
})();

/* Part 3: drawing a hotel site.
   NSSite.mount(root, data, opts) draws the whole site into root and returns {update(data), setPersona(id), destroy()}.
   NSSite.boot(data, opts) is what a hosted or exported page calls: it mounts into #ns-root.
   opts: mode 'live' | 'preview' | 'export'; media {m: base url for "m:KEY" uploads, a: base url for "a:file" starter
   photos}; stats (url to ping, live only); slug; platform {name, url}; lib {maplibre, maplibreCss}; noMap; persona;
   lang (en | lv | ru | de | fr: the language to start in, see 15-i18n.js); ask (url of the guest question endpoint).
   Every word the site shows goes through T() (NSSite.t, the built-in dictionary) or TR() (NSSite.tr, the owner's own
   texts and their translations). The "Ask us a question" form sits in the contact section (data.contact.ask_off hides it).
   "Ask us for your dates" (booking.request.on, off by default) sits under the booking steps and posts to the same
   endpoint with kind 'dates'. An address ending in #thanks (the check-out QR card) opens the thank-you sheet: review
   links (booking.after.google_review + every score with a link), "Tell us privately" and the come-back code. */
(function () {
  'use strict';
  var NS = window.NSSite, e = NS.esc, ic = NS.icon, T = NS.t, TH = NS.th, TR = NS.tr;

  /* ------------------------------------------------------------------ media + text helpers */
  NS.src = function (ref, opts) {
    if (!ref) return '';
    ref = String(ref);
    var m = (opts && opts.media) || {};
    if (ref.indexOf('m:') === 0) return (m.m || '') + ref.slice(2);
    if (ref.indexOf('a:') === 0) return (m.a || '') + ref.slice(2);
    return ref;
  };
  NS.rich = function (text) {
    var s = e(text || '').replace(/\r/g, '');
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,!?]|$)/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s.split(/\n{2,}/).map(function (p) { return '<p>' + p.replace(/\n/g, '<br>') + '</p>'; }).join('');
  };
  NS.mapsLink = function (p, city) {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.name + (city ? ', ' + city : '') ) ;
  };
  NS.directions = function (lat, lng) { return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng; };
  function stars(n) { n = +n || 0; var s = ''; for (var i = 0; i < n; i++) s += '★'; return s; }
  function initials(name) {
    var w = String(name || 'H').replace(/^(hotel|boutique|the|villa|pension|guesthouse|hostel)\s+/ig, '').trim().split(/\s+/);
    return (w[0] || 'H').charAt(0).toUpperCase();
  }

  /* ------------------------------------------------------------------ ornaments (inline SVG, coloured by CSS) */
  NS.orn = {
    divider: function () {
      return '<div class="ns-divider" aria-hidden="true"><svg viewBox="0 0 240 24"><path d="M0 12h86c10 0 14-9 22-9 6 0 9 4 9 7 0 4-4 6-7 4M240 12h-86c-10 0-14-9-22-9-6 0-9 4-9 7 0 4 4 6 7 4"/>' +
        '<path d="M120 4c4 4 4 12 0 16-4-4-4-12 0-16z" class="f"/></svg></div>';
    },
    corner: function (cls) {
      return '<svg class="ns-corner ' + (cls || '') + '" viewBox="0 0 80 80" aria-hidden="true"><path d="M2 78V30C2 14 14 2 30 2h48M10 78V36c0-14 12-26 26-26h42"/>' +
        '<path d="M2 50c10 0 18-6 18-16 0-6-4-10-9-10-4 0-7 3-7 7 0 3 2 5 5 5"/><circle cx="30" cy="30" r="3" class="f"/></svg>';
    },
    monogram: function (name) {
      return '<span class="ns-mono" aria-hidden="true"><svg viewBox="0 0 48 56"><path d="M4 54V22a20 20 0 0 1 40 0v32z"/><path d="M9 54V23a15 15 0 0 1 30 0v31"/></svg><b>' + e(initials(name)) + '</b></span>';
    },
    lily: function () {
      return '<svg class="ns-lily" viewBox="0 0 120 160" aria-hidden="true"><path d="M60 158c0-40-3-70-22-96M60 158c2-30 10-52 30-70"/>' +
        '<path d="M44 96c-20-4-32-16-36-34 18-2 32 6 40 22M78 104c14-10 30-12 40-6-8 14-22 20-38 18"/>' +
        '<path d="M38 60C20 54 12 34 18 10c12 4 20 12 22 24 2-18 8-30 20-38 12 8 18 20 20 38 2-12 10-20 22-24 6 24-2 44-20 50-14 5-30 5-44 0z" class="f"/></svg>';
    }
  };

  /* A drawn room, for rooms without photos yet. */
  function roomArt(room, i) {
    var beds = /twin|two|2 single/i.test(room.beds || '') ? 2 : 1;
    var bed = beds === 2
      ? '<rect x="70" y="150" width="70" height="38" rx="6"/><rect x="160" y="150" width="70" height="38" rx="6"/><path d="M70 150v-22a10 10 0 0 1 10-10h50a10 10 0 0 1 10 10v22M160 150v-22a10 10 0 0 1 10-10h50a10 10 0 0 1 10 10v22"/>'
      : '<rect x="80" y="148" width="140" height="40" rx="8"/><path d="M80 148v-24c0-16 14-28 30-28h80c16 0 30 12 30 28v24"/><path d="M96 148v-12a8 8 0 0 1 8-8h36a8 8 0 0 1 8 8v12M152 148v-12a8 8 0 0 1 8-8h36a8 8 0 0 1 8 8v12"/>';
    return '<svg class="ns-roomart v' + (i % 3) + '" viewBox="0 0 300 220" role="img" aria-label="' + e(T('Drawing of the room')) + '"><rect class="wall" width="300" height="220"/>' +
      '<path class="win" d="M196 112V52a32 32 0 0 1 64 0v60z"/><path d="M228 20v92M196 70h64"/>' +
      '<path class="floor" d="M0 188h300v32H0z"/><path d="M0 188h300"/>' + bed +
      '<path d="M40 188v-56M28 132h24l-4-22H32z"/><path d="M262 188c-2-26 6-40 18-48M262 188c4-16 2-30-8-42"/></svg>';
  }

  /* ------------------------------------------------------------------ the site */
  NS.mount = function (root, data, opts) {
    opts = opts || {};
    var S = {
      root: root, data: data, opts: opts, persona: null, nights: null, season: null, day: 0, filter: null,
      widgets: [], map: null, mapEl: null, askOpened: Date.now()
    };
    (function () {   // the language to start in: the page's choice, the address, the guest's last pick, their browser
      var offered = NS.siteLangs(data), want = opts.lang || (location.search.match(/[?&]lang=([a-z]{2})/) || [])[1] || null;
      if (!want && opts.mode !== 'preview') { try { want = localStorage.getItem('ns.lang.' + (opts.slug || '')); } catch (x) {} }
      if (!want && opts.mode !== 'preview') want = NS.browserLang(offered);
      NS.setLang(offered.indexOf(want) >= 0 || (opts.mode === 'preview' && NS.LANGS[want]) ? want : 'en', data);
    })();
    var startPersona = opts.persona || (location.hash.match(/for=([a-z]+)/) || [])[1] || null;
    if (!startPersona) { try { startPersona = sessionStorage.getItem('ns.persona.' + (opts.slug || '')); } catch (x) {} }
    if (startPersona && NS.persona(startPersona)) S.persona = startPersona;

    function enabledSections() {
      var list = data.sections && data.sections.length ? data.sections : NS.SECTIONS.map(function (s) { return { id: s.id, on: true }; });
      return list.filter(function (s) { return s.on !== false && SECTIONS[s.id]; });
    }
    function sectionTitle(id, dflt) {
      var s = (data.sections || []).filter(function (x) { return x.id === id; })[0];
      return TR((s && s.title) || dflt);
    }
    function mediaSrc(ref) { return NS.src(ref, opts); }
    function primaryChannel() {
      var ch = (NS.get(data, 'booking.channels', []) || []).filter(function (c) { return c.url; });
      return ch[0] || null;
    }
    function bookBtn(cls, label) {
      var c = primaryChannel();
      if (!c) return '<a class="ns-btn ' + (cls || '') + '" href="#ns-booking">' + e(T(label || 'Check availability')) + '</a>';
      return '<a class="ns-btn ' + (cls || '') + '" href="' + e(c.url) + '" target="_blank" rel="noopener">' + e(T(label || 'Check availability')) + ic('arrow') + '</a>';
    }
    function head(id, eyebrow, title, lead) {
      return '<header class="ns-head">' + (eyebrow ? '<div class="ns-eyebrow">' + e(TR(eyebrow)) + '</div>' : '') +
        '<h2>' + e(sectionTitle(id, title)) + '</h2>' + (lead ? '<div class="ns-lead">' + lead + '</div>' : '') + NS.orn.divider() + '</header>';
    }
    function persona() { return S.persona ? NS.persona(S.persona) : null; }
    function heroFor(p) {
      // French keeps the profile's name as a title (« Pour le profil « Couple gourmand » : »), so no lower-casing.
      var who = NS.lang === 'en' ? p.name.toLowerCase().replace(/^the /, '') : NS.lang === 'fr' ? T(p.name) : NS.lcFirst(T(p.name));
      return '<p class="ns-hero-for">' + ic(p.icon) + '<span><b>' + e(T('For {who}:', { who: who })) + '</b> ' + e(T(p.hook)) + '</span></p>';
    }
    function askOn() { return !NS.get(data, 'contact.ask_off', false); }
    function requestOn() { return !!NS.get(data, 'booking.request.on', false); }
    function requestHere() { return requestOn() && has('booking'); }
    function hotelName() { return NS.get(data, 'hotel.name', '') || T('the hotel'); }

    /* ---------------------------------------------------------------- sections */
    var SECTIONS = {
      hero: function () {
        var h = data.hotel || {}, hero = data.hero || {}, p = persona();
        var kind = hero.kind || 'photo', media = '';
        if (kind === 'video' && hero.video) {
          var vi = NS.videoInfo(mediaSrc(hero.video));
          media = vi.type === 'youtube' ? '<iframe class="ns-hero-yt" src="https://www.youtube-nocookie.com/embed/' + e(vi.id) + '?autoplay=1&mute=1&loop=1&controls=0&playsinline=1&playlist=' + e(vi.id) + '" allow="autoplay" title="' + e(T('Hotel video')) + '" tabindex="-1"></iframe>'
            : '<video class="ns-hero-media" src="' + e(vi.src) + (hero.start ? '#t=' + (+hero.start) : '') + '" autoplay muted loop playsinline' + (hero.image ? ' poster="' + e(mediaSrc(hero.image)) + '"' : '') + ' data-start="' + (+hero.start || 0) + '" data-end="' + (+hero.end || 0) + '"></video>';
        } else if (kind === 'film') {
          media = '<div class="ns-film" data-film></div>';
        } else if (hero.image) {
          media = '<img class="ns-hero-media" src="' + e(mediaSrc(hero.image)) + '" alt="">';
        }
        var ratings = (data.ratings || []).slice(0, 2).map(function (r) {
          return '<span class="ns-rate"><b>' + e(r.score) + '</b><span>/' + e(r.out_of || 10) + '</span><em>' + e(r.source) + '</em></span>';
        }).join('');
        var arch = hero.style === 'arch';
        return '<div class="ns-hero-in' + (arch ? ' arch' : '') + '">' +
          '<div class="ns-hero-bg">' + media + '<div class="ns-hero-shade"></div></div>' + NS.orn.corner('tl') + NS.orn.corner('tr') +
          '<div class="ns-hero-text"><div class="ns-eyebrow">' + (h.stars ? '<span class="ns-stars">' + stars(h.stars) + '</span> ' : '') + e([TR(h.kind || 'Hotel'), TR(h.area) || h.city].filter(Boolean).join(' · ')) + '</div>' +
          '<h1>' + e(h.name || T('Your hotel')) + '</h1>' +
          '<p class="ns-hero-line">' + e(TR(hero.headline || h.tagline || '')) + '</p>' +
          (p ? heroFor(p) : '') +
          '<div class="ns-hero-cta"><a class="ns-btn light" href="#ns-' + (has('personas') ? 'personas' : has('stay') ? 'stay' : 'rooms') + '">' + ic('route') + e(T('Plan your stay')) + '</a>' + bookBtn('primary') + '</div>' +
          (ratings ? '<div class="ns-rates">' + ratings + '</div>' : '') + '</div>' +
          '<a class="ns-scroll" href="#ns-' + ((enabledSections()[1] || {}).id || 'rooms') + '" aria-label="' + e(T('Scroll down')) + '">' + ic('down') + '</a></div>';
      },

      personas: function () {
        var list = NS.enabledPersonas(data), cur = S.persona;
        var title = NS.get(data, 'personas.title', '') || 'Who is coming?';
        return head('personas', 'Made for you', title, '<p>' + e(TR(NS.get(data, 'personas.lead', '')) || T('Pick the traveller you are. The whole page rearranges itself: rooms, places, and a stay planned hour by hour.')) + '</p>') +
          '<div class="ns-pers" role="listbox" aria-label="' + e(T('Choose your kind of trip')) + '">' +
          '<button class="ns-per all' + (cur ? '' : ' on') + '" data-persona="" role="option" aria-selected="' + !cur + '"><span class="ns-per-ic">' + ic('sparkle') + '</span><b>' + e(T('Everyone')) + '</b><small>' + e(T('Show me everything')) + '</small></button>' +
          list.map(function (p) {
            var on = cur === p.id;
            return '<button class="ns-per' + (on ? ' on' : '') + '" data-persona="' + p.id + '" role="option" aria-selected="' + on + '"><span class="ns-per-ic">' + ic(p.icon) + '</span><b>' + e(T(p.name)) + '</b><small>' + e(T(p.line)) + '</small></button>';
          }).join('') + '</div>' +
          (cur ? '<p class="ns-per-now">' + ic('check') + TH('Showing the site for {who}.', { who: '<b>' + e(T(persona().name)) + '</b>' }) + ' <a href="#ns-stay">' + e(T('See your stay')) + '</a> · <button data-persona="">' + e(T('Show everything')) + '</button></p>' : '');
      },

      story: function () {
        var st = data.story || {};
        var img = st.image ? '<figure class="ns-arch"><img src="' + e(mediaSrc(st.image)) + '" alt="' + e(TR(st.image_alt || '')) + '" loading="lazy">' + (st.caption ? '<figcaption>' + e(TR(st.caption)) + '</figcaption>' : '') + '</figure>' : '<div class="ns-arch art">' + NS.orn.lily() + '</div>';
        return '<div class="ns-story">' + img + '<div class="ns-story-text"><div class="ns-eyebrow">' + e(TR(st.eyebrow || 'Our story')) + '</div><h2>' + e(sectionTitle('story', st.title || 'Welcome')) + '</h2>' +
          '<div class="ns-prose">' + NS.rich(TR(st.body) || NS.draft.story(data)) + '</div>' + (st.sign ? '<p class="ns-sign">' + e(st.sign) + '</p>' : '') + '</div></div>';
      },

      highlights: function () {
        var p = persona(), nums = NS.numbers(data, p);
        var items = (data.highlights && data.highlights.length ? data.highlights : NS.draft.highlights(data)).slice();
        var feats = (NS.get(data, 'hotel.features', []) || []);
        if (p) {
          (p.perks || []).slice().reverse().forEach(function (k) {
            if (k === 'location' || feats.indexOf(k) < 0) return;
            var f = NS.FEATURES[k];
            items = items.filter(function (x) { return x.title !== f.label && x.title !== T(f.label); });
            items.unshift({ icon: f.icon, title: f.label, text: '', forYou: true });
          });
        }
        return head('highlights', 'Why stay here', 'The best address in the neighbourhood', '') +
          (nums.length ? '<div class="ns-nums">' + nums.map(function (n) {
            return '<div class="ns-num">' + ic(n.icon) + '<b>' + e(n.n) + (n.unit ? '<small>' + e(n.unit) + '</small>' : '') + '</b><span>' + e(n.label) + '</span></div>';
          }).join('') + '</div>' : '') +
          '<div class="ns-hls">' + items.slice(0, 8).map(function (h) {
            return '<div class="ns-hl' + (h.forYou ? ' you' : '') + '"><span class="ns-hl-ic">' + ic(h.icon || 'star') + '</span><div><h3>' + e(TR(h.title)) + (h.forYou ? ' <em>' + e(T('for you')) + '</em>' : '') + '</h3>' + (h.text ? '<p>' + e(TR(h.text)) + '</p>' : '') + '</div></div>';
          }).join('') + '</div>';
      },

      rooms: function () {
        var p = persona(), picks = p ? NS.roomsFor(data, p) : [];
        var rooms = (data.rooms || []).filter(function (r) { return r && r.name; });
        if (p) rooms = rooms.slice().sort(function (a, b) { return (picks.indexOf(a.id) < 0) - (picks.indexOf(b.id) < 0); });
        if (!rooms.length) return head('rooms', 'Sleep well', 'Rooms', '') + '<p class="ns-empty">' + e(T('Rooms are coming soon.')) + '</p>';
        return head('rooms', 'Sleep well', 'Rooms', data.rooms_intro ? NS.rich(TR(data.rooms_intro)) : '') +
          '<div class="ns-rooms">' + rooms.map(function (r, i) {
            var photos = (r.photos || []).filter(Boolean);
            var media = photos.length ? '<div class="ns-carousel" data-carousel>' + photos.map(function (ph, k) {
              return '<img src="' + e(mediaSrc(ph)) + '" alt="' + e(T('{room} photo {n}', { room: TR(r.name), n: k + 1 })) + '" loading="lazy" data-lb="room-' + i + '" data-lb-i="' + k + '">';
            }).join('') + '</div>' + (photos.length > 1 ? '<div class="ns-car-nav"><button data-car="-1" aria-label="' + e(T('Previous photo')) + '">' + ic('left') + '</button><span>1 / ' + photos.length + '</span><button data-car="1" aria-label="' + e(T('Next photo')) + '">' + ic('right') + '</button></div>' : '')
              : roomArt(r, i) + '<span class="ns-soon">' + e(T('Photos coming soon')) + '</span>';
            var fits = picks.indexOf(r.id) >= 0;
            var specs = [r.size ? ic('ruler') + e(r.size) + ' m²' : '', r.beds ? ic('bed') + e(TR(r.beds)) : '', r.guests ? ic('users') + e(T('Up to {n}', { n: r.guests })) : ''].filter(Boolean);
            var tools = [
              photos.length ? '<button class="ns-chip" data-room-photos="' + i + '">' + ic('grid') + e(T('{n} photos', { n: photos.length })) + '</button>' : '',
              r.pano ? '<button class="ns-chip" data-room-pano="' + i + '">' + ic('cube') + '360°</button>' : '',
              r.tour ? '<button class="ns-chip" data-room-tour="' + i + '">' + ic('cube') + e(T('3D tour')) + '</button>' : '',
              r.video ? '<button class="ns-chip" data-room-video="' + i + '">' + ic('play') + e(T('Video')) + '</button>' : ''].join('');
            return '<article class="ns-room' + (fits ? ' fits' : '') + '"><div class="ns-room-media">' + media + (fits ? '<span class="ns-fit">' + ic('heart') + e(T('Perfect for you')) + '</span>' : '') + '</div>' +
              '<div class="ns-room-body"><h3>' + e(TR(r.name)) + '</h3>' + (specs.length ? '<div class="ns-specs">' + specs.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</div>' : '') +
              (r.text ? '<div class="ns-room-text">' + NS.rich(TR(r.text)) + '</div>' : '') +
              ((r.features || []).length ? '<ul class="ns-feats">' + r.features.slice(0, 6).map(function (f) { return '<li>' + ic('check') + e(TR(f)) + '</li>'; }).join('') + '</ul>' : '') +
              (tools ? '<div class="ns-room-tools">' + tools + '</div>' : '') +
              '<div class="ns-room-foot">' + (r.price ? '<span class="ns-price">' + TH('from {price} / night', { price: '<b>' + e(r.price) + '</b>' }) + '</span>' : '<span></span>') + bookBtn('sm', 'Check dates') + '</div>' +
              (requestHere() ? '<button class="ns-room-ask" type="button" data-request-room="' + e(r.name) + '">' + ic('mail') + e(T('Ask us directly')) + '</button>' : '') + '</div></article>';
          }).join('') + '</div>';
      },

      walkthrough: function () {
        var wt = data.walkthrough || {}, items = (wt.items || []).filter(function (x) { return x && (x.src || x.embed || (x.stops || []).length); });
        if (!items.length) return '';
        var cur = Math.min(S.wt || 0, items.length - 1), it = items[cur];
        var tabs = items.length > 1 ? '<div class="ns-tabs">' + items.map(function (x, k) {
          return '<button class="' + (k === cur ? 'on' : '') + '" data-wt="' + k + '">' + ic(x.kind === 'pano' ? 'cube' : x.kind === 'embed' ? 'cube' : 'walk') + e(TR(x.title) || T('Tour {n}', { n: k + 1 })) + '</button>';
        }).join('') + '</div>' : '';
        var body;
        if (it.kind === 'pano') body = '<div class="ns-pano" data-pano="' + e(mediaSrc(it.src)) + '"><div class="ns-pano-hint">' + ic('compass') + e(T('Drag to look around')) + '</div><button class="ns-pano-fs" data-fs aria-label="' + e(T('Full screen')) + '">' + ic('expand') + '</button></div>';
        else if (it.kind === 'embed') body = '<div class="ns-embed"><iframe src="' + e(NS.videoInfo(it.embed).embed || it.embed) + '" allow="fullscreen; xr-spatial-tracking; autoplay" allowfullscreen loading="lazy" title="' + e(TR(it.title) || T('Virtual tour')) + '"></iframe></div>';
        else {
          var stops = it.stops || [], k = Math.min(S.stop || 0, stops.length - 1), st = stops[k] || {};
          body = '<div class="ns-walk"><figure><img src="' + e(mediaSrc(st.src)) + '" alt="' + e(TR(st.caption || '')) + '"><figcaption><b>' + (k + 1) + ' / ' + stops.length + '</b> ' + e(TR(st.caption || '')) + '</figcaption></figure>' +
            '<div class="ns-walk-nav"><button class="ns-btn sm" data-stop="-1"' + (k === 0 ? ' disabled' : '') + '>' + ic('left') + e(T('Back')) + '</button><div class="ns-walk-dots">' + stops.map(function (_, j) { return '<i class="' + (j === k ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
            '<button class="ns-btn sm primary" data-stop="1"' + (k >= stops.length - 1 ? ' disabled' : '') + '>' + e(T('Walk on')) + ic('right') + '</button></div></div>';
        }
        return head('walkthrough', 'Look around', wt.title || 'Step inside', wt.lead ? '<p>' + e(TR(wt.lead)) + '</p>' : '') + tabs +
          '<div class="ns-wt">' + body + (it.text || it.credit ? '<p class="ns-wt-note">' + e(TR(it.text || '')) + (it.credit ? ' <small>' + e(it.credit) + '</small>' : '') + '</p>' : '') + '</div>';
      },

      gallery: function () {
        var g = data.gallery || {}, items = (g.items || []).filter(function (x) { return x && x.src; });
        if (!items.length) return '';
        var layout = g.layout || 'bento';
        return head('gallery', 'Gallery', g.title || 'A closer look', '') +
          '<div class="ns-gal ' + e(layout) + '">' + items.map(function (it, i) {
            return '<figure class="g' + (i % 7) + '"><img src="' + e(mediaSrc(it.src)) + '" alt="' + e(TR(it.caption || '')) + '" loading="lazy" data-lb="gal" data-lb-i="' + i + '">' + (it.caption ? '<figcaption>' + e(TR(it.caption)) + '</figcaption>' : '') + '</figure>';
          }).join('') + '</div>';
      },

      stay: function () {
        var list = NS.enabledPersonas(data);
        var pid = S.persona || NS.get(data, 'personas.featured', '') || (list[0] && list[0].id) || NS.PERSONAS[0].id;
        var p = NS.persona(pid);
        var nights = S.nights || p.nights || 2;
        var season = S.season || p.season || NS.season();
        var st = NS.story(data, pid, { nights: nights, season: season });
        var day = Math.min(S.day, st.days.length - 1);
        S.story = st;
        var d = st.days[day];
        var rooms = (data.rooms || []).filter(function (r) { return st.rooms.indexOf(r.id) >= 0; });
        return head('stay', 'Your stay, planned', 'Your stay, hour by hour', '<p>' + e(T('Written for the way you travel, from the places around us. Change the trip and watch it rewrite itself.')) + '</p>') +
          '<div class="ns-stay-ctl">' +
            '<label><span>' + e(T('Travelling as')) + '</span><select data-stay-persona>' + list.concat(list.some(function (x) { return x.id === pid; }) ? [] : [p]).map(function (x) {
              return '<option value="' + x.id + '"' + (x.id === pid ? ' selected' : '') + '>' + e(T(x.name)) + '</option>'; }).join('') + '</select></label>' +
            '<label><span>' + e(T('Nights')) + '</span><div class="ns-seg">' + [1, 2, 3, 4].map(function (n) { return '<button data-nights="' + n + '" class="' + (n === st.nights ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div></label>' +
            '<label><span>' + e(T('Season')) + '</span><select data-season>' + Object.keys(NS.SEASONS).map(function (k) { return '<option value="' + k + '"' + (k === st.season ? ' selected' : '') + '>' + e(T(NS.SEASONS[k])) + '</option>'; }).join('') + '</select></label>' +
          '</div>' +
          '<div class="ns-stay-intro"><span class="ns-per-ic big">' + ic(p.icon) + '</span><div><h3>' + e(T(p.name)) + '</h3><p>' + e(st.intro) + '</p>' +
            '<div class="ns-tips">' + st.tips.map(function (t) { return '<span class="ns-tip' + (t.own ? ' own' : '') + '">' + ic(t.icon) + e(t.text) + '</span>'; }).join('') + '</div></div></div>' +
          '<div class="ns-days" role="tablist">' + st.days.map(function (x, k) {
            return '<button role="tab" aria-selected="' + (k === day) + '" class="' + (k === day ? 'on' : '') + '" data-day="' + k + '"><small>' + e(T('Day {n}', { n: k + 1 })) + '</small>' + e(x.title) + '</button>';
          }).join('') + '</div>' +
          '<ol class="ns-tl">' + d.slots.map(function (s, k) {
            var pl = s.place;
            return '<li class="' + (s.hotel ? 'home' : '') + '"><time>' + e(s.time) + '</time><span class="ns-tl-dot" style="' + (s.cat ? '--pin:' + NS.CATS[s.cat].color : '') + '">' + ic(s.icon || 'pin') + '</span>' +
              '<div class="ns-tl-body"><h4>' + e(s.title) + '</h4><p>' + e(s.text) + '</p>' +
              (pl ? '<div class="ns-tl-meta"><span>' + ic('walk') + e(NS.fmtWalk(s.walk)) + '</span><button data-show-place="' + e(pl.id || '') + '">' + ic('map') + e(T('Show on map')) + '</button>' +
                '<a href="' + e(NS.mapsLink(pl, NS.get(data, 'hotel.city', ''))) + '" target="_blank" rel="noopener">' + ic('external') + e(T('Google Maps')) + '</a></div>' : '') + '</div>' +
              (pl && pl.thumb ? '<img class="ns-tl-img" src="' + e(pl.thumb) + '" alt="" loading="lazy">' : '') + '</li>';
          }).join('') + '</ol>' +
          '<div class="ns-stay-foot">' + (d.route && d.route.length > 1 && has('neighborhood') ? '<button class="ns-btn" data-fly="' + day + '">' + ic('route') + e(T('Walk this day on the map')) + '</button>' : '') +
            (rooms.length ? '<span class="ns-stay-room">' + ic('bed') + TH('Our pick for you: {room}', { room: '<b>' + e(TR(rooms[0].name)) + '</b>' }) + '</span>' : '') + bookBtn('primary', 'Book this stay') + '</div>';
      },

      neighborhood: function () {
        var n = data.neighborhood || {}, places = NS.places(data), p = persona();
        var cats = NS.CAT_ORDER.filter(function (c) { return places.some(function (x) { return x.cat === c; }); });
        if (S.filter == null) S.filter = p ? Object.keys(p.w).filter(function (c) { return p.w[c] >= 2 && cats.indexOf(c) >= 0; }) : [];
        var shown = S.filter.length ? places.filter(function (x) { return S.filter.indexOf(x.cat) >= 0; }) : places;
        var landmarks = places.filter(function (x) { return x.wiki && x.wiki.thumb && (x.cat === 'sight' || x.cat === 'museum' || x.cat === 'church' || x.cat === 'culture' || x.cat === 'park'); }).slice(0, 8);
        var groups = (S.filter.length ? S.filter : cats).map(function (c) {
          var xs = shown.filter(function (x) { return x.cat === c; }).sort(function (a, b) { return (b.pinned ? 2 : 0) + (b.wiki ? 1 : 0) - (a.pinned ? 2 : 0) - (a.wiki ? 1 : 0) || a.walk - b.walk; }).slice(0, 6);
          if (!xs.length) return '';
          return '<div class="ns-pg"><h4 style="--pin:' + NS.CATS[c].color + '">' + ic(NS.CATS[c].icon) + e(T(NS.CATS[c].plural).charAt(0).toUpperCase() + T(NS.CATS[c].plural).slice(1)) + '<small>' + places.filter(function (x) { return x.cat === c; }).length + '</small></h4><ul>' +
            xs.map(function (x) { return '<li><button data-show-place="' + e(x.id || '') + '"><b>' + e(x.name) + '</b>' + (x.note ? '<em>' + ic('sparkle') + e(TR(x.note)) + '</em>' : '') + '</button><span>' + e(T('{n} min', { n: x.walk })) + '</span></li>'; }).join('') + '</ul></div>';
        }).join('');
        return head('neighborhood', NS.get(data, 'hotel.area', '') || 'The neighbourhood', n.title || 'Everything is a short walk away', '<p>' + e(TR(n.intro) || NS.draft.neighborhood(data)) + '</p>') +
          '<div class="ns-hood">' +
          '<div class="ns-map-wrap"><div class="ns-map-slot"></div><div class="ns-map-legend"><span>' + ic('compass') + e(T('Drag to turn · tap a pin for details')) + '</span></div></div>' +
          '<div class="ns-hood-side"><div class="ns-filters">' + '<button class="' + (S.filter.length ? '' : 'on') + '" data-cat="">' + e(T('All')) + '</button>' + cats.map(function (c) {
            return '<button class="' + (S.filter.indexOf(c) >= 0 ? 'on' : '') + '" data-cat="' + c + '" style="--pin:' + NS.CATS[c].color + '"><i></i>' + e(T(NS.CATS[c].label)) + '</button>';
          }).join('') + '</div><div class="ns-pgs">' + (groups || '<p class="ns-empty">' + e(T('No places in this filter yet.')) + '</p>') + '</div></div></div>' +
          (landmarks.length ? '<div class="ns-lms">' + landmarks.map(function (x) {
            return '<article class="ns-lm"><img src="' + e(x.wiki.thumb) + '" alt="" loading="lazy"><div><span class="ns-lm-walk">' + ic('walk') + e(T('{n} min', { n: x.walk })) + '</span><h4>' + e(x.name) + '</h4><p>' + e(NS.firstSentence(x.wiki.extract, 150)) + '</p>' +
              (x.wiki.url ? '<a href="' + e(x.wiki.url) + '" target="_blank" rel="noopener">' + e(T('Read more')) + '</a>' : '') + '</div></article>';
          }).join('') + '</div>' : '') +
          (n.credit ? '<p class="ns-small">' + e(n.credit) + '</p>' : '');
      },

      film: function () {
        var vids = (data.videos || []).filter(function (v) { return v && v.src; });
        if (!vids.length) return '';
        var cur = Math.min(S.vid || 0, vids.length - 1), v = vids[cur], vi = NS.videoInfo(mediaSrc(v.src));
        var player = vi.type === 'file'
          ? '<video src="' + e(vi.src) + (v.start ? '#t=' + (+v.start) : '') + '" controls playsinline preload="metadata"' + (v.poster ? ' poster="' + e(mediaSrc(v.poster)) + '"' : '') + '></video>'
          : '<iframe src="' + e(vi.embed) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy" title="' + e(TR(v.title) || T('Video')) + '"></iframe>';
        return head('film', 'Watch', 'See it for yourself', '') +
          '<div class="ns-film-main"><div class="ns-embed">' + player + '</div>' + (v.title || v.text ? '<div class="ns-film-cap"><h3>' + e(TR(v.title || '')) + '</h3><p>' + e(TR(v.text || '')) + (v.credit ? ' <small>' + e(v.credit) + '</small>' : '') + '</p></div>' : '') + '</div>' +
          (vids.length > 1 ? '<div class="ns-tabs">' + vids.map(function (x, k) { return '<button class="' + (k === cur ? 'on' : '') + '" data-vid="' + k + '">' + ic('play') + e(TR(x.title) || T('Video {n}', { n: k + 1 })) + '</button>'; }).join('') + '</div>' : '');
      },

      dining: function () {
        var d = data.dining || {};
        if (!d.name && !d.body) return '';
        var photos = (d.photos || []).filter(Boolean).slice(0, 3);
        return '<div class="ns-dine"><div class="ns-dine-text"><div class="ns-eyebrow">' + e(TR(d.eyebrow || 'Eat & drink')) + '</div><h2>' + e(sectionTitle('dining', d.title || d.name)) + '</h2>' +
          '<div class="ns-prose">' + NS.rich(TR(d.body || '')) + '</div>' +
          ((d.facts || []).length ? '<ul class="ns-facts">' + d.facts.map(function (f) { return '<li>' + ic(f.icon || 'clock') + '<span>' + e(TR(f.text)) + '</span></li>'; }).join('') + '</ul>' : '') +
          '<div class="ns-row">' + (d.link ? '<a class="ns-btn primary" href="' + e(d.link) + '" target="_blank" rel="noopener">' + e(TR(d.link_label || 'See the menu')) + ic('arrow') + '</a>' : '') +
          (d.phone ? '<a class="ns-btn" href="tel:' + e(String(d.phone).replace(/\s+/g, '')) + '">' + ic('phone') + e(T('Reserve a table')) + '</a>' : '') + '</div></div>' +
          '<div class="ns-dine-pics n' + photos.length + '">' + photos.map(function (ph, k) { return '<img src="' + e(mediaSrc(ph)) + '" alt="" loading="lazy" data-lb="dine" data-lb-i="' + k + '">'; }).join('') + '</div></div>';
      },

      reviews: function () {
        var ratings = data.ratings || [], reviews = (data.reviews || []).filter(function (r) { return r && r.quote; });
        if (!ratings.length && !reviews.length) return '';
        return head('reviews', 'Guests say', 'Loved by our guests', '') +
          (ratings.length ? '<div class="ns-scores">' + ratings.map(function (r) {
            return '<a class="ns-score"' + (r.url ? ' href="' + e(r.url) + '" target="_blank" rel="noopener"' : '') + '><b>' + e(r.score) + '<small>/' + e(r.out_of || 10) + '</small></b><span>' + e(r.source) + '</span>' + (r.count ? '<em>' + e(T('{n} reviews', { n: r.count })) + '</em>' : '') + '</a>';
          }).join('') + '</div>' : '') +
          (reviews.length ? '<div class="ns-quotes">' + reviews.map(function (r) {
            return '<blockquote class="ns-quote">' + ic('quote') + '<p>' + e(r.quote) + '</p><footer><b>' + e(r.author || T('A guest')) + '</b>' + (r.source ? ' · ' + e(r.source) : '') + (r.date ? ' · ' + e(r.date) : '') + '</footer></blockquote>';
          }).join('') + '</div>' : '');
      },

      booking: function () {
        var b = data.booking || {}, pay = b.payment || {}, h = data.hotel || {};
        var ch = (b.channels || []).filter(function (c) { return c && (c.url || c.kind === 'phone' || c.kind === 'email'); });
        var chBtns = ch.map(function (c, i) {
          var meta = NS.CHANNELS[c.kind] || NS.CHANNELS.other, url = c.url;
          if (c.kind === 'phone' && !url && h.phone) url = 'tel:' + String(h.phone).replace(/\s+/g, '');
          if (c.kind === 'email' && !url && h.email) url = 'mailto:' + h.email;
          return '<a class="ns-btn' + (i === 0 ? ' primary' : '') + '" href="' + e(url || '#') + '" target="_blank" rel="noopener">' + ic(meta.icon) + e(c.label ? TR(c.label) : T(meta.label)) + '</a>';
        }).join('');
        var methods = (pay.methods || []).map(function (m) { return '<span class="ns-paym">' + ic(m === 'cash' ? 'euro' : 'card') + e(T(NS.PAYMENTS[m] || m)) + '</span>'; }).join('');
        var pol = (b.policies || []).filter(function (x) { return x && x.title; });
        return head('booking', 'Book with confidence', 'How booking and payment work', b.intro ? '<p>' + e(TR(b.intro)) + '</p>' : '') +
          '<ol class="ns-steps">' +
            '<li><span class="ns-step-n">1</span><h3>' + ic('calendar') + e(T('Choose your dates')) + '</h3><p>' + e(TR(b.step1) || T('Check prices and availability on the booking site you trust, or contact us directly.')) + '</p><div class="ns-row wrap">' + chBtns + '</div></li>' +
            '<li><span class="ns-step-n">2</span><h3>' + ic('card') + e(T('Pay the way you like')) + '</h3><p>' + e(TR(pay.when) || T('You pay when you book or at the hotel, depending on the rate you choose.')) + '</p>' + (methods ? '<div class="ns-paylist">' + methods + '</div>' : '') +
              (pay.note ? '<p class="ns-small">' + e(TR(pay.note)) + '</p>' : '') + '</li>' +
            '<li><span class="ns-step-n">3</span><h3>' + ic('key') + e(T('Arrive and relax')) + '</h3><p>' + e(TR(b.step3) || T('Check-in from {in}, check-out until {out}. We will have your room ready.', { 'in': h.checkin || '15:00', out: h.checkout || '12:00' })) + '</p></li>' +
          '</ol>' +
          (requestOn() ? requestForm() : b.perk ? '<div class="ns-perk">' + ic('star') + '<p>' + e(TR(b.perk)) + '</p></div>' : '') +
          (pol.length ? '<div class="ns-pols">' + pol.map(function (x) { return '<div class="ns-pol">' + ic(x.icon || 'info') + '<div><h4>' + e(TR(x.title)) + '</h4><p>' + e(TR(x.text || '')) + '</p></div></div>'; }).join('') + '</div>' : '');
      },

      faq: function () {
        var list = (data.faq && data.faq.length ? data.faq : NS.draft.faq(data)).filter(function (f) { return f && f.q; });
        if (!list.length) return '';
        return head('faq', 'Good to know', 'Questions guests ask', '') +
          '<div class="ns-faq">' + list.map(function (f) { return '<details><summary>' + e(TR(f.q)) + ic('down') + '</summary><div class="ns-prose">' + NS.rich(TR(f.a || '')) + '</div></details>'; }).join('') + '</div>' +
          (askOn() && has('contact') ? '<p class="ns-faq-ask">' + ic('chat') + e(T("Didn't find your answer?")) + ' <a href="#ns-ask">' + e(T('Ask us')) + '</a></p>' : '');
      },

      contact: function () {
        var h = data.hotel || {}, c = data.contact || {};
        var lines = [
          h.address ? '<li>' + ic('pin') + '<span>' + e(h.address) + '</span></li>' : '',
          h.phone ? '<li>' + ic('phone') + '<a href="tel:' + e(String(h.phone).replace(/\s+/g, '')) + '">' + e(h.phone) + '</a></li>' : '',
          h.email ? '<li>' + ic('mail') + '<a href="mailto:' + e(h.email) + '">' + e(h.email) + '</a></li>' : '',
          h.whatsapp ? '<li>' + ic('chat') + '<a href="https://wa.me/' + e(String(h.whatsapp).replace(/\D/g, '')) + '" target="_blank" rel="noopener">WhatsApp</a></li>' : ''].join('');
        var ways = (c.directions || []).filter(function (x) { return x && x.title; });
        return head('contact', 'Find us', 'Getting here', '') +
          '<div class="ns-contact"><div class="ns-card"><h3>' + e(h.name || '') + '</h3><ul class="ns-lines">' + lines + '</ul>' +
          (h.lat != null ? '<a class="ns-btn primary" href="' + e(NS.directions(h.lat, h.lng)) + '" target="_blank" rel="noopener">' + ic('route') + e(T('Directions')) + '</a>' : '') +
          ((c.social || []).length ? '<div class="ns-social">' + c.social.map(function (s) { return '<a href="' + e(s.url) + '" target="_blank" rel="noopener">' + e(s.label) + '</a>'; }).join('') + '</div>' : '') + '</div>' +
          (ways.length ? '<div class="ns-ways">' + ways.map(function (w) { return '<div class="ns-way">' + ic(w.icon || 'route') + '<div><h4>' + e(TR(w.title)) + '</h4><p>' + e(TR(w.text || '')) + '</p></div></div>'; }).join('') + '</div>' : '') + '</div>' + askForm();
      }
    };
    /* "Ask us a question": posts to opts.ask (GuestQuestions.py); the owner answers by email from their inbox. */
    function askForm() {
      if (!askOn()) return '';
      var hn = NS.get(data, 'hotel.name', '') || T('the hotel');
      return '<div class="ns-ask" id="ns-ask"><div class="ns-ask-head">' + ic('chat') + '<div><h3>' + e(T('Ask us a question')) + '</h3><p>' + e(T('We usually answer within a day, by email.')) + '</p></div></div>' +
        '<form class="ns-ask-form" data-ask novalidate><div class="ns-ask-row">' +
        '<label><span>' + e(T('Your name')) + '</span><input name="name" autocomplete="name" maxlength="80"></label>' +
        '<label><span>' + e(T('Your email')) + '</span><input name="email" type="email" autocomplete="email" required maxlength="200"></label></div>' +
        '<label><span>' + e(T('Your question')) + '</span><textarea name="message" rows="4" required maxlength="2000"></textarea></label>' +
        '<label class="ns-hp" aria-hidden="true">Website <input name="website" tabindex="-1" autocomplete="off"></label>' +
        '<p class="ns-ask-msg" role="status" aria-live="polite"></p>' +
        '<div class="ns-ask-foot"><button class="ns-btn primary" type="submit">' + e(T('Send question')) + ic('arrow') + '</button>' +
        '<small>' + e(T('Your message goes only to {hotel}, who use your email to reply.', { hotel: hn })) + '</small></div></form></div>';
    }
    /* "Ask us for your dates" (booking.request.on): an enquiry, not a booking, so guests still book on the OTA buttons
       above it if they prefer. Posts to opts.ask with kind 'dates' (GuestQuestions.accept); the owner replies with a price
       from the #questions inbox. The perk shows here, beside the form. */
    function isoDay(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function requestForm() {
      var b = data.booking || {}, p = persona(), rooms = (data.rooms || []).filter(function (r) { return r && r.name; });
      var nights = S.nights || (p && p.nights) || 2;
      var range = function (a, z, cur) {
        var s = '';
        for (var i = a; i <= z; i++) s += '<option value="' + i + '"' + (i === cur ? ' selected' : '') + '>' + i + '</option>';
        return s;
      };
      var lead = TR(NS.get(data, 'booking.request.note', '')) || T('Tell us when you would like to come. We email you our best direct price, usually within a day.');
      return '<div class="ns-request" id="ns-request">' + NS.orn.corner('tl') + NS.orn.corner('tr') +
        '<div class="ns-request-head">' + ic('calendar') + '<div><h3>' + e(T('Ask us for your dates')) + '</h3><p>' + e(lead) + '</p></div></div>' +
        (b.perk ? '<p class="ns-request-perk">' + ic('star') + '<span><b>' + e(T('Book direct')) + '</b> ' + e(TR(b.perk)) + '</span></p>' : '') +
        '<form class="ns-ask-form ns-request-form" data-request-form novalidate><div class="ns-request-grid">' +
        '<label class="w2"><span>' + e(T('Arrival')) + '</span><input type="date" name="arrive" required min="' + isoDay(new Date()) + '"></label>' +
        '<label><span>' + e(T('Nights')) + '</span><select name="nights">' + range(1, 30, nights) + '</select></label>' +
        '<label><span>' + e(T('Adults')) + '</span><select name="adults">' + range(1, 10, 2) + '</select></label>' +
        '<label><span>' + e(T('Children')) + '</span><select name="children">' + range(0, 8, 0) + '</select></label>' +
        '<label class="w3"><span>' + e(T('Room')) + '</span><select name="room"><option value="">' + e(T('Any room')) + '</option>' +
          rooms.map(function (r) { return '<option value="' + e(r.name) + '">' + e(TR(r.name)) + '</option>'; }).join('') + '</select></label>' +
        '<label class="w2"><span>' + e(T('Your name')) + '</span><input name="name" autocomplete="name" maxlength="80" required></label>' +
        '<label class="w2"><span>' + e(T('Your email')) + '</span><input name="email" type="email" autocomplete="email" maxlength="200" required></label>' +
        '<label class="w2"><span>' + e(T('Phone (optional)')) + '</span><input name="phone" type="tel" autocomplete="tel" maxlength="40"></label></div>' +
        '<label><span>' + e(T('Anything we should know? (optional)')) + '</span><textarea name="note" rows="3" maxlength="1500"></textarea></label>' +
        '<label class="ns-hp" aria-hidden="true">Website <input name="website" tabindex="-1" autocomplete="off"></label>' +
        '<p class="ns-ask-msg" role="status" aria-live="polite"></p>' +
        '<div class="ns-ask-foot"><button class="ns-btn primary" type="submit">' + e(T('Ask for a price')) + ic('arrow') + '</button>' +
        '<small>' + e(T('Not a booking yet: you decide once you have our offer.')) + ' ' + e(T('Your message goes only to {hotel}, who use your email to reply.', { hotel: hotelName() })) + '</small></div></form></div>';
    }
    /* The thank-you sheet (#thanks, from the check-out QR card). Review places and the private note sit side by side, so
       every guest sees the same choices (no review gating). Works with nothing set: thanks + the private note. */
    function reviewLinks() {
      var g = NS.get(data, 'booking.after.google_review', ''), out = [];
      if (g && /^https?:\/\//i.test(g)) out.push({ label: 'Google', url: g });
      (data.ratings || []).forEach(function (r) {
        if (r && r.url && /^https?:\/\//i.test(r.url) && !out.some(function (x) { return x.url === r.url; })) out.push({ label: r.source || 'Reviews', url: r.url });
      });
      return out;
    }
    function returnCode() { return String(NS.get(data, 'booking.after.return_code', '') || '').trim().toUpperCase().slice(0, 24); }
    function thanksHtml() {
      var h = data.hotel || {}, revs = reviewLinks(), code = returnCode(), perk = NS.get(data, 'booking.after.return_perk', '');
      var priv = askOn() && has('contact') ? '<button class="ns-btn" type="button" data-thanks-ask>' + ic('chat') + e(T('Write to us')) + '</button>'
        : h.email ? '<a class="ns-btn" href="mailto:' + e(h.email) + '">' + ic('mail') + e(T('Write to us')) + '</a>'
        : h.phone ? '<a class="ns-btn" href="tel:' + e(String(h.phone).replace(/\s+/g, '')) + '">' + ic('phone') + e(h.phone) + '</a>' : '';
      var cards = (revs.length ? '<section class="ns-thanks-card"><h3>' + ic('star') + e(T('Tell others about your stay')) + '</h3><p>' + e(T('A few words on any of these sites helps a small hotel more than you think.')) + '</p>' +
          '<div class="ns-thanks-revs">' + revs.map(function (r) { return '<a class="ns-btn" href="' + e(r.url) + '" target="_blank" rel="noopener">' + e(r.label) + ic('external') + '</a>'; }).join('') + '</div></section>' : '') +
        (priv ? '<section class="ns-thanks-card"><h3>' + ic('heart') + e(T('Tell us privately')) + '</h3><p>' + e(T('Something we could do better, or a thank-you just for us? Only {hotel} reads it.', { hotel: hotelName() })) + '</p>' +
          '<div class="ns-thanks-revs">' + priv + '</div></section>' : '');
      var back = perk || code ? '<div class="ns-thanks-back"><h3>' + ic('key') + e(T('Come back direct')) + '</h3>' + (perk ? '<p>' + e(TR(perk)) + '</p>' : '') +
        '<div class="ns-thanks-act">' + (code ? '<div class="ns-code"><span>' + e(T('Your code')) + '</span><b>' + e(code) + '</b><button class="ns-btn sm" type="button" data-copy-code="' + e(code) + '">' + ic('copy') + '<span>' + e(T('Copy')) + '</span></button></div>' : '') +
        (requestHere() ? '<button class="ns-btn primary" type="button" data-request data-request-code="' + e(code) + '">' + ic('calendar') + e(T('Ask for your dates')) + '</button>' : '') + '</div></div>' : '';
      return '<div class="ns-thanks" lang="' + NS.lang + '"><div class="ns-thanks-head">' + NS.orn.monogram(h.name) + '<h2>' + e(T('Thank you for staying with us')) + '</h2>' +
        (h.name ? '<p>' + e(h.name) + '</p>' : '') + NS.orn.divider() + '</div>' +
        (cards ? '<div class="ns-thanks-grid' + (revs.length && priv ? ' two' : '') + '">' + cards + '</div>' : '') + back + '</div>';
    }
    function showThanks() {
      if (S.thanks) S.thanks.close();
      var m = S.thanks = NS.Modal(thanksHtml());
      m.el.classList.add('ns-thanks-modal');
      m.onclose = function () {
        S.thanks = null;
        if (opts.mode !== 'preview' && /^#thanks/.test(location.hash)) { try { history.replaceState(null, '', location.pathname + location.search); } catch (x) {} }
      };
      var first = m.el.querySelector('.ns-thanks a, .ns-thanks button');
      if (first) { try { first.focus({ preventScroll: true }); } catch (x) {} }
      return m;
    }
    function closeThanks() { if (S.thanks) S.thanks.close(); }
    function goTo(id, field, value) {
      var el = root.querySelector('#' + id);
      if (!el) return false;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var f = field && el.querySelector('[name="' + field + '"]');
      if (f) {
        if (value != null && !f.value) f.value = value;
        setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (x) {} }, 450);
      }
      return true;
    }
    function langSwitch(cls) {
      var ls = NS.siteLangs(data);
      if (ls.length < 2) return '';
      return '<div class="ns-langs ' + (cls || '') + '" role="group" aria-label="' + e(T('Language')) + '">' + ls.map(function (c) {
        return '<button type="button" data-lang="' + c + '" lang="' + c + '" class="' + (c === NS.lang ? 'on' : '') + '" aria-pressed="' + (c === NS.lang) + '" title="' + e(NS.LANGS[c].name) + '">' + NS.LANGS[c].short + '</button>';
      }).join('') + '</div>';
    }
    var PERSONA_SECTIONS = ['hero', 'personas', 'highlights', 'rooms', 'stay', 'neighborhood'];
    function has(id) { return enabledSections().some(function (s) { return s.id === id; }); }

    /* ---------------------------------------------------------------- frame: nav, footer, theme */
    function nav() {
      var h = data.hotel || {}, p = persona();
      var links = [['rooms', 'Rooms'], ['stay', 'Your stay'], ['neighborhood', 'Neighbourhood'], ['booking', 'Booking']].filter(function (l) { return has(l[0]); })
        .map(function (l) { return [l[0], e(T(l[1]))]; });
      return '<nav class="ns-nav" aria-label="Site"><div class="ns-nav-in"><a class="ns-brand" href="#ns-top">' + NS.orn.monogram(h.name) + '<span>' + e(h.name || 'Hotel') + '</span></a>' +
        '<div class="ns-links">' + links.map(function (l) { return '<a href="#ns-' + l[0] + '">' + l[1] + '</a>'; }).join('') + '</div>' +
        langSwitch('wide') +
        (p ? '<button class="ns-pill" data-persona="" title="' + e(T('Show everything')) + '">' + ic(p.icon) + '<span>' + e(T(p.name)) + '</span>' + ic('x') + '</button>' : '') +
        bookBtn('primary sm', 'Book') + '<button class="ns-burger" data-burger aria-label="' + e(T('Menu')) + '">' + ic('menu') + '</button></div>' +
        '<div class="ns-sheet" data-sheet hidden>' + links.map(function (l) { return '<a href="#ns-' + l[0] + '">' + l[1] + '</a>'; }).join('') +
        (has('personas') ? '<a href="#ns-personas">' + e(T('Who is coming?')) + '</a>' : '') + (has('contact') ? '<a href="#ns-contact">' + e(T('Contact')) + '</a>' : '') + langSwitch('in-sheet') + '</div></nav>';
    }
    function footer() {
      var h = data.hotel || {}, credits = (data.credits || []).filter(function (c) { return c && c.text; });
      var pl = opts.platform || { name: 'ArviStay' };
      return '<footer class="ns-foot">' + NS.orn.divider() + '<div class="ns-foot-in"><div>' + NS.orn.monogram(h.name) + '<b>' + e(h.name || '') + '</b><p>' + e([h.address, h.phone].filter(Boolean).join(' · ')) + '</p></div>' +
        (credits.length ? '<details class="ns-credits"><summary>' + e(T('Photo and data credits')) + '</summary><ul>' + credits.map(function (c) {
          return '<li>' + (c.url ? '<a href="' + e(c.url) + '" target="_blank" rel="noopener">' + e(c.text) + '</a>' : e(c.text)) + '</li>';
        }).join('') + '</ul></details>' : '') +
        '<p class="ns-made">© ' + new Date().getFullYear() + ' ' + e(h.name || '') + ' · ' + TH('Website made with {platform}', { platform: pl.url ? '<a href="' + e(pl.url) + '" target="_blank" rel="noopener">' + e(pl.name) + '</a>' : e(pl.name) }) + '</p></div></footer>';
    }
    function applyTheme() {
      var t = data.theme || {}, pal = NS.PALETTES[t.palette] || NS.PALETTES.riga, f = NS.FONTS[t.fonts] || NS.FONTS.belle;
      var c = pal.c, st = root.style;
      st.setProperty('--b', c.bg); st.setProperty('--s', c.surface); st.setProperty('--i', c.ink); st.setProperty('--m', c.muted);
      st.setProperty('--l', c.line); st.setProperty('--p', c.brand); st.setProperty('--pi', c.brandInk); st.setProperty('--a', c.accent);
      st.setProperty('--so', c.soft); st.setProperty('--d', c.deep);
      st.setProperty('--fd', '"' + f.display + '", Georgia, serif'); st.setProperty('--fb', NS.bodyStack(t.fonts));
      root.setAttribute('data-orn', t.ornament || 'rich');
      root.setAttribute('data-dark', pal.dark ? '1' : '0');
      root.setAttribute('data-fonts', t.fonts || 'belle');
      root.classList.add('ns');
      if (opts.mode !== 'preview' && document.body === root.parentNode) document.body.style.background = c.bg;
      NS.fontsUrls(t.fonts).concat(['']).slice(0, 2).forEach(function (href, i) {
        var lid = 'ns-fonts' + (i ? '2' : ''), link = document.getElementById(lid);
        if (!href) { if (link) link.remove(); return; }
        if (!link) { link = document.createElement('link'); link.id = lid; link.rel = 'stylesheet'; document.head.appendChild(link); }
        if (link.getAttribute('href') !== href) link.setAttribute('href', href);
      });
      document.documentElement.style.background = c.bg;
    }

    /* ---------------------------------------------------------------- draw + wire */
    function sectionHtml(id) {
      var html = '';
      try { html = SECTIONS[id](); } catch (err) { console.error('section ' + id, err); html = ''; }
      if (!html) return '';
      return '<section class="ns-sec ns-s-' + id + '" id="ns-' + id + '" data-sec="' + id + '">' +
        (opts.mode === 'preview' ? '<button class="ns-edit" data-edit="' + id + '">' + ic('sparkle') + 'Edit ' + e((NS.SECTIONS.filter(function (s) { return s.id === id; })[0] || {}).label || id) + '</button>' : '') +
        '<div class="ns-sec-in">' + html + '</div></section>';
    }
    function destroyWidgets() {
      S.widgets.forEach(function (w) { try { w.destroy && w.destroy(); } catch (x) {} });
      S.widgets = [];
    }
    function draw() {
      var y = window.scrollY;
      NS.setLang(NS.siteLangs(data).indexOf(NS.lang) >= 0 || opts.mode === 'preview' ? NS.lang : 'en', data);
      try { document.documentElement.lang = NS.lang; } catch (x) {}
      destroyWidgets();
      applyTheme();
      root.innerHTML = '<div id="ns-top"></div>' + nav() + '<main class="ns-main">' + enabledSections().map(function (s) { return sectionHtml(s.id); }).join('') + '</main>' + footer();
      wireAll(root);
      if (opts.mode === 'preview') window.scrollTo(0, y);
    }
    function redrawSection(id) {
      var old = root.querySelector('[data-sec="' + id + '"]');
      if (!old) return;
      var tmp = document.createElement('div');
      tmp.innerHTML = sectionHtml(id);
      var fresh = tmp.firstChild;
      if (!fresh) { old.remove(); return; }
      old.parentNode.replaceChild(fresh, old);
      wireAll(fresh);
    }
    function redrawPersonaParts() {
      PERSONA_SECTIONS.forEach(function (id) { if (id !== 'neighborhood' && id !== 'hero') redrawSection(id); });
      var heroFor = root.querySelector('.ns-hero-for');
      var p = persona();
      if (heroFor || p) {
        var line = root.querySelector('.ns-hero-line');
        if (heroFor) heroFor.remove();
        if (p && line) line.insertAdjacentHTML('afterend', heroFor(p));
      }
      S.filter = null;
      redrawSection('neighborhood');
      var navEl = root.querySelector('.ns-nav');
      if (navEl) { var t = document.createElement('div'); t.innerHTML = nav(); navEl.parentNode.replaceChild(t.firstChild, navEl); wireNav(); }
    }

    function setPersona(id) {
      S.persona = id && NS.persona(id) ? id : null;
      S.nights = null; S.day = 0;
      try { sessionStorage.setItem('ns.persona.' + (opts.slug || ''), S.persona || ''); } catch (x) {}
      if (opts.mode === 'live' || opts.mode === 'export') {
        try { history.replaceState(null, '', S.persona ? '#for=' + S.persona : location.pathname + location.search); } catch (x) {}
      }
      if (S.persona && opts.stats) ping('p', S.persona);
      redrawPersonaParts();
    }
    function setLang(code) {
      NS.setLang(code, data);
      if (opts.mode !== 'preview') {
        try { localStorage.setItem('ns.lang.' + (opts.slug || ''), NS.lang); } catch (x) {}
        try {
          var q = location.search.replace(/([?&])lang=[a-z]{2}&?/, '$1').replace(/[?&]$/, '');
          q = NS.lang === 'en' ? q : q + (q ? '&' : '?') + 'lang=' + NS.lang;
          history.replaceState(null, '', location.pathname + q + location.hash);
        } catch (x) {}
        if (data.seo && data.seo.title) document.title = TR(data.seo.title);
      }
      draw();
    }
    function ping(ev, p) {
      if (!opts.stats || !opts.slug) return;
      try { new Image().src = opts.stats + '?s=' + encodeURIComponent(opts.slug) + '&e=' + ev + (p ? '&p=' + encodeURIComponent(p) : '') + '&r=' + Math.random().toString(36).slice(2, 8); } catch (x) {}
    }

    function wireNav() {
      var b = root.querySelector('[data-burger]'), sheet = root.querySelector('[data-sheet]');
      if (b && sheet) b.onclick = function () { sheet.hidden = !sheet.hidden; };
      if (sheet) sheet.onclick = function (ev) { if (ev.target.closest('a')) sheet.hidden = true; };
    }
    function wireAll(scope) {
      if (scope === root) wireNav();
      // hero video segment loop + film
      Array.prototype.forEach.call(scope.querySelectorAll('video[data-end]'), function (v) {
        var st = +v.getAttribute('data-start') || 0, en = +v.getAttribute('data-end') || 0;
        if (en > st) v.addEventListener('timeupdate', function () { if (v.currentTime > en || v.currentTime < st - 1) v.currentTime = st; });
      });
      var film = scope.querySelector('[data-film]');
      if (film) {
        var items = (NS.get(data, 'hero.film', []) || []).filter(Boolean);
        if (!items.length) items = (NS.get(data, 'gallery.items', []) || []).slice(0, 6).map(function (x) { return x.src; });
        if (items.length) S.widgets.push(NS.Film(film, items.map(function (x) { return typeof x === 'string' ? { src: mediaSrc(x) } : { src: mediaSrc(x.src), caption: x.caption }; })));
      }
      Array.prototype.forEach.call(scope.querySelectorAll('[data-carousel]'), function (car) { S.widgets.push(NS.Carousel(car)); });
      var pano = scope.querySelector('[data-pano]');
      if (pano) S.widgets.push(NS.Pano(pano, pano.getAttribute('data-pano')));
      var slot = scope.querySelector('.ns-map-slot');
      if (slot) mountMap(slot);
      if (opts.mode === 'live' && 'IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (ents) { ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
        Array.prototype.forEach.call(scope.querySelectorAll('.ns-sec'), function (s) { s.classList.add('reveal'); io.observe(s); });
        if (scope.classList && scope.classList.contains('ns-sec')) { scope.classList.add('reveal'); io.observe(scope); }
      }
    }

    function mapPlaces() {
      var places = NS.places(data);
      if (S.filter && S.filter.length) return places.filter(function (x) { return S.filter.indexOf(x.cat) >= 0; });
      // "All": the starred places, the landmarks and the nearest few of each kind, so the map stays readable.
      var per = {};
      return places.filter(function (x) {
        if (x.pinned || x.wiki) return true;
        per[x.cat] = (per[x.cat] || 0) + 1;
        return per[x.cat] <= 3 && x.cat !== 'essentials';
      }).slice(0, 70);
    }
    function mountMap(slot) {
      var h = data.hotel || {};
      if (h.lat == null) { slot.innerHTML = '<p class="ns-empty">The map appears once the hotel has an address.</p>'; return; }
      if (!S.mapEl) {
        S.mapEl = document.createElement('div');
        S.mapEl.className = 'ns-map';
        slot.appendChild(S.mapEl);
        S.map = NS.Map(S.mapEl, { hotel: h, palette: NS.PALETTES[NS.get(data, 'theme.palette', 'riga')] || NS.PALETTES.riga, lib: opts.lib, noMap: opts.noMap,
          onPick: function (pl) { highlightPlace(pl); }, name: h.name });
      } else {
        slot.appendChild(S.mapEl);
        if (S.map) { S.map.setHotel(h, NS.PALETTES[NS.get(data, 'theme.palette', 'riga')] || NS.PALETTES.riga); S.map.resize(); }
      }
      if (S.map) S.map.setPlaces(mapPlaces());
    }
    function highlightPlace(pl) {
      var btns = root.querySelectorAll('[data-show-place="' + (pl.id || '') + '"]');
      Array.prototype.forEach.call(root.querySelectorAll('.ns-pgs .on'), function (x) { x.classList.remove('on'); });
      Array.prototype.forEach.call(btns, function (b) { if (b.closest('.ns-pgs')) b.classList.add('on'); });
    }

    /* ---------------------------------------------------------------- clicks (one listener for the whole site) */
    function onClick(ev) {
      var t = ev.target;
      var edit = t.closest('[data-edit]');
      if (edit) { ev.preventDefault(); if (opts.onEdit) opts.onEdit(edit.getAttribute('data-edit')); return; }
      var a = t.closest('a[href^="#ns-"]');
      if (a) {
        var target = root.querySelector(a.getAttribute('href'));
        if (target) { ev.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        return;
      }
      var per = t.closest('[data-persona]');
      if (per) { setPersona(per.getAttribute('data-persona')); return; }
      var lg = t.closest('[data-lang]');
      if (lg) { setLang(lg.getAttribute('data-lang')); return; }
      if (t.closest('[data-ask-again]')) { redrawSection('contact'); var af = root.querySelector('#ns-ask input'); if (af) af.focus(); return; }
      if (t.closest('[data-request-again]')) { redrawSection('booking'); goTo('ns-request', 'arrive'); return; }
      var rr = t.closest('[data-request-room]');
      if (rr) {
        var rsel = root.querySelector('#ns-request select[name="room"]');
        if (rsel) rsel.value = rr.getAttribute('data-request-room');
        goTo('ns-request', 'arrive');
        return;
      }
      var rq = t.closest('[data-request]');
      if (rq) {
        var rcode = rq.getAttribute('data-request-code');
        closeThanks();
        goTo('ns-request', rcode ? 'note' : 'arrive', rcode ? T('Come-back code: {code}', { code: rcode }) : null);
        return;
      }
      if (t.closest('[data-thanks-ask]')) { closeThanks(); goTo('ns-ask', 'message'); return; }
      var cc = t.closest('[data-copy-code]');
      if (cc) { copyText(cc.getAttribute('data-copy-code'), cc); return; }
      var lb = t.closest('[data-lb]');
      if (lb) {
        var group = lb.getAttribute('data-lb'), imgs = root.querySelectorAll('[data-lb="' + group + '"]');
        NS.Lightbox(Array.prototype.map.call(imgs, function (im) { return { src: im.currentSrc || im.src, caption: im.alt || (im.nextElementSibling && im.nextElementSibling.textContent) || '' }; }), +lb.getAttribute('data-lb-i') || 0);
        return;
      }
      var room;
      if ((room = t.closest('[data-room-photos]'))) {
        var r = (data.rooms || []).filter(function (x) { return x && x.name; })[+room.getAttribute('data-room-photos')];
        NS.Lightbox((r.photos || []).map(function (p) { return { src: mediaSrc(p), caption: TR(r.name) }; }), 0); return;
      }
      if ((room = t.closest('[data-room-pano]'))) {
        var r2 = roomAt(room.getAttribute('data-room-pano'));
        var m = NS.Modal('<div class="ns-pano tall" data-pano></div><p class="ns-wt-note">' + e(T('{room}: drag to look around.', { room: TR(r2.name) })) + '</p>');
        var pw = NS.Pano(m.el.querySelector('[data-pano]'), mediaSrc(r2.pano)); m.onclose = function () { pw.destroy(); }; return;
      }
      if ((room = t.closest('[data-room-tour]'))) {
        var r3 = roomAt(room.getAttribute('data-room-tour'));
        NS.Modal('<div class="ns-embed"><iframe src="' + e(NS.videoInfo(r3.tour).embed || r3.tour) + '" allow="fullscreen; xr-spatial-tracking" allowfullscreen title="' + e(T('3D tour')) + '"></iframe></div>'); return;
      }
      if ((room = t.closest('[data-room-video]'))) {
        var r4 = roomAt(room.getAttribute('data-room-video')), vi = NS.videoInfo(mediaSrc(r4.video));
        NS.Modal('<div class="ns-embed">' + (vi.type === 'file' ? '<video src="' + e(vi.src) + '" controls autoplay playsinline></video>' : '<iframe src="' + e(vi.embed) + '" allow="autoplay; fullscreen" allowfullscreen title="' + e(T('Room video')) + '"></iframe>') + '</div>'); return;
      }
      var car = t.closest('[data-car]');
      if (car) { var c = car.closest('.ns-room-media').querySelector('[data-carousel]'); if (c && c._car) c._car.step(+car.getAttribute('data-car')); return; }
      var wt = t.closest('[data-wt]');
      if (wt) { S.wt = +wt.getAttribute('data-wt'); S.stop = 0; redrawSection('walkthrough'); return; }
      var stop = t.closest('[data-stop]');
      if (stop) { S.stop = Math.max(0, (S.stop || 0) + (+stop.getAttribute('data-stop'))); redrawSection('walkthrough'); return; }
      var vid = t.closest('[data-vid]');
      if (vid) { S.vid = +vid.getAttribute('data-vid'); redrawSection('film'); return; }
      var nn = t.closest('[data-nights]');
      if (nn) { S.nights = +nn.getAttribute('data-nights'); S.day = 0; redrawSection('stay'); return; }
      var dd = t.closest('[data-day]');
      if (dd) { S.day = +dd.getAttribute('data-day'); redrawSection('stay'); if (S.map && S.story) S.map.showRoute(S.story.days[S.day].route, false); return; }
      var cat = t.closest('[data-cat]');
      if (cat) {
        var k = cat.getAttribute('data-cat');
        if (!k) S.filter = [];
        else { S.filter = (S.filter || []).slice(); var ix = S.filter.indexOf(k); if (ix >= 0) S.filter.splice(ix, 1); else S.filter.push(k); }
        redrawSection('neighborhood');
        return;
      }
      var show = t.closest('[data-show-place]');
      if (show) {
        var id = show.getAttribute('data-show-place'), pl = NS.places(data).filter(function (x) { return String(x.id) === id; })[0];
        if (pl && S.map) {
          var hood = root.querySelector('#ns-neighborhood');
          if (show.closest('.ns-s-stay') && hood) hood.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(function () { S.map.focus(pl); highlightPlace(pl); }, show.closest('.ns-s-stay') ? 600 : 0);
        }
        return;
      }
      var fly = t.closest('[data-fly]');
      if (fly && S.story && S.map) {
        var route = S.story.days[+fly.getAttribute('data-fly')].route;
        var hood2 = root.querySelector('#ns-neighborhood');
        if (hood2) hood2.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(function () { S.map.showRoute(route, true); }, 700);
        return;
      }
      var fs = t.closest('[data-fs]');
      if (fs) { var pe = fs.closest('.ns-pano'); if (pe && pe.requestFullscreen) pe.requestFullscreen(); return; }
    }
    function roomAt(i) { return (data.rooms || []).filter(function (x) { return x && x.name; })[+i]; }
    /* The come-back code: the clipboard where allowed, else a hidden field + execCommand (older phones, http pages). */
    function copyText(text, btn) {
      var done = function () { var s = btn.querySelector('span'); if (s) s.textContent = T('Copied'); btn.classList.add('ok'); };
      var fallback = function () {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (x) {}
        ta.remove();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    }
    function onChange(ev) {
      var t = ev.target;
      if (t.matches('[data-stay-persona]')) { S.persona = t.value; S.nights = null; S.day = 0; redrawPersonaParts(); var st = root.querySelector('#ns-stay'); if (st) st.scrollIntoView({ block: 'start' }); if (opts.stats) ping('p', t.value); }
      if (t.matches('[data-season]')) { S.season = t.value; redrawSection('stay'); }
    }
    /* The date request: checked here (past dates refused, translated), then again on the server. */
    function submitRequest(f) {
      var field = function (n) { return f.elements.namedItem(n); }, val = function (n) { return String(field(n).value || '').trim(); };
      var msg = f.querySelector('.ns-ask-msg'), btn = f.querySelector('[type=submit]');
      var say = function (text, bad) { msg.textContent = text; msg.className = 'ns-ask-msg' + (bad ? ' bad' : ''); };
      var arrive = val('arrive'), today = isoDay(new Date()), email = val('email'), name = val('name');
      var limit = new Date(); limit.setDate(limit.getDate() + 730);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(arrive) || arrive < today || arrive > isoDay(limit)) { say(T('Please check your dates.'), true); field('arrive').focus(); return; }
      if (!name) { say(T('Please tell us your name.'), true); field('name').focus(); return; }
      if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) { say(T('Please check your email address.'), true); field('email').focus(); return; }
      if (!opts.ask || opts.mode === 'preview') { say(T('The form works on the published site.'), true); return; }
      var failed = function () { btn.disabled = false; say(T('Sorry, the request could not be sent. Please email us instead.'), true); };
      btn.disabled = true; say(T('Sending…'));
      fetch(opts.ask, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify({
        s: opts.slug, kind: 'dates', name: name, email: email, message: val('note'), lang: NS.lang, persona: S.persona || '',
        details: { arrive: arrive, nights: +val('nights') || 1, adults: +val('adults') || 1, children: +val('children') || 0, room: val('room'), phone: val('phone') },
        hp: field('website').value, t: Date.now() - S.askOpened }) })
        .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'server' }; }); })
        .then(function (r) {
          if (r && r.ok) {
            f.outerHTML = '<div class="ns-ask-done ns-request-done" role="status">' + ic('check') + '<p>' + e(T('Thank you!')) + ' ' + e(T('{hotel} will email you a price for your dates soon.', { hotel: hotelName() })) + '</p>' +
              '<button class="ns-btn sm" type="button" data-request-again>' + e(T('Ask about other dates')) + '</button></div>';
            return;
          }
          btn.disabled = false;
          var err = r && r.error;
          say(T(err === 'dates' ? 'Please check your dates.' : err === 'email' ? 'Please check your email address.' :
            err === 'busy' ? 'Too many requests right now. Please try again later, or email us.' :
            err === 'closed' ? 'This form is closed right now. Please email us instead.' : 'Sorry, the request could not be sent. Please email us instead.'), true);
        }, failed);
    }
    function onSubmit(ev) {
      var rf = ev.target.closest && ev.target.closest('[data-request-form]');
      if (rf) { ev.preventDefault(); submitRequest(rf); return; }
      var f = ev.target.closest && ev.target.closest('[data-ask]');
      if (!f) return;
      ev.preventDefault();
      var field = function (n) { return f.elements.namedItem(n); };
      var msg = f.querySelector('.ns-ask-msg'), btn = f.querySelector('[type=submit]');
      var say = function (text, bad) { msg.textContent = text; msg.className = 'ns-ask-msg' + (bad ? ' bad' : ''); };
      var email = field('email').value.trim(), message = field('message').value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) { say(T('Please check your email address.'), true); field('email').focus(); return; }
      if (message.length < 5) { say(T('Please write a little more.'), true); field('message').focus(); return; }
      if (!opts.ask || opts.mode === 'preview') { say(T('The form works on the published site.'), true); return; }
      var failed = function () { btn.disabled = false; say(T('Sorry, the question could not be sent. Please email us instead.'), true); };
      btn.disabled = true; say(T('Sending…'));
      fetch(opts.ask, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify({
        s: opts.slug, name: field('name').value.trim(), email: email, message: message, lang: NS.lang, persona: S.persona || '',
        hp: field('website').value, t: Date.now() - S.askOpened }) })
        .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'server' }; }); })
        .then(function (r) {
          if (r && r.ok) {
            f.outerHTML = '<div class="ns-ask-done" role="status">' + ic('check') + '<p>' + e(T('Thank you! {hotel} will answer you by email soon.', { hotel: NS.get(data, 'hotel.name', '') || T('the hotel') })) + '</p>' +
              '<button class="ns-btn sm" type="button" data-ask-again>' + e(T('Ask another question')) + '</button></div>';
            return;
          }
          btn.disabled = false;
          var err = r && r.error;
          say(T(err === 'email' ? 'Please check your email address.' : err === 'message' ? 'Please write a little more.' :
            err === 'busy' ? 'Too many questions right now. Please try again later, or email us.' : 'Sorry, the question could not be sent. Please email us instead.'), true);
        }, failed);
    }
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('submit', onSubmit);

    draw();
    if (opts.mode !== 'preview' && /^#thanks\b/.test(location.hash)) setTimeout(showThanks, 60);   // the check-out QR card
    if (opts.mode === 'live') ping('view');
    if (S.persona && opts.mode !== 'preview') setTimeout(function () { var el = root.querySelector('#ns-stay'); if (el && location.hash.indexOf('for=') >= 0) el.scrollIntoView(); }, 400);

    return {
      update: function (d) { data = S.data = d; S.filter = null; draw(); },
      setPersona: setPersona,
      setLang: setLang,
      showThanks: showThanks,
      scrollTo: function (id) { var el = root.querySelector('#ns-' + id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
      state: S,
      destroy: function () { destroyWidgets(); if (S.map) S.map.destroy(); root.removeEventListener('click', onClick); root.removeEventListener('change', onChange); root.removeEventListener('submit', onSubmit); root.innerHTML = ''; }
    };
  };

  /* A hosted or exported page: <div id="ns-root"></div> then NSSite.boot(data, opts). */
  NS.boot = function (data, opts) {
    var root = document.getElementById('ns-root') || document.body.appendChild(document.createElement('div'));
    NS.site = NS.mount(root, data, opts || {});
    return NS.site;
  };

  /* Preview inside the app's editor: the parent posts {type: 'ns-data', data, opts} messages. */
  NS.previewListen = function (opts) {
    window.addEventListener('message', function (ev) {
      var m = ev.data || {};
      if (m.type === 'ns-data') {
        if (!NS.site) NS.site = NS.mount(document.getElementById('ns-root'), m.data, Object.assign({}, opts, m.opts || {}, {
          mode: 'preview', onEdit: function (id) { parent.postMessage({ type: 'ns-edit', section: id }, '*'); } }));
        else NS.site.update(m.data);
        parent.postMessage({ type: 'ns-drawn' }, '*');
      }
      if (m.type === 'ns-scroll' && NS.site) NS.site.scrollTo(m.section);
      if (m.type === 'ns-persona' && NS.site) NS.site.setPersona(m.persona);
      if (m.type === 'ns-lang') { if (NS.site) NS.site.setLang(m.lang); else opts = Object.assign({}, opts, { lang: m.lang }); }
      if (m.type === 'ns-thanks' && NS.site) NS.site.showThanks();
    });
    parent.postMessage({ type: 'ns-ready' }, '*');
  };
})();

/* Part 4: widgets. Map (3D MapLibre with an illustrated fallback), 360° panorama viewer (WebGL), photo film
   (Ken Burns), carousel, lightbox, modal, video links. Each returns an object with destroy(). */
(function () {
  'use strict';
  var NS = window.NSSite, e = NS.esc, ic = NS.icon;

  NS.LIB = {
    maplibre: 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js',
    maplibreCss: 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'
  };
  var loading = {};
  NS.loadScript = function (src) {
    if (loading[src]) return loading[src];
    loading[src] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = true; s.onload = resolve; s.onerror = function () { delete loading[src]; reject(new Error('could not load ' + src)); };
      document.head.appendChild(s);
    });
    return loading[src];
  };
  NS.loadCss = function (href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
  };
  NS.webgl = function () {
    try { var c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (x) { return false; }
  };

  /* ------------------------------------------------------------------ video / tour links */
  NS.videoInfo = function (url) {
    url = String(url || '').trim();
    var m;
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/))) return { type: 'youtube', id: m[1], embed: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0' };
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return { type: 'vimeo', id: m[1], embed: 'https://player.vimeo.com/video/' + m[1] };
    if ((m = url.match(/matterport\.com\/show\/?\?m=([\w]+)/))) return { type: 'matterport', id: m[1], embed: 'https://my.matterport.com/show/?m=' + m[1] + '&play=1' };
    if (/kuula\.co\//.test(url)) return { type: 'kuula', embed: url.replace('/post/', '/share/') };
    if (/\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(url) || /\/_\/api\/m\//.test(url) || url.indexOf('blob:') === 0 || url.indexOf('data:video') === 0) return { type: 'file', src: url };
    return { type: 'iframe', embed: url, src: url };
  };

  /* ------------------------------------------------------------------ modal + lightbox */
  NS.Modal = function (html) {
    var wrap = document.createElement('div');
    wrap.className = 'ns-modal';
    wrap.innerHTML = '<div class="ns-modal-box" role="dialog" aria-modal="true"><button class="ns-x" data-x aria-label="' + e(NS.t('Close')) + '">' + ic('x') + '</button>' + html + '</div>';
    (document.querySelector('.ns') || document.body).appendChild(wrap);
    var api = { el: wrap, onclose: null, close: close };
    function key(ev) { if (ev.key === 'Escape') close(); }
    function close() {
      if (!wrap.parentNode) return;
      Array.prototype.forEach.call(wrap.querySelectorAll('video'), function (v) { v.pause(); });
      wrap.remove(); document.removeEventListener('keydown', key);
      if (api.onclose) api.onclose();
    }
    wrap.addEventListener('click', function (ev) { if (ev.target === wrap || ev.target.closest('[data-x]')) close(); });
    document.addEventListener('keydown', key);
    return api;
  };
  NS.Lightbox = function (items, start) {
    if (!items.length) return null;
    var i = start || 0;
    var m = NS.Modal('<div class="ns-lb"><img alt=""><p class="ns-lb-cap"></p><button class="ns-lb-btn prev" data-lb-go="-1" aria-label="' + e(NS.t('Previous')) + '">' + ic('left') +
      '</button><button class="ns-lb-btn next" data-lb-go="1" aria-label="' + e(NS.t('Next')) + '">' + ic('right') + '</button><span class="ns-lb-n"></span></div>');
    m.el.classList.add('dark');
    var img = m.el.querySelector('img'), cap = m.el.querySelector('.ns-lb-cap'), n = m.el.querySelector('.ns-lb-n');
    function show() { var it = items[(i + items.length) % items.length]; img.src = it.src; cap.textContent = it.caption || ''; n.textContent = ((i + items.length) % items.length + 1) + ' / ' + items.length; }
    m.el.addEventListener('click', function (ev) { var b = ev.target.closest('[data-lb-go]'); if (b) { i += +b.getAttribute('data-lb-go'); show(); } });
    function key(ev) { if (ev.key === 'ArrowRight') { i++; show(); } if (ev.key === 'ArrowLeft') { i--; show(); } }
    document.addEventListener('keydown', key);
    var x0 = null;
    img.addEventListener('touchstart', function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
    img.addEventListener('touchend', function (ev) { if (x0 == null) return; var dx = ev.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { i += dx < 0 ? 1 : -1; show(); } x0 = null; });
    m.onclose = function () { document.removeEventListener('keydown', key); };
    if (items.length < 2) Array.prototype.forEach.call(m.el.querySelectorAll('.ns-lb-btn'), function (b) { b.hidden = true; });
    show();
    return m;
  };

  /* ------------------------------------------------------------------ carousel (scroll-snap) */
  NS.Carousel = function (el) {
    var count = el.children.length, label = el.parentNode.querySelector('.ns-car-nav span');
    function idx() { return Math.round(el.scrollLeft / Math.max(1, el.clientWidth)); }
    function onScroll() { if (label) label.textContent = (idx() + 1) + ' / ' + count; }
    el.addEventListener('scroll', onScroll, { passive: true });
    var api = { step: function (d) { var k = (idx() + d + count) % count; el.scrollTo({ left: k * el.clientWidth, behavior: 'smooth' }); }, destroy: function () { el.removeEventListener('scroll', onScroll); } };
    el._car = api;
    return api;
  };

  /* ------------------------------------------------------------------ photo film: slow zooms and crossfades */
  NS.Film = function (el, items) {
    var i = 0, timer = null, alive = true;
    el.innerHTML = items.map(function (it, k) {
      return '<div class="ns-film-f' + (k === 0 ? ' on' : '') + '" style="background-image:url(&quot;' + e(it.src) + '&quot;)"></div>';
    }).join('') + '<div class="ns-film-bar"><i></i></div>';
    var frames = el.querySelectorAll('.ns-film-f');
    frames.forEach(function (f, k) { var o = ['50% 40%', '30% 60%', '70% 50%', '40% 30%', '60% 70%'][k % 5]; f.style.transformOrigin = o; });
    function next() {
      if (!alive || frames.length < 2) return;
      frames[i].classList.remove('on');
      i = (i + 1) % frames.length;
      frames[i].classList.remove('on'); void frames[i].offsetWidth; frames[i].classList.add('on');
    }
    timer = setInterval(next, 6000);
    return { destroy: function () { alive = false; clearInterval(timer); } };
  };

  /* ------------------------------------------------------------------ 360° panorama viewer (WebGL, equirectangular) */
  var VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  var FS = 'precision highp float; uniform sampler2D t; uniform vec2 res; uniform float yaw, pitch, fov;' +
    'void main(){ vec2 uv = (gl_FragCoord.xy / res) * 2.0 - 1.0; uv.x *= res.x / res.y; float f = 1.0 / tan(fov * 0.5);' +
    ' vec3 d = normalize(vec3(uv.x, uv.y, -f)); float cp = cos(pitch), sp = sin(pitch); d = vec3(d.x, d.y * cp - d.z * sp, d.y * sp + d.z * cp);' +
    ' float cy = cos(yaw), sy = sin(yaw); d = vec3(d.x * cy + d.z * sy, d.y, -d.x * sy + d.z * cy);' +
    ' float lon = atan(d.x, -d.z); float lat = asin(clamp(d.y, -1.0, 1.0));' +
    ' gl_FragColor = texture2D(t, vec2(lon / 6.2831853 + 0.5, 0.5 - lat / 3.1415927)); }';
  NS.Pano = function (el, src) {
    var canvas = document.createElement('canvas');
    canvas.className = 'ns-pano-c';
    el.insertBefore(canvas, el.firstChild);
    var gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: false });
    var state = { yaw: 0, pitch: 0, fov: 1.35, auto: true, alive: true, ready: false };
    if (!gl) {
      el.classList.add('flat');
      el.insertAdjacentHTML('afterbegin', '<div class="ns-pano-flat"><img src="' + e(src) + '" alt="360-degree photo"></div>');
      canvas.remove();
      return { destroy: function () {} };
    }
    function sh(type, code) { var s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = { res: gl.getUniformLocation(prog, 'res'), yaw: gl.getUniformLocation(prog, 'yaw'), pitch: gl.getUniformLocation(prog, 'pitch'), fov: gl.getUniformLocation(prog, 'fov') };
    var tex = gl.createTexture();
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      if (!state.alive) return;
      var max = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096, 4096), source = img;
      if (img.width > max) {
        var c = document.createElement('canvas'); c.width = max; c.height = Math.round(max * img.height / img.width);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); source = c;
      }
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      state.ready = true; el.classList.add('ready');
    };
    img.onerror = function () { el.classList.add('error'); el.insertAdjacentHTML('beforeend', '<p class="ns-pano-err">' + e(NS.t('This 360° photo could not be loaded.')) + '</p>'); };
    img.src = src;
    var raf = 0, last = 0;
    function frame(t) {
      if (!state.alive) return;
      raf = requestAnimationFrame(frame);
      if (!state.ready) return;
      var dt = Math.min(50, t - (last || t)); last = t;
      if (state.auto) state.yaw += dt * 0.00006;
      var w = el.clientWidth, h = el.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.res, canvas.width, canvas.height); gl.uniform1f(U.yaw, state.yaw); gl.uniform1f(U.pitch, state.pitch); gl.uniform1f(U.fov, state.fov);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    raf = requestAnimationFrame(frame);
    var drag = null;
    function down(ev) { state.auto = false; el.classList.add('used'); drag = { x: ev.clientX, y: ev.clientY, yaw: state.yaw, pitch: state.pitch }; el.setPointerCapture && el.setPointerCapture(ev.pointerId); }
    function move(ev) {
      if (!drag) return;
      var k = state.fov / Math.max(200, el.clientHeight);
      state.yaw = drag.yaw - (ev.clientX - drag.x) * k;
      state.pitch = Math.max(-1.45, Math.min(1.45, drag.pitch + (ev.clientY - drag.y) * k));
    }
    function up() { drag = null; }
    function wheel(ev) { ev.preventDefault(); state.fov = Math.max(0.6, Math.min(1.9, state.fov + ev.deltaY * 0.0012)); }
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    el.style.touchAction = 'none';
    return {
      state: state,
      destroy: function () {
        state.alive = false; cancelAnimationFrame(raf);
        var lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
      }
    };
  };

  /* ------------------------------------------------------------------ the neighbourhood map */
  function ring(lat, lng, metres) {
    var pts = [], R = 6371000;
    for (var k = 0; k <= 64; k++) {
      var a = k / 64 * Math.PI * 2;
      var dLat = metres * Math.cos(a) / R * 180 / Math.PI, dLng = metres * Math.sin(a) / (R * Math.cos(lat * Math.PI / 180)) * 180 / Math.PI;
      pts.push([lng + dLng, lat + dLat]);
    }
    return pts;
  }
  function bearing(a, b) {
    var y = Math.sin((b.lng - a.lng) * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180);
    var x = Math.cos(a.lat * Math.PI / 180) * Math.sin(b.lat * Math.PI / 180) - Math.sin(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.cos((b.lng - a.lng) * Math.PI / 180);
    return Math.atan2(y, x) * 180 / Math.PI;
  }
  NS.bearing = bearing;
  function pinEl(p) {
    var el = document.createElement('button');
    el.className = 'ns-mk';
    el.style.setProperty('--pin', NS.CATS[p.cat].color);
    el.innerHTML = ic(NS.CATS[p.cat].icon);
    el.setAttribute('aria-label', p.name);
    return el;
  }
  function popupHtml(p) {
    return '<div class="ns-pop">' + (p.wiki && p.wiki.thumb ? '<img src="' + e(p.wiki.thumb) + '" alt="">' : '') + '<b>' + e(p.name) + '</b><span>' + e(NS.CATS[p.cat].label) + ' · ' + e(NS.fmtWalk(p.walk)) + '</span>' +
      (p.note ? '<em>' + e(p.note) + '</em>' : '') + '<a href="' + e(NS.mapsLink(p)) + '" target="_blank" rel="noopener">' + e(NS.t('Open in Google Maps')) + '</a></div>';
  }

  NS.Map = function (el, o) {
    var api = { kind: 'none' }, places = [], hotel = o.hotel, palette = o.palette;
    var map = null, markers = [], hotelMk = null, popup = null, orbit = null, flat = null, alive = true, flying = 0, wantRoute = null;

    function useFlat(reason) {
      if (!alive) return;
      api.kind = 'flat';
      el.classList.add('flat');
      flat = NS.FlatMap(el, hotel, o);
      flat.setPlaces(places);
      if (reason) el.setAttribute('data-why', reason);
    }
    api.setPlaces = function (list) {
      places = list || [];
      if (flat) flat.setPlaces(places);
      if (map && map.loaded()) drawMarkers();
    };
    api.setHotel = function (h, pal) {
      var moved = !hotel || h.lat !== hotel.lat || h.lng !== hotel.lng;
      hotel = h; palette = pal || palette;
      if (map && moved) { map.jumpTo({ center: [h.lng, h.lat] }); if (hotelMk) hotelMk.setLngLat([h.lng, h.lat]); drawRings(); }
      if (map && map.isStyleLoaded()) tint();
      if (flat) flat.setHotel(h);
    };
    api.resize = function () { if (map) map.resize(); };
    api.focus = function (p) {
      if (flat) { flat.focus(p); return; }
      if (!map) return;
      stopOrbit();
      map.flyTo({ center: [p.lng, p.lat], zoom: 16.6, pitch: 60, bearing: bearing({ lat: hotel.lat, lng: hotel.lng }, p), duration: 1600 });
      if (popup) popup.remove();
      popup = new window.maplibregl.Popup({ offset: 18, closeButton: true, maxWidth: '260px' }).setLngLat([p.lng, p.lat]).setHTML(popupHtml(p)).addTo(map);
      if (o.onPick) o.onPick(p);
    };
    api.showRoute = function (route, animate) {
      if (flat) { flat.route(route); return; }
      if (!map || !map.isStyleLoaded()) { wantRoute = [route, animate]; return; }
      var coords = [[hotel.lng, hotel.lat]].concat((route || []).map(function (p) { return [p.lng, p.lat]; }));
      var src = map.getSource('ns-route');
      var gj = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } };
      if (src) src.setData(gj);
      if (!animate || !route || !route.length) {
        if (route && route.length) {
          var b = new window.maplibregl.LngLatBounds(coords[0], coords[0]);
          coords.forEach(function (c) { b.extend(c); });
          map.fitBounds(b, { padding: 60, pitch: 50, duration: 900, maxZoom: 16 });
        }
        return;
      }
      stopOrbit();
      var run = ++flying, k = 0;
      function step() {
        if (run !== flying || !alive) return;
        if (k >= route.length) { map.easeTo({ center: [hotel.lng, hotel.lat], zoom: 15.2, pitch: 55, duration: 1800 }); return; }
        var p = route[k], prev = k ? route[k - 1] : hotel;
        map.flyTo({ center: [p.lng, p.lat], zoom: 16.8, pitch: 62, bearing: bearing(prev, p), duration: 2200, essential: true });
        if (popup) popup.remove();
        popup = new window.maplibregl.Popup({ offset: 18, closeButton: false }).setLngLat([p.lng, p.lat]).setHTML('<div class="ns-pop"><b>' + (k + 1) + '. ' + e(p.name) + '</b></div>').addTo(map);
        k++;
        map.once('moveend', function () { setTimeout(step, 1300); });
      }
      step();
    };
    api.destroy = function () { alive = false; stopOrbit(); if (map) map.remove(); if (flat) flat.destroy(); };

    function stopOrbit() { if (orbit) { cancelAnimationFrame(orbit); orbit = null; } }
    function startOrbit() {
      stopOrbit();
      var t0 = 0;
      function spin(t) {
        if (!alive || !map) return;
        if (!t0) t0 = t;
        if (!map.isMoving()) map.setBearing(map.getBearing() + 0.03);
        orbit = requestAnimationFrame(spin);
      }
      orbit = requestAnimationFrame(spin);
    }
    function tint() {
      var c = palette.c, dark = palette.dark;
      try {
        if (map.getLayer('building-3d')) {
          map.setPaintProperty('building-3d', 'fill-extrusion-color', ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8], 0, dark ? c.surface : c.bg, 40, dark ? c.line : c.soft]);
          map.setPaintProperty('building-3d', 'fill-extrusion-opacity', 0.92);
        } else if (map.getSource('openmaptiles') && !map.getLayer('ns-3d')) {
          map.addLayer({ id: 'ns-3d', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 13,
            paint: { 'fill-extrusion-color': dark ? c.line : c.soft, 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10],
              'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 0.88 } });
        }
        if (map.getLayer('ns-rings')) map.setPaintProperty('ns-rings', 'line-color', c.accent);
        if (map.getLayer('ns-route')) map.setPaintProperty('ns-route', 'line-color', c.brand);
      } catch (x) {}
    }
    function drawRings() {
      if (!map || !map.isStyleLoaded()) return;
      var feats = [5, 10, 15].map(function (m) { return { type: 'Feature', properties: { m: m }, geometry: { type: 'LineString', coordinates: ring(hotel.lat, hotel.lng, m * 80 / 1.3) } }; });
      var src = map.getSource('ns-rings');
      if (src) src.setData({ type: 'FeatureCollection', features: feats });
    }
    function drawMarkers() {
      markers.forEach(function (m) { m.remove(); });
      markers = [];
      places.slice(0, 160).forEach(function (p) {
        if (p.lat == null) return;
        var elp = pinEl(p);
        elp.addEventListener('click', function (ev) { ev.stopPropagation(); api.focus(p); });
        markers.push(new window.maplibregl.Marker({ element: elp }).setLngLat([p.lng, p.lat]).addTo(map));
      });
    }
    function start() {
      if (!alive) return;
      if (!window.maplibregl) { useFlat('no library'); return; }
      try {
        map = new window.maplibregl.Map({
          container: el, style: 'https://tiles.openfreemap.org/styles/' + (palette.dark ? 'dark' : 'liberty'),
          center: [hotel.lng, hotel.lat], zoom: 15.4, pitch: 58, bearing: -18, maxPitch: 75, attributionControl: { compact: true },
          cooperativeGestures: true, fadeDuration: 0
        });
      } catch (x) { map = null; useFlat('no webgl'); return; }
      api.kind = '3d';
      api.map = map;
      map.addControl(new window.maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      map.on('error', function (ev) { if (ev && ev.error && /webgl/i.test(String(ev.error.message))) { map.remove(); map = null; useFlat('webgl error'); } });
      map.on('load', function () {
        if (!alive) return;
        el.classList.add('ready');
        map.addSource('ns-rings', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'ns-rings', type: 'line', source: 'ns-rings', paint: { 'line-color': palette.c.accent, 'line-width': 1.6, 'line-dasharray': [2, 2], 'line-opacity': 0.9 } });
        map.addLayer({ id: 'ns-rings-l', type: 'symbol', source: 'ns-rings', layout: { 'symbol-placement': 'line', 'text-field': ['concat', ['to-string', ['get', 'm']], ' ' + NS.t('min')], 'text-size': 11,
          'text-font': ['Noto Sans Regular'] }, paint: { 'text-color': palette.c.accent, 'text-halo-color': palette.dark ? '#000' : '#fff', 'text-halo-width': 1.2 } });
        map.addSource('ns-route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
        map.addLayer({ id: 'ns-route', type: 'line', source: 'ns-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': palette.c.brand, 'line-width': 4, 'line-opacity': 0.85 } });
        tint(); drawRings(); drawMarkers();
        var hel = document.createElement('div');
        hel.className = 'ns-mk-hotel';
        hel.innerHTML = NS.orn.monogram(o.name || hotel.name) + '<span>' + e(o.name || hotel.name || 'Hotel') + '</span>';
        hotelMk = new window.maplibregl.Marker({ element: hel, anchor: 'bottom' }).setLngLat([hotel.lng, hotel.lat]).addTo(map);
        if (wantRoute) { api.showRoute(wantRoute[0], wantRoute[1]); wantRoute = null; }
        else startOrbit();
      });
      ['mousedown', 'touchstart', 'wheel'].forEach(function (evn) { el.addEventListener(evn, stopOrbit, { passive: true }); });
    }
    if (o.noMap || !NS.webgl()) { useFlat(o.noMap ? 'off' : 'no webgl'); return api; }
    var lib = (o.lib && o.lib.maplibre) || NS.LIB.maplibre, css = (o.lib && o.lib.maplibreCss) || NS.LIB.maplibreCss;
    NS.loadCss(css);
    var timeout = setTimeout(function () { if (!window.maplibregl) useFlat('slow library'); }, 15000);
    (window.maplibregl ? Promise.resolve() : NS.loadScript(lib)).then(function () { clearTimeout(timeout); if (!flat) start(); }, function () { clearTimeout(timeout); useFlat('library failed'); });
    return api;
  };

  /* An illustrated map without WebGL: places around the hotel by direction and walking time. */
  NS.FlatMap = function (el, hotel, o) {
    var places = [], route = null, focusId = null;
    var W = 600, H = 600, cx = W / 2, cy = H / 2, maxMin = 18;
    function pos(p) {
      var d = NS.dist(hotel.lat, hotel.lng, p.lat, p.lng), b = bearing(hotel, p) * Math.PI / 180;
      var r = Math.min(1, Math.sqrt(NS.walkMin(d) / maxMin)) * (W / 2 - 30);
      return [cx + Math.sin(b) * r, cy - Math.cos(b) * r];
    }
    function draw() {
      var rings = [5, 10, 15].map(function (m) {
        var r = Math.sqrt(m / maxMin) * (W / 2 - 30);
        return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(1) + '" class="rg"/><text x="' + cx + '" y="' + (cy - r + 14).toFixed(1) + '" class="rl">' + m + ' ' + e(NS.t('min')) + '</text>';
      }).join('');
      var line = '';
      if (route && route.length) line = '<polyline class="rt" points="' + [[cx, cy]].concat(route.map(pos)).map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ') + '"/>';
      var dots = places.filter(function (p) { return p.lat != null && p.walk <= maxMin; }).slice(0, 140).map(function (p) {
        var q = pos(p), on = focusId != null && String(p.id) === String(focusId);
        return '<g class="pt' + (on ? ' on' : '') + '" data-pid="' + e(p.id) + '" transform="translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ')"><circle r="' + (on ? 9 : 6) + '" style="fill:' + NS.CATS[p.cat].color + '"/>' +
          (on || p.wiki ? '<text x="10" y="4">' + e(p.name) + '</text>' : '') + '<title>' + e(p.name + ' · ' + NS.t('{n} min', { n: p.walk })) + '</title></g>';
      }).join('');
      el.innerHTML = '<svg class="ns-flat" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + e(NS.t('Map of places around the hotel')) + '">' +
        '<defs><radialGradient id="nsfg"><stop offset="0" class="g0"/><stop offset="1" class="g1"/></radialGradient></defs><rect width="' + W + '" height="' + H + '" fill="url(#nsfg)"/>' +
        rings + '<path class="cmp" d="M' + cx + ' 22l8 22h-16zM' + cx + ' 578l8-22h-16z"/><text x="' + cx + '" y="18" class="rl n">N</text>' + line + dots +
        '<g class="ht" transform="translate(' + cx + ' ' + cy + ')"><path d="M-14 16V-2a14 14 0 0 1 28 0v18z"/><text y="9">' + e((o.name || 'H').charAt(0)) + '</text></g></svg>' +
        '<p class="ns-flat-note">' + e(NS.t('Illustrated map: directions are true, distances are walking minutes.')) + '</p>';
    }
    el.addEventListener('click', function (ev) {
      var g = ev.target.closest('[data-pid]');
      if (!g) return;
      var p = places.filter(function (x) { return String(x.id) === g.getAttribute('data-pid'); })[0];
      if (p) { focusId = p.id; draw(); if (o.onPick) o.onPick(p); }
    });
    return {
      setPlaces: function (l) { places = l || []; draw(); },
      setHotel: function (h) { hotel = h; draw(); },
      focus: function (p) { focusId = p.id; draw(); },
      route: function (r) { route = r; draw(); },
      destroy: function () { el.innerHTML = ''; }
    };
  };
})();
