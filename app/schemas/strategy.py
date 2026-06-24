# schemas/strategy.py

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# -------------------------------------------------------
# CREATE
# -------------------------------------------------------

class StrategyCreate(BaseModel):
    """
    Payload for adding a new strategy to the master list.
    Strategies are created independently and later linked
    to decisions via the decision_strategies junction table.
    """

    strategy_name: str = Field(
        min_length=3,
        max_length=255,
        description="Unique name of the strategy."
    )

    description: Optional[str] = Field(
        default=None,
        min_length=10,
        description="Detailed explanation of what this strategy involves."
    )


# -------------------------------------------------------
# UPDATE (Partial)
# -------------------------------------------------------

class StrategyUpdate(BaseModel):
    """
    Payload for partially updating an existing strategy.
    All fields optional.
    """

    strategy_name: Optional[str] = Field(
        default=None,
        min_length=3,
        max_length=255,
        description="Updated strategy name."
    )

    description: Optional[str] = Field(
        default=None,
        min_length=10,
        description="Updated description."
    )


# -------------------------------------------------------
# RESPONSE
# -------------------------------------------------------

class StrategyResponse(BaseModel):
    """
    Full strategy record returned by the API.
    """

    model_config = ConfigDict(from_attributes=True)

    strategy_id: int = Field(
        description="Primary key of the strategy."
    )

    strategy_name: str = Field(
        description="Name of the strategy."
    )

    description: Optional[str] = Field(
        default=None,
        description="Description of the strategy."
    )

    created_at: datetime = Field(
        description="Timestamp when this strategy was added."
    )


# -------------------------------------------------------
# LINK / UNLINK (Junction table operations)
# -------------------------------------------------------

class DecisionStrategyLink(BaseModel):
    """
    Payload for linking or unlinking a strategy to a decision.
    decision_id comes from the route path parameter.
    """

    strategy_id: int = Field(
        description="ID of the strategy to link to the decision."
    )