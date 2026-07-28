# app/repositories/embedding_repository.py

from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.embedding import Embedding
from app.models.enums import SourceTypeEnum
from app.repositories.base import BaseRepository


class EmbeddingRepository(BaseRepository[Embedding]):
    """
    Handles all database operations for the Embedding model.
    """

    def __init__(self, db: Session):
        super().__init__(Embedding, db)

    # -------------------------------------------------------
    # READ
    # -------------------------------------------------------

    def get_by_id(self, embedding_id: int) -> Optional[Embedding]:
        return (
            self.db.query(Embedding)
            .filter(Embedding.embedding_id == embedding_id)
            .first()
        )

    def get_by_source(
        self,
        source_type: SourceTypeEnum,
        decision_id: Optional[int] = None,
        strategy_id: Optional[int] = None,
        constraint_id: Optional[int] = None,
        outcome_id: Optional[int] = None,
    ) -> Optional[Embedding]:
        """
        Fetches the single existing embedding for a structured entity,
        if one already exists. Used to detect "update vs create" during
        upsert — structured sources have exactly one row per entity.
        """
        query = self.db.query(Embedding).filter(Embedding.source_type == source_type)

        if decision_id is not None:
            query = query.filter(Embedding.decision_id == decision_id)
        if strategy_id is not None:
            query = query.filter(Embedding.strategy_id == strategy_id)
        if constraint_id is not None:
            query = query.filter(Embedding.constraint_id == constraint_id)
        if outcome_id is not None:
            query = query.filter(Embedding.outcome_id == outcome_id)

        return query.first()

    def get_all_by_document(self, document_id: int) -> List[Embedding]:
        """
        Fetches all document_chunk embeddings for a document, ordered
        by chunk position. Used when re-processing/deleting a document.
        """
        return (
            self.db.query(Embedding)
            .filter(
                Embedding.document_id == document_id,
                Embedding.source_type == SourceTypeEnum.document_chunk,
            )
            .order_by(Embedding.chunk_index)
            .all()
        )
    def search_by_vector(
        self,
        query_vector: list[float],
        source_types: Optional[List[SourceTypeEnum]] = None,
        department_id: Optional[int] = None,
        is_admin: bool = False,
        top_k: int = 5,
    ) -> List[Embedding]:
        """
            Cosine-similarity search over embeddings using pgvector's <=> operator
            (exposed by pgvector.sqlalchemy as .cosine_distance()).

            Access control is enforced here, not in the caller: non-admins only
            see rows where department_id is NULL (shared master data — strategies,
            constraints) or matches their own department. Admins see everything.
        """
        query = self.db.query(Embedding)

        if source_types:
            query = query.filter(Embedding.source_type.in_(source_types))

        if not is_admin:
            query = query.filter(
                (Embedding.department_id.is_(None))
                | (Embedding.department_id == department_id)
            )

        return (
            query.order_by(Embedding.embedding.cosine_distance(query_vector))
            .limit(top_k)
            .all()
        )

    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------

    def create(
        self,
        source_type: SourceTypeEnum,
        content: str,
        embedding: list[float],
        decision_id: Optional[int] = None,
        document_id: Optional[int] = None,
        outcome_id: Optional[int] = None,
        strategy_id: Optional[int] = None,
        constraint_id: Optional[int] = None,
        page_id: Optional[int] = None,
        department_id: Optional[int] = None,
        chunk_index: Optional[int] = None,
        embedding_metadata: Optional[dict] = None,
    ) -> Embedding:
        row = Embedding(
            source_type=source_type,
            content=content,
            embedding=embedding,
            decision_id=decision_id,
            document_id=document_id,
            outcome_id=outcome_id,
            strategy_id=strategy_id,
            constraint_id=constraint_id,
            page_id=page_id,
            department_id=department_id,
            chunk_index=chunk_index,
            embedding_metadata=embedding_metadata,
        )
        return self.save(row)

    # -------------------------------------------------------
    # DELETE
    # -------------------------------------------------------

    def delete_by_id(self, embedding: Embedding) -> None:
        self.delete(embedding)

    def delete_by_source(
        self,
        source_type: SourceTypeEnum,
        decision_id: Optional[int] = None,
        strategy_id: Optional[int] = None,
        constraint_id: Optional[int] = None,
        outcome_id: Optional[int] = None,
    ) -> None:
        """
        Deletes the existing embedding(s) for a structured entity before
        re-embedding it — the "delete old" half of upsert.
        """
        existing = self.get_by_source(
            source_type=source_type,
            decision_id=decision_id,
            strategy_id=strategy_id,
            constraint_id=constraint_id,
            outcome_id=outcome_id,
        )
        if existing:
            self.delete(existing)
    def delete_all_by_document(self, document_id: int) -> None:
        """
        Bulk-deletes every document_chunk embedding for a document.
        Needed before re-processing a document — unlike structured
        entities (≤1 row each), a document can have many chunk rows,
        so delete_by_source's single-row assumption doesn't apply here.
        """
        (
            self.db.query(Embedding)
            .filter(
                Embedding.document_id == document_id,
                Embedding.source_type == SourceTypeEnum.document_chunk,
            )
            .delete(synchronize_session=False)
        )
        self.db.commit()
    