"""Questions from guests: the "Ask us a question" form on every hosted (and exported) hotel site, and the owner's inbox.

  <app>/_/api/ask      POST from the hotel site (text/plain JSON, so exported sites on other domains can post
                       without a CORS preflight): {s: slug, name, email, message, lang, persona, hp, t}.
                       hp = the hidden honeypot field (bots fill it), t = milliseconds the form was open.
  my_questions()       the owner's inbox (Pages/Questions): every question to the sites they can edit.
  set_question_status / delete_question / question_to_faq   the inbox buttons.

The owner gets one email per site at most every NOTIFY_GAP minutes (the rest wait in the inbox). Guests' addresses
are only shown to people who can edit that site. Questions to an unpublished site, or a site that switched the form
off (data.contact.ask_off), are refused.
"""
import datetime as dt
import json
import re

import anvil
import anvil.email
import anvil.server
import anvil.tables as tables
import anvil.tables.query as tq
from anvil.tables import app_tables

from . import common as C
from . import Sites

STATUSES = ("new", "answered", "archived")
LANGS = ("en", "lv", "ru", "de")
PER_SITE_HOUR = 20      # questions one site accepts per hour (stops floods)
NOTIFY_GAP = 30         # minutes between two notification emails for one site
MIN_OPEN_MS = 2500      # a human needs a few seconds to type a question
EMAIL_RE = re.compile(r"^[^@\s<>\"']{1,64}@[^@\s<>\"']{1,190}\.[a-z]{2,24}$", re.I)


# ----------------------------------------------------------------------------------------------- helpers
def _body():
    """The request body as text: Anvil gives a streaming Media, the test mock a string."""
    b = anvil.server.request.body
    if b is None:
        return ""
    reader = getattr(b, "get_bytes", None)
    if callable(reader):
        b = reader()
    if isinstance(b, bytes):
        b = b.decode("utf-8", "replace")
    return str(b)[:20000]


def _reply(status, payload):
    return anvil.server.HttpResponse(status, json.dumps(payload), headers={
        "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store"})


def _item(q, site_names):
    site = q["site"]
    return {"id": q.get_id(), "site_id": site.get_id() if site is not None else None,
            "site_name": site_names.get(site.get_id(), "") if site is not None else "",
            "name": q["name"] or "A guest", "email": q["email"] or "", "message": q["message"] or "",
            "lang": q["lang"] or "en", "persona": q["persona"] or "", "status": q["status"] or "new",
            "created": C.iso(q["created"]), "answered_at": C.iso(q["answered_at"])}


def _editable_sites(user):
    """Rows of the sites this person may edit (owner, or every site for admins), newest first."""
    if user is None:
        return []
    if C.is_admin(user):
        return list(app_tables.sites.search(tables.order_by("updated", ascending=False), is_demo=False))
    return list(app_tables.sites.search(tables.order_by("updated", ascending=False), owner=user))


def _site_name(site):
    return ((site["data"] or {}).get("hotel") or {}).get("name") or site["name"] or "your hotel"


def count_new(user):
    """New questions to the sites this person owns (the menu's badge)."""
    if user is None:
        return 0
    return sum(Sites.new_questions(list(app_tables.sites.search(owner=user))).values())


def _get_editable_question(qid):
    user = C.require_user()
    q = C.row_by_id(app_tables.guest_questions, qid)
    if q is None or not Sites.can_edit(q["site"], user):
        return None
    return q


def _notify(site, q):
    """Email the owner (one email per site per NOTIFY_GAP minutes; the inbox has the rest)."""
    owner = site["owner"]
    if owner is None or not owner["email"]:
        return False
    since = C.now() - dt.timedelta(minutes=NOTIFY_GAP)
    if len(app_tables.guest_questions.search(site=site, notified=True, created=tq.greater_than(since))):
        return False
    try:
        origin = anvil.server.get_app_origin()
    except Exception:
        origin = ""
    hotel = _site_name(site)
    text = ("%s asked a question on the %s website:\n\n%s\n\n"
            "Write back to them at %s, or open your inbox (it has a Reply button): %s/#questions\n\n"
            "ArviStay sends at most one of these emails every %d minutes; newer questions wait in your inbox.\n") % (
        q["name"] or "A guest", hotel, q["message"], q["email"], origin, NOTIFY_GAP)
    subject = ("New question from %s (%s)" % (q["name"] or "a guest", hotel))[:150]
    try:
        anvil.email.send(to=owner["email"], from_name="ArviStay", subject=subject, text=text)
        return True
    except Exception as err:
        print("question email failed: %r" % err)
        return False


