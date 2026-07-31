from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.models.enums import DocumentStatusEnum 


ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"}


# -------------------------------------------------------
# CREATE
# -------------------------------------------------------

class DocumentCreate(BaseModel):
    """
    Payload for recording a document upload.

    Note: The actual file is handled by FastAPI's UploadFile separately.
    This schema handles the metadata that gets saved to the DB.
    decision_id and uploaded_by come from path params and
    the authenticated user context — not from the request body.
    """

    file_name: str = Field(
        min_length=1,
        max_length=255,
        description="Original name of the uploaded file including extension."
    )

    file_path: str = Field(
        min_length=1,
        description="Server path or storage URL where the file is saved."
    )

    upload_date: Optional[date] = Field(
        default=None,
        description="Date of upload. Defaults to current date if not provided."
    )

    @field_validator("file_name")
    @classmethod
    def validate_file_extension(cls, value: str) -> str:
        """
        Ensures only allowed file types are accepted.
        """
        dot_index = value.rfind(".")
        if dot_index == -1:
            raise ValueError("File must have an extension.")

        extension = value[dot_index:].lower()

        if extension not in ALLOWED_EXTENSIONS:
            raise ValueError(
                f"File type '{extension}' is not allowed. "
                f"Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        return value


# -------------------------------------------------------
# RESPONSE
# -------------------------------------------------------

class DocumentResponse(BaseModel):
    """
    Shape of document data returned by the API.
    Includes all DB-generated fields.
    """

    model_config = ConfigDict(from_attributes=True)

    document_id: int = Field(
        description="Primary key of the document."
    )

    decision_id: int = Field(
        description="Decision this document is attached to."
    )

    uploaded_by: int = Field(
        description="User ID of the person who uploaded this document."
    )

    file_name: str = Field(
        description="Original name of the uploaded file."
    )

    file_path: str = Field(
        description="Server path or storage URL of the file."
    )

    upload_date: Optional[date] = Field(
        default=None,
        description="Date the file was uploaded."
    )

    created_at: datetime = Field(
        description="Timestamp when this record was created in the DB."
    )
    status: DocumentStatusEnum = Field(                        
        description="Processing status: pending, processing, completed, or failed."
    )
    status_message: Optional[str] = Field(                     
        default=None,
        description="Error detail if status is failed."
    )


# -------------------------------------------------------
# SUMMARY (for list endpoints)
# -------------------------------------------------------

class DocumentSummary(BaseModel):
    """
    Lightweight shape for listing documents under a decision.
    Excludes file_path for security — clients should request
    a specific document to get the path.
    """

    model_config = ConfigDict(from_attributes=True)

    document_id: int
    decision_id: int
    file_name: str
    uploaded_by: int
    upload_date: Optional[date] = None
    created_at: datetime
    status: DocumentStatusEnum                                 
    status_message: Optional[str] = None 

