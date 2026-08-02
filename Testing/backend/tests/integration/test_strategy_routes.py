"""
Regression tests for Strategy endpoints:
- create/update/delete must be allow_academics (staff/faculty/hod/
  principal/admin), not the old allow_admin bug.
- link/unlink/list-for-decision must enforce check_decision_access,
  same as Constraints.
"""
import pytest

from app.models.decision import Decision
from app.models.enums import DecisionStatusEnum
from app.core.dependencies import get_current_user
from app.main import app
from app.services.strategy_service import embed_strategy_task
from app.services.graph_sync_service import GraphSyncService


@pytest.fixture(autouse=True)
def mock_ai_and_graph(mocker):
    """
    Strategy mutations enqueue an embedding task + trigger graph sync.
    Router tests only verify API behavior, so mock external side effects
    (no real Celery/Redis, no real Neo4j).
    """
    mocker.patch.object(embed_strategy_task, "delay", return_value=None)
    mocker.patch.object(GraphSyncService, "sync_strategy", return_value=None)


def make_decision(db_session, department_id, created_by):
    decision = Decision(
        department_id=department_id,
        created_by=created_by,
        title="Test Decision",
        problem_statement="A problem statement long enough to pass validation.",
        decision_desc="A decision description long enough to pass validation.",
        status=DecisionStatusEnum.draft,
    )
    db_session.add(decision)
    db_session.commit()
    db_session.refresh(decision)
    return decision


def act_as(user):
    app.dependency_overrides[get_current_user] = lambda: user


# -------------------------------------------------------
# ROLE GATING (create/update/delete)
# -------------------------------------------------------

def test_faculty_can_create_strategy(client, faculty_user):
    act_as(faculty_user)
    response = client.post(
        "/strategies",
        json={"strategy_name": "Phased Rollout", "description": "Roll out changes in stages."},
    )
    assert response.status_code == 201


def test_staff_can_create_strategy(client, staff_user):
    """The specific role this bug excluded before allow_academics was fixed."""
    act_as(staff_user)
    response = client.post(
        "/strategies",
        json={"strategy_name": "Vendor Pilot", "description": "Trial with a single vendor first."},
    )
    assert response.status_code == 201


# -------------------------------------------------------
# DEPARTMENT SCOPING (link/unlink/list-for-decision)
# -------------------------------------------------------

def test_cannot_list_strategies_for_other_departments_decision(
    client, db_session, faculty_user, other_dept_faculty_user
):
    decision = make_decision(
        db_session, faculty_user.department_id, faculty_user.user_id
    )
    act_as(other_dept_faculty_user)
    response = client.get(f"/decisions/{decision.decision_id}/strategies")
    assert response.status_code == 403


def test_can_list_strategies_for_own_departments_decision(
    client, db_session, faculty_user
):
    decision = make_decision(
        db_session, faculty_user.department_id, faculty_user.user_id
    )
    act_as(faculty_user)
    response = client.get(f"/decisions/{decision.decision_id}/strategies")
    assert response.status_code == 200


def test_cannot_link_strategy_to_other_departments_decision(
    client, db_session, faculty_user, other_dept_faculty_user
):
    decision = make_decision(
        db_session, faculty_user.department_id, faculty_user.user_id
    )
    act_as(faculty_user)
    strategy_response = client.post(
        "/strategies",
        json={"strategy_name": "Test Strategy", "description": "A description."},
    )
    strategy_id = strategy_response.json()["strategy_id"]

    act_as(other_dept_faculty_user)
    response = client.post(
        f"/decisions/{decision.decision_id}/strategies",
        json={"strategy_id": strategy_id},
    )
    assert response.status_code == 403