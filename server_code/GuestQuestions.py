"""Questions from guests: the "Ask us a question" form on every hosted (and exported) hotel site, and the owner's inbox.

  <app>/_/api/ask      POST from the hotel site (text/plain JSON, so exported sites on other domains can post
                       without a CORS preflight): {s: slug, name, email, message, lang, persona, hp, t}.
                       hp = the hidden honeypot field (bots fill it), t = milliseconds the form was open.
                       kind "dates" (2026-11-20) = the "Ask us for your dates" form: + details {arrive (YYYY-MM-DD),
                       nights, adults, children, room, phone}; message is then the guest's optional note.
  my_questions()       the owner's inbox (Pages/Questions): every question to the sites they can edit.
  set_question_status / delete_question / question_to_faq   the inbox buttons.

The owner gets one email per site at most every NOTIFY_GAP minutes (the rest wait in the inbox). Guests' addresses
are only shown to people who can edit that site. Questions to an unpublished site, or a site that switched the form
off (data.contact.ask_off), are refused; date requests need live.booking.request.on (off by default).
A date request is stored with a readable English summary at the top of `message` ("Date request: 12-15 Mar 2027 ·
3 nights · 2 adults, 1 child · Twin Room"), so the inbox and the email work before the owner accepts the new columns
(kind, details); those are written in their own guarded statement.
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
LANGS = ("en", "lv", "ru", "de", "fr")
LANG_NAMES = {"en": "English", "lv": "Latvian", "ru": "Russian", "de": "German", "fr": "French"}
KINDS = ("question", "dates")
DATE_PREFIX = "Date request: "
MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
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


def _col(row, name):
    """A column that may not exist yet (before the owner accepts the schema change): None then."""
    try:
        return row[name]
    except Exception:
        return None


def _plural(n, one, many=None):
    return "%d %s" % (n, one if n == 1 else (many or one + "s"))


def date_summary(d):
    """The owner's one-line summary of a date request: '12-15 Mar 2027 · 3 nights · 2 adults, 1 child · Twin Room'."""
    a = dt.date.fromisoformat(d["arrive"])
    b = a + dt.timedelta(days=int(d["nights"]))
    if a.year != b.year:
        span = "%d %s %d - %d %s %d" % (a.day, MONTHS[a.month - 1], a.year, b.day, MONTHS[b.month - 1], b.year)
    elif a.month != b.month:
        span = "%d %s - %d %s %d" % (a.day, MONTHS[a.month - 1], b.day, MONTHS[b.month - 1], b.year)
    else:
        span = "%d-%d %s %d" % (a.day, b.day, MONTHS[a.month - 1], a.year)
    guests = _plural(d["adults"], "adult") + (", " + _plural(d["children"], "child", "children") if d.get("children") else "")
    return " · ".join([span, _plural(d["nights"], "night"), guests, d.get("room") or "Any room"])


def _currency(site):
    """The money sign the owner's offer template uses: from the room prices, else the country."""
    data = (site["live"] or site["data"] or {}) if site is not None else {}
    for r in data.get("rooms") or []:
        price = str((r or {}).get("price") or "") if isinstance(r, dict) else ""
        for sign in ("€", "$", "£", "CHF", "kr"):
            if sign in price:
                return sign
    country = str((data.get("hotel") or {}).get("country") or "").lower()
    if any(w in country for w in ("canada", "united states", "usa", "australia")):
        return "$"
    return "£" if ("kingdom" in country or country in ("uk", "england", "scotland")) else "€"


def _item(q, site_names):
    site = q["site"]
    message = q["message"] or ""
    kind = _col(q, "kind") or ("dates" if message.startswith(DATE_PREFIX) else "question")
    out = {"id": q.get_id(), "site_id": site.get_id() if site is not None else None,
           "site_name": site_names.get(site.get_id(), "") if site is not None else "",
           "name": q["name"] or "A guest", "email": q["email"] or "", "message": message,
           "lang": q["lang"] or "en", "persona": q["persona"] or "", "status": q["status"] or "new",
           "created": C.iso(q["created"]), "answered_at": C.iso(q["answered_at"]), "kind": kind}
    if kind == "dates":
        head, _, note = message.partition("\n\n")
        lines = head.split("\n")
        details = _col(q, "details") or {}
        out.update(summary=lines[0][len(DATE_PREFIX):] if lines[0].startswith(DATE_PREFIX) else lines[0], note=note,
                   phone=details.get("phone") or next((x[7:] for x in lines[1:] if x.startswith("Phone: ")), ""),
                   details=details if isinstance(details, dict) else {}, currency=_currency(site))
    return out


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


