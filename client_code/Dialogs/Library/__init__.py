from anvil import *

from ._anvil_designer import LibraryTemplate
from ... import state


class Library(LibraryTemplate):
    """Pick photos (or a video) for a field: the site's uploads first, then photos already on the site and from the
    neighbourhood. Closes with a list of refs ("m:<key>", "a:<file>", a URL), [] for nothing, or "upload" when the
    owner wants to upload new files (the editor engine then opens the file picker)."""

    def __init__(self, kind="image", multi=False, refs=None, **properties):
        super().__init__(**properties)
        self.multi = multi
        self.chosen = []
        refs = refs or []
        self.title.text = "Choose a video" if kind == "video" else ("Choose photos" if multi else "Choose a photo")
        state.heading(self.title, 2)
        self.note.text = ("Your uploads first, then photos already on your site and from the neighbourhood." if refs
                          else "Nothing here yet: upload something.")
        self.items = [dict(r, on=False) for r in refs]
        self.tiles_panel.items = self.items
        self.tiles_panel.add_event_handler("x-tile", self._tile)
        self.add_button.visible = multi

    def _tile(self, ref, **event_args):
        if not self.multi:
            self.raise_event("x-close-alert", value=[ref])
            return
        if ref in self.chosen:
            self.chosen.remove(ref)
        else:
            self.chosen.append(ref)
        self.add_button.text = "Add (%d)" % len(self.chosen) if self.chosen else "Add"

    @handle("upload_button", "click")
    def upload_button_click(self, **event_args):
        self.raise_event("x-close-alert", value="upload")

    @handle("cancel_button", "click")
    def cancel_button_click(self, **event_args):
        self.raise_event("x-close-alert", value=[])

    @handle("add_button", "click")
    def add_button_click(self, **event_args):
        self.raise_event("x-close-alert", value=list(self.chosen))
