from celery.signals import worker_process_init

from app.celery_app import celery_app
from app.database import SessionLocal

# Global reference held in memory per worker process
_embedding_service = None


@worker_process_init.connect
def warmup_embedding_worker(**kwargs):
    """Pre-loads SentenceTransformer & CrossEncoder models into worker process RAM."""
    global _embedding_service
    print("🚀 Pre-loading EmbeddingService models in Celery worker process...")

    from app.services.embedding_service import EmbeddingService

    db = SessionLocal()
    try:
        service = EmbeddingService(db=db)

        # FORCE MODEL INITIALIZATION IN RAM NOW:
        # Accessing the models/embedder directly triggers Hugging Face loading
        # Adjust these attribute names to match how your EmbeddingService stores them
        # (e.g., service.model, service.embedder, service.encoder, etc.)
        if hasattr(service, "model") and service.model is None:
            _ = service.model
        if hasattr(service, "embedder"):
            _ = service.embedder

        # Alternatively, run a dummy 1-word embedding to force-warm both models:
        try:
            if hasattr(service, "get_embedding"):
                service.get_embedding("warmup query")
        except Exception:
            pass

        _embedding_service = service
    finally:
        db.close()

    print("......Embedding models fully loaded in memory......")


def _get_embedding_service(db):
    """Helper to return warm service or initialize on-the-fly if needed."""
    global _embedding_service
    if _embedding_service is not None:
        return _embedding_service

    from app.services.embedding_service import EmbeddingService

    return EmbeddingService(db=db)


@celery_app.task(name="embed_decision")
def embed_decision_task(decision_id: int) -> None:
    from app.repositories.decision_repository import DecisionRepository

    db = SessionLocal()
    try:
        decision = DecisionRepository(db).get_by_id(decision_id)
        if decision is None:
            return  # deleted before worker got to it
        _get_embedding_service(db).embed_decision(decision)
    finally:
        db.close()


@celery_app.task(name="embed_strategy")
def embed_strategy_task(strategy_id: int) -> None:
    from app.repositories.strategy_repository import StrategyRepository

    db = SessionLocal()
    try:
        strategy = StrategyRepository(db).get_by_id(strategy_id)
        if strategy is None:
            return
        _get_embedding_service(db).embed_strategy(strategy)
    finally:
        db.close()


@celery_app.task(name="embed_constraint")
def embed_constraint_task(constraint_id: int) -> None:
    from app.repositories.constraint_repository import ConstraintRepository

    db = SessionLocal()
    try:
        constraint = ConstraintRepository(db).get_by_id(constraint_id)
        if constraint is None:
            return
        _get_embedding_service(db).embed_constraint(constraint)
    finally:
        db.close()


@celery_app.task(name="embed_outcome")
def embed_outcome_task(outcome_id: int) -> None:
    from app.repositories.outcome_repository import OutcomeRepository

    db = SessionLocal()
    try:
        outcome = OutcomeRepository(db).get_by_id(outcome_id)
        if outcome is None:
            return
        _get_embedding_service(db).embed_outcome(outcome)
    finally:
        db.close()