/* core.js: the shared front-end engine (window.UI). Same in every app made from APP_MAKER/template;
   app-specific things live in web/app.js (brand, nav, footer) and web/pages/*.html (the pages).

   Pages:   UI.page(name, {title, nav, icon, auth, order, chrome}, mount)
              auth: null (anyone) | 'guest' (signed-out only) | 'user' | 'admin'
              nav: label for the header / phone tab bar (omit to keep it out of the menus)
              mount(view, ctx) draws into `view`; ctx = {args, me, go, api}. Return a Promise (the page
              is "ready" when it resolves) or {ready, destroy}. URLs are #name/arg1/arg2.
   Server:  UI.api(fn, ...args) -> Promise of the server function's return value. A reply of
              {ok: false, error} rejects with that message (shown as a toast unless you .catch it).
            UI.apiQuiet(fn, ...args) is the same without Anvil's loading spinner.
   Auth:    UI.auth('login'|'signup'|'reset'|'logout', {...}) -> Promise of {ok, me, message}
   Helpers: UI.esc, UI.icon, UI.toast, UI.modal, UI.confirm, UI.busy, UI.formData, UI.fmtDate, UI.ago,
            UI.store, UI.setTheme, UI.feedback, UI.go, UI.refresh
   Tests:   window.UI_READY is true when the current page has finished loading. */
(function () {
  'use strict';
  if (window.UI && window.UI.__v) return;
  var UI = window.UI = { __v: 1, pages: {}, me: null, config: { name: 'App', key: 'app', home: 'home', landing: 'landing' } };
  window.UI_READY = false;

  UI.configure = function (cfg) { Object.keys(cfg).forEach(function (k) { UI.config[k] = cfg[k]; }); };

  /* ------------------------------------------------------------------ small helpers */
  UI.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  UI.plural = function (n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); };
  UI.initials = function (name) {
    var p = String(name || '?').trim().split(/\s+/);
    return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  };
  UI.fmtDate = function (iso, opts) {
    if (!iso) return '';
    var d = iso.length <= 10 ? new Date(iso + 'T12:00:00') : new Date(iso);
    return d.toLocaleDateString(undefined, opts || { day: 'numeric', month: 'short', year: 'numeric' });
  };
  UI.fmtDateTime = function (iso) {
    return iso ? new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  };
  UI.ago = function (iso) {
    if (!iso) return '';
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'just now';
    var steps = [[60, 'minute'], [24, 'hour'], [7, 'day'], [4.35, 'week'], [12, 'month'], [Infinity, 'year']], n = s / 60;
    for (var i = 0; i < steps.length; i++) {
      if (n < steps[i][0]) { n = Math.floor(n); return UI.plural(n, steps[i][1]) + ' ago'; }
      n = n / steps[i][0];
    }
    return '';
  };
  UI.store = {
    get: function (k, dflt) { try { var v = localStorage.getItem(UI.config.key + '.' + k); return v == null ? dflt : JSON.parse(v); } catch (e) { return dflt; } },
    set: function (k, v) { try { localStorage.setItem(UI.config.key + '.' + k, JSON.stringify(v)); } catch (e) {} }
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
  /* Disable a button while a Promise runs; returns the Promise. */
  UI.busy = function (btn, promise) {
    if (!btn) return promise;
    btn.disabled = true; btn.classList.add('is-busy');
    var done = function () { btn.disabled = false; btn.classList.remove('is-busy'); };
    promise.then(done, done);
    return promise;
  };

  var ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14.7c2.2.6 3.5 2.4 3.5 5.3"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/>',
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    bug: '<rect x="7" y="8" width="10" height="12" rx="5"/><path d="M12 8V5M9 5.5 7.5 4M15 5.5 16.5 4M7 13H3M21 13h-4M7.5 18l-3 2M16.5 18l3 2M7.5 9.5l-3-2M16.5 9.5l3-2"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.5"/><path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13"/><path d="M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20v-4h-4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    filter: '<path d="M4 5h16l-6 7.5V19l-4 1.5v-8z"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'
  };
  UI.ICONS = ICONS;
  UI.icon = function (name, cls) {
    return '<svg class="ui-ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.sparkle) + '</svg>';
  };

  /* ------------------------------------------------------------------ toasts, modals */
  UI.toast = function (msg, kind) {
    var box = document.querySelector('.ui-toasts');
    if (!box) { box = document.createElement('div'); box.className = 'ui ui-toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    var t = document.createElement('div');
    t.className = 'ui-toast' + (kind ? ' ' + kind : '');
    t.innerHTML = (kind === 'error' ? UI.icon('info') : kind === 'ok' ? UI.icon('check') : '') + '<span>' + UI.esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 300); }, kind === 'error' ? 6500 : 3200);
  };
  UI.modal = function (html, opts) {
    opts = opts || {};
    var prev = document.activeElement;
    var wrap = document.createElement('div');
    wrap.className = 'ui ui-modal-wrap';
    wrap.innerHTML = '<div class="ui-modal' + (opts.wide ? ' wide' : '') + '" role="dialog" aria-modal="true">' +
      '<button class="ui-btn ghost icon ui-modal-x" data-close aria-label="Close">' + UI.icon('x') + '</button>' + html + '</div>';
    document.body.appendChild(wrap);
    document.documentElement.classList.add('ui-modal-open');
    function key(e) { if (e.key === 'Escape') close(); }
    function close() {
      if (!wrap.parentNode) return;
      wrap.remove(); document.removeEventListener('keydown', key);
      if (!document.querySelector('.ui-modal-wrap')) document.documentElement.classList.remove('ui-modal-open');
      if (opts.onclose) opts.onclose();
      if (prev && prev.focus) prev.focus();
    }
    document.addEventListener('keydown', key);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(); });
    wrap.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
    var first = wrap.querySelector('input, textarea, select');
    setTimeout(function () { (first || wrap.querySelector('.ui-modal')).focus && (first || wrap.querySelector('.ui-modal')).focus(); }, 30);
    return { el: wrap.querySelector('.ui-modal'), close: close };
  };
  UI.confirm = function (o) {
    o = typeof o === 'string' ? { title: o } : (o || {});
    return new Promise(function (resolve) {
      var answered = false;
      var m = UI.modal('<h2>' + UI.esc(o.title || 'Are you sure?') + '</h2>' + (o.text ? '<p class="muted">' + UI.esc(o.text) + '</p>' : '') +
        '<div class="ui-row end" style="margin-top:20px"><button class="ui-btn ghost" data-close>' + UI.esc(o.cancel || 'Cancel') + '</button>' +
        '<button class="ui-btn ' + (o.danger ? 'danger solid' : 'primary') + '" data-ok>' + UI.esc(o.ok || 'OK') + '</button></div>',
      { onclose: function () { if (!answered) resolve(false); } });
      m.el.querySelector('[data-ok]').onclick = function () { answered = true; m.close(); resolve(true); };
    });
  };

  /* ------------------------------------------------------------------ theme */
  UI.theme = function () { return UI.store.get('theme', 'auto'); };
  UI.applyTheme = function (t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    var dark = t === 'dark' || (t !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('ui-dark', !!dark);
  };
  UI.setTheme = function (t) { UI.store.set('theme', t); UI.applyTheme(t); };
  UI.applyTheme(UI.theme());
  if (window.matchMedia) {
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { UI.applyTheme(UI.theme()); }); } catch (e) {}
  }

  /* ------------------------------------------------------------------ server bridge */
  var bridge = null;
  function send(kind, payload) {
    if (!bridge) return Promise.reject(new Error('The app is still starting.'));
    var out;
    try { out = bridge(kind, JSON.stringify(payload || {})); } catch (e) { return Promise.reject(e); }
    return Promise.resolve(out).then(function (r) {
      r = typeof r === 'string' ? JSON.parse(r) : (r || {});
      if (r.error) {
        var err = new Error(r.error); err.uiApi = true; err.denied = !!r.denied;
        if (r.detail) console.error(kind, payload && payload.fn, r.detail);
        if (r.reload) setTimeout(function () { location.reload(); }, 2500);
        throw err;
      }
      return r.result;
    });
  }
  function apiCall(quiet, fn, args) {
    return send('call', { fn: fn, args: args, quiet: quiet }).then(function (res) {
      if (res && typeof res === 'object' && res.ok === false) {
        var err = new Error(res.error || 'That didn\'t work.'); err.uiApi = true; err.expected = true; err.result = res;
        throw err;
      }
      return res;
    });
  }
  UI.api = function (fn) { return apiCall(false, fn, Array.prototype.slice.call(arguments, 1)); };
  UI.apiQuiet = function (fn) { return apiCall(true, fn, Array.prototype.slice.call(arguments, 1)); };
  /* UI.upload(fn, file, ...args): the server function gets the File (or Blob) as Anvil Media first, then args.
     (Main.py turns it into Media with anvil.js.to_media; locally the harness posts it as base64.) */
  UI.upload = function (fn, file) {
    UI._file = file;
    return send('upload', { fn: fn, args: Array.prototype.slice.call(arguments, 2), quiet: true }).then(function (res) {
      UI._file = null;
      if (res && typeof res === 'object' && res.ok === false) { var err = new Error(res.error || "That didn't work."); err.uiApi = true; err.expected = true; err.result = res; throw err; }
      return res;
    }, function (e) { UI._file = null; throw e; });
  };
  /* Errors nobody caught become a toast, so a failed action is never silent. */
  window.addEventListener('unhandledrejection', function (e) {
    if (e.reason && e.reason.uiApi) { e.preventDefault(); UI.toast(e.reason.message, 'error'); }
  });

  /* Sign in / up / out. On success it navigates: to where the visitor was heading (UI.after) or home
     after signing in, to the landing page after signing out. */
  UI.auth = function (kind, payload) {
    return send(kind, payload || {}).then(function (r) {
      if (r && r.ok === false) { var err = new Error(r.error); err.uiApi = true; err.expected = true; throw err; }
      if (r && 'me' in r && (r.me || kind === 'logout')) {
        UI.me = r.me || null;
        var target = r.me ? (UI.after || '#' + UI.config.home) : '#' + UI.config.landing;
        UI.after = null;
        if (location.hash === target) route(); else location.hash = target;
      }
      return r;
    });
  };
  /* Update the signed-in user's details (e.g. a new name) and redraw the header, without reloading the page. */
  UI.setMe = function (me) {
    UI.me = me || null;
    if (shellRoot) renderChrome(current.name);
  };

  /* ------------------------------------------------------------------ pages and routing */
  UI.page = function (name, opts, mount) {
    if (typeof opts === 'function') { mount = opts; opts = {}; }
    opts.name = name; opts.mount = mount;
    UI.pages[name] = opts;
  };
  UI.allowed = function (p) {
    if (!p) return false;
    if (p.auth === 'user') return !!UI.me;
    if (p.auth === 'admin') return !!(UI.me && UI.me.is_admin);
    if (p.auth === 'guest') return !UI.me;
    return true;
  };
  UI.navPages = function () {
    return Object.keys(UI.pages).map(function (k) { return UI.pages[k]; })
      .filter(function (p) { return p.nav && UI.allowed(p) && (!p.when || p.when()); })
      .sort(function (a, b) { return (a.order || 50) - (b.order || 50); });
  };
  UI.parseHash = function () {
    var h = (location.hash || '').replace(/^#!?\/?/, '');
    var parts = h.split('?')[0].split('/').filter(function (x) { return x !== ''; }).map(decodeURIComponent);
    return { name: parts[0] || '', args: parts.slice(1) };
  };
  UI.hashFor = function (name) {
    var args = Array.prototype.slice.call(arguments, 1).filter(function (a) { return a != null && a !== ''; });
    return '#' + [name].concat(args.map(encodeURIComponent)).join('/');
  };
  UI.go = function (name) {
    var h = UI.hashFor.apply(null, arguments);
    if (location.hash === h) route(); else location.hash = h;
  };
  UI.refresh = function () { route(); };
  UI.after = null;  // where to go after signing in

  var shellRoot = null, view = null, current = { name: null, destroy: null }, routeSeq = 0;

  function defaultPage() { return UI.me ? UI.config.home : UI.config.landing; }

  function route() {
    var r = UI.parseHash(), name = r.name || defaultPage(), p = UI.pages[name];
    if (!p) { name = defaultPage(); p = UI.pages[name]; r.args = []; }
    if (p.auth === 'guest' && UI.me) { p = UI.pages[UI.config.home]; name = UI.config.home; r.args = []; }
    if ((p.auth === 'user' || p.auth === 'admin') && !UI.me) {
      UI.after = location.hash && location.hash !== '#' ? location.hash : null;
      p = UI.pages.auth; name = 'auth'; r.args = [];
    }
    if (p.auth === 'admin' && !(UI.me && UI.me.is_admin)) {
      UI.toast('That page is for admins only.', 'error');
      p = UI.pages[UI.config.home]; name = UI.config.home; r.args = [];
    }
    var seq = ++routeSeq;
    window.UI_READY = false;
    if (current.destroy) { try { current.destroy(); } catch (e) { console.error(e); } }
    current = { name: name, args: r.args, destroy: null };
    if (shellRoot) {
      shellRoot.className = 'ui ui-shell page-' + name + (UI.me ? ' signed-in' : ' signed-out') + (p.chrome === false ? ' no-chrome' : '');
      renderChrome(name);
    }
    // A fresh element for every page, so listeners a page adds to `view` never pile up.
    var fresh = view.cloneNode(false);
    view.parentNode.replaceChild(fresh, view);
    view = fresh;
    window.scrollTo(0, 0);
    document.title = (p.title ? (typeof p.title === 'function' ? p.title(r.args) : p.title) + ' · ' : '') + UI.config.name;
    var ctx = { name: name, args: r.args, me: UI.me, go: UI.go, api: UI.api, page: p };
    var out;
    try { out = p.mount(view, ctx); } catch (e) { console.error(e); out = Promise.reject(e); }
    var ready = out && typeof out.then === 'function' ? out : (out && out.ready) || Promise.resolve();
    if (out && out.destroy) current.destroy = out.destroy;
    Promise.resolve(ready).then(function () { if (seq === routeSeq) window.UI_READY = true; },
      function (e) {
        if (seq !== routeSeq) return;
        console.error(e);
        if (!view.innerHTML) view.innerHTML = '<div class="ui-wrap"><div class="ui-empty">' + UI.icon('info') +
          '<h3>This page didn\'t load</h3><p class="muted">' + UI.esc(e && e.message || 'Something went wrong.') + '</p>' +
          '<button class="ui-btn" onclick="UI.refresh()">Try again</button></div></div>';
        window.UI_READY = true;
      });
  }
  UI.current = function () { return current; };

  /* The shell's parts come from web/app.js: UI.shell = {header(me, active), footer(me), tabbar(me, active)} */
  function renderChrome(active) {
    var S = UI.shell || {};
    var hd = shellRoot.querySelector('[data-ui-header]'), ft = shellRoot.querySelector('[data-ui-footer]'), tb = shellRoot.querySelector('[data-ui-tabbar]');
    if (hd) hd.innerHTML = S.header ? S.header(UI.me, active) : '';
    if (ft) ft.innerHTML = S.footer ? S.footer(UI.me, active) : '';
    if (tb) tb.innerHTML = S.tabbar ? S.tabbar(UI.me, active) : '';
  }
  UI.renderChrome = function () { if (shellRoot) renderChrome(current.name); };

  /* Called by client_code/Main.py (and by the local harness) once the page is up. */
  UI.start = function (node, bridgeFn, bootJson) {
    bridge = bridgeFn;
    var boot = typeof bootJson === 'string' ? JSON.parse(bootJson || '{}') : (bootJson || {});
    UI.me = boot.me || null;
    var host = node && node.matches && node.matches('[data-ui-app]') ? node : (node && node.querySelector('[data-ui-app]')) || node || document.body;
    host.innerHTML = '<div class="ui ui-shell">' +
      '<header class="ui-header" data-ui-header></header>' +
      '<main class="ui-main" data-ui-view></main>' +
      '<footer class="ui-footer" data-ui-footer></footer>' +
      '<nav class="ui-tabbar" data-ui-tabbar aria-label="Main"></nav></div>';
    shellRoot = host.firstChild;
    view = host.querySelector('[data-ui-view]');
    if (UI.shell && UI.shell.wire) UI.shell.wire(shellRoot);
    window.addEventListener('hashchange', route);
    route();
  };

  /* ------------------------------------------------------------------ feedback (footer + menu)
     All feedback goes to Prepsto. The widget tag in head.html (data-prepsto="CODE") slides its panel in;
     any [data-feedback] or [data-prepsto-open] element opens it. If the widget hasn't loaded, the panel opens in a new tab.
     There is no in-app feedback form any more: Admin -> Feedback only lists older messages (and app requests). */
  UI.feedback = function () {
    if (window.Prepsto && window.Prepsto.open) { window.Prepsto.open(); return; }
    var tag = document.querySelector('script[data-prepsto]');
    var code = tag && tag.getAttribute('data-prepsto');
    if (code && code.indexOf('__') !== 0) window.open('https://prepsto.com/#f/' + encodeURIComponent(code), '_blank', 'noopener');
    else UI.toast('Feedback is not set up yet.', 'error');
  };

  /* Shared clicks: [data-go="page/arg"], [data-feedback], [data-theme-set] anywhere in the app. */
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-go],[data-feedback],[data-theme-set]');
    if (!el) return;
    if (el.hasAttribute('data-go')) { e.preventDefault(); UI.go.apply(null, el.getAttribute('data-go').split('/')); }
    else if (el.hasAttribute('data-feedback')) { e.preventDefault(); UI.feedback(el.getAttribute('data-feedback') || null); }
    else if (el.hasAttribute('data-theme-set')) { e.preventDefault(); UI.setTheme(el.getAttribute('data-theme-set')); if (UI.shell && UI.shell.onTheme) UI.shell.onTheme(); }
  });
})();


