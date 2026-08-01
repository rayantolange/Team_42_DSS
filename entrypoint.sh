#!/bin/sh
# Runs inside the single Render container: starts the Celery worker as a
# background process, then execs uvicorn as PID 1 in the foreground.
#
# Why exec: without it, uvicorn would run as a child shell process, and
# SIGTERM from Render (on deploy/restart) wouldn't reach uvicorn directly,
# leading to slow/unclean shutdowns. `exec` replaces the shell process with
# uvicorn, so it receives signals directly.
#
# Why background the worker with `&`: Render only healthchecks/routes to
# the foreground process's port. The worker has no port to bind, so it
# must not be the foreground process, or $PORT never comes up healthy.
set -e

echo "Starting Celery worker in background..."
celery -A app.celery_app.celery_app worker --loglevel=info &
WORKER_PID=$!

# If the worker dies immediately (bad broker URL, import error in a task
# module, etc.), fail loudly now instead of limping along with a dead
# worker while uvicorn looks healthy.
sleep 2
if ! kill -0 "$WORKER_PID" 2>/dev/null; then
    echo "Celery worker failed to start — aborting." >&2
    exit 1
fi

echo "Starting uvicorn on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"