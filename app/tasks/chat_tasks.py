from app.celery_app import celery_app
from app.database import SessionLocal


@celery_app.task(name="rag_search")
def rag_search_task(query: str, current_user: dict) -> dict:
    """
    Runs the RAG search graph inside the worker process. build_rag_graph
    is imported here, inside the function, rather than at module level —
    this file gets imported by chat_service.py (which runs in the light
    API process too, just to enqueue this task), and a module-level
    import would drag neo4j/graph dependencies into the API process even
    though it never actually executes this function itself.
    """
    from app.ai.graph.graph import build_rag_graph

    db = SessionLocal()
    try:
        graph = build_rag_graph(db=db)
        result = graph.invoke({
            "query": query,
            "current_user": current_user,
        })
        return {
            "answer": result["answer"],
            "citations": result.get("citations", []),
            "confidence_score": result.get("confidence_score"),
            "confidence_level": result.get("confidence_level"),
        }
    finally:
        db.close()