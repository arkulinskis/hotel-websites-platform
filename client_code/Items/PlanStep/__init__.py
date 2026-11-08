from anvil import *

from ._anvil_designer import PlanStepTemplate


class PlanStep(PlanStepTemplate):
    """One hour of the landing page's demo stay. item = {time, what, detail}."""

    def __init__(self, **properties):
        super().__init__(**properties)
        for k in ("time", "what", "detail"):
            self.dom_nodes[k].textContent = self.item.get(k) or ""
