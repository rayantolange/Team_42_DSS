# app/ai/graph/chat_state.py

from typing import TypedDict, List, Optional


class ChatHistoryTurn(TypedDict):
    role: str      # "user" or "assistant" — matches ChatRoleEnum values,
                    # which already line up with what the LLM API expects
    content: str


class ChatGraphState(TypedDict):
    message: str                    # the latest user message (kept for
                                     # logging/debugging — see note below)
    history: List[ChatHistoryTurn]  # oldest-first, already includes the
                                     # latest user turn (ChatService fetches
                                     # it after saving the user's message)
    carried_context: str            # retrieved chunk content from the
                                     # thread's last rag_search message, if any
    answer: Optional[str]