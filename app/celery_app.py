import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "dss",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks.document_tasks", "app.tasks.health_check_task", "app.tasks.chat_tasks", "app.tasks.embedding_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Ensures tasks defined in app/tasks/ get registered with this app.
celery_app.autodiscover_tasks(["app.tasks"])