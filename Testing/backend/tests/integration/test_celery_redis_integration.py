# Testing/backend/tests/integration/test_celery_redis_integration.py
"""
Integration test for the Celery + Redis plumbing itself — deliberately
NOT testing process_document_task's business logic (that's fully covered
by the mocked unit tests in test_document_tasks.py). This tier proves
only that: a task can be enqueued through the real `celery_app`, hit a
real Redis broker, get picked up by a real worker, and return a result.

Needs a real, ephemeral, LOCAL-ONLY Redis instance — never Upstash:
  - Local:  `docker compose up redis -d` first, then run this file.
  - CI:     a GitHub Actions Redis service container; no compose needed.

REDIS_URL is read the same way app/celery_app.py reads it, so this test
naturally follows wherever your broker actually is (localhost, a
compose service, or a CI service container) without any test-specific
override logic.
"""
import os

import pytest
from celery.contrib.testing.worker import start_worker

from app.celery_app import celery_app
from app.tasks.health_check_task import health_check_add

# Match app/celery_app.py's own fallback exactly, so this test points at
# the same broker the real app would use in the same environment.
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


@pytest.fixture(scope="module")
def celery_test_worker():
    """
    Starts a real in-process Celery worker against the real broker.
    Uses pool="solo" so the worker runs in this same process rather than
    forking a child.
    """
    with start_worker(
        celery_app,
        pool="solo",
        perform_ping_check=False,
        loglevel="error",
    ) as worker:
        yield worker


class TestCeleryRedisIntegration:
    def test_broker_connection_is_reachable(self):
        """
        Fails fast with a clear message if Redis isn't up, instead of a
        confusing timeout further down in the round-trip test.
        """
        try:
            conn = celery_app.connection()
            conn.ensure_connection(max_retries=3, timeout=5)
            conn.close()
        except Exception as exc:
            pytest.fail(
                f"Could not connect to Redis at {REDIS_URL} — "
                f"is it running? (`docker compose up redis -d` locally). "
                f"Original error: {exc}"
            )

    def test_task_round_trip_through_real_broker(self, celery_test_worker):
        """
        The actual plumbing proof: enqueue through the real celery_app,
        real Redis broker carries it to a real worker, worker executes
        it and returns a real result via the Redis result backend.
        """
        async_result = health_check_add.delay(2, 3)
        result = async_result.get(timeout=10)

        assert result == 5
        assert async_result.successful()

    def test_task_is_registered_with_real_app(self):
        """
        Confirms process_document_task itself is actually registered on
        the real celery_app (not just importable) — a cheap sanity check
        that app.celery_app's `include=[...]` / autodiscover config is
        wired correctly, without needing a DB to run the task for real.
        """
        assert "process_document" in celery_app.tasks