def _notify(site, q, details=None):
    """Email the owner (one email per site per NOTIFY_GAP minutes; the inbox has the rest). details = a date request."""
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
    lang = q["lang"] or "en"
    wrote = ("They wrote in %s.\n\n" % LANG_NAMES[lang]) if lang != "en" and lang in LANG_NAMES else ""
    if details:
        a = dt.date.fromisoformat(details["arrive"])
        text = ("%s would like a price for these dates at %s:\n\n%s\n\n%s"
                "Send your offer to %s, or open your inbox: its Reply button writes the offer email for you, in the guest's "
                "language, with blanks for your prices: %s/#questions\n\n"
                "ArviStay sends at most one of these emails every %d minutes; newer requests wait in your inbox.\n") % (
            q["name"] or "A guest", hotel, q["message"], wrote, q["email"], origin, NOTIFY_GAP)
        subject = ("Date request: %d %s %d, %s, %s (%s)" % (a.day, MONTHS[a.month - 1], a.year, _plural(details["nights"], "night"),
                                                           _plural(details["adults"], "adult"), hotel))[:150]
    else:
        text = ("%s asked a question on the %s website:\n\n%s\n\n%s"
                "Write back to them at %s, or open your inbox (it has a Reply button): %s/#questions\n\n"
                "ArviStay sends at most one of these emails every %d minutes; newer questions wait in your inbox.\n") % (
            q["name"] or "A guest", hotel, q["message"], wrote, q["email"], origin, NOTIFY_GAP)
        subject = ("New question from %s (%s)" % (q["name"] or "a guest", hotel))[:150]
    try:
        anvil.email.send(to=owner["email"], from_name="ArviStay", subject=subject, text=text)
        return True
    except Exception as err:
        print("question email failed: %r" % err)
        return False


# ----------------------------------------------------------------------------------------------- the form on the hotel site
def _int(value, low, high):
    if isinstance(value, bool):
        return None
    try:
        n = int(float(value))
    except (TypeError, ValueError):
        return None
    return n if low <= n <= high else None


def clean_dates(details, live):
    """A date request's details, checked: {arrive, nights, adults, children, room, phone}, or None when they don't make
    sense (arrival from yesterday, for time zones, to two years ahead; 1-60 nights; 1-20 adults; 0-12 children).
    The room must be one of the site's rooms, else it means "any room"."""
    if not isinstance(details, dict):
        return None
    try:
        arrive = dt.date.fromisoformat(str(details.get("arrive") or "")[:10])
    except ValueError:
        return None
    today = C.now().date()
    if arrive < today - dt.timedelta(days=1) or arrive > today + dt.timedelta(days=730):
        return None
    nights, adults = _int(details.get("nights"), 1, 60), _int(details.get("adults"), 1, 20)
    children = _int(details.get("children") or 0, 0, 12)
    if nights is None or adults is None or children is None:
        return None
    rooms = [r.get("name") for r in (live.get("rooms") or []) if isinstance(r, dict) and r.get("name")]
    room = C.text(details.get("room"), 80)
    phone = re.sub(r"[^0-9+()\-. ]", "", C.text(details.get("phone"), 40)).strip()[:30]
    return {"arrive": arrive.isoformat(), "nights": nights, "adults": adults, "children": children,
            "room": room if room in rooms else "", "phone": phone}


def accept(payload):
    """Check and store one question or date request. Returns (http status, reply dict). Split out of the endpoint for
    the tests."""
    if not isinstance(payload, dict):
        return 400, {"ok": False, "error": "bad"}
    if payload.get("hp"):
        return 200, {"ok": True}  # a bot filled the hidden field: pretend it worked
    kind = C.text(payload.get("kind"), 12).lower() or "question"
    if kind not in KINDS:
        return 400, {"ok": False, "error": "bad"}
    slug = C.text(payload.get("s"), 60).lower()
    site = app_tables.sites.get(slug=slug) if slug else None
    if site is None or site["status"] != "published" or not site["live"]:
        return 404, {"ok": False, "error": "closed"}
    live = site["live"] or {}
    if kind == "question" and (live.get("contact") or {}).get("ask_off"):
        return 403, {"ok": False, "error": "closed"}
    if kind == "dates" and not ((live.get("booking") or {}).get("request") or {}).get("on"):
        return 403, {"ok": False, "error": "closed"}  # the owner hasn't switched date requests on
    name = C.text(payload.get("name"), 80)
    email = C.text(payload.get("email"), 200).lower()
    message = C.text(payload.get("message"), 1500 if kind == "dates" else 2000, multiline=True)
    try:
        opened = float(payload.get("t") or 0)
    except (TypeError, ValueError):
        opened = 0
    if opened and opened < MIN_OPEN_MS:
        return 200, {"ok": True}  # filled in faster than a person can type: drop it quietly
    details = None
    if kind == "dates":
        details = clean_dates(payload.get("details"), live)
        if details is None:
            return 400, {"ok": False, "error": "dates"}
    if not EMAIL_RE.match(email):
        return 400, {"ok": False, "error": "email"}
    if details:
        # A readable summary first, so the inbox and the email are complete even without the new columns.
        message = DATE_PREFIX + date_summary(details) + ("\nPhone: " + details["phone"] if details["phone"] else "") + \
            ("\n\n" + message if message else "")
    elif len(message) < 5:
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
    try:  # columns added 2026-11-20: missing until the owner accepts the schema change, and that's fine
        q.update(kind=kind, details=details)
    except Exception as err:
        print("guest_questions kind/details not ready: %r" % err)
    if _notify(site, q, details):
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
