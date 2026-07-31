"""
Regression tests for role-based access control.

Covers the real bug we found and fixed: Strategy creation was
gated to allow_admin even though admins never use this part of
the app, and allow_academics was missing the 'staff' role even
though staff are meant to have identical access to faculty.
"""
import pytest
from fastapi import HTTPException

from app.core.permissions import allow_academics, allow_admin
from app.models.enums import UserRoleEnum


class FakeUser:
    """A lightweight stand-in for a User row — RoleChecker only
    reads .role, so no DB round-trip is needed for this test."""
    def __init__(self, role: UserRoleEnum):
        self.role = role


@pytest.mark.parametrize(
    "role",
    [
        UserRoleEnum.admin,
        UserRoleEnum.principal,
        UserRoleEnum.hod,
        UserRoleEnum.faculty,
        UserRoleEnum.staff,
    ],
)
def test_allow_academics_accepts_all_academic_roles(role):
    """Every academic-facing role, including staff, must pass."""
    user = FakeUser(role)
    result = allow_academics(current_user=user)
    assert result is user


def test_allow_academics_rejects_no_other_roles():
    """Confirms there isn't some sixth role quietly let in."""
    unknown_role_user = FakeUser(role=None)
    with pytest.raises(HTTPException) as exc_info:
        allow_academics(current_user=unknown_role_user)
    assert exc_info.value.status_code == 403


def test_allow_admin_rejects_non_admin_roles():
    """Confirms allow_admin still correctly restricts to admin only —
    important because Strategy creation used to (incorrectly) use this."""
    faculty_user = FakeUser(UserRoleEnum.faculty)
    with pytest.raises(HTTPException) as exc_info:
        allow_admin(current_user=faculty_user)
    assert exc_info.value.status_code == 403