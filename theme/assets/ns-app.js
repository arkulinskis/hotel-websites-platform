/* ns-app.js: the owner-side engines of ArviStay, kept as JavaScript (they draw, read files and talk to map and
   Wikipedia services in the browser). Python (client_code/ns.py) installs window.NS_HOST and wraps them; pages,
   menus, dialogs and lists are Anvil Forms.

     1. The small window.UI helpers the engines use (on top of app-kit.js): mediaUrl, themeBase, siteUrl, toast, confirm,
        api / apiQuiet / upload (through NS_HOST to anvil.server), busy, fmtDate, formData.
     2. window.NSApp  (was web/pages/_ns.html): shrink, pick, upload(Many), previewDoc, exportSite, zip, newSiteData,
        swatches, coverStyle; NSApp.json.* = JSON-text helpers for Python.
     3. window.NSScan (was web/pages/_scan.html): geocode(text), scan(lat, lng, {radius, onProgress}).
   The hotel-site renderer itself is ns-site.js (window.NSSite), shared with the hosted sites. */
(function () {
  'use strict';
  var UI = window.UI = window.UI || {};
  UI.config = UI.config || {};
  UI.config.name = 'ArviStay';

  /* Uploaded files ("m:<key>") are served by the app's HTTP endpoint; starter photos ("a:<file>") are theme assets. */
  UI.mediaUrl = function (ref) {
    ref = String(ref || '');
    if (ref.indexOf('m:') === 0) return (window.APP_API || '') + '/m/' + ref.slice(2);
    if (ref.indexOf('a:') === 0) return UI.themeBase() + ref.slice(2);
    return ref;
  };
  UI.themeBase = function () { return new URL('_/theme/', location.href.split('#')[0]).href; };
  UI.siteUrl = function (slug) { return (window.APP_API || '') + '/s/' + slug; };

  function host() {
    if (!window.NS_HOST) throw new Error('The app is still starting.');
    return window.NS_HOST;
  }
  UI.toast = function (msg, kind) { try { host().toast(String(msg), kind || ''); } catch (e) { console.log(msg); } };
  /* UI.confirm({title, text, ok, danger}) -> Promise<bool>, drawn by Anvil's confirm() in Python. */
  UI.confirm = function (o) {
    o = typeof o === 'string' ? { title: o } : (o || {});
    return Promise.resolve(host().confirm(o.title || 'Are you sure?', o.text || '', o.ok || 'OK', !!o.danger)).then(function (v) { return !!v; });
  };
  function unpack(text) {
    var r = typeof text === 'string' ? JSON.parse(text) : (text || {});
    if (r.error) { var err = new Error(r.error); err.uiApi = true; throw err; }
    var res = r.result;
    if (res && typeof res === 'object' && res.ok === false) {
      var e2 = new Error(res.error || "That didn't work."); e2.uiApi = true; e2.expected = true; e2.result = res; throw e2;
    }
    return res;
  }
  function call(fn, args, quiet) {
    try { return Promise.resolve(host().call(fn, JSON.stringify(args), !!quiet)).then(unpack); } catch (e) { return Promise.reject(e); }
  }
  UI.api = function (fn) { return call(fn, Array.prototype.slice.call(arguments, 1), false); };
  UI.apiQuiet = function (fn) { return call(fn, Array.prototype.slice.call(arguments, 1), true); };
  /* UI.upload(fn, file, ...args): the browser File becomes Anvil Media in Python (streamed, no JSON copy of the bytes). */
  UI.upload = function (fn, file) {
    var args = Array.prototype.slice.call(arguments, 2);
    try { return Promise.resolve(host().upload(fn, file, JSON.stringify(args))).then(unpack); } catch (e) { return Promise.reject(e); }
  };
  /* Errors nobody caught become a toast, so a failed action is never silent. */
  window.addEventListener('unhandledrejection', function (e) {
    if (e.reason && e.reason.uiApi) { e.preventDefault(); UI.toast(e.reason.message, 'error'); }
  });
  UI.busy = function (btn, promise) {
    if (!btn) return promise;
    btn.disabled = true; btn.classList.add('is-busy');
    var done = function () { btn.disabled = false; btn.classList.remove('is-busy'); };
    promise.then(done, done);
    return promise;
  };
  UI.fmtDate = function (iso, opts) {
    if (!iso) return '';
    var d = iso.length <= 10 ? new Date(iso + 'T12:00:00') : new Date(iso);
    return d.toLocaleDateString(undefined, opts || { day: 'numeric', month: 'short', year: 'numeric' });
  };
  UI.formData = function (form) {
    var out = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
      else out[el.name] = el.value;
    });
    return out;
  };
})();

