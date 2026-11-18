/* Feature test (tools/ui_test.py --only features.js), 2026-11: the three features of the languages / QR / questions update.
   1. Languages: the editor's Languages tab switches Latvian on, a translation typed there shows in the preview in Latvian.
   2. Questions: the published site (in Latvian, then German) takes a question through its "Ask us" form; the owner sees it
      in #questions with the menu badge, and marks it answered.
   3. QR card: the Publish tab's "Make a QR card" draws a card with a QR code and the Latvian line.
   Leaves window.FEAT = {id, slug} for the screenshot steps. Resolves to {ok, log}. */
(async function () {
  const log = [], bad = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function until(fn, what, ms) {
    const end = Date.now() + (ms || 20000);
    while (Date.now() < end) { try { const v = fn(); if (v) return v; } catch (e) {} await sleep(200); }
    throw new Error('timed out waiting for: ' + what);
  }
  const $ = (s, d) => (d || document).querySelector(s), $$ = (s, d) => Array.from((d || document).querySelectorAll(s));
  function type(input, value) {
    input.focus(); input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function button(text, root) { return $$('button', root).find((b) => b.offsetParent !== null && b.textContent.trim().indexOf(text) === 0); }
  function check(cond, what) { log.push((cond ? 'ok   ' : 'BAD  ') + what); if (!cond) bad.push(what); }
  async function go(hash, ready) {
    window.UI_READY = false; location.hash = hash;
    await until(() => window.UI_READY && (!ready || ready()), hash, 40000);
    await sleep(600);
  }
  async function signUp(email, pw, name) {
    if (window.nsTestCall) {   // a browser profile can still be signed in from an earlier run
      await window.nsTestCall('__logout__', '[]');
      window.UI_READY = false; location.hash = '#explore';   // a new address, so the router redraws signed out
      await until(() => window.UI_READY && location.hash === '#explore', 'signed out', 20000);
    }
    location.hash = '#auth/signup';
    await until(() => window.UI_READY && $$('.au-card input').length >= 3, 'sign-up form');
    const inputs = $$('.au-card input[type=text], .au-card input[type=email], .au-card input[type=password]');
    type(inputs[0], name); type(inputs[1], email); type(inputs[2], pw);
    const tick = $('.au-card input[type=checkbox]'); if (tick && !tick.checked) tick.click();
    $$('.anvil-role-btn-block button').find((b) => /Create account/.test(b.textContent)).click();
    await until(() => location.hash === '#sites' && window.UI_READY, 'signed up', 30000);
  }
  try {
    await signUp('feat' + Date.now() + '@example.com', 'Fq-' + Math.random().toString(36).slice(2) + '-Zt8', 'Feature Tester');
    window.NS_NO_MAP = true;
    const places = [['House of the Blackheads', 'sight', 56.9474, 24.1067], ['Rigensis', 'cafe', 56.9490, 24.1060], ['Cuba Cafe', 'bar', 56.9480, 24.1050],
      ['Lido', 'restaurant', 56.9485, 24.1040], ['National Opera', 'culture', 56.9510, 24.1130], ['Bastejkalns', 'park', 56.9520, 24.1100]]
      .map((p, i) => ({ id: 'p' + i, name: p[0], cat: p[1], lat: p[2], lng: p[3] }));
    const made = JSON.parse(await window.nsTestCall('create_site', JSON.stringify([{
      hotel: { name: 'Hotel Lācis', tagline: 'A quiet house in the old town', city: 'Riga', country: 'Latvia', area: 'Old Riga', lat: 56.9496, lng: 24.1052,
        address: 'Teātra iela 6, Rīga', features: ['wifi', 'breakfast', 'fireplace'], checkin: '14:00', checkout: '12:00', email: 'hello@example.com' },
      theme: { palette: 'riga', fonts: 'belle' }, personas: { enabled: ['foodie', 'family', 'romantic', 'business'], featured: 'romantic' }, places: places,
      rooms: [{ id: 'r1', name: 'Double Room', text: 'Quiet, facing the courtyard.', guests: '2', price: '€95', photos: [], tags: ['double', 'quiet'] }],
      faq: [{ q: 'Is there a lift?', a: 'Yes, to every floor.' }] }])));
    if (!made || !made.id) throw new Error('create_site failed: ' + JSON.stringify(made));
    const id = made.id;

    // 1. Languages tab
    await go('#edit/' + encodeURIComponent(id) + '/langs', () => $('.ed-tab.on') && $('[data-arr="langs"]'));
    check(/Languages/.test($('.ed-tab.on').textContent), 'the Languages tab opens');
    $('[data-arr="langs"][value="lv"]').closest('label').click();
    const field = await until(() => $('[data-tr="A quiet house in the old town"]'), 'translation field for the tagline');
    check(!!$('[data-tr="Quiet, facing the courtyard."]') && !!$('[data-tr="Is there a lift?"]'), 'room and FAQ texts are offered for translation');
    type(field, 'Klusa māja vecpilsētā');
    await sleep(300);
    $('[data-plang="lv"]').click();
    const pdoc = () => $('.ed-frame iframe').contentDocument;
    await until(() => /Plānot braucienu/.test(pdoc().body.textContent) && /Klusa māja vecpilsētā/.test(pdoc().body.textContent), 'preview in Latvian', 20000);
    check(true, 'the preview switches to Latvian with the owner\'s translation');
    check(/Ja esat|Kas brauc\?/.test(pdoc().body.textContent), 'guest profiles are in Latvian in the preview');
    check(!!$('.ns-langs', pdoc()), 'the preview shows the EN · LV language switch');
    await until(() => /Saved/.test(($('.anvil-role-ed-save-text') || {}).textContent || ''), 'autosave', 20000);

    // the question form switch is on by default (Hotel tab)
    await go('#edit/' + encodeURIComponent(id) + '/basics', () => $('[data-askon]'));
    check($('[data-askon]').checked, 'the "Ask us a question" form is on by default');

    // 2. publish, then the hosted site in Latvian
    const slug = 'hotel-lacis-' + Date.now().toString(36);
    const pub = JSON.parse(await window.nsTestCall('publish_site', JSON.stringify([id, slug])));
    check(pub && pub.ok, 'published at /s/' + slug);
    window.FEAT = { id: id, slug: slug };
    const fr = document.createElement('iframe');
    fr.style.cssText = 'position:fixed;left:0;top:0;width:1200px;height:900px;opacity:0;pointer-events:none';
    fr.src = '_/api/s/' + slug + '?lang=lv';
    document.body.appendChild(fr);
    const hdoc = () => fr.contentDocument;
    await until(() => hdoc() && hdoc().querySelector('.ns-ask-form'), 'hosted site with the question form', 40000);
    check(hdoc().documentElement.lang === 'lv', 'the hosted page is in Latvian (?lang=lv)');
    check(($('.ns-langs button.on', hdoc()) || {}).textContent === 'LV', 'its language switch shows LV');
    check(/Uzdodiet mums jautājumu/.test(hdoc().body.textContent) && /Klusa māja vecpilsētā/.test(hdoc().body.textContent), 'the form and the translated tagline are in Latvian');
    check(!!hdoc().querySelector('link[hreflang="lv"]'), 'hreflang links for search engines');
    await sleep(2800);   // the server drops questions sent faster than a person types
    const form = $('.ns-ask-form', hdoc());
    form.querySelector('[type=submit]').click();
    await until(() => /e-pasta adresi/.test($('.ns-ask-msg', hdoc()).textContent), 'the form asks for an email first');
    check(true, 'an empty form is refused with a Latvian message');
    type(form.querySelector('[name=name]'), 'Marta');
    type(form.querySelector('[name=email]'), 'marta@example.com');
    type(form.querySelector('[name=message]'), 'Vai jums ir bērnu gultiņa?');
    form.querySelector('[type=submit]').click();
    await until(() => hdoc().querySelector('.ns-ask-done'), 'thank-you message', 30000);
    check(/Paldies!/.test(hdoc().querySelector('.ns-ask-done').textContent), 'the guest gets a thank-you in Latvian');
    $('.ns-langs button[data-lang="en"]', hdoc()).click();
    await until(() => hdoc().documentElement.lang === 'en' && /Ask us a question/.test(hdoc().body.textContent), 'switch to English');
    check(/[?&]lang=/.test(fr.contentWindow.location.search) === false, 'switching to English drops ?lang from the address');
    fr.remove();

    // the owner's inbox
    await go('#questions', () => $('.qs-item') || $('.ui-empty'));
    const item = $('.qs-item');
    check(!!item && /bērnu gultiņa/.test(item.textContent) && /Latvian/.test(item.textContent), 'the question is in the owner\'s inbox, marked Latvian');
    check((($('.ui-nav .nav-count:not([hidden])') || {}).textContent || '') === '1', 'the menu shows 1 new question');
    button('Mark answered', item).click();
    await until(() => !$('.qs-item') && $('.ui-empty').offsetParent !== null, 'inbox empty after answering');
    check(true, 'Mark answered moves it out of New');
    check(!$('.nav-count:not([hidden])'), 'the menu badge goes away');

    // 3. the QR card
    await go('#edit/' + encodeURIComponent(id) + '/publish', () => button('Make a QR card'));
    button('Make a QR card').click();
    const qf = await until(() => $('.qr-preview iframe'), 'QR dialog');
    await until(() => /<svg/.test(qf.srcdoc || '') && /Scan to plan your stay/.test(qf.srcdoc), 'QR card drawn', 20000);
    check(/Skenējiet un plānojiet braucienu/.test(qf.srcdoc), 'the card has the Latvian line too');
    check(/fold here/.test(qf.srcdoc), 'the default layout is the folding table card');
    const sel = $('.qr-opts select');
    sel.value = sel.options[2].value; sel.dispatchEvent(new Event('change', { bubbles: true }));
    await until(() => /sheet poster/.test(qf.srcdoc), 'poster layout');
    check(true, 'the layout picker redraws the card');
    window.FEAT.qr = true;
    log.push(bad.length ? 'PROBLEMS: ' + bad.join(' | ') : 'PASSED');
    return { ok: !bad.length, log: log };
  } catch (e) {
    log.push(String(e && e.message || e));
    return { ok: false, log: log };
  }
})();
