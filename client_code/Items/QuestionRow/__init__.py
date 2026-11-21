import datetime

from anvil import *
from anvil.js import window

from ._anvil_designer import QuestionRowTemplate
from ... import ns, state

LANG_NAMES = {"lv": "Latvian", "ru": "Russian", "de": "German", "fr": "French"}


def _say(lang, text, **values):
    """One line of the offer email in the guest's language (the hotel-site dictionary, NSSite.tIn), else English."""
    out = text
    if lang != "en":
        try:
            out = window.NSSite.tIn(lang, text) or text
        except Exception:
            out = text
    for k, v in values.items():
        out = out.replace("{" + k + "}", str(v))
    return out


def _day(iso):
    """'2027-03-12' -> date, or None."""
    try:
        y, m, d = [int(x) for x in str(iso or "").split("-")[:3]]
        return datetime.date(y, m, d)
    except Exception:
        return None


def _dotted(day):
    return "%02d.%02d.%d" % (day.day, day.month, day.year)


class QuestionRow(QuestionRowTemplate):
    """One guest question in #questions. item = GuestQuestions._item() (id, site_id, site_name, name, email, message,
    lang, persona, status, created, kind) + show_site. Date requests (kind "dates") also have summary, note, phone,
    details {arrive, nights, adults, children, room, phone} (empty before the schema change) and currency: they get the
    gilt "Date request" badge, the dates line, and Reply writes an offer email in the guest's language with blanks for
    the prices. Every button ends with x-changed on the panel (the page reloads)."""

    def __init__(self, **properties):
        super().__init__(**properties)
        q = self.item
        dn = self.dom_nodes
        dates = q.get("kind") == "dates"
        self.dates = dates
        dn["kind"].hidden = not dates
        dn["dates_box"].hidden = not dates
        dn["site"].textContent = q.get("site_name") or ""
        dn["site"].hidden = not q.get("show_site")
        dn["who"].textContent = q.get("name") or "A guest"
        dn["email"].textContent = q.get("email") or ""
        state.set_attr(self.email_link, "href", "mailto:" + (q.get("email") or ""))
        lang = q.get("lang") or "en"
        dn["lang"].textContent = LANG_NAMES.get(lang, "")
        dn["lang"].hidden = lang not in LANG_NAMES
        dn["when"].textContent = state.ago(q.get("created"))
        text = (q.get("note") or "") if dates else (q.get("message") or "")
        dn["message"].textContent = text
        dn["message"].hidden = not text
        if dates:
            dn["dates"].textContent = q.get("summary") or ""
            dn["phone"].textContent = ("Phone " + q["phone"]) if q.get("phone") else ""
            dn["phone"].hidden = not q.get("phone")
        pname = ""
        if q.get("persona"):
            try:
                pname = (ns.persona(q["persona"]) or {}).get("name") or ""
            except Exception:
                pname = ""
        dn["persona"].textContent = ("Was looking at the site as: " + pname) if pname else ""
        dn["persona"].hidden = not pname
        st = q.get("status") or "new"
        self.reply_button.text = "Reply with an offer" if dates else "Reply by email"
        self.status_button.text = "Mark as new" if st == "answered" else "Mark answered"
        self.archive_button.text = "Move back" if st == "archived" else "Archive"
        self.faq_button.visible = st != "archived" and not dates

    def _done(self):
        if self.parent is not None:
            self.parent.raise_event("x-changed")

    def _status(self, status, quiet=False):
        r = state.call_quiet("set_question_status", self.item["id"], status) if quiet else state.call("set_question_status", self.item["id"], status)
        if r:
            self._done()
        return r

    def _offer(self, lang):
        """The offer for a date request, in one language: greeting, the dates, blanks for the price, the 48-hour hold."""
        q = self.item
        d = q.get("details") or {}
        first = (q.get("name") or "").split(" ")[0] or "there"
        arrive = _day(d.get("arrive"))
        if arrive is not None and d.get("nights"):
            leave = arrive + datetime.timedelta(days=int(d["nights"]))
            facts = [_say(lang, "Arrival") + ": " + _dotted(arrive), _say(lang, "Departure") + ": " + _dotted(leave),
                     _say(lang, "Nights") + ": " + str(d["nights"]), _say(lang, "Adults") + ": " + str(d.get("adults") or 1)]
            if d.get("children"):
                facts.append(_say(lang, "Children") + ": " + str(d["children"]))
            facts.append(_say(lang, "Room") + ": " + (d.get("room") or _say(lang, "Any room")))
            fact_line = " · ".join(facts)
        else:
            fact_line = q.get("summary") or ""
        return "\n".join([_say(lang, "Hello {name},", name=first), "",
                          _say(lang, "Thank you for asking us directly. For your dates we can offer:"), fact_line, "",
                          _say(lang, "__ {cur} a night, __ {cur} in total.", cur=q.get("currency") or "€"), "",
                          _say(lang, "Reply to this email to confirm, and we will hold the room for you for 48 hours."), "",
                          _say(lang, "Best wishes,"), q.get("site_name") or "our hotel"])

    def _offer_mail(self):
        q = self.item
        lang = q.get("lang") or "en"
        body = self._offer(lang)
        if lang != "en" and lang in LANG_NAMES:
            body += "\n\n---\n" + self._offer("en")   # the guest's language first, English under it
        note = (q.get("note") or "")[:600]
        quoted = "\n".join("> " + line for line in ([q.get("summary") or ""] + (note.split("\n") if note else [])))
        body += "\n\n---\n" + quoted + "\n"
        arrive = _day((q.get("details") or {}).get("arrive"))
        subject = (q.get("site_name") or "Your stay") + " · " + (_dotted(arrive) if arrive else (q.get("summary") or "").split(" · ")[0])
        return subject, body

    @handle("reply_button", "click")
    def reply_button_click(self, **event_args):
        q = self.item
        if self.dates:
            subject, body = self._offer_mail()
        else:
            site = q.get("site_name") or "our hotel"
            quoted = "\n".join("> " + line for line in (q.get("message") or "").split("\n"))
            body = "Hello %s,\n\nThank you for your question.\n\n\n\nBest wishes,\n%s\n\n---\nYou asked on our website:\n%s\n" % (
                (q.get("name") or "").split(" ")[0] or "there", site, quoted)
            subject = "Your question to " + site
        url = "mailto:%s?subject=%s&body=%s" % (q.get("email") or "", window.encodeURIComponent(subject), window.encodeURIComponent(body))
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
