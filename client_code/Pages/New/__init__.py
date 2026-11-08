import json

from anvil import *
import anvil.js
from anvil.js import window

from ._anvil_designer import NewTemplate
from ... import ns, router, state

STEPS = ["Find your hotel", "Scan the area", "Your guests", "Look & facts"]
KINDS = ["Boutique hotel", "Hotel", "Guesthouse", "Bed & breakfast", "Aparthotel", "Hostel", "Inn", "Villa"]


def _js_json(obj):
    return json.loads(window.JSON.stringify(obj))


class New(NewTemplate):
    """#new: the "create a site" wizard. 1 find the hotel (address search through NSScan.geocode, a map to confirm),
    2 scan the neighbourhood (NSScan.scan, in the browser), 3 pick guest profiles (ranked by NSSite), 4 look + a few
    facts. Then create_site with the whole starter site (NSApp.newSiteData) and open the editor.
    Tests set window.NS_TEST_SCAN = {places, credits} (no network scan) and window.NS_NO_MAP (flat map)."""

    def __init__(self, args=(), **properties):
        super().__init__(**properties)
        state.heading(self.title, 1)
        self.st: dict = {"step": 0, "name": "", "query": "", "results": [], "pick": None, "scan": None, "personas": [],
                         "palette": "riga", "fonts": "belle", "kind": "Boutique hotel", "stars": 0,
                         "features": ["breakfast", "wifi"], "radius": 1300, "searched": False, "scanning": False}
        self.fonts_box.items = [("%s (%s)" % (f["name"], f["display"]), f["key"]) for f in ns.fonts()]
        self.fonts_box.selected_value = "belle"
        self.kind_box.items = KINDS
        self.kind_box.selected_value = "Boutique hotel"
        self.stars_box.items = [("No stars", 0)] + [("%d stars" % n, n) for n in range(1, 6)]
        self.stars_box.selected_value = 0
        for box, typ, auto in ((self.checkin_box, "time", None), (self.checkout_box, "time", None),
                               (self.phone_box, "tel", "tel"), (self.email_box, "email", "email")):
            state.control(box).setAttribute("type", typ)
            if auto:
                state.set_control_attr(box, "autocomplete", auto)
        self.results_panel.add_event_handler("x-pick", self._pick_result)
        self.pers_panel.add_event_handler("x-toggle", self._toggle_persona)
        self.pals_panel.add_event_handler("x-pal", self._pick_palette)
        self.feats_panel.add_event_handler("x-feat", self._toggle_feature)
        self.draw()

    # ---------------------------------------------------------------- drawing
    def draw(self):
        step = self.st["step"]
        for i, b in enumerate([self.b0, self.b1, self.b2, self.b3]):
            b.classes["on"] = i == step
            b.classes["done"] = i < step
        self.title.text = STEPS[step]
        for i, s in enumerate([self.s0, self.s1, self.s2, self.s3]):
            s.visible = i == step
        [self._draw0, self._draw1, self._draw2, self._draw3][step]()

    def _draw0(self):
        st = self.st
        self.name_box.text, self.address_box.text = st["name"], st["query"]
        self.results_panel.items = [dict(r, i=i, on=r is st["pick"]) for i, r in enumerate(st["results"])]
        self.no_results.visible = st["searched"] and not st["results"]
        self.map_box.visible = st["pick"] is not None
        self.next0.enabled = st["pick"] is not None
        if st["pick"]:
            self.map.show(st["pick"]["lat"], st["pick"]["lng"], st["name"])

    def _data(self):
        p = self.st["pick"] or {}
        return {"hotel": {"lat": p.get("lat"), "lng": p.get("lng"), "features": self.st["features"]},
                "places": (self.st["scan"] or {}).get("places") or []}

    def _draw1(self):
        st = self.st
        self.scanning.visible = st["scan"] is None
        self.scanned.visible = st["scan"] is not None
        if st["scan"] is None:
            self.scan_title.text = "Exploring around %s" % st["name"]
            self.scan_log.text = "Starting…"
            if not st["scanning"]:
                st["scanning"] = True
                window.setTimeout(self._run_scan, 30)
            return
        s = ns.scan_summary(self._data())
        self.found_title.text = "%d places within a short walk" % s["count"]
        self.cats_panel.items = s["cats"]
        self.lms_panel.items = s["landmarks"]
        self.lms_box.visible = bool(s["landmarks"])
        self.few_note.visible = s["count"] < 25
        self.wider_button.visible = st["radius"] < 2000

    def _draw2(self):
        ranked = ns.rank(self._data())
        if not self.st["personas"]:
            self.st["personas"] = [x["id"] for x in ranked[:8]]
        chosen = self.st["personas"]
        self.pers_panel.items = [dict(x, on=x["id"] in chosen) for x in ranked]
        self._count()

    def _count(self):
        self.chosen_label.text = "%d chosen" % len(self.st["personas"])

    def _draw3(self):
        st = self.st
        self.pals_panel.items = [dict(p, on=p["key"] == st["palette"]) for p in ns.palettes()]
        self.feats_panel.items = [dict(f, on=f["key"] in st["features"]) for f in ns.features()]

    # ---------------------------------------------------------------- step 1: find the hotel
    @handle("find_button", "click")
    def find_button_click(self, **event_args):
        st = self.st
        st["name"] = (self.name_box.text or "").strip()
        st["query"] = (self.address_box.text or "").strip()
        if len(st["name"]) < 2:
            state.toast("Please give the hotel a name first.", "error")
            return
        if not st["query"]:
            state.toast("Please type the address.", "error")
            return
        self.find_button.enabled = False
        try:
            rows = _js_json(window.NSScan.geocode(st["query"]))
        except Exception:
            rows = []
        self.find_button.enabled = True
        st["results"], st["searched"] = rows, True
        st["pick"] = rows[0] if rows else None
        self.draw()

    @handle("address_box", "pressed_enter")
    def address_box_pressed_enter(self, **event_args):
        self.find_button_click()

    def _pick_result(self, i, **event_args):
        self.st["name"] = (self.name_box.text or "").strip() or self.st["name"]
        self.st["pick"] = self.st["results"][i]
        self.draw()

    @handle("next0", "click")
    def next0_click(self, **event_args):
        self.st["name"] = (self.name_box.text or "").strip() or self.st["name"]
        if len(self.st["name"]) < 2:
            state.toast("Please give the hotel a name first.", "error")
            return
        self.st["step"] = 1
        self.draw()

    # ---------------------------------------------------------------- step 2: the scan (in the browser)
    def _log(self, msg):
        self.scan_log.text = str(msg)

    def _run_scan(self):
        st = self.st
        p = st["pick"]
        try:
            test = getattr(window, "NS_TEST_SCAN", None)
            if test:
                r = _js_json(test)
            else:
                r = _js_json(window.NSScan.scan(p["lat"], p["lng"], {"radius": st["radius"], "onProgress": self._log}))
        except Exception as e:
            r = {"places": [], "credits": []}
            state.toast("The scan did not finish (%s). You can add places in the editor." % e, "error")
        st["scan"], st["scanning"] = r, False
        if st["step"] == 1:
            self.draw()

    @handle("wider_button", "click")
    def wider_button_click(self, **event_args):
        self.st["radius"], self.st["scan"] = 2000, None
        self.draw()

    @handle("back1", "click")
    def back1_click(self, **event_args):
        self.st["step"] = 0
        self.draw()

    @handle("next1", "click")
    def next1_click(self, **event_args):
        self.st["step"] = 2
        self.draw()

    # ---------------------------------------------------------------- step 3: guests
    def _toggle_persona(self, pid, on, **event_args):
        chosen = self.st["personas"]
        if on and pid not in chosen:
            chosen.append(pid)
        if not on and pid in chosen:
            chosen.remove(pid)
        self._count()

    def _top(self, n):
        self.st["personas"] = [x["id"] for x in ns.rank(self._data())[:n]]
        if not n:
            self.st["personas"] = []
            self.pers_panel.items = [dict(x, on=False) for x in self.pers_panel.items]
            self._count()
            return
        self._draw2()

    @handle("top8", "click")
    def top8_click(self, **event_args):
        self._top(8)

    @handle("top12", "click")
    def top12_click(self, **event_args):
        self._top(12)

    @handle("top0", "click")
    def top0_click(self, **event_args):
        self._top(0)

    @handle("back2", "click")
    def back2_click(self, **event_args):
        self.st["step"] = 1
        self.draw()

    @handle("next2", "click")
    def next2_click(self, **event_args):
        self.st["step"] = 3
        self.draw()

    # ---------------------------------------------------------------- step 4: look + facts
    def _pick_palette(self, key, **event_args):
        self.st["palette"] = key

    def _toggle_feature(self, key, on, **event_args):
        f = self.st["features"]
        if on and key not in f:
            f.append(key)
        if not on and key in f:
            f.remove(key)

    @handle("back3", "click")
    def back3_click(self, **event_args):
        self.st["step"] = 2
        self.draw()

    @handle("create_button", "click")
    def create_button_click(self, **event_args):
        st, p = self.st, self.st["pick"] or {}
        scan = st["scan"] or {}
        facts = {"name": st["name"], "kind": self.kind_box.selected_value, "stars": self.stars_box.selected_value or 0,
                 "tagline": (self.tagline_box.text or "").strip(), "city": p.get("city"), "country": p.get("country"),
                 "area": p.get("area") or p.get("city"), "address": st["query"] or p.get("label"), "lat": p.get("lat"),
                 "lng": p.get("lng"), "phone": (self.phone_box.text or "").strip(), "email": (self.email_box.text or "").strip(),
                 "checkin": self.checkin_box.text or "15:00", "checkout": self.checkout_box.text or "11:00",
                 "features": st["features"], "palette": st["palette"], "fonts": self.fonts_box.selected_value or "belle",
                 "personas": st["personas"], "places": scan.get("places") or [], "credits": scan.get("credits") or [],
                 "scan": {"at": scan.get("scanned") or str(window.Date().toISOString()), "radius": st["radius"],
                          "sources": scan.get("sources") or []}}
        data = ns.new_site_data(facts)
        self.create_button.enabled = False
        res = state.call("create_site", data)
        self.create_button.enabled = True
        if res:
            state.toast("Your site is ready. Have a look!", "ok")
            router.go("edit", res["id"])
