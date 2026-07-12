# app/services/outcome_service.py

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.outcome import Outcome
from app.models.enums import OutcomeStatusEnum, DecisionStatusEnum
from app.repositories.outcome_repository import OutcomeRepository
from app.repositories.decision_repository import DecisionRepository
from app.schemas.outcome import OutcomeCreate, OutcomeUpdate


class OutcomeService:
    """
    Handles all business logic for Outcome operations.

    Responsibilities:
    - Enforce that outcomes can only be recorded against
      decisions that have reached 'implemented' status
    - Coordinate repository operations
    - Keep routers thin
    """

    def __init__(self, db: Session):
        self.outcome_repo = OutcomeRepository(db)
        self.decision_repo = DecisionRepository(db)

    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------

    def create_outcome(
        self,
        decision_id: int,
        data: OutcomeCreate,
    ) -> Outcome:
        """
        Records a new outcome against a decision.

        Business rule: a decision must be in 'implemented' or
        'completed' status before an outcome can be recorded —
        you can't evaluate the result of a decision that hasn't
        been carried out yet.
        """

        decision = self.decision_repo.get_by_id(decision_id)

        if decision is None:
            raise ValueError("Decision not found.")

        if decision.status not in (
            DecisionStatusEnum.implemented,
            DecisionStatusEnum.completed,
        ):
            raise ValueError(
                "Outcomes can only be recorded for decisions that "
                "have been implemented or completed."
            )

        return self.outcome_repo.create(
            decision_id=decision_id,
            outcome_status=data.outcome_status,
            outcome_desc=data.outcome_desc,
            success_score=data.success_score,
            evaluation_date=data.evaluation_date,
        )

    # -------------------------------------------------------
    # READ
    # -------------------------------------------------------

    def get_outcome(self, outcome_id: int) -> Outcome:
        """
        Returns an outcome by ID.
        """

        outcome = self.outcome_repo.get_by_id(outcome_id)

        if outcome is None:
            raise ValueError("Outcome not found.")

        return outcome

    def list_outcomes_for_decision(
        self,
        decision_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Outcome]:
        """
        Returns every outcome recorded for a decision,
        most recent evaluation first.
        """

        return self.outcome_repo.get_all_by_decision(
            decision_id=decision_id,
            skip=skip,
            limit=limit,
        )

    def get_latest_outcome_for_decision(
        self,
        decision_id: int,
    ) -> Optional[Outcome]:
        """
        Returns only the most recent outcome for a decision.
        """

        return self.outcome_repo.get_latest_by_decision(decision_id)

    def list_outcomes_by_status(
        self,
        status: OutcomeStatusEnum,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Outcome]:
        """
        Returns all outcomes filtered by status.
        Intended for admin reporting views.
        """

        return self.outcome_repo.get_all_by_status(
            status=status,
            skip=skip,
            limit=limit,
        )

    # -------------------------------------------------------
    # UPDATE
    # -------------------------------------------------------

    def update_outcome(
        self,
        outcome_id: int,
        data: OutcomeUpdate,
    ) -> Outcome:
        """
        Partially updates an outcome — e.g. re-evaluating a
        decision's success after more time has passed.
        """

        outcome = self.get_outcome(outcome_id)

        update_data = data.model_dump(exclude_unset=True)

        if not update_data:
            raise ValueError("No fields provided to update.")

        return self.outcome_repo.update(
            outcome,
            outcome_status=update_data.get("outcome_status"),
            outcome_desc=update_data.get("outcome_desc"),
            success_score=update_data.get("success_score"),
            evaluation_date=update_data.get("evaluation_date"),
        )

    # -------------------------------------------------------
    # DELETE
    # -------------------------------------------------------

    def delete_outcome(self, outcome_id: int) -> None:
        """
        Deletes a single outcome record.
        """

        outcome = self.get_outcome(outcome_id)
        self.outcome_repo.delete_by_id(outcome)


# -------------------------------------------------------
# Dependency
# -------------------------------------------------------

def get_outcome_service(db: Session) -> OutcomeService:
    """
    FastAPI dependency.

    Example:

        service: OutcomeService = Depends(get_outcome_service)
    """

    return OutcomeService(db)