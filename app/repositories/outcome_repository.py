# repositories/outcome_repository.py

from typing import Optional, List
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.outcome import Outcome
from app.models.enums import OutcomeStatusEnum
from app.repositories.base import BaseRepository


class OutcomeRepository(BaseRepository[Outcome]):
    """
    Handles all database operations for the Outcome model.
    Outcomes are always scoped to a decision.
    A decision can have multiple outcomes over time
    as evaluations are updated or re-run.
    """

    def __init__(self, db: Session):
        super().__init__(Outcome, db)

    # -------------------------------------------------------
    # READ
    # -------------------------------------------------------

    def get_by_id(self, outcome_id: int) -> Optional[Outcome]:
        return (
            self.db.query(Outcome)
            .filter(Outcome.outcome_id == outcome_id)
            .first()
        )

    def get_all_by_decision(
        self,
        decision_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Outcome]:
        """
        Fetch all outcomes recorded for a specific decision.
        Ordered by most recent evaluation first.
        Primary query for GET /decisions/{id}/outcomes.
        """
        return (
            self.db.query(Outcome)
            .filter(Outcome.decision_id == decision_id)
            .order_by(Outcome.evaluation_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_latest_by_decision(self, decision_id: int) -> Optional[Outcome]:
        """
        Fetch only the most recent outcome for a decision.
        Useful for dashboard cards that show the current
        state of a decision without listing full history.
        """
        return (
            self.db.query(Outcome)
            .filter(Outcome.decision_id == decision_id)
            .order_by(Outcome.evaluation_date.desc())
            .first()
        )

    def get_all_by_status(
        self,
        status: OutcomeStatusEnum,
        skip: int = 0,
        limit: int = 100
    ) -> List[Outcome]:
        """
        Fetch all outcomes filtered by status.
        Useful for admin reporting — e.g. all failed outcomes.
        """
        return (
            self.db.query(Outcome)
            .filter(Outcome.outcome_status == status)
            .order_by(Outcome.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------

    def create(
        self,
        decision_id: int,
        outcome_status: OutcomeStatusEnum,
        outcome_desc: Optional[str] = None,
        success_score: Optional[Decimal] = None,
        evaluation_date=None,
    ) -> Outcome:
        """
        Creates and persists a new outcome record.
        decision_id is injected by the service from the route path.
        The service layer must verify the decision exists and
        is in 'implemented' status before calling this.
        """
        new_outcome = Outcome(
            decision_id=decision_id,
            outcome_status=outcome_status,
            outcome_desc=outcome_desc,
            success_score=success_score,
            evaluation_date=evaluation_date,
        )
        return self.save(new_outcome)

    # -------------------------------------------------------
    # UPDATE
    # -------------------------------------------------------

    def update(
        self,
        outcome: Outcome,
        outcome_status: Optional[OutcomeStatusEnum] = None,
        outcome_desc: Optional[str] = None,
        success_score: Optional[Decimal] = None,
        evaluation_date=None,
    ) -> Outcome:
        """
        Partially updates an outcome record.
        Only fields explicitly passed will be changed.
        Useful when re-evaluating after more time has passed.
        """
        if outcome_status is not None:
            outcome.outcome_status = outcome_status
        if outcome_desc is not None:
            outcome.outcome_desc = outcome_desc
        if success_score is not None:
            outcome.success_score = success_score
        if evaluation_date is not None:
            outcome.evaluation_date = evaluation_date

        return self.save(outcome)

    # -------------------------------------------------------
    # DELETE
    # -------------------------------------------------------

    def delete_by_id(self, outcome: Outcome) -> None:
        """
        Deletes a single outcome record.
        Cascade from decision deletion is handled at DB level.
        """
        self.delete(outcome)