# ----------------------------------------------------------------------------------------------- the form on the hotel site
def accept(payload):
    """Check and store one question. Returns (http status, reply dict). Split out of the endpoint for the tests."""
    if not isinstance(payload, dict):
        return 400, {"ok": False, "error": "bad"}
    if payload.get("hp"):
        return 200, {"ok": True}  # a bot filled the hidden field: pretend it worked
    slug = C.text(payload.get("s"), 60).lower()
    site = app_tables.sites.get(slug=slug) if slug else None
    if site is None or site["status"] != "published" or not site["live"]:
        return 404, {"ok": False, "error": "closed"}
    live = site["live"] or {}
    if (live.get("contact") or {}).get("ask_off"):
        return 403, {"ok": False, "error": "closed"}
    name = C.text(payload.get("name"), 80)
    email = C.text(payload.get("email"), 200).lower()
    message = C.text(payload.get("message"), 2000, multiline=True)
    try:
        opened = float(payload.get("t") or 0)
    except (TypeError, ValueError):
        opened = 0
    if opened and opened < MIN_OPEN_MS:
        return 200, {"ok": True}  # filled in faster than a person can type: drop it quietly
    if not EMAIL_RE.match(email):
        return 400, {"ok": False, "error": "email"}
    if len(message) < 5:
        return 400, {"ok": False, "error": "message"}
    hour_ago = C.now() - dt.timedelta(hours=1)
    recent = app_tables.guest_questions.search(site=site, created=tq.greater_than(hour_ago))
    if len(recent) >= PER_SITE_HOUR:
        return 429, {"ok": False, "error": "busy"}
    if any(r["email"] == email and r["message"] == message for r in recent):
        return 200, {"ok": True}  # pressed twice
    lang = C.text(payload.get("lang"), 5).lower()
    persona = C.text(payload.get("persona"), 20).lower()
    q = app_tables.guest_questions.add_row(
        site=site, name=name or "A guest", email=email, message=message, lang=lang if lang in LANGS else "en",
        persona=persona if re.match(r"^[a-z]{2,20}$", persona or "") else "", status="new", created=C.now(),
        answered_at=None, notified=False, is_demo=bool(site["is_demo"]))
    if _notify(site, q):
        q["notified"] = True
    return 200, {"ok": True}


@anvil.server.http_endpoint("/ask", methods=["POST"])
def ask(**kw):
    try:
        payload = json.loads(_body() or "null")
    except ValueError:
        return _reply(400, {"ok": False, "error": "bad"})
    try:
        status, reply = accept(payload)
    except Exception as err:
        print("ask failed: %r" % err)
        status, reply = 500, {"ok": False, "error": "server"}
    return _reply(status, reply)


# ----------------------------------------------------------------------------------------------- the owner's inbox
@anvil.server.callable(require_user=True)
def my_questions(status=None, site_id=None):
    user = C.require_user()
    sites = _editable_sites(user)
    names = {s.get_id(): _site_name(s) for s in sites}
    if site_id:
        sites = [s for s in sites if s.get_id() == site_id]
    counts = {k: 0 for k in STATUSES}
    items = []
    if sites:
        rows = app_tables.guest_questions.search(tables.order_by("created", ascending=False), site=tq.any_of(*sites))
        for q in rows:
            st = q["status"] or "new"
            counts[st] = counts.get(st, 0) + 1
            if status in STATUSES and st != status:
                continue
            if len(items) < 300:
                items.append(_item(q, names))
    return {"items": items, "counts": counts, "sites": [{"id": k, "name": v} for k, v in list(names.items())[:60]]}


@anvil.server.callable(require_user=True)
def set_question_status(question_id, status):
    q = _get_editable_question(question_id)
    if q is None:
        return C.fail("That question doesn't exist, or it isn't yours.")
    if status not in STATUSES:
        return C.fail("Unknown status.")
    q.update(status=status, answered_at=C.now() if status == "answered" else q["answered_at"])
    return C.ok(item=_item(q, {q["site"].get_id(): _site_name(q["site"])}))


@anvil.server.callable(require_user=True)
def delete_question(question_id):
    q = _get_editable_question(question_id)
    if q is None:
        return C.fail("That question doesn't exist, or it isn't yours.")
    q.delete()
    return C.ok()


@anvil.server.callable(require_user=True)
def question_to_faq(question_id, question, answer):
    """Add the question (as the owner reworded it) and their answer to the site's FAQ draft, and mark it answered.
    The owner publishes the change like any other edit."""
    q = _get_editable_question(question_id)
    if q is None:
        return C.fail("That question doesn't exist, or it isn't yours.")
    question = C.text(question, 300)
    answer = C.text(answer, 3000, multiline=True)
    if len(question) < 3 or len(answer) < 2:
        return C.fail("Write the question and your answer first.")
    site = q["site"]
    data = dict(site["data"] or {})
    faq = list(data.get("faq") or []) or _draft_faq(data)  # an empty FAQ shows drafted questions: keep them
    faq.append({"q": question, "a": answer})
    data["faq"] = faq
    site.update(data=data, version=int(site["version"] or 1) + 1, updated=C.now())
    q.update(status="answered", answered_at=C.now())
    return C.ok(item=_item(q, {site.get_id(): _site_name(site)}), faq=len(faq))


def _draft_faq(data):
    """The questions the site drafts while its FAQ is empty (NS.draft.faq in site/20-engine.js), in English."""
    h = data.get("hotel") or {}
    pay = (data.get("booking") or {}).get("payment") or {}
    out = []
    if h.get("checkin") or h.get("checkout"):
        out.append({"q": "What time is check-in and check-out?",
                    "a": "Check-in is from %s and check-out is until %s." % (h.get("checkin") or "15:00", h.get("checkout") or "12:00")})
    if "breakfast" in (h.get("features") or []):
        out.append({"q": "Is breakfast included?", "a": h.get("breakfast") or "Yes, breakfast is included."})
    if pay.get("when"):
        out.append({"q": "When do I pay?", "a": pay["when"]})
    if h.get("parking"):
        out.append({"q": "Is there parking?", "a": h["parking"]})
    if h.get("airport"):
        out.append({"q": "How do I get here from the airport?", "a": h["airport"]})
    return out
