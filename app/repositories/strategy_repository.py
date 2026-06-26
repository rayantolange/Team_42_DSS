# app/repositories/strategy_repository.py

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.strategy import Strategy
from app.models.junction import DecisionStrategy
from app.repositories.base import BaseRepository


class StrategyRepository(BaseRepository[Strategy]):
    """
    Handles all database operations for the Strategy model.
    """

    def __init__(self, db: Session):
        super().__init__(Strategy, db)

    # -------------------------------------------------------
    # READ
    # -------------------------------------------------------

    def get_by_id(self, strategy_id: int) -> Optional[Strategy]:
        """
        Fetch a strategy by its primary key.
        """
        return (
            self.db.query(Strategy)
            .filter(Strategy.strategy_id == strategy_id)
            .first()
        )

    def get_by_name(self, strategy_name: str) -> Optional[Strategy]:
        """
        Fetch a strategy by its unique name.
        """
        return (
            self.db.query(Strategy)
            .filter(Strategy.strategy_name == strategy_name)
            .first()
        )

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Strategy]:
        """
        Returns all strategies.
        """
        return (
            self.db.query(Strategy)
            .order_by(Strategy.strategy_name.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_all_for_decision(
        self,
        decision_id: int,
    ) -> List[Strategy]:
        """
        Returns all strategies linked to a decision.
        """
        return (
            self.db.query(Strategy)
            .join(
                DecisionStrategy,
                Strategy.strategy_id == DecisionStrategy.strategy_id,
            )
            .filter(
                DecisionStrategy.decision_id == decision_id
            )
            .all()
        )

    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------

    def create(
        self,
        strategy_name: str,
        description: Optional[str] = None,
    ) -> Strategy:
        """
        Creates and persists a new strategy.
        """

        strategy = Strategy(
            strategy_name=strategy_name,
            description=description,
        )

        return self.save(strategy)

    # -------------------------------------------------------
    # UPDATE
    # -------------------------------------------------------

    def update(
        self,
        strategy: Strategy,
        strategy_name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Strategy:
        """
        Partially updates a strategy.
        """

        if strategy_name is not None:
            strategy.strategy_name = strategy_name

        if description is not None:
            strategy.description = description

        return self.save(strategy)

    # -------------------------------------------------------
    # JUNCTION
    # -------------------------------------------------------

    def link_to_decision(
        self,
        decision_id: int,
        strategy_id: int,
    ) -> Strategy:
        """
        Links a strategy to a decision.
        """

        link = DecisionStrategy(
            decision_id=decision_id,
            strategy_id=strategy_id,
        )

        self.db.add(link)
        self.db.commit()

        return self.get_by_id(strategy_id)

    def unlink_from_decision(
        self,
        decision_id: int,
        strategy_id: int,
    ) -> None:
        """
        Removes a strategy from a decision.
        """

        (
            self.db.query(DecisionStrategy)
            .filter(
                DecisionStrategy.decision_id == decision_id,
                DecisionStrategy.strategy_id == strategy_id,
            )
            .delete()
        )

        self.db.commit()

    # -------------------------------------------------------
    # DELETE
    # -------------------------------------------------------

    def delete_by_id(
        self,
        strategy: Strategy,
    ) -> None:
        """
        Deletes a strategy.
        """

        self.delete(strategy)