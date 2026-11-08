from anvil import *

from ._anvil_designer import EdTabTemplate


class EdTab(EdTabTemplate):
    """A tab in the editor's rail. item = {id, label, icon, on}."""

    def __init__(self, **properties):
        super().__init__(**properties)
        it = self.item
        b = self.dom_nodes["btn"]
        self.dom_nodes["icon"].classList.add("ic-" + it["icon"])
        self.dom_nodes["label"].textContent = it["label"]
        b.classList.toggle("on", bool(it.get("on")))
        b.setAttribute("data-key", it["id"])
        if it.get("on"):
            b.setAttribute("aria-current", "page")

    def btn_click(self, event):
        if self.parent is not None:
            self.parent.raise_event("x-tab", tab=self.item["id"])
