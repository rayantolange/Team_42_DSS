# repositories/document_repository.py

from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.document import Document
from app.repositories.base import BaseRepository


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
    # CREATE
    # -------------------------------------------------------

    def create(
        self,
        decision_id: int,
        uploaded_by: int,
        file_name: str,
        file_path: str,
        upload_date=None,
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