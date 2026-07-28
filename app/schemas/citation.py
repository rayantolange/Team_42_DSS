# app/schemas/citation.py

from datetime import date
from decimal import Decimal
from typing import Optional, Union
from pydantic import BaseModel

from app.models.enums import SourceTypeEnum, DecisionStatusEnum, OutcomeStatusEnum


class DecisionCitationMeta(BaseModel):
    title: str
    decision_type: Optional[str] = None
    status: DecisionStatusEnum
    decision_date: Optional[str] = None
    created_by_name: Optional[str] = None


class StrategyCitationMeta(BaseModel):
    strategy_name: str


class ConstraintCitationMeta(BaseModel):
    constraint_type: str


class OutcomeCitationMeta(BaseModel):
    decision_title: str
    outcome_status: OutcomeStatusEnum
    success_score: Optional[float] = None


class DocumentChunkCitationMeta(BaseModel):
    document_id: int
    file_name: Optional[str] = None
    page_number: int
    chunk_index: int
    decision_title: Optional[str] = None


class SourceCitation(BaseModel):
    source_type: SourceTypeEnum
    reference_id: int
    snippet: str
    metadata: Union[
        DecisionCitationMeta,
        StrategyCitationMeta,
        ConstraintCitationMeta,
        OutcomeCitationMeta,
        DocumentChunkCitationMeta,
    ]