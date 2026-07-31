"""
Tests for DecisionService's core business rules:
- create_decision persists correctly (embedding/graph sync mocked out)
- status transitions must follow the strict linear workflow
- cancelled is reachable from any non-terminal state, and is terminal
- completed is terminal
- update_decision blocks edits once completed/cancelled
"""
import pytest
from app.models.enums import DecisionStatusEnum
from app.schemas.decision import DecisionCreate, DecisionUpdate
from app.services.decision_service import DecisionService


@pytest.fixture(autouse=True)
def mock_side_effects(mocker):
    """Every decision mutation triggers embedding + Neo4j sync — mock
    both out globally for this file since they're irrelevant to the
    workflow rules being tested here."""
    mocker.patch("app.services.decision_service.EmbeddingService.embed_decision")
    mocker.patch("app.services.decision_service.GraphSyncService.sync_decision")


def make_decision(db_session, faculty_user, status=DecisionStatusEnum.draft):
    service = DecisionService(db_session)
    decision = service.create_decision(
        DecisionCreate(
            title="Test Decision",
            problem_statement="A problem statement long enough to pass validation.",
            decision_desc="A decision description long enough to pass validation.",
        ),
        department_id=faculty_user.department_id,
        created_by=faculty_user.user_id,
    )
    if status != DecisionStatusEnum.draft:
        # Walk it forward through the real workflow to reach the target status
        order = [
            DecisionStatusEnum.draft,
            DecisionStatusEnum.approved,
            DecisionStatusEnum.implemented,
            DecisionStatusEnum.completed,
        ]
        for next_status in order[1:order.index(status) + 1]:
            decision = service.update_decision_status(decision.decision_id, next_status)
    return decision


# -------------------------------------------------------
# CREATE
# -------------------------------------------------------

def test_create_decision_defaults_to_draft(db_session, faculty_user):
    service = DecisionService(db_session)
    decision = service.create_decision(
        DecisionCreate(
            title="New Decision",
            problem_statement="A problem statement long enough to pass validation.",
            decision_desc="A decision description long enough to pass validation.",
        ),
        department_id=faculty_user.department_id,
        created_by=faculty_user.user_id,
    )
    assert decision.status == DecisionStatusEnum.draft
    assert decision.decision_id is not None


# -------------------------------------------------------
# STATUS TRANSITIONS — valid path
# -------------------------------------------------------

@pytest.mark.parametrize(
    "from_status,to_status",
    [
        (DecisionStatusEnum.draft, DecisionStatusEnum.approved),
        (DecisionStatusEnum.approved, DecisionStatusEnum.implemented),
        (DecisionStatusEnum.implemented, DecisionStatusEnum.completed),
    ],
)
def test_valid_sequential_transition_succeeds(
    db_session, faculty_user, from_status, to_status
):
    decision = make_decision(db_session, faculty_user, status=from_status)
    service = DecisionService(db_session)
    updated = service.update_decision_status(decision.decision_id, to_status)
    assert updated.status == to_status


# -------------------------------------------------------
# STATUS TRANSITIONS — invalid skips
# -------------------------------------------------------

def test_cannot_skip_from_draft_to_implemented(db_session, faculty_user):
    decision = make_decision(db_session, faculty_user, status=DecisionStatusEnum.draft)
    service = DecisionService(db_session)
    with pytest.raises(ValueError, match="can only move from"):
        service.update_decision_status(decision.decision_id, DecisionStatusEnum.implemented)


def test_cannot_skip_from_draft_to_completed(db_session, faculty_user):
    decision = make_decision(db_session, faculty_user, status=DecisionStatusEnum.draft)
    service = DecisionService(db_session)
    with pytest.raises(ValueError, match="can only move from"):
        service.update_decision_status(decision.decision_id, DecisionStatusEnum.completed)


def test_cannot_move_backwards(db_session, faculty_user):
    decision = make_decision(db_session, faculty_user, status=DecisionStatusEnum.approved)
    service = DecisionService(db_session)
    with pytest.raises(ValueError, match="can only move from"):
        service.update_decision_status(decision.decision_id, DecisionStatusEnum.draft)


# -------------------------------------------------------
# CANCELLATION — reachable from any non-terminal state
# -------------------------------------------------------

@pytest.mark.parametrize(
    "from_status",
    [DecisionStatusEnum.draft, DecisionStatusEnum.approved, DecisionStatusEnum.implemented],
)
def test_can_cancel_from_any_non_terminal_state(db_session, faculty_user, from_status):
    decision = make_decision(db_session, faculty_user, status=from_status)
    service = DecisionService(db_session)
    cancelled = service.update_decision_status(decision.decision_id, DecisionStatusEnum.cancelled)
    assert cancelled.status == DecisionStatusEnum.cancelled


def test_cannot_cancel_a_completed_decision(db_session, faculty_user):
    decision = make_decision(db_session, faculty_user, status=DecisionStatusEnum.completed)
    service = DecisionService(db_session)
    with pytest.raises(ValueError, match="cannot be modified"):
        service.update_decision_status(decision.decision_id, DecisionStatusEnum.cancelled)


# -------------------------------------------------------
# TERMINAL STATES ARE FULLY IMMUTABLE
# -------------------------------------------------------

def test_cancelled_decision_cannot_change_status_at_all(db_session, faculty_user):
    decision = make_decision(db_session, faculty_user, status=DecisionStatusEnum.draft)
    service = DecisionService(db_session)
    cancelled = service.update_decision_status(decision.decision_id, DecisionStatusEnum.cancelled)
    with pytest.raises(ValueError, match="cannot be modified"):
        service.update_decision_status(cancelled.decision_id, DecisionStatusEnum.approved)


def test_completed_decision_cannot_change_status_at_all(db_session, faculty_user):
    decision = make_decision(db_session, faculty_user, status=DecisionStatusEnum.completed)
    service = DecisionService(db_session)
    with pytest.raises(ValueError, match="cannot be modified"):
        service.update_decision_status(decision.decision_id, DecisionStatusEnum.draft)


def test_cannot_edit_fields_on_completed_decision(db_session, faculty_user):
    decision = make_decision(db_session, faculty_user, status=DecisionStatusEnum.completed)
    service = DecisionService(db_session)
    with pytest.raises(ValueError, match="cannot be modified"):
        service.update_decision(decision.decision_id, DecisionUpdate(title="New Title"))


def test_cannot_edit_fields_on_cancelled_decision(db_session, faculty_user):
    decision = make_decision(db_session, faculty_user, status=DecisionStatusEnum.draft)
    service = DecisionService(db_session)
    cancelled = service.update_decision_status(decision.decision_id, DecisionStatusEnum.cancelled)
    with pytest.raises(ValueError, match="cannot be modified"):
        service.update_decision(cancelled.decision_id, DecisionUpdate(title="New Title"))


def test_can_edit_fields_on_draft_decision(db_session, faculty_user):
    decision = make_decision(db_session, faculty_user, status=DecisionStatusEnum.draft)
    service = DecisionService(db_session)
    updated = service.update_decision(decision.decision_id, DecisionUpdate(title="Updated Title"))
    assert updated.title == "Updated Title"