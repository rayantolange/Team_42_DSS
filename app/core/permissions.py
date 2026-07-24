"""
Role-based authorization dependencies.

These dependencies are used with FastAPI's Depends()
to restrict endpoints to specific user roles.
"""

from fastapi import Depends, HTTPException, status

from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.enums import UserRoleEnum


class RoleChecker:
    """
    Generic dependency for checking user roles.

    Example:
        allow_admin = RoleChecker(UserRoleEnum.admin)
        allow_hod = RoleChecker(UserRoleEnum.hod)

        @router.get(...)
        def route(user=Depends(allow_admin)):
            ...
    """

    def __init__(self, *allowed_roles: UserRoleEnum):
        self.allowed_roles = set(allowed_roles)

    def __call__(
        self,
        current_user: User = Depends(get_current_user),
    ) -> User:

        if current_user.role not in self.allowed_roles:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action."
            )

        return current_user

"""
Predefined role dependencies.
"""

allow_admin = RoleChecker(
    UserRoleEnum.admin
)

allow_principal = RoleChecker(
    UserRoleEnum.principal
)

allow_hod = RoleChecker(
    UserRoleEnum.hod
)

allow_faculty = RoleChecker(
    UserRoleEnum.faculty
)

allow_staff = RoleChecker(
    UserRoleEnum.staff
)

allow_management = RoleChecker(
    UserRoleEnum.admin,
    UserRoleEnum.principal,
)

allow_academics = RoleChecker(
    UserRoleEnum.admin,
    UserRoleEnum.principal,
    UserRoleEnum.hod,
    UserRoleEnum.faculty,
)