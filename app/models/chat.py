# app/models/chat.py

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base
from app.models.enums import ChatRoleEnum, ChatModeEnum


class ChatThread(Base):
    """
    A single user's general-purpose conversation thread.
    Not shared between users, not attached to a specific decision.
    """

    __tablename__ = "chat_threads"

    thread_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=True)  # can be auto-generated from first message
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    updated_at = Column(DateTime(timezone=False), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="chat_threads")
    messages = relationship(
        "ChatMessage",
        back_populates="thread",
        order_by="ChatMessage.created_at",
        cascade="all, delete-orphan",
    )


class ChatMessage(Base):
    """
    A single turn in a thread — either the user's message or the
    assistant's reply. mode records which pipeline produced/handled
    this message (only meaningful for role="assistant", but stored
    on every row for simplicity and consistent filtering).
    """

    __tablename__ = "chat_messages"

    message_id = Column(Integer, primary_key=True, autoincrement=True)
    thread_id = Column(Integer, ForeignKey("chat_threads.thread_id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(ChatRoleEnum), nullable=False)
    mode = Column(Enum(ChatModeEnum), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=False), server_default=func.now())

    # Relationships
    thread = relationship("ChatThread", back_populates="messages")
    citations = relationship(
        "MessageCitation",
        back_populates="message",
        order_by="MessageCitation.rank",
        cascade="all, delete-orphan",
    )


class MessageCitation(Base):
    """
    Links an assistant ChatMessage to the Embedding rows that were
    retrieved to produce it (RAG search mode only). snippet is
    frozen at citation time so chat history stays stable even if
    the source Embedding is later re-embedded or its parent record edited.
    """

    __tablename__ = "message_citations"

    citation_id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("chat_messages.message_id", ondelete="CASCADE"), nullable=False)
    embedding_id = Column(Integer, ForeignKey("embeddings.id"), nullable=True)
    rank = Column(Integer, nullable=False)  # position in the retrieved result list
    snippet = Column(Text, nullable=False)  # frozen copy of the matched content

    # Relationships
    message = relationship("ChatMessage", back_populates="citations")
    embedding = relationship("Embedding")