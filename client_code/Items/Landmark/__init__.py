from anvil import *

from ._anvil_designer import LandmarkTemplate


class Landmark(LandmarkTemplate):
    """A landmark with a Wikipedia photo, from the scan. item = {name, thumb, walk}."""

    def __init__(self, **properties):
        super().__init__(**properties)
        self.dom_nodes["img"].src = self.item.get("thumb") or ""
        self.dom_nodes["name"].textContent = self.item.get("name") or ""
        self.dom_nodes["walk"].textContent = "%s min walk" % (self.item.get("walk") or "?")
