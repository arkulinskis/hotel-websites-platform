/* ns-editor.js: the site editor's field panels (window.NSEd), kept as one JavaScript engine.
   Every field is bound to a path in the site JSON (data-k="hotel.name"); the Python page (client_code/Pages/Edit) owns
   the frame around it: top bar, the tab rail, saving (save_site with a version number), the Publish panel, the
   dialogs (photo library, confirm) and the live preview (Components/SitePreview, also drawn here by NSEd.preview).

     NSEd.create(el, dataJson, siteJson, hooks) -> ed
       ed.draw(tab)          draw one tab's panel into el ('start', 'basics', 'look', 'texts', 'rooms', 'media', 'area',
                             'guests', 'booking'; 'publish' is a Python Form)
       ed.dataJson()         the site JSON now (what save_site stores)
       ed.data()             the live JS object (for NSApp.exportSite)
       ed.get(path) / ed.set(path, value)   one field (the Publish panel's SEO fields)
       ed.setSite(siteJson)  status / url after publishing
       ed.setPersona(id)     the Guests tab opens that profile
       ed.setPreview(p)      the NSEd.preview object: every change is pushed to it
       ed.top()              JSON {name, personas: [{id, name}]} for the top bar
       ed.destroy()
     hooks (Python functions): changed(optsJson), tab(name), persona(id), library(kind, multi, refsJson) -> JSON
       list of refs or "upload", previewMsg(msgJson)
     NSEd.preview(el, onMessage) -> {push(data), post(msg), fit(device), destroy()}   the iframe preview (ns-site.js)
     NSEd.statsHtml(statsJson) + NSEd.statsBind(el)   the visits chart (SVG) of the Publish panel
   Server calls inside the engine go through UI.api / UI.apiQuiet (ns-app.js -> Python). */
