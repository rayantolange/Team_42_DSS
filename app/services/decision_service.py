# services/decision_service.py

from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.decision import Decision
from app.models.enums import DecisionStatusEnum
from app.repositories.decision_repository import DecisionRepository
from app.schemas.decision import DecisionCreate
from app.services.exceptions import DecisionNotFoundError, InvalidStatusTransitionError


class DecisionService:
    """
    Business logic layer for Decision.

    For now this is mostly a thin pass-through to DecisionRepository:
    field-level validation (length, required-ness, etc.) is already
    handled by the DecisionCreate schema, so create_decision() just
    coordinates the call to the repository.

    Keeping this as its own class (rather than calling the repository
    directly from the router) gives us a single place to add real
    business rules later — e.g. checking department-level permissions,
    enforcing decision_date constraints, triggering notifications,
    kicking off an AI-assisted recommendation step, etc. — without
    touching the router or the repository.
    """

    def __init__(self, db: Session):
        self.db = db
        self.repository = DecisionRepository(db)

    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------

    def create_decision(
        self,
        payload: DecisionCreate,
        department_id: int,
        created_by: int,
    ) -> Decision:
        """
        Creates a new decision.

        department_id and created_by are NOT taken from the payload —
        they're passed in explicitly by the router, sourced from the
        authenticated user's session/token. This mirrors the same
        rule already enforced in DecisionRepository.create().

        Args:
            payload: validated DecisionCreate schema from the request body.
            department_id: department of the authenticated user.
            created_by: user_id of the authenticated user.

        Returns:
            The newly persisted Decision ORM object.
        """
        # Future home for pre-create business rules, e.g.:
        #   - confirm the user is allowed to create decisions for this department
        #   - validate decision_date isn't in the past
        #   - default decision_type based on department settings

        return self.repository.create(
            department_id=department_id,
            created_by=created_by,
            title=payload.title,
            problem_statement=payload.problem_statement,
            decision_desc=payload.decision_desc,
            decision_type=payload.decision_type,
            decision_date=payload.decision_date,
        )

    # -------------------------------------------------------
    # READ
    # -------------------------------------------------------

    def get_decision(self, decision_id: int) -> Decision:
        """
        Fetches a single decision by ID.

        Raises:
            DecisionNotFoundError: if no decision with this ID exists.
        """
        decision = self.repository.get_by_id(decision_id)
        if decision is None:
            raise DecisionNotFoundError(decision_id)
        return decision

    def list_decisions_for_department(
        self,
        department_id: int,
        status: Optional[DecisionStatusEnum] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Decision]:
        """
        Lists decisions for a department, optionally filtered by status.
        Backs the department dashboard endpoint.
        """
        if status is not None:
            return self.repository.get_all_by_department_and_status(
                department_id=department_id,
                status=status,
                skip=skip,
                limit=limit,
            )
        return self.repository.get_all_by_department(
            department_id=department_id,
            skip=skip,
            limit=limit,
        )

    # -------------------------------------------------------
    # STATUS TRANSITIONS
    # -------------------------------------------------------

    # TODO: replace with your actual DecisionStatusEnum members and the
    # real workflow you want enforced. We know `draft` exists (it's the
    # DB default in the Decision model) — fill in the rest once the other
    # statuses are confirmed. Until this map has entries, every transition
    # is allowed (permissive default) so this doesn't block you in the
    # meantime.
    #
    # Example, once you confirm the real member names:
    # _ALLOWED_TRANSITIONS: dict[DecisionStatusEnum, set[DecisionStatusEnum]] = {
    #     DecisionStatusEnum.draft: {DecisionStatusEnum.submitted},
    #     DecisionStatusEnum.submitted: {DecisionStatusEnum.approved, DecisionStatusEnum.rejected},
    #     DecisionStatusEnum.approved: {DecisionStatusEnum.implemented},
    #     DecisionStatusEnum.rejected: set(),     # terminal
    #     DecisionStatusEnum.implemented: set(),  # terminal
    # }
    _ALLOWED_TRANSITIONS: dict = {}

    def update_decision_status(
        self,
        decision_id: int,
        new_status: DecisionStatusEnum,
    ) -> Decision:
        """
        Validates and applies a status transition.

        Raises:
            DecisionNotFoundError: if the decision doesn't exist.
            InvalidStatusTransitionError: if the transition isn't allowed
                from the decision's current status (only enforced once
                _ALLOWED_TRANSITIONS is filled in above).
        """
        decision = self.get_decision(decision_id)

        allowed_next = self._ALLOWED_TRANSITIONS.get(decision.status)
        if allowed_next is not None and new_status not in allowed_next:
            raise InvalidStatusTransitionError(decision.status, new_status)

        return self.repository.update_status(decision, new_status)


# -------------------------------------------------------
# FastAPI dependency
# -------------------------------------------------------

def get_decision_service(db: Session) -> DecisionService:
    """
    Convenience factory for wiring DecisionService into routers via
    FastAPI's Depends(), e.g.:

        def get_db() -> Session: ...

        @router.post("/decisions")
        def create_decision(
            payload: DecisionCreate,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),
        ):
            service = DecisionService(db)
            return service.create_decision(
                payload=payload,
                department_id=current_user.department_id,
                created_by=current_user.user_id,
            )
    """
    return DecisionService(db)