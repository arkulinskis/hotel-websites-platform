# Nouveau Stay

A website builder for small hotels, in the Art Nouveau spirit. An owner types the hotel's address; Nouveau Stay maps
the neighbourhood (OpenStreetMap + Wikipedia), drafts the texts, ranks 30 kinds of guest by how well the area suits them,
and builds a phone-first site with rooms, photos, videos, 360° tours, a 3D neighbourhood map and an hour-by-hour
"your stay" plan for each kind of guest. Booking stays on Booking.com, Hotels.com and the like: the site sells the stay
and explains how booking and payment work. Sites are hosted at their own link here, or downloaded and hosted anywhere.
Built on [Anvil](https://anvil.works). The first site is **Boutique Hotel Kristofs**, Teātra iela 6, Old Riga.

- **App repo:** github.com/arkulinskis/hotel-websites-platform (branch `master`). Anvil pulls `master`.
- **Live:** https://arvistay.com (custom domain)

## What it does

**For hotel guests (a published hotel site, `<app>/_/api/s/<slug>`):**
- Opening screen: a photo, a video (upload, YouTube, Vimeo, .mp4; muted loop with start/end) or a "film" of slow zooms over photos; full-screen or arched-window layout.
- **Who is coming?** Guests pick one of the hotel's guest profiles (out of 30). The page rearranges itself: opening line,
  "for you" perks first, recommended rooms badged and sorted first, the map filtered to what they care about, and the stay plan.
  The choice is in the address (`#for=foodie`) so it can be shared.
- **Your stay, hour by hour:** written automatically for the profile, 1 to 4 nights, any season: arrival (check-in, first walk,
  aperitif, dinner, evening), full days (breakfast, morning visit, lunch, afternoon, coffee, shopping, evening performance or
  dinner, nightcap) and departure (last walk, check-out, to the station). Uses real places with walking times, the owner's
  stars and tips, the hotel's restaurant and breakfast. "Walk this day on the map" flies the 3D camera along the route.
- **Neighbourhood:** MapLibre 3D map (OpenFreeMap tiles, buildings tinted to the palette, rings at 5/10/15 minutes on foot,
  gentle orbit), category filters, places by walking time, landmark cards with Wikipedia photos and text. Without WebGL: an
  illustrated map (directions true, distances in walking minutes).
- Rooms (photo carousel or a drawn room until photos exist, size, beds, guests, features, price, 360° photo, 3D tour, video,
  "check dates"), 360° viewer (WebGL, drag to look, full screen), photo walk ("walk from our door"), galleries (bento,
  masonry, film strip, arched frames) with a lightbox, videos, dining, scores and reviews, **how booking and payment work**
  (3 steps, booking buttons, payment methods, perk, house rules), FAQ, contact and directions, photo and data credits.
- Six palettes (Riga Jugend, Mucha, Horta, Klimt, Peacock, Lily), four type pairs, three ornament levels. SEO title,
  description, link previews and schema.org Hotel data. Anonymous visit and profile-pick counts (no cookies).

**For hotel owners (members):**
- `#sites`: their sites with cover, status, link, visits; "Create a hotel site".
- `#new` wizard: hotel name + address search (Nominatim, Photon fallback) with a 3D map to confirm the pin → neighbourhood
  scan (Wikipedia landmarks; places from Overpass, or from the OpenFreeMap tiles when Overpass is busy) → guest profiles
  ranked by fit (best 8 preselected) → palette, type, kind, stars, times, contact, amenities → the site is created with
  drafted story, highlights, neighbourhood intro, FAQ, starter rooms and a to-do list.
- `#edit/<id>` editor: tabs Overview (readiness checklist, to-do), Hotel, Look (palette, fonts, ornaments, opening screen,
  sections on/off/order), Texts ("Write it for me" drafts), Rooms, Media (library, uploads, gallery, videos, 360° and tours,
  dining), Area (rescan with radius, search, star, hide, tips, add a place), Guests (30 profiles with fit scores, enable,
  "first", per-profile intro, tip, recommended rooms, categories to leave out, live story preview), Booking (channels,
  payment, perk, rules, scores, reviews, FAQ), Publish (address/slug check, publish/republish/unpublish, visit chart and
  profile picks, SEO, export, domain help, duplicate, delete). Live preview (desktop / tablet / phone, "Preview as" a
  profile, "Edit" buttons on each section), autosave with version check, photos shrunk in the browser.
- Export: a .zip (index.html + media/ + README) or one self-contained .html file.

**For everyone:** landing page for hotel owners (with a small "what your guests see" demo), Explore (all published sites),
sign-up, feedback form, Privacy & Terms (`#legal`).

**For admins** (`#admin`; arkulinskis@gmail.com becomes an admin on first sign-in):
- **Sites:** every site; edit, publish/unpublish, delete, **hand over** to an email (it waits until that person signs up).
- The Hotel Kristofs showcase has no owner until handed over; admins can edit it from `#sites` ("Sites you manage").
- **Feedback inbox**, **Users**, **Demo data** (two fictional demo hotels with made-up visit stats; removing the demo keeps
  the showcase; "Restore the Hotel Kristofs showcase").

## Setting it up in Anvil (once)

1. In the Anvil editor: **Create app → Clone from GitHub**, and paste `https://github.com/arkulinskis/hotel-websites-platform`.
2. **Users** service: email + password and "Continue with Google", sign-up allowed (already set in `anvil.yaml`; check it).
3. Open the app in the editor. If it shows a **Schema Mismatch** alert, choose **"The schema of the source code is correct"** so Anvil creates the tables.
4. **Run** it and sign up with **arkulinskis@gmail.com** straight away (that account becomes the admin).
5. **Publish** (Publish → public URL, or your own domain).
6. To give Hotel Kristofs to its owner: Admin → Sites → Hand over → their email.

<!-- libraries:start -->
## Libraries and outside services

What this project uses besides its own code. Generated by `APP_MAKER/tools/libraries.py`; to change it, edit `APP_MAKER/libraries/catalog.py` and re-run the script.

| Name | How it gets in | Used here for |
|---|---|---|
| [MapLibre GL JS](https://maplibre.org) 4.7.1 | Loaded from a CDN | the hotel's neighbourhood map with nearby sights |
| [Nominatim](https://nominatim.org) | Outside web service | OpenStreetMap's address search: turns an address into a map position, and back. |
| [OpenFreeMap](https://openfreemap.org) | Outside web service | the map style and tiles |
| [Photon](https://photon.komoot.io) | Outside web service | address suggestions while the owner types |
| [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) | Outside web service | finds sights, cafés and transit near the hotel |
| [Wikimedia Commons API](https://commons.wikimedia.org) | Outside web service | photos of nearby sights, with credits |
| [YouTube embeds](https://developers.google.com/youtube/player_parameters) | Outside web service | Plays a YouTube video inside the page (the privacy-friendlier youtube-nocookie address). |
| [Google Fonts](https://fonts.google.com) | Loaded from a CDN | Cormorant Garamond, Federo, Jost, Karla, Lora, Marcellus, Mulish, Playfair Display |

**Built into the browser:** Canvas 2D, WebGL, localStorage, Clipboard, File downloads (Blob), Fullscreen, IntersectionObserver.

**Anvil platform:** Anvil, Anvil Data Tables, Anvil JS bridge (anvil.js), Anvil Users.

**Build and test tools (not shipped):** Node.js, PyYAML, Headless Chrome (DevTools Protocol), Pillow.

<!-- libraries:end -->

## Working on it

See `.claude/skills/nouveaustay/SKILL.md`. In short:

```
python -I tools/check.py --ui                    # syntax, server tests, headless UI tests → ALL CHECKS PASSED
python -I tools/preview/devserver.py 8765        # the app on in-memory data: http://localhost:8765/  (?as=ana#sites, ?as=admin#admin)
                                                 #   hosted sites: http://localhost:8765/_/api/s/hotel-kristofs
python -I tools/preview/siteshot.py OUT k=hotel-kristofs [--phone]   # screenshot a hosted site
python tools/make_seed.py --port 8765 [--rescan] # rebuild the showcase + demo data (server_code/showcase_data.py)
python tools/deploy.py                           # dry run (needs PyYAML, so no -I)
python tools/deploy.py --push "Message"          # deploy: commit + push to GitHub, Anvil pulls it
```

## Project layout

```
web/site/       the hotel-site renderer (ns-site.js + ns-site.css): catalog, stay engine, sections, widgets (map, 360, film)
web/pages/      the app's pages: landing, sites, new (wizard), edit (editor), explore, admin, auth, profile; _ns + _scan helpers
web/            core.js/core.css (shared engine + design tokens), app.js (header, footer)
client_code/    Main.py (the only Anvil form: bridge to the server, uploads, sign-in), legal.py
server_code/    Sites.py, Media.py, Hosting.py, Showcase.py, showcase_data.py (generated), DemoData.py, Admin.py, ...
assets/         icon.svg + PNG icons, starter photos (k-* Kristofs, d-* demo hotels)
tools/          sync_to_anvil.py (settings + table schema), make_seed.py, deploy.py, check.py, preview/, testing/
```

## Credits

Starter photos of Riga, Jūrmala and Tallinn are from Wikimedia Commons (credited on each site); restaurant photos are
Dilettante's own. Map data © OpenStreetMap contributors; tiles by OpenFreeMap; landmark texts from Wikipedia (CC BY-SA).
