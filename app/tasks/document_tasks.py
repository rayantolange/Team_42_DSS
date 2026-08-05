import re
from typing import List

from celery.signals import worker_process_init

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.document import Document
from app.models.enums import DocumentStatusEnum
from app.repositories.document_repository import DocumentRepository

# Global reference held in memory per worker process
_embedding_service = None


@worker_process_init.connect
def warmup_document_worker(**kwargs):
    """Pre-loads EmbeddingService models into worker process RAM on boot."""
    global _embedding_service
    print("🚀 Pre-loading EmbeddingService in document worker process...")

    from app.services.embedding_service import EmbeddingService

    db = SessionLocal()
    try:
        _embedding_service = EmbeddingService(db=db)
    finally:
        db.close()

    print("✅ Document worker models pre-loaded successfully.")


def _get_embedding_service(db):
    """Helper to return warm service or initialize on-the-fly if needed."""
    global _embedding_service
    if _embedding_service is not None:
        return _embedding_service

    from app.services.embedding_service import EmbeddingService

    return EmbeddingService(db=db)


def _split_paragraphs(page_text: str) -> List[str]:
    """Same splitting rule as the old synchronous path — dropped fragments

    under 20 chars are usually stray headers/footers/page numbers.
    """
    raw_parts = re.split(r"\n\s*\n", page_text)
    return [p.strip() for p in raw_parts if len(p.strip()) >= 20]


@celery_app.task(name="process_document")
def process_document_task(document_id: int, storage_path: str) -> None:
    """Background version of DocumentService._extract_and_embed.

    Runs in a separate Celery worker process, so it opens its own DB session
    rather than reusing a FastAPI request-scoped one.
    """
    import fitz

    from app.core.storage import download_file_from_storage

    db = SessionLocal()
    try:
        document_repo = DocumentRepository(db)
        embedding_service = _get_embedding_service(db)

        document = document_repo.get_by_id(document_id)
        if document is None:
            return  # deleted before worker got to it

        document.status = DocumentStatusEnum.processing
        db.commit()

        if not document.file_name.lower().endswith(".pdf"):
            document.status = DocumentStatusEnum.completed
            db.commit()
            return

        file_bytes = download_file_from_storage(storage_path)
        pdf = fitz.open(stream=file_bytes, filetype="pdf")

        try:
            for page_number, pdf_page in enumerate(pdf, start=1):
                page_text = pdf_page.get_text().strip()
                if not page_text:
                    continue

                page = document_repo.create_page(
                    document_id=document.document_id,
                    page_number=page_number,
                    page_content=page_text,
                )

                paragraphs = _split_paragraphs(page_text)
                if paragraphs:
                    embedding_service.embed_document_chunks_batch(
                        page=page, chunk_texts=paragraphs
                    )
        finally:
            pdf.close()

        document.status = DocumentStatusEnum.completed
        db.commit()

    except Exception as e:
        db.rollback()
        document = document_repo.get_by_id(document_id)
        if document:
            document.status = DocumentStatusEnum.failed
            document.status_message = str(e)[:500]
            db.commit()
        raise
    finally:
        db.close()