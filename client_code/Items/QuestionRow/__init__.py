from anvil import *
from anvil.js import window

from ._anvil_designer import QuestionRowTemplate
from ... import ns, state

LANG_NAMES = {"lv": "Latvian", "ru": "Russian", "de": "German"}


class QuestionRow(QuestionRowTemplate):
    """One guest question in #questions. item = GuestQuestions._item() (id, site_id, site_name, name, email, message,
    lang, persona, status, created) + show_site. Every button ends with x-changed on the panel (the page reloads)."""

    def __init__(self, **properties):
        super().__init__(**properties)
        q = self.item
        dn = self.dom_nodes
        dn["site"].textContent = q.get("site_name") or ""
        dn["site"].hidden = not q.get("show_site")
        dn["who"].textContent = q.get("name") or "A guest"
        dn["email"].textContent = q.get("email") or ""
        state.set_attr(self.email_link, "href", "mailto:" + (q.get("email") or ""))
        lang = q.get("lang") or "en"
        dn["lang"].textContent = LANG_NAMES.get(lang, "")
        dn["lang"].hidden = lang not in LANG_NAMES
        dn["when"].textContent = state.ago(q.get("created"))
        dn["message"].textContent = q.get("message") or ""
        pname = ""
        if q.get("persona"):
            try:
                pname = (ns.persona(q["persona"]) or {}).get("name") or ""
            except Exception:
                pname = ""
        dn["persona"].textContent = ("Was looking at the site as: " + pname) if pname else ""
        dn["persona"].hidden = not pname
        st = q.get("status") or "new"
        self.status_button.text = "Mark as new" if st == "answered" else "Mark answered"
        self.archive_button.text = "Move back" if st == "archived" else "Archive"
        self.faq_button.visible = st != "archived"

    def _done(self):
        if self.parent is not None:
            self.parent.raise_event("x-changed")

    def _status(self, status, quiet=False):
        r = state.call_quiet("set_question_status", self.item["id"], status) if quiet else state.call("set_question_status", self.item["id"], status)
        if r:
            self._done()
        return r

    @handle("reply_button", "click")
    def reply_button_click(self, **event_args):
        q = self.item
        site = q.get("site_name") or "our hotel"
        quoted = "\n".join("> " + line for line in (q.get("message") or "").split("\n"))
        body = "Hello %s,\n\nThank you for your question.\n\n\n\nBest wishes,\n%s\n\n---\nYou asked on our website:\n%s\n" % (
            (q.get("name") or "").split(" ")[0] or "there", site, quoted)
        url = "mailto:%s?subject=%s&body=%s" % (q.get("email") or "", window.encodeURIComponent("Your question to " + site),
                                                window.encodeURIComponent(body))
        window.location.href = url
        if (q.get("status") or "new") == "new":
            self._status("answered", quiet=True)

    @handle("faq_button", "click")
    def faq_button_click(self, **event_args):
        from ...Dialogs.AddToFaq import AddToFaq
        if alert(AddToFaq(item=self.item), buttons=[], role="app-dialog", dismissible=True):
            self._done()

    @handle("status_button", "click")
    def status_button_click(self, **event_args):
        self._status("new" if self.item.get("status") == "answered" else "answered")

    @handle("archive_button", "click")
    def archive_button_click(self, **event_args):
        self._status("new" if self.item.get("status") == "archived" else "archived")

    @handle("delete_button", "click")
    def delete_button_click(self, **event_args):
        if ns.ask("Delete this question?", "It is removed for good. The guest isn't told.", "Delete"):
            if state.call("delete_question", self.item["id"]):
                state.toast("Deleted.")
                self._done()
