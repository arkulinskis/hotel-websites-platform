"""Demo content, so the app never looks empty.

Two kinds:
  - The showcase: Hotel Kristofs in Riga (the first real site, made from public facts). Created once, the first
    time anyone opens the app (Showcase.ensure); it is NOT demo data, so "Remove demo data" keeps it. It has no
    owner until an admin hands it over (Admin -> Sites).
  - Demo sites: fictional hotels by demo people (is_demo=True, @example.com, can't sign in), with made-up visit
    stats, so Explore and the stats look alive. Loaded on first visit, removable in Admin -> Demo data.
"""
import datetime as dt
import random

from anvil.tables import app_tables

from . import common as C

DEMO_USERS = [("Līga Ozola", "liga.demo@example.com"), ("Mårten Kask", "marten.demo@example.com")]
# Tables that hold demo rows (each has an is_demo column). Children before parents.
DEMO_TABLES = ["site_stats", "media", "sites"]


def state():
    return C.get_setting("demo", "never")  # "never" | "loaded" | "removed"


def ensure_loaded():
    """Call from the app's main data callables: makes the showcase once, loads the demo once (unless removed)."""
    from . import Showcase
    Showcase.ensure()
    if state() == "never":
        load()


def load():
    from . import showcase_data
    remove(remember=False)
    users = []
    for name, email in DEMO_USERS:
        u = app_tables.users.get(email=email) or app_tables.users.add_row(email=email, enabled=False)
        u.update(display_name=name, is_demo=True, signed_up=C.now() - dt.timedelta(days=40))
        users.append(u)
    rnd = random.Random(7)
    for i, spec in enumerate(showcase_data.demo_sites()):
        slug = spec["slug"]
        if app_tables.sites.get(slug=slug) is not None:
            continue
        data = spec["data"]
        now = C.now() - dt.timedelta(days=3 + i)
        site = app_tables.sites.add_row(owner=users[i % len(users)], slug=slug, name=data["hotel"]["name"], city=data["hotel"].get("city", ""),
                                        status="published", data=data, live=data, version=1, created=now - dt.timedelta(days=20), updated=now,
                                        published_at=now, cover=(data.get("hero") or {}).get("image") or "", pending_owner=None, views=0,
                                        is_demo=True, is_showcase=False)
        total = 0
        today = C.now().date()
        for d in range(30):
            v = max(0, int(rnd.gauss(28 + d * 0.6, 9)))
            total += v
            picks = {}
            for pid in spec.get("personas", []):
                n = max(0, int(rnd.gauss(v * 0.12, 2)))
                if n:
                    picks[pid] = n
            app_tables.site_stats.add_row(site=site, day=today - dt.timedelta(days=29 - d), views=v, personas=picks, is_demo=True)
        site["views"] = total
    C.set_setting("demo", "loaded")
    return counts()


def remove(remember=True):
    for name in DEMO_TABLES:
        for r in getattr(app_tables, name).search(is_demo=True):
            r.delete()
    for u in app_tables.users.search(is_demo=True):
        u.delete()
    if remember:
        C.set_setting("demo", "removed")
    return counts()


def counts():
    out = {"users": len(app_tables.users.search(is_demo=True))}
    for name in DEMO_TABLES:
        out[name] = len(getattr(app_tables, name).search(is_demo=True))
    return out
