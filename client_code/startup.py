"""The app starts here (anvil.yaml: startup module). One server call to learn who is signed in (Anvil's loading
spinner shows meanwhile), the Privacy & Terms kit, the engines' bridge (ns.install), then the page for the address."""
import json

import anvil.server
from anvil.js import window

from . import auth, legal, ns, router, state

LEGAL_THEME = {"accent": "#1f5c55"}  # colours for the Privacy & Terms page (match --c-brand in app.css)

legal.setup(LEGAL_THEME)
ns.install()
state.set_me(anvil.server.call("get_me"))
if state.me():
    legal.refresh_soon()


def _test_call(name, args_json):
    """For tools/ui/smoke.js: the same server calls the pages make (plus sign-out), JSON text in and out."""
    if name == "__logout__":
        auth.sign_out()
        return "null"
    return json.dumps(anvil.server.call(name, *json.loads(args_json or "[]")))


window.nsTestCall = _test_call
router.start()
