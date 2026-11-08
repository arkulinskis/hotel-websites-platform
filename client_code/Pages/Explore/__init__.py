from anvil import *

from ._anvil_designer import ExploreTemplate
from ... import state


class Explore(ExploreTemplate):
    """#explore (anyone): every published hotel site; a card opens the hosted site (<api>/s/<slug>) in a new tab."""

    def __init__(self, args=(), **properties):
        super().__init__(**properties)
        d = state.call("public_sites") or {"sites": []}
        self.sites_panel.items = d["sites"]
        self.empty.visible = not d["sites"]
        self.guest_cta.visible = not state.me()
