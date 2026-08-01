# app/services/chat_service.py

from typing import List, Optional
from app.schemas.citation import SourceCitation
from sqlalchemy.orm import Session
from app.schemas.chat import ChatMessageResponse
from app.models.chat import ChatThread, ChatMessage
from app.models.enums import ChatRoleEnum, ChatModeEnum
from app.models.user import User
from app.repositories.chat_repository import ChatRepository
from app.repositories.embedding_repository import EmbeddingRepository
from app.ai.graph.chat_graph import build_chat_graph  
from app.ai.graph.nodes import _build_citation
from app.models.enums import SourceTypeEnum
from app.tasks.chat_tasks import rag_search_task
from celery.exceptions import TimeoutError as CeleryTimeoutError


HISTORY_LIMIT = 10  # max prior messages fed to the LLM as conversation context
REFERENCE_ID_FIELD = {
        SourceTypeEnum.decision: "decision_id",
        SourceTypeEnum.strategy: "strategy_id",
        SourceTypeEnum.constraint: "constraint_id",
        SourceTypeEnum.outcome: "outcome_id",
        SourceTypeEnum.document_chunk: "document_id",
    }

class ChatService:
    """
    Handles thread/message persistence and orchestrates the two
    modes: rag_search (fresh retrieval) and chat (conversational,
    reusing the last search's retrieved context if relevant).
    """

    def __init__(self, db: Session):
        self.db = db
        self.chat_repo = ChatRepository(db)
        self.embedding_repo = EmbeddingRepository(db)

    # -------------------------------------------------------
    # THREAD
    # -------------------------------------------------------

    def create_thread(self, user_id: int, title: Optional[str] = None) -> ChatThread:
        return self.chat_repo.create_thread(user_id=user_id, title=title)

    def get_thread(self, thread_id: int, user_id: int) -> ChatThread:
        thread = self.chat_repo.get_thread_by_id(thread_id)
        if thread is None:
            raise ValueError("Thread not found.")
        if thread.user_id != user_id:
            raise ValueError("You do not have access to this thread.")
        return thread

    def list_threads(self, user_id: int, skip: int = 0, limit: int = 50) -> List[ChatThread]:
        return self.chat_repo.get_threads_for_user(user_id, skip=skip, limit=limit)

    def get_thread_messages(self, thread_id: int, user_id: int) -> List[ChatMessageResponse]:
        self.get_thread(thread_id, user_id)  # access check

        messages = self.chat_repo.get_messages_for_thread(thread_id)

        return [
            ChatMessageResponse(
                message_id=message.message_id,
                thread_id=message.thread_id,
                role=message.role,
                mode=message.mode,
                content=message.content,
                created_at=message.created_at,
                citations=self._hydrate_citations(message),
            )
            for message in messages
        ]

    def delete_thread(self, thread_id: int, user_id: int) -> None:
        thread = self.get_thread(thread_id, user_id)
        self.chat_repo.delete_thread(thread)

    # -------------------------------------------------------
    # SEND MESSAGE — dispatches by mode
    # -------------------------------------------------------

    def send_message(
        self,
        thread_id: int,
        content: str,
        mode: ChatModeEnum,
        current_user: User,
    ) -> ChatMessageResponse:
        thread = self.get_thread(thread_id, current_user.user_id)

        # Save the user's message first — always saved regardless of mode.
        self.chat_repo.create_message(
            thread_id=thread.thread_id,
            role=ChatRoleEnum.user,
            mode=mode,
            content=content,
        )

        if mode == ChatModeEnum.rag_search:
            assistant_message = self._handle_rag_search(thread, content, current_user)
        else:
            assistant_message = self._handle_chat(thread, content, current_user)

        self.chat_repo.touch_thread(thread)

        return assistant_message

    # -------------------------------------------------------
    # RAG SEARCH MODE
    # -------------------------------------------------------

    def _handle_rag_search(
        self, thread: ChatThread, query: str, current_user: User
    ) -> ChatMessageResponse:
        async_result = rag_search_task.delay(
            query,
            {
                "user_id": current_user.user_id,
                "role": current_user.role.value,
                "department_id": current_user.department_id,
            },
        )
        try:
            result = async_result.get(timeout=45)
        except CeleryTimeoutError:
            raise ValueError("Search is temporarily unavailable — please try again shortly.")

        assistant_message = self.chat_repo.create_message(
            thread_id=thread.thread_id,
            role=ChatRoleEnum.assistant,
            mode=ChatModeEnum.rag_search,
            content=result["answer"],
        )

        raw_citations = result.get("citations", [])  # plain dicts, still have embedding_id

        citation_rows = [
            {
                "embedding_id": c["embedding_id"],
                "rank": i,
                "snippet": c["snippet"],
            }
            for i, c in enumerate(raw_citations, start=1)
        ]
        if citation_rows:
            self.chat_repo.create_citations(assistant_message.message_id, citation_rows)

        # Convert to the response schema only now, after embedding_id has
        # already been used for persistence — SourceCitation doesn't declare
        # that field, so it's fine (and expected) for it to be dropped here.
        citations = [SourceCitation.model_validate(c) for c in raw_citations]

        return ChatMessageResponse(
            message_id=assistant_message.message_id,
            thread_id=assistant_message.thread_id,
            role=assistant_message.role,
            mode=assistant_message.mode,
            content=assistant_message.content,
            created_at=assistant_message.created_at,
            citations=citations,
            confidence_score=result.get("confidence_score"),
            confidence_level=result.get("confidence_level"),
        )

    # -------------------------------------------------------
    # CHAT MODE — conversational, reuses last search context
    # -------------------------------------------------------

    def _handle_chat(
        self, thread: ChatThread, message: str, current_user: User
    ) -> ChatMessageResponse:
        history = self.chat_repo.get_messages_for_thread(
            thread.thread_id, limit=HISTORY_LIMIT
        )

        last_search = self.chat_repo.get_last_rag_search_message(thread.thread_id)
        carried_context = ""
        if last_search:
            citations = self.chat_repo.get_citations_for_message(last_search.message_id)
            if citations:
                chunks = []
                for c in citations:
                    embedding = self.embedding_repo.get_by_id(c.embedding_id)
                    if embedding:
                        chunks.append(embedding.content)
                carried_context = "\n\n".join(chunks)

        chat_graph = build_chat_graph()

        result = chat_graph.invoke({
            "message": message,
            "history": [
                {"role": m.role.value, "content": m.content} for m in history
            ],
            "carried_context": carried_context,
        })

        assistant_message = self.chat_repo.create_message(
            thread_id=thread.thread_id,
            role=ChatRoleEnum.assistant,
            mode=ChatModeEnum.chat,
            content=result["answer"],
        )

        return ChatMessageResponse(
            message_id=assistant_message.message_id,
            thread_id=assistant_message.thread_id,
            role=assistant_message.role,
            mode=assistant_message.mode,
            content=assistant_message.content,
            created_at=assistant_message.created_at,
            citations=[],
            confidence_score=None, 
            confidence_level=None, 
        )

    

    def _hydrate_citations(self, message: ChatMessage) -> List[SourceCitation]:
        """
        Rebuilds SourceCitation-shaped dicts from stored MessageCitation rows
        for a message loaded from the DB (as opposed to one freshly produced
        by _handle_rag_search, which already has citations in hand from the
        graph's own state). Needed because MessageCitation only stores
        embedding_id/rank/snippet — source_type, reference_id, and metadata
        all have to be re-derived from the linked Embedding row.
        """
        if message.mode != ChatModeEnum.rag_search or message.role != ChatRoleEnum.assistant:
            return []

        citation_rows = self.chat_repo.get_citations_for_message(message.message_id)
        citations = []

        for row in citation_rows:
            embedding = self.embedding_repo.get_by_id(row.embedding_id)
            if embedding is None:
                continue  # embedding was deleted/re-embedded since this citation was saved

            id_field = REFERENCE_ID_FIELD[embedding.source_type]
            reference_id = getattr(embedding, id_field)

            citations.append(
                SourceCitation(
                    source_type=embedding.source_type,
                    reference_id=reference_id,
                    snippet=row.snippet,
                    metadata=dict(embedding.embedding_metadata or {}),
                )
            )

        return citations
def get_chat_service(db: Session) -> ChatService:
    return ChatService(db)