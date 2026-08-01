import base64
import re
from typing import List


from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.document import Document
from app.models.enums import DocumentStatusEnum
from app.repositories.document_repository import DocumentRepository


def _split_paragraphs(page_text: str) -> List[str]:
    """Same splitting rule as the old synchronous path — dropped fragments
    under 20 chars are usually stray headers/footers/page numbers."""
    raw_parts = re.split(r"\n\s*\n", page_text)
    return [p.strip() for p in raw_parts if len(p.strip()) >= 20]


@celery_app.task(name="process_document")
def process_document_task(document_id: int, file_bytes_b64: str) -> None:
    """
    Background version of DocumentService._extract_and_embed.
    Runs in a separate Celery worker process, so it opens its own DB
    session rather than reusing a FastAPI request-scoped one.

    file_bytes_b64: the raw PDF bytes, base64-encoded so they can pass
    safely through Redis as a JSON message. Fine for typical document
    sizes in this project; if very large files become common, switch
    this to re-downloading from storage inside the task instead of
    passing bytes through the broker.
    """
    import fitz
    from app.services.embedding_service import EmbeddingService

    db = SessionLocal()
    try:
        document_repo = DocumentRepository(db)
        embedding_service = EmbeddingService(db)

        document = document_repo.get_by_id(document_id)
        if document is None:
            return  # deleted before the worker got to it — nothing to do

        document.status = DocumentStatusEnum.processing
        db.commit()

        if not document.file_name.lower().endswith(".pdf"):
            document.status = DocumentStatusEnum.completed
            db.commit()
            return

        file_bytes = base64.b64decode(file_bytes_b64)
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
                    embedding_service.embed_document_chunks_batch(page=page, chunk_texts=paragraphs)
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
        raise  # still surfaces in Celery's own logs/Sentry
    finally:
        db.close()