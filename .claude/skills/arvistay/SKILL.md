---
name: arvistay
description: Context, workflow and recipes for ArviStay (key nouveaustay, folder hotel-websites-platform-forms, repo hotel-websites-platform), the user's Anvil app built as native Anvil Forms, where hotel owners build Art Nouveau hotel websites with rooms, media, a 3D neighbourhood map and automatic stay plans for 30 guest profiles; the first site is the user's father's Hotel Kristofs in Riga. Load this before any feature request, bug fix, restyle, content change or deploy for this app, so you can work without re-exploring the code.
---

# ArviStay: working on the app

**What it is:** a website builder for small hotels (the user's father runs Boutique Hotel Kristofs, Teātra iela 6, Riga, and
found Wix hard). The owner types the address; the app scans the neighbourhood (OpenStreetMap + Wikipedia), drafts texts,
ranks 30 guest profiles ("personas") by how well the area suits them, and builds a site whose star is an automatic
hour-by-hour **stay plan** per profile. Guests don't book on the site: booking buttons go to Booking.com / Hotels.com etc.,
and the site explains booking and payment. Sites are hosted at `<app>/_/api/s/<slug>` or exported (.zip / single .html).

**Where it lives:**
- Folder `C:\Users\arkvi\Documents\CLAUDE\hotel-websites-platform-forms\` = the git clone of
  **github.com/arkulinskis/hotel-websites-platform**. "git" layout: the folder *is* the Anvil app; Anvil pulls `master`,
  pushing is the deploy. Live: **https://arvistay.com** (custom domain). Converted to native Forms on branch `forms`
  (Nov 2026); until the user merges it, master still runs the old JavaScript version from the old source folder
  `hotel-websites-platform` (tools/deploy.py there; don't deploy from it after the merge).
- Target patterns: `APP_MAKER\template-forms` (its guide), Anvil's `client-forms` skill (APP_MAKER/vendor).
- **APP_MAP.md** is the code map (pages, server functions, who calls what). **README.md** lists every feature.

**What the user wants:** "be creative, assume things", impressive and automatic. Theme: **Art Nouveau** (Riga is its capital).
App look: parchment `#f4ede0`, verdigris `#1f5c55`, gilt `#b4832c` (dark: `#111917` / `#74c2b0` / `#e2b55c`); fonts Cormorant
Garamond (display), Federo (wordmark), Jost (body); arch shapes, corner flourishes (`.ui-card.orn`), gold button (role
`btn-gold`). Hotel sites have their own six palettes and four type pairs (site/10-catalog.js). Mobile-first: every page
must fit 390px. Claude builds, tests and deploys; the user does the Anvil side.

## Workflow for any change

1. `git pull --ff-only` (Anvil commits "Edited ..." when the user changes something in the IDE).
2. Edit: a page's template and Python side by side (`client_code/Pages/X/form_template.html` + `__init__.py`); the engines
   in `theme/assets/ns-*.js`; the hotel-site renderer in `site/*` then `python -I tools/build_site.py`.
3. `python tools/check.py` (no -I) -> **ALL CHECKS PASSED** (anvil validate, JS syntax, renderer built, asset hashes,
   server tests, design check summary). After editing theme assets: `python tools/assets.py`.
4. `python -I tools/ui_test.py --only smoke.js` (Docker Desktop running) -> every page address opens (guest, member with a
   site, admin), no JS/Python error, not empty. Container `nouveaustay-dev`; client edits apply on the next run, server
   edits need `--restart`; `--stop` at the end. The user does the full tests themselves.
5. Commit as arkulinskis with the Co-Authored-By line; push (master once merged). New tables/columns: tell the user to
   accept the **Schema Mismatch** alert ("The schema of the source code is correct").
6. `python -I C:/Users/arkvi/Documents/CLAUDE/APP_MAKER/standard/app_map.py nouveaustay --folder=<this folder>` refreshes APP_MAP.md.

## Architecture

