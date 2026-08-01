from app.celery_app import celery_app
from app.database import SessionLocal
from app.ai.graph.graph import build_rag_graph


@celery_app.task(name="rag_search")
def rag_search_task(query: str, current_user: dict) -> dict:
    """
    Runs the RAG search graph (query embedding, vector search, LLM
    synthesis) inside the worker process instead of the API process.
    This is what lets the API stay free of sentence-transformers/torch
    — all the heavy lifting happens here, on whichever machine is
    running the Celery worker.

    current_user is passed as a plain dict (not a User model instance)
    since Celery serializes task arguments as JSON — the graph only
    ever reads user_id/role/department_id from it anyway.
    """
    db = SessionLocal()
    try:
        graph = build_rag_graph(db=db)
        result = graph.invoke({
            "query": query,
            "current_user": current_user,
        })
        # Only return plain JSON-serializable data — citations are
        # already plain dicts per the existing code, so this should
        # pass through untouched.
        return {
            "answer": result["answer"],
            "citations": result.get("citations", []),
            "confidence_score": result.get("confidence_score"),
            "confidence_level": result.get("confidence_level"),
        }
    finally:
        db.close()