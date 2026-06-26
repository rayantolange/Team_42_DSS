# app/services/document_service.py

from typing import List

from sqlalchemy.orm import Session

from app.models.document import Document
from app.repositories.document_repository import DocumentRepository
from app.schemas.documents import DocumentCreate


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

    # -------------------------------------------------------
    # CREATE
    # -------------------------------------------------------

    def create_document(
        self,
        decision_id: int,
        uploaded_by: int,
        data: DocumentCreate,
    ) -> Document:
        """
        Creates a new document record.

        Business Rules:
        - A decision cannot contain two files with the same name.
        - The physical file should already exist before calling this.
        """

        if self.document_repo.file_exists_on_decision(
            decision_id=decision_id,
            file_name=data.file_name,
        ):
            raise ValueError(
                "A document with this file name already exists for this decision."
            )

        return self.document_repo.create(
            decision_id=decision_id,
            uploaded_by=uploaded_by,
            file_name=data.file_name,
            file_path=data.file_path,
            upload_date=data.upload_date,
        )

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
