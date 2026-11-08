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
      var pl = opts.platform || { name: 'ArviStay' };
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
