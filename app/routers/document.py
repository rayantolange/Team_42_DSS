# app/routers/document.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.core.access import check_decision_access
from app.core.storage import upload_file_to_storage, get_signed_url
from app.models.user import User
from app.schemas.documents import DocumentCreate, DocumentResponse, DocumentSummary
from app.services.document_service import DocumentService
from app.services.decision_service import DecisionService

router = APIRouter(tags=["Documents"])

# -------------------------------------------------------
# UPLOAD (nested under a decision)
# -------------------------------------------------------
@router.post(
    "/decisions/{decision_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED
)
async def upload_document(
    decision_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads a file and attaches it to a decision.
    Saves the physical file to Supabase Storage, then records its metadata.
    """
    decision_service = DecisionService(db)
    document_service = DocumentService(db)
    try:
        decision = decision_service.get_decision(decision_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    check_decision_access(decision, current_user)

    contents = await file.read()
    storage_path = f"{decision_id}/{file.filename}"
    file_path = upload_file_to_storage(
        file_bytes=contents,
        storage_path=storage_path,
        content_type=file.content_type or "application/octet-stream",
    )

    doc_data = DocumentCreate(
        file_name=file.filename,
        file_path=file_path,
    )
    try:
        return document_service.create_document(
            decision_id=decision_id,
            uploaded_by=current_user.user_id,
            data=doc_data,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# -------------------------------------------------------
# LIST (nested under a decision)
# -------------------------------------------------------
@router.get(
    "/decisions/{decision_id}/documents",
    response_model=List[DocumentSummary],
    status_code=status.HTTP_200_OK
)
def list_documents_for_decision(
    decision_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists all documents attached to a decision.
    file_path is intentionally excluded — see DocumentSummary.
    """
    decision_service = DecisionService(db)
    document_service = DocumentService(db)
    try:
        decision = decision_service.get_decision(decision_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    check_decision_access(decision, current_user)
    return document_service.list_documents_for_decision(
        decision_id=decision_id,
        skip=skip,
        limit=limit,
    )

# -------------------------------------------------------
# GET BY ID
# -------------------------------------------------------
@router.get(
    "/documents/{document_id}",
    response_model=DocumentResponse,
    status_code=status.HTTP_200_OK
)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns full detail of a single document, including file_path.
    """
    document_service = DocumentService(db)
    decision_service = DecisionService(db)
    try:
        document = document_service.get_document(document_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    decision = decision_service.get_decision(document.decision_id)
    check_decision_access(decision, current_user)
    return document

# -------------------------------------------------------
# DOWNLOAD URL
# -------------------------------------------------------
@router.get(
    "/documents/{document_id}/download-url",
    status_code=status.HTTP_200_OK
)
def get_document_download_url(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a temporary signed URL the frontend can use to download/preview the file.
    """
    document_service = DocumentService(db)
    decision_service = DecisionService(db)
    try:
        document = document_service.get_document(document_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    decision = decision_service.get_decision(document.decision_id)
    check_decision_access(decision, current_user)
    url = get_signed_url(document.file_path)
    return {"url": url}

# -------------------------------------------------------
# DELETE
# -------------------------------------------------------
@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a document record (and, once storage deletion is
    implemented in the service, the physical file too).
    """
    document_service = DocumentService(db)
    decision_service = DecisionService(db)
    try:
        document = document_service.get_document(document_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    decision = decision_service.get_decision(document.decision_id)
    check_decision_access(decision, current_user)
    document_service.delete_document(document_id)
    return None