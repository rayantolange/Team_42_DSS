# app/schemas/chat.py

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.models.enums import ChatRoleEnum, ChatModeEnum
from app.schemas.citation import SourceCitation


# -------------------------------------------------------
# THREAD
# -------------------------------------------------------

class ChatThreadCreate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)


class ChatThreadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    thread_id: int
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# -------------------------------------------------------
# MESSAGE
# -------------------------------------------------------

class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1)
    mode: ChatModeEnum


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    message_id: int
    thread_id: int
    role: ChatRoleEnum
    mode: ChatModeEnum
    content: str
    created_at: datetime
    citations: List[SourceCitation] = []