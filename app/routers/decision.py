# app/routers/decision.py

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.enums import DecisionStatusEnum
from app.schemas.decision import DecisionCreate, DecisionUpdate, DecisionResponse, DecisionSummary
from app.services.decision_service import DecisionService
from app.core.access import check_decision_access
from app.core.permissions import allow_academics

router = APIRouter(prefix="/decisions", tags=["Decisions"])


# -------------------------------------------------------
# CREATE
# -------------------------------------------------------

@router.post(
    "/",
    response_model=DecisionResponse,
    status_code=status.HTTP_201_CREATED
)
def create_decision(
    data: DecisionCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(allow_academics)
):
    """
    Creates a new decision under the current user's department.
    department_id and created_by are taken from the authenticated user,
    never from the request body.
    """
    service = DecisionService(db)

    try:
        return service.create_decision(
            data=data,
            department_id=current_user.department_id,
            created_by=current_user.user_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# -------------------------------------------------------
# LIST (for current user's department)
# -------------------------------------------------------

@router.get(
    "/",
    response_model=List[DecisionSummary],
    status_code=status.HTTP_200_OK
)
def list_decisions(
    status_filter: Optional[DecisionStatusEnum] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(allow_academics)
):
    """
    Lists decisions belonging to the current user's department.
    Optionally filter by status via ?status_filter=draft
    Returns the lightweight DecisionSummary shape (no heavy text fields).
    """
    service = DecisionService(db)

    return service.list_decisions_for_department(
        department_id=current_user.department_id,
        status=status_filter,
        skip=skip,
        limit=limit,
    )


# -------------------------------------------------------
# GET BY ID
# -------------------------------------------------------

@router.get(
    "/{decision_id}",
    response_model=DecisionResponse,
    status_code=status.HTTP_200_OK
)
def get_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(allow_academics)
):
    """
    Returns full details of a single decision.
    """
    service = DecisionService(db)

    try:
        decision = service.get_decision(decision_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    check_decision_access(decision, current_user)

    return decision


@router.patch(
    "/{decision_id}",
    response_model=DecisionResponse,
    status_code=status.HTTP_200_OK
)
def update_decision(
    decision_id: int,
    data: DecisionUpdate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(allow_academics)
):
    """
    Partially updates a decision's editable fields
    (title, problem_statement, decision_desc, decision_type, decision_date).
    Status changes must go through PATCH /decisions/{id}/status instead.
    """
    service = DecisionService(db)

    try:
        decision = service.get_decision(decision_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    check_decision_access(decision, current_user)

    try:
        return service.update_decision(decision_id, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# -------------------------------------------------------
# STATUS UPDATE (workflow-controlled)
# -------------------------------------------------------

@router.patch(
    "/{decision_id}/status",
    response_model=DecisionResponse,
    status_code=status.HTTP_200_OK
)
def update_decision_status(
    decision_id: int,
    new_status: DecisionStatusEnum,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(allow_academics)
):
    """
    Advances a decision's status according to the workflow:
    draft -> approved -> implemented -> completed
    (cancelled reachable from any non-terminal state)
    """
    service = DecisionService(db)

    try:
        return service.update_decision_status(decision_id, new_status)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )