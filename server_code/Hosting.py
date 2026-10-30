"""The hosted hotel sites and their anonymous stats.

  <app>/_/api/s/<slug>   the published site: a small HTML page (title, link previews, Google's Hotel structured data)
                         that loads the shared renderer (theme asset ns-site.js + ns-site.css) and draws `live`.
  <app>/_/api/hit        a 1x1 picture the page asks for: counts a view (e=view) or a guest-profile pick (e=p&p=<id>).
                         No cookies, no IP addresses, no personal data: just a number per site per day.
"""
import base64
import html
import json
import re

import anvil
import anvil.server
from anvil.tables import app_tables

from . import common as C

try:
    from .site_version import SITE_V
except Exception:
    SITE_V = "dev"

PLATFORM = "Nouveau Stay"
PIXEL = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
BG = {"riga": "#f3ecdf", "mucha": "#f6eee5", "horta": "#142019", "klimt": "#12110f", "peacock": "#eef3f0", "lily": "#fbfaf7"}


def _origins():
    try:
        app = anvil.server.get_app_origin()
    except Exception:
        app = ""
    try:
        api = anvil.server.get_api_origin()
    except Exception:
        api = app + "/_/api"
    return app, api


def abs_media(ref, app, api):
    ref = str(ref or "")
    if ref.startswith("m:"):
        return api + "/m/" + ref[2:]
    if ref.startswith("a:"):
        return app + "/_/theme/" + ref[2:]
    return ref


def json_for_script(value):
    """JSON that is safe inside <script>: no "</script>", no "<!--"."""
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026") \
        .replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def structured_data(data, url, image):
    """schema.org Hotel, so search engines can show the hotel's address, rating and photo."""
    h = data.get("hotel") or {}
    out = {"@context": "https://schema.org", "@type": "Hotel", "name": h.get("name"), "url": url}
    if h.get("address"):
        out["address"] = {"@type": "PostalAddress", "streetAddress": h.get("address"), "addressLocality": h.get("city"), "addressCountry": h.get("country")}
    if h.get("lat") is not None:
        out["geo"] = {"@type": "GeoCoordinates", "latitude": h.get("lat"), "longitude": h.get("lng")}
    if h.get("phone"):
        out["telephone"] = h.get("phone")
    if h.get("stars"):
        out["starRating"] = {"@type": "Rating", "ratingValue": h.get("stars")}
    if image:
        out["image"] = image
    if h.get("checkin"):
        out["checkinTime"] = h.get("checkin")
    if h.get("checkout"):
        out["checkoutTime"] = h.get("checkout")
    feats = [f for f in (h.get("features") or []) if isinstance(f, str)]
    if feats:
        out["amenityFeature"] = [{"@type": "LocationFeatureSpecification", "name": f, "value": True} for f in feats[:12]]
    return {k: v for k, v in out.items() if v}


