from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict

from app.models.enums import OutcomeStatusEnum


# -------------------------------------------------------
# CREATE
# -------------------------------------------------------

class OutcomeCreate(BaseModel):
    """
    Payload for recording an outcome against a decision.
    decision_id comes from the route path parameter — not the request body.
    """

    outcome_status: OutcomeStatusEnum = Field(
        description="Final status of the decision outcome."
    )

    outcome_desc: Optional[str] = Field(
        default=None,
        min_length=10,
        description="Detailed description of what the outcome was."
    )

    success_score: Optional[Decimal] = Field(
        default=None,
        ge=0,
        le=100,
        description="Numeric score representing how successful the outcome was (0.00 - 100.00)."
    )

    evaluation_date: Optional[date] = Field(
        default=None,
        description="Date on which the outcome was evaluated."
    )

    @field_validator("success_score", mode="before")
    @classmethod
    def validate_score_precision(cls, value) -> Optional[Decimal]:
        """
        Ensures success_score has at most 2 decimal places,
        matching NUMERIC(5, 2) in the database.
        Max value is 999.99 but logically capped at 100.
        """
        if value is None:
            return value

        score = Decimal(str(value))

        if score.as_tuple().exponent < -2:
            raise ValueError(
                "success_score cannot have more than 2 decimal places."
            )

        return score


# -------------------------------------------------------
# UPDATE (Partial)
# -------------------------------------------------------

class OutcomeUpdate(BaseModel):
    """
    Payload for partially updating an existing outcome.
    All fields optional — only provided fields will be updated.
    Useful when re-evaluating a decision after more time has passed.
    """

    outcome_status: Optional[OutcomeStatusEnum] = Field(
        default=None,
        description="Updated outcome status."
    )

    outcome_desc: Optional[str] = Field(
        default=None,
        min_length=10,
        description="Updated outcome description."
    )

    success_score: Optional[Decimal] = Field(
        default=None,
        ge=0,
        le=100,
        description="Updated success score (0.00 - 100.00)."
    )

    evaluation_date: Optional[date] = Field(
        default=None,
        description="Updated evaluation date."
    )

    @field_validator("success_score", mode="before")
    @classmethod
    def validate_score_precision(cls, value) -> Optional[Decimal]:
        if value is None:
            return value

        score = Decimal(str(value))

        if score.as_tuple().exponent < -2:
            raise ValueError(
                "success_score cannot have more than 2 decimal places."
            )

        return score


# -------------------------------------------------------
# RESPONSE
# -------------------------------------------------------

class OutcomeResponse(BaseModel):
    """
    Shape of outcome data returned by the API.
    Includes all DB-generated fields.
    """

    model_config = ConfigDict(from_attributes=True)

    outcome_id: int = Field(
        description="Primary key of the outcome."
    )

    decision_id: int = Field(
        description="Decision this outcome is linked to."
    )

    outcome_status: OutcomeStatusEnum = Field(
        description="Status of the outcome."
    )

    outcome_desc: Optional[str] = Field(
        default=None,
        description="Description of what the outcome was."
    )

    success_score: Optional[Decimal] = Field(
        default=None,
        description="Success score between 0.00 and 100.00."
    )

    evaluation_date: Optional[date] = Field(
        default=None,
        description="Date the outcome was evaluated."
    )

    created_at: datetime = Field(
        description="Timestamp when this outcome record was created."
    )


# -------------------------------------------------------
# SUMMARY (for list endpoints)
# -------------------------------------------------------

class OutcomeSummary(BaseModel):
    """
    Lightweight shape for listing outcomes under a decision.
    Skips outcome_desc to keep list responses concise.
    """

    model_config = ConfigDict(from_attributes=True)

    outcome_id: int
    decision_id: int
    outcome_status: OutcomeStatusEnum
    success_score: Optional[Decimal] = None
    evaluation_date: Optional[date] = None
    created_at: datetime

# OutcomeCreate POST /decisions/{id}/outcomes Record a new outcome evaluation
# OutcomeUpdate PATCH /outcomes/{id} Re-evaluate or correct an outcome
# OutcomeResponse GET /outcomes/{id}, create response Full detail of one outcome
# OutcomeSummary GET /decisions/{id}/outcomes List view, no heavy outcome_desc