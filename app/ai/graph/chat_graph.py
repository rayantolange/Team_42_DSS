# app/ai/graph/chat_graph.py

from langgraph.graph import StateGraph, END

from app.ai.graph.chat_state import ChatGraphState
from app.ai.graph.chat_nodes import chat_respond


def build_chat_graph():
    """
    Builds and compiles the conversational (chat-mode) graph.

    Unlike build_rag_graph, this takes no db argument and needs no
    functools.partial binding — it never touches the vector store or
    embeddings directly. ChatService already resolves carried_context
    (via the chat repo + embedding repo) before calling invoke(), so
    this graph is pure: state in, LLM call, state out.
    """
    graph = StateGraph(ChatGraphState)

    graph.add_node("chat_respond", chat_respond)
    graph.set_entry_point("chat_respond")
    graph.add_edge("chat_respond", END)

    return graph.compile()