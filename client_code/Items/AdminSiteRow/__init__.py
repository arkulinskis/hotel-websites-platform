from anvil import *
import anvil.js

from ._anvil_designer import AdminSiteRowTemplate
from ... import ns, router, state


class AdminSiteRow(AdminSiteRowTemplate):
    """A site in Admin -> Sites. item = Admin.admin_sites() row (summary + owner_email). Changes tell the page to reload
    (x-changed)."""

    def __init__(self, **properties):
        super().__init__(**properties)
        s = self.item
        live = s.get("status") == "published"
        st = self.dom_nodes["status"]
        st.className = "ui-badge " + ("good" if live else "")
        st.textContent = s.get("status") or "draft"
        self.showcase_badge.visible = bool(s.get("is_showcase"))
        self.demo_badge.visible = bool(s.get("demo"))
        self.dom_nodes["views"].textContent = state.plural(s.get("views") or 0, "visit")
        self.dom_nodes["edited"].textContent = "Edited " + state.ago(s.get("updated"))
        self.dom_nodes["name"].textContent = s.get("name") or "Untitled"
        self.dom_nodes["city"].textContent = s.get("city") or ""
        if s.get("owner_email"):
            owner = "Owner: %s (%s)" % (s.get("owner"), s["owner_email"])
        elif s.get("pending_owner"):
            owner = "Owner: waiting for " + s["pending_owner"]
        else:
            owner = "Owner: nobody (admins manage it)"
        self.dom_nodes["owner"].textContent = owner
        self.slug_box.visible = bool(s.get("slug"))
        if s.get("slug"):
            state.set_attr(self.slug_link, "href", ns.site_url(s["slug"]))
            anvil.js.get_dom_node(self.slug_link).textContent = "/s/" + s["slug"]
        state.set_attr(self.edit_link, "href", router.href("edit", s["id"]))
        self.status_button.text = "Unpublish" if live else "Publish"

    def _changed(self):
        if self.parent is not None:
            self.parent.raise_event("x-changed")

    @handle("transfer_button", "click")
    def transfer_button_click(self, **event_args):
        from ...Dialogs.Transfer import Transfer
        if alert(Transfer(site_id=self.item["id"]), buttons=[], role="app-dialog", dismissible=True):
            self._changed()

    @handle("status_button", "click")
    def status_button_click(self, **event_args):
        new = "draft" if self.item.get("status") == "published" else "published"
        if state.call("admin_set_site_status", self.item["id"], new):
            state.toast("Saved", "ok")
            self._changed()

    @handle("delete_button", "click")
    def delete_button_click(self, **event_args):
        if ns.ask("Delete this site?", "Its photos and visit counts are deleted too.", "Delete"):
            if state.call("delete_site", self.item["id"]):
                state.toast("Deleted")
                self._changed()
