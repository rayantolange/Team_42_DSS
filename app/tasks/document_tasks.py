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
def process_document_task(document_id: int, storage_path: str) -> None:
    """
    Background version of DocumentService._extract_and_embed.
    Runs in a separate Celery worker process, so it opens its own DB
    session rather than reusing a FastAPI request-scoped one.
    storage_path: the Supabase Storage path for the already-uploaded file
    (set by the router before create_document is even called). The worker
    downloads the file itself here rather than having the API pass the
    raw bytes through Redis — keeps every Celery message tiny regardless
    of PDF size, instead of scaling with file size on every upload.
    """
    import fitz
    from app.core.storage import download_file_from_storage
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