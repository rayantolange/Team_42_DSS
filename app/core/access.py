# app/core/access.py

from fastapi import HTTPException, status
from app.models.user import User


def check_decision_access(decision, current_user: User) -> None:
    """
    Admins can access any decision.
    Regular users can only access decisions in their own department.
    """
    is_admin = getattr(current_user, "role", None) == "admin"  # adjust to your actual role field/enum

    if not is_admin and decision.department_id != current_user.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this decision."
        )