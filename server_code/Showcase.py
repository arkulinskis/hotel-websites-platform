"""The showcase site: Hotel Kristofs, Riga (the user's father's hotel), made from public facts.

Created once, the first time the app is opened. Not demo data: removing the demo keeps it. No owner at first:
admins edit it, and hand it to the hotel's owner in Admin -> Sites (by email; it waits until they sign up).
If an admin deletes it, it stays deleted (Admin -> Demo data can restore it).
"""
from anvil.tables import app_tables

from . import common as C

SLUG = "hotel-kristofs"


def ensure():
    if C.get_setting("showcase") is not None:
        return
    create()


def create():
    from . import showcase_data
    data = showcase_data.kristofs()
    existing = app_tables.sites.get(slug=SLUG)
    if existing is not None:
        C.set_setting("showcase", "created")
        return existing
    now = C.now()
    site = app_tables.sites.add_row(owner=None, slug=SLUG, name=data["hotel"]["name"], city=data["hotel"]["city"], status="published",
                                    data=data, live=data, version=1, created=now, updated=now, published_at=now,
                                    cover=data["hero"]["image"], pending_owner=None, views=0, is_demo=False, is_showcase=True)
    C.set_setting("showcase", "created")
    return site
