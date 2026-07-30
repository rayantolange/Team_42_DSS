# app/services/constraint_service.py

from typing import List

from sqlalchemy.orm import Session
from app.services.graph_sync_service import GraphSyncService
from app.models.strategy import ConstraintMaster
from app.repositories.constraint_repository import ConstraintRepository
from app.schemas.constraint import (
    ConstraintCreate,
    ConstraintUpdate,
    DecisionConstraintLink,
)
from app.services.embedding_service import EmbeddingService


class ConstraintService:
    """
    Handles all business logic for ConstraintMaster operations.

    Responsibilities:
    - Coordinate repository operations
    - Link/unlink constraints to decisions
    - Keep the embedding store in sync on create/update
    """

    def __init__(self, db: Session):
        self.constraint_repo = ConstraintRepository(db)
        self.embedding_service = EmbeddingService(db)
        self.graph_sync_service = GraphSyncService()
    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------

    def create_constraint(
        self,
        data: ConstraintCreate,
    ) -> ConstraintMaster:
        """
        Creates a new constraint.
        """

        constraint = self.constraint_repo.create(
            constraint_type=data.constraint_type,
            description=data.description,
        )

        self.embedding_service.embed_constraint(constraint)
        self.graph_sync_service.sync_constraint(constraint)
        return constraint

    # -------------------------------------------------------
    # READ
    # -------------------------------------------------------

    def get_constraint(
        self,
        constraint_id: int,
    ) -> ConstraintMaster:
        """
        Returns a constraint by ID.
        """

        constraint = self.constraint_repo.get_by_id(constraint_id)

        if constraint is None:
            raise ValueError("Constraint not found.")

        return constraint

    def list_constraints(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ConstraintMaster]:
        """
        Returns all constraints.
        """

        return self.constraint_repo.get_all(
            skip=skip,
            limit=limit,
        )

    def list_constraints_for_decision(
        self,
        decision_id: int,
    ) -> List[ConstraintMaster]:
        """
        Returns all constraints linked to a decision.
        """

        return self.constraint_repo.get_all_for_decision(
            decision_id
        )

    # -------------------------------------------------------
    # UPDATE
    # -------------------------------------------------------

    def update_constraint(
        self,
        constraint_id: int,
        data: ConstraintUpdate,
    ) -> ConstraintMaster:
        """
        Updates an existing constraint.
        """

        constraint = self.get_constraint(constraint_id)

        updated_constraint = self.constraint_repo.update(
            constraint=constraint,
            constraint_type=data.constraint_type,
            description=data.description,
        )

        self.embedding_service.embed_constraint(updated_constraint)
        self.graph_sync_service.sync_constraint(updated_constraint)
        return updated_constraint

    # -------------------------------------------------------
    # LINK
    # -------------------------------------------------------

    def link_constraint_to_decision(
        self,
        decision_id: int,
        data: DecisionConstraintLink,
    ) -> ConstraintMaster:
        """
        Links a constraint to a decision.
        """

        constraint = self.get_constraint(
            data.constraint_id
        )

        self.constraint_repo.link_to_decision(
            decision_id=decision_id,
            constraint_id=data.constraint_id,
        )
        self.graph_sync_service.link_decision_constraint(
        decision_id=decision_id, constraint_id=data.constraint_id
        )
        return constraint

    # -------------------------------------------------------
    # UNLINK
    # -------------------------------------------------------

    def unlink_constraint_from_decision(
        self,
        decision_id: int,
        constraint_id: int,
    ) -> None:
        """
        Removes a constraint from a decision.
        """

        self.get_constraint(constraint_id)

        self.constraint_repo.unlink_from_decision(
            decision_id=decision_id,
            constraint_id=constraint_id,
        )
        self.graph_sync_service.unlink_decision_constraint(  # add
            decision_id=decision_id, constraint_id=constraint_id
        )

    # -------------------------------------------------------
    # DELETE
    # -------------------------------------------------------

    def delete_constraint(
        self,
        constraint_id: int,
    ) -> None:
        """
        Deletes a constraint.
        """

        constraint = self.get_constraint(constraint_id)

        self.constraint_repo.delete_by_id(constraint)
        self.graph_sync_service.delete_constraint(constraint_id)

# -------------------------------------------------------
# FastAPI Dependency
# -------------------------------------------------------

def get_constraint_service(
    db: Session,
) -> ConstraintService:
    """
    FastAPI dependency.

    Example:

        service: ConstraintService = Depends(get_constraint_service)
    """

    return ConstraintService(db)