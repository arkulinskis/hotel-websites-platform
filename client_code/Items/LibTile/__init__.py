from anvil import *

from ._anvil_designer import LibTileTemplate


class LibTile(LibTileTemplate):
    """A photo or video in the library dialog. item = {ref, url, video, on}; multi-pick toggles "on"."""

    def __init__(self, **properties):
        super().__init__(**properties)
        it = self.item
        b = self.dom_nodes["btn"]
        if it.get("video"):
            b.classList.add("vid")
        else:
            b.style.backgroundImage = 'url("%s")' % (it.get("url") or "").replace('"', "%22")
        b.setAttribute("aria-label", ("Video " if it.get("video") else "Photo ") + (it.get("ref") or "")[:60])
        b.setAttribute("aria-pressed", "false")

    def btn_click(self, event):
        self.item["on"] = not self.item.get("on")
        b = self.dom_nodes["btn"]
        b.classList.toggle("on", bool(self.item["on"]))
        b.setAttribute("aria-pressed", "true" if self.item["on"] else "false")
        if self.parent is not None:
            self.parent.raise_event("x-tile", ref=self.item["ref"])
