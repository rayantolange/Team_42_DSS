"""
Regression test: outcomes can only be recorded once a decision has
reached 'implemented' or 'completed' status.
"""
import pytest
from app.models.decision import Decision
from app.models.enums import DecisionStatusEnum
from app.schemas.outcome import OutcomeCreate
from app.services.outcome_service import OutcomeService
from app.models.enums import OutcomeStatusEnum


def make_decision(db_session, department_id, created_by, status):
    decision = Decision(
        department_id=department_id,
        created_by=created_by,
        title="Test Decision",
        problem_statement="A problem statement long enough to pass validation.",
        decision_desc="A decision description long enough to pass validation.",
        status=status,
    )
    db_session.add(decision)
    db_session.commit()
    db_session.refresh(decision)
    return decision


@pytest.mark.parametrize(
    "blocked_status",
    [DecisionStatusEnum.draft, DecisionStatusEnum.approved, DecisionStatusEnum.cancelled],
)
def test_outcome_blocked_for_non_implemented_decision(
    db_session, faculty_user, blocked_status, mocker
):
    decision = make_decision(
        db_session, faculty_user.department_id, faculty_user.user_id, blocked_status
    )
    # Mock out the LLM embedding + Neo4j sync — irrelevant to this rule
    mocker.patch("app.services.outcome_service.EmbeddingService.embed_outcome")
    mocker.patch("app.services.outcome_service.GraphSyncService.sync_outcome")

    service = OutcomeService(db_session)
    with pytest.raises(ValueError, match="implemented or completed"):
        service.create_outcome(
            decision.decision_id,
            OutcomeCreate(outcome_status=OutcomeStatusEnum.successful),
        )


@pytest.mark.parametrize(
    "allowed_status",
    [DecisionStatusEnum.implemented, DecisionStatusEnum.completed],
)
def test_outcome_allowed_for_implemented_or_completed_decision(
    db_session, faculty_user, allowed_status, mocker
):
    decision = make_decision(
        db_session, faculty_user.department_id, faculty_user.user_id, allowed_status
    )
    mocker.patch("app.services.outcome_service.EmbeddingService.embed_outcome")
    mocker.patch("app.services.outcome_service.GraphSyncService.sync_outcome")

    service = OutcomeService(db_session)
    outcome = service.create_outcome(
        decision.decision_id,
        OutcomeCreate(outcome_status=OutcomeStatusEnum.successful),
    )
    assert outcome.outcome_id is not None