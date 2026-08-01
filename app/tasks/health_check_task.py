from app.celery_app import celery_app


@celery_app.task(name="health_check_add")
def health_check_add(x: int, y: int) -> int:
    """
    Trivial task with zero business logic or DB dependency. Exists to let
    integration tests (and, incidentally, future ops/health-check tooling)
    prove the Celery + Redis plumbing round-trip in isolation, without
    dragging in a real DB session or the document-processing pipeline.
    """
    return x + y