from sqlalchemy.orm import Session
from typing import Optional
from app.repositories.decision_repository import DecisionRepository
from app.repositories.outcome_repository import OutcomeRepository
from app.repositories.document_repository import DocumentRepository
from app.models.enums import OutcomeStatusEnum


class DashboardService:
    """
    Aggregates data across Decisions, Outcomes, and Documents into
    the single payload the Dashboard page needs. department_id=None
    means institution-wide (principal only) — every non-principal
    role always passes their own department_id.
    """
    def __init__(self, db: Session):
        self.decision_repo = DecisionRepository(db)
        self.outcome_repo = OutcomeRepository(db)
        self.document_repo = DocumentRepository(db)

    def get_metrics(self, department_id: Optional[int]) -> dict:
        # --- Stat cards ---
        if department_id is None:
            total_decisions = self.decision_repo.count_all()
            documents_indexed = self.document_repo.count_all()
        else:
            total_decisions = self.decision_repo.count_by_department(department_id)
            documents_indexed = self.document_repo.count_by_department(department_id)

        pending_decisions = self.decision_repo.count_pending(department_id)

        # --- Outcome breakdown + positive rate ---
        breakdown = self.outcome_repo.get_status_breakdown(department_id)
        total_outcomes = sum(item["count"] for item in breakdown)
        successful_count = next(
            (item["count"] for item in breakdown if item["status"] == OutcomeStatusEnum.successful.value),
            0,
        )
        positive_outcome_rate = (
            round((successful_count / total_outcomes) * 100, 1) if total_outcomes > 0 else 0.0
        )

        # --- Outcome coverage ---
        decisions_with_outcome = self.outcome_repo.count_decisions_with_outcome(department_id)
        outcome_coverage_percent = (
            round((decisions_with_outcome / total_decisions) * 100, 1) if total_decisions > 0 else 0.0
        )

        # --- Trends ---
        decision_trends = self.decision_repo.get_monthly_status_counts(department_id)

        # --- Department comparison (institution-wide only) ---
        department_comparison = (
            self.outcome_repo.get_department_breakdown() if department_id is None else []
        )

        # --- Recent activity ---
        recent = self.decision_repo.get_recent(department_id, limit=8)
        recent_decisions = [
            {
                "decision_id": d.decision_id,
                "title": d.title,
                "department_name": d.department.department_name if d.department else "",
                "status": d.status.value,
                "created_at": d.created_at.isoformat() if d.created_at else "",
            }
            for d in recent
        ]

        return {
            "total_decisions": total_decisions,
            "pending_decisions": pending_decisions,
            "documents_indexed": documents_indexed,
            "positive_outcome_rate": positive_outcome_rate,
            "outcome_coverage_percent": outcome_coverage_percent,
            "outcome_breakdown": breakdown,
            "decision_trends": decision_trends,
            "department_comparison": department_comparison,
            "recent_decisions": recent_decisions,
        }