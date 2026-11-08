from anvil import *

from ._anvil_designer import CatCountTemplate


class CatCount(CatCountTemplate):
    """How many places of one kind the scan found. item = {c, n, label, color}."""

    def __init__(self, **properties):
        super().__init__(**properties)
        n = self.item.get("n") or 0
        self.dom_nodes["dot"].style.background = self.item.get("color") or ""
        self.dom_nodes["n"].textContent = "30+" if n >= 30 else str(n)
        self.dom_nodes["label"].textContent = self.item.get("label") or ""
