import json

from anvil import *
import anvil.js
import anvil.server
from anvil.js import window

from ._anvil_designer import EditTemplate
from ... import ns, router, state

# (id, label, icon): the same tabs as ns-editor.js TABS; "publish" is Components/PublishPanel, the others NSEd panels
TABS = [('start', 'Overview', 'grid'), ('basics', 'Hotel', 'home'), ('look', 'Look', 'sparkle'), ('texts', 'Texts', 'edit'), ('rooms', 'Rooms', 'bed'), ('media', 'Media', 'image'), ('area', 'Area', 'map'), ('guests', 'Guests', 'users'), ('booking', 'Booking', 'calendar'), ('publish', 'Publish', 'globe')]
TAB_IDS = [t[0] for t in TABS]
SECTION_TAB = {"hero": "look", "personas": "guests", "story": "texts", "highlights": "texts", "rooms": "rooms",
               "walkthrough": "media", "gallery": "media", "stay": "guests", "neighborhood": "area", "film": "media",
               "dining": "media", "reviews": "booking", "booking": "booking", "faq": "booking", "contact": "basics"}
TAB_SECTION = {"look": "hero", "texts": "story", "rooms": "rooms", "media": "gallery", "area": "neighborhood",
               "guests": "stay", "booking": "booking", "basics": "contact"}
DEVICES = ["desktop", "tablet", "phone"]


def _loose(x):
    """Untyped on purpose (the validator would pin None / literal types)."""
    return x


def _js(obj):
    """A real JavaScript object (postMessage can't clone Python proxies)."""
    return window.JSON.parse(json.dumps(obj))


