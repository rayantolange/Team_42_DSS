import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "documents")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def upload_file_to_storage(file_bytes: bytes, storage_path: str, content_type: str = "application/octet-stream") -> str:
    """
    Uploads file bytes to Supabase Storage at the given path.
    Returns the storage_path (this is what gets saved as file_path in the DB).
    """
    supabase.storage.from_(SUPABASE_BUCKET).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "true"},
    )
    return storage_path


def get_signed_url(storage_path: str, expires_in: int = 3600) -> str:
    """
    Generates a temporary signed URL so the frontend/browser can
    download or preview a private file without exposing the bucket publicly.
    """
    result = supabase.storage.from_(SUPABASE_BUCKET).create_signed_url(
        path=storage_path,
        expires_in=expires_in,
    )
    return result["signedURL"]


def delete_file_from_storage(storage_path: str) -> None:
    """
    Deletes a file from Supabase Storage.
    """
    supabase.storage.from_(SUPABASE_BUCKET).remove([storage_path])