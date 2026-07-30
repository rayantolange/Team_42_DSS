# repositories/decision_repository.py

from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.decision import Decision
from app.models.enums import DecisionStatusEnum
from app.repositories.base import BaseRepository


class DecisionRepository(BaseRepository[Decision]):
    """
    Handles all database operations for the Decision model.
    """

    def __init__(self, db: Session):
        super().__init__(Decision, db)

    # -------------------------------------------------------
    # READ
    # -------------------------------------------------------

    def get_by_id(self, decision_id: int) -> Optional[Decision]:
        return (
            self.db.query(Decision)
            .filter(Decision.decision_id == decision_id)
            .first()
        )

    def get_all_by_department(
        self,
        department_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Decision]:
        """
        Fetch all decisions belonging to a department.
        Core query for department-level dashboards.
        """
        return (
            self.db.query(Decision)
            .filter(Decision.department_id == department_id)
            .order_by(Decision.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_all_by_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Decision]:
        """
        Fetch all decisions created by a specific user.
        Used for personal dashboards and audit trails.
        """
        return (
            self.db.query(Decision)
            .filter(Decision.created_by == user_id)
            .order_by(Decision.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_all_by_status(
        self,
        status: DecisionStatusEnum,
        skip: int = 0,
        limit: int = 100
    ) -> List[Decision]:
        """
        Fetch all decisions filtered by status.
        Useful for admin views — e.g. all pending approvals.
        """
        return (
            self.db.query(Decision)
            .filter(Decision.status == status)
            .order_by(Decision.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_all_by_department_and_status(
        self,
        department_id: int,
        status: DecisionStatusEnum,
        skip: int = 0,
        limit: int = 100
    ) -> List[Decision]:
        """
        Combined filter — department + status.
        Most common query for department dashboards
        that show decisions filtered by their current stage.
        """
        return (
            self.db.query(Decision)
            .filter(
                Decision.department_id == department_id,
                Decision.status == status
            )
            .order_by(Decision.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    # -------------------------------------------------------
    # DASHBOARD AGGREGATES
    # -------------------------------------------------------
    def count_all(self) -> int:
        return self.db.query(Decision).count()

    def count_by_department(self, department_id: int) -> int:
        return (
            self.db.query(Decision)
            .filter(Decision.department_id == department_id)
            .count()
        )

    def count_pending(self, department_id: Optional[int] = None) -> int:
        query = self.db.query(Decision).filter(
            Decision.status == DecisionStatusEnum.draft
        )
        if department_id is not None:
            query = query.filter(Decision.department_id == department_id)
        return query.count()

    def get_recent(
        self, department_id: Optional[int] = None, limit: int = 8
    ) -> List[Decision]:
        query = self.db.query(Decision)
        if department_id is not None:
            query = query.filter(Decision.department_id == department_id)
        return query.order_by(Decision.created_at.desc()).limit(limit).all()

    def get_monthly_status_counts(
        self, department_id: Optional[int] = None
    ) -> List[dict]:
        """
        Groups decisions by month (of decision_date) and status.
        Decisions with a null decision_date are excluded — older
        records created before decision_date became a required
        frontend field.
        """
        from sqlalchemy import func

        query = self.db.query(
            func.to_char(Decision.decision_date, "YYYY-MM").label("month"),
            Decision.status,
            func.count(Decision.decision_id).label("count"),
        ).filter(Decision.decision_date.isnot(None))

        if department_id is not None:
            query = query.filter(Decision.department_id == department_id)

        query = query.group_by("month", Decision.status).order_by("month")
        rows = query.all()
        return [
            {"month": row.month, "status": row.status.value, "count": row.count}
            for row in rows
        ]

    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------

    def create(
        self,
        department_id: int,
        created_by: int,
        title: str,
        problem_statement: str,
        decision_desc: str,
        decision_type: Optional[str] = None,
        decision_date=None,
    ) -> Decision:
        """
        Creates and persists a new decision.
        Status defaults to 'draft' at the DB level.
        department_id and created_by are injected by the service
        from the authenticated user — never from request body.
        """
        new_decision = Decision(
            department_id=department_id,
            created_by=created_by,
            title=title,
            problem_statement=problem_statement,
            decision_desc=decision_desc,
            decision_type=decision_type,
            decision_date=decision_date,
        )
        return self.save(new_decision)

    # -------------------------------------------------------
    # UPDATE
    # -------------------------------------------------------

    def update(
        self,
        decision: Decision,
        title: Optional[str] = None,
        problem_statement: Optional[str] = None,
        decision_desc: Optional[str] = None,
        decision_type: Optional[str] = None,
        status: Optional[DecisionStatusEnum] = None,
        decision_date=None,
    ) -> Decision:
        """
        Partially updates a decision.
        Only fields explicitly passed will be changed.
        updated_at is handled automatically by SQLAlchemy onupdate.
        """
        if title is not None:
            decision.title = title
        if problem_statement is not None:
            decision.problem_statement = problem_statement
        if decision_desc is not None:
            decision.decision_desc = decision_desc
        if decision_type is not None:
            decision.decision_type = decision_type
        if status is not None:
            decision.status = status
        if decision_date is not None:
            decision.decision_date = decision_date

        return self.save(decision)

    def update_status(
        self,
        decision: Decision,
        new_status: DecisionStatusEnum
    ) -> Decision:
        """
        Dedicated status transition method.
        Kept separate because status changes often have
        their own business rules enforced in the service layer
        before this is called.
        """
        decision.status = new_status
        return self.save(decision)

    # -------------------------------------------------------
    # JUNCTION — Strategies
    # -------------------------------------------------------

    def link_strategy(self, decision: Decision, strategy_id: int) -> Decision:
        """
        Links a strategy to a decision via the junction table.
        SQLAlchemy handles the insert into decision_strategies.
        """
        from app.models.junction import DecisionStrategy

        link = DecisionStrategy(
            decision_id=decision.decision_id,
            strategy_id=strategy_id
        )
        self.db.add(link)
        self.db.commit()
        return decision

    def unlink_strategy(self, decision_id: int, strategy_id: int) -> None:
        """
        Removes a strategy link from a decision.
        """
        from app.models.junction import DecisionStrategy

        self.db.query(DecisionStrategy).filter(
            DecisionStrategy.decision_id == decision_id,
            DecisionStrategy.strategy_id == strategy_id
        ).delete()
        self.db.commit()

    # -------------------------------------------------------
    # JUNCTION — Constraints
    # -------------------------------------------------------

    def link_constraint(self, decision: Decision, constraint_id: int) -> Decision:
        """
        Links a constraint to a decision via the junction table.
        """
        from app.models.junction import DecisionConstraint

        link = DecisionConstraint(
            decision_id=decision.decision_id,
            constraint_id=constraint_id
        )
        self.db.add(link)
        self.db.commit()
        return decision

    def unlink_constraint(self, decision_id: int, constraint_id: int) -> None:
        """
        Removes a constraint link from a decision.
        """
        from app.models.junction import DecisionConstraint

        self.db.query(DecisionConstraint).filter(
            DecisionConstraint.decision_id == decision_id,
            DecisionConstraint.constraint_id == constraint_id
        ).delete()
        self.db.commit()

    # -------------------------------------------------------
    # DELETE
    # -------------------------------------------------------

    def delete_by_id(self, decision: Decision) -> None:
        """
        Deletes a decision. Cascade rules in the DB will
        automatically remove related documents, outcomes,
        and junction table rows.
        """
        self.delete(decision)