# app/schemas/citation.py
from datetime import date
from decimal import Decimal
from typing import Optional, Union

from pydantic import BaseModel

from app.models.enums import (
    DecisionStatusEnum,
    OutcomeStatusEnum,
    SourceTypeEnum,
)


class DecisionCitationMeta(BaseModel):
    title: str
    decision_type: Optional[str]
    status: DecisionStatusEnum
    decision_date: Optional[date]

class StrategyCitationMeta(BaseModel):
    strategy_name: str

class ConstraintCitationMeta(BaseModel):
    constraint_type: str

class OutcomeCitationMeta(BaseModel):
    decision_title: str  # borrowed, since Outcome has no title
    outcome_status: OutcomeStatusEnum
    success_score: Optional[Decimal]

class DocumentChunkCitationMeta(BaseModel):
    file_name: str
    page_number: int
    decision_title: str  # which decision this doc is attached to

class SourceCitation(BaseModel):
    source_type: SourceTypeEnum
    reference_id: int
    snippet: str
    metadata: Union[
        DecisionCitationMeta, StrategyCitationMeta, ConstraintCitationMeta,
        OutcomeCitationMeta, DocumentChunkCitationMeta,
    ]