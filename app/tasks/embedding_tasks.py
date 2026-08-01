from app.celery_app import celery_app
from app.database import SessionLocal


@celery_app.task(name="embed_decision")
def embed_decision_task(decision_id: int) -> None:
    """
    Embeds/re-embeds a Decision after create/update. Runs on the worker
    only — EmbeddingService is imported lazily inside this function so
    the API process (which just calls .delay()) never needs
    sentence-transformers loaded just to enqueue this task.
    """
    from app.services.embedding_service import EmbeddingService
    from app.repositories.decision_repository import DecisionRepository

    db = SessionLocal()
    try:
        decision = DecisionRepository(db).get_by_id(decision_id)
        if decision is None:
            return  # deleted before the worker got to it
        EmbeddingService(db).embed_decision(decision)
    finally:
        db.close()


@celery_app.task(name="embed_strategy")
def embed_strategy_task(strategy_id: int) -> None:
    from app.services.embedding_service import EmbeddingService
    from app.repositories.strategy_repository import StrategyRepository

    db = SessionLocal()
    try:
        strategy = StrategyRepository(db).get_by_id(strategy_id)
        if strategy is None:
            return
        EmbeddingService(db).embed_strategy(strategy)
    finally:
        db.close()


@celery_app.task(name="embed_constraint")
def embed_constraint_task(constraint_id: int) -> None:
    from app.services.embedding_service import EmbeddingService
    from app.repositories.constraint_repository import ConstraintRepository

    db = SessionLocal()
    try:
        constraint = ConstraintRepository(db).get_by_id(constraint_id)
        if constraint is None:
            return
        EmbeddingService(db).embed_constraint(constraint)
    finally:
        db.close()


@celery_app.task(name="embed_outcome")
def embed_outcome_task(outcome_id: int) -> None:
    from app.services.embedding_service import EmbeddingService
    from app.repositories.outcome_repository import OutcomeRepository

    db = SessionLocal()
    try:
        outcome = OutcomeRepository(db).get_by_id(outcome_id)
        if outcome is None:
            return
        EmbeddingService(db).embed_outcome(outcome)
    finally:
        db.close()