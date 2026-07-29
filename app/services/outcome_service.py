# app/services/outcome_service.py

from typing import List, Optional

from sqlalchemy.orm import Session
from app.services.graph_sync_service import GraphSyncService
from app.models.outcome import Outcome
from app.models.enums import OutcomeStatusEnum, DecisionStatusEnum
from app.repositories.outcome_repository import OutcomeRepository
from app.repositories.decision_repository import DecisionRepository
from app.schemas.outcome import OutcomeCreate, OutcomeUpdate
from app.services.embedding_service import EmbeddingService

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
        self.embedding_service = EmbeddingService(db)
        self.graph_sync_service = GraphSyncService()
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

        outcome = self.outcome_repo.create(
            decision_id=decision_id,
            outcome_status=data.outcome_status,
            outcome_desc=data.outcome_desc,
            success_score=data.success_score,
            evaluation_date=data.evaluation_date,
        )

        self.embedding_service.embed_outcome(outcome)
        self.graph_sync_service.sync_outcome(outcome)
        return outcome

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

    def list_all_outcomes_scoped(
        self,
        current_user,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Outcome]:
        """
        Returns outcomes across all decisions the user can see —
        every decision for admins, only their own department's
        decisions for everyone else.
        """
        from app.models.enums import UserRoleEnum

        department_id = (
            None if current_user.role == UserRoleEnum.admin
            else current_user.department_id
        )
        return self.outcome_repo.get_all_scoped(
            department_id=department_id,
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

        updated_outcome = self.outcome_repo.update(
            outcome,
            outcome_status=update_data.get("outcome_status"),
            outcome_desc=update_data.get("outcome_desc"),
            success_score=update_data.get("success_score"),
            evaluation_date=update_data.get("evaluation_date"),
        )

        self.embedding_service.embed_outcome(updated_outcome)
        self.graph_sync_service.sync_outcome(updated_outcome)

        return updated_outcome

    # -------------------------------------------------------
    # DELETE
    # -------------------------------------------------------

    def delete_outcome(self, outcome_id: int) -> None:
        """
        Deletes a single outcome record.
        """

        outcome = self.get_outcome(outcome_id)
        self.outcome_repo.delete_by_id(outcome)
        self.graph_sync_service.delete_outcome(outcome_id)

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