(function () {
  'use strict';
  var esc = UI.esc, NS = window.NSSite;
  var TABS = [['start', 'Overview', 'grid'], ['basics', 'Hotel', 'home'], ['look', 'Look', 'sparkle'], ['texts', 'Texts', 'edit'], ['rooms', 'Rooms', 'bed'],
    ['media', 'Media', 'image'], ['area', 'Area', 'map'], ['guests', 'Guests', 'users'], ['booking', 'Booking', 'calendar'], ['publish', 'Publish', 'globe']];
  UI.ICONS.bed = '<path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M3 18v2M21 18v2"/><path d="M6 9V7h5v2M13 9V7h5v2"/>';
  var SECTION_TAB = { hero: 'look', personas: 'guests', story: 'texts', highlights: 'texts', rooms: 'rooms', walkthrough: 'media', gallery: 'media', stay: 'guests',
    neighborhood: 'area', film: 'media', dining: 'media', reviews: 'booking', booking: 'booking', faq: 'booking', contact: 'basics' };
  var TAB_SECTION = { look: 'hero', texts: 'story', rooms: 'rooms', media: 'gallery', area: 'neighborhood', guests: 'stay', booking: 'booking', basics: 'contact' };
  var HL_ICONS = ['home', 'cup', 'fork', 'glass', 'fire', 'book', 'bike', 'train', 'walk', 'wifi', 'star', 'heart', 'key', 'leaf', 'sun', 'moon', 'parking', 'paw', 'baby', 'sparkle', 'building', 'clock', 'info', 'shield', 'card', 'plane', 'calendar', 'route', 'euro', 'suitcase', 'x'];

  /* ------------------------------------------------------------------ paths in the site JSON */
  function get(obj, path) {
    var parts = String(path).split('.'), cur = obj;
    for (var i = 0; i < parts.length; i++) { if (cur == null) return undefined; cur = cur[parts[i]]; }
    return cur;
  }
  function set(obj, path, value) {
    var parts = String(path).split('.'), cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      var k = parts[i];
      if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      cur = cur[k];
    }
    cur[parts[parts.length - 1]] = value;
  }
  function list(obj, path) { var v = get(obj, path); if (!Array.isArray(v)) { v = []; set(obj, path, v); } return v; }

  /* ------------------------------------------------------------------ field builders */
  function fld(label, path, o) {
    o = o || {};
    var v = get(D(), path); v = v == null ? '' : v;
    var attrs = ' data-k="' + esc(path) + '"' + (o.num ? ' data-num' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.max ? ' maxlength="' + o.max + '"' : '');
    var input = o.area ? '<textarea' + attrs + ' rows="' + (o.rows || 4) + '"' + (o.tall ? ' class="tall"' : '') + '>' + esc(v) + '</textarea>'
      : '<input type="' + (o.type || 'text') + '"' + attrs + ' value="' + esc(Array.isArray(v) ? v.join(', ') : v) + '"' + (o.csv ? ' data-csv' : '') + '>';
    return '<label class="ui-field"><span>' + esc(label) + (o.opt ? ' <em>(optional)</em>' : '') + '</span>' + input + (o.hint ? '<p class="ui-hint">' + o.hint + '</p>' : '') + '</label>';
  }
  function sel(label, path, opts, o) {
    var v = get(D(), path);
    return '<label class="ui-field"><span>' + esc(label) + '</span><select data-k="' + esc(path) + '"' + ((o && o.num) ? ' data-num' : '') + '>' + opts.map(function (x) {
      return '<option value="' + esc(x[0]) + '"' + (String(v == null ? '' : v) === String(x[0]) ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select></label>';
  }
  function chip(path, value, label) {
    var arr = get(D(), path) || [];
    return '<label class="ed-chip"><input type="checkbox" data-arr="' + esc(path) + '" value="' + esc(value) + '"' + (arr.indexOf(value) >= 0 ? ' checked' : '') + '>' + esc(label) + '</label>';
  }
  function tools(path, i, n) {
    return '<span class="ed-box-tools">' + (i > 0 ? '<button class="ed-icb" data-mv="' + path + '.' + i + '" data-dir="-1" title="Move up">' + UI.icon('chevron', 'up') + '</button>' : '') +
      (i < n - 1 ? '<button class="ed-icb" data-mv="' + path + '.' + i + '" data-dir="1" title="Move down">' + UI.icon('chevron') + '</button>' : '') +
      '<button class="ed-icb" data-del="' + path + '.' + i + '" title="Remove">' + UI.icon('trash') + '</button></span>';
  }
  function pics(path, o) {
    o = o || {};
    var v = get(D(), path);
    if (o.single) {
      return '<div class="ui-field"><span>' + esc(o.label || 'Photo') + '</span>' + (v ? '<div class="ed-pic big" style="' + NSApp.coverStyle(v) + '"><button data-unpick="' + esc(path) + '" aria-label="Remove">' + UI.icon('x') + '</button></div>' : '') +
        '<div class="ui-row" style="margin-top:8px"><button class="ui-btn sm" data-pick1="' + esc(path) + '" data-kind="' + (o.kind || 'image') + '">' + UI.icon('image') + (v ? 'Change' : 'Choose') + '</button>' +
        '<button class="ui-btn sm ghost" data-upload1="' + esc(path) + '" data-kind="' + (o.kind || 'image') + '">' + UI.icon('plus') + 'Upload' + (o.kind === 'pano' ? ' 360° photo' : o.kind === 'video' ? ' video' : '') + '</button></div>' + (o.hint ? '<p class="ui-hint">' + o.hint + '</p>' : '') + '</div>';
    }
    var arr = Array.isArray(v) ? v : [];
    return '<div class="ui-field"><span>' + esc(o.label || 'Photos') + '</span><div class="ed-pics">' + arr.map(function (ref, i) {
      return '<div class="ed-pic" style="' + NSApp.coverStyle(ref) + '"><button data-unpick="' + esc(path) + '" data-i="' + i + '" aria-label="Remove">' + UI.icon('x') + '</button></div>';
    }).join('') + '<button class="ed-addpic" data-pick="' + esc(path) + '" title="Choose from your photos">' + UI.icon('plus') + '</button></div>' +
      '<button class="ui-btn sm ghost" data-upload="' + esc(path) + '">' + UI.icon('camera') + 'Upload photos</button></div>';
  }

  var S = null;   // editor state, per visit
  function D() { return S.data; }

  var SECTION_TAB_ = SECTION_TAB;

  function create(el, dataJson, siteJson, hooks) {
    var st = S = { data: JSON.parse(dataJson), site: JSON.parse(siteJson), tab: 'start', media: null, persona: null, pn: null,
      pq: '', pcat: '', plimit: 80, preview: null };
    if (!st.data.sections || !st.data.sections.length) st.data.sections = NS.SECTIONS.map(function (s) { return { id: s.id, on: true }; });
    NS.SECTIONS.forEach(function (s) { if (!st.data.sections.some(function (x) { return x.id === s.id; })) st.data.sections.push({ id: s.id, on: false }); });
    var view = el;

    function changed(o) {
      o = o || {};
      if (st.preview) st.preview.push(st.data);
      try { hooks.changed(JSON.stringify(o)); } catch (e) { console.error(e); }
      if (o.panel) drawPanel();
    }
    function post(msg) { if (st.preview) st.preview.post(msg); }
    function drawPanel() {
      if (!PANELS[st.tab]) return;
      var scroller = el.closest('.ed-panel') || el, y = scroller.scrollTop, same = el.getAttribute('data-for') === st.tab;
      el.innerHTML = PANELS[st.tab]();
      el.setAttribute('data-for', st.tab);
      scroller.scrollTop = same ? y : 0;
      if (st.tab === 'media' && !st.media) loadMedia();
    }
    function loadMedia() {
      return UI.apiQuiet('list_media', st.site.id).then(function (r) { st.media = r.items; if (st.tab === 'media') drawPanel(); return st.media; });
    }

    var PANELS = {
      start: function () {
        var d = st.data, places = NS.places(d), rooms = d.rooms || [];
        var checks = [
          [!!(NS.get(d, 'hero.image') || NS.get(d, 'hero.video') || (NS.get(d, 'hero.film', []) || []).length), 'A photo, film or video for the opening screen', 'look'],
          [String(NS.get(d, 'story.body', '')).length > 80, 'Your story, in your own words', 'texts'],
          [rooms.some(function (r) { return (r.photos || []).length; }), 'Photos of your rooms', 'rooms'],
          [(NS.get(d, 'booking.channels', []) || []).some(function (c) { return c.url; }), 'At least one booking link', 'booking'],
          [places.length >= 20, 'The neighbourhood scanned (' + places.length + ' places)', 'area'],
          [NS.enabledPersonas(d).length >= 4, 'Guest profiles chosen (' + NS.enabledPersonas(d).length + ')', 'guests'],
          [st.site.status === 'published', 'Published at your own link', 'publish']];
        var done = checks.filter(function (c) { return c[0]; }).length;
        var todo = d.todo || [], tdone = d.todo_done || [];
        return '<h2>' + esc(NS.get(d, 'hotel.name', 'Your site')) + '</h2><p class="muted">' + (st.site.status === 'published' ? 'Live at <a href="' + esc(st.site.url) + '" target="_blank" rel="noopener">' + esc((st.site.url || '').replace(/^https?:\/\//, '')) + '</a>.' : 'A draft: only you can see it until you publish.') + '</p>' +
          '<div class="ed-stats"><div class="ed-stat"><b>' + places.length + '</b><span>places nearby</span></div><div class="ed-stat"><b>' + rooms.length + '</b><span>rooms</span></div><div class="ed-stat"><b>' + NS.enabledPersonas(d).length + '</b><span>guest profiles</span></div></div>' +
          '<h3>' + UI.icon('check') + 'Ready to impress (' + done + ' of ' + checks.length + ')</h3>' +
          checks.map(function (c) { return '<div class="ed-check ' + (c[0] ? 'ok' : 'no') + '">' + UI.icon(c[0] ? 'check' : 'info') + '<span>' + esc(c[1]) + '</span>' + (c[0] ? '' : '<button class="ui-btn sm" data-tab="' + c[2] + '">Do it</button>') + '</div>'; }).join('') +
          (todo.length ? '<div class="ed-todo"><b>' + UI.icon('bulb') + ' To check</b>' + todo.map(function (t) {
            return '<label><input type="checkbox" data-todo="' + esc(t) + '"' + (tdone.indexOf(t) >= 0 ? ' checked' : '') + '><span>' + esc(t) + '</span></label>'; }).join('') +
            (d.sources ? '<p class="small muted" style="margin:6px 0 0">' + esc(d.sources) + '</p>' : '') + '</div>' : '') +
          '<h3>' + UI.icon('sparkle') + 'Tips</h3><p class="small muted">Hover a section of the preview and press <b>Edit</b> to jump to its settings. Use <b>Preview as</b> (top) to see the site through a guest\'s eyes.</p>';
      },

      basics: function () {
        return '<h2>The hotel</h2><p class="muted">The facts guests look for. Everything here appears on the site.</p>' +
          fld('Hotel name', 'hotel.name', { max: 90 }) +
          '<div class="ed-g2">' + sel('Kind', 'hotel.kind', ['Boutique hotel', 'Hotel', 'Guesthouse', 'Bed & breakfast', 'Aparthotel', 'Hostel', 'Inn', 'Villa'].map(function (k) { return [k, k]; })) +
          sel('Stars', 'hotel.stars', [[0, 'None'], [1, '1 star'], [2, '2 stars'], [3, '3 stars'], [4, '4 stars'], [5, '5 stars']], { num: true }) + '</div>' +
          fld('One line about the hotel', 'hotel.tagline', { max: 160 }) +
          '<h3>' + UI.icon('pin') + 'Where</h3>' + fld('Address', 'hotel.address') +
          '<div class="ed-g3">' + fld('Neighbourhood', 'hotel.area') + fld('City', 'hotel.city') + fld('Country', 'hotel.country') + '</div>' +
          '<div class="ed-g2">' + fld('Latitude', 'hotel.lat', { num: true }) + fld('Longitude', 'hotel.lng', { num: true }) + '</div>' +
          '<button class="ui-btn sm" data-relocate>' + UI.icon('search') + 'Find the address on the map</button>' +
          '<h3>' + UI.icon('mail') + 'Contact</h3><div class="ed-g2">' + fld('Phone', 'hotel.phone', { type: 'tel' }) + fld('Email', 'hotel.email', { type: 'email' }) + '</div>' +
          fld('WhatsApp number', 'hotel.whatsapp', { opt: true, ph: '+371 2000 0000' }) +
          '<h3>' + UI.icon('clock') + 'Times and practical things</h3><div class="ed-g2">' + fld('Check-in from', 'hotel.checkin', { type: 'time' }) + fld('Check-out until', 'hotel.checkout', { type: 'time' }) + '</div>' +
          fld('Arrival note', 'hotel.checkin_note', { area: true, rows: 2, opt: true }) + fld('Breakfast', 'hotel.breakfast', { area: true, rows: 2, opt: true }) +
          fld('The building', 'hotel.building', { area: true, rows: 2, opt: true, hint: 'One sentence about the house. Used in drafted texts.' }) +
          fld('From the airport', 'hotel.airport', { area: true, rows: 2, opt: true }) + fld('Parking', 'hotel.parking', { area: true, rows: 2, opt: true }) +
          '<h3>' + UI.icon('star') + 'What you offer</h3><div class="ed-chips">' + Object.keys(NS.FEATURES).map(function (k) { return chip('hotel.features', k, NS.FEATURES[k].label); }).join('') + '</div>' +
          '<h3>' + UI.icon('route') + 'Getting here</h3>' + listEditor('contact.directions', function (x, i, p) {
            return '<div class="ed-g2">' + sel('Icon', p + '.icon', ['plane', 'train', 'parking', 'route', 'ship', 'walk', 'bike'].map(function (k) { return [k, k]; })) + fld('Title', p + '.title') + '</div>' + fld('How', p + '.text', { area: true, rows: 2 });
          }, { title: 'From …', text: '', icon: 'route' }, 'Add a way to get here') +
          '<h3>' + UI.icon('globe') + 'Social links</h3>' + listEditor('contact.social', function (x, i, p) { return '<div class="ed-g2">' + fld('Name', p + '.label', { ph: 'Instagram' }) + fld('Link', p + '.url', { type: 'url' }) + '</div>'; }, { label: '', url: '' }, 'Add a link');
      },

      look: function () {
        var d = st.data, kind = NS.get(d, 'hero.kind', 'photo');
        return '<h2>Look</h2><p class="muted">Pick a palette and the opening screen. Every look is Art Nouveau, made for phones first.</p>' +
          '<h3>' + UI.icon('sparkle') + 'Palette</h3><div class="ed-pals">' + Object.keys(NS.PALETTES).map(function (k) {
            var p = NS.PALETTES[k], c = p.c;
            return '<label class="ed-pal"><input type="radio" name="pal" data-k="theme.palette" value="' + k + '"' + (NS.get(d, 'theme.palette', 'riga') === k ? ' checked' : '') + '>' +
              '<div class="pv">' + [c.bg, c.brand, c.accent, c.deep].map(function (x) { return '<i style="background:' + x + '"></i>'; }).join('') + '</div><span>' + esc(p.name) + '</span></label>'; }).join('') + '</div>' +
          '<div class="ed-g2">' + sel('Typography', 'theme.fonts', Object.keys(NS.FONTS).map(function (k) { return [k, NS.FONTS[k].name]; })) +
          sel('Ornaments', 'theme.ornament', [['rich', 'Rich'], ['light', 'Light'], ['none', 'None']]) + '</div>' +
          '<h3>' + UI.icon('home') + 'Opening screen</h3>' +
          '<div class="ed-g2">' + sel('Show', 'hero.kind', [['photo', 'A photo'], ['film', 'A film of my photos'], ['video', 'A video']]) + sel('Layout', 'hero.style', [['full', 'Full screen'], ['arch', 'Arched window']]) + '</div>' +
          fld('Headline', 'hero.headline', { area: true, rows: 2, max: 200 }) +
          pics('hero.image', { single: true, label: kind === 'photo' ? 'Photo' : 'Poster photo (shown while loading, and in link previews)' }) +
          (kind === 'film' ? pics('hero.film', { label: 'Film photos (slow zooms and crossfades)' }) : '') +
          (kind === 'video' ? fld('Video link', 'hero.video', { type: 'url', hint: 'A YouTube or Vimeo link, an .mp4 link, or upload a video below. It plays muted, on a loop.' }) +
            '<button class="ui-btn sm ghost" data-upload1="hero.video" data-kind="video">' + UI.icon('plus') + 'Upload a video</button>' +
            '<div class="ed-g2" style="margin-top:10px">' + fld('Start at (seconds)', 'hero.start', { num: true, opt: true }) + fld('End at (seconds)', 'hero.end', { num: true, opt: true }) + '</div>' : '') +
          '<h3>' + UI.icon('grid') + 'Sections</h3><p class="small muted">Switch sections on or off, rename them, change their order.</p>' +
          (d.sections || []).map(function (s, i, a) {
            var meta = NS.SECTIONS.filter(function (x) { return x.id === s.id; })[0] || { label: s.id, icon: 'grid' };
            return '<div class="ed-sec' + (s.on === false ? ' off' : '') + '"><input type="checkbox" data-k="sections.' + i + '.on" data-bool' + (s.on !== false ? ' checked' : '') + ' aria-label="Show ' + esc(meta.label) + '">' +
              UI.icon(meta.icon === 'map' ? 'map' : meta.icon) + '<b>' + esc(meta.label) + '</b>' +
              (i > 0 ? '<button class="ed-icb" data-mv="sections.' + i + '" data-dir="-1" title="Move up">' + UI.icon('chevron', 'up') + '</button>' : '') +
              (i < a.length - 1 ? '<button class="ed-icb" data-mv="sections.' + i + '" data-dir="1" title="Move down">' + UI.icon('chevron') + '</button>' : '') + '</div>';
          }).join('');
      },

      texts: function () {
        return '<h2>Texts</h2><p class="muted">We drafted these from your facts and the neighbourhood. Make them yours. **Bold**, *italic* and [links](https://…) work.</p>' +
          '<h3>' + UI.icon('book') + 'Your story</h3>' + fld('Small title', 'story.eyebrow') + fld('Title', 'story.title') +
          fld('Story', 'story.body', { area: true, tall: true }) + '<button class="ui-btn sm ghost" data-draft="story">' + UI.icon('sparkle') + 'Write it for me</button>' +
          '<div style="height:10px"></div>' + fld('Signed', 'story.sign', { opt: true }) + pics('story.image', { single: true, label: 'Photo (arched frame)' }) + fld('Photo caption', 'story.caption', { opt: true }) +
          '<h3>' + UI.icon('star') + 'Why stay here</h3>' + listEditor('highlights', function (x, i, p) {
            return '<div class="ed-g2">' + sel('Icon', p + '.icon', HL_ICONS.map(function (k) { return [k, k]; })) + fld('Title', p + '.title') + '</div>' + fld('Text', p + '.text', { opt: true });
          }, { icon: 'star', title: '', text: '' }, 'Add a reason') + '<button class="ui-btn sm ghost" data-draft="highlights">' + UI.icon('sparkle') + 'Suggest from my facts</button>' +
          '<h3>' + UI.icon('map') + 'Neighbourhood</h3>' + fld('Title', 'neighborhood.title', { ph: 'Everything is a short walk away' }) + fld('Introduction', 'neighborhood.intro', { area: true, rows: 4 }) +
          '<button class="ui-btn sm ghost" data-draft="neighborhood">' + UI.icon('sparkle') + 'Write it for me</button>' +
          '<h3>' + UI.icon('users') + 'Who is coming?</h3>' + fld('Title', 'personas.title', { ph: 'Who is coming?' }) + fld('Line under it', 'personas.lead', { area: true, rows: 2, opt: true }) +
          '<h3>' + UI.icon('bed') + 'Rooms</h3>' + fld('Introduction', 'rooms_intro', { area: true, rows: 2, opt: true });
      },

      rooms: function () {
        var rooms = list(st.data, 'rooms');
        return '<h2>Rooms</h2><p class="muted">Each room gets photos, a 360° photo or a 3D tour, a video and the details guests compare. Tags help us recommend the right room to each kind of guest.</p>' +
          rooms.map(function (r, i) {
            var p = 'rooms.' + i;
            if (!r.id) r.id = 'r' + Date.now().toString(36) + i;
            return '<details class="ed-box"' + (i === 0 && rooms.length < 3 ? ' open' : '') + '><summary>' + UI.icon('bed') + esc(r.name || 'New room') + tools('rooms', i, rooms.length) + '</summary>' +
              fld('Name', p + '.name') + '<div class="ed-g3">' + fld('Size (m²)', p + '.size') + fld('Beds', p + '.beds') + fld('Guests', p + '.guests') + '</div>' +
              fld('Price from (per night)', p + '.price', { opt: true, ph: '€89' }) + fld('Description', p + '.text', { area: true, rows: 3 }) +
              fld('Features (comma-separated)', p + '.features', { csv: true, ph: 'Rain shower, Desk, Balcony' }) +
              '<div class="ui-field"><span>Tags</span><div class="ed-chips">' + Object.keys(NS.ROOM_TAGS).map(function (k) { return chip(p + '.tags', k, NS.ROOM_TAGS[k]); }).join('') + '</div></div>' +
              pics(p + '.photos') + pics(p + '.pano', { single: true, kind: 'pano', label: '360° photo', hint: 'A 2:1 panorama from a 360° camera or your phone\'s panorama mode.' }) +
              fld('3D tour link', p + '.tour', { type: 'url', opt: true, hint: 'Matterport, Kuula or any embeddable tour.' }) +
              fld('Video link', p + '.video', { type: 'url', opt: true, hint: 'YouTube, Vimeo or an .mp4 link.' }) + '<button class="ui-btn sm ghost" data-upload1="' + p + '.video" data-kind="video">' + UI.icon('plus') + 'Upload a video</button>' +
              '</details>';
          }).join('') + '<button class="ui-btn" data-add="rooms">' + UI.icon('plus') + 'Add a room</button>';
      },

      media: function () {
        var d = st.data, items = st.media;
        var gal = list(d, 'gallery.items');
        return '<h2>Photos, videos and tours</h2><p class="muted">Upload once, use anywhere. Photos are resized in your browser before upload.</p>' +
          '<h3>' + UI.icon('image') + 'Your library</h3>' +
          (items == null ? '<div class="ui-skel" style="min-height:80px"></div>' : items.length ? '<div class="ed-lib" style="max-height:220px">' + items.map(function (m) {
            return '<button class="' + (m.kind === 'video' ? 'vid' : '') + '" style="' + (m.kind === 'video' ? '' : NSApp.coverStyle(m.ref)) + '" data-libdel="' + esc(m.key) + '" title="' + esc(m.name) + ' (click to delete)"></button>'; }).join('') + '</div>'
            : '<p class="small muted">Nothing uploaded yet.</p>') +
          '<div class="ui-row"><button class="ui-btn sm primary" data-libup="image">' + UI.icon('camera') + 'Upload photos</button><button class="ui-btn sm" data-libup="video">' + UI.icon('plus') + 'Upload a video</button></div>' +
          '<h3>' + UI.icon('grid') + 'Gallery</h3>' + sel('Layout', 'gallery.layout', [['bento', 'Bento (mixed sizes)'], ['masonry', 'Masonry'], ['filmstrip', 'Film strip'], ['arcade', 'Arcade (arched frames)']]) +
          fld('Title', 'gallery.title', { opt: true }) +
          gal.map(function (g, i) {
            return '<div class="ed-sec"><span class="ed-pic" style="width:56px;height:42px;' + NSApp.coverStyle(g.src) + '"></span><input type="text" data-k="gallery.items.' + i + '.caption" value="' + esc(g.caption || '') + '" placeholder="Caption" style="flex:1">' +
              tools('gallery.items', i, gal.length).replace('ed-box-tools', 'ed-box-tools" style="margin:0') + '</div>';
          }).join('') + '<div class="ui-row" style="margin-top:8px"><button class="ui-btn sm" data-pick="gallery.items" data-obj>' + UI.icon('plus') + 'Add from library</button><button class="ui-btn sm ghost" data-upload="gallery.items" data-obj>' + UI.icon('camera') + 'Upload</button></div>' +
          '<h3>' + UI.icon('play') + 'Videos</h3>' + listEditor('videos', function (x, i, p) {
            return fld('Link (YouTube, Vimeo, .mp4) or upload', p + '.src', { type: 'url' }) + '<button class="ui-btn sm ghost" data-upload1="' + p + '.src" data-kind="video">' + UI.icon('plus') + 'Upload</button>' +
              fld('Title', p + '.title') + fld('Text', p + '.text', { opt: true }) + '<div class="ed-g2">' + fld('Start (s)', p + '.start', { num: true, opt: true }) + fld('Credit', p + '.credit', { opt: true }) + '</div>';
          }, { src: '', title: '' }, 'Add a video') +
          '<h3>' + UI.icon('compass') + '360° and tours</h3><p class="small muted">A 360° photo, an embedded 3D tour (Matterport, Kuula), or a photo walk.</p>' + listEditor('walkthrough.items', function (x, i, p) {
            var k = x.kind || 'pano';
            return '<div class="ed-g2">' + sel('Kind', p + '.kind', [['pano', '360° photo'], ['embed', '3D tour link'], ['photos', 'Photo walk']]) + fld('Title', p + '.title') + '</div>' +
              (k === 'pano' ? pics(p + '.src', { single: true, kind: 'pano', label: '360° photo' }) : k === 'embed' ? fld('Tour link', p + '.embed', { type: 'url' }) :
                listEditor(p + '.stops', function (y, j, q) { return pics(q + '.src', { single: true, label: 'Stop ' + (j + 1) }) + fld('Caption', q + '.caption'); }, { src: '', caption: '' }, 'Add a stop')) +
              fld('Note', p + '.text', { opt: true }) + fld('Credit', p + '.credit', { opt: true });
          }, { kind: 'pano', title: '360° view' }, 'Add a tour') +
          '<h3>' + UI.icon('glass') + 'Dining</h3>' + fld('Restaurant or bar name', 'dining.name', { opt: true }) + fld('Title', 'dining.title', { opt: true }) +
          fld('Text', 'dining.body', { area: true, rows: 4 }) + fld('One-line summary (used in stay stories)', 'dining.short', { opt: true }) + pics('dining.photos', { label: 'Photos (up to 3)' }) +
          '<div class="ed-g2">' + fld('Menu or page link', 'dining.link', { type: 'url', opt: true }) + fld('Button text', 'dining.link_label', { opt: true }) + '</div>' + fld('Reservation phone', 'dining.phone', { type: 'tel', opt: true });
      },

      area: function () {
        var d = st.data, all = NS.places(d), raw = list(d, 'places');
        var q = st.pq.toLowerCase();
        var rows = raw.map(function (p, i) { return { p: p, i: i, walk: (all.filter(function (x) { return x.id === p.id; })[0] || {}).walk }; })
          .filter(function (x) { return (!st.pcat || x.p.cat === st.pcat) && (!q || x.p.name.toLowerCase().indexOf(q) >= 0); })
          .sort(function (a, b) { return (b.p.pinned ? 1 : 0) - (a.p.pinned ? 1 : 0) || (a.walk || 99) - (b.walk || 99); });
        var scan = d.scan || {};
        return '<h2>Neighbourhood</h2><p class="muted">Everything near you, found automatically. Hide what you don\'t recommend, star your favourites and add a tip: tips and stars show up in every guest\'s stay story.</p>' +
          '<div class="ed-box"><b>' + raw.length + ' places</b> · ' + all.filter(function (p) { return p.walk <= 15; }).length + ' within 15 minutes' +
          (scan.at ? '<p class="small muted" style="margin:4px 0 0">Scanned ' + esc(UI.fmtDate(scan.at)) + (scan.sources && scan.sources.length ? ' from ' + esc(scan.sources.join(', ')) : '') + '</p>' : '') +
          '<div class="ui-row" style="margin-top:10px"><select data-radius style="width:auto">' + [[800, 'Close (800 m)'], [1300, 'Normal (1.3 km)'], [2000, 'Wide (2 km)']].map(function (r) {
            return '<option value="' + r[0] + '"' + ((scan.radius || 1300) === r[0] ? ' selected' : '') + '>' + r[1] + '</option>'; }).join('') + '</select>' +
          '<button class="ui-btn sm" data-rescan>' + UI.icon('refresh') + 'Scan again</button></div><p class="ui-hint">A new scan keeps your stars, tips and hidden places.</p></div>' +
          '<h3>' + UI.icon('plus') + 'Add a place</h3><form data-addplace class="ed-g2"><input type="text" name="name" placeholder="Name, e.g. Café Rigensis" required>' +
          '<select name="cat">' + NS.CAT_ORDER.map(function (c) { return '<option value="' + c + '">' + esc(NS.CATS[c].label) + '</option>'; }).join('') + '</select>' +
          '<input type="text" name="tip" placeholder="Your tip (optional)" style="grid-column:1/-1;margin-top:8px"><button class="ui-btn sm" type="submit" style="margin-top:8px">' + UI.icon('search') + 'Find and add</button></form>' +
          '<h3>' + UI.icon('pin') + 'Places</h3><div class="ed-g2"><input type="search" data-pq placeholder="Search" value="' + esc(st.pq) + '"><select data-pcat><option value="">All kinds</option>' +
          NS.CAT_ORDER.map(function (c) { return '<option value="' + c + '"' + (st.pcat === c ? ' selected' : '') + '>' + esc(NS.CATS[c].label) + '</option>'; }).join('') + '</select></div>' +
          '<div data-plist>' + rows.slice(0, st.plimit).map(function (x) {
            var p = x.p, path = 'places.' + x.i;
            return '<div class="ed-place' + (p.hidden ? ' hid' : '') + '"><i class="dot" style="background:' + (NS.CATS[p.cat] || {}).color + '"></i><div class="nm"><b>' + esc(p.name) + '</b><small>' + esc((NS.CATS[p.cat] || {}).label || p.cat) + (x.walk ? ' · ' + x.walk + ' min' : '') + (p.wiki ? ' · Wikipedia' : '') + '</small>' +
              (p.pinned || p.note ? '<input type="text" data-k="' + path + '.note" value="' + esc(p.note || '') + '" placeholder="Your tip for guests">' : '') + '</div>' +
              '<button class="ed-icb' + (p.pinned ? ' on' : '') + '" data-flag="' + path + '.pinned" title="Star: recommend it">' + UI.icon('star') + '</button>' +
              '<button class="ed-icb' + (p.hidden ? ' on' : '') + '" data-flag="' + path + '.hidden" title="Hide it">' + UI.icon('x') + '</button></div>';
          }).join('') + '</div>' + (rows.length > st.plimit ? '<button class="ui-btn sm block" data-more style="margin-top:10px">Show more (' + (rows.length - st.plimit) + ')</button>' : '');
      },

      guests: function () {
        var d = st.data, ranked = NS.rankPersonas(d), enabled = NS.get(d, 'personas.enabled', []) || [];
        var cur = st.persona && NS.persona(st.persona);
        var detail = '';
        if (cur) {
          var p = 'personas.overrides.' + cur.id, s = NS.story(d, cur.id, { nights: st.pn || cur.nights || 2 });
          detail = '<details class="ed-box" open><summary>' + NS.icon(cur.icon) + esc(cur.name) + '<span class="ed-box-tools"><button class="ed-icb" data-perclose title="Close">' + UI.icon('x') + '</button></span></summary>' +
            '<p class="small muted">' + esc(cur.line) + '</p>' +
            fld('Introduction (leave empty to write it automatically)', p + '.intro', { area: true, rows: 3, ph: s.intro }) +
            fld('Your tip for them', p + '.tip', { opt: true, ph: 'Ask for a table by the window at…' }) +
            '<div class="ui-field"><span>Recommend these rooms</span><div class="ed-chips">' + (d.rooms || []).map(function (r) { return chip(p + '.rooms', r.id, r.name || 'Room'); }).join('') + '</div></div>' +
            '<div class="ui-field"><span>Leave these out of their stay</span><div class="ed-chips">' + Object.keys(cur.w).map(function (c) { return chip(p + '.hide', c, NS.CATS[c].label); }).join('') + '</div></div>' +
            '<div class="ui-row"><span class="small muted">Their stay:</span><div class="ui-seg">' + [1, 2, 3].map(function (n) { return '<button data-pn="' + n + '" class="' + (s.nights === n ? 'on' : '') + '">' + n + ' night' + (n > 1 ? 's' : '') + '</button>'; }).join('') + '</div>' +
            '<button class="ui-btn sm" data-pershow="' + cur.id + '">' + UI.icon('globe') + 'See it on the site</button></div>' +
            '<div class="ed-story">' + s.days.map(function (day) {
              return '<h4>' + esc(day.title) + '</h4>' + day.slots.map(function (x) { return '<p><time>' + esc(x.time) + '</time>' + esc(x.title) + (x.walk ? ' <span class="muted">(' + x.walk + ' min)</span>' : '') + '</p>'; }).join('');
            }).join('') + '</div></details>';
        }
        return '<h2>Guests</h2><p class="muted">30 kinds of traveller. Visitors pick one, and your site rearranges itself for them, with a stay written hour by hour from the places around you. The score shows how well your area suits each one.</p>' +
          '<div class="ui-row" style="margin-bottom:12px"><button class="ui-btn sm" data-autoper="8">' + UI.icon('sparkle') + 'Pick the best 8</button><span class="small muted">' + enabled.length + ' shown on your site</span></div>' + detail +
          '<div class="ed-pers">' + ranked.map(function (x) {
            var on = enabled.indexOf(x.p.id) >= 0;
            return '<div class="ed-per' + (on ? ' on' : '') + '"><input type="checkbox" data-arr="personas.enabled" value="' + x.p.id + '"' + (on ? ' checked' : '') + ' aria-label="Show ' + esc(x.p.name) + '">' +
              '<span class="ic">' + NS.icon(x.p.icon) + '</span><div class="nm"><button data-per="' + x.p.id + '">' + esc(x.p.name) + '</button><div class="fit"><i style="--w:' + (x.fit.score * 10) + '%"></i>' + x.fit.score.toFixed(1) + '</div></div>' +
              '<label class="small" title="Show first"><input type="radio" name="feat" data-k="personas.featured" value="' + x.p.id + '"' + (NS.get(d, 'personas.featured', '') === x.p.id ? ' checked' : '') + '> First</label></div>';
          }).join('') + '</div>';
      },

      booking: function () {
        return '<h2>Booking and payment</h2><p class="muted">Guests book on the sites you already use. Explain how it works, when they pay and your house rules, so they book with confidence.</p>' +
          fld('Introduction', 'booking.intro', { area: true, rows: 2, opt: true }) +
          '<h3>' + UI.icon('calendar') + 'Where to book</h3>' + listEditor('booking.channels', function (x, i, p) {
            return '<div class="ed-g2">' + sel('Site', p + '.kind', Object.keys(NS.CHANNELS).map(function (k) { return [k, NS.CHANNELS[k].label]; })) + fld('Button text', p + '.label', { opt: true }) + '</div>' +
              fld('Link to your hotel there', p + '.url', { type: 'url', ph: 'https://www.booking.com/hotel/…' });
          }, { kind: 'booking', url: '' }, 'Add a booking site') +
          '<h3>' + UI.icon('card') + 'Payment</h3><div class="ed-chips">' + Object.keys(NS.PAYMENTS).map(function (k) { return chip('booking.payment.methods', k, NS.PAYMENTS[k]); }).join('') + '</div>' +
          fld('When do guests pay?', 'booking.payment.when', { area: true, rows: 2 }) + fld('Payment note', 'booking.payment.note', { opt: true }) +
          fld('Booking direct perk', 'booking.perk', { area: true, rows: 2, opt: true, ph: 'Book direct and get a welcome drink.' }) +
          '<h3>' + UI.icon('shield') + 'House rules</h3>' + listEditor('booking.policies', function (x, i, p) {
            return '<div class="ed-g2">' + sel('Icon', p + '.icon', HL_ICONS.map(function (k) { return [k, k]; })) + fld('Title', p + '.title') + '</div>' + fld('Text', p + '.text', { area: true, rows: 2 });
          }, { icon: 'info', title: '', text: '' }, 'Add a rule') +
          '<h3>' + UI.icon('star') + 'Scores</h3>' + listEditor('ratings', function (x, i, p) {
            return '<div class="ed-g3">' + fld('Source', p + '.source') + fld('Score', p + '.score') + fld('Out of', p + '.out_of', { num: true }) + '</div><div class="ed-g2">' + fld('Reviews', p + '.count', { opt: true }) + fld('Link', p + '.url', { type: 'url', opt: true }) + '</div>';
          }, { source: 'Booking.com', score: '9.0', out_of: 10 }, 'Add a score') +
          '<h3>' + UI.icon('chat') + 'Reviews</h3>' + listEditor('reviews', function (x, i, p) {
            return fld('Quote', p + '.quote', { area: true, rows: 2 }) + '<div class="ed-g3">' + fld('Name', p + '.author') + fld('Where', p + '.source', { opt: true }) + fld('When', p + '.date', { opt: true }) + '</div>';
          }, { quote: '', author: '' }, 'Add a review') +
          '<h3>' + UI.icon('info') + 'Questions</h3>' + listEditor('faq', function (x, i, p) { return fld('Question', p + '.q') + fld('Answer', p + '.a', { area: true, rows: 2 }); }, { q: '', a: '' }, 'Add a question') +
          '<button class="ui-btn sm ghost" data-draft="faq">' + UI.icon('sparkle') + 'Suggest questions from my facts</button>';
      }
    };

    function listEditor(path, body, template, addLabel) {
      var arr = list(st.data, path);
      return arr.map(function (x, i) {
        return '<div class="ed-box"><div class="ui-row" style="margin-bottom:8px"><b class="small muted">' + (i + 1) + '</b>' + tools(path, i, arr.length) + '</div>' + body(x || {}, i, path + '.' + i) + '</div>';
      }).join('') + '<button class="ui-btn sm" data-add="' + esc(path) + '" data-tpl="' + esc(JSON.stringify(template)) + '">' + UI.icon('plus') + esc(addLabel) + '</button>';
    }

    /* ---------------------------------------------------------------- picking photos from the library (a Python dialog) */
    function library(kind, multi) {
      var refs = {};
      function add(ref) { if (ref && /^(m:|a:|https?:)/.test(ref)) refs[ref] = 1; }
      (function walk(v) { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { if (k !== 'places') walk(v[k]); }); else if (typeof v === 'string' && /^(m|a):/.test(v)) add(v); })(st.data);
      NS.places(st.data).forEach(function (p) { if (p.wiki && p.wiki.thumb && kind !== 'pano') add(p.wiki.thumb); });
      return (st.media ? Promise.resolve(st.media) : loadMedia()).then(function (items) {
        var mine = items.filter(function (m) { return kind === 'video' ? m.kind === 'video' : kind === 'pano' ? m.kind === 'pano' || m.kind === 'image' : m.kind !== 'video'; }).map(function (m) { return m.ref; });
        mine.forEach(function (r) { delete refs[r]; });
        var others = kind === 'video' ? [] : Object.keys(refs).filter(function (r) { return !/\.(mp4|webm)/.test(r) && (kind !== 'pano' || /pano/.test(r)); });
        var all = mine.concat(others).map(function (r) { return { ref: r, url: UI.mediaUrl(r), video: kind === 'video' }; });
        return Promise.resolve(hooks.library(kind, !!multi, JSON.stringify(all))).then(function (answer) {
          var chosen = JSON.parse(answer || '[]');
          if (chosen !== 'upload') return chosen;
          return NSApp.pick({ accept: kind === 'video' ? 'video/*' : 'image/*', multiple: multi }).then(function (files) {
            if (!files.length) return [];
            return NSApp.uploadMany(st.site.id, files, kind === 'video' ? 'video' : kind === 'pano' ? 'pano' : 'image').then(function (items) {
              st.media = (items || []).concat(st.media || []);
              return items.map(function (x) { return x.ref; });
            });
          });
        });
      });
    }
    function putRefs(path, refs, single, asObj) {
      if (!refs.length) return;
      if (single) set(st.data, path, refs[0]);
      else { var arr = list(st.data, path); refs.forEach(function (r) { arr.push(asObj ? { src: r, caption: '' } : r); }); }
      changed({ panel: true });
    }

    /* ---------------------------------------------------------------- events */
    function onInput(e) {
      var t = e.target;
      if (t.matches('[data-pq]')) { st.pq = t.value; var sc = el.closest('.ed-panel') || el, y = sc.scrollTop; drawPanel(); var inp = el.querySelector('[data-pq]'); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); sc.scrollTop = y; return; }
      if (!t.matches('[data-k]') || t.type === 'radio' || t.type === 'checkbox' || t.tagName === 'SELECT') return;
      var v = t.value;
      if (t.hasAttribute('data-num')) v = v === '' ? null : +v;
      if (t.hasAttribute('data-csv')) v = v.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      set(st.data, t.getAttribute('data-k'), v);
      changed({ top: /hotel\.name/.test(t.getAttribute('data-k')) });
    }
    function onChange(e) {
      var t = e.target;
      if (t.matches('[data-pcat]')) { st.pcat = t.value; drawPanel(); return; }
      if (t.matches('[data-todo]')) {
        var done = list(st.data, 'todo_done'), txt = t.getAttribute('data-todo'), k = done.indexOf(txt);
        if (t.checked && k < 0) done.push(txt); if (!t.checked && k >= 0) done.splice(k, 1);
        changed(); return;
      }
      if (t.matches('[data-arr]')) {
        var arr = list(st.data, t.getAttribute('data-arr')), i = arr.indexOf(t.value);
        if (t.checked && i < 0) arr.push(t.value); if (!t.checked && i >= 0) arr.splice(i, 1);
        changed({ top: true, panel: t.getAttribute('data-arr') === 'personas.enabled' }); return;
      }
      if (t.matches('[data-k]') && (t.type === 'radio' || t.type === 'checkbox' || t.tagName === 'SELECT')) {
        var path = t.getAttribute('data-k'), v = t.type === 'checkbox' ? t.checked : t.value;
        if (t.hasAttribute('data-num')) v = +v;
        set(st.data, path, v);
        changed({ panel: /^(hero\.kind|sections\.|walkthrough\.items\.\d+\.kind|personas\.featured)/.test(path), top: true });
      }
    }
    function onSubmit(e) {
      if (!e.target.matches('[data-addplace]')) return;
      e.preventDefault();
      var v = UI.formData(e.target), h = st.data.hotel || {};
      if (!v.name.trim()) return;
      UI.busy(e.target.querySelector('[type=submit]'), NSScan.geocode(v.name + ', ' + (h.city || ''))).then(function (rows) {
        var near = rows.filter(function (r) { return h.lat == null || NS.dist(h.lat, h.lng, r.lat, r.lng) < 6000; })[0];
        var place = { id: 'c' + Date.now().toString(36), name: v.name.trim(), cat: v.cat, lat: near ? near.lat : h.lat, lng: near ? near.lng : h.lng, pinned: true };
        if (v.tip) place.note = v.tip.trim();
        list(st.data, 'places').push(place);
        UI.toast(near ? 'Added ' + place.name + '.' : 'Added. We could not find it on the map, so it sits at the hotel; edit the place later.', near ? 'ok' : null);
        changed({ panel: true });
      });
    }
    function onClick(e) {
      var t = e.target, b;
      if ((b = t.closest('[data-tab]'))) { hooks.tab(b.getAttribute('data-tab')); return; }
      if ((b = t.closest('[data-add]'))) {
        var tpl = b.getAttribute('data-tpl') ? JSON.parse(b.getAttribute('data-tpl')) : { id: 'r' + Date.now().toString(36), name: 'New room', beds: '1 double bed', guests: '2', tags: [], features: [], photos: [] };
        list(st.data, b.getAttribute('data-add')).push(tpl); changed({ panel: true }); return;
      }
      if ((b = t.closest('[data-del]'))) {
        var dp = b.getAttribute('data-del'), parent = dp.replace(/\.\d+$/, ''), idx = +dp.split('.').pop();
        e.preventDefault();
        UI.confirm({ title: 'Remove this?', ok: 'Remove', danger: true }).then(function (yes) { if (yes) { list(st.data, parent).splice(idx, 1); changed({ panel: true }); } });
        return;
      }
      if ((b = t.closest('[data-mv]'))) {
        e.preventDefault();
        var mp = b.getAttribute('data-mv'), par = mp.replace(/\.\d+$/, ''), i = +mp.split('.').pop(), j = i + (+b.getAttribute('data-dir')), arr = list(st.data, par);
        if (j >= 0 && j < arr.length) { var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; changed({ panel: true }); }
        return;
      }
      if ((b = t.closest('[data-flag]'))) { var fp = b.getAttribute('data-flag'); set(st.data, fp, !get(st.data, fp)); changed({ panel: true }); return; }
      if ((b = t.closest('[data-unpick]'))) {
        var up = b.getAttribute('data-unpick');
        if (b.hasAttribute('data-i')) list(st.data, up).splice(+b.getAttribute('data-i'), 1); else set(st.data, up, '');
        changed({ panel: true }); return;
      }
      if ((b = t.closest('[data-pick]'))) { library('image', true).then(function (refs) { putRefs(b.getAttribute('data-pick'), refs, false, b.hasAttribute('data-obj')); }); return; }
      if ((b = t.closest('[data-pick1]'))) { library(b.getAttribute('data-kind') || 'image', false).then(function (refs) { putRefs(b.getAttribute('data-pick1'), refs, true); }); return; }
      if ((b = t.closest('[data-upload]'))) {
        NSApp.pick({ multiple: true }).then(function (files) { if (files.length) return NSApp.uploadMany(st.site.id, files, 'image').then(function (items) {
          st.media = items.concat(st.media || []); putRefs(b.getAttribute('data-upload'), items.map(function (x) { return x.ref; }), false, b.hasAttribute('data-obj')); }); });
        return;
      }
      if ((b = t.closest('[data-upload1]'))) {
        var kind = b.getAttribute('data-kind') || 'image';
        NSApp.pick({ accept: kind === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*' }).then(function (files) {
          if (files.length) return NSApp.uploadMany(st.site.id, files, kind).then(function (items) { st.media = items.concat(st.media || []); putRefs(b.getAttribute('data-upload1'), items.map(function (x) { return x.ref; }), true); });
        });
        return;
      }
      if ((b = t.closest('[data-libup]'))) {
        var lk = b.getAttribute('data-libup');
        NSApp.pick({ multiple: lk === 'image', accept: lk === 'video' ? 'video/*' : 'image/*' }).then(function (files) { if (files.length) return NSApp.uploadMany(st.site.id, files, lk).then(function () { st.media = null; drawPanel(); }); });
        return;
      }
      if ((b = t.closest('[data-libdel]'))) {
        UI.confirm({ title: 'Delete this file?', text: 'It disappears from every place it is used.', ok: 'Delete', danger: true }).then(function (yes) {
          if (yes) UI.api('delete_media', b.getAttribute('data-libdel')).then(function () { st.media = null; drawPanel(); });
        });
        return;
      }
      if ((b = t.closest('[data-draft]'))) {
        var what = b.getAttribute('data-draft');
        if (what === 'story') set(st.data, 'story.body', NS.draft.story(st.data));
        if (what === 'neighborhood') set(st.data, 'neighborhood.intro', NS.draft.neighborhood(st.data));
        if (what === 'highlights') st.data.highlights = NS.draft.highlights(st.data);
        if (what === 'faq') { var have = (st.data.faq || []).map(function (f) { return f.q; }); list(st.data, 'faq'); NS.draft.faq(st.data).forEach(function (f) { if (have.indexOf(f.q) < 0) st.data.faq.push(f); }); }
        UI.toast('Drafted. Change anything you like.', 'ok');
        changed({ panel: true }); return;
      }
      if ((b = t.closest('[data-autoper]'))) { set(st.data, 'personas.enabled', NS.rankPersonas(st.data).slice(0, 8).map(function (x) { return x.p.id; })); changed({ panel: true, top: true }); return; }
      if ((b = t.closest('[data-per]'))) { hooks.persona(b.getAttribute('data-per')); return; }
      if (t.closest('[data-perclose]')) { e.preventDefault(); hooks.persona(''); return; }
      if ((b = t.closest('[data-pn]'))) { st.pn = +b.getAttribute('data-pn'); drawPanel(); return; }
      if ((b = t.closest('[data-pershow]'))) { hooks.previewMsg(JSON.stringify({ type: 'show-persona', persona: b.getAttribute('data-pershow') })); return; }
      if (t.closest('[data-more]')) { st.plimit += 120; drawPanel(); return; }
      if (t.closest('[data-relocate]')) { relocate(); return; }
      if ((b = t.closest('[data-rescan]'))) { rescan(b); }
    }
    el.addEventListener('input', onInput);
    el.addEventListener('change', onChange);
    el.addEventListener('submit', onSubmit);
    el.addEventListener('click', onClick);

    function relocate() {
      var h = st.data.hotel || {};
      UI.busy(el.querySelector('[data-relocate]'), NSScan.geocode(h.address || '')).then(function (rows) {
        if (!rows.length) { UI.toast('Address not found. Check the street and city.', 'error'); return; }
        var r = rows[0];
        h.lat = r.lat; h.lng = r.lng; st.data.hotel = h;
        changed({ panel: true });
        UI.confirm({ title: 'Moved to ' + r.label.split(',').slice(0, 3).join(','), text: 'Scan the neighbourhood again from the new position?', ok: 'Scan again' }).then(function (yes) {
          if (yes) { hooks.tab('area'); rescan(el.querySelector('[data-rescan]')); }
        });
      });
    }
    function rescan(btn) {
      var h = st.data.hotel || {};
      if (h.lat == null) { UI.toast('Add the address first (Hotel tab).', 'error'); return; }
      var rsel = el.querySelector('[data-radius]'), radius = rsel ? +rsel.value : 1300;
      UI.toast('Scanning the neighbourhood… this can take up to a minute.');
      UI.busy(btn, (window.NS_TEST_SCAN ? Promise.resolve(window.NS_TEST_SCAN) : NSScan.scan(h.lat, h.lng, { radius: radius }))).then(function (r) {
        var old = {};
        (st.data.places || []).forEach(function (p) { old[p.id] = p; });
        var keep = (st.data.places || []).filter(function (p) { return /^c/.test(p.id); });
        var fresh = r.places.map(function (p) { var o = old[p.id]; if (o) { ['hidden', 'pinned', 'note'].forEach(function (k) { if (o[k]) p[k] = o[k]; }); } return p; });
        st.data.places = fresh.concat(keep);
        var own = (st.data.credits || []).filter(function (c) { return !/OpenStreetMap|Wikipedia|Wikimedia/.test(c.text); });
        st.data.credits = r.credits.concat(own);
        st.data.scan = { at: r.scanned || new Date().toISOString(), radius: radius, sources: r.sources || [] };
        UI.toast(r.places.length + ' places found.', 'ok');
        changed({ panel: true });
      }, function (err) { UI.toast('The scan failed: ' + err.message, 'error'); });
    }

    return {
      draw: function (tab) { st.tab = tab; drawPanel(); },
      dataJson: function () { return JSON.stringify(st.data); },
      data: function () { return st.data; },
      get: function (path) { var v = get(st.data, path); return v == null ? '' : v; },
      set: function (path, value) { set(st.data, path, value); changed({}); },
      setSite: function (json) { st.site = JSON.parse(json); },
      setPersona: function (id) { st.persona = id || null; st.pn = null; if (st.tab === 'guests') drawPanel(); },
      setPreview: function (p) { st.preview = p; },
      top: function () {
        return JSON.stringify({ name: NS.get(st.data, 'hotel.name', 'Untitled'), personas: NS.enabledPersonas(st.data).map(function (p) { return { id: p.id, name: p.name }; }) });
      },
      destroy: function () {
        el.removeEventListener('input', onInput); el.removeEventListener('change', onChange);
        el.removeEventListener('submit', onSubmit); el.removeEventListener('click', onClick);
        el.innerHTML = '';
      }
    };
  }

  /* ---------------------------------------------------------------- the live preview (an iframe drawn by ns-site.js) */
  function preview(el, onMessage) {
    var ready = false, timer = null, last = null, device = 'desktop';
    el.innerHTML = '<div class="ed-frame desktop" data-frame><iframe title="Live preview of your site" data-iframe></iframe></div>';
    var fr = el.querySelector('[data-frame]'), ifr = el.querySelector('[data-iframe]');
    function post(msg) { if (ready && ifr.contentWindow) ifr.contentWindow.postMessage(msg, '*'); }
    function listen(ev) {
      if (ev.source !== ifr.contentWindow) return;
      var m = ev.data || {};
      if (m.type === 'ns-ready') { ready = true; if (last) post({ type: 'ns-data', data: JSON.parse(JSON.stringify(last)) }); }
      if (m.type === 'ns-drawn') window.NS_PREVIEW_DRAWN = (window.NS_PREVIEW_DRAWN || 0) + 1;
      if (onMessage) { try { onMessage(JSON.stringify({ type: m.type, section: m.section || '' })); } catch (e) { console.error(e); } }
    }
    function fit() {
      fr.className = 'ed-frame ' + device;
      fr.style.transform = '';
      fr.style.height = '';
      if (device === 'desktop') return;
      var w = device === 'tablet' ? 820 : 390, avail = el.clientWidth - 40;
      if (avail > 0 && w > avail) { var k = avail / w; fr.style.transform = 'scale(' + k.toFixed(3) + ')'; fr.style.height = ((el.clientHeight - 32) / k) + 'px'; }
    }
    window.addEventListener('message', listen);
    window.addEventListener('resize', fit);
    ifr.srcdoc = NSApp.previewDoc();
    return {
      push: function (data, now) {
        last = data;
        clearTimeout(timer);
        var go = function () { post({ type: 'ns-data', data: JSON.parse(JSON.stringify(last)) }); };
        if (now) go(); else timer = setTimeout(go, 260);
      },
      post: post,
      fit: function (d) { if (d) device = d; fit(); },
      destroy: function () { window.removeEventListener('message', listen); window.removeEventListener('resize', fit); clearTimeout(timer); window.NS_PREVIEW_DRAWN = 0; }
    };
  }

  /* ---------------------------------------------------------------- the visits chart */
  function statsHtml(r) {
    var max = Math.max(1, Math.max.apply(null, r.days.map(function (x) { return x.views; })));
    var W = 600, H = 150, pad = 22, bw = (W - pad) / r.days.length;
    var bars = r.days.map(function (x, i) {
      var h = Math.round((H - 34) * x.views / max), y = H - 18 - h;
      return '<rect class="bar" x="' + (pad + i * bw + 1).toFixed(1) + '" y="' + y + '" width="' + Math.max(1, bw - 2).toFixed(1) + '" height="' + Math.max(0, h) + '" rx="3" data-tipd="' + esc(UI.fmtDate(x.day, { day: 'numeric', month: 'short' }) + ': ' + UI.plural(x.views, 'visit')) + '"/>';
    }).join('');
    var names = r.personas.map(function (x) { var p = NS.persona(x.id); return { name: p ? p.name : x.id, n: x.n }; });
    var pmax = Math.max(1, names.length ? names[0].n : 1);
    return '<div class="ed-stats"><div class="ed-stat"><b>' + r.total + '</b><span>visits, 30 days</span></div><div class="ed-stat"><b>' + r.all_time + '</b><span>visits, all time</span></div><div class="ed-stat"><b>' + (names[0] ? esc(names[0].name.split(' ')[0]) : '–') + '</b><span>top guest profile</span></div></div>' +
      '<p class="small"><b>Visits per day, last 30 days</b></p><div class="ed-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Visits per day">' +
      '<line class="ax" x1="' + pad + '" x2="' + W + '" y1="' + (H - 18) + '" y2="' + (H - 18) + '"/><text x="0" y="12">' + max + '</text><text x="' + pad + '" y="' + (H - 4) + '">' + esc(UI.fmtDate(r.days[0].day, { day: 'numeric', month: 'short' })) + '</text>' +
      '<text x="' + W + '" y="' + (H - 4) + '" text-anchor="end">today</text>' + bars + '</svg><div class="ed-tip" hidden></div></div>' +
      '<table class="sr-only"><tr><th>Day</th><th>Visits</th></tr>' + r.days.map(function (x) { return '<tr><td>' + esc(x.day) + '</td><td>' + x.views + '</td></tr>'; }).join('') + '</table>' +
      (names.length ? '<p class="small" style="margin-top:14px"><b>What guests picked</b></p>' + names.map(function (x) {
        return '<div class="ed-hbar"><span>' + esc(x.name) + '</span><i style="width:' + Math.round(x.n / pmax * 100) + '%"></i><span>' + x.n + '</span></div>'; }).join('') : '');
  }

  /* ---------------------------------------------------------------- picking photos from the library */
  function statsBind(el) {
    el.addEventListener('mousemove', function (e) {
      var tip = el.querySelector('.ed-tip');
      if (!tip) return;
      var r = e.target.closest && e.target.closest('[data-tipd]');
      if (!r) { tip.hidden = true; return; }
      var box = tip.parentNode.getBoundingClientRect(), rb = r.getBoundingClientRect();
      tip.textContent = r.getAttribute('data-tipd'); tip.hidden = false;
      tip.style.left = (rb.left - box.left + rb.width / 2) + 'px'; tip.style.top = (rb.top - box.top) + 'px';
    });
  }

  window.NSEd = {
    TABS: TABS, SECTION_TAB: SECTION_TAB_, TAB_SECTION: TAB_SECTION, create: create, preview: preview,
    statsHtml: function (json) { return statsHtml(JSON.parse(json)); }, statsBind: statsBind
  };
})();
