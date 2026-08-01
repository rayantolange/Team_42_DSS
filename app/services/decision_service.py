# app/services/decision_service.py

from typing import List, Optional

from sqlalchemy.orm import Session
from app.services.graph_sync_service import GraphSyncService
from app.models.decision import Decision
from app.models.enums import DecisionStatusEnum
from app.repositories.decision_repository import DecisionRepository
from app.schemas.decision import DecisionCreate, DecisionUpdate
from app.tasks.embedding_tasks import embed_decision_task

from app.repositories.strategy_repository import StrategyRepository
from app.repositories.constraint_repository import ConstraintRepository
from app.repositories.outcome_repository import OutcomeRepository

class DecisionService:
    """
    Handles all business logic for Decision operations.

    Responsibilities:
    - Validate business rules
    - Coordinate repository operations
    - Enforce decision workflow
    - Keep routers thin
    """

    def __init__(self, db: Session):
        self.db = db
        self.decision_repo = DecisionRepository(db)
        self.graph_sync_service = GraphSyncService()
    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------

    def create_decision(
        self,
        data: DecisionCreate,
        department_id: int,
        created_by: int,
    ) -> Decision:
        """
        Creates a new decision.

        Business rules can be added here later, such as:
        - Permission checks
        - AI validation
        - Duplicate detection
        - Notifications
        """

        decision = self.decision_repo.create(
            department_id=department_id,
            created_by=created_by,
            title=data.title,
            problem_statement=data.problem_statement,
            decision_desc=data.decision_desc,
            decision_type=data.decision_type,
            decision_date=data.decision_date,
        )

        embed_decision_task.delay(decision.decision_id)
        self.graph_sync_service.sync_decision(decision)
        return decision

    # -------------------------------------------------------
    # READ
    # -------------------------------------------------------

    def get_decision(self, decision_id: int) -> Decision:
        """
        Returns a decision by ID.
        """

        decision = self.decision_repo.get_by_id(decision_id)

        if decision is None:
            raise ValueError("Decision not found.")

        return decision

    def list_decisions_for_department(
        self,
        department_id: int,
        status: Optional[DecisionStatusEnum] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Decision]:
        """
        Returns all decisions belonging to a department.
        Optionally filters by status.
        """

        if status is not None:
            return self.decision_repo.get_all_by_department_and_status(
                department_id=department_id,
                status=status,
                skip=skip,
                limit=limit,
            )

        return self.decision_repo.get_all_by_department(
            department_id=department_id,
            skip=skip,
            limit=limit,
        )

    def get_graph_data(
        self,
        department_id: int,
        status: Optional[DecisionStatusEnum] = None,
        skip: int = 0,
        limit: int = 200,
    ):
        """
        Bulk-fetches decisions plus their linked strategies, constraints,
        and outcomes for the Graph Explorer view. 3 queries total,
        regardless of how many decisions there are.
        """
        decisions = self.list_decisions_for_department(
            department_id=department_id, status=status, skip=skip, limit=limit
        )
        decision_ids = [d.decision_id for d in decisions]

        strategy_repo = StrategyRepository(self.db)
        constraint_repo = ConstraintRepository(self.db)
        outcome_repo = OutcomeRepository(self.db)

        strategy_rows = strategy_repo.get_all_for_decisions(decision_ids)
        constraint_rows = constraint_repo.get_all_for_decisions(decision_ids)
        outcome_rows = outcome_repo.get_all_by_decisions(decision_ids)

        links_by_decision = {
            d_id: {"strategies": [], "constraints": [], "outcomes": []}
            for d_id in decision_ids
        }

        for d_id, strategy in strategy_rows:
            links_by_decision[d_id]["strategies"].append(strategy)

        for d_id, constraint in constraint_rows:
            links_by_decision[d_id]["constraints"].append(constraint)

        for outcome in outcome_rows:
            links_by_decision[outcome.decision_id]["outcomes"].append(outcome)

        return decisions, links_by_decision

    # -------------------------------------------------------
    # STATUS UPDATE
    # -------------------------------------------------------

    def update_decision_status(
        self,
        decision_id: int,
        new_status: DecisionStatusEnum,
    ) -> Decision:
        decision = self.get_decision(decision_id)

        # Terminal states — cannot be modified at all, including cancellation
        if decision.status == DecisionStatusEnum.cancelled:
            raise ValueError("Cancelled decisions cannot be modified.")
        if decision.status == DecisionStatusEnum.completed:
            raise ValueError("Completed decisions cannot be modified.")

        # Allow cancelling at any time (from any remaining non-terminal state)
        if new_status == DecisionStatusEnum.cancelled:
            cancelled = self.decision_repo.update_status(decision, new_status)
            self.graph_sync_service.sync_decision(cancelled)
            return cancelled

        status_order = [
            DecisionStatusEnum.draft,
            DecisionStatusEnum.approved,
            DecisionStatusEnum.implemented,
            DecisionStatusEnum.completed,
        ]

        current_index = status_order.index(decision.status)
        expected_next = status_order[current_index + 1]
        if new_status != expected_next:
            raise ValueError(
                f"Decision can only move from "
                f"{decision.status.value} "
                f"to "
                f"{expected_next.value}."
            )
        updated = self.decision_repo.update_status(decision, new_status)
        self.graph_sync_service.sync_decision(updated)
        return updated

# -------------------------------------------------------
    # UPDATE (partial, non-status fields)
    # -------------------------------------------------------

    def update_decision(
        self,
        decision_id: int,
        data: DecisionUpdate,
    ) -> Decision:
        """
        Partially updates a decision's editable fields.
        Does NOT handle status transitions — use update_decision_status
        for that, since status changes follow a strict workflow.
        """

        decision = self.get_decision(decision_id)

        if decision.status == DecisionStatusEnum.completed:
            raise ValueError(
                "Completed decisions cannot be modified."
            )

        if decision.status == DecisionStatusEnum.cancelled:
            raise ValueError(
                "Cancelled decisions cannot be modified."
            )

        update_data = data.model_dump(exclude_unset=True, exclude={"status"})

        if not update_data:
            raise ValueError("No fields provided to update.")

        updated_decision = self.decision_repo.update(
            decision,
            title=update_data.get("title"),
            problem_statement=update_data.get("problem_statement"),
            decision_desc=update_data.get("decision_desc"),
            decision_type=update_data.get("decision_type"),
            decision_date=update_data.get("decision_date"),
        )

        embed_decision_task.delay(updated_decision.decision_id)
        self.graph_sync_service.sync_decision(updated_decision)
        return updated_decision
# -------------------------------------------------------
# Dependency
# -------------------------------------------------------

def get_decision_service(db: Session) -> DecisionService:
    """
    FastAPI dependency.

    Example:

        service: DecisionService = Depends(get_decision_service)
    """

    return DecisionService(db)

