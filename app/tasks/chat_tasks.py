from celery.signals import worker_process_init
from app.celery_app import celery_app
from app.database import SessionLocal

_graph = None

@worker_process_init.connect
def warmup_chat_worker(**kwargs):
    global _graph
    print("🚀 Pre-loading RAG graph in Celery worker process...")
    from app.ai.graph.graph import build_rag_graph
    _graph = build_rag_graph()   # <-- no db passed in anymore
    print("......RAG graph loaded successfully......")

    print("🚀 Pre-loading reranker model in Celery worker process...")
    from app.ai.reranker_client import get_reranker
    get_reranker()
    print("......Reranker model loaded successfully......")


@celery_app.task(name="rag_search")
def rag_search_task(query: str, current_user: dict) -> dict:
    """Runs the RAG search graph inside the worker process."""
    global _graph

    if _graph is None:
        from app.ai.graph.graph import build_rag_graph
        _graph = build_rag_graph()

    db = SessionLocal()  # fresh session, this call only
    try:
        result = _graph.invoke(
            {
                "query": query,
                "current_user": current_user,
            },
            config={"configurable": {"db": db}},
        )
    finally:
        db.close()  

    return {
        "answer": result["answer"],
        "citations": result.get("citations", []),
        "confidence_score": result.get("confidence_score"),
        "confidence_level": result.get("confidence_level"),
    }