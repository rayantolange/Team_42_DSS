# app/routers/constraints.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.core.access import check_decision_access
from app.core.permissions import allow_academics
from app.models.user import User
from app.schemas.constraint import (
    ConstraintCreate,
    ConstraintUpdate,
    ConstraintResponse,
    DecisionConstraintLink,
)
from app.services.constraint_service import ConstraintService
from app.services.decision_service import DecisionService


router = APIRouter(prefix="/constraints", tags=["Constraints"])


# -------------------------------------------------------
# LIST (master list — any authenticated user, reference data)
# -------------------------------------------------------

@router.get(
    "/",
    response_model=List[ConstraintResponse],
    status_code=status.HTTP_200_OK
)
def list_constraints(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ConstraintService(db)
    return service.list_constraints(skip=skip, limit=limit)


# -------------------------------------------------------
# GET FOR A DECISION (nested under a decision)
# -------------------------------------------------------

@router.get(
    "/decision/{decision_id}",
    response_model=List[ConstraintResponse],
    status_code=status.HTTP_200_OK
)
def list_constraints_for_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists all constraints linked to a decision.
    """
    decision_service = DecisionService(db)
    service = ConstraintService(db)

    try:
        decision = decision_service.get_decision(decision_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    check_decision_access(decision, current_user)

    return service.list_constraints_for_decision(decision_id)


# -------------------------------------------------------
# GET SINGLE (master list — any authenticated user)
# -------------------------------------------------------

@router.get(
    "/{constraint_id}",
    response_model=ConstraintResponse,
    status_code=status.HTTP_200_OK
)
def get_constraint(
    constraint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ConstraintService(db)

    try:
        return service.get_constraint(constraint_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# -------------------------------------------------------
# CREATE (master list — academics only, matches Strategy)
# -------------------------------------------------------

@router.post(
    "/",
    response_model=ConstraintResponse,
    status_code=status.HTTP_201_CREATED
)
def create_constraint(
    data: ConstraintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_academics)
):
    service = ConstraintService(db)

    try:
        return service.create_constraint(data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# -------------------------------------------------------
# UPDATE (master list — academics only)
# -------------------------------------------------------

@router.patch(
    "/{constraint_id}",
    response_model=ConstraintResponse,
    status_code=status.HTTP_200_OK
)
def update_constraint(
    constraint_id: int,
    data: ConstraintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_academics)
):
    service = ConstraintService(db)

    try:
        return service.update_constraint(constraint_id, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# -------------------------------------------------------
# LINK TO DECISION (academics only + decision access check)
# -------------------------------------------------------

@router.post(
    "/decision/{decision_id}/link",
    response_model=ConstraintResponse,
    status_code=status.HTTP_200_OK
)
def link_constraint_to_decision(
    decision_id: int,
    data: DecisionConstraintLink,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_academics)
):
    decision_service = DecisionService(db)
    service = ConstraintService(db)

    try:
        decision = decision_service.get_decision(decision_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    check_decision_access(decision, current_user)

    try:
        return service.link_constraint_to_decision(decision_id, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# -------------------------------------------------------
# UNLINK FROM DECISION (academics only + decision access check)
# -------------------------------------------------------

@router.delete(
    "/decision/{decision_id}/unlink/{constraint_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def unlink_constraint_from_decision(
    decision_id: int,
    constraint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_academics)
):
    decision_service = DecisionService(db)
    service = ConstraintService(db)

    try:
        decision = decision_service.get_decision(decision_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    check_decision_access(decision, current_user)

    try:
        service.unlink_constraint_from_decision(decision_id, constraint_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    return None


# -------------------------------------------------------
# DELETE (master list — academics only)
# -------------------------------------------------------

@router.delete(
    "/{constraint_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_constraint(
    constraint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_academics)
):
    service = ConstraintService(db)

    try:
        service.delete_constraint(constraint_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    return None