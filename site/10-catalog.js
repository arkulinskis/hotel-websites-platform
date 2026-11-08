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

  /* ------------------------------------------------------------------ typography pairs (Google Fonts) */
  NS.FONTS = {
    belle:     { name: 'Belle Époque', display: 'Cormorant Garamond', body: 'Jost',
                 css: 'family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Jost:wght@400;500;600' },
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
