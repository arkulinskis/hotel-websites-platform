/* ns-site.js: the Nouveau Stay hotel-website renderer. Built from web/site/*.js (joined by name).
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
  NS.fmtWalk = function (min) { return min <= 1 ? '1 min walk' : min > 45 ? Math.round(min / 6) + ' min by tram or taxi' : min + ' min walk'; };
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
    if (landmark) out.push({ n: landmark.walk, unit: 'min', label: 'on foot to ' + landmark.name, icon: 'walk' });
    var cats = p ? Object.keys(p.w).sort(function (a, b) { return p.w[b] - p.w[a]; }) : ['cafe', 'restaurant', 'museum', 'park', 'bar'];
    cats.forEach(function (cat) {
      if (out.length >= 4 || cat === 'transport' || cat === 'essentials') return;
      var n = NS.countWithin(places, cat, 10);
      if (n >= 2) out.push({ n: n, unit: '', label: NS.CATS[cat].plural + ' within 10 minutes', icon: NS.CATS[cat].icon });
    });
    var st = NS.nearest(places, 'transport', function (x) { return /station|stacija|bahnhof|terminal|vokzal/i.test(x.name + ' ' + (x.sub || '')); });
    if (st && out.length < 4) out.push({ n: st.walk, unit: 'min', label: 'to ' + st.name, icon: 'train' });
    var total = places.filter(function (x) { return x.walk <= 15; }).length;
    if (out.length < 4 && total) out.push({ n: total, unit: '', label: 'places within 15 minutes on foot', icon: 'pin' });
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
    if (p.note) return 'Our tip: ' + p.note;
    if (p.wiki && p.wiki.extract) return NS.firstSentence(p.wiki.extract, 180);
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
    var hotel = data.hotel || {}, name = hotel.name || 'the hotel';
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
      return vs[Math.floor(rnd() * vs.length)].replace('{n}', pl.name);
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
      winter: 'Wrap up warm: the old town glows in the snow.', summer: 'Evenings stay light until late, so take your time.',
      spring: 'Café terraces start opening in spring.', autumn: 'Golden trees and fewer crowds.'
    };

    function breakfast(time) {
      if (breakfastIncluded) return hotelSlot(time, 'cup', 'Breakfast at ' + name, hotel.breakfast || 'Breakfast is included and served downstairs.');
      var c = pick(['cafe'], 8);
      return c ? placeSlot(time, c, 'A good start to the day.') : hotelSlot(time, 'cup', 'Breakfast nearby', 'Ask at the desk for our favourite breakfast spot.');
    }
    function activity(time, k, dayIndex, maxWalk) {
      for (var t = 0; t < activityCats.length; t++) {
        var cat = activityCats[(dayIndex * 2 + k + t) % activityCats.length];
        var pl = pick([cat], maxWalk);
        if (pl) return placeSlot(time, pl);
      }
      var any = pick(activityCats);
      return any ? placeSlot(time, any) : hotelSlot(time, 'walk', 'Wander the neighbourhood', 'Pick a street you have not walked yet. Everything here is close.');
    }
    function meal(time, cats, label) {
      var pl = pick(cats, 15 * pace);
      if (!pl) return hotelSlot(time, 'fork', label, 'Ask us for a table nearby. We know the good ones.');
      return placeSlot(time, pl, '', (pl.cat === 'market' ? 'Pick up lunch at ' : label + ' at ') + pl.name);
    }
    function evening(time) {
      if (p.rhythm === 'late' || w.bar >= 2 || w.nightlife >= 2) {
        var b = pick(['bar', 'nightlife'], 15);
        if (b) return placeSlot(time, b, '', (b.cat === 'nightlife' ? 'Late night at ' : rnd() < 0.5 ? 'Nightcap at ' : 'Drinks at ') + b.name);
      }
      if (NS.hasFeature(data, 'fireplace')) return hotelSlot(time, 'fire', 'Back by the fireplace', 'End the day with a book by the lobby fire.');
      var s = pick(['sight', 'church', 'park'], 10);
      return s ? placeSlot(time, s, 'Beautiful after dark, too.') : hotelSlot(time, 'moon', 'An early night', 'Sleep well: tomorrow there is more to see.');
    }

    var days = [];
    // Arrival
    var arrive = hotel.checkin || '15:00';
    var d0 = [hotelSlot(arrive, 'key', 'Check in at ' + name, (hotel.checkin_note || 'Drop your bags, freshen up and pick up a map at the desk.'))];
    var first = activity(addMinutes(arrive, 60), 0, 0, 8);
    first.title = 'First walk: ' + first.title.charAt(0).toLowerCase() + first.title.slice(1);
    d0.push(first);
    if (p.rhythm === 'late' || w.bar >= 1.5) { var ap = pick(['bar'], 10); if (ap) d0.push(placeSlot(R.evening, ap, 'To start the trip.', 'An aperitif at ' + ap.name)); }
    if (inHouse && (w.restaurant >= 1 || nights === 1)) {
      d0.push(hotelSlot(R.dinner, 'fork', 'Dinner downstairs at ' + data.dining.name,
        NS.firstSentence(data.dining.short || data.dining.body || 'No need to go far on your first night.', 170)));
    } else d0.push(meal(R.dinner, mealCats, 'Dinner'));
    d0.push(evening(R.night));
    days.push({ title: 'Arrival', slots: d0 });

    // Full days
    for (var d = 1; d < nights; d++) {
      var s = [breakfast(R.breakfast)];
      if (p.id === 'runner' || w.sport >= 2) { var run = pick(['park', 'sport'], 15); if (run) s.unshift(placeSlot(addMinutes(R.breakfast, -60), run, 'Before breakfast, while the streets are quiet.')); }
      if (w.coworking >= 2) { var cw = pick(['coworking', 'cafe'], 15); if (cw) s.push(placeSlot(R.morning, cw, 'Fast Wi-Fi and good coffee.')); }
      else s.push(activity(R.morning, 0, d));
      if (p.rhythm === 'early') s.push(activity(R.late, 1, d));
      s.push(meal(R.lunch, lunchCats, 'Lunch'));
      s.push(activity(R.afternoon, 2, d));
      var cf = pick(season === 'summer' && w.park ? ['park', 'cafe'] : (w.wellness >= 2 ? ['wellness', 'cafe'] : ['cafe']), 10);
      if (cf) s.push(placeSlot(R.coffee, cf, season === 'winter' ? 'Warm up for a while.' : ''));
      if (w.shop >= 2) { var sh = pick(['shop', 'market'], 12); if (sh) s.push(placeSlot(R.evening, sh)); }
      var perf = w.culture >= 1.5 ? pick(['culture'], 20) : null;
      if (perf) {
        s.push(placeSlot('19:00', perf, 'Check what is on tonight: most performances start around 19:00.', 'An evening performance at ' + perf.name));
        var sup = pick(['restaurant', 'bar'], 12);
        if (sup) s.push(placeSlot('21:45', sup, 'A late supper after the show.', 'Late supper at ' + sup.name));
      } else {
        s.push(meal(R.dinner, mealCats, 'Dinner'));
        s.push(evening(R.night));
      }
      if (R.late_night && (w.nightlife >= 2)) { var nl = pick(['nightlife', 'bar'], 15); if (nl) s.push(placeSlot(R.late_night, nl)); }
      days.push({ title: 'Day ' + (d + 1), slots: s });
    }

    // Departure
    var out = hotel.checkout || '12:00';
    var dl = [breakfast(R.breakfast)];
    var last = pick(activityCats.slice(0, 3).concat(['cafe']), 8);
    if (last) dl.push(placeSlot(addMinutes(out, -90), last, 'One last look before you go.'));
    dl.push(hotelSlot(out, 'suitcase', 'Check out', NS.hasFeature(data, 'luggage') ? 'Leave your bags with us and enjoy the rest of the day.' : 'Thank you for staying with us.'));
    var station = NS.nearest(places, 'transport', function (x) { return /station|stacija|terminal|bus|airport/i.test(x.name + ' ' + (x.sub || '')); });
    if (station) dl.push(placeSlot(addMinutes(out, 60), station, hotel.airport ? hotel.airport : ''));
    else if (hotel.airport) dl.push(hotelSlot(addMinutes(out, 60), 'plane', 'To the airport', hotel.airport));
    days.push({ title: 'Departure', slots: dl });

    // Intro, tips and rooms
    var landmark = places.filter(function (x) { return x.cat === 'sight' && x.wiki; })[0] || places.filter(function (x) { return w[x.cat] > 0; })[0];
    var top2 = activityCats.concat(['cafe', 'restaurant', 'bar']).filter(function (c, i, a) { return a.indexOf(c) === i && w[c] > 0; }).slice(0, 2);
    var counts = top2.map(function (c) { return { c: c, n: NS.countWithin(places, c, 10) }; }).filter(function (x) { return x.n > 0; });
    var intro = ov.intro || (p.hook + ' ' + (landmark ? name + ' is ' + NS.fmtWalk(landmark.walk) + ' from ' + landmark.name +
      (counts.length ? ', with ' + counts.map(function (x) { return x.n + ' ' + NS.CATS[x.c].plural; }).join(' and ') + ' within ten minutes on foot.' : '.') : ''));
    var tips = [];
    (p.perks || []).forEach(function (k) {
      if (k === 'location' || !NS.hasFeature(data, k)) return;
      tips.push({ icon: NS.FEATURES[k].icon, text: NS.FEATURES[k].label });
    });
    if (ov.tip) tips.unshift({ icon: 'sparkle', text: ov.tip, own: true });
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
      return 'Welcome to ' + (h.name || 'our hotel') + (h.area ? ', in the heart of ' + h.area : '') + '. ' +
        (h.building ? h.building + ' ' : '') +
        (lm.length ? 'From our door it is ' + lm.map(function (x) { return NS.fmtWalk(x.walk) + ' to ' + x.name; }).join(' and ') + '. ' : '') +
        'We are a small, personal hotel: we know our guests by name, and we love sharing the places we go ourselves.';
    },
    neighborhood: function (data) {
      var h = data.hotel || {}, places = NS.places(data);
      var n15 = places.filter(function (x) { return x.walk <= 15; }).length;
      var cafes = NS.countWithin(places, 'cafe', 10), rest = NS.countWithin(places, 'restaurant', 10), mus = NS.countWithin(places, 'museum', 15);
      return 'Step outside and ' + (h.area || 'the city') + ' is yours: ' + n15 + ' places within a fifteen-minute walk, including ' +
        cafes + ' cafés and ' + rest + ' restaurants within ten minutes' + (mus ? ', and ' + mus + ' museums' : '') + '. Leave the car; you will not need it.';
    },
    highlights: function (data) {
      var feats = NS.get(data, 'hotel.features', []) || [];
      var out = [];
      var nums = NS.numbers(data);
      if (nums[0]) out.push({ icon: 'walk', title: nums[0].n + ' minutes ' + nums[0].label.replace(/^on foot /, 'on foot '), text: 'Right in the middle of everything, on a quiet street.' });
      feats.slice(0, 5).forEach(function (k) { if (NS.FEATURES[k]) out.push({ icon: NS.FEATURES[k].icon, title: NS.FEATURES[k].label, text: '' }); });
      return out.slice(0, 6);
    },
    faq: function (data) {
      var h = data.hotel || {}, b = data.booking || {};
      var out = [];
      if (h.checkin || h.checkout) out.push({ q: 'What time is check-in and check-out?', a: 'Check-in is from ' + (h.checkin || '15:00') + ' and check-out is until ' + (h.checkout || '12:00') + '.' });
      if (NS.hasFeature(data, 'breakfast')) out.push({ q: 'Is breakfast included?', a: h.breakfast || 'Yes, breakfast is included.' });
      if (NS.get(b, 'payment.when')) out.push({ q: 'When do I pay?', a: b.payment.when });
      if (h.parking) out.push({ q: 'Is there parking?', a: h.parking });
      if (h.airport) out.push({ q: 'How do I get here from the airport?', a: h.airport });
      return out;
    }
  };
})();

/* Part 3: drawing a hotel site.
   NSSite.mount(root, data, opts) draws the whole site into root and returns {update(data), setPersona(id), destroy()}.
   NSSite.boot(data, opts) is what a hosted or exported page calls: it mounts into #ns-root.
   opts: mode 'live' | 'preview' | 'export'; media {m: base url for "m:KEY" uploads, a: base url for "a:file" starter
   photos}; stats (url to ping, live only); slug; platform {name, url}; lib {maplibre, maplibreCss}; noMap; persona. */