/* app.js: this app's identity and frame: name, header, footer, phone tab bar.
   Pages live in web/pages/*.html. The engine (window.UI) is web/core.js. */
(function () {
  'use strict';
  UI.configure({
    name: 'ArviStay',
    key: 'nouveaustay',          // prefix for this app's browser storage
    tagline: 'Hotel websites in the Art Nouveau spirit. Made in Montréal, for hoteliers everywhere.',   // footer line
    home: 'sites',               // first page after signing in
    landing: 'landing'           // first page for visitors who aren't signed in
  });

  var esc = UI.esc;

  /* Uploaded files ("m:<key>") are served by the app's HTTP endpoint; starter photos ("a:<file>") are theme assets. */
  UI.mediaUrl = function (ref) {
    ref = String(ref || '');
    if (ref.indexOf('m:') === 0) return (window.APP_API || '') + '/m/' + ref.slice(2);
    if (ref.indexOf('a:') === 0) return UI.themeBase() + ref.slice(2);
    return ref;
  };
  UI.themeBase = function () { return new URL('_/theme/', location.href.split('#')[0]).href; };
  UI.siteUrl = function (slug) { return (window.APP_API || '') + '/s/' + slug; };

  function brand() {
    return '<a class="ui-brand" href="#" data-go="' + (UI.me ? UI.config.home : UI.config.landing) + '" aria-label="' + esc(UI.config.name) + ' home">' +
      '<img src="_/theme/icon.svg" alt="" width="32" height="32"><span>' + esc(UI.config.name) + '</span></a>';
  }

  function themeSwitch() {
    var t = UI.theme();
    return '<div class="ui-seg" role="group" aria-label="Appearance">' + [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(function (o) {
      return '<button type="button" data-theme-set="' + o[0] + '" class="' + (t === o[0] ? 'on' : '') + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  }

  function userMenu(me) {
    return '<div class="ui-menu" data-menu hidden>' +
      '<div class="ui-menu-head"><strong>' + esc(me.name) + '</strong><span class="muted small">' + esc(me.email) + '</span></div>' +
      '<a href="#profile" data-go="profile">' + UI.icon('user') + 'Your profile</a>' +
      (me.is_admin ? '<a href="#admin" data-go="admin">' + UI.icon('shield') + 'Admin</a>' : '') +
      '<div class="ui-menu-block"><span class="small muted">Appearance</span>' + themeSwitch() + '</div>' +
      '<button type="button" data-feedback>' + UI.icon('chat') + 'Submit feedback</button>' +
      '<button type="button" data-lk-open="overview">' + UI.icon('lock') + 'Privacy &amp; Terms</button>' +
      '<button type="button" data-signout>' + UI.icon('logout') + 'Sign out</button></div>';
  }

  UI.shell = {
    header: function (me, active) {
      var nav = UI.navPages();
      return '<div class="ui-header-in">' + brand() +
        (me ? '<nav class="ui-nav" aria-label="Main">' + nav.map(function (p) {
          return '<a href="#' + p.name + '" class="' + (p.name === active ? 'on' : '') + '">' + UI.icon(p.icon) + '<span>' + esc(p.nav) + '</span></a>';
        }).join('') + '</nav>' : '') +
        '<div class="ui-header-right">' +
        (me ? '<button type="button" class="ui-avatar-btn" data-menu-toggle aria-label="Your account" aria-haspopup="true">' + esc(UI.initials(me.name)) + '</button>' + userMenu(me)
          : (active === 'auth' ? '' : '<a class="ui-btn ghost" href="#auth" data-go="auth">Sign in</a><a class="ui-btn primary" href="#auth/signup" data-go="auth/signup">Get started</a>')) +
        '</div></div>';
    },
    footer: function (me) {
      return '<div class="ui-footer-in"><div class="ui-footer-brand">' + brand() + '<p class="muted small">' + esc(UI.config.tagline) + '</p></div>' +
        '<div class="ui-footer-links">' +
        '<a href="#landing" data-go="landing">About</a>' +
        '<a href="#explore" data-go="explore">Explore hotels</a>' +
        '<a href="https://prepsto.com/#f/uavfgu6" target="_blank" rel="noopener" data-prepsto-open>Submit feedback</a>' +
        '<button type="button" data-lk-open="overview">Privacy &amp; Terms</button>' +
        '</div><p class="ui-footer-legal small muted">© ' + new Date().getFullYear() + ' ' + esc(UI.config.name) + '</p></div>';
    },
    tabbar: function (me, active) {
      var nav = UI.navPages();
      if (!me || nav.length < 2) return '';
      return nav.slice(0, 4).map(function (p) {
        return '<a href="#' + p.name + '" class="' + (p.name === active ? 'on' : '') + '">' + UI.icon(p.icon) + '<span>' + esc(p.nav) + '</span></a>';
      }).join('') + '<a href="#profile" class="' + (active === 'profile' ? 'on' : '') + '">' + UI.icon('user') + '<span>You</span></a>';
    },
    wire: function (root) {
      root.addEventListener('click', function (e) {
        var t = e.target.closest('[data-menu-toggle]');
        var menu = root.querySelector('[data-menu]');
        if (t && menu) { menu.hidden = !menu.hidden; t.setAttribute('aria-expanded', String(!menu.hidden)); return; }
        if (e.target.closest('[data-signout]')) { UI.auth('logout').then(function () { UI.toast('Signed out. See you soon!'); }); }
        if (menu && !menu.hidden && !e.target.closest('[data-menu] .ui-seg')) menu.hidden = true;
      });
      document.addEventListener('keydown', function (e) {
        var menu = root.querySelector('[data-menu]');
        if (e.key === 'Escape' && menu) menu.hidden = true;
      });
    },
    onTheme: function () {  // redraw the menu's Auto/Light/Dark buttons and keep the menu open
      var menu = document.querySelector('[data-menu]'), open = menu && !menu.hidden;
      UI.renderChrome();
      if (open) document.querySelector('[data-menu]').hidden = false;
    }
  };
})();


/* ===== _ns.html ===== */
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
      var opts = { mode: 'export', slug: slug, media: {}, platform: { name: UI.config.name, url: location.href.split('#')[0] } };
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

/* ===== _scan.html ===== */
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

/* ===== admin.html ===== */
(function () {
  var esc = UI.esc;
  var TABS = [['overview', 'Overview', 'grid'], ['sites', 'Sites', 'globe'], ['feedback', 'Feedback', 'inbox'], ['users', 'Users', 'users'], ['demo', 'Demo data', 'database']];

  UI.page('admin', { title: 'Admin', auth: 'admin' }, function (view, ctx) {
    var tab = TABS.some(function (t) { return t[0] === ctx.args[0]; }) ? ctx.args[0] : 'overview';
    var fbFilter = 'new';
    view.innerHTML = '<div class="ui-wrap"><div class="ui-page-head"><div><h1>Admin</h1><p class="muted">Only admins see this page.</p></div></div>' +
      '<nav class="ui-tabs">' + TABS.map(function (t) {
        return '<a href="#admin/' + t[0] + '" class="' + (t[0] === tab ? 'on' : '') + '">' + UI.icon(t[2]) + t[1] + '</a>';
      }).join('') + '</nav><div data-body><div class="ui-skel"></div></div></div>';
    var body = view.querySelector('[data-body]');

    function overview() {
      return UI.api('admin_overview').then(function (d) {
        var stat = function (n, label, go) { return '<a class="ui-card ui-stat" href="#admin/' + go + '" style="text-decoration:none;color:inherit"><b>' + n + '</b><span>' + label + '</span></a>'; };
        body.innerHTML = '<div class="ad-stats">' + stat(d.users, 'people signed up', 'users') + stat(d.admins, UI.plural(d.admins, 'admin').replace(/^\d+ /, ''), 'users') +
          stat(d.feedback_new, 'new feedback', 'feedback') + stat(d.sites, 'hotel sites', 'sites') + stat(d.published, 'published', 'sites') + '</div>' +
          '<p class="muted small" style="margin-top:18px">Demo data is <b>' + esc(d.demo.state) + '</b> (' + d.demo.counts.users + ' demo people). Manage it in the Demo data tab.</p>';
      });
    }

    function feedback() {
      return UI.api('list_feedback', null).then(function (d) {
        var items = d.items.filter(function (i) { return fbFilter === 'all' || i.status === fbFilter; });
        body.innerHTML = '<div class="ui-row" style="margin-bottom:16px"><div class="ui-seg">' + [['new', 'New'], ['read', 'Read'], ['done', 'Done'], ['all', 'All']].map(function (f) {
          var n = f[0] === 'all' ? d.items.length : d.counts[f[0]];
          return '<button data-filter="' + f[0] + '" class="' + (fbFilter === f[0] ? 'on' : '') + '">' + f[1] + ' (' + n + ')</button>';
        }).join('') + '</div></div>' +
          (items.length ? '<div class="ad-fb">' + items.map(function (i) {
            var c = i.context || {};
            return '<div class="ui-item" data-id="' + esc(i.id) + '"><div class="meta"><span class="ui-badge ' + (i.kind === 'bug' ? 'bad' : i.kind === 'idea' ? 'brand' : '') + '">' + esc(i.kind_label) + '</span>' +
              '<b>' + esc(i.name) + '</b>' + (i.email ? '<a href="mailto:' + esc(i.email) + '">' + esc(i.email) + '</a>' : '') + '<span>' + esc(UI.fmtDateTime(i.created)) + '</span></div>' +
              '<p class="msg">' + esc(i.message) + '</p>' +
              '<div class="ctx">' + esc([c.page, c.screen, c.theme, c.browser].filter(Boolean).join(' · ')) + '</div>' +
              '<textarea data-note placeholder="Private note (only admins see it)">' + esc(i.note) + '</textarea>' +
              '<div class="ui-row" style="margin-top:10px">' + ['new', 'read', 'done'].map(function (s) {
                return '<button class="ui-btn sm' + (i.status === s ? ' primary' : '') + '" data-status="' + s + '">' + s[0].toUpperCase() + s.slice(1) + '</button>';
              }).join('') + '<span class="ui-spacer"></span><button class="ui-btn sm danger" data-del-fb>' + UI.icon('trash') + 'Delete</button></div></div>';
          }).join('') + '</div>'
            : '<div class="ui-empty">' + UI.icon('inbox') + '<h3>No ' + (fbFilter === 'all' ? '' : fbFilter + ' ') + 'messages</h3><p>New feedback goes to Prepsto (prepsto.com). Older messages and requests from the app show up here.</p></div>');
      });
    }

    function users(query) {
      return UI.api('list_users', query || null).then(function (d) {
        body.innerHTML = '<form class="ui-row" data-search style="margin-bottom:14px"><input type="search" name="q" placeholder="Search by name or email" value="' + esc(query || '') + '" style="max-width:360px">' +
          '<button class="ui-btn" type="submit">' + UI.icon('search') + 'Search</button><span class="muted small">' + UI.plural(d.total, 'person', 'people') + '</span></form>' +
          '<table class="ad-users"><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Admin</th><th>Active</th></tr></thead><tbody>' +
          d.users.map(function (u) {
            return '<tr data-id="' + esc(u.id) + '"><td><b>' + esc(u.name) + '</b></td><td class="email">' + esc(u.email) + '</td><td class="joined muted">' + esc(UI.fmtDate(u.joined)) + '</td>' +
              '<td><label class="ui-check"><input type="checkbox" data-admin' + (u.is_admin ? ' checked' : '') + '> Admin</label></td>' +
              '<td><label class="ui-check"><input type="checkbox" data-enabled' + (u.enabled ? ' checked' : '') + '> Active</label></td></tr>';
          }).join('') + '</tbody></table>';
      });
    }

    function demo() {
      return UI.api('admin_overview').then(function (d) {
        var c = d.demo.counts;
        body.innerHTML = '<div class="ui-card ui-narrow" style="margin:0"><h3>Demo data</h3>' +
          '<p class="muted">Example people and content, so the app never looks empty for the first visitors. Demo rows are flagged, so removing them never touches real data. Once removed, it stays removed until you load it again.</p>' +
          '<p>Status: <b>' + esc(d.demo.state) + '</b> · ' + Object.keys(c).map(function (k) { return c[k] + ' ' + esc(k); }).join(', ') + '</p>' +
          '<div class="ui-row"><button class="ui-btn primary" data-demo="load">' + UI.icon('refresh') + (d.demo.state === 'loaded' ? 'Reload demo data' : 'Load demo data') + '</button>' +
          '<button class="ui-btn danger" data-demo="remove">' + UI.icon('trash') + 'Remove demo data</button></div>' +
          '<p class="muted small" style="margin-top:16px">The Hotel Kristofs showcase is not demo data: removing the demo keeps it. If it was deleted, bring it back here.</p>' +
          '<button class="ui-btn sm" data-showcase>' + UI.icon('refresh') + 'Restore the Hotel Kristofs showcase</button></div>';
      });
    }

    function sites() {
      return UI.api('admin_sites').then(function (d) {
        body.innerHTML = (d.sites.length ? '<div class="ad-fb">' + d.sites.map(function (s) {
          return '<div class="ui-item" data-site="' + esc(s.id) + '"><div class="meta"><span class="ui-badge ' + (s.status === 'published' ? 'good' : '') + '">' + esc(s.status) + '</span>' +
            (s.is_showcase ? '<span class="ui-badge brand">Showcase</span>' : '') + (s.demo ? '<span class="ui-badge">Demo</span>' : '') +
            '<span>' + UI.plural(s.views, 'visit') + '</span><span>Edited ' + esc(UI.ago(s.updated)) + '</span></div>' +
            '<h3>' + esc(s.name) + (s.city ? ' <span class="muted small">' + esc(s.city) + '</span>' : '') + '</h3>' +
            '<p class="small muted">Owner: ' + (s.owner_email ? esc(s.owner + ' (' + s.owner_email + ')') : s.pending_owner ? 'waiting for ' + esc(s.pending_owner) : 'nobody (admins manage it)') +
            (s.slug ? ' · <a href="' + esc(UI.siteUrl(s.slug)) + '" target="_blank" rel="noopener">/s/' + esc(s.slug) + '</a>' : '') + '</p>' +
            '<div class="ui-row" style="margin-top:10px"><a class="ui-btn sm primary" href="#edit/' + esc(s.id) + '" data-go="edit/' + esc(s.id) + '">' + UI.icon('edit') + 'Edit</a>' +
            '<button class="ui-btn sm" data-transfer>' + UI.icon('user') + 'Hand over</button>' +
            '<button class="ui-btn sm" data-sitestatus="' + (s.status === 'published' ? 'draft' : 'published') + '">' + (s.status === 'published' ? 'Unpublish' : 'Publish') + '</button>' +
            '<span class="ui-spacer"></span><button class="ui-btn sm danger" data-delsite>' + UI.icon('trash') + 'Delete</button></div></div>';
        }).join('') + '</div>' : '<div class="ui-empty">' + UI.icon('globe') + '<h3>No sites yet</h3></div>');
      });
    }

    var DRAW = { overview: overview, sites: sites, feedback: feedback, users: users, demo: demo };

    view.addEventListener('click', function (e) {
      var f = e.target.closest('[data-filter]');
      if (f) { fbFilter = f.getAttribute('data-filter'); feedback(); return; }
      var st = e.target.closest('[data-status]');
      if (st) {
        var card = st.closest('[data-id]');
        UI.api('set_feedback_status', card.getAttribute('data-id'), st.getAttribute('data-status'), card.querySelector('[data-note]').value).then(function () { UI.toast('Saved', 'ok'); feedback(); });
        return;
      }
      var del = e.target.closest('[data-del-fb]');
      if (del) {
        UI.confirm({ title: 'Delete this message?', ok: 'Delete', danger: true }).then(function (yes) {
          if (yes) UI.api('delete_feedback', del.closest('[data-id]').getAttribute('data-id')).then(feedback);
        });
        return;
      }
      var siteEl = e.target.closest('[data-site]');
      if (siteEl && e.target.closest('[data-transfer]')) {
        var m = UI.modal('<h2>Hand this site over</h2><p class="muted">Type the new owner’s email. If they don’t have an account yet, the site waits for them and becomes theirs when they sign up.</p>' +
          '<form class="ui-stack" data-tr><label class="ui-field"><span>Email</span><input type="email" name="email" required></label><div class="ui-row end"><button type="button" class="ui-btn ghost" data-close>Cancel</button><button class="ui-btn primary">Hand over</button></div></form>');
        m.el.querySelector('[data-tr]').addEventListener('submit', function (ev) {
          ev.preventDefault();
          UI.busy(ev.target.querySelector('.primary'), UI.api('admin_transfer_site', siteEl.getAttribute('data-site'), UI.formData(ev.target).email)).then(function (r) { m.close(); UI.toast(r.message, 'ok'); sites(); });
        });
        return;
      }
      var ss = e.target.closest('[data-sitestatus]');
      if (siteEl && ss) { UI.api('admin_set_site_status', siteEl.getAttribute('data-site'), ss.getAttribute('data-sitestatus')).then(function () { UI.toast('Saved', 'ok'); sites(); }); return; }
      if (siteEl && e.target.closest('[data-delsite]')) {
        UI.confirm({ title: 'Delete this site?', text: 'Its photos and visit counts are deleted too.', ok: 'Delete', danger: true }).then(function (yes) {
          if (yes) UI.api('delete_site', siteEl.getAttribute('data-site')).then(function () { UI.toast('Deleted'); sites(); });
        });
        return;
      }
      if (e.target.closest('[data-showcase]')) { UI.api('admin_restore_showcase').then(function () { UI.toast('The showcase is back.', 'ok'); }); return; }
      var dm = e.target.closest('[data-demo]');
      if (dm) {
        var load = dm.getAttribute('data-demo') === 'load';
        UI.confirm({ title: load ? 'Load the demo data?' : 'Remove the demo data?', text: load ? 'Demo people and content are added (any old demo rows are replaced).' : 'Every demo row is deleted. Real data stays.', ok: load ? 'Load' : 'Remove', danger: !load })
          .then(function (yes) { if (yes) UI.busy(dm, UI.api(load ? 'demo_load' : 'demo_remove')).then(function () { UI.toast('Done', 'ok'); demo(); }); });
      }
    });
    view.addEventListener('change', function (e) {
      var row = e.target.closest('tr[data-id]');
      if (!row) return;
      var id = row.getAttribute('data-id'), box = e.target;
      var fn = box.hasAttribute('data-admin') ? 'set_admin' : box.hasAttribute('data-enabled') ? 'set_enabled' : null;
      if (fn) UI.api(fn, id, box.checked).then(function () { UI.toast('Saved', 'ok'); }, function (err) { box.checked = !box.checked; UI.toast(err.message, 'error'); });
    });
    view.addEventListener('submit', function (e) {
      if (e.target.matches('[data-search]')) { e.preventDefault(); users(UI.formData(e.target).q); }
    });
    return DRAW[tab]();
  });
})();

/* ===== auth.html ===== */
(function () {
  var esc = UI.esc;
  var GOOGLE_G = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  function pw(name, auto) {
    return '<div class="au-pw"><input type="password" name="' + name + '" autocomplete="' + auto + '" required minlength="8">' +
      '<button type="button" data-show>Show</button></div>';
  }
  UI.page('auth', { title: 'Sign in', auth: 'guest' }, function (view, ctx) {
    var mode = ['signup', 'reset'].indexOf(ctx.args[0]) >= 0 ? ctx.args[0] : 'login';
    function draw(msg, isErr) {
      var heading = { login: 'Welcome back', signup: 'Create your account', reset: 'Reset your password' }[mode];
      var sub = { login: 'Sign in to continue to ' + esc(UI.config.name) + '.', signup: 'It\'s free and takes a few seconds.',
        reset: 'We\'ll email you a link to choose a new password.' }[mode];
      view.innerHTML = '<div class="au-wrap"><div class="ui-card au-card">' +
        '<h1>' + heading + '</h1><p class="muted">' + sub + '</p>' +
        (mode !== 'reset' ? '<div class="ui-seg" role="tablist"><button type="button" data-mode="login" class="' + (mode === 'login' ? 'on' : '') + '">Sign in</button>' +
          '<button type="button" data-mode="signup" class="' + (mode === 'signup' ? 'on' : '') + '">Create account</button></div>' : '<div style="height:14px"></div>') +
        '<form class="ui-stack" data-form="' + mode + '" novalidate>' +
        (mode === 'signup' ? '<label class="ui-field"><span>Your name</span><input type="text" name="name" autocomplete="name" required maxlength="60"></label>' : '') +
        '<label class="ui-field"><span>Email</span><input type="email" name="email" autocomplete="email" required></label>' +
        (mode === 'login' ? '<label class="ui-field"><span>Password</span>' + pw('password', 'current-password') + '</label>' : '') +
        (mode === 'signup' ? '<label class="ui-field"><span>Password <em>(at least 8 characters)</em></span>' + pw('password', 'new-password') + '</label>' +
          (window.LegalKit ? '<div>' + LegalKit.consentField() + '</div>' : '') : '') +
        '<div data-msg role="alert"' + (msg ? ' class="' + (isErr ? 'ui-error' : 'ui-note') + '">' + esc(msg) : ' hidden>') + '</div>' +
        '<button class="ui-btn primary block" type="submit">' + { login: 'Sign in', signup: 'Create account', reset: 'Send the link' }[mode] + '</button></form>' +
        (mode !== 'reset' ? '<div class="au-or">or</div><button type="button" class="ui-btn block au-google" data-google>' + GOOGLE_G + 'Continue with Google</button>' : '') +
        '<div class="au-links">' + (mode === 'login' ? '<a data-mode="reset">Forgot your password?</a>' : '<a data-mode="login">' + UI.icon('back') + ' Back to sign in</a>') +
        '<a href="#landing" data-go="landing">About ' + esc(UI.config.name) + '</a></div></div></div>';
      var first = view.querySelector('input');
      if (first && !msg) first.focus();
    }
    view.addEventListener('click', function (e) {
      var m = e.target.closest('[data-mode]');
      if (m) { e.preventDefault(); mode = m.getAttribute('data-mode'); history.replaceState(null, '', '#auth' + (mode === 'login' ? '' : '/' + mode)); draw(); return; }
      var g = e.target.closest('[data-google]');
      if (g) { google(g); return; }
      var s = e.target.closest('[data-show]');
      if (s) { var i = s.parentNode.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password'; s.textContent = i.type === 'password' ? 'Show' : 'Hide'; }
    });
    view.addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target, v = UI.formData(form);
      var problem = !/^\S+@\S+\.\S+$/.test(v.email || '') ? 'Please enter a valid email address.'
        : mode !== 'reset' && (v.password || '').length < (mode === 'signup' ? 8 : 1) ? (mode === 'signup' ? 'Please choose a password of at least 8 characters.' : 'Please enter your password.')
        : mode === 'signup' && (v.name || '').trim().length < 2 ? 'Please tell us your name.' : null;
      if (problem) { say(problem, true); return; }
      if (mode === 'signup' && window.LegalKit && !LegalKit.consentChecked(form)) return;  // the kit shows its own message
      UI.busy(form.querySelector('[type=submit]'), UI.auth(mode, v)).then(function (r) {
        if (mode === 'reset' || (r && !r.me)) { mode = 'login'; draw(r && r.message, false); restore({ email: v.email }); }
        else UI.toast(mode === 'signup' ? 'Welcome to ' + UI.config.name + '!' : 'Welcome back!', 'ok');
      }, function (err) { say(err.message, true); });
    });
    // Sign-up asks for the Privacy & Terms tick here too (ticking it is remembered for the new account).
    function google(btn) {
      var form = view.querySelector('form'), v = mode === 'signup' ? UI.formData(form) : {};
      if (mode === 'signup' && window.LegalKit && !LegalKit.consentChecked(form)) return;
      UI.busy(btn, UI.auth('google', { name: (v.name || '').trim() })).then(function () {
        UI.toast(mode === 'signup' ? 'Welcome to ' + UI.config.name + '!' : 'Welcome back!', 'ok');
      }, function (err) { say(err.message, true); });
    }
    function say(msg, isErr) {
      var box = view.querySelector('[data-msg]');
      box.className = isErr ? 'ui-error' : 'ui-note'; box.textContent = msg; box.hidden = false;
    }
    function restore(v) {
      ['name', 'email'].forEach(function (k) { var i = view.querySelector('[name=' + k + ']'); if (i && v[k]) i.value = v[k]; });
    }
    draw();
  });
})();

/* ===== edit.html ===== */
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

  UI.page('edit', { title: 'Edit site', auth: 'user', chrome: false }, function (view, ctx) {
    var id = ctx.args[0];
    S = { id: id, tab: TABS.some(function (t) { return t[0] === ctx.args[1]; }) ? ctx.args[1] : 'start', device: UI.store.get('ed.device', 'desktop'), data: null, site: null,
      version: 1, timer: null, ptimer: null, saving: false, again: false, state: 'saved', media: null, persona: null, pq: '', pcat: '', plimit: 80, ready: false, stats: null };
    var st = S;
    view.innerHTML = '<div class="ui-wrap"><div class="ui-skel" style="height:70vh"></div></div>';
    if (!id) { UI.go('sites'); return Promise.resolve(); }

    function shell() {
      view.innerHTML = '<div class="ed"><div class="ed-top"><a class="ui-btn ghost icon" href="#sites" data-go="sites" aria-label="Back to your sites">' + UI.icon('back') + '</a>' +
        '<div class="ed-title"><h1 data-title></h1><span class="ed-save" data-save><i></i><span>Saved</span></span></div>' +
        '<div class="ui-seg ed-dev" role="group" aria-label="Preview size">' + [['desktop', 'Desktop'], ['tablet', 'Tablet'], ['phone', 'Phone']].map(function (d) {
          return '<button data-dev="' + d[0] + '" class="' + (st.device === d[0] ? 'on' : '') + '">' + d[1] + '</button>'; }).join('') + '</div>' +
        '<select class="ed-persel" data-persel aria-label="Preview as" style="width:auto;min-height:40px;padding:6px 10px"></select>' +
        '<button class="ui-btn sm ed-switch" data-switch>' + UI.icon('globe') + 'Preview</button>' +
        '<button class="ui-btn primary sm ed-pub" data-tab="publish">' + UI.icon('globe') + '<span>Publish</span></button></div>' +
        '<div class="ed-body"><nav class="ed-tabs" aria-label="Editor sections">' + TABS.map(function (t) {
          return '<button data-tab="' + t[0] + '" class="' + (st.tab === t[0] ? 'on' : '') + '">' + UI.icon(t[2]) + t[1] + '</button>'; }).join('') + '</nav>' +
        '<section class="ed-panel" data-panel></section>' +
        '<div class="ed-prev" data-prev><div class="ed-frame ' + st.device + '" data-frame><iframe title="Live preview of your site" data-iframe></iframe></div></div></div></div>';
      var ifr = view.querySelector('[data-iframe]');
      ifr.srcdoc = NSApp.previewDoc();
      fitFrame();
      drawTop();
    }
    function drawTop() {
      var t = view.querySelector('[data-title]');
      if (t) t.textContent = NS.get(st.data, 'hotel.name', 'Untitled');
      var ps = view.querySelector('[data-persel]');
      if (ps) ps.innerHTML = '<option value="">Preview as: everyone</option>' + NS.enabledPersonas(st.data).map(function (p) { return '<option value="' + p.id + '"' + (st.persona === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('');
      var pub = view.querySelector('.ed-pub span');
      if (pub) pub.textContent = st.site.status === 'published' ? (st.site.unpublished_changes ? 'Publish changes' : 'Live') : 'Publish';
    }
    function saveState(s, msg) {
      st.state = s;
      var el = view.querySelector('[data-save]');
      if (!el) return;
      el.className = 'ed-save' + (s === 'busy' ? ' busy' : s === 'err' ? ' err' : '');
      el.querySelector('span').textContent = msg || (s === 'busy' ? 'Saving…' : s === 'err' ? 'Not saved' : 'Saved');
    }

    /* ---------------------------------------------------------------- preview */
    function post(msg) { var f = view.querySelector('[data-iframe]'); if (f && f.contentWindow && st.ready) f.contentWindow.postMessage(msg, '*'); }
    function pushPreview(now) {
      clearTimeout(st.ptimer);
      var go = function () { st.data._rev = (st.data._rev || 0); post({ type: 'ns-data', data: JSON.parse(JSON.stringify(st.data)) }); };
      if (now) go(); else st.ptimer = setTimeout(go, 260);
    }
    function onMessage(ev) {
      var f = view.querySelector('[data-iframe]');
      if (!f || ev.source !== f.contentWindow) return;
      var m = ev.data || {};
      if (m.type === 'ns-ready') { st.ready = true; pushPreview(true); }
      if (m.type === 'ns-drawn') window.NS_PREVIEW_DRAWN = (window.NS_PREVIEW_DRAWN || 0) + 1;
      if (m.type === 'ns-edit' && SECTION_TAB[m.section]) { st.tab = SECTION_TAB[m.section]; drawTabs(); drawPanel(); if (innerWidth < 860) view.querySelector('.ed').classList.remove('show-prev'); }
    }
    window.addEventListener('message', onMessage);
    function fitFrame() {
      var fr = view.querySelector('[data-frame]'), box = view.querySelector('[data-prev]');
      if (!fr || !box) return;
      fr.className = 'ed-frame ' + st.device;
      fr.style.transform = '';
      if (st.device === 'desktop') return;
      var w = st.device === 'tablet' ? 820 : 390, avail = box.clientWidth - 40;
      if (avail > 0 && w > avail) { var k = avail / w; fr.style.transform = 'scale(' + k.toFixed(3) + ')'; fr.style.height = ((box.clientHeight - 32) / k) + 'px'; }
      else fr.style.height = '';
    }
    window.addEventListener('resize', fitFrame);

    /* ---------------------------------------------------------------- saving */
    function changed(o) {
      o = o || {};
      st.data._rev = (st.data._rev || 0) + 1;
      saveState('busy', 'Unsaved changes');
      clearTimeout(st.timer);
      st.timer = setTimeout(save, 1100);
      pushPreview();
      if (o.top) drawTop();
      if (o.panel) drawPanel();
    }
    function save() {
      if (st.saving) { st.again = true; return Promise.resolve(); }
      st.saving = true; saveState('busy');
      var payload = JSON.parse(JSON.stringify(st.data));
      delete payload._rev;
      return UI.apiQuiet('save_site', st.id, payload, st.version).then(function (r) {
        st.version = r.version; st.site.unpublished_changes = r.unpublished_changes; saveState('saved'); drawTop();
      }, function (err) {
        if (err.result && err.result.conflict) {
          saveState('err', 'Changed elsewhere');
          UI.confirm({ title: 'This site changed somewhere else', text: 'It was saved in another tab or by another person. Reload to get the latest version (your last few changes here will be lost).', ok: 'Reload' })
            .then(function (yes) { if (yes) UI.refresh(); });
        } else { saveState('err'); UI.toast('Not saved: ' + err.message + ' We will try again.', 'error'); st.timer = setTimeout(save, 6000); }
      }).then(function () { st.saving = false; if (st.again) { st.again = false; save(); } });
    }
    function beforeUnload(e) { if (st.state !== 'saved') { e.preventDefault(); e.returnValue = ''; } }
    window.addEventListener('beforeunload', beforeUnload);
    st.cleanup = function () {
      window.removeEventListener('message', onMessage); window.removeEventListener('resize', fitFrame); window.removeEventListener('beforeunload', beforeUnload);
      clearTimeout(st.timer); clearTimeout(st.ptimer);
    };

    /* ---------------------------------------------------------------- tabs + panels */
    function drawTabs() { Array.prototype.forEach.call(view.querySelectorAll('[data-tab]'), function (b) { if (b.closest('.ed-tabs')) b.classList.toggle('on', b.getAttribute('data-tab') === st.tab); }); }
    function drawPanel() {
      var el = view.querySelector('[data-panel]');
      if (!el) return;
      var y = el.scrollTop, same = el.getAttribute('data-for') === st.tab;
      el.innerHTML = PANELS[st.tab]();
      el.setAttribute('data-for', st.tab);
      if (same) el.scrollTop = y; else el.scrollTop = 0;
      if (st.tab === 'publish') loadStats();
      if (st.tab === 'media' && !st.media) loadMedia();
    }
    function loadMedia() {
      return UI.apiQuiet('list_media', st.id).then(function (r) { st.media = r.items; if (st.tab === 'media') drawPanel(); return st.media; });
    }
    function loadStats() {
      if (st.site.status !== 'published' && !st.site.views) return;
      UI.apiQuiet('site_stats', st.id, 30).then(function (r) { st.stats = r; var box = view.querySelector('[data-statsbox]'); if (box) box.innerHTML = statsHtml(r); });
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
      },

      publish: function () {
        var site = st.site, live = site.status === 'published';
        return '<h2>Publish</h2><p class="muted">Your site gets its own link on ' + esc(UI.config.name) + '. You can also download it and host it anywhere.</p>' +
          '<div class="ed-box"><label class="ui-field"><span>Your address</span><div class="ui-row" style="flex-wrap:nowrap"><span class="small muted" style="white-space:nowrap">…/s/</span>' +
          '<input type="text" data-slug value="' + esc(site.slug || '') + '" maxlength="60"></div><p class="ui-hint" data-slughint>Letters, digits and dashes.</p></label>' +
          (live ? '<p><a href="' + esc(site.url) + '" target="_blank" rel="noopener">' + UI.icon('external') + ' ' + esc((site.url || '').replace(/^https?:\/\//, '')) + '</a></p>' : '') +
          '<div class="ui-row"><button class="ui-btn primary" data-publish>' + UI.icon('globe') + (live ? (site.unpublished_changes ? 'Publish my changes' : 'Publish again') : 'Publish my site') + '</button>' +
          (live ? '<button class="ui-btn sm ghost" data-copy="' + esc(site.url) + '">' + UI.icon('copy') + 'Copy link</button><button class="ui-btn sm danger" data-unpublish>Unpublish</button>' : '') + '</div>' +
          (live && site.unpublished_changes ? '<p class="ui-note" style="margin-top:10px">You have changes that are not live yet.</p>' : '') + '</div>' +
          '<h3>' + UI.icon('sparkle') + 'Visits</h3><div data-statsbox>' + (st.stats ? statsHtml(st.stats) : (live || site.views ? '<div class="ui-skel" style="min-height:120px"></div>' : '<p class="small muted">Visits and the guest profiles people pick appear here once the site is live. No cookies, no personal data: just counts.</p>')) + '</div>' +
          '<h3>' + UI.icon('search') + 'Search engines and link previews</h3>' + fld('Page title', 'seo.title', { ph: NS.get(st.data, 'hotel.name', '') + ' · ' + NS.get(st.data, 'hotel.city', '') }) +
          fld('Description', 'seo.description', { area: true, rows: 2, max: 300 }) +
          '<h3>' + UI.icon('copy') + 'Host it yourself</h3><p class="small muted">Download a folder with index.html and all your photos. Upload it to any web host (Netlify Drop, GitHub Pages, your hosting company).</p>' +
          '<div class="ui-row"><button class="ui-btn sm" data-export="zip">' + UI.icon('inbox') + 'Download .zip</button><button class="ui-btn sm ghost" data-export="single">' + UI.icon('copy') + 'One .html file</button></div>' +
          '<h3>' + UI.icon('globe') + 'Your own domain</h3><p class="small muted">Already own www.yourhotel.com? Set up a redirect (called "URL forwarding" at most domain companies) to your link above. Or download the site and host it at your domain.</p>' +
          '<h3>' + UI.icon('more') + 'More</h3><div class="ui-row"><button class="ui-btn sm" data-dup>' + UI.icon('copy') + 'Duplicate</button><button class="ui-btn sm danger" data-delsite>' + UI.icon('trash') + 'Delete this site</button></div>';
      }
    };

    function listEditor(path, body, template, addLabel) {
      var arr = list(st.data, path);
      return arr.map(function (x, i) {
        return '<div class="ed-box"><div class="ui-row" style="margin-bottom:8px"><b class="small muted">' + (i + 1) + '</b>' + tools(path, i, arr.length) + '</div>' + body(x || {}, i, path + '.' + i) + '</div>';
      }).join('') + '<button class="ui-btn sm" data-add="' + esc(path) + '" data-tpl="' + esc(JSON.stringify(template)) + '">' + UI.icon('plus') + esc(addLabel) + '</button>';
    }

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
    function library(kind, multi) {
      var refs = {};
      function add(ref) { if (ref && /^(m:|a:|https?:)/.test(ref)) refs[ref] = 1; }
      (function walk(v) { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.keys(v).forEach(function (k) { if (k !== 'places') walk(v[k]); }); else if (typeof v === 'string' && /^(m|a):/.test(v)) add(v); })(st.data);
      NS.places(st.data).forEach(function (p) { if (p.wiki && p.wiki.thumb && kind !== 'pano') add(p.wiki.thumb); });
      return (st.media ? Promise.resolve(st.media) : loadMedia()).then(function (items) {
        var mine = items.filter(function (m) { return kind === 'video' ? m.kind === 'video' : kind === 'pano' ? m.kind === 'pano' || m.kind === 'image' : m.kind !== 'video'; }).map(function (m) { return m.ref; });
        mine.forEach(function (r) { delete refs[r]; });
        var others = kind === 'video' ? [] : Object.keys(refs).filter(function (r) { return !/\.(mp4|webm)/.test(r) && (kind !== 'pano' || /pano/.test(r)); });
        var all = mine.concat(others);
        return new Promise(function (resolve) {
          var chosen = [];
          var m = UI.modal('<h2>' + (kind === 'video' ? 'Choose a video' : multi ? 'Choose photos' : 'Choose a photo') + '</h2><p class="muted small">' + (all.length ? 'Your uploads first, then photos already on your site and from the neighbourhood.' : 'Nothing here yet: upload something.') + '</p>' +
            '<div class="ed-lib">' + all.map(function (r) { return '<button data-ref="' + esc(r) + '" class="' + (kind === 'video' ? 'vid' : '') + '" style="' + (kind === 'video' ? '' : NSApp.coverStyle(r)) + '" title="' + esc(r.slice(0, 80)) + '"></button>'; }).join('') + '</div>' +
            '<div class="ui-row between"><button class="ui-btn ghost" data-up>' + UI.icon('camera') + 'Upload new</button><span class="ui-row"><button class="ui-btn ghost" data-close>Cancel</button>' +
            (multi ? '<button class="ui-btn primary" data-done>Add</button>' : '') + '</span></div>', { wide: true, onclose: function () { resolve(chosen); } });
          m.el.addEventListener('click', function (e) {
            var b = e.target.closest('[data-ref]');
            if (b) {
              var r = b.getAttribute('data-ref');
              if (!multi) { chosen = [r]; m.close(); return; }
              var i = chosen.indexOf(r); if (i >= 0) chosen.splice(i, 1); else chosen.push(r);
              b.classList.toggle('on', i < 0);
            }
            if (e.target.closest('[data-done]')) m.close();
            if (e.target.closest('[data-up]')) {
              NSApp.pick({ accept: kind === 'video' ? 'video/*' : 'image/*', multiple: multi }).then(function (files) {
                if (!files.length) return;
                return NSApp.uploadMany(st.id, files, kind === 'video' ? 'video' : kind === 'pano' ? 'pano' : 'image').then(function (items) {
                  st.media = (items || []).concat(st.media || []);
                  chosen = items.map(function (x) { return x.ref; }); m.close();
                });
              });
            }
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
    view.addEventListener('input', function (e) {
      var t = e.target;
      if (t.matches('[data-pq]')) { st.pq = t.value; var y = view.querySelector('[data-panel]').scrollTop; drawPanel(); var inp = view.querySelector('[data-pq]'); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); view.querySelector('[data-panel]').scrollTop = y; return; }
      if (t.matches('[data-slug]')) { checkSlug(t.value); return; }
      if (!t.matches('[data-k]') || t.type === 'radio' || t.type === 'checkbox' || t.tagName === 'SELECT') return;
      var v = t.value;
      if (t.hasAttribute('data-num')) v = v === '' ? null : +v;
      if (t.hasAttribute('data-csv')) v = v.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      set(st.data, t.getAttribute('data-k'), v);
      changed({ top: /hotel\.name/.test(t.getAttribute('data-k')) });
    });
    view.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-persel]')) { st.persona = t.value || null; post({ type: 'ns-persona', persona: t.value }); return; }
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
        if (/^theme\./.test(path)) pushPreview(true);
      }
    });
    view.addEventListener('submit', function (e) {
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
    });
    view.addEventListener('click', function (e) {
      var t = e.target, b;
      if ((b = t.closest('[data-tab]'))) { st.tab = b.getAttribute('data-tab'); drawTabs(); drawPanel(); if (TAB_SECTION[st.tab]) post({ type: 'ns-scroll', section: TAB_SECTION[st.tab] }); return; }
      if ((b = t.closest('[data-dev]'))) { st.device = b.getAttribute('data-dev'); UI.store.set('ed.device', st.device); Array.prototype.forEach.call(view.querySelectorAll('[data-dev]'), function (x) { x.classList.toggle('on', x === b); }); fitFrame(); return; }
      if (t.closest('[data-switch]')) { var ed = view.querySelector('.ed'); ed.classList.toggle('show-prev'); t.closest('[data-switch]').innerHTML = ed.classList.contains('show-prev') ? UI.icon('edit') + 'Edit' : UI.icon('globe') + 'Preview'; return; }
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
        NSApp.pick({ multiple: true }).then(function (files) { if (files.length) return NSApp.uploadMany(st.id, files, 'image').then(function (items) {
          st.media = items.concat(st.media || []); putRefs(b.getAttribute('data-upload'), items.map(function (x) { return x.ref; }), false, b.hasAttribute('data-obj')); }); });
        return;
      }
      if ((b = t.closest('[data-upload1]'))) {
        var kind = b.getAttribute('data-kind') || 'image';
        NSApp.pick({ accept: kind === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*' }).then(function (files) {
          if (files.length) return NSApp.uploadMany(st.id, files, kind).then(function (items) { st.media = items.concat(st.media || []); putRefs(b.getAttribute('data-upload1'), items.map(function (x) { return x.ref; }), true); });
        });
        return;
      }
      if ((b = t.closest('[data-libup]'))) {
        var lk = b.getAttribute('data-libup');
        NSApp.pick({ multiple: lk === 'image', accept: lk === 'video' ? 'video/*' : 'image/*' }).then(function (files) { if (files.length) return NSApp.uploadMany(st.id, files, lk).then(function () { st.media = null; drawPanel(); }); });
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
      if ((b = t.closest('[data-per]'))) { st.persona = b.getAttribute('data-per'); st.pn = null; drawPanel(); drawTop(); post({ type: 'ns-persona', persona: st.persona }); return; }
      if (t.closest('[data-perclose]')) { e.preventDefault(); st.persona = null; drawPanel(); drawTop(); return; }
      if ((b = t.closest('[data-pn]'))) { st.pn = +b.getAttribute('data-pn'); drawPanel(); return; }
      if ((b = t.closest('[data-pershow]'))) { post({ type: 'ns-persona', persona: b.getAttribute('data-pershow') }); post({ type: 'ns-scroll', section: 'stay' }); if (innerWidth < 860) view.querySelector('[data-switch]').click(); return; }
      if (t.closest('[data-more]')) { st.plimit += 120; drawPanel(); return; }
      if (t.closest('[data-relocate]')) { relocate(); return; }
      if ((b = t.closest('[data-rescan]'))) { rescan(b); return; }
      if ((b = t.closest('[data-publish]'))) { publish(b); return; }
      if ((b = t.closest('[data-unpublish]'))) {
        UI.confirm({ title: 'Unpublish the site?', text: 'The link stops working until you publish again.', ok: 'Unpublish', danger: true }).then(function (yes) {
          if (yes) UI.api('unpublish_site', st.id).then(function (r) { st.site = Object.assign(st.site, r.site); drawPanel(); drawTop(); UI.toast('Unpublished.'); });
        });
        return;
      }
      if ((b = t.closest('[data-copy]'))) { if (navigator.clipboard) navigator.clipboard.writeText(b.getAttribute('data-copy')); UI.toast('Link copied', 'ok'); return; }
      if ((b = t.closest('[data-export]'))) {
        var single = b.getAttribute('data-export') === 'single';
        UI.busy(b, save().then(function () { return NSApp.exportSite(st.data, st.site.slug, { single: single }); })).then(function (r) {
          UI.toast('Downloaded: ' + UI.plural(r.files, 'file') + ', ' + (r.bytes / 1048576).toFixed(1) + ' MB.', 'ok');
        }, function (err) { UI.toast('Export failed: ' + err.message, 'error'); });
        return;
      }
      if (t.closest('[data-dup]')) { save().then(function () { return UI.api('duplicate_site', st.id); }).then(function (r) { UI.toast('Copy made.', 'ok'); UI.go('edit', r.id); }); return; }
      if (t.closest('[data-delsite]')) {
        UI.confirm({ title: 'Delete this site?', text: 'The site, its photos and its visit counts are deleted for good.', ok: 'Delete', danger: true }).then(function (yes) {
          if (yes) { st.state = 'saved'; UI.api('delete_site', st.id).then(function () { UI.toast('Deleted.'); UI.go('sites'); }); }
        });
      }
    });
    view.addEventListener('mousemove', function (e) {
      var tip = view.querySelector('.ed-tip');
      if (!tip) return;
      var r = e.target.closest && e.target.closest('[data-tipd]');
      if (!r) { tip.hidden = true; return; }
      var box = tip.parentNode.getBoundingClientRect(), rb = r.getBoundingClientRect();
      tip.textContent = r.getAttribute('data-tipd'); tip.hidden = false;
      tip.style.left = (rb.left - box.left + rb.width / 2) + 'px'; tip.style.top = (rb.top - box.top) + 'px';
    });

    var slugTimer = null;
    function checkSlug(v) {
      clearTimeout(slugTimer);
      slugTimer = setTimeout(function () {
        UI.apiQuiet('check_slug', v, st.id).then(function (r) {
          var h = view.querySelector('[data-slughint]');
          if (h) { h.textContent = r.free ? 'Free: …/s/' + r.slug : r.problem; h.style.color = r.free ? 'var(--c-good)' : 'var(--c-bad)'; }
        });
      }, 350);
    }
    function publish(btn) {
      var slugEl = view.querySelector('[data-slug]');
      UI.busy(btn, save().then(function () { return UI.api('publish_site', st.id, slugEl ? slugEl.value : null); })).then(function (r) {
        st.site = Object.assign(st.site, r.site); drawPanel(); drawTop();
        var m = UI.modal('<h2>Your site is live</h2><p class="muted">Share this link, put it on your booking profiles, or print it on a card at reception.</p>' +
          '<p style="font-size:1.05rem;overflow-wrap:anywhere"><a href="' + esc(r.site.url) + '" target="_blank" rel="noopener">' + esc(r.site.url) + '</a></p>' +
          '<div class="ui-row end"><button class="ui-btn" data-c>' + UI.icon('copy') + 'Copy link</button><a class="ui-btn primary" href="' + esc(r.site.url) + '" target="_blank" rel="noopener">' + UI.icon('external') + 'Open it</a></div>');
        m.el.querySelector('[data-c]').onclick = function () { if (navigator.clipboard) navigator.clipboard.writeText(r.site.url); UI.toast('Link copied', 'ok'); };
      });
    }
    function relocate() {
      var h = st.data.hotel || {};
      UI.busy(view.querySelector('[data-relocate]'), NSScan.geocode(h.address || '')).then(function (rows) {
        if (!rows.length) { UI.toast('Address not found. Check the street and city.', 'error'); return; }
        var r = rows[0];
        h.lat = r.lat; h.lng = r.lng; st.data.hotel = h;
        changed({ panel: true });
        UI.confirm({ title: 'Moved to ' + r.label.split(',').slice(0, 3).join(','), text: 'Scan the neighbourhood again from the new position?', ok: 'Scan again' }).then(function (yes) { if (yes) { st.tab = 'area'; drawTabs(); drawPanel(); rescan(view.querySelector('[data-rescan]')); } });
      });
    }
    function rescan(btn) {
      var h = st.data.hotel || {};
      if (h.lat == null) { UI.toast('Add the address first (Hotel tab).', 'error'); return; }
      var rsel = view.querySelector('[data-radius]'), radius = rsel ? +rsel.value : 1300;
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

    return UI.api('get_site', id).then(function (r) {
      st.site = r.site; st.data = r.site.data || {}; st.version = r.site.version;
      if (!st.data.sections || !st.data.sections.length) st.data.sections = NS.SECTIONS.map(function (s) { return { id: s.id, on: true }; });
      NS.SECTIONS.forEach(function (s) { if (!st.data.sections.some(function (x) { return x.id === s.id; })) st.data.sections.push({ id: s.id, on: false }); });
      shell(); drawPanel();
    });
  });

  /* Leaving the editor: stop listening (the router calls destroy when it is returned with ready). */
  var origPage = UI.pages.edit.mount;
  UI.pages.edit.mount = function (view, ctx) {
    var p = origPage(view, ctx);
    return {
      ready: p,
      destroy: function () {
        if (S && S.state !== 'saved' && S.data) {
          var payload = JSON.parse(JSON.stringify(S.data)); delete payload._rev;
          UI.apiQuiet('save_site', S.id, payload, S.version).catch(function () {});
        }
        if (S && S.cleanup) S.cleanup();
        window.NS_PREVIEW_DRAWN = 0;
      }
    };
  };
})();

/* ===== explore.html ===== */
(function () {
  var esc = UI.esc;
  UI.page('explore', { title: 'Explore hotels', nav: 'Explore', icon: 'globe', order: 20 }, function (view, ctx) {
    view.innerHTML = '<div class="ui-wrap"><div class="ui-skel" style="height:380px"></div></div>';
    return UI.api('public_sites').then(function (d) {
      view.innerHTML = '<div class="ui-wrap"><div class="ex-head"><div class="eyebrow">Made with ' + esc(UI.config.name) + '</div><h1>Hotels that sell the stay</h1>' +
        '<p class="muted">Every site below was made in an afternoon: rooms, a 3D neighbourhood map and a stay written for each kind of guest. Open one and pick who you are.</p></div>' +
        (d.sites.length ? '<div class="ex-grid">' + d.sites.map(function (s) {
          return '<a class="ex-card" href="' + esc(s.url) + '" target="_blank" rel="noopener"><div class="ex-cover" style="' + NSApp.coverStyle(s.cover) + '">' +
            (s.showcase ? '<span class="ui-badge brand">Showcase</span>' : s.demo ? '<span class="ui-badge">Demo</span>' : '') + '</div>' +
            '<div class="ex-body">' + (s.stars ? '<div class="ex-stars">' + new Array(+s.stars + 1).join('★') + '</div>' : '') + '<h3>' + esc(s.name) + '</h3><p>' + esc(s.tagline || [s.area, s.city].filter(Boolean).join(', ')) + '</p>' +
            '<div class="ex-meta"><span>' + UI.icon('pin') + esc(s.city) + '</span><span>' + UI.icon('map') + s.places + ' places nearby</span>' + (s.rooms ? '<span>' + UI.icon('home') + UI.plural(s.rooms, 'room') + '</span>' : '') + '</div></div></a>';
        }).join('') + '</div>' : '<div class="ui-empty">' + UI.icon('globe') + '<h3>No published sites yet</h3><p>Be the first.</p></div>') +
        (ctx.me ? '' : '<div style="text-align:center;margin-top:38px"><a class="ui-btn primary lg" href="#auth/signup" data-go="auth/signup">' + UI.icon('sparkle') + 'Make one for your hotel</a></div>') + '</div>';
    });
  });
})();

/* ===== landing.html ===== */
(function () {
  var NS = window.NSSite;
  var COPY = {
    eyebrow: 'Websites for small hotels',
    title: 'A hotel website that <em>sells the stay</em>, not just the room',
    lead: 'Type your address. ' + UI.config.name + ' finds every café, museum and park around you, writes a stay for 30 kinds of guest, and builds a beautiful Art Nouveau site with your rooms, videos and 360° tours. Guests still book on Booking.com or Hotels.com, the way they already do.',
    cta: 'Create your hotel site',
    proof: ['Free while in beta', 'No coding, no plugins', 'Host with us or download it'],
    steps: [['Type your address', 'We map the neighbourhood: places from OpenStreetMap, landmarks and photos from Wikipedia, all sorted by walking time from your door.'],
            ['Pick your guests', 'Thirty traveller profiles, ranked by how well your area suits each one. Every profile gets a stay planned hour by hour, automatically.'],
            ['Add photos, publish', 'Upload room photos, videos and 360° shots, adjust the texts we drafted, and publish to your own link. Or download it and host it anywhere.']],
    features: [['image', 'Video, or a film of your photos', 'A video background, YouTube or Vimeo, or slow cinematic zooms made from your own photos.'],
               ['refresh', '360° photos and 3D tours', 'A 360° viewer built in, Matterport or Kuula tours, and a "walk from our door" photo walk.'],
               ['map', 'A 3D neighbourhood map', '3D buildings, rings at 5, 10 and 15 minutes on foot, and a camera that flies along a guest\'s day.'],
               ['users', 'Thirty guest profiles', 'Foodie, family, night owl, history buff… Guests pick one and the whole page rearranges itself.'],
               ['calendar', 'The stay, written for them', 'Arrival, days and departure, hour by hour, from real places near you, with your own tips and favourites.'],
               ['shield', 'Booking and payment, explained', 'Where to book, when to pay, house rules, and questions answered before guests ask.'],
               ['grid', 'Galleries that look modern', 'Bento, masonry, film strip or arched Art Nouveau frames, with a full-screen viewer.'],
               ['globe', 'Your link or your own host', 'Publish to your own link here, or download a folder with everything and put it on any web host.'],
               ['search', 'Ready for search engines', 'Titles, link previews and Google\'s hotel data are added for you.']],
    faq: [['Can guests book on my site?', 'Not directly, on purpose. Booking buttons send guests to Booking.com, Hotels.com, Expedia, your phone or your email, so your rooms and prices stay where you already manage them. The site explains how booking and payment work, so guests book with confidence.'],
          ['Where does the neighbourhood information come from?', 'Places come from OpenStreetMap and landmarks from Wikipedia, sorted by walking time. You can hide places you don\'t recommend, star your favourites, add your own tips and add places we missed.'],
          ['How automatic is the stay story?', 'Completely: choose a guest profile and the site writes their arrival, days and departure from the places around you, for 1 to 4 nights, in any season. You can add a tip, recommend rooms or leave things out.'],
          ['Can I use my own domain?', 'Yes. Download the site and host it at your domain, or forward your domain to your link here.'],
          ['What does it cost?', 'Nothing while ' + UI.config.name + ' is in beta.'],
          ['Who owns the photos and texts?', 'You do. You can delete them, or the whole site, at any time. The Privacy & Terms page has the details.'],
          ['Does it work on phones?', 'Every hotel site is designed for phones first. The editor works on a computer or a tablet, and in a pinch on a phone.']]
  };

  var DEMO = {
    foodie: ['Foodie', 'Your table is never more than a few minutes away.', [['08:30', 'Breakfast at the hotel', 'A buffet downstairs, included.'], ['10:00', 'Wander the Central Market', 'Five pavilions in old Zeppelin hangars, 10 min walk.'], ['13:00', 'Lunch at a café nearby', 'Picked from the cafés around the hotel.'], ['19:30', 'Dinner downstairs at Dilettante', 'Handmade pasta, no need to go far.']]],
    family: ['Family with Kids', 'Short walks, big adventures, room for everyone.', [['07:30', 'Breakfast at the hotel', 'Cots on request; the Family Room sleeps four.'], ['09:00', 'Fresh air in Bastejkalns Park', 'Bridges, ducks and the city canal, 7 min walk.'], ['11:00', 'A museum visit', 'Several museums within 10 minutes.'], ['19:00', 'Pizza at Dilettante', 'Downstairs, so little legs can rest.']]],
    nightowl: ['Night Owl', 'The bars are close, and so is your bed.', [['11:00', 'A late breakfast', 'Coffee a couple of minutes away.'], ['18:30', 'An aperitif on Līvu Square', '4 min walk.'], ['20:00', 'Dinner in the old town', 'A short stroll.'], ['22:00', 'Drinks in an old-town bar', 'And back to bed in minutes.']]],
    artnouveau: ['Art Nouveau Admirer', 'Wake up among the finest facades in Europe.', [['08:30', 'Breakfast at the hotel', 'Then ask the desk for the nicest route.'], ['10:00', 'The Cat House and its rooftop cats', '3 min walk.'], ['14:30', 'Alberta iela', 'A street of Eisenstein facades, about 20 min walk.'], ['16:30', 'Coffee and cake nearby', 'Warm up before dinner.']]]
  };

  function heroArt() {
    var base = UI.themeBase();
    return '<div class="lp-art" aria-hidden="true">' +
      '<div class="lp-site"><div class="bar"><i></i><i></i><i></i><span>…/s/hotel-kristofs</span></div>' +
      '<div class="shot" style="background-image:url(&quot;' + base + 'k-blackheads.jpg&quot;)"><div class="ttl"><small>★★★ BOUTIQUE HOTEL · OLD RIGA</small><b>Hotel Kristofs</b><em>Sleep in an 18th-century mansion.</em></div></div>' +
      '<div class="pers"><span>Everyone</span><span class="on">Art Nouveau Admirer</span><span>Foodie</span><span>Romantic Couple</span><span>Family</span></div></div>' +
      '<div class="lp-float lp-mapc"><svg viewBox="0 0 200 150"><rect width="200" height="150" rx="10" fill="var(--c-surface-2)"/>' +
      '<g fill="var(--c-brand-soft)" stroke="var(--c-line)">' + [[30, 40, 26, 18], [70, 28, 22, 26], [110, 46, 30, 16], [40, 86, 24, 22], [130, 90, 26, 24], [84, 100, 20, 18], [150, 30, 22, 20]].map(function (q) {
        return '<path d="M' + q[0] + ' ' + q[1] + 'l' + q[2] + ' -8l' + q[3] + ' 8l-' + q[2] + ' 8z"/><path d="M' + q[0] + ' ' + q[1] + 'v' + (q[3] * .7) + 'l' + q[2] + ' 8v-' + (q[3] * .7) + 'z" fill="var(--c-line)"/>';
      }).join('') + '</g><ellipse cx="100" cy="76" rx="38" ry="22" fill="none" stroke="var(--c-accent)" stroke-dasharray="3 3"/><ellipse cx="100" cy="76" rx="74" ry="44" fill="none" stroke="var(--c-accent)" stroke-dasharray="3 3" opacity=".7"/>' +
      '<path d="M100 76 L60 52 L138 56 L150 100" fill="none" stroke="var(--c-brand)" stroke-width="2.5" stroke-linecap="round"/>' +
      [[60, 52, '#7a4f8f'], [138, 56, '#8a5a3c'], [150, 100, '#c0603a'], [70, 104, '#3f7f4f'], [124, 34, '#b4832c']].map(function (q) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="5" fill="' + q[2] + '" stroke="#fff" stroke-width="1.5"/>'; }).join('') +
      '<path d="M94 82v-12a6 6 0 0 1 12 0v12z" fill="var(--c-brand)" stroke="var(--c-accent)" stroke-width="1.5"/></svg></div>' +
      '<div class="lp-float lp-stay"><h4>' + UI.icon('sparkle') + 'Your stay, hour by hour</h4>' +
      '<div><time>08:30</time><b>Breakfast at the hotel</b><small>Included, downstairs</small></div>' +
      '<div><time>10:00</time><b>The Cat House</b><small>3 min walk</small></div>' +
      '<div><time>14:30</time><b>Alberta iela facades</b><small>About 20 min walk</small></div></div></div>';
  }

  function plan(key) {
    var d = DEMO[key];
    return '<div class="ui-card orn lp-plan"><div class="eyebrow">Example: Hotel Kristofs, Riga</div><h3>' + UI.esc(d[0]) + '</h3><p class="muted" style="margin:0">' + UI.esc(d[1]) + '</p><ol>' +
      d[2].map(function (s, i) { return '<li style="animation-delay:' + (i * 60) + 'ms"><time>' + s[0] + '</time><b>' + UI.esc(s[1]) + '</b><span>' + UI.esc(s[2]) + '</span></li>'; }).join('') + '</ol></div>';
  }

  UI.page('landing', { title: 'Hotel websites that sell the stay' }, function (view, ctx) {
    var me = ctx.me, C = COPY, esc = UI.esc;
    var showcase = (window.APP_API || '') + '/s/hotel-kristofs';
    var primary = me ? '<a class="ui-btn primary lg" href="#sites" data-go="sites">Open your sites ' + UI.icon('arrow') + '</a>'
      : '<a class="ui-btn primary lg" href="#auth/signup" data-go="auth/signup">' + esc(C.cta) + ' ' + UI.icon('arrow') + '</a>';
    view.addEventListener('click', function (e) {
      var b = e.target.closest('[data-demo]');
      if (!b) return;
      Array.prototype.forEach.call(view.querySelectorAll('[data-demo]'), function (x) { x.classList.toggle('on', x === b); });
      view.querySelector('[data-plan]').innerHTML = plan(b.getAttribute('data-demo'));
    });
    view.innerHTML =
      '<section class="lp-hero"><div class="ui-wrap"><div>' +
        '<div class="eyebrow">' + esc(C.eyebrow) + '</div><h1>' + C.title + '</h1><p class="lp-lead">' + esc(C.lead) + '</p>' +
        '<div class="lp-cta">' + primary + '<a class="ui-btn lg" href="' + esc(showcase) + '" target="_blank" rel="noopener">' + UI.icon('external') + 'See Hotel Kristofs</a></div>' +
        '<div class="lp-proof">' + C.proof.map(function (p) { return '<span>' + UI.icon('check') + esc(p) + '</span>'; }).join('') + '</div>' +
      '</div>' + heroArt() + '</div></section>' +
      '<section class="lp-section" id="how"><div class="ui-wrap"><div class="lp-head"><div class="eyebrow">How it works</div><h2>From an address to a website in an afternoon</h2><p>The slow part of a hotel website is explaining the neighbourhood. We do that part for you.</p></div>' +
        '<div class="lp-steps">' + C.steps.map(function (s, i) { return '<div class="ui-card orn lp-step"><span class="num">' + (i + 1) + '</span><h3>' + esc(s[0]) + '</h3><p class="muted" style="margin:0">' + esc(s[1]) + '</p></div>'; }).join('') + '</div></div></section>' +
      '<section class="lp-section"><div class="ui-wrap"><div class="lp-head"><div class="eyebrow">What your guests see</div><h2>Every guest gets their own stay</h2><p>Visitors tell your site who they are. It answers with the rooms, places and an hour-by-hour plan that fit them. Try it:</p></div>' +
        '<div class="lp-demo"><div class="lp-who">' + Object.keys(DEMO).map(function (k, i) {
          var p = NS.persona(k);
          return '<button data-demo="' + k + '" class="' + (i === 0 ? 'on' : '') + '"><span class="ic">' + NS.icon(p.icon) + '</span><span><b>' + esc(p.name) + '</b><small>' + esc(p.line) + '</small></span></button>';
        }).join('') + '<p class="small muted">Four of 30 profiles. Each site shows the ones its neighbourhood suits best.</p></div><div data-plan>' + plan('foodie') + '</div></div></div></section>' +
      '<section class="lp-section"><div class="ui-wrap"><div class="lp-head"><div class="eyebrow">Everything included</div><h2>Built to sell your neighbourhood</h2></div>' +
        '<div class="lp-feats">' + C.features.map(function (f) { return '<div class="ui-card lp-feat">' + UI.icon(f[0]) + '<h3>' + esc(f[1]) + '</h3><p>' + esc(f[2]) + '</p></div>'; }).join('') + '</div></div></section>' +
      '<section class="lp-section"><div class="ui-wrap"><div class="lp-head"><div class="eyebrow">Tired of website builders?</div><h2>Not another blank page</h2></div><div class="lp-vs">' +
        '<div class="ui-card"><h3>' + UI.icon('x') + 'A general website builder</h3><ul><li>A blank page and a thousand buttons</li><li>You write every word about the area</li><li>Plugins for maps, galleries and tours</li><li>Every guest sees the same page</li></ul></div>' +
        '<div class="ui-card orn"><h3>' + UI.icon('check') + esc(UI.config.name) + '</h3><ul><li>Starts with your neighbourhood already mapped and written</li><li>3D map, 360° viewer, galleries and video built in</li><li>Each guest sees their own stay</li><li>Change a text and see it at once; publish in one click</li></ul></div></div></div></section>' +
      '<section class="lp-section"><div class="ui-wrap"><div class="lp-head"><h2>Questions</h2></div><div class="lp-faq">' +
        C.faq.map(function (q) { return '<details><summary>' + esc(q[0]) + '</summary><p>' + esc(q[1]) + '</p></details>'; }).join('') + '</div></div></section>' +
      '<section class="lp-section"><div class="ui-wrap"><div class="lp-band"><div><h2>Your neighbourhood is your best feature.</h2><p>Show it to every guest, the way they travel.</p></div>' +
        (me ? '<a class="ui-btn gold lg" href="#new" data-go="new">' + UI.icon('plus') + 'New site</a>' : '<a class="ui-btn gold lg" href="#auth/signup" data-go="auth/signup">' + esc(C.cta) + '</a>') +
      '</div></div></section>';
  });
})();

/* ===== new.html ===== */
(function () {
  var esc = UI.esc, NS = window.NSSite;
  var STEPS = ['Find your hotel', 'Scan the area', 'Your guests', 'Look & facts'];
  var KINDS = ['Boutique hotel', 'Hotel', 'Guesthouse', 'Bed & breakfast', 'Aparthotel', 'Hostel', 'Inn', 'Villa'];

  UI.page('new', { title: 'New site', auth: 'user' }, function (view) {
    var st = { step: 0, name: '', query: '', results: [], pick: null, scan: null, personas: [], palette: 'riga', fonts: 'belle', kind: 'Boutique hotel', stars: 0,
      features: ['breakfast', 'wifi'], checkin: '15:00', checkout: '11:00', phone: '', email: '', tagline: '', radius: 1300 };
    var map = null;

    function stepsBar() {
      return '<div class="nw-steps">' + STEPS.map(function (s, i) { return '<span class="' + (i === st.step ? 'on' : i < st.step ? 'done' : '') + '">' + s + '</span>'; }).join('') + '</div>';
    }
    function draw() {
      if (map) { map.destroy(); map = null; }
      var body = [step0, step1, step2, step3][st.step]();
      view.innerHTML = '<div class="ui-wrap"><div class="nw"><div class="ui-page-head"><div><div class="eyebrow">New hotel site</div><h1>' + esc(STEPS[st.step]) + '</h1></div>' +
        '<a class="ui-btn ghost" href="#sites" data-go="sites">' + UI.icon('x') + 'Cancel</a></div>' + stepsBar() + '<div class="ui-card orn nw-card">' + body + '</div></div></div>';
      after();
    }
    function after() {
      if (st.step === 0 && st.pick) {
        var el = view.querySelector('[data-map]');
        if (el) map = NS.Map(el, { hotel: { lat: st.pick.lat, lng: st.pick.lng, name: st.name }, palette: NS.PALETTES.riga, name: st.name || 'Your hotel', noMap: !!window.NS_NO_MAP });
        if (map) map.setPlaces([]);
      }
      if (st.step === 1 && !st.scan) runScan();
      var first = view.querySelector('[data-autofocus]');
      if (first) first.focus();
    }

    function step0() {
      return '<h2>Where is your hotel?</h2><p class="muted">We use the address to find everything around it: cafés, sights, museums, parks, stations.</p>' +
        '<form class="ui-stack" data-find><div class="nw-grid2"><label class="ui-field"><span>Hotel name</span><input type="text" name="name" maxlength="90" required value="' + esc(st.name) + '" placeholder="Hotel Riga Rose" data-autofocus></label>' +
        '<label class="ui-field"><span>Address</span><input type="search" name="q" value="' + esc(st.query) + '" placeholder="Teātra iela 6, Rīga" required></label></div>' +
        '<button class="ui-btn" type="submit">' + UI.icon('search') + 'Find the address</button></form>' +
        (st.results.length ? '<div class="nw-results">' + st.results.map(function (r, i) {
          return '<button class="nw-res' + (st.pick === r ? ' on' : '') + '" data-res="' + i + '">' + UI.icon('pin') + '<span>' + esc(r.label) + '</span></button>';
        }).join('') + '</div>' : (st.searched ? '<p class="ui-note" style="margin-top:12px">No address found. Try the street and city, e.g. "Teātra iela 6, Rīga".</p>' : '')) +
        (st.pick ? '<div class="nw-map" data-map></div><p class="muted small">Is the pin on your hotel? If not, pick another result or refine the address.</p>' : '') +
        '<div class="nw-nav"><span></span><button class="ui-btn primary" data-next' + (st.pick ? '' : ' disabled') + '>Scan the neighbourhood ' + UI.icon('arrow') + '</button></div>';
    }
    function step1() {
      if (!st.scan) return '<div class="nw-scan"><div class="nw-orb">' + UI.icon('compass') + '</div><h2>Exploring around ' + esc(st.name) + '</h2>' +
        '<p class="nw-log" data-log>Starting…</p><p class="muted small">Places from OpenStreetMap, landmarks and photos from Wikipedia. Usually 10 to 40 seconds.</p></div>';
      var data = { hotel: { lat: st.pick.lat, lng: st.pick.lng }, places: st.scan.places };
      var places = NS.places(data);
      var counts = NS.CAT_ORDER.map(function (c) { return { c: c, n: places.filter(function (p) { return p.cat === c; }).length }; }).filter(function (x) { return x.n; });
      var lms = places.filter(function (p) { return p.wiki && p.wiki.thumb; }).slice(0, 10);
      return '<div class="nw-scan"><h2>' + places.length + ' places within a short walk</h2>' +
        '<p class="muted">Everything is sorted by walking time from your door. You can hide, pin or add places later.</p>' +
        '<div class="nw-cats">' + counts.map(function (x, i) { return '<span class="nw-cat" style="animation-delay:' + (i * 40) + 'ms"><i style="background:' + NS.CATS[x.c].color + '"></i><b>' + (x.n >= 30 ? '30+' : x.n) + '</b>' + esc(NS.CATS[x.c].plural) + '</span>'; }).join('') + '</div>' +
        (lms.length ? '<div class="nw-lms">' + lms.map(function (p) { return '<div class="nw-lm"><img src="' + esc(p.wiki.thumb) + '" alt=""><span><b>' + esc(p.name) + '</b><br>' + p.walk + ' min walk</span></div>'; }).join('') + '</div>' : '') +
        (places.length < 25 ? '<p class="ui-note">Not much found nearby. Try a wider scan, or add your favourite places in the editor.</p>' : '') +
        '</div><div class="nw-nav"><button class="ui-btn ghost" data-back>' + UI.icon('back') + 'Back</button><span class="ui-row">' +
        (st.radius < 2000 ? '<button class="ui-btn" data-wider>' + UI.icon('refresh') + 'Scan wider (2 km)</button>' : '') +
        '<button class="ui-btn primary" data-next>Choose your guests ' + UI.icon('arrow') + '</button></span></div>';
    }
    function step2() {
      var data = { hotel: { lat: st.pick.lat, lng: st.pick.lng, features: st.features }, places: st.scan.places };
      var ranked = NS.rankPersonas(data);
      if (!st.personas.length) st.personas = ranked.slice(0, 8).map(function (x) { return x.p.id; });
      return '<h2>Who should your site speak to?</h2><p class="muted">Guests pick one of these on your site, and the page rearranges itself for them: rooms, places and a stay planned hour by hour. ' +
        'We ranked all 30 by how well your neighbourhood suits them and picked the best eight. Change it any time.</p>' +
        '<p class="small"><b data-count>' + st.personas.length + '</b> chosen · <button class="ui-btn sm ghost" data-top="8">Best 8</button><button class="ui-btn sm ghost" data-top="12">Best 12</button><button class="ui-btn sm ghost" data-top="0">None</button></p>' +
        '<div class="nw-pers">' + ranked.map(function (x) {
          var on = st.personas.indexOf(x.p.id) >= 0;
          return '<label class="nw-per' + (on ? ' on' : '') + '"><input type="checkbox" data-per="' + x.p.id + '"' + (on ? ' checked' : '') + '><span class="ic">' + NS.icon(x.p.icon) + '</span>' +
            '<span style="min-width:0;flex:1"><b>' + esc(x.p.name) + '</b><span class="nw-fit"><i style="--w:' + (x.fit.score * 10) + '%"></i>' + x.fit.score.toFixed(1) + '</span></span></label>';
        }).join('') + '</div>' +
        '<div class="nw-nav"><button class="ui-btn ghost" data-back>' + UI.icon('back') + 'Back</button><button class="ui-btn primary" data-next>Pick a look ' + UI.icon('arrow') + '</button></div>';
    }
    function step3() {
      return '<h2>Make it yours</h2><p class="muted">Six Art Nouveau looks, all made for phones first. You can change everything later.</p>' +
        '<div class="nw-pals">' + Object.keys(NS.PALETTES).map(function (k) {
          var p = NS.PALETTES[k], c = p.c;
          return '<label class="nw-pal"><input type="radio" name="palette" value="' + k + '"' + (st.palette === k ? ' checked' : '') + '><div class="pv"><span style="background:' + c.bg + ';color:' + c.ink + '">Aa</span>' +
            '<span style="background:linear-gradient(' + c.brand + ' 0 50%,' + c.accent + ' 50% 75%,' + c.deep + ' 75%)"></span></div><div class="meta"><b>' + esc(p.name) + '</b>' + esc(p.note) + '</div></label>';
        }).join('') + '</div>' +
        '<div class="nw-grid2" style="margin-top:18px"><label class="ui-field"><span>Typography</span><select name="fonts">' + Object.keys(NS.FONTS).map(function (k) {
          return '<option value="' + k + '"' + (st.fonts === k ? ' selected' : '') + '>' + esc(NS.FONTS[k].name) + ' (' + esc(NS.FONTS[k].display) + ')</option>'; }).join('') + '</select></label>' +
        '<label class="ui-field"><span>Kind of place</span><select name="kind">' + KINDS.map(function (k) { return '<option' + (st.kind === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></label>' +
        '<label class="ui-field"><span>Stars <em>(optional)</em></span><select name="stars">' + [0, 1, 2, 3, 4, 5].map(function (n) { return '<option value="' + n + '"' + (+st.stars === n ? ' selected' : '') + '>' + (n ? n + ' stars' : 'No stars') + '</option>'; }).join('') + '</select></label>' +
        '<label class="ui-field"><span>One line about the hotel <em>(optional)</em></span><input type="text" name="tagline" maxlength="140" value="' + esc(st.tagline) + '" placeholder="A quiet garden hotel near the old town"></label>' +
        '<label class="ui-field"><span>Check-in from</span><input type="time" name="checkin" value="' + esc(st.checkin) + '"></label>' +
        '<label class="ui-field"><span>Check-out until</span><input type="time" name="checkout" value="' + esc(st.checkout) + '"></label>' +
        '<label class="ui-field"><span>Phone <em>(optional)</em></span><input type="tel" name="phone" value="' + esc(st.phone) + '"></label>' +
        '<label class="ui-field"><span>Email <em>(optional)</em></span><input type="email" name="email" value="' + esc(st.email) + '"></label></div>' +
        '<h3 style="margin-top:22px">What do you offer?</h3><div class="nw-feats">' + Object.keys(NS.FEATURES).map(function (k) {
          return '<label class="ui-check"><input type="checkbox" data-feat="' + k + '"' + (st.features.indexOf(k) >= 0 ? ' checked' : '') + '>' + esc(NS.FEATURES[k].label) + '</label>';
        }).join('') + '</div>' +
        '<div class="nw-nav"><button class="ui-btn ghost" data-back>' + UI.icon('back') + 'Back</button><button class="ui-btn primary lg" data-create>' + UI.icon('sparkle') + 'Create my site</button></div>';
    }

    function runScan() {
      var log = function (m) { var el = view.querySelector('[data-log]'); if (el) el.textContent = m; };
      var job = window.NS_TEST_SCAN ? Promise.resolve(window.NS_TEST_SCAN) : NSScan.scan(st.pick.lat, st.pick.lng, { radius: st.radius, onProgress: log });
      job.then(function (r) { st.scan = r; if (st.step === 1) draw(); }, function (err) {
        st.scan = { places: [], credits: [] };
        UI.toast('The scan did not finish (' + err.message + '). You can add places in the editor.', 'error');
        if (st.step === 1) draw();
      });
    }
    function readStep3() {
      var f = view.querySelector('.nw-card');
      ['fonts', 'kind', 'stars', 'tagline', 'checkin', 'checkout', 'phone', 'email'].forEach(function (k) { var el = f.querySelector('[name=' + k + ']'); if (el) st[k] = el.value; });
      var pal = f.querySelector('[name=palette]:checked'); if (pal) st.palette = pal.value;
      st.features = Array.prototype.map.call(f.querySelectorAll('[data-feat]:checked'), function (x) { return x.getAttribute('data-feat'); });
    }

    view.addEventListener('submit', function (e) {
      if (!e.target.matches('[data-find]')) return;
      e.preventDefault();
      var v = UI.formData(e.target);
      st.name = (v.name || '').trim(); st.query = (v.q || '').trim();
      if (st.name.length < 2) { UI.toast('Please give the hotel a name first.', 'error'); return; }
      UI.busy(e.target.querySelector('[type=submit]'), NSScan.geocode(st.query + (st.query.indexOf(',') < 0 ? '' : ''))).then(function (rows) {
        st.results = rows; st.searched = true; st.pick = rows[0] || null; draw();
      }, function () { st.results = []; st.searched = true; draw(); });
    });
    view.addEventListener('click', function (e) {
      var r = e.target.closest('[data-res]');
      if (r) { st.pick = st.results[+r.getAttribute('data-res')]; draw(); return; }
      if (e.target.closest('[data-next]')) {
        if (st.step === 0) { var nm = view.querySelector('[name=name]'); if (nm) st.name = nm.value.trim() || st.name; if (st.name.length < 2) { UI.toast('Please give the hotel a name first.', 'error'); return; } }
        st.step++; draw(); return;
      }
      if (e.target.closest('[data-back]')) { if (st.step === 3) readStep3(); st.step--; draw(); return; }
      if (e.target.closest('[data-wider]')) { st.radius = 2000; st.scan = null; draw(); return; }
      var top = e.target.closest('[data-top]');
      if (top) {
        var n = +top.getAttribute('data-top');
        st.personas = NS.rankPersonas({ hotel: { lat: st.pick.lat, lng: st.pick.lng, features: st.features }, places: st.scan.places }).slice(0, n).map(function (x) { return x.p.id; });
        if (!n) st.personas = [];
        draw(); return;
      }
      var cr = e.target.closest('[data-create]');
      if (cr) {
        readStep3();
        var p = st.pick, data = NSApp.newSiteData({ name: st.name, kind: st.kind, stars: st.stars, tagline: st.tagline, city: p.city, country: p.country, area: p.area || p.city,
          address: st.query || p.label, lat: p.lat, lng: p.lng, phone: st.phone, email: st.email, checkin: st.checkin, checkout: st.checkout, features: st.features,
          palette: st.palette, fonts: st.fonts, personas: st.personas, places: st.scan.places, credits: st.scan.credits,
          scan: { at: st.scan.scanned || new Date().toISOString(), radius: st.radius, sources: st.scan.sources || [] } });
        UI.busy(cr, UI.api('create_site', data)).then(function (res) { UI.toast('Your site is ready. Have a look!', 'ok'); UI.go('edit', res.id); });
      }
    });
    view.addEventListener('change', function (e) {
      var per = e.target.closest('[data-per]');
      if (per) {
        var id = per.getAttribute('data-per'), i = st.personas.indexOf(id);
        if (per.checked && i < 0) st.personas.push(id); if (!per.checked && i >= 0) st.personas.splice(i, 1);
        per.closest('.nw-per').classList.toggle('on', per.checked);
        var c = view.querySelector('[data-count]'); if (c) c.textContent = st.personas.length;
      }
    });
    draw();
    return { ready: Promise.resolve(), destroy: function () { if (map) map.destroy(); } };
  });
})();

/* ===== profile.html ===== */
(function () {
  var esc = UI.esc;
  UI.page('profile', { title: 'Your profile', auth: 'user' }, function (view, ctx) {
    var me = ctx.me;
    view.innerHTML = '<div class="ui-wrap ui-narrow"><div class="pf-head"><span class="ui-avatar">' + esc(UI.initials(me.name)) + '</span>' +
      '<div><h1>' + esc(me.name) + '</h1><div class="muted">' + esc(me.email) + (me.joined ? ' · member since ' + esc(UI.fmtDate(me.joined, { month: 'long', year: 'numeric' })) : '') + '</div></div></div>' +
      '<div class="pf-grid"><form class="ui-card ui-stack" data-name><h3>Your name</h3><label class="ui-field"><span>Shown to other people</span>' +
      '<input type="text" name="name" value="' + esc(me.name) + '" maxlength="60" required></label><button class="ui-btn primary" type="submit">Save</button></form>' +
      '<div class="ui-card ui-stack"><h3>Appearance</h3><p class="muted small">Follow your device, or pick one.</p><div data-theme-box></div>' +
      '<h3 style="margin-top:22px">Password</h3><p class="muted small">We\'ll email you a link to choose a new one.</p>' +
      '<button class="ui-btn" data-reset>' + UI.icon('mail') + 'Email me a reset link</button></div></div>' +
      '<div class="ui-card" style="margin-top:16px"><div class="pf-links">' +
      (me.is_admin ? '<a href="#admin" data-go="admin">' + UI.icon('shield') + 'Admin</a>' : '') +
      '<button data-feedback>' + UI.icon('chat') + 'Submit feedback</button>' +
      '<button data-lk-open="overview">' + UI.icon('lock') + 'Privacy &amp; Terms, and your data</button>' +
      '<button data-signout-here>' + UI.icon('logout') + 'Sign out</button></div></div></div>';
    function themeBox() {
      var t = UI.theme();
      view.querySelector('[data-theme-box]').innerHTML = '<div class="ui-seg">' + [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(function (o) {
        return '<button type="button" data-theme-pick="' + o[0] + '" class="' + (t === o[0] ? 'on' : '') + '">' + o[1] + '</button>';
      }).join('') + '</div>';
    }
    themeBox();
    view.addEventListener('click', function (e) {
      var t = e.target.closest('[data-theme-pick]');
      if (t) { UI.setTheme(t.getAttribute('data-theme-pick')); themeBox(); UI.renderChrome(); return; }
      if (e.target.closest('[data-reset]')) {
        UI.busy(e.target.closest('[data-reset]'), UI.auth('reset', { email: me.email })).then(function (r) { UI.toast(r.message, 'ok'); });
      }
      if (e.target.closest('[data-signout-here]')) UI.auth('logout');
    });
    view.querySelector('[data-name]').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = UI.formData(e.target);
      UI.busy(e.target.querySelector('[type=submit]'), UI.api('update_profile', v.name)).then(function (r) {
        UI.setMe(r.me); ctx.me = r.me; UI.toast('Saved', 'ok');
        view.querySelector('.pf-head h1').textContent = r.me.name;
      });
    });
  });
})();

/* ===== sites.html ===== */
(function () {
  var esc = UI.esc;
  var LILY = '<svg viewBox="0 0 120 160" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M60 158c0-40-3-70-22-96M60 158c2-30 10-52 30-70"/><path d="M38 60C20 54 12 34 18 10c12 4 20 12 22 24 2-18 8-30 20-38 12 8 18 20 20 38 2-12 10-20 22-24 6 24-2 44-20 50-14 5-30 5-44 0z"/></svg>';

  function card(s) {
    var badge = s.status === 'published' ? '<span class="ui-badge good">' + UI.icon('globe') + 'Live</span>' : '<span class="ui-badge">Draft</span>';
    return '<article class="ui-card st-card" data-id="' + esc(s.id) + '">' +
      '<div class="st-cover' + (s.cover ? '' : ' empty') + '" style="' + NSApp.coverStyle(s.cover) + '">' + (s.cover ? '' : LILY) + badge + NSApp.swatches(s.palette) + '</div>' +
      '<div class="st-body"><h3>' + esc(s.name) + (s.demo ? ' <span class="ui-badge">Demo</span>' : '') + (s.is_showcase ? ' <span class="ui-badge brand">Showcase</span>' : '') + '</h3>' +
      '<div class="st-meta">' + (s.city ? '<span>' + UI.icon('pin') + esc(s.city) + '</span>' : '') + '<span>' + UI.icon('clock') + 'Edited ' + esc(UI.ago(s.updated)) + '</span>' +
      (s.status === 'published' ? '<span>' + UI.icon('sparkle') + UI.plural(s.views, 'visit') + '</span>' : '') + '</div>' +
      (s.owner && !s.mine ? '<div class="st-meta"><span>' + UI.icon('user') + 'Owner: ' + esc(s.owner) + '</span></div>' : '') +
      (!s.owner ? '<div class="st-meta"><span>' + UI.icon('user') + (s.pending_owner ? 'Waiting for ' + esc(s.pending_owner) + ' to sign up' : 'No owner yet (admins manage it)') + '</span></div>' : '') +
      (s.url ? '<a class="st-link" href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.url.replace(/^https?:\/\//, '')) + '</a>' : '') +
      (s.unpublished_changes ? '<span class="ui-badge warn">Changes not published yet</span>' : '') +
      '<div class="st-actions"><a class="ui-btn primary sm" href="#edit/' + esc(s.id) + '" data-go="edit/' + esc(s.id) + '">' + UI.icon('edit') + 'Edit</a>' +
      (s.url ? '<a class="ui-btn sm" href="' + esc(s.url) + '" target="_blank" rel="noopener">' + UI.icon('external') + 'View</a><button class="ui-btn sm ghost" data-copy="' + esc(s.url) + '">' + UI.icon('copy') + 'Copy link</button>' : '') +
      '</div></div></article>';
  }

  UI.page('sites', { title: 'Your sites', nav: 'Sites', icon: 'home', auth: 'user', order: 10 }, function (view, ctx) {
    view.innerHTML = '<div class="ui-wrap"><div class="ui-skel" style="height:320px"></div></div>';
    view.addEventListener('click', function (e) {
      var c = e.target.closest('[data-copy]');
      if (c) { navigator.clipboard && navigator.clipboard.writeText(c.getAttribute('data-copy')); UI.toast('Link copied', 'ok'); }
      if (e.target.closest('[data-new]')) UI.go('new');
    });
    return UI.api('my_sites').then(function (d) {
      var first = ctx.me.name.split(' ')[0];
      view.innerHTML = '<div class="ui-wrap"><div class="st-hello"><div><div class="eyebrow">Your hotel websites</div><h1>Hello, ' + esc(first) + '</h1>' +
        '<p class="muted" style="margin:6px 0 0">' + (d.sites.length ? 'Pick a site to edit, or start a new one.' : 'Let\'s make your first hotel website. It takes about two minutes to start.') + '</p></div>' +
        '<button class="ui-btn primary" data-new>' + UI.icon('plus') + 'New site</button></div>' +
        '<div class="st-grid">' + d.sites.map(card).join('') +
        (d.sites.length < d.max ? '<button class="ui-card st-new" data-new><div><div class="big">' + UI.icon('plus') + '</div><h3>Create a hotel site</h3>' +
          '<p class="muted small" style="margin:0">Type the address. We find what is nearby, write the texts and pick your guests.</p></div></button>' : '') + '</div>' +
        (d.managed.length ? '<div class="st-sub">' + UI.icon('shield') + '<h2>Sites you manage as admin</h2></div><div class="st-grid">' + d.managed.map(card).join('') + '</div>' : '') +
        '<div class="ui-card orn st-tip">' + UI.icon('bulb') + '<div><b>Booking stays with Booking.com and friends.</b><p class="muted small" style="margin:4px 0 0">Your site sells the stay; the booking buttons send guests to the sites you already use, so your rooms and prices stay in one place.</p></div></div>' +
        '</div>';
    });
  });
})();
