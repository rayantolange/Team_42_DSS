# test_rag_graph.py

from app.database import SessionLocal
from app.models.user import User
from app.ai.graph.graph import build_rag_graph

session = SessionLocal()

try:
    test_user = session.query(User).first()

    app_graph = build_rag_graph(session)

    result = app_graph.invoke({
        "query": "budget cuts for the computer science department",
        "current_user": test_user,
    })

    print(f"Got {len(result['vector_results'])} results via the graph")

finally:
    session.close()