```
anvil.yaml                 startup module `startup`; db_schema; services (Users + Google); head_html (fonts, Prepsto, theme assets ?v=)
client_code/
  startup.py               legal kit, ns.install(), get_me, router.start(); window.nsTestCall (smoke test only)
  router.py                PAGES / NAV / _form; same addresses as the JS version: #landing #auth #sites #new #edit/<id>/<tab>
                           #explore #profile #admin/<tab>; page.leave() is called when leaving (the editor saves there)
  ns.py                    the bridge to the JS engines: window.NS_HOST (server calls on a whitelist, uploads via to_media,
                           toast, confirm) + Python helpers (palettes, fonts, features, rank, scan_summary, new_site_data, media urls)
  Layouts/Shell            header, account menu, footer (Submit feedback = Prepsto uavfgu6, Privacy & Terms, arkvital.com, addanapp.com)
  Pages/Landing            pitch, drawn hero, Watch section (YouTube 2Gm5T_OHFl0), 4-profile demo (Items/DemoWho + PlanStep)
  Pages/Sites              the owner's cards (Items/SiteCard; {"new": True} = the Create card) + "Sites you manage" for admins
  Pages/New                4-step wizard: geocode (NSScan) + Components/HotelMap, scan (NSScan.scan, in a setTimeout so the
                           page stays live), profiles (Items/PersonaPick), look + facts (Items/PaletteCard, FeatureCheck) -> create_site
  Pages/Edit               the editor frame, no Shell: top bar, tab rail (Items/EdTab), autosave (save_site + version), the
                           Publish tab (Components/PublishPanel), photo library (Dialogs/Library), preview (Components/SitePreview)
  Pages/Explore, Profile, Auth, Admin (+ Sites tab: Items/AdminSiteRow, Dialogs/Transfer; showcase restore in Demo data)
site/*.js, *.css           THE HOTEL-SITE RENDERER, joined by tools/build_site.py into theme/assets/ns-site.js / ns-site.css and
                           server_code/site_version.py (SITE_V). Used by the editor preview (iframe srcdoc), hosted pages
                           (Hosting.py) and exports (inlined). No window.UI here.
  10-catalog.js            NSSite: ICONS, CATS, PALETTES, FONTS, FEATURES, ROOM_TAGS, PERSONAS (30), SECTIONS, CHANNELS, PAYMENTS
  20-engine.js             places(), fit(), rankPersonas, enabledPersonas, numbers(), describe(), story() (the stay plan), draft.*
  30-render.js             mount(root, data, opts), boot(), previewListen(); every section's HTML, nav, footer, theme, stats pings
  40-widgets.js            videoInfo, Modal, Lightbox, Carousel, Film, Pano (WebGL 360), Map (MapLibre 3D) + FlatMap
  50-site.css              the site look (design-ok markers: the guests' sites keep their look)
theme/assets/ns-app.js     window.UI helpers for the engines (mediaUrl, toast, confirm, api/apiQuiet/upload -> NS_HOST, busy...),
                           window.NSApp (was _ns.html: shrink, pick, upload(Many), previewDoc, exportSite, zip, newSiteData,
                           swatches, coverStyle, NSApp.json.* for Python), window.NSScan (was _scan.html: geocode, scan)
theme/assets/ns-editor.js  window.NSEd: create(el, dataJson, siteJson, hooks) = the nine field tabs (fld/sel/chip/pics/listEditor,
                           data-k paths), preview(el, onMessage) = the iframe, statsHtml/statsBind = the visits chart
theme/assets/app.css       tokens (light/dark), design kit, Art Nouveau skin, page CSS, role layer, Forms additions at the end
server_code/               Sites.py, Media.py (/m/:key), Hosting.py (/s/:slug, /hit), Showcase.py, showcase_data.py (GENERATED by the
                           old folder's tools/make_seed.py), DemoData.py, Admin.py, Accounts.py, Feedback.py, SchemaCheck.py, seo_routes.py
tools/                     check.py, build_site.py, assets.py, build_icons.py, make_icons.py, ui_test.py + ui/smoke.js + design.js,
                           testing/test_server.py (mock reads the schema from anvil.yaml)
```

**The site JSON** (`sites.data`, the draft; `sites.live` is the published copy): `hotel{name, kind, stars, tagline, area, city,
country, address, lat, lng, phone, email, whatsapp, checkin, checkout, checkin_note, breakfast, building, airport, parking, features[]}`,
`theme{palette, fonts, ornament}`, `sections[{id, on, title}]`, `hero{kind photo|film|video, style full|arch, image, film[], video, start, end, headline}`,
`story`, `highlights[]`, `rooms[{id, name, size, beds, guests, price, text, features[], tags[], photos[], pano, tour, video}]`, `rooms_intro`,
`walkthrough{items[{kind pano|embed|photos, src, embed, stops[], title, text, credit}]}`, `gallery{layout, items[{src, caption}]}`,
`videos[]`, `dining{...}`, `ratings[]`, `reviews[]`, `booking{intro, channels[{kind, url, label}], payment{methods[], when, note}, perk, policies[]}`,
`faq[]`, `contact{directions[], social[]}`, `neighborhood{title, intro}`, `personas{enabled[], featured, title, lead, overrides{<id>{intro, tip, rooms[], hide[]}}}`,
`places[{id, name, cat, sub, lat, lng, wiki{...}, note, pinned, hidden, diet}]`, `credits[]`, `scan`, `seo`, `todo[]`, `todo_done[]`.
Media refs: `"m:<key>"` (upload, `<api>/m/<key>`), `"a:<file>"` (theme asset), or a plain URL.

**Tables:** `users` (+ legal columns), `app_settings` (demo, showcase), `feedback`, `sites` (owner, slug, name, city, status
draft|published, data, live, version, created, updated, published_at, cover, pending_owner, views, is_demo, is_showcase), `media`
(key, site, owner, kind image|pano|video, file, ...), `site_stats` (site, day, views, personas{id: n}, is_demo).

