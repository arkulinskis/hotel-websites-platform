"""Photos, videos and 360-degree panoramas for a site.

The browser shrinks photos before uploading (long side 2000 px, panoramas 4096 px, JPEG). Files are stored as
Media in the `media` table under a random key and served at <app>/_/api/m/<key> (keys are unguessable; the hosted
sites, the editor preview and exported sites all load them from there). In the site JSON a file is "m:<key>".
"""
import secrets

import anvil.server
from anvil.tables import app_tables
import anvil.tables as tables

from . import common as C
from . import Sites

LIMITS = {"image": 9 * 1024 * 1024, "pano": 16 * 1024 * 1024, "video": 60 * 1024 * 1024}
TYPES = {"image": ("image/jpeg", "image/png", "image/webp", "image/gif"), "pano": ("image/jpeg", "image/png", "image/webp"),
         "video": ("video/mp4", "video/webm", "video/quicktime")}


def _item(m):
    return {"key": m["key"], "ref": "m:" + m["key"], "kind": m["kind"], "name": m["name"] or "", "mime": m["mime"] or "",
            "bytes": int(m["bytes"] or 0), "width": m["width"], "height": m["height"], "created": C.iso(m["created"])}


@anvil.server.callable(require_user=True)
def upload_media(media, site_id, kind="image", meta=None):
    site, user = Sites.get_editable(site_id)
    if site is None:
        return C.fail("That site doesn't exist, or it isn't yours.")
    if kind not in LIMITS:
        return C.fail("Unknown kind of file.")
    if media is None or not hasattr(media, "get_bytes"):
        return C.fail("No file arrived. Please try again.")
    mime = (getattr(media, "content_type", "") or "").split(";")[0].strip().lower()
    if mime not in TYPES[kind]:
        return C.fail("This file type isn't supported here (%s). Use %s." % (mime or "unknown", ", ".join(t.split("/")[1].upper() for t in TYPES[kind])))
    size = getattr(media, "length", None)
    if size is None:
        size = len(media.get_bytes())
    if size > LIMITS[kind]:
        return C.fail("This file is too big (%.0f MB). The limit is %d MB." % (size / 1048576.0, LIMITS[kind] // 1048576))
    if C.rate_limited("upload", 300, 3600):
        return C.fail("That's a lot of uploads in one hour. Please wait a little.")
    meta = meta if isinstance(meta, dict) else {}
    key = secrets.token_urlsafe(18)
    m = app_tables.media.add_row(key=key, site=site, owner=user, kind=kind, file=media, name=C.text(meta.get("name") or getattr(media, "name", "") or "", 120),
                                 mime=mime, bytes=size, width=meta.get("width") if isinstance(meta.get("width"), (int, float)) else None,
                                 height=meta.get("height") if isinstance(meta.get("height"), (int, float)) else None, created=C.now(), is_demo=False)
    return C.ok(item=_item(m))


@anvil.server.callable(require_user=True)
def list_media(site_id):
    site, user = Sites.get_editable(site_id)
    if site is None:
        return C.fail("That site doesn't exist, or it isn't yours.")
    rows = app_tables.media.search(tables.order_by("created", ascending=False), site=site)
    return C.ok(items=[_item(m) for m in rows])


@anvil.server.callable(require_user=True)
def delete_media(key):
    user = C.require_user()
    m = app_tables.media.get(key=key) if isinstance(key, str) and key else None
    if m is None:
        return C.ok()
    if not (C.is_admin(user) or m["owner"] == user or (m["site"] is not None and Sites.can_edit(m["site"], user))):
        return C.fail("You can only delete your own files.")
    m.delete()
    return C.ok()


@anvil.server.http_endpoint("/m/:key")
def serve(key, **kw):
    m = app_tables.media.get(key=key) if isinstance(key, str) and 10 <= len(key) <= 40 else None
    if m is None or m["file"] is None:
        return anvil.server.HttpResponse(404, "Not found")
    return anvil.server.HttpResponse(200, m["file"], headers={"Cache-Control": "public, max-age=31536000, immutable",
                                                             "Content-Type": m["mime"] or m["file"].content_type,
                                                             "Access-Control-Allow-Origin": "*"})
