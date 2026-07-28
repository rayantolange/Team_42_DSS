# app/ai/reranker_client.py

from sentence_transformers import CrossEncoder

_reranker: CrossEncoder | None = None


def get_reranker() -> CrossEncoder:
    """
    Loads the cross-encoder reranker once and caches it at module level.
    ms-marco-MiniLM-L-6-v2 is small, CPU-friendly, and well-suited to
    short query/passage relevance scoring — the standard first choice
    for self-hosted reranking.
    """
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return _reranker


def rerank(query: str, candidates: list[str]) -> list[float]:
    """
    Scores each candidate's relevance to the query. Higher = more relevant.
    Unlike embedding distance, this looks at the query and each candidate
    TOGETHER, so it can't be precomputed — it runs fresh per call.
    """
    reranker = get_reranker()
    pairs = [(query, c) for c in candidates]
    scores = reranker.predict(pairs)
    return scores.tolist()