## How things are done here (Forms)

- Pages, menus, dialogs and lists are Forms (template-forms rules: Labels for changing text, RepeatingPanels for lists,
  `state.set_attr` for attributes, `alert(Form, buttons=[], role="app-dialog")` dialogs closing with `x-close-alert`).
  Display-only text in item Forms uses `anvil:dom-node` + `textContent`.
- **Engines stay JavaScript** and talk JSON text with Python: `ns.rank(data)` etc. call `NSApp.json.*`; JS objects that come
  back are converted with `json.loads(window.JSON.stringify(x))`; messages to the preview iframe must be real JS objects
  (`window.JSON.parse(json.dumps(msg))`, postMessage can't clone Python proxies).
- **The editor**: Pages/Edit owns saving, tabs, top bar, Publish, dialogs; NSEd owns the field panels and calls the page's
  hooks: `changed(opts)` (autosave in 1.1 s; `top` redraws title + "Preview as"), `tab(name)`, `persona(id)`,
  `library(kind, multi, refsJson)` -> Dialogs/Library returns refs or "upload" (then NSEd opens the file picker),
  `previewMsg` ("See it on the site"). Engine server calls are whitelisted in `ns.ENGINE_CALLS` (list/delete/upload_media).
- Validator: values the type checker would pin (None, literal dicts) go through `_loose(x)` (Edit, PublishPanel, Sites).

## Recipes

- **New site section:** `NS.SECTIONS` (site/10-catalog.js), a `SECTIONS.<id>` function in site/30-render.js (return '' when
  empty), CSS in site/50-site.css (wrapper class `ns-s-<id>`), `python -I tools/build_site.py`; then `SECTION_TAB`/`TAB_SECTION`
  in BOTH ns-editor.js and Pages/Edit, and fields in the matching NSEd panel. Old sites get it switched off automatically.
- **New guest profile:** `NS.PERSONAS` (unique lowercase id: it ends up in URLs and stats).
- **New place category:** `NS.CATS` + `NS.CAT_ORDER`, the OSM mapping `catOf()` and `TILE_CAT` in ns-app.js (NSScan), `TARGET` in 20-engine.js.
- **Change the stay plan:** `NS.story` in site/20-engine.js.
- **New editor field:** `fld(label, 'path.in.json', opts)` / `sel` / `chip` / `pics` / `listEditor` in ns-editor.js PANELS;
  binding, autosave and preview are automatic. A field on the Publish tab: a TextBox in Components/PublishPanel +
  `page.ed.set(path, value)`.
- **Hosted page HTML:** `Hosting.page_html` (keep JSON through `json_for_script`). Exports: `NSApp.exportSite` (ns-app.js).
- **Kristofs content:** `kristofs()` in the OLD folder's tools/make_seed.py writes server_code/showcase_data.py (copy it over);
  live, an admin deletes the showcase and presses "Restore the Hotel Kristofs showcase" (Admin -> Demo data).

## Gotchas

- Section wrappers are `ns-sec ns-s-<id>`; don't style `.ns-<section id>` (collisions with `.ns-rooms`, `.ns-film` ...).
- MapLibre sets `position: relative` on its container: `.ns-map` needs explicit width/height 100%.
- The app page loads ns-site.css too (map pins in the wizard): keep site CSS rules prefixed `ns-`.
- Overpass servers are often busy: the scan falls back to POIs in the OpenFreeMap tiles (hidden 1100px map).
- Tests: `window.NS_TEST_SCAN = {places, credits}` skips the network scan, `window.NS_NO_MAP = true` gives the flat map,
  `window.nsTestCall(name, argsJson)` makes the same server calls as the pages (smoke.js creates a site with it).
- The App Server container has no internet, but headless Chrome does: maps and Wikipedia work in the browser.
- Engine JS must not contain literal `</script>` / `<style>`: ns-app.js builds them as `'<scr' + 'ipt>'`.
- Uploaded files are public to anyone with the random link (needed for hosted/exported sites).
- `pending_owner` sites are claimed in `Sites.my_sites` when that email signs in.

## Privacy & Terms (legal kit)

From `C:/Users/arkvi/Documents/CLAUDE/APP_MAKER/legal-kit` (`apps/nouveaustay.json`: hotel-site data, uploads, anonymous counts,
hosted-site visitors, owner content terms; providers incl. `overpass`, `wikimedia`, `video_embeds`). Don't edit
`theme/assets/legal-kit.js`, `client_code/legal.py` or `server_code/legal_server.py` here: change the kit, then
`python -I build.py nouveaustay && python -I install.py nouveaustay` there, `python tools/assets.py` here, deploy.
- Sign-up keeps the tick box (Pages/Auth, `legal.consent_field()`); Continue with Google signs in or creates the account.
- Consent is stored in `users.legal_version`, `legal_accepted_at`, `legal_source`.
