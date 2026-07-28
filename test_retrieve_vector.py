# test_retrieve_vector.py
# Run from your project root: python test_retrieve_vector.py

from app.database import SessionLocal
from app.models.user import User
from app.ai.graph.nodes import retrieve_vector
from app.ai.graph.graph import build_rag_graph
from app.services.document_service import get_document_service
from app.ai.graph.nodes import rerank_results

session = SessionLocal()

# -------------------------------------------------------
# OPTIONAL: reprocess an existing document so its chunks
# get the corrected metadata (file_name, decision_title).
# Set REPROCESS_DOCUMENT_ID to a real document_id and
# REPROCESS_FILE_PATH to that same file's path on disk to
# use this. Leave REPROCESS_DOCUMENT_ID as None to skip.
# -------------------------------------------------------
REPROCESS_DOCUMENT_ID = None  # e.g. 1
REPROCESS_FILE_PATH = None    # e.g. r"D:\path\to\42_Capstone_Proposal.pdf"


try:
    if REPROCESS_DOCUMENT_ID is not None:
        print(f"Reprocessing document_id={REPROCESS_DOCUMENT_ID}...")
        with open(REPROCESS_FILE_PATH, "rb") as f:
            file_bytes = f.read()

        doc_service = get_document_service(session)
        doc_service.reprocess_document(REPROCESS_DOCUMENT_ID, file_bytes)
        print("Reprocessing complete.\n")

    # Grab a real user row to test access-control filtering honestly.
    # Swap this filter for a user_id you know exists.
    test_user = session.query(User).first()
    if not test_user:
        raise RuntimeError("No users in the DB — create one first.")

    print(f"Testing as: user_id={test_user.user_id}, "
          f"role={test_user.role}, department_id={test_user.department_id}")

    query = "What did the finance committee decide about travel spending?"

    current_user_info = {
        "user_id": test_user.user_id,
        "role": test_user.role.value,
        "department_id": test_user.department_id,
    }

    # --- Step 1: raw retrieval (useful for debugging) ---
    state = {
        "query": query,
        "current_user": current_user_info,
    }

    result_state = retrieve_vector(state, db=session)
    results = result_state["vector_results"]

    print(f"\nGot {len(results)} results (after threshold filter):\n")

    for i, r in enumerate(results, 1):
        print(f"--- Result {i} ---")
        print(f"source_type: {r['source_type']}")
        print(f"distance:    {r['distance']:.4f}")
        print(f"content:     {r['content'][:150]}...")
        if "parent_page_content" in r:
            print(f"page_number: {r['page_number']}")
            print(f"parent_page_content: {r['parent_page_content'][:150]}...")
        print()

    # --- Step 2: full graph — retrieval + synthesis ---
    print("=" * 60)
    print("Running full graph (retrieve_vector -> synthesize)...")
    print("=" * 60)

    graph = build_rag_graph(db=session)

    final_state = graph.invoke({
        "query": query,
        "current_user": current_user_info,
    })

    print(f"\nQuery: {query}\n")
    print(f"Answer:\n{final_state['answer']}\n")

    # --- Step 3: citations ---
    citations = final_state.get("citations", [])
    print(f"Citations ({len(citations)}):\n")

    for i, c in enumerate(citations, 1):
        print(f"--- Citation {i} ---")
        print(f"source_type:   {c['source_type']}")
        print(f"reference_id:  {c['reference_id']}")
        print(f"snippet:       {c['snippet'][:100]}...")
        print(f"metadata:      {c['metadata']}")
        print()
    print("=" * 60)
    print("Reranking...")
    print("=" * 60)

    reranked_state = rerank_results({**state, "vector_results": results})
    reranked = reranked_state["vector_results"]

    print(f"\nTop {len(reranked)} after reranking:\n")
    for i, r in enumerate(reranked, 1):
        print(f"--- Reranked {i} ---")
        print(f"source_type:   {r['source_type']}")
        print(f"distance:      {r['distance']:.4f}")
        print(f"rerank_score:  {r['rerank_score']:.4f}")
        print(f"content:       {r['content'][:100]}...")
        print()
finally:
    session.close()