class Edit(EditTemplate):
    """#edit/<site id>[/<tab>]: the site editor, chrome-less. Top bar (back, title, save state, preview size, preview as,
    publish), the tab rail, the settings panel and the live preview.

    The nine field tabs are the NSEd engine (theme/assets/ns-editor.js via Components/EditorPanel): every field is bound
    to a path in the site JSON, so this page only hears "changed" and autosaves (save_site with a version number, so two
    tabs can't overwrite each other silently). The Publish tab is Components/PublishPanel. Clicking "Edit" on a section of
    the preview (Components/SitePreview) opens the matching tab. Leaving the page saves what's left (leave())."""

    def __init__(self, args=(), **properties):
        super().__init__(**properties)
        state.heading(self.title, 1)
        self.site_id = args[0] if args else None
        self.tab = args[1] if len(args) > 1 and args[1] in TAB_IDS else "start"
        dev = state.store_get("ed.device", "desktop")
        self.device = dev if dev in DEVICES else "desktop"
        self.ed = _loose(None)
        self.pv = _loose(None)
        self._prev = False
        self.persona = ""
        self.site: dict = {}
        self.version = 1
        self.save_state = "saved"
        self.saving = False
        self.again = False
        self._timer = None
        self._unload = anvil.js.report_exceptions(self._before_unload)
        self.missing.visible = False
        r = _loose(anvil.server.call("get_site", self.site_id) if self.site_id else {"ok": False, "error": "No site was chosen."})
        if not r.get("ok"):
            self.ed_box.visible = False
            self.missing.visible = True
            self.missing_text.text = r.get("error") or "That site doesn't exist, or it isn't yours."
            return
        site = r["site"]
        data = site.pop("data", None) or {}
        self.site = site
        self.version = site.get("version") or 1
        self.tabs_panel.add_event_handler("x-tab", self._tab_event)
        self.ed = self.fields.start(json.dumps(data), json.dumps(site), {
            "changed": self._changed, "tab": self.go_tab, "persona": self.set_persona,
            "library": self._library, "previewMsg": self._preview_request})
        self.publish_panel.setup(self)
        window.addEventListener("beforeunload", self._unload)
        self._draw_dev()
        self._draw_top()
        self.go_tab(self.tab, scroll=False)

    @handle("", "show")
    def form_show(self, **event_args):
        if self.ed is not None and self.pv is None:
            self.pv = self.preview.start(self._preview_message)
            self.ed.setPreview(self.pv)
            self.pv.push(self.ed.data(), True)
            self.pv.fit(self.device)

    def leave(self):
        """The router calls this when the visitor goes to another page: save what's left, stop the engines."""
        window.removeEventListener("beforeunload", self._unload)
        if self._timer:
            window.clearTimeout(self._timer)
            self._timer = None
        if self.ed is None:
            return
        if self.save_state != "saved":
            try:
                anvil.server.call_s("save_site", self.site_id, json.loads(self.ed.dataJson()), self.version)
            except Exception:
                pass
        if self.pv is not None:
            self.pv.destroy()
            self.pv = None
        self.fields.stop()
        self.ed = _loose(None)

    def _before_unload(self, event):
        if self.save_state != "saved":
            event.preventDefault()
            event.returnValue = ""

    # ---------------------------------------------------------------- top bar
    def _draw_top(self):
        top = json.loads(self.ed.top())
        self.title.text = top["name"] or "Untitled"
        items = [("Preview as: everyone", "")] + [(p["name"], p["id"]) for p in top["personas"]]
        ids = [p["id"] for p in top["personas"]]
        self.persona_select.items = items
        self.persona_select.selected_value = self.persona if self.persona in ids else ""
        state.set_control_attr(self.persona_select, "aria-label", "Preview as")
        live = self.site.get("status") == "published"
        self.publish_button.text = ("Publish changes" if self.site.get("unpublished_changes") else "Live") if live else "Publish"

    def set_save_state(self, s, msg=None):
        self.save_state = s
        self.save_box.classes["busy"] = s == "busy"
        self.save_box.classes["err"] = s == "err"
        self.save_label.text = msg or {"busy": "Saving…", "err": "Not saved"}.get(s, "Saved")

    def _draw_dev(self):
        for name, el in zip(DEVICES, [self.dev_desktop, self.dev_tablet, self.dev_phone]):
            el.classes["on"] = name == self.device

    def dev_click(self, event):
        self.device = str(event.currentTarget.getAttribute("data-dev"))
        state.store_set("ed.device", self.device)
        self._draw_dev()
        if self.pv is not None:
            self.pv.fit(self.device)

    @handle("persona_select", "change")
    def persona_select_change(self, **event_args):
        self.set_persona(self.persona_select.selected_value or "")

    @handle("switch_button", "click")
    def switch_button_click(self, **event_args):
        on = not self._prev
        self._show_preview(on)

    def _show_preview(self, on):
        self._prev = on
        self.ed_box.classes["show-prev"] = on
        self.switch_button.text = "Edit" if on else "Preview"
        self.switch_button.role = ["btn", "btn-sm", "ed-switch", "ic-edit" if on else "ic-globe"]
        if on and self.pv is not None:
            self.pv.fit(self.device)

    @handle("publish_button", "click")
    def publish_button_click(self, **event_args):
        self.go_tab("publish")

    # ---------------------------------------------------------------- tabs
    def _tab_event(self, tab, **event_args):
        self.go_tab(tab)
        state.refocus(self.tabs_panel, tab)

    def go_tab(self, tab, scroll=True):
        if tab not in TAB_IDS:
            return
        self.tab = tab
        self.tabs_panel.items = [{"id": t, "label": label, "icon": icon, "on": t == tab} for t, label, icon in TABS]
        is_pub = tab == "publish"
        self.fields.visible = not is_pub
        self.publish_panel.visible = is_pub
        if is_pub:
            self.publish_panel.refresh()
            getattr(anvil.js.get_dom_node(self.panel), "scrollTo")(0, 0)
        else:
            self.ed.draw(tab)
        if scroll and tab in TAB_SECTION:
            self.post({"type": "ns-scroll", "section": TAB_SECTION[tab]})
        router.replace("edit", self.site_id, tab)
        if window.innerWidth < 860:
            self._show_preview(False)

    # ---------------------------------------------------------------- the preview
    def post(self, msg):
        if self.pv is not None:
            self.pv.post(_js(msg))

    def _preview_message(self, msg_json):
        m = json.loads(msg_json)
        if m.get("type") == "ns-edit" and m.get("section") in SECTION_TAB:
            self.go_tab(SECTION_TAB[m["section"]], scroll=False)

    def _preview_request(self, msg_json):
        """The Guests tab's "See it on the site": show that profile's stay in the preview."""
        m = json.loads(msg_json)
        if m.get("type") == "show-persona":
            self.post({"type": "ns-persona", "persona": m.get("persona")})
            self.post({"type": "ns-scroll", "section": "stay"})
            if window.innerWidth < 860:
                self._show_preview(True)

    def set_persona(self, pid):
        self.persona = pid or ""
        self.persona_select.selected_value = self.persona if self.persona in [v for _, v in self.persona_select.items] else ""
        self.ed.setPersona(self.persona)
        self.post({"type": "ns-persona", "persona": self.persona})

    # ---------------------------------------------------------------- saving
    def _changed(self, opts_json):
        o = json.loads(opts_json or "{}")
        self.set_save_state("busy", "Unsaved changes")
        if self._timer:
            window.clearTimeout(self._timer)
        self._timer = window.setTimeout(self._autosave, 1100)
        if o.get("top"):
            self._draw_top()

    def _autosave(self):
        self._timer = None
        self.save()

    def save(self):
        """Save the draft now. True when it's saved (or another save is already running)."""
        if self.ed is None:
            return False
        if self.saving:
            self.again = True
            return True
        self.saving = True
        self.set_save_state("busy")
        ok = False
        try:
            r = anvil.server.call_s("save_site", self.site_id, json.loads(self.ed.dataJson()), self.version)
            if r.get("ok"):
                self.version = r["version"]
                self.site["unpublished_changes"] = r.get("unpublished_changes")
                self.set_save_state("saved")
                self._draw_top()
                ok = True
            elif r.get("conflict"):
                self.set_save_state("err", "Changed elsewhere")
                if ns.ask("This site changed somewhere else", "It was saved in another tab or by another person. Reload to get "
                          "the latest version (your last few changes here will be lost).", "Reload"):
                    self.save_state = "saved"
                    window.location.reload()
            else:
                self._retry(r.get("error") or "")
        except Exception as e:
            self._retry(str(e))
        finally:
            self.saving = False
        if self.again:
            self.again = False
            return self.save()
        return ok

    def _retry(self, why):
        self.set_save_state("err")
        state.toast("Not saved: %s We will try again." % why, "error")
        self._timer = window.setTimeout(self._autosave, 6000)

    def set_site(self, site):
        """After publishing / unpublishing: the new status and link."""
        site = dict(site)
        site.pop("data", None)
        self.site.update(site)
        self.ed.setSite(json.dumps(self.site))
        self._draw_top()

    def mark_saved(self):
        self.save_state = "saved"

    # ---------------------------------------------------------------- the photo library (a dialog)
    def _library(self, kind, multi, refs_json):
        from ...Dialogs.Library import Library
        answer = alert(Library(kind=kind, multi=bool(multi), refs=json.loads(refs_json or "[]")), buttons=[], large=True,
                       role="app-dialog", dismissible=True)
        return json.dumps(answer if answer == "upload" else (answer or []))
