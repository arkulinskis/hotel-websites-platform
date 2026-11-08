from anvil import *
from anvil.js import window

from ._anvil_designer import EditorPanelTemplate


class EditorPanel(EditorPanelTemplate):
    """The editor's field panels: the NSEd engine (theme/assets/ns-editor.js). start() mounts it and returns the
    engine handle (draw(tab), dataJson(), get/set(path), setSite, setPersona, setPreview, top()); hooks are the
    page's Python functions the engine calls (changed, tab, persona, library, previewMsg)."""

    def __init__(self, **properties):
        super().__init__(**properties)
        self._ed = None

    def start(self, data_json, site_json, hooks):
        self.stop()
        h = window.Object()
        for k, fn in hooks.items():
            h[k] = fn
        self._ed = window.NSEd.create(self.dom_nodes["box"], data_json, site_json, h)
        return self._ed

    def stop(self):
        if self._ed is not None:
            self._ed.destroy()
            self._ed = None
