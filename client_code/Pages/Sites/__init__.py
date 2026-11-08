from anvil import *

from ._anvil_designer import SitesTemplate
from ... import state


def _loose(x):
    """Untyped on purpose (the validator would pin None / literal types)."""
    return x


class Sites(SitesTemplate):
    """#sites (the owner's home): their hotel sites as cards (cover, status, link, visits), a "Create a hotel site"
    card while they have room for more, and for admins the sites they manage (the Hotel Kristofs showcase, others')."""

    def __init__(self, args=(), **properties):
        super().__init__(**properties)
        state.heading(self.hello, 1)
        me = state.me() or {}
        d = _loose(state.call("my_sites") or {"sites": [], "managed": [], "max": 0})
        first = (me.get("name") or "there").split(" ")[0]
        self.hello.text = "Hello, %s" % first
        self.sub.text = ("Pick a site to edit, or start a new one." if d["sites"]
                         else "Let's make your first hotel website. It takes about two minutes to start.")
        items = list(d["sites"])
        if len(d["sites"]) < d.get("max", 0):
            items.append({"new": True})
        self.sites_panel.items = items
        self.managed_box.visible = bool(d["managed"])
        self.managed_panel.items = d["managed"]
