from celery.signals import worker_process_init

from app.celery_app import celery_app
from app.database import SessionLocal

# Global reference held in memory per worker process
_graph = None


@worker_process_init.connect
def warmup_chat_worker(**kwargs):
    """Fires ONLY inside Celery worker child processes on boot.

    Pre-loads the RAG graph into memory so API calls remain fast while
    worker executions take seconds instead of minutes.
    """
    global _graph
    print("Pre-loading RAG graph in Celery worker process...")

    from app.ai.graph.graph import build_rag_graph

    db = SessionLocal()
    try:
        _graph = build_rag_graph(db=db)
    finally:
        db.close()

    print("✅ RAG graph loaded successfully.")


@celery_app.task(name="rag_search")
def rag_search_task(query: str, current_user: dict) -> dict:
    """Runs the RAG search graph inside the worker process."""
    global _graph

    # Fallback in case worker signal hasn't fired (e.g., during tests)
    if _graph is None:
        from app.ai.graph.graph import build_rag_graph

        db = SessionLocal()
        try:
            graph_to_use = build_rag_graph(db=db)
        finally:
            db.close()
    else:
        graph_to_use = _graph

    result = graph_to_use.invoke(
        {
            "query": query,
            "current_user": current_user,
        }
    )

    return {
        "answer": result["answer"],
        "citations": result.get("citations", []),
        "confidence_score": result.get("confidence_score"),
        "confidence_level": result.get("confidence_level"),
    }