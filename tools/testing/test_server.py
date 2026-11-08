"""Server tests against the strict mock of Anvil (tools/testing/mock).

    python tools/testing/test_server.py          -> prints ALL OK, or the first failure

call(name, ...) runs a server function the way the browser does: by name, with require_user enforced,
and the reply must be JSON (a datetime or a row in a reply fails here, like it would break the page).
Add tests for every new server function: the happy path, bad input, and someone who isn't allowed.
"""
import datetime as dt
import importlib
import json
import os
import pathlib
import shutil
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
PROJECT = HERE.parents[1]
_tmp = pathlib.Path(tempfile.mkdtemp())
shutil.copytree(PROJECT / "server_code", _tmp / "app")
(_tmp / "app" / "__init__.py").write_text("")
os.environ["ANVIL_APP_YAML"] = str(PROJECT / "anvil.yaml")  # the mock reads the schema from anvil.yaml (needs PyYAML)
sys.path[:0] = [str(HERE / "mock"), str(_tmp), str(PROJECT / "tools")]
import anvil.server  # noqa: E402
import anvil.users  # noqa: E402
from anvil.tables import app_tables as T  # noqa: E402
SERVER_MODULES = sorted(p.stem for p in (PROJECT / "server_code").glob("*.py"))

M = {m: importlib.import_module("app." + m) for m in SERVER_MODULES}
now = dt.datetime.now(dt.timezone.utc)


def call(name, *args):
    r = anvil.server.call(name, *args)
    json.dumps(r)  # strict: must be JSON-able
    return r


def as_user(row):
    anvil.users.CURRENT[0] = row
    anvil.server.session.use(row.get_id() if row is not None else None)


def denied(name, *args):
    try:
        call(name, *args)
    except anvil.server.PermissionDenied:
        return True
    return False


def ok(r, msg=""):
    assert isinstance(r, dict) and r.get("ok"), (msg, r)
    return r


def bad(r, msg=""):
    assert isinstance(r, dict) and r.get("ok") is False and r.get("error"), (msg, r)
    return r


def person(email, name=None, **kw):
    return T.users.add_row(email=email, enabled=True, signed_up=now, display_name=name, **kw)


# ---------------------------------------------------------------------------------- accounts
admin = person("arkulinskis@gmail.com", "The Admin")
ana = person("ana@example.com", "Ana")
bob = person("bob@example.com")

as_user(None)
assert call("get_me") is None
assert denied("update_profile", "X")
as_user(admin)
assert call("get_me")["is_admin"] is True, "ADMIN_EMAILS become admins on first sign-in"
as_user(ana)
me = call("get_me")
assert me["name"] == "Ana" and me["is_admin"] is False
assert ana["last_seen"] is not None
as_user(bob)
assert call("get_me")["name"] == "Bob", "a name comes from the email when none is set"
bad(call("update_profile", " x "))
assert ok(call("update_profile", "  Bob   Stone "))["me"]["name"] == "Bob Stone"

# ---------------------------------------------------------------------------------- feedback
as_user(None)
bad(call("submit_feedback", "bug", "hi"))
ok(call("submit_feedback", "bug", "The button is broken", "guest@example.com", {"page": "#home", "evil": "x" * 9999}))
fb = T.feedback.search()[0]
assert fb["name"] == "Guest" and fb["email"] == "guest@example.com" and "evil" not in fb["context"] and fb["status"] == "new"
for i in range(4):
    ok(call("submit_feedback", "idea", "Idea number %d" % i))
bad(call("submit_feedback", "idea", "One too many this hour"), "rate limit")
as_user(ana)
ok(call("submit_feedback", "nonsense-kind", "Signed-in feedback"))
assert T.feedback.get(message="Signed-in feedback")["kind"] == "other"
assert denied("list_feedback")
as_user(admin)
lst = call("list_feedback")
assert lst["counts"]["new"] == 6 and len(lst["items"]) == 6
fid = lst["items"][0]["id"]
ok(call("set_feedback_status", fid, "done", "Fixed it"))
assert call("list_feedback", "done")["items"][0]["note"] == "Fixed it"
bad(call("set_feedback_status", fid, "weird"))
bad(call("set_feedback_status", "nope", "done"))
ok(call("delete_feedback", fid))
assert len(call("list_feedback")["items"]) == 5

