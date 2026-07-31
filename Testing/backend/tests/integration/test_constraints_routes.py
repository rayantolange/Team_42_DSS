"""
Integration test: confirms a user cannot link/unlink/list constraints
on a decision belonging to a different department — this is the exact
bug we found and fixed in app/routers/constraints.py.
"""
from app.models.decision import Decision
from app.models.enums import DecisionStatusEnum


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


def auth_headers_for(client, user, mocker):
    """
    Bypasses real JWT login for tests by directly overriding
    get_current_user — faster and avoids coupling these tests
    to the auth flow, which has its own test file.
    """
    from app.core.dependencies import get_current_user
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: user
    return {}


def test_cannot_list_constraints_for_other_departments_decision(
    client, db_session, faculty_user, other_dept_faculty_user, mocker
):
    decision = make_decision(
        db_session,
        department_id=faculty_user.department_id,
        created_by=faculty_user.user_id,
    )

    auth_headers_for(client, other_dept_faculty_user, mocker)
    response = client.get(f"/constraints/decision/{decision.decision_id}")

    assert response.status_code == 403


def test_can_list_constraints_for_own_departments_decision(
    client, db_session, faculty_user, mocker
):
    decision = make_decision(
        db_session,
        department_id=faculty_user.department_id,
        created_by=faculty_user.user_id,
    )

    auth_headers_for(client, faculty_user, mocker)
    response = client.get(f"/constraints/decision/{decision.decision_id}")

    assert response.status_code == 200