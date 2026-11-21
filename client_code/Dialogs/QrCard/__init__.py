import json

from anvil import *
from anvil.js import window

from ._anvil_designer import QrCardTemplate
from ... import state

LAYOUTS = [("Table card: print, fold in half, stand it up", "tent"), ("Four small cards on one sheet", "cards"), ("A4 poster", "poster")]
KINDS = [("Welcome card: plan your stay", "welcome"), ("Thank-you card: reviews and coming back", "thanks")]
INTROS = {
    "welcome": ("A QR card for reception",
                "Guests scan it at the desk, in the room or at breakfast, and your site opens on their phone in their own language."),
    "thanks": ("A thank-you card for check-out",
               "Hand it over with the bill or leave it in the room on the last morning. The code opens a thank-you sheet on the "
               "guest's phone, in their language: your review links, a private note to you, and your come-back code."),
}


class QrCard(QrCardTemplate):
    """The Publish tab's "Make a QR card": a printable A4 page in the site's palette and fonts (NSApp.qrCard in
    theme/assets/ns-app.js). Two cards: Welcome (a QR code to the live site, a line in each of the site's languages and,
    if typed, the Wi-Fi with its own join code) and Thank you (2026-11-20: "Thank you for staying with us" in every site
    language, the come-back perk + code from the Booking tab, a QR code to <site>#thanks). Wi-Fi details and the choices
    are kept in this browser only (UI.store), never in the site."""

    def __init__(self, data_json="{}", url="", site_id="", **properties):
        super().__init__(**properties)
        self.data_json = data_json
        self.url = url
        self.key = "qr." + str(site_id or "")
        saved = {}
        try:
            saved = json.loads(state.store_get(self.key, "{}") or "{}")
        except Exception:
            saved = {}
        self.kind_select.items = KINDS
        self.kind_select.selected_value = saved.get("kind") if saved.get("kind") in [v for _, v in KINDS] else "welcome"
        self.layout_select.items = LAYOUTS
        self.layout_select.selected_value = saved.get("layout") if saved.get("layout") in [v for _, v in LAYOUTS] else "tent"
        self.wifi_name.text = saved.get("wifi_name") or ""
        self.wifi_pass.text = saved.get("wifi_pass") or ""
        state.set_control_attr(self.wifi_name, "autocomplete", "off")
        state.set_control_attr(self.wifi_pass, "autocomplete", "off")
        self._ready = False
        self._kind_shown()

    def _thanks_note(self):
        """What the thank-you card will show, and what is missing (the Booking tab's After the stay fields)."""
        try:
            data = json.loads(self.data_json or "{}")
        except Exception:
            data = {}
        booking = data.get("booking") or {}
        after = booking.get("after") or {}
        reviews = len([r for r in (data.get("ratings") or []) if isinstance(r, dict) and r.get("url")]) + (1 if after.get("google_review") else 0)
        bits = ["%d review link%s" % (reviews, "" if reviews == 1 else "s") if reviews else "no review links yet",
                "a come-back code" if after.get("return_code") else "no come-back code yet"]
        return ("The sheet shows %s and %s. Add them in the editor, Booking tab, After the stay; "
                "the private note to you is always there." % (bits[0], bits[1]))

    def _kind_shown(self):
        kind = self.kind_select.selected_value or "welcome"
        title, intro = INTROS[kind]
        self.dom_nodes["title"].textContent = title
        self.dom_nodes["intro"].textContent = intro
        self.dom_nodes["wifi_box"].hidden = kind == "thanks"
        note = self.dom_nodes["thanks_note"]
        note.textContent = self._thanks_note() if kind == "thanks" else ""
        note.hidden = kind != "thanks"

    @handle("", "show")
    def form_show(self, **event_args):
        window.NSApp.qrReady()
        self._ready = True
        self._draw()

    def _opts(self):
        return {"layout": self.layout_select.selected_value or "tent", "kind": self.kind_select.selected_value or "welcome",
                "wifi": {"name": (self.wifi_name.text or "").strip(), "pass": (self.wifi_pass.text or "").strip()}}

    def _html(self):
        return window.NSApp.qrCard(self.data_json, self.url, json.dumps(self._opts()))

    def _draw(self):
        if not self._ready:
            return
        o = self._opts()
        state.store_set(self.key, json.dumps({"layout": o["layout"], "kind": o["kind"], "wifi_name": o["wifi"]["name"], "wifi_pass": o["wifi"]["pass"]}))
        frame, box = self.dom_nodes["frame"], self.dom_nodes["box"]
        width = box.clientWidth or 300
        frame.style.transform = "scale(%.4f)" % (float(width) / 794.0)
        frame.srcdoc = self._html()

    @handle("kind_select", "change")
    def kind_select_change(self, **event_args):
        self._kind_shown()
        self._draw()

    @handle("layout_select", "change")
    def layout_select_change(self, **event_args):
        self._draw()

    @handle("wifi_name", "lost_focus")
    def wifi_name_lost_focus(self, **event_args):
        self._draw()

    @handle("wifi_pass", "lost_focus")
    def wifi_pass_lost_focus(self, **event_args):
        self._draw()

    @handle("wifi_name", "pressed_enter")
    def wifi_name_pressed_enter(self, **event_args):
        self._draw()

    @handle("wifi_pass", "pressed_enter")
    def wifi_pass_pressed_enter(self, **event_args):
        self._draw()

    @handle("print_button", "click")
    def print_button_click(self, **event_args):
        if not self._ready:
            window.NSApp.qrReady()
            self._ready = True
        window.NSApp.printDoc(self._html())

    @handle("close_button", "click")
    def close_button_click(self, **event_args):
        self.raise_event("x-close-alert", value=False)
