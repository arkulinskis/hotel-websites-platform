from anvil import *
from anvil.js import window

from ._anvil_designer import SitePreviewTemplate


class SitePreview(SitePreviewTemplate):
    """The live preview: an iframe drawn by the hotel-site renderer (ns-site.js), in desktop / tablet / phone sizes
    (NSEd.preview in ns-editor.js). start(on_message) returns {push(data, now), post(msg), fit(device), destroy()};
    on_message gets JSON {type, section} from the preview ("ns-edit" when someone presses Edit on a section)."""

    def __init__(self, **properties):
        super().__init__(**properties)
        self._pv = None

    def start(self, on_message):
        if self._pv is None:
            self._pv = window.NSEd.preview(self.dom_nodes["box"], on_message)
        return self._pv
