# app/services/document_service.py
from typing import List, Optional
import re
import base64
from sqlalchemy.orm import Session
from app.models.document import Document
from app.repositories.document_repository import DocumentRepository
from app.schemas.documents import DocumentCreate
from app.models.enums import DocumentStatusEnum
class DocumentService:
    """
    Handles all business logic for Document operations.
    Responsibilities:
    - Validate business rules
    - Prevent duplicate uploads
    - Coordinate repository operations
    - Keep routers thin
    """
    def __init__(self, db: Session):
        self.document_repo = DocumentRepository(db)
        self.db = db
    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------
    def create_document(
        self,
        decision_id: int,
        uploaded_by: int,
        data: DocumentCreate,
        file_bytes: Optional[bytes] = None,
    ) -> Document:
        """
        Creates a new document record and, for PDFs, enqueues background
        extraction + embedding via Celery instead of blocking the request.
        """
        if self.document_repo.file_exists_on_decision(
            decision_id=decision_id,
            file_name=data.file_name,
        ):
            raise ValueError(
                "A document with this file name already exists for this decision."
            )
        is_pdf = data.file_name.lower().endswith(".pdf")
        document = self.document_repo.create(
            decision_id=decision_id,
            uploaded_by=uploaded_by,
            file_name=data.file_name,
            file_path=data.file_path,
            upload_date=data.upload_date,
            status=DocumentStatusEnum.pending if is_pdf else DocumentStatusEnum.completed,
        )
        if file_bytes is not None and is_pdf:
            from app.tasks.document_tasks import process_document_task
            file_bytes_b64 = base64.b64encode(file_bytes).decode("utf-8")
            process_document_task.delay(document.document_id, file_bytes_b64)
        return document
    # -------------------------------------------------------
    # EXTRACTION + CHUNKING (PDFs only)
    # -------------------------------------------------------
    def _extract_and_embed(self, document: Document, file_bytes: bytes) -> None:
        """
        Parent-child chunking: one DocumentPage per PDF page (full text,
        used for citation context), one Embedding row per paragraph
        within that page (source_type=document_chunk, what's actually
        searched). Non-PDF uploads are stored but not chunked.
        """
        if not document.file_name.lower().endswith(".pdf"):
            return
        import fitz
        from app.services.embedding_service import EmbeddingService
        embedding_service = EmbeddingService(self.db)
        pdf = fitz.open(stream=file_bytes, filetype="pdf")
        try:
            for page_number, pdf_page in enumerate(pdf, start=1):
                page_text = pdf_page.get_text().strip()
                if not page_text:
                    continue
                page = self.document_repo.create_page(
                    document_id=document.document_id,
                    page_number=page_number,
                    page_content=page_text,
                )
                for chunk_index, paragraph in enumerate(self._split_paragraphs(page_text)):
                    embedding_service.embed_document_chunk(
                        page=page,
                        chunk_text=paragraph,
                        chunk_index=chunk_index,
                    )
        finally:
            pdf.close()
    @staticmethod
    def _split_paragraphs(page_text: str) -> List[str]:
        """
        Splits on blank lines; drops fragments under 20 chars
        (usually stray headers/footers/page numbers, not real content).
        """
        raw_parts = re.split(r"\n\s*\n", page_text)
        return [p.strip() for p in raw_parts if len(p.strip()) >= 20]
    # -------------------------------------------------------
    # REPROCESS
    # -------------------------------------------------------
    def reprocess_document(self, document_id: int, file_bytes: bytes) -> Document:
        """
        Re-runs extraction on an already-uploaded PDF without creating
        a duplicate Document row (e.g. corrected file, chunking-logic
        change).
        """
        document = self.get_document(document_id)
        from app.services.embedding_service import EmbeddingService
        embedding_service = EmbeddingService(self.db)
        embedding_service.clear_document_chunks(document_id)
        self.document_repo.delete_pages_for_document(document_id)
        self._extract_and_embed(document, file_bytes)
        return document
    # -------------------------------------------------------
    # READ
    # -------------------------------------------------------
    def get_document(
        self,
        document_id: int,
    ) -> Document:
        """
        Returns a document by its ID.
        """
        document = self.document_repo.get_by_id(document_id)
        if document is None:
            raise ValueError("Document not found.")
        return document
    def list_documents_for_decision(
        self,
        decision_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Document]:
        """
        Returns every document attached to a decision.
        """
        return self.document_repo.get_all_by_decision(
            decision_id=decision_id,
            skip=skip,
            limit=limit,
        )
    def list_all_documents_scoped(
        self,
        current_user,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Document]:
        """
        Returns documents across all decisions the user can see —
        every decision for admins, only their own department's
        decisions for everyone else.
        """
        from app.models.enums import UserRoleEnum
        department_id = (
            None if current_user.role == UserRoleEnum.admin
            else current_user.department_id
        )
        return self.document_repo.get_all_scoped(
            department_id=department_id,
            skip=skip,
            limit=limit,
        )
    def list_documents_uploaded_by(
        self,
        uploaded_by: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Document]:
        """
        Returns every document uploaded by a user.
        """
        return self.document_repo.get_all_by_uploader(
            uploaded_by=uploaded_by,
            skip=skip,
            limit=limit,
        )
    # -------------------------------------------------------
    # DELETE
    # -------------------------------------------------------
    def delete_document(
        self,
        document_id: int,
    ) -> None:
        """
        Deletes a document.
        IMPORTANT:
        The actual file should be removed from storage
        before deleting the database record.
        """
        document = self.get_document(document_id)
        # Future:
        # delete_file(document.file_path)
        self.document_repo.delete_by_id(document)
    def delete_documents_for_decision(
        self,
        decision_id: int,
    ) -> None:
        """
        Deletes every document belonging to a decision.
        Future enhancement:
        Delete every physical file from storage first,
        then remove the database records.
        """
        # Future:
        # documents = self.list_documents_for_decision(decision_id)
        #
        # for document in documents:
        #     delete_file(document.file_path)
        self.document_repo.delete_all_by_decision(
            decision_id
        )
# -------------------------------------------------------
# FastAPI Dependency
# -------------------------------------------------------
def get_document_service(
    db: Session,
) -> DocumentService:
    """
    FastAPI dependency.
    Example:
        service: DocumentService = Depends(get_document_service)
    """
    return DocumentService(db)