# app/ai/graph/nodes.py

from sqlalchemy.orm import Session
from app.services.graph_query_service import get_graph_query_service
from app.services.embedding_service import get_embedding_service
from app.models.user import User
from app.ai.llm_client import generate_answer
from app.models.enums import SourceTypeEnum
from app.ai.reranker_client import rerank as rerank_texts

import math

RERANK_TOP_N = 4  # how many results survive reranking, feeding into synthesis

from langchain_core.runnables import RunnableConfig

def retrieve_vector(state: dict, config: RunnableConfig) -> dict:
    db = config["configurable"]["db"]
    embedding_service = get_embedding_service(db)
    user = db.query(User).filter(User.user_id == state["current_user"]["user_id"]).first()
    results = embedding_service.search(
        query_text=state["query"],
        current_user=user,
        top_k=5,
    )
    return {**state, "vector_results": results}


SYSTEM_PROMPT = """You are a decision support assistant for a college institution.
Answer the user's question using ONLY the information provided in the context below.
If the context does not contain enough information to answer, say so clearly —
do not guess or use outside knowledge.

When you use information from the context, refer to it naturally
(e.g. "According to the Q3 Budget Freeze decision...").
Keep your answer concise and directly relevant to the question."""


REFERENCE_ID_FIELD = {
    SourceTypeEnum.decision: "decision_id",
    SourceTypeEnum.strategy: "strategy_id",
    SourceTypeEnum.constraint: "constraint_id",
    SourceTypeEnum.outcome: "outcome_id",
    SourceTypeEnum.document_chunk: "document_id",
}


# def _build_citation(result: dict) -> dict:
#     """
#     Converts one vector_results entry into a SourceCitation-shaped dict.
#     Kept as a plain dict (not a Pydantic instance) here since graph state
#     is plain dicts throughout — the router layer converts to SourceCitation
#     for the actual API response.
#     """
#     source_type = result["source_type"]
#     id_field = REFERENCE_ID_FIELD[source_type]
#     reference_id = result[id_field]

#     metadata = dict(result["metadata"] or {})

#     # document_chunk's stored metadata already has document_id/page_number/
#     # chunk_index (set at embed time in embed_document_chunk) — no extra work needed.

#     return {
#         "source_type": source_type,
#         "reference_id": reference_id,
#         "embedding_id": result["embedding_id"],
#         "snippet": result["content"][:300],
#         "metadata": metadata,
#     }


# def synthesize(state: dict) -> dict:
#     """
#     LangGraph node. Reads state["query"] and state["vector_results"],
#     writes state["answer"] and state["citations"].
#     """
#     results = state.get("vector_results", [])

#     if not results:
#         return {
#             **state,
#             "answer": "I couldn't find any relevant information to answer that question.",
#             "citations": [],
#         }

#     context_blocks = []
#     for i, r in enumerate(results, 1):
#         context_blocks.append(f"[Source {i} - {r['source_type'].value}]\n{r['content']}")
    
#     context_text = "\n\n".join(context_blocks)

#     user_prompt = f"""Context:
# {context_text}

# Question: {state['query']}"""

#     answer = generate_answer(SYSTEM_PROMPT, user_prompt)

#     citations = [_build_citation(r) for r in results]

#     return {**state, "answer": answer, "citations": citations}




def rerank_results(state: dict) -> dict:
    """
    LangGraph node. Reads state["vector_results"], re-scores each
    candidate against the query using a cross-encoder, keeps only
    the top RERANK_TOP_N, and re-sorts by the new score (highest first).
    """
    results = state.get("vector_results", [])

    if not results:
        return {**state, "vector_results": []}

    query = state["query"]
    candidate_texts = [r["content"] for r in results]

    scores = rerank_texts(query, candidate_texts)

    for r, score in zip(results, scores):
        r["rerank_score"] = score

    reranked = sorted(results, key=lambda r: r["rerank_score"], reverse=True)
    top_results = reranked[:RERANK_TOP_N]

    return {**state, "vector_results": top_results}


def _confidence_from_score(raw_score: float) -> tuple[float, str]:
    """
    Converts the top result's raw cross-encoder score (an unbounded logit)
    into a 0-1 confidence value via sigmoid, then buckets it into a level.
    Thresholds are a starting point — worth recalibrating once you've seen
    real query data (log a batch of raw scores + eyeball what "feels right").
    """
    confidence_score = 1 / (1 + math.exp(-raw_score))
    if confidence_score >= 0.70:
        level = "high"
    elif confidence_score >= 0.40:
        level = "medium"
    else:
        level = "low"
    return confidence_score, level


def _build_citation(result: dict) -> dict | None:
    source_type = result["source_type"]
    id_field = REFERENCE_ID_FIELD[source_type]
    reference_id = result[id_field]
    if reference_id is None:
        # Stale/orphaned embedding row — source_type doesn't match its
        # populated FK. Skip rather than crash the whole response.
        return None
    metadata = dict(result["metadata"] or {})
    return {
        "source_type": source_type,
        "reference_id": reference_id,
        "embedding_id": result["embedding_id"],
        "snippet": result["content"][:300],
        "metadata": metadata,
        "rerank_score": result.get("rerank_score"),
    }


def synthesize(state: dict) -> dict:
    results = state.get("vector_results", [])
    graph_result = state.get("graph_result")

    if not results and not graph_result:
        return {
            **state,
            "answer": "I couldn't find any relevant information to answer that question.",
            "citations": [],
            "confidence_score": 0.0,
            "confidence_level": "low",
        }

    context_blocks = []
    for i, r in enumerate(results, 1):
        context_blocks.append(f"[Source {i} - {r['source_type'].value}]\n{r['content']}")

    if graph_result:
        context_blocks.append(
            f"[Knowledge graph result - {graph_result['template']}]\n{graph_result['results']}"
        )

    context_text = "\n\n".join(context_blocks)

    user_prompt = f"""Context:
{context_text}
Question: {state['query']}"""

    answer = generate_answer(SYSTEM_PROMPT, user_prompt)
    citations = [c for c in (_build_citation(r) for r in results) if c is not None]
    # Confidence is still anchored purely to vector rerank_score — a
    # graph-only hit (no vector_results at all) has no rerank_score to
    # read, so it falls back to a neutral 0.5/medium rather than 0.0/low,
    # since "graph found something real" shouldn't register as low confidence.
    if results:
        top_score = results[0].get("rerank_score", 0.0)
        confidence_score, confidence_level = _confidence_from_score(top_score)
    elif graph_result:
        confidence_score, confidence_level = 0.5, "medium"
    else:
        confidence_score, confidence_level = 0.0, "low"

    return {
        **state,
        "answer": answer,
        "citations": citations,
        "confidence_score": confidence_score,
        "confidence_level": confidence_level,
    }

def query_graph(state: dict, config: RunnableConfig) -> dict:
    db = config["configurable"]["db"]
    user = db.query(User).filter(User.user_id == state["current_user"]["user_id"]).first()
    graph_query_service = get_graph_query_service(db)
    graph_result = graph_query_service.run(state["query"], user)
    return {**state, "graph_result": graph_result}