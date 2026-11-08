/* Smoke test (tools/ui_test.py --only smoke.js): every page address opens without a JS/Python error and isn't empty:
   signed out, as a member (with a site made through the same server call the wizard uses), and as the admin.
   The admin is ADMIN_EMAILS in server_code/Accounts.py, in the local test database only. Resolves to {ok, log}. */
(async function () {
  const log = [], bad = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function until(fn, what, ms) {
    const end = Date.now() + (ms || 20000);
    while (Date.now() < end) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(150); }
    throw new Error('timed out waiting for: ' + what);
  }
  const $ = (s) => document.querySelector(s), $$ = (s) => Array.from(document.querySelectorAll(s));
  const errors = [];
  window.addEventListener('error', (e) => errors.push(String(e.message || e)));
  function type(input, value) {
    input.focus(); input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function visibleErrors() {
    return $$('.anvil-alert-danger, .anvil-role-error, .error-popup, #error-indicator').filter((e) => e.offsetParent !== null || e.getBoundingClientRect().width)
      .map((e) => e.textContent.trim().slice(0, 120)).filter(Boolean);
  }
  async function check(hash, ready, minText) {
    if (location.hash !== hash) window.UI_READY = false;
    location.hash = hash;
    await until(() => window.UI_READY && location.hash.indexOf(hash.split('/').slice(0, 2).join('/')) === 0 && (!ready || ready()), hash, 40000);
    await sleep(900);
    const root = $('.ui-main') || $('.ed-host') || document.body;
    const text = (root.innerText || '').trim().length;
    const errs = visibleErrors().concat(errors.splice(0));
    const ok = text >= (minText || 60) && !errs.length;
    if (!ok) bad.push(hash + (text < (minText || 60) ? ' looks empty (' + text + ' chars)' : '') + (errs.length ? ' errors: ' + errs.join(' / ') : ''));
    log.push((ok ? 'ok   ' : 'BAD  ') + hash + ' (' + text + ' chars)');
  }
  async function signOut() {
    if (!window.nsTestCall) return;
    await window.nsTestCall('__logout__', '[]');
    window.UI_READY = false;
    location.hash = '#landing';
    await until(() => window.UI_READY && location.hash === '#landing', 'signed out', 20000);
  }
  async function signUpOrIn(email, pw, name) {
    location.hash = '#auth/signup';
    await until(() => window.UI_READY && $$('.au-card input').length >= 3, 'sign-up form');
    const inputs = $$('.au-card input[type=text], .au-card input[type=email], .au-card input[type=password]');
    type(inputs[0], name); type(inputs[1], email); type(inputs[2], pw);
    const tick = $('.au-card input[type=checkbox]'); if (tick && !tick.checked) tick.click();
    $$('.anvil-role-btn-block button').find((b) => /Create account/.test(b.textContent)).click();
    try { await until(() => location.hash === '#sites' && window.UI_READY, 'signed up', 20000); return; } catch (e) { /* exists: sign in */ }
    location.hash = '#auth';
    await sleep(1500);
    const ins = $$('.au-card input[type=email], .au-card input[type=password]');
    type(ins[0], email); type(ins[1], pw);
    $$('.anvil-role-btn-block button').find((b) => /Sign in/.test(b.textContent)).click();
    await until(() => location.hash === '#sites' && window.UI_READY, 'signed in', 30000);
  }
  try {
    for (const h of ['#landing', '#explore', '#auth', '#auth/signup']) await check(h);
    // member
    await signUpOrIn('smoke' + Date.now() + '@example.com', 'Hb-' + Math.random().toString(36).slice(2) + '-Kq7', 'Smoke Tester');
    const made = JSON.parse(await window.nsTestCall('create_site', JSON.stringify([{
      hotel: { name: 'Smoke Test Hotel', city: 'Riga', country: 'Latvia', lat: 56.9496, lng: 24.1052, address: 'Teātra iela 6, Rīga', features: ['wifi'] },
      theme: { palette: 'riga', fonts: 'belle' }, personas: { enabled: ['foodie', 'family'], featured: 'foodie' }, places: [],
      rooms: [{ id: 'r1', name: 'Double Room', photos: [] }] }])));
    if (!made || !made.id) throw new Error('create_site failed: ' + JSON.stringify(made));
    log.push('made site ' + made.id);
    window.NS_NO_MAP = true;
    for (const h of ['#sites', '#new', '#profile', '#landing']) await check(h);
    const tabs = ['start', 'basics', 'look', 'texts', 'rooms', 'media', 'area', 'guests', 'booking', 'publish'];
    for (const t of tabs) await check('#edit/' + encodeURIComponent(made.id) + '/' + t, () => $('.ed-tab.on'), 60);
    await check('#edit/no-such-site', null, 20);
    await check('#sites');
    // admin
    await signOut();
    await signUpOrIn('arkulinskis@gmail.com', 'Nv-local-7qLp2-Xr9k', 'Admin Tester');
    for (const h of ['#admin', '#admin/sites', '#admin/feedback', '#admin/users', '#admin/demo', '#sites']) await check(h);
    log.push(bad.length ? 'PROBLEMS: ' + bad.join(' | ') : 'PASSED');
    return { ok: !bad.length, log: log };
  } catch (e) {
    log.push(String(e && e.message || e));
    return { ok: false, log: log };
  }
})();
