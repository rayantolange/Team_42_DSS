# app/ai/embedding_client.py

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

_model = None


def get_model():
    """
    Loads nomic-embed-text once and caches it at module level.
    Avoids reloading the ~547MB model on every call — this should
    be the ONLY place in the app that loads the embedding model.
    """
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer  # Lazy import to prevent app boot crashes
        _model = SentenceTransformer(
            "nomic-ai/nomic-embed-text-v1.5",
            trust_remote_code=True,
        )
    return _model


def embed_document(text: str) -> list[float]:
    """
    Embed text meant to be STORED/searched over.
    nomic-embed-text requires this exact prefix for content embeddings.
    """
    model = get_model()
    prefixed = f"search_document: {text}"
    return model.encode(prefixed, normalize_embeddings=True).tolist()


def embed_documents_batch(texts: list[str]) -> list[list[float]]:
    """
    Embed multiple STORED/searched texts in a single batched call.
    Far faster than looping embed_document() per chunk — the model
    processes the whole batch together instead of one string at a time.
    """
    model = get_model()
    prefixed = [f"search_document: {t}" for t in texts]
    vectors = model.encode(prefixed, normalize_embeddings=True)
    return vectors.tolist()


def embed_query(text: str) -> list[float]:
    """
    Embed a user's QUERY text — different prefix than stored content.
    Mismatching these prefixes measurably hurts retrieval quality.
    """
    model = get_model()
    prefixed = f"search_query: {text}"
    return model.encode(prefixed, normalize_embeddings=True).tolist()