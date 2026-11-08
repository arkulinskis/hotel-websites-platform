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
