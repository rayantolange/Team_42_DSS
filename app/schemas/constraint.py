# schemas/constraint.py

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


ALLOWED_CONSTRAINT_TYPES = {
    "financial",
    "regulatory",
    "operational",
    "technical",
    "human_resource",
    "time",
    "infrastructure",
}


# -------------------------------------------------------
# CREATE
# -------------------------------------------------------

class ConstraintCreate(BaseModel):
    """
    Payload for adding a new constraint to the master list.
    Constraints are created independently and later linked
    to decisions via the decision_constraints junction table.
    """

    constraint_type: str = Field(
        min_length=2,
        max_length=100,
        description=(
            f"Category of the constraint. "
            f"Allowed types: {', '.join(sorted(ALLOWED_CONSTRAINT_TYPES))}"
        )
    )

    description: Optional[str] = Field(
        default=None,
        min_length=10,
        description="Detailed explanation of what this constraint involves."
    )

    @field_validator("constraint_type")
    @classmethod
    def validate_constraint_type(cls, value: str) -> str:
        """
        Ensures constraint_type belongs to a known category.
        Keeps master data clean and consistent.
        """
        normalized = value.lower().strip()

        if normalized not in ALLOWED_CONSTRAINT_TYPES:
            raise ValueError(
                f"'{value}' is not a valid constraint type. "
                f"Allowed types: {', '.join(sorted(ALLOWED_CONSTRAINT_TYPES))}"
            )

        return normalized


# -------------------------------------------------------
# UPDATE (Partial)
# -------------------------------------------------------

class ConstraintUpdate(BaseModel):
    """
    Payload for partially updating an existing constraint.
    All fields optional.
    """

    constraint_type: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100,
        description="Updated constraint type."
    )

    description: Optional[str] = Field(
        default=None,
        min_length=10,
        description="Updated description."
    )

    @field_validator("constraint_type")
    @classmethod
    def validate_constraint_type(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        normalized = value.lower().strip()

        if normalized not in ALLOWED_CONSTRAINT_TYPES:
            raise ValueError(
                f"'{value}' is not a valid constraint type. "
                f"Allowed types: {', '.join(sorted(ALLOWED_CONSTRAINT_TYPES))}"
            )

        return normalized


# -------------------------------------------------------
# RESPONSE
# -------------------------------------------------------

class ConstraintResponse(BaseModel):
    """
    Full constraint record returned by the API.
    """

    model_config = ConfigDict(from_attributes=True)

    constraint_id: int = Field(
        description="Primary key of the constraint."
    )

    constraint_type: str = Field(
        description="Category of the constraint."
    )

    description: Optional[str] = Field(
        default=None,
        description="Description of the constraint."
    )

    created_at: datetime = Field(
        description="Timestamp when this constraint was added."
    )


# -------------------------------------------------------
# LINK / UNLINK (Junction table operations)
# -------------------------------------------------------

class DecisionConstraintLink(BaseModel):
    """
    Payload for linking or unlinking a constraint to a decision.
    decision_id comes from the route path parameter.
    """

    constraint_id: int = Field(
        description="ID of the constraint to link to the decision."
    )

    
# StrategyCreate / ConstraintCreate POST /strategies / POST /constraints Add to master list
# StrategyUpdate / ConstraintUpdate PATCH /strategies/{id} / PATCH /constraints/{id} Edit master record
# StrategyResponse / ConstraintResponse Any GET endpoint Full record returned to client
# DecisionStrategyLink / DecisionConstraintLink POST /decisions/{id}/strategies Attach to a decision