def page_html(data, slug, app, api):
    h = data.get("hotel") or {}
    hero = data.get("hero") or {}
    seo = data.get("seo") or {}
    name = h.get("name") or "Hotel"
    title = seo.get("title") or ("%s · %s" % (name, h.get("city") or h.get("area") or "Hotel"))
    desc = seo.get("description") or hero.get("headline") or h.get("tagline") or ("Stay at %s." % name)
    image = abs_media(hero.get("image") or ((data.get("gallery") or {}).get("items") or [{}])[0].get("src"), app, api)
    url = "%s/s/%s" % (api, slug)
    bg = BG.get((data.get("theme") or {}).get("palette") or "riga", "#f3ecdf")
    initial = (re.sub(r"^(hotel|boutique|the|villa|pension)\s+", "", name, flags=re.I).strip() or "H")[0].upper()
    icon = ("data:image/svg+xml," + "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%231f5c55'/%3E"
            "%3Ctext x='32' y='44' font-family='Georgia' font-size='34' text-anchor='middle' fill='%23e2b55c'%3E" + html.escape(initial) + "%3C/text%3E%3C/svg%3E")
    opts = {"mode": "live", "slug": slug, "media": {"m": api + "/m/", "a": app + "/_/theme/"}, "stats": api + "/hit",
            "platform": {"name": PLATFORM, "url": app}}
    esc = html.escape
    return ("<!doctype html>\n<html lang=\"%s\">\n<head>\n<meta charset=\"utf-8\">\n"
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
            "<title>%s</title>\n<meta name=\"description\" content=\"%s\">\n<link rel=\"canonical\" href=\"%s\">\n"
            "<meta property=\"og:type\" content=\"website\">\n<meta property=\"og:title\" content=\"%s\">\n<meta property=\"og:description\" content=\"%s\">\n"
            "<meta property=\"og:url\" content=\"%s\">\n%s<meta name=\"twitter:card\" content=\"summary_large_image\">\n<meta name=\"theme-color\" content=\"%s\">\n"
            "<link rel=\"icon\" href=\"%s\">\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n"
            "<link rel=\"stylesheet\" href=\"%s/_/theme/ns-site.css?v=%s\">\n<style>html,body{margin:0;background:%s}</style>\n"
            "<script type=\"application/ld+json\">%s</script>\n</head>\n<body>\n<div id=\"ns-root\"></div>\n"
            "<noscript><h1>%s</h1><p>%s</p><p>%s</p></noscript>\n"
            "<script src=\"%s/_/theme/ns-site.js?v=%s\"></script>\n<script>NSSite.boot(%s, %s);</script>\n</body>\n</html>\n") % (
        esc(str(data.get("lang") or "en")), esc(title), esc(desc), esc(url), esc(title), esc(desc), esc(url),
        ("<meta property=\"og:image\" content=\"%s\">\n" % esc(image)) if image else "", esc(bg), icon, app, SITE_V, bg,
        json_for_script(structured_data(data, url, image)), esc(name), esc(desc), esc(h.get("address") or ""),
        app, SITE_V, json_for_script(data), json_for_script(opts))


def not_found(app):
    return anvil.server.HttpResponse(404, (
        "<!doctype html><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1'><title>Not published</title>"
        "<body style=\"margin:0;min-height:100vh;display:grid;place-items:center;background:#f3ecdf;color:#1c2a27;font:18px/1.5 Georgia,serif;text-align:center\">"
        "<div><h1 style='font-weight:500'>This hotel site isn't published</h1><p>It may have moved, or the owner is still working on it.</p>"
        "<p><a style='color:#1f5c55' href='%s'>Make your own with %s</a></p></div></body>") % (html.escape(app or "/"), PLATFORM),
        headers={"Content-Type": "text/html; charset=utf-8"})


@anvil.server.http_endpoint("/s/:slug")
def hosted(slug, **kw):
    app, api = _origins()
    site = app_tables.sites.get(slug=str(slug or "").lower()[:60]) if slug else None
    if site is None or site["status"] != "published" or not site["live"]:
        return not_found(app)
    return anvil.server.HttpResponse(200, page_html(site["live"], site["slug"], app, api),
                                     headers={"Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=60"})


def count(site, event, persona=None):
    today = C.now().date()
    row = app_tables.site_stats.get(site=site, day=today)
    if row is None:
        row = app_tables.site_stats.add_row(site=site, day=today, views=0, personas={}, is_demo=bool(site["is_demo"]))
    if event == "view":
        row["views"] = int(row["views"] or 0) + 1
        site["views"] = int(site["views"] or 0) + 1
    elif event == "p" and persona and re.match(r"^[a-z]{2,20}$", persona):
        p = dict(row["personas"] or {})
        if len(p) < 40 or persona in p:
            p[persona] = int(p.get(persona, 0)) + 1
            row["personas"] = p


@anvil.server.http_endpoint("/hit")
def hit(s=None, e=None, p=None, **kw):
    site = app_tables.sites.get(slug=str(s)[:60]) if s else None
    if site is not None and site["status"] == "published" and e in ("view", "p"):
        try:
            count(site, e, p)
        except Exception as err:
            print("hit failed: %r" % err)
    return anvil.server.HttpResponse(200, anvil.BlobMedia("image/gif", PIXEL, name="p.gif"),
                                     headers={"Cache-Control": "no-store", "Content-Type": "image/gif", "Access-Control-Allow-Origin": "*"})

