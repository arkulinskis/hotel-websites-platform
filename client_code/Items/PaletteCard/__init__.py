from anvil import *

from ._anvil_designer import PaletteCardTemplate


class PaletteCard(PaletteCardTemplate):
    """One of the six hotel-site palettes (ns-site.js PALETTES). item = {key, name, note, c: {bg, ink, brand, ...}, on}."""

    def __init__(self, **properties):
        super().__init__(**properties)
        c = self.item.get("c") or {}
        aa = self.dom_nodes["aa"]
        aa.style.background = c.get("bg") or ""
        aa.style.color = c.get("ink") or ""
        self.dom_nodes["bands"].style.background = "linear-gradient(%s 0 50%%, %s 50%% 75%%, %s 75%%)" % (
            c.get("brand"), c.get("accent"), c.get("deep"))
        self.dom_nodes["name"].textContent = self.item.get("name") or ""
        self.dom_nodes["note"].textContent = self.item.get("note") or ""
        self.dom_nodes["radio"].checked = bool(self.item.get("on"))
        self.dom_nodes["radio"].setAttribute("aria-label", self.item.get("name") or "")

    def radio_change(self, event):
        if self.parent is not None and self.dom_nodes["radio"].checked:
            self.parent.raise_event("x-pal", key=self.item["key"])
