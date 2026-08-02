import pytest

from app.models.user import User
from app.models.enums import UserRoleEnum, DecisionStatusEnum
from app.core.permissions import allow_academics
from app.services.decision_service import embed_decision_task
from app.services.graph_sync_service import GraphSyncService


@pytest.fixture(autouse=True)
def mock_ai_and_graph(mocker):
    """
    Decision mutations enqueue an embedding task + trigger graph sync.
    Router tests only verify API behavior, so mock external side effects
    (no real Celery/Redis, no real Neo4j).
    """
    mocker.patch.object(
        embed_decision_task,
        "delay",
        return_value=None,
    )

    mocker.patch.object(
        GraphSyncService,
        "sync_decision",
        return_value=None,
    )


@pytest.fixture
def authenticated_client(client, faculty_user):
    """
    Override allow_academics dependency with a real faculty user.
    """
    from app.main import app

    app.dependency_overrides[allow_academics] = lambda: faculty_user

    yield client

    app.dependency_overrides.clear()


# -------------------------------------------------------
# CREATE
# -------------------------------------------------------

def test_create_decision_success(
    authenticated_client,
    faculty_user
):
    response = authenticated_client.post(
        "/decisions/",
        json={
            "title": "Improve Library Services",
            "problem_statement": "Students need better access to academic resources.",
            "decision_desc": "Expand digital and physical library services.",
            "decision_type": "academic",
            "decision_date": "2026-08-01"
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["title"] == "Improve Library Services"
    assert data["department_id"] == faculty_user.department_id
    assert data["created_by"] == faculty_user.user_id
    assert data["status"] == "draft"


def test_create_decision_invalid_payload(
    authenticated_client
):
    response = authenticated_client.post(
        "/decisions/",
        json={
            "title": "Bad"
        }
    )

    assert response.status_code == 422


# -------------------------------------------------------
# LIST
# -------------------------------------------------------

def test_list_decisions_empty(
    authenticated_client
):
    response = authenticated_client.get(
        "/decisions/"
    )

    assert response.status_code == 200
    assert response.json() == []


def test_list_decisions_returns_department_decisions(
    authenticated_client
):
    create_response = authenticated_client.post(
        "/decisions/",
        json={
            "title": "Campus Upgrade",
            "problem_statement": "Campus facilities need improvement.",
            "decision_desc": "Upgrade classroom infrastructure."
        }
    )

    assert create_response.status_code == 201

    response = authenticated_client.get(
        "/decisions/"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["title"] == "Campus Upgrade"


def test_list_decisions_filter_status(
    authenticated_client
):
    authenticated_client.post(
        "/decisions/",
        json={
            "title": "Draft Decision",
            "problem_statement": "A valid problem statement.",
            "decision_desc": "A valid decision description."
        }
    )

    response = authenticated_client.get(
        "/decisions/",
        params={
            "status_filter": "draft"
        }
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


# -------------------------------------------------------
# GET BY ID
# -------------------------------------------------------

def test_get_decision_success(
    authenticated_client
):
    create = authenticated_client.post(
        "/decisions/",
        json={
            "title": "Hiring Decision",
            "problem_statement": "Department needs additional faculty.",
            "decision_desc": "Approve faculty recruitment."
        }
    )

    decision_id = create.json()["decision_id"]

    response = authenticated_client.get(
        f"/decisions/{decision_id}"
    )

    assert response.status_code == 200

    assert response.json()["decision_id"] == decision_id


def test_get_missing_decision(
    authenticated_client
):
    response = authenticated_client.get(
        "/decisions/99999"
    )

    assert response.status_code == 404


def test_get_other_department_decision_forbidden(
    client,
    faculty_user,
    other_dept_faculty_user
):
    from app.main import app

    # create decision in another department
    app.dependency_overrides[allow_academics] = (
        lambda: other_dept_faculty_user
    )

    create = client.post(
        "/decisions/",
        json={
            "title": "Private Decision",
            "problem_statement": "Another department decision.",
            "decision_desc": "Should not be visible."
        }
    )

    decision_id = create.json()["decision_id"]

    # switch back to faculty user
    app.dependency_overrides[allow_academics] = (
        lambda: faculty_user
    )

    response = client.get(
        f"/decisions/{decision_id}"
    )

    assert response.status_code == 403

    app.dependency_overrides.clear()


# -------------------------------------------------------
# UPDATE
# -------------------------------------------------------

def test_update_decision_success(
    authenticated_client
):
    create = authenticated_client.post(
        "/decisions/",
        json={
            "title": "Original Title",
            "problem_statement": "Original problem statement.",
            "decision_desc": "Original decision description."
        }
    )

    decision_id = create.json()["decision_id"]

    response = authenticated_client.patch(
        f"/decisions/{decision_id}",
        json={
            "title": "Updated Title"
        }
    )

    assert response.status_code == 200

    assert response.json()["title"] == "Updated Title"


def test_update_missing_decision(
    authenticated_client
):
    response = authenticated_client.patch(
        "/decisions/99999",
        json={
            "title": "Updated"
        }
    )

    assert response.status_code == 404


# -------------------------------------------------------
# STATUS WORKFLOW
# -------------------------------------------------------

def test_update_status_success(
    authenticated_client
):
    create = authenticated_client.post(
        "/decisions/",
        json={
            "title": "Approval Workflow",
            "problem_statement": "Need approval workflow.",
            "decision_desc": "Move decision to approved state."
        }
    )

    decision_id = create.json()["decision_id"]

    response = authenticated_client.patch(
        f"/decisions/{decision_id}/status",
        params={
            "new_status": "approved"
        }
    )

    assert response.status_code == 200

    assert response.json()["status"] == "approved"


def test_invalid_status_transition(
    authenticated_client
):
    create = authenticated_client.post(
        "/decisions/",
        json={
            "title": "Invalid Transition",
            "problem_statement": "Testing workflow validation.",
            "decision_desc": "Cannot skip workflow."
        }
    )

    decision_id = create.json()["decision_id"]

    response = authenticated_client.patch(
        f"/decisions/{decision_id}/status",
        params={
            "new_status": "completed"
        }
    )

    assert response.status_code == 400


# -------------------------------------------------------
# GRAPH
# -------------------------------------------------------

def test_decision_graph_endpoint(
    authenticated_client
):
    response = authenticated_client.get(
        "/decisions/graph"
    )

    assert response.status_code == 200

    data = response.json()

    assert "decisions" in data
    assert "links_by_decision" in data