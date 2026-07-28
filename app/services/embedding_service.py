# app/services/embedding_service.py

from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.decision import Decision
from app.models.strategy import Strategy, ConstraintMaster
from app.models.outcome import Outcome
from app.models.embedding import Embedding
from app.models.enums import SourceTypeEnum
from app.repositories.embedding_repository import EmbeddingRepository
from app.ai.embedding_client import embed_document, embed_query
from app.repositories.document_repository import DocumentRepository
from app.models.user import User
from app.models.enums import UserRoleEnum

class EmbeddingService:
    """
    Builds and stores embeddings for structured entities:
    Decision, Strategy, ConstraintMaster, Outcome.

    Each entity gets exactly ONE embedding row, combining its
    title/name and description fields into a single chunk.
    Re-embedding an already-embedded entity replaces the old row
    (upsert) rather than accumulating duplicates.
    """

    def __init__(self, db: Session):
        self.embedding_repo = EmbeddingRepository(db)

    # -------------------------------------------------------
    # DECISION
    # -------------------------------------------------------

    def embed_decision(self, decision: Decision) -> Embedding:
        content = (
            f"{decision.title}\n\n"
            f"{decision.problem_statement}\n\n"
            f"{decision.decision_desc}"
        )

        metadata = {
            "title": decision.title,
            "decision_type": decision.decision_type,
            "status": decision.status.value,
            "decision_date": decision.decision_date.isoformat() if decision.decision_date else None,
            "created_by_name": decision.creator.full_name if decision.creator else None,
        }

        self.embedding_repo.delete_by_source(
            source_type=SourceTypeEnum.decision,
            decision_id=decision.decision_id,
        )

        vector = embed_document(content)

        return self.embedding_repo.create(
            source_type=SourceTypeEnum.decision,
            content=content,
            embedding=vector,
            decision_id=decision.decision_id,
            department_id=decision.department_id,
            embedding_metadata=metadata,
        )

    # -------------------------------------------------------
    # STRATEGY
    # -------------------------------------------------------

    def embed_strategy(self, strategy: Strategy) -> Embedding:
        content = f"{strategy.strategy_name}\n\n{strategy.description or ''}"

        metadata = {
            "strategy_name": strategy.strategy_name,
        }

        self.embedding_repo.delete_by_source(
            source_type=SourceTypeEnum.strategy,
            strategy_id=strategy.strategy_id,
        )

        vector = embed_document(content)

        return self.embedding_repo.create(
            source_type=SourceTypeEnum.strategy,
            content=content,
            embedding=vector,
            strategy_id=strategy.strategy_id,
            # Strategy is shared master data — no single department owns it,
            # so department_id stays NULL and access filtering falls back to
            # "visible to everyone" for this source_type at query time.
            department_id=None,
            embedding_metadata=metadata,
        )

    # -------------------------------------------------------
    # CONSTRAINT
    # -------------------------------------------------------

    def embed_constraint(self, constraint: ConstraintMaster) -> Embedding:
        content = f"{constraint.constraint_type}\n\n{constraint.description or ''}"

        metadata = {
            "constraint_type": constraint.constraint_type,
        }

        self.embedding_repo.delete_by_source(
            source_type=SourceTypeEnum.constraint,
            constraint_id=constraint.constraint_id,
        )

        vector = embed_document(content)

        return self.embedding_repo.create(
            source_type=SourceTypeEnum.constraint,
            content=content,
            embedding=vector,
            constraint_id=constraint.constraint_id,
            department_id=None,  # same reasoning as Strategy — shared master data
            embedding_metadata=metadata,
        )

    # -------------------------------------------------------
    # OUTCOME
    # -------------------------------------------------------

    def embed_outcome(self, outcome: Outcome) -> Embedding:
        # Outcome has no title of its own — borrow the parent Decision's.
        decision = outcome.decision  # relationship already defined on Outcome
        decision_title = decision.title if decision else "Untitled Decision"

        content = f"Outcome for '{decision_title}':\n\n{outcome.outcome_desc or ''}"

        metadata = {
            "decision_title": decision_title,
            "outcome_status": outcome.outcome_status.value,
            "success_score": float(outcome.success_score) if outcome.success_score is not None else None,
        }

        self.embedding_repo.delete_by_source(
            source_type=SourceTypeEnum.outcome,
            outcome_id=outcome.outcome_id,
        )

        vector = embed_document(content)

        return self.embedding_repo.create(
            source_type=SourceTypeEnum.outcome,
            content=content,
            embedding=vector,
            outcome_id=outcome.outcome_id,
            department_id=decision.department_id if decision else None,
            embedding_metadata=metadata,
        )
    from app.models.document_page import DocumentPage

    # -------------------------------------------------------
    # DOCUMENT CHUNK
    # -------------------------------------------------------

    def embed_document_chunk(
        self,
        page: DocumentPage,
        chunk_text: str,
        chunk_index: int,
    ) -> Embedding:
        """
        Embeds one paragraph-level chunk from a page. Unlike the four
        structured embed_* methods, this does NOT delete-before-create
        per call — for a document with many chunks, deleting once up
        front (via clear_document_chunks) and re-creating all of them
        is correct; deleting per-chunk here would be redundant.
        """
        metadata = {
            "document_id": page.document_id,
            "page_number": page.page_number,
            "chunk_index": chunk_index,
        }

        vector = embed_document(chunk_text)

        department_id = None
        if page.document and page.document.decision:
            department_id = page.document.decision.department_id

        return self.embedding_repo.create(
            source_type=SourceTypeEnum.document_chunk,
            content=chunk_text,
            embedding=vector,
            document_id=page.document_id,
            page_id=page.page_id,
            chunk_index=chunk_index,
            department_id=department_id,
            embedding_metadata=metadata,
        )

    def clear_document_chunks(self, document_id: int) -> None:
        """
        Deletes all existing chunk embeddings for a document — call
        once before re-embedding during a reprocess.
        """
        self.embedding_repo.delete_all_by_document(document_id)
    
    def search(
        self,
        query_text: str,
        current_user: User,
        source_types: Optional[List[SourceTypeEnum]] = None,
        top_k: int = 5,
    ) -> List[dict]:
        """
        The actual retrieve_vector logic: embed the query, run similarity
        search, and shape results into citation-ready dicts. For document_chunk
        hits, also pulls the parent page's full text (parent-child retrieval —
        the chunk is what matched, but the LLM gets the whole page for context).
        """
        query_vector = embed_query(query_text)

        is_admin = current_user.role == UserRoleEnum.admin
        rows = self.embedding_repo.search_by_vector(
            query_vector=query_vector,
            source_types=source_types,
            department_id=current_user.department_id,
            is_admin=is_admin,
            top_k=top_k,
        )

        results = []
        for row in rows:
            result = {
                "embedding_id": row.embedding_id,
                "source_type": row.source_type,
                "content": row.content,
                "metadata": row.embedding_metadata,
                "decision_id": row.decision_id,
                "document_id": row.document_id,
            }

            if row.source_type == SourceTypeEnum.document_chunk and row.page_id:
                page = self.document_repo.get_page_by_id(row.page_id)  # add this tiny helper if missing
                if page:
                    result["parent_page_content"] = page.page_content
                    result["page_number"] = page.page_number

            results.append(result)

        return results


# -------------------------------------------------------
# FastAPI Dependency
# -------------------------------------------------------

def get_embedding_service(db: Session) -> EmbeddingService:
    return EmbeddingService(db)