# ---------------------------------------------------------------------------------- admin
as_user(ana)
for fn, args in [("admin_overview", ()), ("list_users", ()), ("set_admin", (bob.get_id(), True)), ("demo_load", ()), ("demo_remove", ())]:
    assert denied(fn, *args), fn
as_user(admin)
ov = call("admin_overview")
assert ov["users"] == 3 and ov["admins"] == 1 and ov["feedback_new"] == 5
assert len(call("list_users")["users"]) == 3 and len(call("list_users", "bob")["users"]) == 1
ok(call("set_admin", bob.get_id(), True))
assert bob["is_admin"] is True
bad(call("set_admin", admin.get_id(), False), "can't remove your own admin")
ok(call("set_enabled", bob.get_id(), False))
assert bob["enabled"] is False
bad(call("set_enabled", admin.get_id(), False))
ok(call("set_enabled", bob.get_id(), True))
ok(call("set_admin", bob.get_id(), False))
assert bob["is_admin"] is False

# ---------------------------------------------------------------------------------- demo data, showcase, Explore
import anvil  # noqa: E402

as_user(None)
pub = call("public_sites")["sites"]
assert M["DemoData"].state() == "loaded", "demo loads on first visit"
assert pub[0]["slug"] == "hotel-kristofs" and pub[0]["showcase"], "the Kristofs showcase comes first in Explore"
assert len([s for s in pub if s["demo"]]) == len(M["showcase_data"].demo_sites())
kr = T.sites.get(slug="hotel-kristofs")
assert kr["owner"] is None and kr["is_showcase"] and not kr["is_demo"] and kr["status"] == "published"
assert len(kr["live"]["places"]) > 100, "the showcase has its scanned neighbourhood"
assert all(not s["url"].startswith("None") for s in pub)

# ---------------------------------------------------------------------------------- sites: create, load, save, publish
as_user(None)
assert denied("my_sites") and denied("create_site", {}) and denied("get_site", "x") and denied("save_site", "x", {})
as_user(ana)
mine = call("my_sites")
assert mine["sites"] == [] and mine["managed"] == [], "non-admins don't see other people's sites"
bad(call("create_site", "nope"))
bad(call("create_site", {"hotel": {"name": " "}}))
starter = {"hotel": {"name": "Hotel Āraiši Rose", "city": "Rīga", "lat": 56.95, "lng": 24.1, "features": ["wifi"]},
           "booking": {"channels": [{"kind": "booking", "url": "javascript:alert(1)"}, {"kind": "hotels", "url": "https://hotels.com/x"}]},
           "places": [{"id": "o1", "name": "Café", "cat": "cafe", "lat": 56.951, "lng": 24.101}], "__junk": 1}
r = ok(call("create_site", starter))
sid = r["id"]
assert r["slug"] == "hotel-araisi-rose", r
site = ok(call("get_site", sid))["site"]
assert site["status"] == "draft" and site["version"] == 1 and site["mine"]
assert site["data"]["booking"]["channels"][0]["url"] == "", "javascript: links are removed"
assert site["data"]["booking"]["channels"][1]["url"] == "https://hotels.com/x"
assert "__junk" not in site["data"]
r2 = ok(call("create_site", starter))
assert T.sites.get_by_id(r2["id"])["slug"] == "hotel-araisi-rose-2", "slugs stay unique"
ok(call("delete_site", r2["id"]))

data = site["data"]
data["hotel"]["name"] = "Hotel Rose"
data["story"] = {"body": "Hello", "evil": "  JavaScript:alert(2)"}
s1 = ok(call("save_site", sid, data, 1))
assert s1["version"] == 2 and T.sites.get_by_id(sid)["name"] == "Hotel Rose"
assert T.sites.get_by_id(sid)["data"]["story"]["evil"] == ""
conflict = call("save_site", sid, data, 1)
assert conflict["ok"] is False and conflict.get("conflict"), "an older version can't overwrite a newer one"
bad(call("save_site", sid, {"x": "y" * 20000, "places": ["y" * 20000] * 60}, 2), "too big")
bad(call("save_site", sid, "not a dict", 2))

