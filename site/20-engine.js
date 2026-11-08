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
