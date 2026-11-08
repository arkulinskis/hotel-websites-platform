from anvil import *
from anvil.js import window

from ._anvil_designer import LandingTemplate
from ... import ns, state

# The app's video on the Addanapp YouTube channel (APP_MAKER/youtube/manifest.json), shown in the Watch section.
YT_VIDEO = "2Gm5T_OHFl0"

# The small "what your guests see" demo (Hotel Kristofs, Riga): profile id -> (line, [(time, what, detail)])
DEMO = {
    "foodie": ("Your table is never more than a few minutes away.", [
        ("08:30", "Breakfast at the hotel", "A buffet downstairs, included."), ("10:00", "Wander the Central Market", "Five pavilions in old Zeppelin hangars, 10 min walk."),
        ("13:00", "Lunch at a café nearby", "Picked from the cafés around the hotel."), ("19:30", "Dinner downstairs at Dilettante", "Handmade pasta, no need to go far.")]),
    "family": ("Short walks, big adventures, room for everyone.", [
        ("07:30", "Breakfast at the hotel", "Cots on request; the Family Room sleeps four."), ("09:00", "Fresh air in Bastejkalns Park", "Bridges, ducks and the city canal, 7 min walk."),
        ("11:00", "A museum visit", "Several museums within 10 minutes."), ("19:00", "Pizza at Dilettante", "Downstairs, so little legs can rest.")]),
    "nightowl": ("The bars are close, and so is your bed.", [
        ("11:00", "A late breakfast", "Coffee a couple of minutes away."), ("18:30", "An aperitif on Līvu Square", "4 min walk."),
        ("20:00", "Dinner in the old town", "A short stroll."), ("22:00", "Drinks in an old-town bar", "And back to bed in minutes.")]),
    "artnouveau": ("Wake up among the finest facades in Europe.", [
        ("08:30", "Breakfast at the hotel", "Then ask the desk for the nicest route."), ("10:00", "The Cat House and its rooftop cats", "3 min walk."),
        ("14:30", "Alberta iela", "A street of Eisenstein facades, about 20 min walk."), ("16:30", "Coffee and cake nearby", "Warm up before dinner.")]),
}


class Landing(LandingTemplate):
    """#landing (Persuade): the promise with a drawn hero (a Kristofs page, a map card, a stay card), the Watch section,
    how it works, a four-profile demo of the stay plan, features, the comparison, questions. Static copy lives in the
    template; the demo's profile names and icons come from the renderer (ns-site.js)."""

    def __init__(self, args=(), **properties):
        super().__init__(**properties)
        me = state.me()
        self.guest_cta.visible = self.band_guest.visible = not me
        self.member_cta.visible = self.band_member.visible = bool(me)
        state.set_attr(self.showcase_link, "href", ns.site_url("hotel-kristofs"))
        self.dom_nodes["yt_cover"].addEventListener("click", self._play)
        self.who_panel.add_event_handler("x-pick", self._pick)
        self._who = []
        for key in DEMO:
            p = ns.persona(key) or {"id": key, "name": key, "line": "", "icon": ""}
            self._who.append(dict(p, on=False))
        self._pick(key="foodie")

    def _pick(self, key, **event_args):
        for w in self._who:
            w["on"] = w["id"] == key
        self.who_panel.items = self._who
        p = [w for w in self._who if w["id"] == key][0]
        line, plan = DEMO[key]
        self.plan_title.text = str(p["name"])
        self.plan_line.text = line
        self.plan_panel.items = [{"time": t, "what": w, "detail": d} for t, w, d in plan]

    def _play(self, event):
        """Swap the video's cover for YouTube's player (privacy-enhanced); nothing loads from YouTube before this click."""
        self.dom_nodes["yt_frame"].innerHTML = (
            '<iframe src="https://www.youtube-nocookie.com/embed/' + YT_VIDEO + '?autoplay=1&rel=0&playsinline=1" '
            'title="ArviStay video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen '
            'referrerpolicy="strict-origin-when-cross-origin"></iframe>')
