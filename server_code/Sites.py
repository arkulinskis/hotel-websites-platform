"""Hotel sites: the owner's list, create, load, autosave, publish, slugs, duplicate, delete, stats, and the public
showcase list (Explore).

A site's whole content is one JSON object (`data`, the draft the owner edits). Publishing copies it to `live`,
which is what the hosted page (Hosting.py) and Explore show, so half-finished edits never go live by accident.
Who may edit: the owner, or an admin. A showcase site without an owner (Hotel Kristofs) is admin-only until an
admin hands it to someone (Admin.admin_transfer_site): by email, even before that person has an account.
"""
import copy
import datetime as dt
import json
import re

import anvil.server
from anvil.tables import app_tables
import anvil.tables as tables

from . import common as C
from . import DemoData

MAX_SITES = 12
MAX_BYTES = 900000          # the JSON of one site
RESERVED = {"admin", "api", "app", "www", "help", "about", "new", "edit", "explore", "login", "signup", "static", "theme", "m", "s", "hit"}
BAD_URL = re.compile(r"^[\s\x00-\x1f]*(javascript|vbscript|data|file|blob)\s*:", re.I)


# ----------------------------------------------------------------------------------------------- helpers
def clean_data(value, depth=0):
    """A JSON-safe copy of what the browser sent: plain types only, strings capped, dangerous URL schemes removed.
    Every page escapes text when drawing; this stops `javascript:` links reaching pages served from the app's domain."""
    if depth > 12:
        return None
    if isinstance(value, dict):
        out = {}
        for k, v in list(value.items())[:400]:
            k = str(k)[:60]
            if k.startswith("__"):
                continue
            out[k] = clean_data(v, depth + 1)
        return out
    if isinstance(value, (list, tuple)):
        return [clean_data(v, depth + 1) for v in list(value)[:1500]]
    if isinstance(value, bool) or value is None:
        return value
    if isinstance(value, (int, float)):
        return value if value == value and abs(value) < 1e12 else 0
    s = str(value)[:20000]
    if BAD_URL.match(s):
        return ""
    return s


def norm_slug(s):
    s = (s or "").lower().strip()
    s = re.sub(r"[āàáâä]", "a", s)
    s = re.sub(r"[ēèéêë]", "e", s)
    s = re.sub(r"[īìíîï]", "i", s)
    s = re.sub(r"[ōòóôö]", "o", s)
    s = re.sub(r"[ūùúûü]", "u", s)
    s = s.replace("č", "c").replace("š", "s").replace("ž", "z").replace("ķ", "k").replace("ļ", "l").replace("ņ", "n").replace("ģ", "g")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:60]


def slug_problem(slug, site=None):
    if len(slug) < 3:
        return "Use at least 3 letters or digits."
    if slug in RESERVED:
        return "That address is reserved. Try another."
    other = app_tables.sites.get(slug=slug)
    if other is not None and other != site:
        return "That address is taken. Try another."
    return None


def can_edit(site, user):
    if site is None or user is None:
        return False
    return C.is_admin(user) or (site["owner"] is not None and site["owner"] == user)


def get_editable(site_id):
    user = C.require_user()
    site = C.row_by_id(app_tables.sites, site_id)
    if site is None or not can_edit(site, user):
        return None, user
    return site, user


def api_origin():
    try:
        return anvil.server.get_api_origin()
    except Exception:
        return ""


def site_url(site):
    return "%s/s/%s" % (api_origin(), site["slug"]) if site["slug"] else None


def summary(site, user=None):
    data = site["data"] or {}
    hotel = data.get("hotel") or {}
    live = site["live"]
    return {"id": site.get_id(), "name": site["name"] or hotel.get("name") or "Untitled", "city": site["city"] or hotel.get("city") or "",
            "slug": site["slug"], "status": site["status"] or "draft", "url": site_url(site) if site["status"] == "published" else None,
            "cover": site["cover"] or (data.get("hero") or {}).get("image") or "", "palette": (data.get("theme") or {}).get("palette") or "riga",
            "updated": C.iso(site["updated"]), "published_at": C.iso(site["published_at"]), "views": site["views"] or 0,
            "unpublished_changes": bool(live is not None and site["status"] == "published" and live != data),
            "owner": C.name_of(site["owner"]) if site["owner"] is not None else None, "owner_email": None,
            "pending_owner": site["pending_owner"], "is_showcase": bool(site["is_showcase"]), "demo": bool(site["is_demo"]),
            "mine": user is not None and site["owner"] == user}


