from anvil import *

from ._anvil_designer import AddrResultTemplate


class AddrResult(AddrResultTemplate):
    """An address the search found. item = {label, lat, lng, city, country, area, i, on}."""

    def __init__(self, **properties):
        super().__init__(**properties)
        self.dom_nodes["label"].textContent = self.item.get("label") or ""
        self.dom_nodes["btn"].classList.toggle("on", bool(self.item.get("on")))
        self.dom_nodes["btn"].setAttribute("aria-pressed", "true" if self.item.get("on") else "false")

    def btn_click(self, event):
        if self.parent is not None:
            self.parent.raise_event("x-pick", i=self.item["i"])
