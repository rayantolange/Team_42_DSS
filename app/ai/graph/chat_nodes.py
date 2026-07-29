# app/ai/graph/chat_nodes.py

from app.ai.llm_client import generate_chat_completion


CHAT_SYSTEM_PROMPT = """You are a decision support assistant for a college \
institution, having an ongoing conversation with a user.

Answer naturally and conversationally. If context from a recent search is \
provided below, use it to answer follow-up questions accurately — e.g. \
clarifying a figure, quoting a detail, or explaining something further. If \
the user's message doesn't relate to that context, just reply normally; you \
are not required to force the context into every answer.

Do not invent facts that aren't in the provided context or the conversation \
history."""


def chat_respond(state: dict) -> dict:
    """
    LangGraph node for conversational (non-retrieval) mode.

    Reads state["history"] — already includes the latest user turn, since
    ChatService saves the user's message to the DB and re-fetches thread
    history *before* invoking this graph — and state["carried_context"],
    the retrieved chunk content from the thread's last RAG search (empty
    string if there wasn't one, or it wasn't relevant enough to carry).

    Writes state["answer"].
    """
    carried_context = state.get("carried_context", "")

    system_prompt = CHAT_SYSTEM_PROMPT
    if carried_context:
        system_prompt += (
            "\n\nContext from the most recent search in this conversation:\n"
            f"{carried_context}"
        )

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(
        {"role": turn["role"], "content": turn["content"]}
        for turn in state.get("history", [])
    )

    answer = generate_chat_completion(messages)

    return {**state, "answer": answer}