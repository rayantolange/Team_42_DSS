# app/routers/chat_router.py

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user  # adjust path if different
from app.models.user import User
from app.schemas.chat import (
    ChatThreadCreate,
    ChatThreadResponse,
    ChatMessageCreate,
    ChatMessageResponse,
)
from app.services.chat_service import ChatService, get_chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


def _service(db: Session = Depends(get_db)) -> ChatService:
    return get_chat_service(db)


# -------------------------------------------------------
# THREAD
# -------------------------------------------------------

@router.post("/threads", response_model=ChatThreadResponse)
def create_thread(
    data: ChatThreadCreate,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(_service),
):
    return service.create_thread(user_id=current_user.user_id, title=data.title)


@router.get("/threads", response_model=List[ChatThreadResponse])
def list_threads(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(_service),
):
    return service.list_threads(user_id=current_user.user_id, skip=skip, limit=limit)


@router.delete("/threads/{thread_id}")
def delete_thread(
    thread_id: int,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(_service),
):
    try:
        service.delete_thread(thread_id, user_id=current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"detail": "Thread deleted."}


# -------------------------------------------------------
# MESSAGES
# -------------------------------------------------------

@router.get("/threads/{thread_id}/messages", response_model=List[ChatMessageResponse])
def get_thread_messages(
    thread_id: int,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(_service),
):
    try:
        return service.get_thread_messages(thread_id, user_id=current_user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/threads/{thread_id}/messages", response_model=ChatMessageResponse)
def send_message(
    thread_id: int,
    data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(_service),
):
    try:
        return service.send_message(
            thread_id=thread_id,
            content=data.content,
            mode=data.mode,
            current_user=current_user,
        )
    except ValueError as e:
        # Set to 400 so you can distinguish route missing (404) vs logic errors
        raise HTTPException(status_code=400, detail=str(e))