as_user(bob)
bad(call("get_site", sid), "someone else's site")
bad(call("save_site", sid, data, 2))
bad(call("publish_site", sid, "rose"))
bad(call("delete_site", sid))
bad(call("site_stats", sid))
assert call("check_slug", "hotel-kristofs")["free"] is False
assert call("check_slug", "Āraiši Garden!")["slug"] == "araisi-garden"
assert call("check_slug", "admin")["free"] is False

as_user(ana)
bad(call("publish_site", sid, "hotel-kristofs"), "taken")
bad(call("publish_site", sid, "ab"), "too short")
p = ok(call("publish_site", sid, "Rose Hotel"))["site"]
assert p["status"] == "published" and p["slug"] == "rose-hotel" and p["url"].endswith("/s/rose-hotel")
assert T.sites.get_by_id(sid)["live"]["hotel"]["name"] == "Hotel Rose"
data["hotel"]["tagline"] = "New line"
s2 = ok(call("save_site", sid, data, 2))
assert s2["unpublished_changes"] is True, "drafts don't go live until published"
assert T.sites.get_by_id(sid)["live"]["hotel"].get("tagline") != "New line"
assert call("my_sites")["sites"][0]["unpublished_changes"] is True
dup = ok(call("duplicate_site", sid))
assert T.sites.get_by_id(dup["id"])["data"]["hotel"]["name"] == "Hotel Rose (copy)"
assert T.sites.get_by_id(dup["id"])["status"] == "draft"

# ---------------------------------------------------------------------------------- hosting + stats
H = M["Hosting"]
page = H.hosted(slug="rose-hotel")
assert page.status == 200 and "NSSite.boot(" in page.body and "<title>" in page.body and "ns-site.js?v=" in page.body
assert "application/ld+json" in page.body and '"@type":"Hotel"' in page.body
assert "</script><script>alert" not in page.body
row_ = T.sites.get_by_id(sid); live_ = dict(row_["live"]); live_["hotel"] = dict(live_["hotel"], name="</script><script>alert(1)</script>"); row_["live"] = live_
assert "</script><script>alert(1)" not in H.hosted(slug="rose-hotel").body, "data can't close the script tag"
assert H.hosted(slug="nope").status == 404
assert H.hosted(slug=None).status == 404
assert H.hosted(slug="hotel-kristofs").status == 200
for i in range(3):
    H.hit(s="rose-hotel", e="view")
H.hit(s="rose-hotel", e="p", p="foodie")
H.hit(s="rose-hotel", e="p", p="<bad>")
H.hit(s="nope", e="view")
assert H.hit(s="rose-hotel", e="weird").status == 200
st_ = ok(call("site_stats", sid, 30))
assert st_["total"] == 3 and st_["all_time"] == 3 and st_["personas"] == [{"id": "foodie", "n": 1}] and len(st_["days"]) == 30
ok(call("unpublish_site", sid))
assert H.hosted(slug="rose-hotel").status == 404, "unpublished sites aren't served"
H.hit(s="rose-hotel", e="view")
assert ok(call("site_stats", sid))["total"] == 3, "unpublished sites don't count visits"

# ---------------------------------------------------------------------------------- media
as_user(None)
assert denied("upload_media", None, sid) and denied("list_media", sid) and denied("delete_media", "x")
as_user(ana)
jpg = anvil.BlobMedia("image/jpeg", b"\xff\xd8\xff" + b"0" * 2000, name="room.jpg")
up = ok(call("upload_media", jpg, sid, "image", {"name": "room.jpg", "width": 1200, "height": 800}))["item"]
assert up["ref"].startswith("m:") and up["kind"] == "image" and up["width"] == 1200
bad(call("upload_media", anvil.BlobMedia("text/html", b"<script>", name="x.html"), sid, "image"), "wrong type")
bad(call("upload_media", anvil.BlobMedia("image/jpeg", b"0" * (10 * 1024 * 1024), name="big.jpg"), sid, "image"), "too big")
bad(call("upload_media", jpg, sid, "weird"))
bad(call("upload_media", None, sid, "image"))
assert len(ok(call("list_media", sid))["items"]) == 1
served = M["Media"].serve(key=up["key"])
assert served.status == 200 and served.headers["Access-Control-Allow-Origin"] == "*"
assert M["Media"].serve(key="short").status == 404
as_user(bob)
bad(call("upload_media", jpg, sid, "image"), "not your site")
bad(call("list_media", sid))
bad(call("delete_media", up["key"]), "not your file")
as_user(ana)
ok(call("delete_media", up["key"]))
ok(call("delete_media", up["key"]), "deleting twice is fine")

