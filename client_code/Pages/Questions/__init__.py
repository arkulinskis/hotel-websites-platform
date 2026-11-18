from anvil import *

from ._anvil_designer import QuestionsTemplate
from ... import state

FILTERS = ["new", "answered", "archived", "all"]
LABELS = {"new": "New", "answered": "Answered", "archived": "Archived", "all": "All"}
EMPTY = {
    "new": ("No new questions", "When a guest asks something on one of your sites, it shows up here and we send you an email."),
    "answered": ("Nothing answered yet", "Questions you reply to or add to your FAQ move here."),
    "archived": ("Nothing archived", "Archive questions you don't need to answer, like spam or duplicates."),
    "all": ("No questions yet", "Publish your site and share its link: guests can ask from the contact section."),
}


def _loose(x):
    """Untyped on purpose (the validator would pin None / literal types)."""
    return x


class Questions(QuestionsTemplate):
    """#questions[/<filter>]: the owner's inbox of guest questions (GuestQuestions.my_questions), newest first.
    Filters New / Answered / Archived / All, a site picker when they have more than one site. Each row
    (Items/QuestionRow) replies by email, adds the question to the site's FAQ, changes status or deletes, then raises
    x-changed so this page reloads (and the menu's count follows)."""

    def __init__(self, args=(), **properties):
        super().__init__(**properties)
        self._filter = args[0] if args and args[0] in FILTERS else "new"
        self._site = ""
        self._first = True
        self.questions_panel.add_event_handler("x-changed", self._changed)
        state.set_control_attr(self.site_select, "aria-label", "Which site")
        self._load()

    def _load(self):
        d = _loose(state.call("my_questions", None if self._filter == "all" else self._filter, self._site or None)
                   or {"items": [], "counts": {}, "sites": []})
        sites = d.get("sites") or []
        many = len(sites) > 1
        for it in d["items"]:
            it["show_site"] = many
        self.questions_panel.items = d["items"]
        counts = d.get("counts") or {}
        total = sum(counts.values())
        for key, el in (("new", self.f_new), ("answered", self.f_answered), ("archived", self.f_archived), ("all", self.f_all)):
            n = total if key == "all" else counts.get(key, 0)
            el.text = "%s (%d)" % (LABELS[key], n)
            el.role = ["seg", "on"] if key == self._filter else ["seg"]
        if self._first:
            self.site_select.items = [("All your sites", "")] + [(s["name"], s["id"]) for s in sites]
            self._first = False
        self.site_select.visible = many
        self.empty.visible = not d["items"]
        title, text = EMPTY[self._filter]
        self.dom_nodes["empty_title"].textContent = title
        self.empty_text.text = text
        me = state.me()
        if me is not None and not self._site:
            me["questions_new"] = counts.get("new", 0)
            shell = getattr(self, "layout", None)
            if shell is not None and hasattr(shell, "refresh"):
                shell.refresh("questions")

    def _set(self, value):
        self._filter = value
        from ... import router
        router.replace("questions", value)
        self._load()

    @handle("f_new", "click")
    def f_new_click(self, **event_args):
        self._set("new")

    @handle("f_answered", "click")
    def f_answered_click(self, **event_args):
        self._set("answered")

    @handle("f_archived", "click")
    def f_archived_click(self, **event_args):
        self._set("archived")

    @handle("f_all", "click")
    def f_all_click(self, **event_args):
        self._set("all")

    @handle("site_select", "change")
    def site_select_change(self, **event_args):
        self._site = self.site_select.selected_value or ""
        self._load()

    def _changed(self, **event_args):
        self._load()
