# services/exceptions.py

"""
Service-layer exceptions.

These are intentionally framework-agnostic (no HTTPException here) so the
service layer doesn't depend on FastAPI. Routers catch these and translate
them into the appropriate HTTP response, e.g.:

    from app.services.exceptions import DecisionNotFoundError, InvalidStatusTransitionError

    @router.patch("/decisions/{decision_id}/status")
    def set_status(decision_id: int, ...):
        try:
            return service.update_decision_status(decision_id, new_status)
        except DecisionNotFoundError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except InvalidStatusTransitionError as e:
            raise HTTPException(status_code=409, detail=str(e))
"""


class DecisionNotFoundError(Exception):
    """Raised when a decision_id doesn't correspond to any row."""

    def __init__(self, decision_id: int):
        self.decision_id = decision_id
        super().__init__(f"Decision {decision_id} not found.")


class InvalidStatusTransitionError(Exception):
    """Raised when a status change isn't allowed from the decision's current status."""

    def __init__(self, current_status, new_status):
        self.current_status = current_status
        self.new_status = new_status
        super().__init__(
            f"Cannot transition decision from '{current_status}' to '{new_status}'."
        )