"""
Integration tests for Outcome routes:
- Outcomes can only be recorded against implemented/completed decisions.
- Department-scoped access control matches Decision routes (admins see
  everything, everyone else only their own department).
"""
import pytest

from app.models.decision import Decision
from app.models.enums import DecisionStatusEnum, OutcomeStatusEnum
from app.core.permissions import allow_academics
from app.main import app
from app.services.outcome_service import embed_outcome_task
from app.services.graph_sync_service import GraphSyncService


@pytest.fixture(autouse=True)
def mock_ai_and_graph(mocker):
    """
    Outcome mutations enqueue an embedding task + trigger graph sync.
    Router tests only verify API behavior, so mock external side effects
    (no real Celery/Redis, no real Neo4j).
    """
    mocker.patch.object(embed_outcome_task, "delay", return_value=None)
    mocker.patch.object(GraphSyncService, "sync_outcome", return_value=None)
    mocker.patch.object(GraphSyncService, "delete_outcome", return_value=None)


def make_decision(db_session, department_id, created_by, status=DecisionStatusEnum.implemented):
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


def act_as(user):
    app.dependency_overrides[allow_academics] = lambda: user


@pytest.fixture(autouse=True)
def clear_overrides():
    yield
    app.dependency_overrides.clear()


# -------------------------------------------------------
# CREATE
# -------------------------------------------------------

