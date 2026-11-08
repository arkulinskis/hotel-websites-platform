from anvil import *

from ._anvil_designer import PersonaPickTemplate
from ... import ns


class PersonaPick(PersonaPickTemplate):
    """A guest profile in the wizard, with how well the area suits it. item = {id, name, icon (svg), score, on}."""

    def __init__(self, **properties):
        super().__init__(**properties)
        it = self.item
        ns.svg_icon(self.dom_nodes["icon"], it.get("icon"))
        self.dom_nodes["name"].textContent = it.get("name") or ""
        score = float(it.get("score") or 0)
        self.dom_nodes["bar"].style.setProperty("--w", "%d%%" % round(score * 10))
        self.dom_nodes["score"].textContent = "%.1f" % score
        self.dom_nodes["box"].checked = bool(it.get("on"))
        self.dom_nodes["row"].classList.toggle("on", bool(it.get("on")))

    def box_change(self, event):
        on = bool(self.dom_nodes["box"].checked)
        self.item["on"] = on
        self.dom_nodes["row"].classList.toggle("on", on)
        if self.parent is not None:
            self.parent.raise_event("x-toggle", pid=self.item["id"], on=on)