/* ===== NSApp (was web/pages/_ns.html) ===== */
(function () {
  'use strict';
  var NS = window.NSSite;
  var A = window.NSApp = {};

  A.shrink = function (file, maxSide, quality) {
    maxSide = maxSide || 2000;
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        var w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? resolve({ blob: b, width: w, height: h }) : reject(new Error('Could not read this picture.')); }, 'image/jpeg', quality || 0.84);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('That file is not a picture this browser can read.')); };
      img.src = url;
    });
  };

  A.pick = function (o) {
    o = o || {};
    return new Promise(function (resolve) {
      var inp = document.createElement('input');
      inp.type = 'file'; inp.accept = o.accept || 'image/*'; inp.multiple = !!o.multiple;
      inp.style.display = 'none';
      inp.onchange = function () { resolve(Array.prototype.slice.call(inp.files || [])); inp.remove(); };
      document.body.appendChild(inp);
      inp.click();
    });
  };

  /* Upload one file: photos and panoramas are shrunk first; videos go as they are. */
  A.upload = function (siteId, file, kind) {
    kind = kind || (/^video\//.test(file.type) ? 'video' : 'image');
    var prep = kind === 'video' ? Promise.resolve({ blob: file }) : A.shrink(file, kind === 'pano' ? 4096 : 2000, kind === 'pano' ? 0.82 : 0.84);
    return prep.then(function (r) {
      var name = (file.name || 'photo').replace(/\.[^.]+$/, '') + (kind === 'video' ? (file.name.match(/\.[^.]+$/) || ['.mp4'])[0] : '.jpg');
      var f = r.blob instanceof File ? r.blob : new File([r.blob], name, { type: r.blob.type || 'image/jpeg' });
      return UI.upload('upload_media', f, siteId, kind, { name: name, width: r.width || null, height: r.height || null });
    }).then(function (res) { return res.item; });
  };
  /* Upload several with a small progress card. Resolves with the items that worked. */
  A.uploadMany = function (siteId, files, kind) {
    var box = document.createElement('div'), done = 0, items = [];
    box.className = 'ui nsa-up';
    function draw(msg) { box.innerHTML = '<b>' + UI.esc(msg) + '</b><div class="bar"><i style="width:' + Math.round(done / files.length * 100) + '%"></i></div>'; }
    draw('Uploading ' + UI.plural(files.length, 'file') + '…');
    document.body.appendChild(box);
    var chain = Promise.resolve();
    files.forEach(function (f) {
      chain = chain.then(function () {
        return A.upload(siteId, f, kind).then(function (it) { items.push(it); }, function (err) { UI.toast(f.name + ': ' + err.message, 'error'); })
          .then(function () { done++; draw('Uploaded ' + done + ' of ' + files.length); });
      });
    });
    return chain.then(function () { setTimeout(function () { box.remove(); }, 900); return items; });
  };

  /* ------------------------------------------------------------------ preview iframe document */
  function siteAsset(ext) {
    var s = document.querySelector('script[src*="ns-site.js"]');
    var src = s ? s.src : UI.themeBase() + 'ns-site.js';
    return ext === 'css' ? src.replace('ns-site.js', 'ns-site.css') : src;
  }
  A.siteAsset = siteAsset;
  A.previewDoc = function () {
    var opts = { media: { m: (window.APP_API || '') + '/m/', a: UI.themeBase() }, platform: { name: UI.config.name }, noMap: !!window.NS_NO_MAP };
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<link rel="stylesheet" href="' + siteAsset('css') + '"><' + 'script src="' + siteAsset('js') + '"></scr' + 'ipt></head>' +
      '<body style="margin:0"><div id="ns-root"></div><' + 'script>NSSite.previewListen(' + JSON.stringify(opts) + ');</scr' + 'ipt></body></html>';
  };

  /* ------------------------------------------------------------------ zip (stored, no compression: photos are already compressed) */
  var CRC = (function () { var t = [], c; for (var n = 0; n < 256; n++) { c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  A.zip = function (files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    var d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + data.length;
    });
    var size = central.reduce(function (n, p) { return n + p.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
  };
  A.download = function (blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  };

  /* ------------------------------------------------------------------ export: a site you can host anywhere */
  function walkRefs(v, fn) {
    if (Array.isArray(v)) return v.map(function (x) { return walkRefs(x, fn); });
    if (v && typeof v === 'object') { var o = {}; Object.keys(v).forEach(function (k) { o[k] = walkRefs(v[k], fn); }); return o; }
    if (typeof v === 'string' && /^(m|a):[\w.-]+$/.test(v)) return fn(v);
    return v;
  }
  function toDataUrl(u8, type) {
    var s = '', CH = 0x8000;
    for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    return 'data:' + type + ';base64,' + btoa(s);
  }
  function safeScript(js) { return js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--'); }
  function jsonForScript(v) { return JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); }
  A.exportSite = function (data, slug, o) {
    o = o || {};
    var refs = {}, files = [];
    walkRefs(data, function (r) { refs[r] = 1; return r; });
    var list = Object.keys(refs);
    var fetchText = function (u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }); };
    var fetched = {};
    return Promise.all([fetchText(siteAsset('js')), fetchText(siteAsset('css'))]).then(function (code) {
      return list.reduce(function (p, ref) {
        return p.then(function () {
          return fetch(UI.mediaUrl(ref)).then(function (r) {
            if (!r.ok) throw new Error('missing');
            var type = (r.headers.get('Content-Type') || 'image/jpeg').split(';')[0];
            return r.arrayBuffer().then(function (b) { fetched[ref] = { u8: new Uint8Array(b), type: type }; });
          }).catch(function () { /* left as a link to the live file */ });
        });
      }, Promise.resolve()).then(function () { return code; });
    }).then(function (code) {
      var n = 0, names = {};
      var out = walkRefs(data, function (ref) {
        var f = fetched[ref];
        if (!f) return UI.mediaUrl(ref);
        if (o.single) return toDataUrl(f.u8, f.type);
        if (!names[ref]) {
          var ext = (f.type.split('/')[1] || 'bin').replace('jpeg', 'jpg').replace('quicktime', 'mov');
          names[ref] = 'media/' + (ref.charAt(0) === 'a' ? ref.slice(2).replace(/\.\w+$/, '') : 'file-' + (++n)) + '.' + ext;
          files.push({ name: names[ref], data: f.u8 });
        }
        return names[ref];
      });
      var h = out.hotel || {};
      var opts = { mode: 'export', slug: slug, media: {}, platform: { name: UI.config.name, url: location.href.split('#')[0] }, ask: (window.APP_API || '') + '/ask' };
      var html = '<!doctype html>\n<html lang="' + UI.esc(out.lang || 'en') + '">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
        '<title>' + UI.esc((out.seo && out.seo.title) || h.name || 'Hotel') + '</title>\n<meta name="description" content="' + UI.esc((out.seo && out.seo.description) || (out.hero && out.hero.headline) || '') + '">\n' +
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
        '<sty' + 'le>\n' + code[1].replace(/<\/style/gi, '<\\/style') + '\n</sty' + 'le>\n</head>\n<body style="margin:0">\n<div id="ns-root"></div>\n' +
        '<scr' + 'ipt>\n' + safeScript(code[0]) + '\n</scr' + 'ipt>\n<scr' + 'ipt>NSSite.boot(' + jsonForScript(out) + ', ' + jsonForScript(opts) + ');</scr' + 'ipt>\n</body>\n</html>\n';
      var base = (slug || 'hotel-site');
      if (o.single) { A.download(new Blob([html], { type: 'text/html' }), base + '.html'); return { files: 1, bytes: html.length }; }
      files.unshift({ name: 'index.html', data: html });
      files.push({ name: 'README.txt', data: 'Your hotel website, made with ' + UI.config.name + '.\r\n\r\n' +
        'Upload everything in this folder (index.html and the media folder) to any web host: Netlify Drop, GitHub Pages, your hosting company, or your own server.\r\n' +
        'Open index.html through a web address (not by double-clicking the file) so the 3D map and 360-degree photos can load.\r\n' +
        'Fonts come from Google Fonts and the map from OpenFreeMap (OpenStreetMap data). Photo credits are listed at the bottom of the page.\r\n' });
      var blob = A.zip(files);
      A.download(blob, base + '.zip');
      return { files: files.length, bytes: blob.size };
    });
  };

  /* ------------------------------------------------------------------ the starter site the wizard creates */
  A.newSiteData = function (f) {
    var data = {
      v: 1, lang: 'en',
      hotel: { name: f.name, kind: f.kind || 'Hotel', stars: +f.stars || 0, tagline: f.tagline || '', area: f.area || f.city || '', city: f.city || '', country: f.country || '',
        address: f.address || '', lat: f.lat, lng: f.lng, phone: f.phone || '', email: f.email || '', checkin: f.checkin || '15:00', checkout: f.checkout || '11:00',
        breakfast: (f.features || []).indexOf('breakfast') >= 0 ? 'Breakfast is included every morning.' : '', features: f.features || [] },
      theme: { palette: f.palette || 'riga', fonts: f.fonts || 'belle', ornament: 'rich' },
      sections: NS.SECTIONS.map(function (s) { return { id: s.id, on: ['walkthrough', 'film', 'dining', 'reviews'].indexOf(s.id) < 0 }; }),
      hero: { kind: 'photo', style: 'full', image: '', headline: f.tagline || '' },
      story: { eyebrow: 'Welcome', title: 'Welcome to ' + f.name, body: '', sign: 'The ' + f.name.replace(/^(hotel|boutique hotel|the)\s+/i, '') + ' team' },
      rooms: [{ id: 'r1', name: 'Double Room', size: '', beds: '1 double bed', guests: '2', tags: ['double'], features: ['Private bathroom', 'Free Wi-Fi'], photos: [] },
              { id: 'r2', name: 'Twin Room', size: '', beds: '2 single beds', guests: '2', tags: ['twin'], features: ['Private bathroom', 'Free Wi-Fi'], photos: [] }],
      gallery: { layout: 'bento', items: [] }, videos: [], walkthrough: { items: [] }, dining: {},
      ratings: [], reviews: [],
      booking: { channels: [{ kind: 'booking', url: '' }], payment: { methods: ['visa', 'mastercard'], when: '' }, policies: [] },
      faq: [], contact: { directions: [], social: [] }, neighborhood: {},
      personas: { enabled: f.personas || [], featured: (f.personas || [])[0] || '' },
      places: f.places || [], credits: f.credits || [], scan: f.scan || null,
      seo: {}, todo: ['Add a photo or video for the opening screen.', 'Add photos of each room.', 'Add your booking links (Booking.com, Hotels.com…).', 'Read the texts we drafted and make them yours.']
    };
    data.story.body = NS.draft.story(data);
    data.highlights = NS.draft.highlights(data);
    data.neighborhood.intro = NS.draft.neighborhood(data);
    data.faq = NS.draft.faq(data);
    var lm = NS.places(data).filter(function (p) { return p.wiki && p.wiki.thumb; });
    if (lm[0]) { data.hero.image = lm[0].wiki.thumb; data.gallery.items = lm.slice(0, 6).map(function (p) { return { src: p.wiki.thumb, caption: p.name }; }); }
    return data;
  };

  A.swatches = function (key) {
    var p = NS.PALETTES[key] || NS.PALETTES.riga, c = p.c;
    return '<span class="nsa-sw" aria-hidden="true">' + [c.bg, c.surface, c.brand, c.accent, c.deep].map(function (x) { return '<i style="background:' + x + '"></i>'; }).join('') + '</span>';
  };
  A.coverStyle = function (ref) { return ref ? 'background-image:url(&quot;' + UI.esc(UI.mediaUrl(ref)) + '&quot;)' : ''; };
})();
/* ===== NSScan (was web/pages/_scan.html) ===== */
(function () {
  'use strict';
  var NS = window.NSSite;
  var OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];

  function timeout(ms, p) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error('timed out')); }, ms);
      p.then(function (v) { clearTimeout(t); resolve(v); }, function (err) { clearTimeout(t); reject(err); });
    });
  }
  function getJson(url, opts, ms) {
    return timeout(ms || 20000, fetch(url, opts || {}).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }));
  }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function compact(s) { return norm(s).replace(/(the|of|riga|museum)/g, '').replace(/\s+/g, ''); }

  /* ------------------------------------------------------------------ address search */
  function geocode(text) {
    var q = encodeURIComponent(String(text || '').trim());
    if (!q) return Promise.resolve([]);
    return getJson('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=' + q, { headers: { 'Accept-Language': 'en' } }, 12000).then(function (rows) {
      return rows.map(function (r) {
        var a = r.address || {};
        return { label: r.display_name, lat: +r.lat, lng: +r.lon, city: a.city || a.town || a.village || a.municipality || '', country: a.country || '',
          area: a.suburb || a.neighbourhood || a.quarter || a.city_district || '', road: [a.road, a.house_number].filter(Boolean).join(' '), name: r.name || '' };
      });
    }).catch(function () {
      return getJson('https://photon.komoot.io/api/?limit=6&lang=en&q=' + q, null, 12000).then(function (d) {
        return (d.features || []).map(function (f) {
          var p = f.properties || {};
          return { label: [p.name, p.street && (p.street + ' ' + (p.housenumber || '')).trim(), p.city, p.country].filter(Boolean).join(', '),
            lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], city: p.city || '', country: p.country || '', area: p.district || p.locality || '',
            road: [p.street, p.housenumber].filter(Boolean).join(' '), name: p.name || '' };
        });
      });
    });
  }

  /* ------------------------------------------------------------------ OpenStreetMap tags -> our categories */
  var SHOP_MARKET = /^(bakery|deli|wine|chocolate|confectionery|supermarket|convenience|greengrocer|butcher|cheese|seafood|tea|coffee|beverages|alcohol)$/;
  var SHOP_GOOD = /^(clothes|boutique|gift|books|jewelry|art|antiques|shoes|mall|department_store|craft|music|cosmetics|beauty|fashion|perfumery|souvenir|bag|watches|interior_decoration|furniture|second_hand|toys)$/;
  function catOf(t) {
    var a = t.amenity, to = t.tourism, l = t.leisure, s = t.shop, h = t.historic;
    if (a === 'cafe' || a === 'ice_cream') return ['cafe', t.cuisine];
    if (a === 'restaurant' || a === 'fast_food' || a === 'food_court') return ['restaurant', t.cuisine || (a === 'fast_food' ? 'quick bite' : '')];
    if (a === 'bar' || a === 'pub' || a === 'biergarten') return ['bar', a === 'pub' ? 'pub' : a === 'biergarten' ? 'beer garden' : ''];
    if (a === 'nightclub') return ['nightlife', 'club'];
    if (a === 'theatre' || a === 'cinema' || a === 'arts_centre' || a === 'concert_hall' || t.theatre) return ['culture', a.replace('_', ' ')];
    if (a === 'marketplace') return ['market', 'market'];
    if (a === 'place_of_worship') return ['church', t.religion || ''];
    if (a === 'pharmacy' || a === 'atm' || a === 'hospital' || a === 'clinic') return ['essentials', a];
    if (a === 'bicycle_rental' || a === 'bus_station' || a === 'ferry_terminal' || a === 'taxi') return ['transport', a.replace('_', ' ')];
    if (a === 'coworking_space' || t.office === 'coworking') return ['coworking', ''];
    if (a === 'spa' || l === 'spa' || l === 'sauna' || s === 'massage') return ['wellness', ''];
    if (to === 'museum') return ['museum', ''];
    if (to === 'gallery' || s === 'art') return ['gallery', ''];
    if (to === 'zoo' || to === 'aquarium' || to === 'theme_park' || l === 'playground') return ['kids', to || 'playground'];
    if (to === 'attraction' || to === 'viewpoint' || to === 'artwork' || h) return ['sight', to === 'viewpoint' ? 'viewpoint' : to === 'artwork' ? 'public art' : h || ''];
    if (l === 'park' || l === 'garden') return ['park', ''];
    if (l === 'fitness_centre' || l === 'sports_centre' || l === 'swimming_pool') return ['sport', l.replace('_', ' ')];
    if (t.railway === 'station' || t.railway === 'halt' || t.public_transport === 'station') return ['transport', 'station'];
    if (s && SHOP_MARKET.test(s)) return ['market', s];
    if (s && SHOP_GOOD.test(s)) return ['shop', s];
    return null;
  }
  function overpassQuery(lat, lng, r) {
    var A = '(around:' + r + ',' + lat + ',' + lng + ')';
    return '[out:json][timeout:25];(' +
      'nwr' + A + '[amenity~"^(cafe|ice_cream|restaurant|fast_food|bar|pub|biergarten|nightclub|theatre|cinema|arts_centre|concert_hall|marketplace|place_of_worship|pharmacy|atm|bicycle_rental|bus_station|ferry_terminal|coworking_space|spa)$"][name];' +
      'nwr' + A + '[tourism~"^(museum|gallery|attraction|viewpoint|zoo|aquarium)$"][name];' +
      'nwr' + A + '[leisure~"^(park|garden|fitness_centre|sports_centre|swimming_pool|playground|sauna)$"][name];' +
      'nwr' + A + '[shop~"^(clothes|boutique|gift|books|jewelry|art|antiques|shoes|bakery|deli|wine|chocolate|confectionery|supermarket|mall|department_store|craft|souvenir|cheese|tea|coffee)$"][name];' +
      'nwr' + A + '[historic~"^(monument|memorial|castle|church|city_gate|tower|ruins)$"][name];' +
      'nwr' + A + '[railway~"^(station|halt)$"][name];' +
      ');out center tags 1200;';
  }
  function fromOverpass(lat, lng, r, say) {
    var q = 'data=' + encodeURIComponent(overpassQuery(lat, lng, r));
    var i = 0;
    function attempt() {
      if (i >= OVERPASS.length) return Promise.reject(new Error('all OpenStreetMap servers are busy'));
      var url = OVERPASS[i++];
      say('Asking OpenStreetMap (' + url.split('/')[2] + ')…');
      return getJson(url, { method: 'POST', body: q, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, 14000).then(function (d) {
        if (!d.elements) throw new Error('empty');
        return d.elements.map(function (el) {
          var t = el.tags || {}, c = catOf(t);
          var la = el.lat != null ? el.lat : el.center && el.center.lat, ln = el.lon != null ? el.lon : el.center && el.center.lon;
          if (!c || la == null) return null;
          return { id: 'o' + el.type.charAt(0) + el.id, name: t['name:en'] || t.name, local: t['name:en'] ? t.name : undefined, cat: c[0], sub: c[1] ? String(c[1]).split(';')[0] : '',
            lat: +la.toFixed(6), lng: +ln.toFixed(6), url: t.website || t['contact:website'] || undefined,
            diet: /yes|only/.test(t['diet:vegan'] || t['diet:vegetarian'] || '') || undefined };
        }).filter(Boolean);
      }).catch(function (err) { console.warn('overpass', url, err.message); return attempt(); });
    }
    return attempt();
  }

  /* Points of interest straight from the OpenFreeMap vector tiles (a hidden MapLibre map at zoom 14). */
  var TILE_CAT = {
    cafe: 'cafe', ice_cream: 'cafe', restaurant: 'restaurant', fast_food: 'restaurant', bar: 'bar', pub: 'bar', beer: 'bar', biergarten: 'bar', nightclub: 'nightlife',
    museum: 'museum', art_gallery: 'gallery', gallery: 'gallery', attraction: 'sight', monument: 'sight', memorial: 'sight', castle: 'sight', viewpoint: 'sight',
    place_of_worship: 'church', theatre: 'culture', cinema: 'culture', music: 'culture', arts_centre: 'culture', park: 'park', garden: 'park',
    playground: 'kids', zoo: 'kids', aquarium: 'kids', fitness: 'sport', fitness_centre: 'sport', sports_centre: 'sport', swimming: 'sport', swimming_pool: 'sport',
    marketplace: 'market', bakery: 'market', grocery: 'market', supermarket: 'market', deli: 'market', alcohol_shop: 'market', wine: 'market', chocolate: 'market',
    clothing_store: 'shop', clothes: 'shop', boutique: 'shop', gift: 'shop', books: 'shop', jewelry: 'shop', shoes: 'shop', mall: 'shop', department_store: 'shop', art: 'gallery',
    pharmacy: 'essentials', atm: 'essentials', railway: 'transport', station: 'transport', bus_station: 'transport', ferry_terminal: 'transport', spa: 'wellness',
    artwork: 'sight', musical_instrument: 'shop', halt: 'transport'
  };
  var TILE_SKIP = /^(bus_stop|tram_stop|stop_position|platform|bank|bureau_de_change|subway_entrance|parking|fuel|car|taxi)$/;
  function fromTiles(lat, lng, say) {
    say('Reading places from the map tiles…');
    var lib = NS.LIB;
    NS.loadCss(lib.maplibreCss);
    return (window.maplibregl ? Promise.resolve() : NS.loadScript(lib.maplibre)).then(function () {
      return new Promise(function (resolve, reject) {
        var box = document.createElement('div');
        box.style.cssText = 'position:fixed;left:-3000px;top:0;width:1100px;height:1100px;visibility:hidden;pointer-events:none';
        document.body.appendChild(box);
        var map;
        try { map = new window.maplibregl.Map({ container: box, style: 'https://tiles.openfreemap.org/styles/liberty', center: [lng, lat], zoom: 14, interactive: false, fadeDuration: 0 }); }
        catch (x) { box.remove(); reject(new Error('This browser cannot draw maps (WebGL is off).')); return; }
        var done = false;
        function finish() {
          if (done) return; done = true;
          var feats = [];
          try { feats = map.querySourceFeatures('openmaptiles', { sourceLayer: 'poi' }); } catch (x) {}
          var seen = {}, out = [];
          feats.forEach(function (f) {
            var p = f.properties || {}, name = p['name:en'] || p.name_en || p.name;
            if (TILE_SKIP.test(p.subclass || '')) return;
            var cat = TILE_CAT[p.subclass] || TILE_CAT[p.class];
            if (!name || !cat || !f.geometry || f.geometry.type !== 'Point') return;
            var key = norm(name) + cat;
            if (seen[key]) return; seen[key] = 1;
            var c = f.geometry.coordinates;
            out.push({ id: 't' + NS.hash(key + c[0].toFixed(4)), name: name, local: name !== p.name ? p.name : undefined, cat: cat, sub: p.subclass && p.subclass !== p.class ? String(p.subclass).replace(/_/g, ' ') : '',
              lat: +c[1].toFixed(6), lng: +c[0].toFixed(6) });
          });
          map.remove(); box.remove();
          resolve(out);
        }
        map.on('idle', function () { setTimeout(finish, 300); });
        map.on('error', function (ev) { console.warn('tiles', ev && ev.error && ev.error.message); });
        setTimeout(finish, 20000);
      });
    });
  }

  /* ------------------------------------------------------------------ Wikipedia: landmarks with a photo and a few words */
  var WIKI_CAT = [[/cathedral|church|chapel|basilica|synagogue|mosque|monastery|temple/i, 'church'], [/museum/i, 'museum'], [/gallery|kunsthalle/i, 'gallery'],
    [/theatre|theater|opera|philharmoni|concert|cinema|ballet|music hall/i, 'culture'], [/market hall|central market|market$/i, 'market'], [/park|garden|boulevard|canal/i, 'park'],
    [/station|terminal|airport/i, 'transport'], [/house|castle|tower|gate|square|monument|statue|memorial|bridge|hall|palace|building|street|wall|fortress|bastion|guild|barracks/i, 'sight']];
  var WIKI_SKIP = /embassy|consulate|school|university|college|academy|ministry|company|bank|hospital|parliament building|office|district|hotel|restaurant|newspaper|radio|television|agency|faculty|institute|club|association|council|court|prison|cemetery|^list of/i;
  function fromWikipedia(lat, lng, r, say) {
    say('Looking up landmarks on Wikipedia…');
    var base = 'https://en.wikipedia.org/w/api.php?format=json&origin=*&action=query';
    return getJson(base + '&list=geosearch&gscoord=' + lat + '%7C' + lng + '&gsradius=' + Math.min(10000, Math.round(r * 1.3)) + '&gslimit=60', null, 15000).then(function (d) {
      var hits = (d.query && d.query.geosearch || []).filter(function (g) { return !WIKI_SKIP.test(g.title); });
      if (!hits.length) return [];
      var ids = hits.map(function (g) { return g.pageid; }).slice(0, 50).join('%7C');
      return getJson(base + '&prop=extracts%7Cpageimages%7Cinfo&inprop=url&exintro=1&explaintext=1&exsentences=3&exlimit=max&piprop=thumbnail%7Cname&pithumbsize=640&pageids=' + ids, null, 15000).then(function (d2) {
        var pages = d2.query && d2.query.pages || {};
        return hits.map(function (g) {
          var pg = pages[g.pageid];
          if (!pg || !pg.thumbnail || !pg.extract) return null;
          var cat = null;
          for (var i = 0; i < WIKI_CAT.length; i++) if (WIKI_CAT[i][0].test(g.title)) { cat = WIKI_CAT[i][1]; break; }
          if (!cat && /built|histor|architect|century|landmark|art nouveau|monument|baroque|gothic/i.test(pg.extract)) cat = 'sight';
          if (!cat) return null;
          return { id: 'w' + g.pageid, name: g.title.replace(/,\s*(Riga|Rīga|Tallinn|Vilnius)$/, ''), cat: cat, lat: +g.lat.toFixed(6), lng: +g.lon.toFixed(6),
            wiki: { title: g.title, extract: NS.firstSentence(pg.extract, 320), thumb: pg.thumbnail.source, url: pg.fullurl, image: pg.pageimage } };
        }).filter(Boolean);
      });
    });
  }
  function imageCredits(places) {
    var files = places.filter(function (p) { return p.wiki && p.wiki.image; }).map(function (p) { return 'File:' + p.wiki.image; });
    if (!files.length) return Promise.resolve([]);
    var url = 'https://commons.wikimedia.org/w/api.php?format=json&origin=*&action=query&prop=imageinfo&iiprop=extmetadata%7Curl&iiextmetadatafilter=Artist%7CLicenseShortName&titles=' +
      files.slice(0, 50).map(encodeURIComponent).join('%7C');
    return getJson(url, null, 15000).then(function (d) {
      var pages = d.query && d.query.pages || {};
      return Object.keys(pages).map(function (k) {
        var pg = pages[k], ii = pg.imageinfo && pg.imageinfo[0];
        if (!ii) return null;
        var m = ii.extmetadata || {}, artist = String((m.Artist || {}).value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 70);
        return { text: pg.title.replace(/^File:/, '').replace(/\.\w+$/, '') + ': ' + (artist || 'unknown author') + ', ' + ((m.LicenseShortName || {}).value || 'see source') + ', via Wikimedia Commons', url: ii.descriptionurl };
      }).filter(Boolean);
    }).catch(function () { return []; });
  }

  /* ------------------------------------------------------------------ the whole scan */
  function scan(lat, lng, o) {
    o = o || {};
    var r = o.radius || 1300, say = o.onProgress || function () {}, sources = [];
    var wikiP = fromWikipedia(lat, lng, r, say).catch(function (err) { console.warn('wikipedia', err); return []; });
    var poiP = (o.skipOverpass ? Promise.reject(new Error('skipped')) : fromOverpass(lat, lng, r, say)).then(function (list) { sources.push('OpenStreetMap (Overpass)'); return list; })
      .catch(function () { return fromTiles(lat, lng, say).then(function (list) { sources.push('OpenStreetMap (OpenFreeMap tiles)'); return list; }); })
      .catch(function (err) { console.warn('poi', err); return []; });
    return Promise.all([wikiP, poiP]).then(function (res) {
      var wiki = res[0], pois = res[1];
      if (wiki.length) sources.push('Wikipedia');
      say('Found ' + pois.length + ' places and ' + wiki.length + ' landmarks. Sorting by walking time…');
      // Merge: a Wikipedia landmark that matches a nearby OpenStreetMap place gives it its photo and description.
      var out = pois.slice();
      wiki.forEach(function (w) {
        var nw = norm(w.name), match = null;
        for (var i = 0; i < out.length; i++) {
          var p = out[i];
          if (NS.dist(p.lat, p.lng, w.lat, w.lng) > 140) continue;
          var np = norm(p.name), cp = compact(p.name), cw = compact(w.name);
          if (np && nw && (np === nw || np.indexOf(nw) >= 0 || nw.indexOf(np) >= 0 || (cp.length > 4 && cp === cw))) { match = p; break; }
        }
        if (match) { match.wiki = w.wiki; if (match.cat === 'shop' || match.cat === 'essentials') match.cat = w.cat; }
        else out.push(w);
      });
      // Distance, keep what is in reach, at most 30 per category.
      var per = {};
      out.forEach(function (p) { p.dist = Math.round(NS.dist(lat, lng, p.lat, p.lng)); });
      out = out.filter(function (p) { return p.dist <= r * 1.25 && p.dist > 15; }).sort(function (a, b) { return a.dist - b.dist; }).filter(function (p) {
        per[p.cat] = (per[p.cat] || 0) + 1;
        return per[p.cat] <= (p.wiki ? 40 : 30);
      });
      out.forEach(function (p) { delete p.dist; Object.keys(p).forEach(function (k) { if (p[k] === undefined || p[k] === '') delete p[k]; }); });
      return imageCredits(out).then(function (credits) {
        var cr = [{ text: 'Places © OpenStreetMap contributors (ODbL)', url: 'https://www.openstreetmap.org/copyright' }];
        if (wiki.length) cr.push({ text: 'Landmark descriptions from Wikipedia (CC BY-SA)', url: 'https://en.wikipedia.org/' });
        return { places: out, credits: cr.concat(credits), sources: sources, scanned: new Date().toISOString() };
      });
    });
  }

  window.NSScan = { geocode: geocode, scan: scan, catOf: catOf, fromTiles: fromTiles, fromWikipedia: fromWikipedia, fromOverpass: fromOverpass };
})();
/* NSApp.json: the renderer's catalogues and calculations as JSON text, so Python gets plain dicts and lists. */
(function () {
  'use strict';
  var NS = window.NSSite, A = window.NSApp;
  function persona(p) { return { id: p.id, name: p.name, line: p.line || '', icon: NS.icon(p.icon) }; }
  A.json = {
    palettes: function () {
      return JSON.stringify(Object.keys(NS.PALETTES).map(function (k) { var p = NS.PALETTES[k]; return { key: k, name: p.name, note: p.note || '', c: p.c }; }));
    },
    fonts: function () { return JSON.stringify(Object.keys(NS.FONTS).map(function (k) { return { key: k, name: NS.FONTS[k].name, display: NS.FONTS[k].display }; })); },
    features: function () { return JSON.stringify(Object.keys(NS.FEATURES).map(function (k) { return { key: k, label: NS.FEATURES[k].label }; })); },
    persona: function (id) { var p = NS.persona(id); return JSON.stringify(p ? persona(p) : null); },
    /* rank(data) -> [{id, name, line, icon (svg), score}] best first */
    rank: function (dataJson) {
      return JSON.stringify(NS.rankPersonas(JSON.parse(dataJson)).map(function (x) { var o = persona(x.p); o.score = x.fit.score; return o; }));
    },
    /* what the wizard's scan step shows: counts per category and landmarks with photos */
    scanSummary: function (dataJson) {
      var places = NS.places(JSON.parse(dataJson));
      var cats = NS.CAT_ORDER.map(function (c) {
        var n = places.filter(function (p) { return p.cat === c; }).length;
        return { c: c, n: n, label: NS.CATS[c].plural, color: NS.CATS[c].color };
      }).filter(function (x) { return x.n; });
      var lms = places.filter(function (p) { return p.wiki && p.wiki.thumb; }).slice(0, 10).map(function (p) { return { name: p.name, thumb: p.wiki.thumb, walk: p.walk }; });
      return JSON.stringify({ count: places.length, cats: cats, landmarks: lms });
    },
    newSiteData: function (factsJson) { return JSON.stringify(A.newSiteData(JSON.parse(factsJson))); },
    swatch: function (key) { var p = NS.PALETTES[key] || NS.PALETTES.riga; return JSON.stringify(p.c); }
  };
})();

