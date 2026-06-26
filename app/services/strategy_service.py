# app/services/strategy_service.py

from typing import List

from sqlalchemy.orm import Session

from app.models.strategy import Strategy
from app.repositories.strategy_repository import StrategyRepository
from app.schemas.strategy import (
    StrategyCreate,
    StrategyUpdate,
    DecisionStrategyLink,
)


class StrategyService:
    """
    Handles all business logic for Strategy operations.

    Responsibilities:
    - Validate business rules
    - Prevent duplicate strategies
    - Coordinate repository operations
    - Link/unlink strategies to decisions
    """

    def __init__(self, db: Session):
        self.strategy_repo = StrategyRepository(db)

    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------

    def create_strategy(
        self,
        data: StrategyCreate,
    ) -> Strategy:
        """
        Creates a new strategy.

        Business Rules:
        - Strategy name must be unique.
        """

        existing = self.strategy_repo.get_by_name(
            data.strategy_name
        )

        if existing:
            raise ValueError(
                "A strategy with this name already exists."
            )

        return self.strategy_repo.create(
            strategy_name=data.strategy_name,
            description=data.description,
        )

    # -------------------------------------------------------
    # READ
    # -------------------------------------------------------

    def get_strategy(
        self,
        strategy_id: int,
    ) -> Strategy:
        """
        Returns a strategy by ID.
        """

        strategy = self.strategy_repo.get_by_id(strategy_id)

        if strategy is None:
            raise ValueError("Strategy not found.")

        return strategy

    def list_strategies(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Strategy]:
        """
        Returns all strategies.
        """

        return self.strategy_repo.get_all(
            skip=skip,
            limit=limit,
        )

    def list_strategies_for_decision(
        self,
        decision_id: int,
    ) -> List[Strategy]:
        """
        Returns all strategies linked to a decision.
        """

        return self.strategy_repo.get_all_for_decision(
            decision_id
        )

    # -------------------------------------------------------
    # UPDATE
    # -------------------------------------------------------

    def update_strategy(
        self,
        strategy_id: int,
        data: StrategyUpdate,
    ) -> Strategy:
        """
        Updates an existing strategy.
        """

        strategy = self.get_strategy(strategy_id)

        # Check duplicate name
        if (
            data.strategy_name is not None
            and data.strategy_name != strategy.strategy_name
        ):
            existing = self.strategy_repo.get_by_name(
                data.strategy_name
            )

            if existing:
                raise ValueError(
                    "A strategy with this name already exists."
                )

        return self.strategy_repo.update(
            strategy=strategy,
            strategy_name=data.strategy_name,
            description=data.description,
        )

    # -------------------------------------------------------
    # LINK
    # -------------------------------------------------------

    def link_strategy_to_decision(
        self,
        decision_id: int,
        data: DecisionStrategyLink,
    ) -> Strategy:
        """
        Links a strategy to a decision.
        """

        strategy = self.get_strategy(
            data.strategy_id
        )

        self.strategy_repo.link_to_decision(
            decision_id=decision_id,
            strategy_id=data.strategy_id,
        )

        return strategy

    # -------------------------------------------------------
    # UNLINK
    # -------------------------------------------------------

    def unlink_strategy_from_decision(
        self,
        decision_id: int,
        strategy_id: int,
    ) -> None:
        """
        Removes a strategy from a decision.
        """

        self.get_strategy(strategy_id)

        self.strategy_repo.unlink_from_decision(
            decision_id=decision_id,
            strategy_id=strategy_id,
        )

    # -------------------------------------------------------
    # DELETE
    # -------------------------------------------------------

    def delete_strategy(
        self,
        strategy_id: int,
    ) -> None:
        """
        Deletes a strategy.
        """

        strategy = self.get_strategy(strategy_id)

        self.strategy_repo.delete_by_id(strategy)


# -------------------------------------------------------
# FastAPI Dependency
# -------------------------------------------------------

def get_strategy_service(
    db: Session,
) -> StrategyService:
    """
    FastAPI dependency.

    Example:

        service: StrategyService = Depends(get_strategy_service)
    """

    return StrategyService(db)