def claim_pending(user):
    """Sites an admin handed to this email before the person signed up."""
    email = (user["email"] or "").lower()
    if not email:
        return
    for s in app_tables.sites.search(pending_owner=email):
        s.update(owner=user, pending_owner=None)


# ----------------------------------------------------------------------------------------------- the owner's sites
@anvil.server.callable(require_user=True)
def my_sites():
    user = C.require_user()
    DemoData.ensure_loaded()
    claim_pending(user)
    mine = [summary(s, user) for s in app_tables.sites.search(tables.order_by("updated", ascending=False), owner=user)]
    managed = []
    if C.is_admin(user):
        managed = [summary(s, user) for s in app_tables.sites.search(tables.order_by("updated", ascending=False))
                   if s["owner"] is None or s["owner"] != user]
    return {"sites": mine, "managed": managed, "max": MAX_SITES}


@anvil.server.callable(require_user=True)
def create_site(data):
    """data: the whole starter site the wizard built in the browser (hotel facts, scanned places, chosen profiles)."""
    user = C.require_user()
    if not isinstance(data, dict):
        return C.fail("Something is missing. Please start again.")
    data = clean_data(data)
    hotel = data.get("hotel") or {}
    name = C.text(hotel.get("name"), 90)
    if len(name) < 2:
        return C.fail("Please give the hotel a name.")
    if len(app_tables.sites.search(owner=user)) >= MAX_SITES and not C.is_admin(user):
        return C.fail("You already have %d sites. Delete one to make room." % MAX_SITES)
    if C.rate_limited("create_site", 12, 3600):
        return C.fail("That's a lot of new sites in one hour. Please try again later.")
    if len(json.dumps(data)) > MAX_BYTES:
        return C.fail("This site is too big to save. Remove some places or text.")
    hotel["name"] = name
    data["hotel"] = hotel
    base = norm_slug(name) or "hotel"
    slug, n = base, 2
    while slug_problem(slug) is not None:
        slug = "%s-%d" % (base, n)
        n += 1
    now = C.now()
    site = app_tables.sites.add_row(owner=user, slug=slug, name=name, city=C.text(hotel.get("city"), 60), status="draft", data=data, live=None,
                                    version=1, created=now, updated=now, published_at=None, cover=(data.get("hero") or {}).get("image") or "",
                                    pending_owner=None, views=0, is_demo=False, is_showcase=False)
    return C.ok(id=site.get_id(), slug=slug)


@anvil.server.callable(require_user=True)
def get_site(site_id):
    site, user = get_editable(site_id)
    if site is None:
        return C.fail("That site doesn't exist, or it isn't yours.")
    out = summary(site, user)
    out.update(data=site["data"] or {}, version=site["version"] or 1)
    return C.ok(site=out)


@anvil.server.callable(require_user=True)
def save_site(site_id, data, version=None):
    """Autosave from the editor. `version` is what the browser last loaded; a newer one on the server means another
    tab saved in between: the reply says conflict, and the page offers to reload."""
    site, user = get_editable(site_id)
    if site is None:
        return C.fail("That site doesn't exist, or it isn't yours.")
    if not isinstance(data, dict):
        return C.fail("Nothing to save.")
    data = clean_data(data)
    if len(json.dumps(data)) > MAX_BYTES:
        return C.fail("This site is too big to save (over 900 KB of text). Remove some places, rooms or text.")
    if version is not None and site["version"] and int(version) < int(site["version"]):
        return {"ok": False, "conflict": True, "version": site["version"], "error": "This site was changed in another tab or by someone else. Reload to see the latest version."}
    hotel = data.get("hotel") or {}
    v = int(site["version"] or 1) + 1
    site.update(data=data, version=v, updated=C.now(), name=C.text(hotel.get("name"), 90) or site["name"], city=C.text(hotel.get("city"), 60),
                cover=(data.get("hero") or {}).get("image") or site["cover"] or "")
    return C.ok(version=v, updated=C.iso(site["updated"]), unpublished_changes=site["status"] == "published" and site["live"] != data)