/* 4. The reception QR card (Dialogs/QrCard): a printable A4 page in the site's own palette and fonts, with a QR code
   to the hotel site, a line in every language the site speaks, and (optionally) the Wi-Fi with its own QR code.
     NSApp.qrReady()                          loads theme/assets/ns-qr.js (qrcode-generator, MIT) the first time
     NSApp.qrCard(dataJson, url, optsJson)   -> the whole HTML document; opts {layout: tent | cards | poster, wifi: {name, pass},
                                                kind: welcome | thanks}. "thanks" = the check-out card: "Thank you for staying with
                                                us" in every site language, the come-back perk + code, a QR to <site>#thanks
                                                (the review / tell-us-privately sheet, site/30-render.js); no Wi-Fi.
     NSApp.printDoc(html)                     prints it from a hidden frame (no pop-up window) */
(function () {
  'use strict';
  var A = window.NSApp, NS = window.NSSite, esc = function (s) { return NS.esc(s); };
  A.qrReady = function () {
    if (window.qrcode) return Promise.resolve(true);
    return NS.loadScript(UI.themeBase() + 'ns-qr.js').then(function () { return true; });
  };
  A.qrSvg = function (text, ink) {
    var q = window.qrcode(0, 'M');
    if (window.qrcode.stringToBytesFuncs && window.qrcode.stringToBytesFuncs['UTF-8']) window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs['UTF-8'];
    q.addData(String(text));
    q.make();
    var n = q.getModuleCount(), d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 ' + (n + 6) + ' ' + (n + 6) + '" shape-rendering="crispEdges" role="img" aria-label="QR code">' +
      '<rect x="-3" y="-3" width="' + (n + 6) + '" height="' + (n + 6) + '" fill="#fff"/><path d="' + d + '" fill="' + (ink || '#111') + '"/></svg>';
  };
  function wifiText(name, pass) {
    var e = function (s) { return String(s || '').replace(/([\\;,:"])/g, '\\$1'); };
    return 'WIFI:T:' + (pass ? 'WPA' : 'nopass') + ';S:' + e(name) + ';' + (pass ? 'P:' + e(pass) + ';' : '') + ';';
  }
  var LINES = ['Scan to plan your stay', 'Your stay hour by hour, the neighbourhood map, and a place to ask us anything.'];
  var THANKS = ['Thank you for staying with us', 'Tell others about your stay, or tell us privately: scan the code.'];

  A.qrCard = function (dataJson, url, optsJson) {
    var data = JSON.parse(dataJson || '{}'), o = JSON.parse(optsJson || '{}');
    var h = data.hotel || {}, t = data.theme || {};
    var pal = (NS.PALETTES[t.palette] || NS.PALETTES.riga).c, f = NS.FONTS[t.fonts] || NS.FONTS.belle;
    var langs = NS.siteLangs(data), layout = o.layout || 'tent', thanks = o.kind === 'thanks', wifi = thanks ? {} : (o.wifi || {});
    var lines = thanks ? THANKS : LINES, after = (data.booking || {}).after || {};
    if (thanks && url) url = String(url).split('#')[0] + '#thanks';
    var name = h.name || 'Our hotel', stars = '', short = String(url || '').replace(/^https?:\/\//, '');
    for (var i = 0; i < (+h.stars || 0); i++) stars += '★';
    var dark = (NS.PALETTES[t.palette] || {}).dark;
    var qrInk = dark ? '#111' : pal.deep;
    var qr = A.qrSvg(url || 'https://arvistay.com', qrInk);
    var wifiQr = wifi.name ? A.qrSvg(wifiText(wifi.name, wifi.pass), '#111') : '';
    function say(k, lang) { return lang === 'en' ? k : (NS.tIn(lang, k) || k); }
    var heads = langs.map(function (l, k) { return '<p class="' + (k ? 'alt' : 'main') + '" lang="' + l + '">' + esc(say(lines[0], l)) + '</p>'; }).join('');
    var sub = '<p class="sub" lang="' + langs[0] + '">' + esc(lines[1]) + '</p>';
    var perk = String(after.return_perk || '').trim(), code = String(after.return_code || '').trim().toUpperCase().slice(0, 24);
    var back = thanks && (perk || code) ? '<p class="back">' + esc(perk && code ? 'Come back direct: ' + perk.replace(/^come back direct:\s*/i, '') + ' · code ' : perk ? 'Come back direct: ' + perk.replace(/^come back direct:\s*/i, '') : 'Come back direct with code ') +
      (code ? '<b>' + esc(code) + '</b>' : '') + '</p>' : '';
    var wifiBox = wifi.name ? '<div class="wifi">' + wifiQr + '<div><b>Wi-Fi</b><span>' + esc(wifi.name) + '</span>' + (wifi.pass ? '<span class="pw">' + esc(wifi.pass) + '</span>' : '') + '</div></div>' : '';
    var corner = '<svg class="cn" viewBox="0 0 80 80" aria-hidden="true"><path d="M2 78V30C2 14 14 2 30 2h48M10 78V36c0-14 12-26 26-26h42"/><path d="M2 50c10 0 18-6 18-16 0-6-4-10-9-10-4 0-7 3-7 7 0 3 2 5 5 5"/><circle cx="30" cy="30" r="3"/></svg>';
    var initial = (String(name).replace(/^(hotel|boutique|the|villa|pension|guesthouse|hostel)\s+/ig, '').trim() || 'H').charAt(0).toUpperCase();
    var mono = '<span class="mono"><svg viewBox="0 0 48 56"><path d="M4 54V22a20 20 0 0 1 40 0v32z"/><path d="M9 54V23a15 15 0 0 1 30 0v31"/></svg><b>' + esc(initial) + '</b></span>';
    function panel(cls) {
      return '<section class="card ' + cls + '"><div class="frame">' + corner.replace('cn', 'cn tl') + corner.replace('cn', 'cn tr') + corner.replace('cn', 'cn bl') + corner.replace('cn', 'cn br') +
        '<div class="txt"><div class="brand">' + mono + '<div><b class="name">' + esc(name) + '</b>' + (stars ? '<span class="stars">' + stars + '</span>' : '') +
        (h.address ? '<span class="addr">' + esc(h.address) + '</span>' : '') + '</div></div>' + heads + sub + back + wifiBox + '</div>' +
        '<div class="code">' + qr + '<span class="url">' + esc(short) + '</span></div></div></section>';
    }
    var body;
    if (layout === 'cards') body = '<div class="sheet cards">' + [0, 1, 2, 3].map(function () { return panel('small'); }).join('') + '</div>';
    else if (layout === 'poster') body = '<div class="sheet poster">' + panel('big') + '</div>';
    else body = '<div class="sheet tent">' + panel('wide flip') + '<div class="fold"><span>fold here</span></div>' + panel('wide') + '</div>';
    var css = '@page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;background:#e9e6e0}' +
      'body{font-family:' + NS.bodyStack(t.fonts) + ';color:' + pal.ink + ';-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      '.sheet{width:210mm;height:297mm;margin:0 auto;background:#fff;position:relative;overflow:hidden}' +
      '.card{background:' + pal.bg + ';position:relative;display:flex}' +
      '.frame{position:absolute;inset:6mm;border:.6mm solid ' + pal.accent + ';border-radius:5mm;outline:.25mm solid ' + pal.accent + ';outline-offset:-2.2mm;display:flex;gap:8mm;align-items:center;padding:10mm 12mm}' +
      '.cn{position:absolute;width:13mm;height:13mm;fill:none;stroke:' + pal.accent + ';stroke-width:2.2;stroke-linecap:round}' +
      '.cn circle{fill:' + pal.accent + ';stroke:none}.cn.tl{top:2.5mm;left:2.5mm}.cn.tr{top:2.5mm;right:2.5mm;transform:scaleX(-1)}.cn.bl{bottom:2.5mm;left:2.5mm;transform:scaleY(-1)}.cn.br{bottom:2.5mm;right:2.5mm;transform:scale(-1,-1)}' +
      '.txt{flex:1;min-width:0;display:grid;gap:2.2mm}.brand{display:flex;gap:3mm;align-items:center;margin-bottom:1.5mm}' +
      '.mono{position:relative;display:grid;place-items:center;width:10mm;height:12mm;flex:none;color:' + pal.accent + '}' +
      '.mono svg{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:2.2}.mono b{position:relative;top:1mm;font:600 5mm/1 "' + f.display + '",Georgia,serif;color:' + pal.ink + '}' +
      '.name{display:block;font:600 7mm/1.05 "' + f.display + '",Georgia,serif;color:' + pal.ink + '}.stars{display:block;color:' + pal.accent + ';font-size:3.2mm;letter-spacing:.6mm}' +
      '.addr{display:block;font-size:2.8mm;color:' + pal.muted + ';margin-top:.6mm}' +
      'p{margin:0}.main{font:600 9.5mm/1.05 "' + f.display + '",Georgia,serif;color:' + pal.brand + '}.alt{font:500 4.4mm/1.25 "' + f.display + '",Georgia,serif;color:' + pal.ink + '}' +
      '.sub{font-size:3.3mm;line-height:1.4;color:' + pal.muted + ';margin-top:1mm;max-width:95mm}' +
      '.back{font-size:3.4mm;line-height:1.4;margin-top:1.5mm;padding:2mm 3mm;border:.3mm dashed ' + pal.accent + ';border-radius:3mm;background:' + pal.surface + ';width:max-content;max-width:100%}' +
      '.back b{font-family:ui-monospace,Menlo,Consolas,monospace;letter-spacing:.3mm;color:' + pal.brand + '}.small .back{font-size:2.8mm}.big .back{font-size:5mm;padding:3mm 5mm}' +
      '.wifi{display:flex;gap:3mm;align-items:center;margin-top:2mm;padding:2.2mm 3mm;border:.3mm dashed ' + pal.line + ';border-radius:3mm;background:' + pal.surface + ';width:max-content;max-width:100%}' +
      '.wifi svg{width:15mm;height:15mm;flex:none}.wifi b{display:block;font-size:2.6mm;letter-spacing:.4mm;text-transform:uppercase;color:' + pal.accent + '}' +
      '.wifi span{display:block;font-size:3.6mm;font-weight:600;overflow-wrap:anywhere}.wifi .pw{font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:500}' +
      '.code{flex:none;display:grid;justify-items:center;gap:2mm}.code svg{width:52mm;height:52mm;border-radius:3mm;display:block}' +
      '.url{font-size:2.7mm;color:' + pal.muted + ';max-width:56mm;text-align:center;overflow-wrap:anywhere}' +
      '.tent .card{height:148.5mm}.tent .flip{transform:rotate(180deg)}' +
      '.fold{position:absolute;left:0;right:0;top:148.5mm;border-top:.3mm dashed #999;height:0;z-index:2}.fold span{position:absolute;right:8mm;top:-2.2mm;background:#fff;padding:0 2mm;font:2.4mm system-ui,sans-serif;color:#777}' +
      '.cards{display:grid;grid-template-columns:105mm 105mm;grid-template-rows:148.5mm 148.5mm}.cards .card{border:.2mm dashed #bbb}' +
      '.small .frame{inset:4.5mm;flex-direction:column;justify-content:center;gap:5mm;padding:9mm 7mm;text-align:center}.small .brand{justify-content:center}.small .txt{justify-items:center}' +
      '.small .name{font-size:6mm}.small .main{font-size:6.6mm}.small .alt{font-size:3.4mm}.small .sub{font-size:2.8mm}.small .code svg{width:42mm;height:42mm}.small .wifi svg{width:12mm;height:12mm}' +
      '.poster .card{height:297mm}.big .frame{inset:10mm;flex-direction:column;justify-content:center;gap:12mm;text-align:center;padding:20mm 16mm}' +
      '.big .brand{justify-content:center;gap:5mm;margin-bottom:4mm}.big .mono{width:18mm;height:21mm}.big .mono b{font-size:9mm;top:1.6mm}.big .name{font-size:13mm}.big .stars{font-size:5mm}.big .addr{font-size:4.2mm}' +
      '.big .txt{justify-items:center;gap:4mm}.big .main{font-size:16mm}.big .alt{font-size:7.5mm}.big .sub{font-size:5.4mm;max-width:150mm}' +
      '.big .code svg{width:95mm;height:95mm}.big .url{font-size:4mm;max-width:120mm}.big .wifi svg{width:22mm;height:22mm}.big .wifi span{font-size:5mm}' +
      '@media screen{body{padding:0}}@media print{html,body{background:#fff}}';
    return '<!doctype html><html lang="' + langs[0] + '"><head><meta charset="utf-8"><title>' + esc(name) + ' QR card</title>' +
      NS.fontsUrls(t.fonts).map(function (u) { return '<link rel="stylesheet" href="' + esc(u) + '">'; }).join('') + '<sty' + 'le>' + css + '</sty' + 'le></head><body>' + body + '</body></html>';
  };

  A.printDoc = function (html) {
    return new Promise(function (resolve) {
      var old = document.getElementById('ns-print-frame');
      if (old) old.remove();
      var fr = document.createElement('iframe');
      fr.id = 'ns-print-frame';
      fr.setAttribute('aria-hidden', 'true');
      fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
      fr.onload = function () {
        var w = fr.contentWindow, go = function () { try { w.focus(); w.print(); } catch (e) { console.error(e); } resolve(true); };
        var fonts = w.document.fonts;
        if (fonts && fonts.ready) Promise.race([fonts.ready, new Promise(function (r) { setTimeout(r, 2500); })]).then(function () { setTimeout(go, 150); });
        else setTimeout(go, 600);
      };
      document.body.appendChild(fr);
      fr.srcdoc = html;
    });
  };
})();
