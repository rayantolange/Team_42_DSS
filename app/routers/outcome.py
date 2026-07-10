# app/routers/outcome.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.core.access import check_decision_access
from app.models.user import User
from app.models.enums import OutcomeStatusEnum
from app.schemas.outcome import OutcomeCreate, OutcomeUpdate, OutcomeResponse, OutcomeSummary
from app.services.outcome_service import OutcomeService
from app.services.decision_service import DecisionService


router = APIRouter(tags=["Outcomes"])


# -------------------------------------------------------
# CREATE (nested under a decision)
# -------------------------------------------------------

@router.post(
    "/decisions/{decision_id}/outcomes",
    response_model=OutcomeResponse,
    status_code=status.HTTP_201_CREATED
)
def create_outcome(
    decision_id: int,
    data: OutcomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Records a new outcome evaluation against a decision.
    Only allowed once the decision has been implemented.
    """
    decision_service = DecisionService(db)
    outcome_service = OutcomeService(db)

    try:
        decision = decision_service.get_decision(decision_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    check_decision_access(decision, current_user)

    try:
        return outcome_service.create_outcome(decision_id, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# -------------------------------------------------------
# LIST (nested under a decision)
# -------------------------------------------------------

@router.get(
    "/decisions/{decision_id}/outcomes",
    response_model=List[OutcomeSummary],
    status_code=status.HTTP_200_OK
)
def list_outcomes_for_decision(
    decision_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists all outcomes recorded for a decision, most recent first.
    """
    decision_service = DecisionService(db)
    outcome_service = OutcomeService(db)

    try:
        decision = decision_service.get_decision(decision_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    check_decision_access(decision, current_user)

    return outcome_service.list_outcomes_for_decision(
        decision_id=decision_id,
        skip=skip,
        limit=limit,
    )


# -------------------------------------------------------
# LATEST (nested under a decision)
# -------------------------------------------------------

@router.get(
    "/decisions/{decision_id}/outcomes/latest",
    response_model=OutcomeResponse,
    status_code=status.HTTP_200_OK
)
def get_latest_outcome(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns only the most recent outcome for a decision.
    Useful for dashboard cards.
    """
    decision_service = DecisionService(db)
    outcome_service = OutcomeService(db)

    try:
        decision = decision_service.get_decision(decision_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    check_decision_access(decision, current_user)

    outcome = outcome_service.get_latest_outcome_for_decision(decision_id)

    if outcome is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No outcomes recorded for this decision yet."
        )

    return outcome


# -------------------------------------------------------
# GET BY ID
# -------------------------------------------------------

@router.get(
    "/outcomes/{outcome_id}",
    response_model=OutcomeResponse,
    status_code=status.HTTP_200_OK
)
def get_outcome(
    outcome_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns full detail of a single outcome.
    """
    outcome_service = OutcomeService(db)
    decision_service = DecisionService(db)

    try:
        outcome = outcome_service.get_outcome(outcome_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    decision = decision_service.get_decision(outcome.decision_id)
    check_decision_access(decision, current_user)

    return outcome


# -------------------------------------------------------
# UPDATE
# -------------------------------------------------------

@router.patch(
    "/outcomes/{outcome_id}",
    response_model=OutcomeResponse,
    status_code=status.HTTP_200_OK
)
def update_outcome(
    outcome_id: int,
    data: OutcomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Partially updates an outcome — e.g. re-evaluating success_score
    or outcome_status after more time has passed.
    """
    outcome_service = OutcomeService(db)
    decision_service = DecisionService(db)

    try:
        outcome = outcome_service.get_outcome(outcome_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    decision = decision_service.get_decision(outcome.decision_id)
    check_decision_access(decision, current_user)

    try:
        return outcome_service.update_outcome(outcome_id, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# -------------------------------------------------------
# DELETE
# -------------------------------------------------------

@router.delete(
    "/outcomes/{outcome_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_outcome(
    outcome_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a single outcome record.
    """
    outcome_service = OutcomeService(db)
    decision_service = DecisionService(db)

    try:
        outcome = outcome_service.get_outcome(outcome_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    decision = decision_service.get_decision(outcome.decision_id)
    check_decision_access(decision, current_user)

    outcome_service.delete_outcome(outcome_id)
    return None