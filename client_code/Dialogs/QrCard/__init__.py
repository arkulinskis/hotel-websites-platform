import json

from anvil import *
from anvil.js import window

from ._anvil_designer import QrCardTemplate
from ... import state

LAYOUTS = [("Table card: print, fold in half, stand it up", "tent"), ("Four small cards on one sheet", "cards"), ("A4 poster", "poster")]


class QrCard(QrCardTemplate):
    """The Publish tab's "Print a QR card": a printable A4 page in the site's palette and fonts (NSApp.qrCard in
    theme/assets/ns-app.js) with a QR code to the live site, a line in each of the site's languages and, if typed,
    the Wi-Fi with its own join code. Wi-Fi details are kept in this browser only (UI.store), never in the site."""

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
        self.layout_select.items = LAYOUTS
        self.layout_select.selected_value = saved.get("layout") if saved.get("layout") in [v for _, v in LAYOUTS] else "tent"
        self.wifi_name.text = saved.get("wifi_name") or ""
        self.wifi_pass.text = saved.get("wifi_pass") or ""
        state.set_control_attr(self.wifi_name, "autocomplete", "off")
        state.set_control_attr(self.wifi_pass, "autocomplete", "off")
        self._ready = False

    @handle("", "show")
    def form_show(self, **event_args):
        window.NSApp.qrReady()
        self._ready = True
        self._draw()

    def _opts(self):
        return {"layout": self.layout_select.selected_value or "tent",
                "wifi": {"name": (self.wifi_name.text or "").strip(), "pass": (self.wifi_pass.text or "").strip()}}

    def _html(self):
        return window.NSApp.qrCard(self.data_json, self.url, json.dumps(self._opts()))

    def _draw(self):
        if not self._ready:
            return
        o = self._opts()
        state.store_set(self.key, json.dumps({"layout": o["layout"], "wifi_name": o["wifi"]["name"], "wifi_pass": o["wifi"]["pass"]}))
        frame, box = self.dom_nodes["frame"], self.dom_nodes["box"]
        width = box.clientWidth or 300
        frame.style.transform = "scale(%.4f)" % (float(width) / 794.0)
        frame.srcdoc = self._html()

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
