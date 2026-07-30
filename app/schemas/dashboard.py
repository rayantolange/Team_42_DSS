from pydantic import BaseModel
from typing import List


class OutcomeBreakdownItem(BaseModel):
    status: str
    count: int


class MonthlyStatusPoint(BaseModel):
    month: str
    status: str
    count: int


class DepartmentComparisonRow(BaseModel):
    department_id: int
    department_name: str
    status: str
    count: int


class RecentDecisionItem(BaseModel):
    decision_id: int
    title: str
    department_name: str
    status: str
    created_at: str


class DashboardMetricsResponse(BaseModel):
    total_decisions: int
    pending_decisions: int
    documents_indexed: int
    positive_outcome_rate: float
    outcome_coverage_percent: float
    outcome_breakdown: List[OutcomeBreakdownItem]
    decision_trends: List[MonthlyStatusPoint]
    department_comparison: List[DepartmentComparisonRow]
    recent_decisions: List[RecentDecisionItem]