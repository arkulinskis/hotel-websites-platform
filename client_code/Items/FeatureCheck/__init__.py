from anvil import *

from ._anvil_designer import FeatureCheckTemplate


class FeatureCheck(FeatureCheckTemplate):
    """An amenity tick box (ns-site.js FEATURES). item = {key, label, on}."""

    def __init__(self, **properties):
        super().__init__(**properties)
        self.box.text = self.item.get("label") or ""
        self.box.checked = bool(self.item.get("on"))

    @handle("box", "change")
    def box_change(self, **event_args):
        if self.parent is not None:
            self.parent.raise_event("x-feat", key=self.item["key"], on=bool(self.box.checked))
