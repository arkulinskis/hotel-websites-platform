from anvil import *
from anvil.js import window

from ._anvil_designer import HotelMapTemplate


class HotelMap(HotelMapTemplate):
    """The wizard's map with the hotel pin: NSSite.Map (MapLibre 3D, or the flat fallback) from ns-site.js.
    show(lat, lng, name) draws it (again); it mounts once the component is on the page, because MapLibre needs a size."""

    def __init__(self, **properties):
        super().__init__(**properties)
        self._map = None
        self._want = None
        self._shown = False

    def show(self, lat, lng, name):
        self._want = (lat, lng, name)
        if self._shown:
            self._mount()

    def _mount(self):
        self._destroy()
        if not self._want:
            return
        lat, lng, name = self._want
        no_map = bool(getattr(window, "NS_NO_MAP", False))
        self._map = window.NSSite.Map(self.dom_nodes["box"], {
            "hotel": {"lat": lat, "lng": lng, "name": name}, "palette": window.NSSite.PALETTES.riga,
            "name": name or "Your hotel", "noMap": no_map})
        if self._map:
            self._map.setPlaces([])

    def _destroy(self):
        if self._map:
            try:
                self._map.destroy()
            except Exception:
                pass
            self._map = None

    @handle("", "show")
    def form_show(self, **event_args):
        self._shown = True
        if self._want:
            self._mount()

    @handle("", "hide")
    def form_hide(self, **event_args):
        self._shown = False
        self._destroy()