# ---------------------------------------------------------------------------------- admin: sites, hand over, showcase
as_user(ana)
for fn, args in [("admin_sites", ()), ("admin_transfer_site", (kr.get_id(), "a@b.co")), ("admin_set_site_status", (sid, "draft")), ("admin_restore_showcase", ())]:
    assert denied(fn, *args), fn
bad(call("get_site", kr.get_id()), "only admins edit the ownerless showcase")
as_user(admin)
assert any(s["is_showcase"] for s in call("my_sites")["managed"]), "admins manage the showcase"
assert ok(call("get_site", kr.get_id()))["site"]["is_showcase"]
lst = call("admin_sites")["sites"]
assert any(x["owner_email"] == "ana@example.com" for x in lst)
bad(call("admin_transfer_site", kr.get_id(), "not-an-email"))
ok(call("admin_transfer_site", kr.get_id(), "Dad@Example.com"))
assert kr["pending_owner"] == "dad@example.com" and kr["owner"] is None
dad = person("dad@example.com", "Dad")
as_user(dad)
assert [s["name"] for s in call("my_sites")["sites"]] == ["Boutique Hotel Kristofs"], "a handed-over site is claimed at sign-in"
assert kr["owner"] == dad and kr["pending_owner"] is None
ok(call("get_site", kr.get_id()))
bad(call("delete_site", kr.get_id()), "owners can't delete the showcase")
as_user(admin)
ok(call("admin_transfer_site", sid, "bob@example.com"))
assert T.sites.get_by_id(sid)["owner"] == bob
ok(call("admin_set_site_status", sid, "published"))
bad(call("admin_set_site_status", sid, "weird"))
ok(call("delete_site", kr.get_id()))
assert T.sites.get(slug="hotel-kristofs") is None
call("public_sites")
assert T.sites.get(slug="hotel-kristofs") is None, "a deleted showcase stays deleted"
ok(call("admin_restore_showcase"))
assert T.sites.get(slug="hotel-kristofs") is not None
ov = call("admin_overview")
assert ov["sites"] >= 4 and ov["published"] >= 3

# ---------------------------------------------------------------------------------- removing the demo keeps the showcase and real sites
ok(call("demo_remove"))
assert M["DemoData"].state() == "removed" and not T.sites.search(is_demo=True) and not T.users.search(is_demo=True)
assert T.sites.get(slug="hotel-kristofs") is not None and T.sites.get_by_id(sid) is not None
as_user(None)
call("public_sites")
assert M["DemoData"].state() == "removed", "removed demo data doesn't come back by itself"
as_user(admin)
ok(call("demo_load"))
ok(call("demo_load"))
assert len(T.sites.search(is_demo=True)) == len(M["showcase_data"].demo_sites()), "reloading replaces the demo instead of doubling it"
assert len(T.site_stats.search(is_demo=True)) == 30 * len(M["showcase_data"].demo_sites())

# ---------------------------------------------------------------------------------- Privacy & Terms
if "legal_server" in M:
    as_user(ana)
    st = call("legal_state")
    assert st["signedIn"] and st["accepted_version"] is None
    ok(call("legal_accept", st["version"], "signup"))
    assert ana["legal_source"] == "signup" and call("legal_state")["accepted_version"] == st["version"]

# ---------------------------------------------------------------------------------- every callable is covered by a permission check
# A callable that changes data without require_user / a C.require_* check is a security hole. List the public ones here.
PUBLIC = {"get_me", "submit_feedback", "public_sites", "legal_state", "legal_accept"}
for name, (f, need) in sorted(anvil.server.CALLABLES.items()):
    if name in PUBLIC:
        continue
    assert need, "%s is callable by anyone: add require_user=True (or list it in PUBLIC in test_server.py)" % name

print("ALL OK (%d server functions)" % len(anvil.server.CALLABLES))