def test_create_outcome_success_for_implemented_decision(client, db_session, faculty_user):
    decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    act_as(faculty_user)

    response = client.post(
        f"/decisions/{decision.decision_id}/outcomes",
        json={
            "outcome_status": "successful",
            "outcome_desc": "The initiative met all of its stated goals.",
            "success_score": "88.50",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["decision_id"] == decision.decision_id
    assert data["outcome_status"] == "successful"


def test_create_outcome_blocked_for_draft_decision(client, db_session, faculty_user):
    decision = make_decision(
        db_session, faculty_user.department_id, faculty_user.user_id,
        status=DecisionStatusEnum.draft,
    )
    act_as(faculty_user)

    response = client.post(
        f"/decisions/{decision.decision_id}/outcomes",
        json={"outcome_status": "successful"},
    )

    assert response.status_code == 400


def test_create_outcome_for_nonexistent_decision_returns_404(client, faculty_user):
    act_as(faculty_user)

    response = client.post(
        "/decisions/999999/outcomes",
        json={"outcome_status": "successful"},
    )

    assert response.status_code == 404


def test_create_outcome_for_other_departments_decision_forbidden(
    client, db_session, faculty_user, other_dept_faculty_user
):
    decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    act_as(other_dept_faculty_user)

    response = client.post(
        f"/decisions/{decision.decision_id}/outcomes",
        json={"outcome_status": "successful"},
    )

    assert response.status_code == 403


# -------------------------------------------------------
# LIST (nested under a decision)
# -------------------------------------------------------

def test_list_outcomes_for_decision_returns_recorded_outcomes(client, db_session, faculty_user):
    decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    act_as(faculty_user)
    client.post(
        f"/decisions/{decision.decision_id}/outcomes",
        json={"outcome_status": "successful"},
    )

    response = client.get(f"/decisions/{decision.decision_id}/outcomes")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_list_outcomes_for_other_departments_decision_forbidden(
    client, db_session, faculty_user, other_dept_faculty_user
):
    decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    act_as(other_dept_faculty_user)

    response = client.get(f"/decisions/{decision.decision_id}/outcomes")

    assert response.status_code == 403


# -------------------------------------------------------
# LATEST
# -------------------------------------------------------

def test_get_latest_outcome_returns_most_recent(client, db_session, faculty_user):
    decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    act_as(faculty_user)
    client.post(
        f"/decisions/{decision.decision_id}/outcomes",
        json={"outcome_status": "partially_successful"},
    )

    response = client.get(f"/decisions/{decision.decision_id}/outcomes/latest")

    assert response.status_code == 200
    assert response.json()["outcome_status"] == "partially_successful"


def test_get_latest_outcome_404_when_none_recorded(client, db_session, faculty_user):
    decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    act_as(faculty_user)

    response = client.get(f"/decisions/{decision.decision_id}/outcomes/latest")

    assert response.status_code == 404


# -------------------------------------------------------
# LIST ALL (vault view)
# -------------------------------------------------------

def test_list_all_outcomes_scoped_to_own_department(
    client, db_session, faculty_user, other_dept_faculty_user
):
    own_decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    other_decision = make_decision(
        db_session, other_dept_faculty_user.department_id, other_dept_faculty_user.user_id
    )

    act_as(faculty_user)
    client.post(f"/decisions/{own_decision.decision_id}/outcomes", json={"outcome_status": "successful"})

    act_as(other_dept_faculty_user)
    client.post(f"/decisions/{other_decision.decision_id}/outcomes", json={"outcome_status": "failed"})

    act_as(faculty_user)
    response = client.get("/outcomes")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["decision_id"] == own_decision.decision_id


def test_list_all_outcomes_admin_sees_every_department(
    client, db_session, faculty_user, other_dept_faculty_user, admin_user
):
    own_decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    other_decision = make_decision(
        db_session, other_dept_faculty_user.department_id, other_dept_faculty_user.user_id
    )

    act_as(faculty_user)
    client.post(f"/decisions/{own_decision.decision_id}/outcomes", json={"outcome_status": "successful"})

    act_as(other_dept_faculty_user)
    client.post(f"/decisions/{other_decision.decision_id}/outcomes", json={"outcome_status": "failed"})

    act_as(admin_user)
    response = client.get("/outcomes")

    assert response.status_code == 200
    assert len(response.json()) == 2


# -------------------------------------------------------
# GET BY ID
# -------------------------------------------------------

def test_get_outcome_by_id_success(client, db_session, faculty_user):
    decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    act_as(faculty_user)
    create_response = client.post(
        f"/decisions/{decision.decision_id}/outcomes",
        json={"outcome_status": "successful"},
    )
    outcome_id = create_response.json()["outcome_id"]

    response = client.get(f"/outcomes/{outcome_id}")

    assert response.status_code == 200
    assert response.json()["outcome_id"] == outcome_id


def test_get_outcome_by_id_404_when_missing(client, faculty_user):
    act_as(faculty_user)

    response = client.get("/outcomes/999999")

    assert response.status_code == 404


def test_get_outcome_for_other_departments_decision_forbidden(
    client, db_session, faculty_user, other_dept_faculty_user
):
    decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    act_as(faculty_user)
    create_response = client.post(
        f"/decisions/{decision.decision_id}/outcomes",
        json={"outcome_status": "successful"},
    )
    outcome_id = create_response.json()["outcome_id"]

    act_as(other_dept_faculty_user)
    response = client.get(f"/outcomes/{outcome_id}")

    assert response.status_code == 403


# -------------------------------------------------------
# UPDATE
# -------------------------------------------------------

def test_update_outcome_success(client, db_session, faculty_user):
    decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    act_as(faculty_user)
    create_response = client.post(
        f"/decisions/{decision.decision_id}/outcomes",
        json={"outcome_status": "partially_successful"},
    )
    outcome_id = create_response.json()["outcome_id"]

    response = client.patch(
        f"/outcomes/{outcome_id}",
        json={"outcome_status": "successful", "success_score": "95.00"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["outcome_status"] == "successful"
    assert float(data["success_score"]) == 95.00


def test_update_outcome_with_no_fields_returns_400(client, db_session, faculty_user):
    decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    act_as(faculty_user)
    create_response = client.post(
        f"/decisions/{decision.decision_id}/outcomes",
        json={"outcome_status": "successful"},
    )
    outcome_id = create_response.json()["outcome_id"]

    response = client.patch(f"/outcomes/{outcome_id}", json={})

    assert response.status_code == 400


def test_update_outcome_404_when_missing(client, faculty_user):
    act_as(faculty_user)

    response = client.patch("/outcomes/999999", json={"outcome_status": "successful"})

    assert response.status_code == 404


def test_update_outcome_for_other_departments_decision_forbidden(
    client, db_session, faculty_user, other_dept_faculty_user
):
    decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    act_as(faculty_user)
    create_response = client.post(
        f"/decisions/{decision.decision_id}/outcomes",
        json={"outcome_status": "successful"},
    )
    outcome_id = create_response.json()["outcome_id"]

    act_as(other_dept_faculty_user)
    response = client.patch(f"/outcomes/{outcome_id}", json={"outcome_status": "failed"})

    assert response.status_code == 403


# -------------------------------------------------------
# DELETE
# -------------------------------------------------------

def test_delete_outcome_success(client, db_session, faculty_user):
    decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    act_as(faculty_user)
    create_response = client.post(
        f"/decisions/{decision.decision_id}/outcomes",
        json={"outcome_status": "successful"},
    )
    outcome_id = create_response.json()["outcome_id"]

    response = client.delete(f"/outcomes/{outcome_id}")

    assert response.status_code == 204

    follow_up = client.get(f"/outcomes/{outcome_id}")
    assert follow_up.status_code == 404


def test_delete_outcome_404_when_missing(client, faculty_user):
    act_as(faculty_user)

    response = client.delete("/outcomes/999999")

    assert response.status_code == 404


def test_delete_outcome_for_other_departments_decision_forbidden(
    client, db_session, faculty_user, other_dept_faculty_user
):
    decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    act_as(faculty_user)
    create_response = client.post(
        f"/decisions/{decision.decision_id}/outcomes",
        json={"outcome_status": "successful"},
    )
    outcome_id = create_response.json()["outcome_id"]

    act_as(other_dept_faculty_user)
    response = client.delete(f"/outcomes/{outcome_id}")

    assert response.status_code == 403
