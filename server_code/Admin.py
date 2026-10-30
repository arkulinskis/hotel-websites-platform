"""Admin page callables: overview, users (make admin, disable), demo data, sites (hand over, publish, restore the
showcase). Admins only. Feedback admin calls live in Feedback.py; deleting a site is Sites.delete_site (admins may)."""
import anvil.server
from anvil.tables import app_tables
import anvil.tables as tables

from . import common as C
from . import DemoData, Feedback


@anvil.server.callable(require_user=True)
def admin_overview():
    C.require_admin()
    return {"users": len([u for u in app_tables.users.search() if not u["is_demo"]]),
            "admins": len(app_tables.users.search(is_admin=True)),
            "feedback_new": Feedback.new_count(),
            "sites": len(app_tables.sites.search()), "published": len(app_tables.sites.search(status="published")),
            "demo": {"state": DemoData.state(), "counts": DemoData.counts()}}


def _user(u):
    return {"id": u.get_id(), "email": u["email"], "name": C.name_of(u), "is_admin": C.is_admin(u),
            "enabled": u["enabled"] is not False, "joined": C.iso(u["signed_up"]), "last_seen": C.iso(u["last_seen"])}


@anvil.server.callable(require_user=True)
def list_users(query=None):
    C.require_admin()
    query = C.text(query, 80).lower()
    rows = [u for u in app_tables.users.search(tables.order_by("signed_up", ascending=False)) if not u["is_demo"]]
    if query:
        rows = [u for u in rows if query in (u["email"] or "").lower() or query in (u["display_name"] or "").lower()]
    return {"users": [_user(u) for u in rows[:200]], "total": len(rows)}


@anvil.server.callable(require_user=True)
def set_admin(user_id, flag):
    me = C.require_admin()
    u = C.row_by_id(app_tables.users, user_id)
    if u is None:
        return C.fail("That account no longer exists.")
    if u == me and not flag:
        return C.fail("You can't remove your own admin rights.")
    u["is_admin"] = bool(flag)
    return C.ok(user=_user(u))


@anvil.server.callable(require_user=True)
def set_enabled(user_id, flag):
    me = C.require_admin()
    u = C.row_by_id(app_tables.users, user_id)
    if u is None:
        return C.fail("That account no longer exists.")
    if u == me:
        return C.fail("You can't disable your own account.")
    u["enabled"] = bool(flag)
    return C.ok(user=_user(u))


@anvil.server.callable(require_user=True)
def demo_load():
    C.require_admin()
    DemoData.load()
    return C.ok(demo={"state": DemoData.state(), "counts": DemoData.counts()})


@anvil.server.callable(require_user=True)
def demo_remove():
    C.require_admin()
    DemoData.remove()
    return C.ok(demo={"state": DemoData.state(), "counts": DemoData.counts()})


# ----------------------------------------------------------------------------------------------- sites (admin)
@anvil.server.callable(require_user=True)
def admin_sites():
    me = C.require_admin()
    from . import Sites
    out = []
    for s in app_tables.sites.search(tables.order_by("updated", ascending=False)):
        row = Sites.summary(s, me)
        row["owner_email"] = s["owner"]["email"] if s["owner"] is not None else None
        out.append(row)
    return {"sites": out}


@anvil.server.callable(require_user=True)
def admin_transfer_site(site_id, email):
    """Give a site to someone by email. If they have no account yet, it waits for them (claimed when they sign in)."""
    C.require_admin()
    s = C.row_by_id(app_tables.sites, site_id)
    if s is None:
        return C.fail("That site no longer exists.")
    email = C.text(email, 120).lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        return C.fail("Please enter a valid email address.")
    u = app_tables.users.get(email=email)
    if u is not None and not u["is_demo"]:
        s.update(owner=u, pending_owner=None)
        return C.ok(message="%s now owns this site." % C.name_of(u))
    s.update(owner=None, pending_owner=email)
    return C.ok(message="Saved. The site will belong to %s as soon as they sign up with that email." % email)


@anvil.server.callable(require_user=True)
def admin_set_site_status(site_id, status):
    C.require_admin()
    s = C.row_by_id(app_tables.sites, site_id)
    if s is None:
        return C.fail("That site no longer exists.")
    if status not in ("published", "draft"):
        return C.fail("Unknown status.")
    if status == "published" and not s["live"]:
        s["live"] = s["data"]
    s["status"] = status
    return C.ok()


@anvil.server.callable(require_user=True)
def admin_restore_showcase():
    C.require_admin()
    from . import Showcase
    s = Showcase.create()
    return C.ok(id=s.get_id())
