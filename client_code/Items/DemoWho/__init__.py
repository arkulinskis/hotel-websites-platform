from anvil import *

from ._anvil_designer import DemoWhoTemplate
from ... import ns


class DemoWho(DemoWhoTemplate):
    """One guest profile in the landing page's demo. item = {id, name, line, icon (svg), on}."""

    def __init__(self, **properties):
        super().__init__(**properties)
        it = self.item
        ns.svg_icon(self.dom_nodes["icon"], it.get("icon"))
        self.dom_nodes["name"].textContent = it.get("name") or ""
        self.dom_nodes["line"].textContent = it.get("line") or ""
        btn = self.dom_nodes["btn"]
        btn.classList.toggle("on", bool(it.get("on")))
        btn.setAttribute("aria-pressed", "true" if it.get("on") else "false")
        btn.setAttribute("data-key", it["id"])

    def btn_click(self, event):
        parent = self.parent
        if parent is not None:
            parent.raise_event("x-pick", key=self.item["id"])
