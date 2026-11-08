from anvil import *

from ._anvil_designer import ExploreCardTemplate
from ... import ns, state


class ExploreCard(ExploreCardTemplate):
    """A published site on #explore. item = Sites.public_sites() row (name, city, area, url, tagline, cover, stars,
    places, rooms, demo, showcase)."""

    def __init__(self, **properties):
        super().__init__(**properties)
        s = self.item
        state.set_attr(self.card, "href", s.get("url") or "#explore")
        state.set_attr(self.card, "aria-label", "%s, opens in a new tab" % (s.get("name") or "Hotel"))
        self.cover.style["background-image"] = ns.cover_css(s.get("cover"))
        b = self.dom_nodes["badge"]
        b.textContent = "Showcase" if s.get("showcase") else ("Demo" if s.get("demo") else "")
        b.className = "ui-badge brand" if s.get("showcase") else "ui-badge"
        b.hidden = not (s.get("showcase") or s.get("demo"))
        n = int(s.get("stars") or 0)
        self.dom_nodes["stars"].textContent = "★" * n
        self.dom_nodes["stars"].hidden = not n
        self.dom_nodes["name"].textContent = s.get("name") or ""
        self.dom_nodes["tagline"].textContent = s.get("tagline") or ", ".join([x for x in (s.get("area"), s.get("city")) if x])
        self.dom_nodes["city"].textContent = s.get("city") or ""
        self.dom_nodes["places"].textContent = "%d places nearby" % (s.get("places") or 0)
        self.rooms_box.visible = bool(s.get("rooms"))
        self.dom_nodes["rooms"].textContent = state.plural(s.get("rooms") or 0, "room")