@anvil.server.callable(require_user=True)
def check_slug(slug, site_id=None):
    C.require_user()
    site = C.row_by_id(app_tables.sites, site_id) if site_id else None
    s = norm_slug(slug)
    problem = slug_problem(s, site)
    return {"ok": True, "slug": s, "free": problem is None, "problem": problem}


@anvil.server.callable(require_user=True)
def publish_site(site_id, slug=None):
    site, user = get_editable(site_id)
    if site is None:
        return C.fail("That site doesn't exist, or it isn't yours.")
    if slug is not None:
        s = norm_slug(slug)
        problem = slug_problem(s, site)
        if problem:
            return C.fail(problem)
        site["slug"] = s
    data = site["data"] or {}
    if not C.text((data.get("hotel") or {}).get("name"), 90):
        return C.fail("Give the hotel a name before publishing.")
    site.update(live=copy.deepcopy(data), status="published", published_at=C.now())
    return C.ok(site=summary(site, user))


@anvil.server.callable(require_user=True)
def unpublish_site(site_id):
    site, user = get_editable(site_id)
    if site is None:
        return C.fail("That site doesn't exist, or it isn't yours.")
    site["status"] = "draft"
    return C.ok(site=summary(site, user))


@anvil.server.callable(require_user=True)
def duplicate_site(site_id):
    site, user = get_editable(site_id)
    if site is None:
        return C.fail("That site doesn't exist, or it isn't yours.")
    data = copy.deepcopy(site["data"] or {})
    data.setdefault("hotel", {})["name"] = (C.text(data["hotel"].get("name"), 80) or "Hotel") + " (copy)"
    return create_site(data)


@anvil.server.callable(require_user=True)
def delete_site(site_id):
    site, user = get_editable(site_id)
    if site is None:
        return C.fail("That site doesn't exist, or it isn't yours.")
    if site["is_showcase"] and not C.is_admin(user):
        return C.fail("Only an admin can delete the showcase site.")
    for m in app_tables.media.search(site=site):
        m.delete()
    for s in app_tables.site_stats.search(site=site):
        s.delete()
    site.delete()
    return C.ok()


@anvil.server.callable(require_user=True)
def site_stats(site_id, days=30):
    site, user = get_editable(site_id)
    if site is None:
        return C.fail("That site doesn't exist, or it isn't yours.")
    days = max(7, min(90, int(days or 30)))
    today = C.now().date()
    start = today - dt.timedelta(days=days - 1)
    rows = {r["day"]: r for r in app_tables.site_stats.search(site=site) if r["day"] and r["day"] >= start}
    series, personas = [], {}
    for i in range(days):
        d = start + dt.timedelta(days=i)
        r = rows.get(d)
        series.append({"day": d.isoformat(), "views": int(r["views"] or 0) if r else 0})
        for k, n in ((r["personas"] or {}) if r else {}).items():
            personas[k] = personas.get(k, 0) + int(n or 0)
    top = sorted(({"id": k, "n": n} for k, n in personas.items()), key=lambda x: -x["n"])[:10]
    return C.ok(days=series, personas=top, total=sum(x["views"] for x in series), all_time=int(site["views"] or 0))


# ----------------------------------------------------------------------------------------------- public: Explore
@anvil.server.callable
def public_sites():
    DemoData.ensure_loaded()
    out = []
    for s in app_tables.sites.search(tables.order_by("published_at", ascending=False), status="published"):
        live = s["live"] or {}
        hotel = live.get("hotel") or {}
        out.append({"name": hotel.get("name") or s["name"], "city": hotel.get("city") or s["city"] or "", "area": hotel.get("area") or "",
                    "slug": s["slug"], "url": site_url(s), "tagline": (live.get("hero") or {}).get("headline") or hotel.get("tagline") or "",
                    "cover": (live.get("hero") or {}).get("image") or s["cover"] or "", "palette": (live.get("theme") or {}).get("palette") or "riga",
                    "stars": hotel.get("stars") or 0, "places": len(live.get("places") or []), "rooms": len(live.get("rooms") or []),
                    "demo": bool(s["is_demo"]), "showcase": bool(s["is_showcase"])})
    out.sort(key=lambda x: (not x["showcase"], x["demo"]))
    return {"sites": out}