(function () {
  'use strict';
  var NS = window.NSSite, e = NS.esc, ic = NS.icon;

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
    return '<svg class="ns-roomart v' + (i % 3) + '" viewBox="0 0 300 220" role="img" aria-label="Drawing of the room"><rect class="wall" width="300" height="220"/>' +
      '<path class="win" d="M196 112V52a32 32 0 0 1 64 0v60z"/><path d="M228 20v92M196 70h64"/>' +
      '<path class="floor" d="M0 188h300v32H0z"/><path d="M0 188h300"/>' + bed +
      '<path d="M40 188v-56M28 132h24l-4-22H32z"/><path d="M262 188c-2-26 6-40 18-48M262 188c4-16 2-30-8-42"/></svg>';
  }

  /* ------------------------------------------------------------------ the site */
  NS.mount = function (root, data, opts) {
    opts = opts || {};
    var S = {
      root: root, data: data, opts: opts, persona: null, nights: null, season: null, day: 0, filter: null,
      widgets: [], map: null, mapEl: null
    };
    var startPersona = opts.persona || (location.hash.match(/for=([a-z]+)/) || [])[1] || null;
    if (!startPersona) { try { startPersona = sessionStorage.getItem('ns.persona.' + (opts.slug || '')); } catch (x) {} }
    if (startPersona && NS.persona(startPersona)) S.persona = startPersona;

    function enabledSections() {
      var list = data.sections && data.sections.length ? data.sections : NS.SECTIONS.map(function (s) { return { id: s.id, on: true }; });
      return list.filter(function (s) { return s.on !== false && SECTIONS[s.id]; });
    }
    function sectionTitle(id, dflt) {
      var s = (data.sections || []).filter(function (x) { return x.id === id; })[0];
      return (s && s.title) || dflt;
    }
    function mediaSrc(ref) { return NS.src(ref, opts); }
    function primaryChannel() {
      var ch = (NS.get(data, 'booking.channels', []) || []).filter(function (c) { return c.url; });
      return ch[0] || null;
    }
    function bookBtn(cls, label) {
      var c = primaryChannel();
      if (!c) return '<a class="ns-btn ' + (cls || '') + '" href="#ns-booking">' + e(label || 'Check availability') + '</a>';
      return '<a class="ns-btn ' + (cls || '') + '" href="' + e(c.url) + '" target="_blank" rel="noopener">' + e(label || 'Check availability') + ic('arrow') + '</a>';
    }
    function head(id, eyebrow, title, lead) {
      return '<header class="ns-head">' + (eyebrow ? '<div class="ns-eyebrow">' + e(eyebrow) + '</div>' : '') +
        '<h2>' + e(sectionTitle(id, title)) + '</h2>' + (lead ? '<div class="ns-lead">' + lead + '</div>' : '') + NS.orn.divider() + '</header>';
    }
    function persona() { return S.persona ? NS.persona(S.persona) : null; }

    /* ---------------------------------------------------------------- sections */
    var SECTIONS = {
      hero: function () {
        var h = data.hotel || {}, hero = data.hero || {}, p = persona();
        var kind = hero.kind || 'photo', media = '';
        if (kind === 'video' && hero.video) {
          var vi = NS.videoInfo(mediaSrc(hero.video));
          media = vi.type === 'youtube' ? '<iframe class="ns-hero-yt" src="https://www.youtube-nocookie.com/embed/' + e(vi.id) + '?autoplay=1&mute=1&loop=1&controls=0&playsinline=1&playlist=' + e(vi.id) + '" allow="autoplay" title="Hotel video" tabindex="-1"></iframe>'
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
          '<div class="ns-hero-text"><div class="ns-eyebrow">' + (h.stars ? '<span class="ns-stars">' + stars(h.stars) + '</span> ' : '') + e([h.kind || 'Hotel', h.area || h.city].filter(Boolean).join(' · ')) + '</div>' +
          '<h1>' + e(h.name || 'Your hotel') + '</h1>' +
          '<p class="ns-hero-line">' + e(hero.headline || h.tagline || '') + '</p>' +
          (p ? '<p class="ns-hero-for">' + ic(p.icon) + '<span><b>For ' + e(p.name.toLowerCase().replace(/^the /, '')) + ':</b> ' + e(p.hook) + '</span></p>' : '') +
          '<div class="ns-hero-cta"><a class="ns-btn light" href="#ns-' + (has('personas') ? 'personas' : has('stay') ? 'stay' : 'rooms') + '">' + ic('route') + 'Plan your stay</a>' + bookBtn('primary') + '</div>' +
          (ratings ? '<div class="ns-rates">' + ratings + '</div>' : '') + '</div>' +
          '<a class="ns-scroll" href="#ns-' + ((enabledSections()[1] || {}).id || 'rooms') + '" aria-label="Scroll down">' + ic('down') + '</a></div>';
      },

      personas: function () {
        var list = NS.enabledPersonas(data), cur = S.persona;
        var title = NS.get(data, 'personas.title', '') || 'Who is coming?';
        return head('personas', 'Made for you', title, '<p>' + e(NS.get(data, 'personas.lead', '') || 'Pick the traveller you are. The whole page rearranges itself: rooms, places, and a stay planned hour by hour.') + '</p>') +
          '<div class="ns-pers" role="listbox" aria-label="Choose your kind of trip">' +
          '<button class="ns-per all' + (cur ? '' : ' on') + '" data-persona="" role="option" aria-selected="' + !cur + '"><span class="ns-per-ic">' + ic('sparkle') + '</span><b>Everyone</b><small>Show me everything</small></button>' +
          list.map(function (p) {
            var on = cur === p.id;
            return '<button class="ns-per' + (on ? ' on' : '') + '" data-persona="' + p.id + '" role="option" aria-selected="' + on + '"><span class="ns-per-ic">' + ic(p.icon) + '</span><b>' + e(p.name) + '</b><small>' + e(p.line) + '</small></button>';
          }).join('') + '</div>' +
          (cur ? '<p class="ns-per-now">' + ic('check') + 'Showing the site for <b>' + e(persona().name) + '</b>. <a href="#ns-stay">See your stay</a> · <button data-persona="">Show everything</button></p>' : '');
      },

      story: function () {
        var st = data.story || {};
        var img = st.image ? '<figure class="ns-arch"><img src="' + e(mediaSrc(st.image)) + '" alt="' + e(st.image_alt || '') + '" loading="lazy">' + (st.caption ? '<figcaption>' + e(st.caption) + '</figcaption>' : '') + '</figure>' : '<div class="ns-arch art">' + NS.orn.lily() + '</div>';
        return '<div class="ns-story">' + img + '<div class="ns-story-text"><div class="ns-eyebrow">' + e(st.eyebrow || 'Our story') + '</div><h2>' + e(sectionTitle('story', st.title || 'Welcome')) + '</h2>' +
          '<div class="ns-prose">' + NS.rich(st.body || NS.draft.story(data)) + '</div>' + (st.sign ? '<p class="ns-sign">' + e(st.sign) + '</p>' : '') + '</div></div>';
      },

      highlights: function () {
        var p = persona(), nums = NS.numbers(data, p);
        var items = (data.highlights && data.highlights.length ? data.highlights : NS.draft.highlights(data)).slice();
        var feats = (NS.get(data, 'hotel.features', []) || []);
        if (p) {
          (p.perks || []).slice().reverse().forEach(function (k) {
            if (k === 'location' || feats.indexOf(k) < 0) return;
            var f = NS.FEATURES[k];
            items = items.filter(function (x) { return x.title !== f.label; });
            items.unshift({ icon: f.icon, title: f.label, text: '', forYou: true });
          });
        }
        return head('highlights', 'Why stay here', 'The best address in the neighbourhood', '') +
          (nums.length ? '<div class="ns-nums">' + nums.map(function (n) {
            return '<div class="ns-num">' + ic(n.icon) + '<b>' + e(n.n) + (n.unit ? '<small>' + e(n.unit) + '</small>' : '') + '</b><span>' + e(n.label) + '</span></div>';
          }).join('') + '</div>' : '') +
          '<div class="ns-hls">' + items.slice(0, 8).map(function (h) {
            return '<div class="ns-hl' + (h.forYou ? ' you' : '') + '"><span class="ns-hl-ic">' + ic(h.icon || 'star') + '</span><div><h3>' + e(h.title) + (h.forYou ? ' <em>for you</em>' : '') + '</h3>' + (h.text ? '<p>' + e(h.text) + '</p>' : '') + '</div></div>';
          }).join('') + '</div>';
      },

      rooms: function () {
        var p = persona(), picks = p ? NS.roomsFor(data, p) : [];
        var rooms = (data.rooms || []).filter(function (r) { return r && r.name; });
        if (p) rooms = rooms.slice().sort(function (a, b) { return (picks.indexOf(a.id) < 0) - (picks.indexOf(b.id) < 0); });
        if (!rooms.length) return head('rooms', 'Sleep well', 'Rooms', '') + '<p class="ns-empty">Rooms are coming soon.</p>';
        return head('rooms', 'Sleep well', 'Rooms', data.rooms_intro ? NS.rich(data.rooms_intro) : '') +
          '<div class="ns-rooms">' + rooms.map(function (r, i) {
            var photos = (r.photos || []).filter(Boolean);
            var media = photos.length ? '<div class="ns-carousel" data-carousel>' + photos.map(function (ph, k) {
              return '<img src="' + e(mediaSrc(ph)) + '" alt="' + e(r.name) + ' photo ' + (k + 1) + '" loading="lazy" data-lb="room-' + i + '" data-lb-i="' + k + '">';
            }).join('') + '</div>' + (photos.length > 1 ? '<div class="ns-car-nav"><button data-car="-1" aria-label="Previous photo">' + ic('left') + '</button><span>1 / ' + photos.length + '</span><button data-car="1" aria-label="Next photo">' + ic('right') + '</button></div>' : '')
              : roomArt(r, i) + '<span class="ns-soon">Photos coming soon</span>';
            var fits = picks.indexOf(r.id) >= 0;
            var specs = [r.size ? ic('ruler') + e(r.size) + ' m²' : '', r.beds ? ic('bed') + e(r.beds) : '', r.guests ? ic('users') + 'Up to ' + e(r.guests) : ''].filter(Boolean);
            var tools = [
              photos.length ? '<button class="ns-chip" data-room-photos="' + i + '">' + ic('grid') + photos.length + ' photos</button>' : '',
              r.pano ? '<button class="ns-chip" data-room-pano="' + i + '">' + ic('cube') + '360°</button>' : '',
              r.tour ? '<button class="ns-chip" data-room-tour="' + i + '">' + ic('cube') + '3D tour</button>' : '',
              r.video ? '<button class="ns-chip" data-room-video="' + i + '">' + ic('play') + 'Video</button>' : ''].join('');
            return '<article class="ns-room' + (fits ? ' fits' : '') + '"><div class="ns-room-media">' + media + (fits ? '<span class="ns-fit">' + ic('heart') + 'Perfect for you</span>' : '') + '</div>' +
              '<div class="ns-room-body"><h3>' + e(r.name) + '</h3>' + (specs.length ? '<div class="ns-specs">' + specs.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</div>' : '') +
              (r.text ? '<div class="ns-room-text">' + NS.rich(r.text) + '</div>' : '') +
              ((r.features || []).length ? '<ul class="ns-feats">' + r.features.slice(0, 6).map(function (f) { return '<li>' + ic('check') + e(f) + '</li>'; }).join('') + '</ul>' : '') +
              (tools ? '<div class="ns-room-tools">' + tools + '</div>' : '') +
              '<div class="ns-room-foot">' + (r.price ? '<span class="ns-price">from <b>' + e(r.price) + '</b> / night</span>' : '<span></span>') + bookBtn('sm', 'Check dates') + '</div></div></article>';
          }).join('') + '</div>';
      },

      walkthrough: function () {
        var wt = data.walkthrough || {}, items = (wt.items || []).filter(function (x) { return x && (x.src || x.embed || (x.stops || []).length); });
        if (!items.length) return '';
        var cur = Math.min(S.wt || 0, items.length - 1), it = items[cur];
        var tabs = items.length > 1 ? '<div class="ns-tabs">' + items.map(function (x, k) {
          return '<button class="' + (k === cur ? 'on' : '') + '" data-wt="' + k + '">' + ic(x.kind === 'pano' ? 'cube' : x.kind === 'embed' ? 'cube' : 'walk') + e(x.title || 'Tour ' + (k + 1)) + '</button>';
        }).join('') + '</div>' : '';
        var body;
        if (it.kind === 'pano') body = '<div class="ns-pano" data-pano="' + e(mediaSrc(it.src)) + '"><div class="ns-pano-hint">' + ic('compass') + 'Drag to look around</div><button class="ns-pano-fs" data-fs aria-label="Full screen">' + ic('expand') + '</button></div>';
        else if (it.kind === 'embed') body = '<div class="ns-embed"><iframe src="' + e(NS.videoInfo(it.embed).embed || it.embed) + '" allow="fullscreen; xr-spatial-tracking; autoplay" allowfullscreen loading="lazy" title="' + e(it.title || 'Virtual tour') + '"></iframe></div>';
        else {
          var stops = it.stops || [], k = Math.min(S.stop || 0, stops.length - 1), st = stops[k] || {};
          body = '<div class="ns-walk"><figure><img src="' + e(mediaSrc(st.src)) + '" alt="' + e(st.caption || '') + '"><figcaption><b>' + (k + 1) + ' / ' + stops.length + '</b> ' + e(st.caption || '') + '</figcaption></figure>' +
            '<div class="ns-walk-nav"><button class="ns-btn sm" data-stop="-1"' + (k === 0 ? ' disabled' : '') + '>' + ic('left') + 'Back</button><div class="ns-walk-dots">' + stops.map(function (_, j) { return '<i class="' + (j === k ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
            '<button class="ns-btn sm primary" data-stop="1"' + (k >= stops.length - 1 ? ' disabled' : '') + '>Walk on' + ic('right') + '</button></div></div>';
        }
        return head('walkthrough', 'Look around', wt.title || 'Step inside', wt.lead ? '<p>' + e(wt.lead) + '</p>' : '') + tabs +
          '<div class="ns-wt">' + body + (it.text || it.credit ? '<p class="ns-wt-note">' + e(it.text || '') + (it.credit ? ' <small>' + e(it.credit) + '</small>' : '') + '</p>' : '') + '</div>';
      },

      gallery: function () {
        var g = data.gallery || {}, items = (g.items || []).filter(function (x) { return x && x.src; });
        if (!items.length) return '';
        var layout = g.layout || 'bento';
        return head('gallery', 'Gallery', g.title || 'A closer look', '') +
          '<div class="ns-gal ' + e(layout) + '">' + items.map(function (it, i) {
            return '<figure class="g' + (i % 7) + '"><img src="' + e(mediaSrc(it.src)) + '" alt="' + e(it.caption || '') + '" loading="lazy" data-lb="gal" data-lb-i="' + i + '">' + (it.caption ? '<figcaption>' + e(it.caption) + '</figcaption>' : '') + '</figure>';
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
        return head('stay', 'Your stay, planned', 'Your stay, hour by hour', '<p>Written for the way you travel, from the places around us. Change the trip and watch it rewrite itself.</p>') +
          '<div class="ns-stay-ctl">' +
            '<label><span>Travelling as</span><select data-stay-persona>' + list.concat(list.some(function (x) { return x.id === pid; }) ? [] : [p]).map(function (x) {
              return '<option value="' + x.id + '"' + (x.id === pid ? ' selected' : '') + '>' + e(x.name) + '</option>'; }).join('') + '</select></label>' +
            '<label><span>Nights</span><div class="ns-seg">' + [1, 2, 3, 4].map(function (n) { return '<button data-nights="' + n + '" class="' + (n === st.nights ? 'on' : '') + '">' + n + '</button>'; }).join('') + '</div></label>' +
            '<label><span>Season</span><select data-season>' + Object.keys(NS.SEASONS).map(function (k) { return '<option value="' + k + '"' + (k === st.season ? ' selected' : '') + '>' + NS.SEASONS[k] + '</option>'; }).join('') + '</select></label>' +
          '</div>' +
          '<div class="ns-stay-intro"><span class="ns-per-ic big">' + ic(p.icon) + '</span><div><h3>' + e(p.name) + '</h3><p>' + e(st.intro) + '</p>' +
            '<div class="ns-tips">' + st.tips.map(function (t) { return '<span class="ns-tip' + (t.own ? ' own' : '') + '">' + ic(t.icon) + e(t.text) + '</span>'; }).join('') + '</div></div></div>' +
          '<div class="ns-days" role="tablist">' + st.days.map(function (x, k) {
            return '<button role="tab" aria-selected="' + (k === day) + '" class="' + (k === day ? 'on' : '') + '" data-day="' + k + '"><small>' + (k === 0 ? 'Day 1' : 'Day ' + (k + 1)) + '</small>' + e(x.title) + '</button>';
          }).join('') + '</div>' +
          '<ol class="ns-tl">' + d.slots.map(function (s, k) {
            var pl = s.place;
            return '<li class="' + (s.hotel ? 'home' : '') + '"><time>' + e(s.time) + '</time><span class="ns-tl-dot" style="' + (s.cat ? '--pin:' + NS.CATS[s.cat].color : '') + '">' + ic(s.icon || 'pin') + '</span>' +
              '<div class="ns-tl-body"><h4>' + e(s.title) + '</h4><p>' + e(s.text) + '</p>' +
              (pl ? '<div class="ns-tl-meta"><span>' + ic('walk') + e(NS.fmtWalk(s.walk)) + '</span><button data-show-place="' + e(pl.id || '') + '">' + ic('map') + 'Show on map</button>' +
                '<a href="' + e(NS.mapsLink(pl, NS.get(data, 'hotel.city', ''))) + '" target="_blank" rel="noopener">' + ic('external') + 'Google Maps</a></div>' : '') + '</div>' +
              (pl && pl.thumb ? '<img class="ns-tl-img" src="' + e(pl.thumb) + '" alt="" loading="lazy">' : '') + '</li>';
          }).join('') + '</ol>' +
          '<div class="ns-stay-foot">' + (d.route && d.route.length > 1 && has('neighborhood') ? '<button class="ns-btn" data-fly="' + day + '">' + ic('route') + 'Walk this day on the map</button>' : '') +
            (rooms.length ? '<span class="ns-stay-room">' + ic('bed') + 'Our pick for you: <b>' + e(rooms[0].name) + '</b></span>' : '') + bookBtn('primary', 'Book this stay') + '</div>';
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
          return '<div class="ns-pg"><h4 style="--pin:' + NS.CATS[c].color + '">' + ic(NS.CATS[c].icon) + e(NS.CATS[c].plural.charAt(0).toUpperCase() + NS.CATS[c].plural.slice(1)) + '<small>' + places.filter(function (x) { return x.cat === c; }).length + '</small></h4><ul>' +
            xs.map(function (x) { return '<li><button data-show-place="' + e(x.id || '') + '"><b>' + e(x.name) + '</b>' + (x.note ? '<em>' + ic('sparkle') + e(x.note) + '</em>' : '') + '</button><span>' + x.walk + ' min</span></li>'; }).join('') + '</ul></div>';
        }).join('');
        return head('neighborhood', NS.get(data, 'hotel.area', '') || 'The neighbourhood', n.title || 'Everything is a short walk away', '<p>' + e(n.intro || NS.draft.neighborhood(data)) + '</p>') +
          '<div class="ns-hood">' +
          '<div class="ns-map-wrap"><div class="ns-map-slot"></div><div class="ns-map-legend"><span>' + ic('compass') + 'Drag to turn · tap a pin for details</span></div></div>' +
          '<div class="ns-hood-side"><div class="ns-filters">' + '<button class="' + (S.filter.length ? '' : 'on') + '" data-cat="">All</button>' + cats.map(function (c) {
            return '<button class="' + (S.filter.indexOf(c) >= 0 ? 'on' : '') + '" data-cat="' + c + '" style="--pin:' + NS.CATS[c].color + '"><i></i>' + e(NS.CATS[c].label) + '</button>';
          }).join('') + '</div><div class="ns-pgs">' + (groups || '<p class="ns-empty">No places in this filter yet.</p>') + '</div></div></div>' +
          (landmarks.length ? '<div class="ns-lms">' + landmarks.map(function (x) {
            return '<article class="ns-lm"><img src="' + e(x.wiki.thumb) + '" alt="" loading="lazy"><div><span class="ns-lm-walk">' + ic('walk') + x.walk + ' min</span><h4>' + e(x.name) + '</h4><p>' + e(NS.firstSentence(x.wiki.extract, 150)) + '</p>' +
              (x.wiki.url ? '<a href="' + e(x.wiki.url) + '" target="_blank" rel="noopener">Read more</a>' : '') + '</div></article>';
          }).join('') + '</div>' : '') +
          (n.credit ? '<p class="ns-small">' + e(n.credit) + '</p>' : '');
      },

      film: function () {
        var vids = (data.videos || []).filter(function (v) { return v && v.src; });
        if (!vids.length) return '';
        var cur = Math.min(S.vid || 0, vids.length - 1), v = vids[cur], vi = NS.videoInfo(mediaSrc(v.src));
        var player = vi.type === 'file'
          ? '<video src="' + e(vi.src) + (v.start ? '#t=' + (+v.start) : '') + '" controls playsinline preload="metadata"' + (v.poster ? ' poster="' + e(mediaSrc(v.poster)) + '"' : '') + '></video>'
          : '<iframe src="' + e(vi.embed) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy" title="' + e(v.title || 'Video') + '"></iframe>';
        return head('film', 'Watch', 'See it for yourself', '') +
          '<div class="ns-film-main"><div class="ns-embed">' + player + '</div>' + (v.title || v.text ? '<div class="ns-film-cap"><h3>' + e(v.title || '') + '</h3><p>' + e(v.text || '') + (v.credit ? ' <small>' + e(v.credit) + '</small>' : '') + '</p></div>' : '') + '</div>' +
          (vids.length > 1 ? '<div class="ns-tabs">' + vids.map(function (x, k) { return '<button class="' + (k === cur ? 'on' : '') + '" data-vid="' + k + '">' + ic('play') + e(x.title || 'Video ' + (k + 1)) + '</button>'; }).join('') + '</div>' : '');
      },

      dining: function () {
        var d = data.dining || {};
        if (!d.name && !d.body) return '';
        var photos = (d.photos || []).filter(Boolean).slice(0, 3);
        return '<div class="ns-dine"><div class="ns-dine-text"><div class="ns-eyebrow">' + e(d.eyebrow || 'Eat & drink') + '</div><h2>' + e(sectionTitle('dining', d.title || d.name)) + '</h2>' +
          '<div class="ns-prose">' + NS.rich(d.body || '') + '</div>' +
          ((d.facts || []).length ? '<ul class="ns-facts">' + d.facts.map(function (f) { return '<li>' + ic(f.icon || 'clock') + '<span>' + e(f.text) + '</span></li>'; }).join('') + '</ul>' : '') +
          '<div class="ns-row">' + (d.link ? '<a class="ns-btn primary" href="' + e(d.link) + '" target="_blank" rel="noopener">' + e(d.link_label || 'See the menu') + ic('arrow') + '</a>' : '') +
          (d.phone ? '<a class="ns-btn" href="tel:' + e(String(d.phone).replace(/\s+/g, '')) + '">' + ic('phone') + 'Reserve a table</a>' : '') + '</div></div>' +
          '<div class="ns-dine-pics n' + photos.length + '">' + photos.map(function (ph, k) { return '<img src="' + e(mediaSrc(ph)) + '" alt="" loading="lazy" data-lb="dine" data-lb-i="' + k + '">'; }).join('') + '</div></div>';
      },

      reviews: function () {
        var ratings = data.ratings || [], reviews = (data.reviews || []).filter(function (r) { return r && r.quote; });
        if (!ratings.length && !reviews.length) return '';
        return head('reviews', 'Guests say', 'Loved by our guests', '') +
          (ratings.length ? '<div class="ns-scores">' + ratings.map(function (r) {
            return '<a class="ns-score"' + (r.url ? ' href="' + e(r.url) + '" target="_blank" rel="noopener"' : '') + '><b>' + e(r.score) + '<small>/' + e(r.out_of || 10) + '</small></b><span>' + e(r.source) + '</span>' + (r.count ? '<em>' + e(r.count) + ' reviews</em>' : '') + '</a>';
          }).join('') + '</div>' : '') +
          (reviews.length ? '<div class="ns-quotes">' + reviews.map(function (r) {
            return '<blockquote class="ns-quote">' + ic('quote') + '<p>' + e(r.quote) + '</p><footer><b>' + e(r.author || 'A guest') + '</b>' + (r.source ? ' · ' + e(r.source) : '') + (r.date ? ' · ' + e(r.date) : '') + '</footer></blockquote>';
          }).join('') + '</div>' : '');
      },

      booking: function () {
        var b = data.booking || {}, pay = b.payment || {}, h = data.hotel || {};
        var ch = (b.channels || []).filter(function (c) { return c && (c.url || c.kind === 'phone' || c.kind === 'email'); });
        var chBtns = ch.map(function (c, i) {
          var meta = NS.CHANNELS[c.kind] || NS.CHANNELS.other, url = c.url;
          if (c.kind === 'phone' && !url && h.phone) url = 'tel:' + String(h.phone).replace(/\s+/g, '');
          if (c.kind === 'email' && !url && h.email) url = 'mailto:' + h.email;
          return '<a class="ns-btn' + (i === 0 ? ' primary' : '') + '" href="' + e(url || '#') + '" target="_blank" rel="noopener">' + ic(meta.icon) + e(c.label || meta.label) + '</a>';
        }).join('');
        var methods = (pay.methods || []).map(function (m) { return '<span class="ns-paym">' + ic(m === 'cash' ? 'euro' : 'card') + e(NS.PAYMENTS[m] || m) + '</span>'; }).join('');
        var pol = (b.policies || []).filter(function (x) { return x && x.title; });
        return head('booking', 'Book with confidence', 'How booking and payment work', b.intro ? '<p>' + e(b.intro) + '</p>' : '') +
          '<ol class="ns-steps">' +
            '<li><span class="ns-step-n">1</span><h3>' + ic('calendar') + 'Choose your dates</h3><p>' + e(b.step1 || 'Check prices and availability on the booking site you trust, or contact us directly.') + '</p><div class="ns-row wrap">' + chBtns + '</div></li>' +
            '<li><span class="ns-step-n">2</span><h3>' + ic('card') + 'Pay the way you like</h3><p>' + e(pay.when || 'You pay when you book or at the hotel, depending on the rate you choose.') + '</p>' + (methods ? '<div class="ns-paylist">' + methods + '</div>' : '') +
              (pay.note ? '<p class="ns-small">' + e(pay.note) + '</p>' : '') + '</li>' +
            '<li><span class="ns-step-n">3</span><h3>' + ic('key') + 'Arrive and relax</h3><p>' + e(b.step3 || ('Check-in from ' + (h.checkin || '15:00') + ', check-out until ' + (h.checkout || '12:00') + '. We will have your room ready.')) + '</p></li>' +
          '</ol>' +
          (b.perk ? '<div class="ns-perk">' + ic('star') + '<p>' + e(b.perk) + '</p></div>' : '') +
          (pol.length ? '<div class="ns-pols">' + pol.map(function (x) { return '<div class="ns-pol">' + ic(x.icon || 'info') + '<div><h4>' + e(x.title) + '</h4><p>' + e(x.text || '') + '</p></div></div>'; }).join('') + '</div>' : '');
      },

      faq: function () {
        var list = (data.faq && data.faq.length ? data.faq : NS.draft.faq(data)).filter(function (f) { return f && f.q; });
        if (!list.length) return '';
        return head('faq', 'Good to know', 'Questions guests ask', '') +
          '<div class="ns-faq">' + list.map(function (f) { return '<details><summary>' + e(f.q) + ic('down') + '</summary><div class="ns-prose">' + NS.rich(f.a || '') + '</div></details>'; }).join('') + '</div>';
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
          (h.lat != null ? '<a class="ns-btn primary" href="' + e(NS.directions(h.lat, h.lng)) + '" target="_blank" rel="noopener">' + ic('route') + 'Directions</a>' : '') +
          ((c.social || []).length ? '<div class="ns-social">' + c.social.map(function (s) { return '<a href="' + e(s.url) + '" target="_blank" rel="noopener">' + e(s.label) + '</a>'; }).join('') + '</div>' : '') + '</div>' +
          (ways.length ? '<div class="ns-ways">' + ways.map(function (w) { return '<div class="ns-way">' + ic(w.icon || 'route') + '<div><h4>' + e(w.title) + '</h4><p>' + e(w.text || '') + '</p></div></div>'; }).join('') + '</div>' : '') + '</div>';
      }
    };
    var PERSONA_SECTIONS = ['hero', 'personas', 'highlights', 'rooms', 'stay', 'neighborhood'];
    function has(id) { return enabledSections().some(function (s) { return s.id === id; }); }

    /* ---------------------------------------------------------------- frame: nav, footer, theme */
    function nav() {
      var h = data.hotel || {}, p = persona();
      var links = [['rooms', 'Rooms'], ['stay', 'Your stay'], ['neighborhood', 'Neighbourhood'], ['booking', 'Booking']].filter(function (l) { return has(l[0]); });
      return '<nav class="ns-nav" aria-label="Site"><div class="ns-nav-in"><a class="ns-brand" href="#ns-top">' + NS.orn.monogram(h.name) + '<span>' + e(h.name || 'Hotel') + '</span></a>' +
        '<div class="ns-links">' + links.map(function (l) { return '<a href="#ns-' + l[0] + '">' + l[1] + '</a>'; }).join('') + '</div>' +
        (p ? '<button class="ns-pill" data-persona="" title="Show everything">' + ic(p.icon) + '<span>' + e(p.name) + '</span>' + ic('x') + '</button>' : '') +
        bookBtn('primary sm', 'Book') + '<button class="ns-burger" data-burger aria-label="Menu">' + ic('menu') + '</button></div>' +
        '<div class="ns-sheet" data-sheet hidden>' + links.map(function (l) { return '<a href="#ns-' + l[0] + '">' + l[1] + '</a>'; }).join('') +
        (has('personas') ? '<a href="#ns-personas">Who is coming?</a>' : '') + (has('contact') ? '<a href="#ns-contact">Contact</a>' : '') + '</div></nav>';
    }
    function footer() {
      var h = data.hotel || {}, credits = (data.credits || []).filter(function (c) { return c && c.text; });
      var pl = opts.platform || { name: 'Nouveau Stay' };
      return '<footer class="ns-foot">' + NS.orn.divider() + '<div class="ns-foot-in"><div>' + NS.orn.monogram(h.name) + '<b>' + e(h.name || '') + '</b><p>' + e([h.address, h.phone].filter(Boolean).join(' · ')) + '</p></div>' +
        (credits.length ? '<details class="ns-credits"><summary>Photo and data credits</summary><ul>' + credits.map(function (c) {
          return '<li>' + (c.url ? '<a href="' + e(c.url) + '" target="_blank" rel="noopener">' + e(c.text) + '</a>' : e(c.text)) + '</li>';
        }).join('') + '</ul></details>' : '') +
        '<p class="ns-made">© ' + new Date().getFullYear() + ' ' + e(h.name || '') + ' · Website made with ' + (pl.url ? '<a href="' + e(pl.url) + '" target="_blank" rel="noopener">' + e(pl.name) + '</a>' : e(pl.name)) + '</p></div></footer>';
    }
    function applyTheme() {
      var t = data.theme || {}, pal = NS.PALETTES[t.palette] || NS.PALETTES.riga, f = NS.FONTS[t.fonts] || NS.FONTS.belle;
      var c = pal.c, st = root.style;
      st.setProperty('--b', c.bg); st.setProperty('--s', c.surface); st.setProperty('--i', c.ink); st.setProperty('--m', c.muted);
      st.setProperty('--l', c.line); st.setProperty('--p', c.brand); st.setProperty('--pi', c.brandInk); st.setProperty('--a', c.accent);
      st.setProperty('--so', c.soft); st.setProperty('--d', c.deep);
      st.setProperty('--fd', '"' + f.display + '", Georgia, serif'); st.setProperty('--fb', '"' + f.body + '", system-ui, sans-serif');
      root.setAttribute('data-orn', t.ornament || 'rich');
      root.setAttribute('data-dark', pal.dark ? '1' : '0');
      root.setAttribute('data-fonts', t.fonts || 'belle');
      root.classList.add('ns');
      if (opts.mode !== 'preview' && document.body === root.parentNode) document.body.style.background = c.bg;
      var link = document.getElementById('ns-fonts');
      var href = NS.fontsUrl(t.fonts);
      if (!link) { link = document.createElement('link'); link.id = 'ns-fonts'; link.rel = 'stylesheet'; document.head.appendChild(link); }
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
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
        if (p && line) line.insertAdjacentHTML('afterend', '<p class="ns-hero-for">' + ic(p.icon) + '<span><b>For ' + e(p.name.toLowerCase()) + ':</b> ' + e(p.hook) + '</span></p>');
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
      var lb = t.closest('[data-lb]');
      if (lb) {
        var group = lb.getAttribute('data-lb'), imgs = root.querySelectorAll('[data-lb="' + group + '"]');
        NS.Lightbox(Array.prototype.map.call(imgs, function (im) { return { src: im.currentSrc || im.src, caption: im.alt || (im.nextElementSibling && im.nextElementSibling.textContent) || '' }; }), +lb.getAttribute('data-lb-i') || 0);
        return;
      }
      var room;
      if ((room = t.closest('[data-room-photos]'))) {
        var r = (data.rooms || []).filter(function (x) { return x && x.name; })[+room.getAttribute('data-room-photos')];
        NS.Lightbox((r.photos || []).map(function (p) { return { src: mediaSrc(p), caption: r.name }; }), 0); return;
      }
      if ((room = t.closest('[data-room-pano]'))) {
        var r2 = roomAt(room.getAttribute('data-room-pano'));
        var m = NS.Modal('<div class="ns-pano tall" data-pano></div><p class="ns-wt-note">' + e(r2.name) + ': drag to look around.</p>');
        var pw = NS.Pano(m.el.querySelector('[data-pano]'), mediaSrc(r2.pano)); m.onclose = function () { pw.destroy(); }; return;
      }
      if ((room = t.closest('[data-room-tour]'))) {
        var r3 = roomAt(room.getAttribute('data-room-tour'));
        NS.Modal('<div class="ns-embed"><iframe src="' + e(NS.videoInfo(r3.tour).embed || r3.tour) + '" allow="fullscreen; xr-spatial-tracking" allowfullscreen title="3D tour"></iframe></div>'); return;
      }
      if ((room = t.closest('[data-room-video]'))) {
        var r4 = roomAt(room.getAttribute('data-room-video')), vi = NS.videoInfo(mediaSrc(r4.video));
        NS.Modal('<div class="ns-embed">' + (vi.type === 'file' ? '<video src="' + e(vi.src) + '" controls autoplay playsinline></video>' : '<iframe src="' + e(vi.embed) + '" allow="autoplay; fullscreen" allowfullscreen title="Room video"></iframe>') + '</div>'); return;
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
    function onChange(ev) {
      var t = ev.target;
      if (t.matches('[data-stay-persona]')) { S.persona = t.value; S.nights = null; S.day = 0; redrawPersonaParts(); var st = root.querySelector('#ns-stay'); if (st) st.scrollIntoView({ block: 'start' }); if (opts.stats) ping('p', t.value); }
      if (t.matches('[data-season]')) { S.season = t.value; redrawSection('stay'); }
    }
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);

    draw();
    if (opts.mode === 'live') ping('view');
    if (S.persona && opts.mode !== 'preview') setTimeout(function () { var el = root.querySelector('#ns-stay'); if (el && location.hash.indexOf('for=') >= 0) el.scrollIntoView(); }, 400);

    return {
      update: function (d) { data = S.data = d; S.filter = null; draw(); },
      setPersona: setPersona,
      scrollTo: function (id) { var el = root.querySelector('#ns-' + id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
      state: S,
      destroy: function () { destroyWidgets(); if (S.map) S.map.destroy(); root.removeEventListener('click', onClick); root.removeEventListener('change', onChange); root.innerHTML = ''; }
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
    wrap.innerHTML = '<div class="ns-modal-box" role="dialog" aria-modal="true"><button class="ns-x" data-x aria-label="Close">' + ic('x') + '</button>' + html + '</div>';
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
    var m = NS.Modal('<div class="ns-lb"><img alt=""><p class="ns-lb-cap"></p><button class="ns-lb-btn prev" data-lb-go="-1" aria-label="Previous">' + ic('left') +
      '</button><button class="ns-lb-btn next" data-lb-go="1" aria-label="Next">' + ic('right') + '</button><span class="ns-lb-n"></span></div>');
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
    img.onerror = function () { el.classList.add('error'); el.insertAdjacentHTML('beforeend', '<p class="ns-pano-err">This 360° photo could not be loaded.</p>'); };
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
      (p.note ? '<em>' + e(p.note) + '</em>' : '') + '<a href="' + e(NS.mapsLink(p)) + '" target="_blank" rel="noopener">Open in Google Maps</a></div>';
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
        map.addLayer({ id: 'ns-rings-l', type: 'symbol', source: 'ns-rings', layout: { 'symbol-placement': 'line', 'text-field': ['concat', ['to-string', ['get', 'm']], ' min'], 'text-size': 11,
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
        return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(1) + '" class="rg"/><text x="' + cx + '" y="' + (cy - r + 14).toFixed(1) + '" class="rl">' + m + ' min</text>';
      }).join('');
      var line = '';
      if (route && route.length) line = '<polyline class="rt" points="' + [[cx, cy]].concat(route.map(pos)).map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ') + '"/>';
      var dots = places.filter(function (p) { return p.lat != null && p.walk <= maxMin; }).slice(0, 140).map(function (p) {
        var q = pos(p), on = focusId != null && String(p.id) === String(focusId);
        return '<g class="pt' + (on ? ' on' : '') + '" data-pid="' + e(p.id) + '" transform="translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ')"><circle r="' + (on ? 9 : 6) + '" style="fill:' + NS.CATS[p.cat].color + '"/>' +
          (on || p.wiki ? '<text x="10" y="4">' + e(p.name) + '</text>' : '') + '<title>' + e(p.name + ' · ' + p.walk + ' min') + '</title></g>';
      }).join('');
      el.innerHTML = '<svg class="ns-flat" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Map of places around the hotel">' +
        '<defs><radialGradient id="nsfg"><stop offset="0" class="g0"/><stop offset="1" class="g1"/></radialGradient></defs><rect width="' + W + '" height="' + H + '" fill="url(#nsfg)"/>' +
        rings + '<path class="cmp" d="M' + cx + ' 22l8 22h-16zM' + cx + ' 578l8-22h-16z"/><text x="' + cx + '" y="18" class="rl n">N</text>' + line + dots +
        '<g class="ht" transform="translate(' + cx + ' ' + cy + ')"><path d="M-14 16V-2a14 14 0 0 1 28 0v18z"/><text y="9">' + e((o.name || 'H').charAt(0)) + '</text></g></svg>' +
        '<p class="ns-flat-note">Illustrated map: directions are true, distances are walking minutes.</p>';
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
