# app/services/embedding_service.py

from sqlalchemy.orm import Session

from app.models.decision import Decision
from app.models.strategy import Strategy, ConstraintMaster
from app.models.outcome import Outcome
from app.models.embedding import Embedding
from app.models.enums import SourceTypeEnum
from app.repositories.embedding_repository import EmbeddingRepository
from app.ai.embedding_client import embed_document


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


# -------------------------------------------------------
# FastAPI Dependency
# -------------------------------------------------------

def get_embedding_service(db: Session) -> EmbeddingService:
    return EmbeddingService(db)