# app/repositories/constraint_repository.py

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.strategy import ConstraintMaster
from app.models.junction import DecisionConstraint
from app.repositories.base import BaseRepository


class ConstraintRepository(BaseRepository[ConstraintMaster]):
    """
    Handles all database operations for the ConstraintMaster model.
    """

    def __init__(self, db: Session):
        super().__init__(ConstraintMaster, db)

    # -------------------------------------------------------
    # READ
    # -------------------------------------------------------

    def get_by_id(self, constraint_id: int) -> Optional[ConstraintMaster]:
        """
        Fetch a constraint by its primary key.
        """
        return (
            self.db.query(ConstraintMaster)
            .filter(ConstraintMaster.constraint_id == constraint_id)
            .first()
        )

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ConstraintMaster]:
        """
        Returns all constraints.
        """
        return (
            self.db.query(ConstraintMaster)
            .order_by(ConstraintMaster.constraint_type.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_all_for_decision(
        self,
        decision_id: int,
    ) -> List[ConstraintMaster]:
        """
        Returns all constraints linked to a decision.
        """
        return (
            self.db.query(ConstraintMaster)
            .join(
                DecisionConstraint,
                ConstraintMaster.constraint_id == DecisionConstraint.constraint_id,
            )
            .filter(
                DecisionConstraint.decision_id == decision_id
            )
            .all()
        )

    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------

    def create(
        self,
        constraint_type: str,
        description: Optional[str] = None,
    ) -> ConstraintMaster:
        """
        Creates and persists a new constraint.
        """

        constraint = ConstraintMaster(
            constraint_type=constraint_type,
            description=description,
        )

        return self.save(constraint)

    # -------------------------------------------------------
    # UPDATE
    # -------------------------------------------------------

    def update(
        self,
        constraint: ConstraintMaster,
        constraint_type: Optional[str] = None,
        description: Optional[str] = None,
    ) -> ConstraintMaster:
        """
        Partially updates a constraint.
        """

        if constraint_type is not None:
            constraint.constraint_type = constraint_type

        if description is not None:
            constraint.description = description

        return self.save(constraint)

    # -------------------------------------------------------
    # JUNCTION
    # -------------------------------------------------------

    def link_to_decision(
        self,
        decision_id: int,
        constraint_id: int,
    ) -> ConstraintMaster:
        """
        Links a constraint to a decision.
        """

        link = DecisionConstraint(
            decision_id=decision_id,
            constraint_id=constraint_id,
        )

        self.db.add(link)
        self.db.commit()

        return self.get_by_id(constraint_id)

    def unlink_from_decision(
        self,
        decision_id: int,
        constraint_id: int,
    ) -> None:
        """
        Removes a constraint from a decision.
        """

        (
            self.db.query(DecisionConstraint)
            .filter(
                DecisionConstraint.decision_id == decision_id,
                DecisionConstraint.constraint_id == constraint_id,
            )
            .delete()
        )

        self.db.commit()

    # -------------------------------------------------------
    # DELETE
    # -------------------------------------------------------

    def delete_by_id(
        self,
        constraint: ConstraintMaster,
    ) -> None:
        """
        Deletes a constraint.
        """

        self.delete(constraint)

    def get_all_for_decisions(self, decision_ids: List[int]) -> List[tuple]:
        """Bulk fetch: (decision_id, ConstraintMaster) pairs for all given decisions."""
        if not decision_ids:
            return []
        return (
            self.db.query(DecisionConstraint.decision_id, ConstraintMaster)
            .join(ConstraintMaster, ConstraintMaster.constraint_id == DecisionConstraint.constraint_id)
            .filter(DecisionConstraint.decision_id.in_(decision_ids))
            .all()
        )