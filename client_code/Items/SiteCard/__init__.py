from anvil import *
import anvil.js

from ._anvil_designer import SiteCardTemplate
from ... import ns, router, state


class SiteCard(SiteCardTemplate):
    """A hotel site on #sites. item = Sites.summary() (id, name, city, slug, status, url, cover, palette, updated, views,
    unpublished_changes, owner, pending_owner, is_showcase, demo, mine), or {"new": True} for the "Create" card."""

    def __init__(self, **properties):
        super().__init__(**properties)
        s = self.item
        self.new_card.visible = bool(s.get("new"))
        self.card.visible = not s.get("new")
        if s.get("new"):
            return
        live = s.get("status") == "published"
        self.cover.style["background-image"] = ns.cover_css(s.get("cover"))
        self.cover.classes["empty"] = not s.get("cover")
        self.lily.visible = not s.get("cover")
        st = self.dom_nodes["status"]
        st.className = "ui-badge " + ("good" if live else "")
        st.textContent = "Live" if live else "Draft"
        ns.fill_swatches(self.dom_nodes["swatch"], s.get("palette"))
        self.dom_nodes["name"].textContent = s.get("name") or "Untitled"
        self.demo_badge.visible = bool(s.get("demo"))
        self.showcase_badge.visible = bool(s.get("is_showcase"))
        self.city_box.visible = bool(s.get("city"))
        self.dom_nodes["city"].textContent = s.get("city") or ""
        self.dom_nodes["edited"].textContent = "Edited " + state.ago(s.get("updated"))
        self.views_box.visible = live
        self.dom_nodes["views"].textContent = state.plural(s.get("views") or 0, "visit")
        owner = ""
        if s.get("owner") and not s.get("mine"):
            owner = "Owner: " + s["owner"]
        elif not s.get("owner"):
            owner = ("Waiting for %s to sign up" % s["pending_owner"]) if s.get("pending_owner") else "No owner yet (admins manage it)"
        self.owner_box.visible = bool(owner)
        self.dom_nodes["owner"].textContent = owner
        url = s.get("url")
        self.link.visible = self.view_link.visible = self.copy_button.visible = bool(url)
        if url:
            state.set_attr(self.link, "href", url)
            state.set_attr(self.view_link, "href", url)
            anvil.js.get_dom_node(self.link).textContent = ns.short_url(url)
        self.changes.visible = bool(s.get("unpublished_changes"))
        state.set_attr(self.edit_link, "href", router.href("edit", s["id"]))
        state.set_attr(self.edit_link, "aria-label", "Edit " + (s.get("name") or "site"))

    @handle("copy_button", "click")
    def copy_button_click(self, **event_args):
        ns.copy_text(self.item.get("url") or "")
