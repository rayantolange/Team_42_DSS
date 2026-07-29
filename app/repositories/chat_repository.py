# app/repositories/chat_repository.py

from typing import Optional, List
from sqlalchemy.orm import Session, joinedload

from app.models.chat import ChatThread, ChatMessage, MessageCitation
from app.models.enums import ChatRoleEnum, ChatModeEnum
from app.repositories.base import BaseRepository


class ChatRepository(BaseRepository[ChatThread]):
    """
    Handles all database operations for chat threads, messages,
    and their citations.
    """

    def __init__(self, db: Session):
        super().__init__(ChatThread, db)

    # -------------------------------------------------------
    # THREAD
    # -------------------------------------------------------

    def create_thread(self, user_id: int, title: Optional[str] = None) -> ChatThread:
        thread = ChatThread(user_id=user_id, title=title)
        self.db.add(thread)
        self.db.commit()
        self.db.refresh(thread)
        return thread

    def get_thread_by_id(self, thread_id: int) -> Optional[ChatThread]:
        return (
            self.db.query(ChatThread)
            .filter(ChatThread.thread_id == thread_id)
            .first()
        )

    def get_threads_for_user(
        self, user_id: int, skip: int = 0, limit: int = 50
    ) -> List[ChatThread]:
        return (
            self.db.query(ChatThread)
            .filter(ChatThread.user_id == user_id)
            .order_by(ChatThread.updated_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update_thread_title(self, thread: ChatThread, title: str) -> ChatThread:
        thread.title = title
        self.db.commit()
        self.db.refresh(thread)
        return thread

    def delete_thread(self, thread: ChatThread) -> None:
        self.db.delete(thread)
        self.db.commit()

    def touch_thread(self, thread: ChatThread) -> None:
        """
        Bumps updated_at — called whenever a new message is added,
        so thread lists can sort by most-recently-active.
        """
        from sqlalchemy.sql import func
        thread.updated_at = func.now()
        self.db.commit()

    # -------------------------------------------------------
    # MESSAGE
    # -------------------------------------------------------

    def create_message(
        self,
        thread_id: int,
        role: ChatRoleEnum,
        mode: ChatModeEnum,
        content: str,
    ) -> ChatMessage:
        message = ChatMessage(
            thread_id=thread_id,
            role=role,
            mode=mode,
            content=content,
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_messages_for_thread(
        self, thread_id: int, limit: Optional[int] = None
    ) -> List[ChatMessage]:
        """
        Returns messages oldest-first. If limit is set, returns only
        the most recent `limit` messages (still oldest-first order)
        — used to cap how much history gets fed to the LLM.
        """
        query = (
            self.db.query(ChatMessage)
            .filter(ChatMessage.thread_id == thread_id)
            .order_by(ChatMessage.created_at.desc())
        )
        if limit is not None:
            query = query.limit(limit)

        messages = query.all()
        return list(reversed(messages))

    def get_last_rag_search_message(self, thread_id: int) -> Optional[ChatMessage]:
        """
        Finds the most recent assistant message in this thread that
        was produced in rag_search mode — used to carry retrieved
        context forward into a subsequent chat-mode follow-up.
        """
        return (
            self.db.query(ChatMessage)
            .filter(
                ChatMessage.thread_id == thread_id,
                ChatMessage.role == ChatRoleEnum.assistant,
                ChatMessage.mode == ChatModeEnum.rag_search,
            )
            .order_by(ChatMessage.created_at.desc())
            .first()
        )

    # -------------------------------------------------------
    # CITATIONS
    # -------------------------------------------------------

    def create_citations(
        self, message_id: int, citations: List[dict]
    ) -> List[MessageCitation]:
        """
        citations: list of dicts with embedding_id, rank, snippet.
        """
        rows = []
        for c in citations:
            row = MessageCitation(
                message_id=message_id,
                embedding_id=c["embedding_id"],
                rank=c["rank"],
                snippet=c["snippet"],
            )
            self.db.add(row)
            rows.append(row)

        self.db.commit()
        for row in rows:
            self.db.refresh(row)
        return rows

    def get_citations_for_message(self, message_id: int) -> List[MessageCitation]:
        return (
            self.db.query(MessageCitation)
            .filter(MessageCitation.message_id == message_id)
            .order_by(MessageCitation.rank)
            .all()
        )