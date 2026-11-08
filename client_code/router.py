"""Page addresses: #name/arg1/arg2 -> a page Form (open_form), with sign-in rules. Same addresses as the JavaScript
version, so links people saved keep working (#sites, #new, #edit/<id>/<tab>, #explore, #admin/<tab>, #auth/signup).

Links in templates are plain <a href="#sites">; code calls router.go("edit", site_id).

    PAGES[name] = (who may open it, browser-tab title)   who: None = anyone, "guest" = signed out only, "user", "admin"
    NAV = the main menu (header + phone tab bar, signed-in people): (page, label, icon). At most 4.
New page: add it to PAGES, to _form() and (if it belongs in the menu) to NAV. A page with leave() is told when the
visitor goes elsewhere (the editor saves and stops its engines there).
"""
import anvil
import anvil.js
from anvil.js import window

from . import state

PAGES = {
    "landing": (None, "Hotel websites that sell the stay"),
    "auth": ("guest", "Sign in"),
    "sites": ("user", "Your sites"),
    "new": ("user", "New site"),
    "edit": ("user", "Edit site"),
    "explore": (None, "Explore hotels"),
    "profile": ("user", "Your profile"),
    "admin": ("admin", "Admin"),
}
NAV = [("sites", "Sites", "home"), ("explore", "Explore", "globe")]
HOME = "sites"
APP_NAME = "ArviStay"
_r: dict = {"after": "", "listening": False, "page": None}


def _form(name):
    """The page's Form class (imported when first needed, so start-up stays quick)."""
    if name == "landing":
        from .Pages.Landing import Landing
        return Landing
    if name == "auth":
        from .Pages.Auth import Auth
        return Auth
    if name == "sites":
        from .Pages.Sites import Sites
        return Sites
    if name == "new":
        from .Pages.New import New
        return New
    if name == "edit":
        from .Pages.Edit import Edit
        return Edit
    if name == "explore":
        from .Pages.Explore import Explore
        return Explore
    if name == "profile":
        from .Pages.Profile import Profile
        return Profile
    from .Pages.Admin import Admin
    return Admin


def parse(hash_text):
    h = (hash_text or "").lstrip("#").lstrip("!").lstrip("/").split("?")[0]
    parts = [window.decodeURIComponent(p) for p in h.split("/") if p]
    return (parts[0] if parts else ""), parts[1:]


def href(name, *args):
    """'#name/arg1/arg2' with every part URL-encoded (row ids contain brackets and commas)."""
    return "#" + "/".join([name] + [window.encodeURIComponent(str(a)) for a in args if a not in (None, "")])


def home_page():
    return HOME if state.me() else "landing"


def show():
    """Open the page for the current address."""
    name, args = parse(window.location.hash)
    if name not in PAGES:
        name, args = home_page(), []
    who = PAGES[name][0]
    if who == "guest" and state.me():
        name, args = HOME, []
    elif who in ("user", "admin") and not state.me():
        _r["after"] = window.location.hash
        name, args = "auth", []
    elif who == "admin" and not state.is_admin():
        state.toast("That page is for admins only.", "error")
        name, args = HOME, []
    old = _r["page"]
    if old is not None and hasattr(old, "leave"):
        old.leave()
    window.document.title = PAGES[name][1] + " · " + APP_NAME
    window.UI_READY = False
    page = _form(name)(args=args)
    _r["page"] = page
    anvil.open_form(page)
    shell = getattr(page, "layout", None)
    if shell is not None and hasattr(shell, "refresh"):
        shell.refresh(name)  # Anvil reuses the layout between pages: tell it who is signed in and which page is open
    window.scrollTo(0, 0)
    window.UI_READY = True  # tests and screenshots wait for this


def go(name, *args):
    """Go to a page. Same address again = reload the page."""
    target = href(name, *args)
    if window.location.hash == target:
        show()
    else:
        window.location.hash = target


def replace(name, *args):
    """Change the address without opening anything (a page that switches its own view)."""
    window.history.replaceState(None, "", href(name, *args))


def after_sign_in():
    """Where to go once someone signs in: the page they were heading for, or their sites."""
    target = _r["after"]
    _r["after"] = ""
    if target and target != window.location.hash:
        window.location.hash = target
    else:
        go(HOME)


def remember_after(target):
    _r["after"] = target


def _on_hash(event):
    show()


def start():
    if not _r["listening"]:
        window.addEventListener("hashchange", anvil.js.report_exceptions(_on_hash))
        _r["listening"] = True
    show()
