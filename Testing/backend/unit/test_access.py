"""
Regression test for the missing department-scoping bug: Constraint
link/unlink/list-for-decision endpoints previously skipped
check_decision_access entirely, letting a user in one department
view or modify constraints on a decision belonging to another.
"""
import pytest
from fastapi import HTTPException

from app.core.access import check_decision_access
from app.models.enums import UserRoleEnum


class FakeUser:
    def __init__(self, role, department_id):
        self.role = role
        self.department_id = department_id


class FakeDecision:
    def __init__(self, department_id):
        self.department_id = department_id


def test_same_department_user_is_allowed():
    decision = FakeDecision(department_id=1)
    user = FakeUser(role=UserRoleEnum.faculty, department_id=1)
    # Should not raise
    check_decision_access(decision, user)


def test_different_department_user_is_blocked():
    decision = FakeDecision(department_id=1)
    user = FakeUser(role=UserRoleEnum.faculty, department_id=2)
    with pytest.raises(HTTPException) as exc_info:
        check_decision_access(decision, user)
    assert exc_info.value.status_code == 403


def test_admin_bypasses_department_scoping():
    decision = FakeDecision(department_id=1)
    admin = FakeUser(role=UserRoleEnum.admin, department_id=2)
    # Should not raise even though admin is in a different department
    check_decision_access(decision, admin)