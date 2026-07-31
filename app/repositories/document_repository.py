# repositories/document_repository.py

from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.document import Document
from app.repositories.base import BaseRepository
from app.models.document_page import DocumentPage
from app.models.enums import DocumentStatusEnum 

class DocumentRepository(BaseRepository[Document]):
    """
    Handles all database operations for the Document model.
    Documents are always scoped to a decision and an uploader.
    """

    def __init__(self, db: Session):
        super().__init__(Document, db)

    # -------------------------------------------------------
    # READ
    # -------------------------------------------------------

    def get_by_id(self, document_id: int) -> Optional[Document]:
        return (
            self.db.query(Document)
            .filter(Document.document_id == document_id)
            .first()
        )

    def get_all_by_decision(
        self,
        decision_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Document]:
        """
        Fetch all documents attached to a specific decision.
        Primary query for GET /decisions/{id}/documents.
        """
        return (
            self.db.query(Document)
            .filter(Document.decision_id == decision_id)
            .order_by(Document.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_all_scoped(
        self,
        department_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Document]:
        """
        Fetch documents across all decisions, optionally scoped to
        a single department. Pass department_id=None for admins to
        see everything; pass a department_id for everyone else.
        Primary query for GET /documents (vault view).
        """
        from app.models.decision import Decision

        query = self.db.query(Document).join(
            Decision, Document.decision_id == Decision.decision_id
        )
        if department_id is not None:
            query = query.filter(Decision.department_id == department_id)
        return (
            query.order_by(Document.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_all_by_uploader(
        self,
        uploaded_by: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Document]:
        """
        Fetch all documents uploaded by a specific user.
        Useful for audit trails and user activity views.
        """
        return (
            self.db.query(Document)
            .filter(Document.uploaded_by == uploaded_by)
            .order_by(Document.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def file_exists_on_decision(
        self,
        decision_id: int,
        file_name: str
    ) -> bool:
        """
        Checks if a file with the same name already exists
        on this decision. Prevents duplicate uploads.
        """
        from sqlalchemy import exists

        return self.db.query(
            exists().where(
                Document.decision_id == decision_id,
                Document.file_name == file_name
            )
        ).scalar()

    # -------------------------------------------------------
    # DASHBOARD AGGREGATES
    # -------------------------------------------------------
    def count_all(self) -> int:
        return self.db.query(Document).count()

    def count_by_department(self, department_id: int) -> int:
        from app.models.decision import Decision

        return (
            self.db.query(Document)
            .join(Decision, Document.decision_id == Decision.decision_id)
            .filter(Decision.department_id == department_id)
            .count()
        )

    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------

    def create(
        self,
        decision_id: int,
        uploaded_by: int,
        file_name: str,
        file_path: str,
        upload_date=None,
        status: DocumentStatusEnum = DocumentStatusEnum.pending,  # NEW
    ) -> Document:
        """
        Creates and persists a new document record.
        The actual file must already be saved to storage
        before calling this — file_path is the result of that.
        decision_id and uploaded_by are injected by the service.
        """
        new_document = Document(
            decision_id=decision_id,
            uploaded_by=uploaded_by,
            file_name=file_name,
            file_path=file_path,
            upload_date=upload_date,
            status=status,  # NEW
        )
        return self.save(new_document)

    # -------------------------------------------------------
    # DELETE
    # -------------------------------------------------------

    def delete_by_id(self, document: Document) -> None:
        """
        Deletes a document record from the DB.
        The actual file deletion from storage must be handled
        separately in the service layer before calling this.
        """
        self.delete(document)

    def delete_all_by_decision(self, decision_id: int) -> None:
        """
        Bulk deletes all document records for a decision.
        Normally handled by ON DELETE CASCADE at the DB level,
        but useful when you need to delete files from storage
        first before removing the DB records.
        """
        self.db.query(Document).filter(
            Document.decision_id == decision_id
        ).delete()
        self.db.commit()
    # -------------------------------------------------------
    # DOCUMENT PAGE (parent-child chunking)
    # -------------------------------------------------------

    def create_page(
        self,
        document_id: int,
        page_number: int,
        page_content: str,
    ) -> DocumentPage:
        page = DocumentPage(
            document_id=document_id,
            page_number=page_number,
            page_content=page_content,
        )
        self.db.add(page)
        self.db.commit()
        self.db.refresh(page)
        return page

    def get_pages_for_document(self, document_id: int) -> List[DocumentPage]:
        return (
            self.db.query(DocumentPage)
            .filter(DocumentPage.document_id == document_id)
            .order_by(DocumentPage.page_number.asc())
            .all()
        )
    def get_page_by_id(self, page_id: int) -> Optional[DocumentPage]:
        return (
            self.db.query(DocumentPage)
            .filter(DocumentPage.page_id == page_id)
            .first()
        )

    def delete_pages_for_document(self, document_id: int) -> None:
        """
        Bulk-deletes pages ahead of reprocessing a document.
        ondelete="CASCADE" on Embedding.page_id cleans up their
        chunk embeddings automatically.
        """
        (
            self.db.query(DocumentPage)
            .filter(DocumentPage.document_id == document_id)
            .delete(synchronize_session=False)
        )
        self.db.commit()