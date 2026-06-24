from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

from app.models.enums import DecisionStatusEnum


# -------------------------------------------------------
# CREATE
# -------------------------------------------------------

class DecisionCreate(BaseModel):
    """
    Payload for creating a new decision.
    department_id and created_by come from the authenticated user context,
    NOT from the request body — so they are excluded here.
    status defaults to 'draft' at the DB level.
    """

    title: str = Field(
        min_length=3,
        max_length=255,
        description="Short descriptive title of the decision."
    )

    problem_statement: str = Field(
        min_length=10,
        description="Detailed description of the problem being addressed."
    )

    decision_desc: str = Field(
        min_length=10,
        description="Description of the decision being made."
    )

    decision_type: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Category or type of the decision (e.g. academic, financial)."
    )

    decision_date: Optional[date] = Field(
        default=None,
        description="The date on which the decision is to be enacted."
    )


# -------------------------------------------------------
# UPDATE (Partial)
# -------------------------------------------------------

class DecisionUpdate(BaseModel):
    """
    Payload for partially updating an existing decision.
    All fields are optional — only provided fields will be updated.
    """

    title: Optional[str] = Field(
        default=None,
        min_length=3,
        max_length=255,
        description="Updated title of the decision."
    )

    problem_statement: Optional[str] = Field(
        default=None,
        min_length=10,
        description="Updated problem statement."
    )

    decision_desc: Optional[str] = Field(
        default=None,
        min_length=10,
        description="Updated decision description."
    )

    decision_type: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Updated decision type."
    )

    status: Optional[DecisionStatusEnum] = Field(
        default=None,
        description="Updated status of the decision."
    )

    decision_date: Optional[date] = Field(
        default=None,
        description="Updated decision date."
    )


# -------------------------------------------------------
# RESPONSE
# -------------------------------------------------------

class DecisionResponse(BaseModel):
    """
    Shape of decision data returned by the API.
    Includes all fields including auto-generated ones from the DB.
    """

    model_config = ConfigDict(from_attributes=True)

    decision_id: int = Field(
        description="Primary key of the decision."
    )

    department_id: int = Field(
        description="Department this decision belongs to."
    )

    created_by: int = Field(
        description="User ID of the person who created this decision."
    )

    title: str = Field(
        description="Title of the decision."
    )

    problem_statement: str = Field(
        description="Problem being addressed by this decision."
    )

    decision_desc: str = Field(
        description="Description of the decision."
    )

    decision_type: Optional[str] = Field(
        default=None,
        description="Category or type of the decision."
    )

    status: DecisionStatusEnum = Field(
        description="Current status of the decision."
    )

    decision_date: Optional[date] = Field(
        default=None,
        description="Date the decision is enacted."
    )

    created_at: datetime = Field(
        description="Timestamp when the decision was created."
    )

    updated_at: datetime = Field(
        description="Timestamp of the last update to the decision."
    )


# -------------------------------------------------------
# SUMMARY (for list endpoints)
# -------------------------------------------------------

class DecisionSummary(BaseModel):
    """
    Lightweight shape used when returning a list of decisions.
    Avoids sending heavy text fields like problem_statement and decision_desc
    on list endpoints like GET /decisions.
    """

    model_config = ConfigDict(from_attributes=True)

    decision_id: int
    title: str
    decision_type: Optional[str] = None
    status: DecisionStatusEnum
    decision_date: Optional[date] = None
    created_at: datetime


# DecisionCreate POST /decisions Only what the client should provide
# DecisionUpdate PATCH /decisions/{id} All optional, for partial edits
# DecisionResponse GET /decisions/{id}, POST response Full detail of one decision
# DecisionSummary GET /decisions (list) Lightweight, no heavy text fields