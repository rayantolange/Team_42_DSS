from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, require_admin
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import AdminUserResponse, UpdateUserRoleRequest, SystemStatsResponse

router = APIRouter(prefix="/admin", tags=["Admin"])

# -------------------------------------------------------
# LIST ALL USERS
# -------------------------------------------------------
@router.get("/users", response_model=List[AdminUserResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    Returns every registered user, with role and verification
    status. Admin-only.
    """
    repo = UserRepository(db)
    return repo.get_all()


# -------------------------------------------------------
# SYSTEM STATS
# -------------------------------------------------------
@router.get("/stats", response_model=SystemStatsResponse)
def get_system_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    Returns aggregate user counts for the admin dashboard.
    Admin-only.
    """
    repo = UserRepository(db)
    return repo.get_stats()



# -------------------------------------------------------
# UPDATE A USER'S ROLE
# -------------------------------------------------------
@router.patch("/users/{user_id}/role", response_model=AdminUserResponse)
def update_user_role(
    user_id: int,
    data: UpdateUserRoleRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Changes a user's role. Admin-only. An admin cannot demote
    their own account, to avoid accidentally locking themselves
    out of the admin panel.
    """
    if user_id == admin.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role."
        )

    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    return repo.update_role(user, data.role.value)


# -------------------------------------------------------
# DELETE A USER
# -------------------------------------------------------
@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    Deactivates a user account (soft delete). Revokes their login
    access and anonymizes their identifying info, while preserving
    the row so their historical decisions/documents remain intact.
    Admin-only.
    """
    if user_id == admin.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account."
        )

    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    repo.deactivate_user(user)
    return {"message": "User account deactivated."}