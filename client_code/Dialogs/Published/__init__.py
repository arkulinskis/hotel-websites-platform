from anvil import *
import anvil.js

from ._anvil_designer import PublishedTemplate
from ... import ns, state


class Published(PublishedTemplate):
    """After publishing: the site's link, copy it, open it."""

    def __init__(self, url="", **properties):
        super().__init__(**properties)
        self.url = url
        state.set_attr(self.link, "href", url)
        state.set_attr(self.open_link, "href", url)
        anvil.js.get_dom_node(self.link).textContent = url

    @handle("copy_button", "click")
    def copy_button_click(self, **event_args):
        ns.copy_text(self.url)

    @handle("close_button", "click")
    def close_button_click(self, **event_args):
        self.raise_event("x-close-alert", value=True)
