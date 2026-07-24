# app/routers/strategy.py

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.core.access import check_decision_access
from app.models.user import User
from app.schemas.strategy import (
    StrategyCreate,
    StrategyUpdate,
    StrategyResponse,
    DecisionStrategyLink,
)
from app.services.strategy_service import StrategyService
from app.services.decision_service import DecisionService


router = APIRouter(tags=["Strategies"])
from app.core.permissions import allow_admin, allow_academics

# -------------------------------------------------------
# CREATE (admin only — master list)
# -------------------------------------------------------

@router.post(
    "/strategies",
    response_model=StrategyResponse,
    status_code=status.HTTP_201_CREATED
)
def create_strategy(
    data: StrategyCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(allow_admin)
):
    """
    Adds a new strategy to the master list.
    """

    service = StrategyService(db)

    try:
        return service.create_strategy(data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# -------------------------------------------------------
# LIST ALL
# -------------------------------------------------------

@router.get(
    "/strategies",
    response_model=List[StrategyResponse],
    status_code=status.HTTP_200_OK
)
def list_strategies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists all strategies in the master list.
    Any authenticated user can view — it's reference data.
    """
    service = StrategyService(db)

    return service.list_strategies(skip=skip, limit=limit)


# -------------------------------------------------------
# GET BY ID
# -------------------------------------------------------

@router.get(
    "/strategies/{strategy_id}",
    response_model=StrategyResponse,
    status_code=status.HTTP_200_OK
)
def get_strategy(
    strategy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a single strategy by ID.
    """
    service = StrategyService(db)

    try:
        return service.get_strategy(strategy_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# -------------------------------------------------------
# UPDATE (admin only)
# -------------------------------------------------------

@router.patch(
    "/strategies/{strategy_id}",
    response_model=StrategyResponse,
    status_code=status.HTTP_200_OK
)
def update_strategy(
    strategy_id: int,
    data: StrategyUpdate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(allow_admin)
):
    """
    Updates a strategy's name or description.
    """

    service = StrategyService(db)

    try:
        return service.update_strategy(strategy_id, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# -------------------------------------------------------
# DELETE (admin only)
# -------------------------------------------------------

@router.delete(
    "/strategies/{strategy_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_strategy(
    strategy_id: int,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(allow_admin)
):
    """
    Removes a strategy from the master list.
    """

    service = StrategyService(db)

    try:
        service.delete_strategy(strategy_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    return None


# -------------------------------------------------------
# LINK (nested under a decision)
# -------------------------------------------------------

@router.post(
    "/decisions/{decision_id}/strategies",
    response_model=StrategyResponse,
    status_code=status.HTTP_201_CREATED
)
def link_strategy_to_decision(
    decision_id: int,
    data: DecisionStrategyLink,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(allow_academics)
):
    """
    Links an existing strategy to a decision.
    """
    decision_service = DecisionService(db)
    strategy_service = StrategyService(db)

    try:
        decision = decision_service.get_decision(decision_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    check_decision_access(decision, current_user)

    try:
        return strategy_service.link_strategy_to_decision(decision_id, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# -------------------------------------------------------
# LIST FOR DECISION (nested under a decision)
# -------------------------------------------------------

@router.get(
    "/decisions/{decision_id}/strategies",
    response_model=List[StrategyResponse],
    status_code=status.HTTP_200_OK
)
def list_strategies_for_decision(
    decision_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists all strategies linked to a decision.
    """
    decision_service = DecisionService(db)
    strategy_service = StrategyService(db)

    try:
        decision = decision_service.get_decision(decision_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    check_decision_access(decision, current_user)

    return strategy_service.list_strategies_for_decision(decision_id)


# -------------------------------------------------------
# UNLINK (nested under a decision)
# -------------------------------------------------------

@router.delete(
    "/decisions/{decision_id}/strategies/{strategy_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def unlink_strategy_from_decision(
    decision_id: int,
    strategy_id: int,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
    current_user: User = Depends(allow_academics)
):
    """
    Removes a strategy from a decision.
    """
    decision_service = DecisionService(db)
    strategy_service = StrategyService(db)

    try:
        decision = decision_service.get_decision(decision_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    check_decision_access(decision, current_user)

    try:
        strategy_service.unlink_strategy_from_decision(decision_id, strategy_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    return None