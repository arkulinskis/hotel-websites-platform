import json

from anvil import *
import anvil.js
import anvil.server
from anvil.js import window

from ._anvil_designer import PublishPanelTemplate
from ... import ns, router, state


def _loose(x):
    """Untyped on purpose (the validator would pin None / literal types)."""
    return x


class PublishPanel(PublishPanelTemplate):
    """The editor's Publish tab: the address (check_slug as you type), publish / unpublish / copy, the visits chart
    (site_stats, drawn by NSEd.statsHtml), search-engine texts (seo.* in the site JSON), downloads (NSApp.exportSite),
    duplicate and delete. setup(page) links it to the Edit page (site, ed engine, save())."""

    def __init__(self, **properties):
        super().__init__(**properties)
        self.page = _loose(None)
        self._slug_timer = None
        self._bound = False
        state.set_control_attr(self.seo_desc, "maxlength", 300)
        state.set_control_attr(self.slug_box, "maxlength", 60)
        state.set_control_attr(self.slug_box, "aria-label", "Your address")

    def setup(self, page):
        self.page = page

    def refresh(self):
        p = self.page
        if p is None or p.ed is None:
            return
        site = p.site
        live = site.get("status") == "published"
        self.slug_box.text = site.get("slug") or ""
        self.live_line.visible = live
        if live:
            state.set_attr(self.live_link, "href", site.get("url"))
            self.dom_nodes["live_text"].textContent = " " + ns.short_url(site.get("url"))
        self.publish_button.text = ("Publish my changes" if site.get("unpublished_changes") else "Publish again") if live else "Publish my site"
        self.copy_button.visible = self.unpublish_button.visible = live
        self.pending_note.visible = bool(live and site.get("unpublished_changes"))
        hotel_name = p.ed.get("hotel.name")
        self.seo_title.placeholder = "%s · %s" % (hotel_name, p.ed.get("hotel.city"))
        self.seo_title.text = p.ed.get("seo.title")
        self.seo_desc.text = p.ed.get("seo.description")
        box = self.dom_nodes["stats"]
        has = live or bool(site.get("views"))
        self.stats_note.visible = not has
        box.innerHTML = '<div class="ui-skel ed-skel"></div>' if has else ""
        if has:
            r = state.call_quiet("site_stats", p.site_id, 30)
            if r and r.get("ok"):
                box.innerHTML = window.NSEd.statsHtml(json.dumps(r))
                if not self._bound:
                    window.NSEd.statsBind(box)
                    self._bound = True
            else:
                box.innerHTML = ""

    # ---------------------------------------------------------------- address
    @handle("slug_box", "change")
    def slug_box_change(self, **event_args):
        if self._slug_timer:
            window.clearTimeout(self._slug_timer)
        self._slug_timer = window.setTimeout(self._check_slug, 350)

    def _check_slug(self):
        self._slug_timer = None
        r = state.call_quiet("check_slug", self.slug_box.text or "", self.page.site_id)
        if not r:
            return
        self.slug_hint.text = ("Free: …/s/" + r["slug"]) if r.get("free") else (r.get("problem") or "")
        self.slug_hint.role = ["ed-hint", "ed-hint-ok" if r.get("free") else "ed-hint-bad"]

    # ---------------------------------------------------------------- publish
    @handle("publish_button", "click")
    def publish_button_click(self, **event_args):
        p = self.page
        self.publish_button.enabled = False
        try:
            p.save()
            r = state.call("publish_site", p.site_id, self.slug_box.text or None)
        finally:
            self.publish_button.enabled = True
        if not r:
            return
        p.set_site(r["site"])
        self.refresh()
        from ...Dialogs.Published import Published
        alert(Published(url=r["site"]["url"]), buttons=[], role="app-dialog", dismissible=True)

    @handle("unpublish_button", "click")
    def unpublish_button_click(self, **event_args):
        if not ns.ask("Unpublish the site?", "The link stops working until you publish again.", "Unpublish"):
            return
        r = state.call("unpublish_site", self.page.site_id)
        if r:
            self.page.set_site(r["site"])
            self.refresh()
            state.toast("Unpublished.")

    @handle("copy_button", "click")
    def copy_button_click(self, **event_args):
        ns.copy_text(self.page.site.get("url") or "")

    # ---------------------------------------------------------------- search engines
    @handle("seo_title", "change")
    def seo_title_change(self, **event_args):
        self.page.ed.set("seo.title", self.seo_title.text or "")

    @handle("seo_desc", "change")
    def seo_desc_change(self, **event_args):
        self.page.ed.set("seo.description", self.seo_desc.text or "")

    # ---------------------------------------------------------------- downloads
    def _export(self, single, button):
        p = self.page
        button.enabled = False
        try:
            p.save()
            r = window.NSApp.exportSite(p.ed.data(), p.site.get("slug") or "hotel", {"single": single})
            state.toast("Downloaded: %s, %.1f MB." % (state.plural(int(r.files), "file"), float(r.bytes) / 1048576), "ok")
        except Exception as e:
            state.toast("Export failed: %s" % e, "error")
        finally:
            button.enabled = True

    @handle("zip_button", "click")
    def zip_button_click(self, **event_args):
        self._export(False, self.zip_button)

    @handle("html_button", "click")
    def html_button_click(self, **event_args):
        self._export(True, self.html_button)

    # ---------------------------------------------------------------- more
    @handle("dup_button", "click")
    def dup_button_click(self, **event_args):
        self.page.save()
        r = state.call("duplicate_site", self.page.site_id)
        if r:
            state.toast("Copy made.", "ok")
            router.go("edit", r["id"])

    @handle("delete_button", "click")
    def delete_button_click(self, **event_args):
        if not ns.ask("Delete this site?", "The site, its photos and its visit counts are deleted for good.", "Delete"):
            return
        self.page.mark_saved()
        if state.call("delete_site", self.page.site_id):
            state.toast("Deleted.")
            router.go("sites")
