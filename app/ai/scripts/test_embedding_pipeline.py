"""
Standalone test script — NOT part of the app.
Validates the full embed -> insert -> similarity-search loop
in isolation before wiring it into repositories/services.

Run from project root: python app/ai/scripts/test_embedding_pipeline.py
"""

import sys
from pathlib import Path

from sentence_transformers import SentenceTransformer
from sqlalchemy import text

# Add project root to sys.path so `from app...` imports resolve,
# regardless of how deep this script is nested.
PROJECT_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(PROJECT_ROOT))

from app.database import SessionLocal
from app.models.embedding import Embedding
from app.models.enums import SourceTypeEnum

print("Loading nomic-embed-text... (first run downloads the model, may take a minute)")
model = SentenceTransformer("nomic-ai/nomic-embed-text-v1.5", trust_remote_code=True)
print("Model loaded.")


def embed_document(text_content: str):
    """Embed text meant to be STORED/searched over."""
    prefixed = f"search_document: {text_content}"
    return model.encode(prefixed, normalize_embeddings=True).tolist()


def embed_query(text_content: str):
    """Embed a user's QUERY text — different prefix than stored content."""
    prefixed = f"search_query: {text_content}"
    return model.encode(prefixed, normalize_embeddings=True).tolist()


def main():
    test_sentences = [
        "The Finance Department approved a budget cut for travel expenses.",
        "The IT Department implemented a new cybersecurity policy.",
        "The HR Department revised the staff onboarding process.",
    ]

    session = SessionLocal()

    try:
        print("\n--- Embedding and inserting test rows ---")
        for sentence in test_sentences:
            vector = embed_document(sentence)

            row = Embedding(
                decision_id=None,
                document_id=None,
                outcome_id=None,
                strategy_id=None,
                constraint_id=None,
                source_type=SourceTypeEnum.decision_desc,  # placeholder for this test
                chunk_index=None,
                content=sentence,
                embedding=vector,
            )
            session.add(row)
            print(f"Inserted: {sentence[:60]}...")

        session.commit()
        print(f"\nInserted {len(test_sentences)} test rows.")

        print("\n--- Running similarity search ---")
        query = "What did the finance team decide about travel budgets?"
        query_vector = embed_query(query)

        result = session.execute(
            text("""
                SELECT content, embedding <=> :qvec AS distance
                FROM embeddings
                ORDER BY embedding <=> :qvec
                LIMIT 3
            """),
            {"qvec": str(query_vector)},
        )

        print(f"\nQuery: {query}\n")
        for row in result:
            print(f"  distance={row.distance:.4f}  content={row.content}")

        print("\n--- Cleaning up test rows ---")
        session.execute(
            text("DELETE FROM embeddings WHERE content = ANY(:contents)"),
            {"contents": test_sentences},
        )
        session.commit()
        print("Test rows removed.")

    finally:
        session.close()


if __name__ == "__main__":
    main()