from anvil import *

from ._anvil_designer import TransferTemplate
from ... import state


class Transfer(TransferTemplate):
    """Admin: give a site to someone by email (admin_transfer_site). Closes with True when done."""

    def __init__(self, site_id="", **properties):
        super().__init__(**properties)
        self.site_id = site_id
        state.control(self.email_box).setAttribute("type", "email")
        state.set_control_attr(self.email_box, "autocomplete", "email")

    @handle("email_box", "pressed_enter")
    def email_box_pressed_enter(self, **event_args):
        self.ok_button_click()

    @handle("ok_button", "click")
    def ok_button_click(self, **event_args):
        r = state.call("admin_transfer_site", self.site_id, (self.email_box.text or "").strip())
        if r:
            state.toast(r.get("message") or "Saved", "ok")
            self.raise_event("x-close-alert", value=True)

    @handle("cancel_button", "click")
    def cancel_button_click(self, **event_args):
        self.raise_event("x-close-alert", value=False)
