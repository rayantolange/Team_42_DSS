# test_rag_graph.py
# Run from your project root: python test_rag_graph.py
#
# Covers three cases:
#   1. A pure graph question (should classify to a template, resolve an
#      entity, and return real graph results folded into the answer)
#   2. A pure vector question (should classify to "none", graph_result
#      stays None, behaves exactly like before graph was added)
#   3. A template-matching question whose entity can't be resolved
#      (should fail gracefully to graph_result: None, not crash)

from app.database import SessionLocal
from app.models.user import User
from app.ai.graph.graph import build_rag_graph

session = SessionLocal()

try:
    test_user = session.query(User).first()
    if not test_user:
        raise RuntimeError("No users in the DB — create one first.")

    print(f"Testing as: user_id={test_user.user_id}, "
          f"role={test_user.role}, department_id={test_user.department_id}")

    rag_graph = build_rag_graph(db=session)

    current_user_payload = {
        "user_id": test_user.user_id,
        "role": test_user.role.value,
        "department_id": test_user.department_id,
    }

    test_cases = [
        (
            "PURE GRAPH QUESTION",
            "Which other decisions share a constraint with the Q3 travel budget decision?",
        ),
        (
            "PURE VECTOR QUESTION",
            "What did the finance committee decide about travel spending?",
        ),
        (
            "UNRESOLVABLE ENTITY (should fail gracefully)",
            "Which decisions used the same strategy as the Mars colonization initiative?",
        ),
    ]

    for label, query in test_cases:
        print("\n" + "=" * 70)
        print(label)
        print("=" * 70)
        print(f"Query: {query}\n")

        result = rag_graph.invoke({
            "query": query,
            "current_user": current_user_payload,
        })

        print(f"Answer: {result['answer']}\n")

        graph_result = result.get("graph_result")
        if graph_result:
            print(f"Graph template used: {graph_result['template']}")
            print(f"Resolved entity_id:  {graph_result['entity_id']}")
            print(f"Graph results ({len(graph_result['results'])}):")
            for r in graph_result["results"]:
                print(f"    {r}")
        else:
            print("Graph result: None (no template matched, or entity unresolved)")

        print(f"\nVector citations ({len(result.get('citations', []))}):")
        for c in result.get("citations", []):
            print(f"    {c['source_type']} / ref_id={c['reference_id']} / snippet={c['snippet'][:60]}...")

        print(f"\nConfidence: {result.get('confidence_score')} ({result.get('confidence_level')})")

finally:
    session.close()