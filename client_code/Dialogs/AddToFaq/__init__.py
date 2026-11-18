from anvil import *

from ._anvil_designer import AddToFaqTemplate
from ... import state


class AddToFaq(AddToFaqTemplate):
    """Turn a guest question into a FAQ entry (GuestQuestions.question_to_faq): the owner tidies the question, writes the
    answer; it lands in the site's draft and the question is marked answered. Closes with True when added."""

    def __init__(self, item=None, **properties):
        super().__init__(**properties)
        self.q = item or {}
        msg = " ".join((self.q.get("message") or "").split())
        self.q_box.text = msg[:300]
        state.set_control_attr(self.q_box, "maxlength", 300)
        state.set_control_attr(self.a_box, "maxlength", 3000)

    @handle("ok_button", "click")
    def ok_button_click(self, **event_args):
        r = state.call("question_to_faq", self.q.get("id"), self.q_box.text or "", self.a_box.text or "")
        if r:
            state.toast("Added to the FAQ of %s. Publish the site to show it." % (self.q.get("site_name") or "your site"), "ok")
            self.raise_event("x-close-alert", value=True)

    @handle("cancel_button", "click")
    def cancel_button_click(self, **event_args):
        self.raise_event("x-close-alert", value=False)
