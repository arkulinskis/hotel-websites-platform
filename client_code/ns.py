"""ns: the Python side of ArviStay's JavaScript engines.

The engines stay JavaScript (they draw, read files or talk to map services in the browser):
  theme/assets/ns-site.js    window.NSSite  the hotel-site renderer (also every hosted site and every export)
  theme/assets/ns-app.js     window.NSApp   uploads, the preview document, exports, the wizard's starter site, JSON helpers;
                             window.NSScan  address search + neighbourhood scan; the small window.UI helpers they use
  theme/assets/ns-editor.js  window.NSEd    the editor's field panels, the live preview, the visits chart
install() gives them window.NS_HOST (server calls, uploads, toasts, confirm). The helpers below return plain Python
values: JSON text crosses the border, so no JavaScript proxies leak into the Forms.
"""
import json

import anvil.js
import anvil.server
from anvil import confirm
from anvil.js import window

from . import state

# Server functions the engines may call themselves; every other call is made by a Form.
ENGINE_CALLS = ("list_media", "delete_media", "upload_media")


def install():
    """Once, at start-up (startup.py)."""
    window.APP_API = anvil.server.get_api_origin()  # hosted sites <api>/s/<slug>, uploads <api>/m/<key>
    host = window.Object()
    host.call = _call
    host.upload = _upload
    host.toast = _toast
    host.confirm = _confirm
    window.NS_HOST = host


def _err(e):
    return json.dumps({"error": str(e) or "That didn't work. Please try again."})


def _call(fn, args_json, quiet):
    if fn not in ENGINE_CALLS:
        return json.dumps({"error": "Not allowed: %s" % fn})
    try:
        args = json.loads(args_json or "[]")
        r = anvil.server.call_s(fn, *args) if quiet else anvil.server.call(fn, *args)
        return json.dumps({"result": r})
    except Exception as e:
        return _err(e)


def _upload(fn, file, args_json):
    """The browser File becomes Anvil Media (streamed, no JSON copy of the bytes)."""
    if fn not in ENGINE_CALLS:
        return json.dumps({"error": "Not allowed: %s" % fn})
    try:
        media = anvil.js.to_media(file)
        return json.dumps({"result": anvil.server.call_s(fn, media, *json.loads(args_json or "[]"))})
    except Exception as e:
        return _err(e)


def _toast(msg, kind):
    state.toast(msg, kind or None)


def _confirm(title, text, ok, danger):
    return bool(confirm(text or "", title=title, buttons=[("Cancel", False), (ok or "OK", True)], role="app-dialog"))


def ask(title, text="", ok="OK"):
    """Yes/no in Anvil's dialog, worded like the old app."""
    return bool(confirm(text, title=title, buttons=[("Cancel", False), (ok, True)], role="app-dialog"))


def _loose(x):
    return x


# ---------------------------------------------------------------- the renderer's catalogues, as Python values
def palettes():
    return json.loads(window.NSApp.json.palettes())


def fonts():
    return json.loads(window.NSApp.json.fonts())


def features():
    return json.loads(window.NSApp.json.features())


def persona(pid):
    return json.loads(window.NSApp.json.persona(pid))


def rank(data):
    """All 30 guest profiles, best fit first: [{id, name, line, icon (svg), score}]."""
    return json.loads(window.NSApp.json.rank(json.dumps(data)))


def scan_summary(data):
    return json.loads(window.NSApp.json.scanSummary(json.dumps(data)))


def new_site_data(facts):
    return json.loads(window.NSApp.json.newSiteData(json.dumps(facts)))


# ---------------------------------------------------------------- addresses and small things
def media_url(ref):
    return str(window.UI.mediaUrl(ref or ""))


def cover_css(ref):
    return 'url("%s")' % media_url(ref).replace('"', "%22") if ref else ""


def site_url(slug):
    return str(window.UI.siteUrl(slug))


def short_url(url):
    return (url or "").replace("https://", "").replace("http://", "")


def swatches(key):
    """The palette's five colours (bg, surface, brand, accent, deep)."""
    c = json.loads(window.NSApp.json.swatch(key or "riga"))
    return [c.get(k) for k in ("bg", "surface", "brand", "accent", "deep")]


def copy_text(text):
    try:
        window.navigator.clipboard.writeText(text)
    except Exception:
        pass
    state.toast("Link copied", "ok")


def fill_swatches(node, key):
    """Draw the palette swatches into a <span class="nsa-sw"> node."""
    node.innerHTML = ""
    for colour in swatches(key):
        i = _loose(window.document.createElement("i"))
        i.style.background = colour or ""
        node.appendChild(i)


def svg_icon(node, svg):
    """Engine-made SVG icons (guest profiles) into an empty node."""
    node.innerHTML = svg or ""
