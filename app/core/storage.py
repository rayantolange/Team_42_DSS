import os
from supabase import create_client, Client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "documents")
_supabase: Client | None = None
def get_supabase_client() -> Client:
    """
    Lazily creates (and caches) the Supabase client on first use.
    Deferring this until the client is actually needed — instead of at
    import time — means importing this module never requires
    SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY to be set, and never makes
    a network call as a side effect of import. That matters for:
      - unit tests that import routers/services without hitting Supabase
      - any boot path (smoke test, partial config, etc.) that doesn't
        need storage yet
    """
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set "
                "before using storage functions."
            )
        _supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _supabase
def upload_file_to_storage(
    file_bytes: bytes, storage_path: str, content_type: str = "application/octet-stream"
) -> str:
    """
    Uploads file bytes to Supabase Storage at the given path.
    Returns the storage_path (this is what gets saved as file_path in the DB).
    """
    get_supabase_client().storage.from_(SUPABASE_BUCKET).upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "true"},
    )
    return storage_path
def download_file_from_storage(storage_path: str) -> bytes:
    """
    Downloads file bytes from Supabase Storage at the given path.
    Used by process_document_task so the worker can fetch the PDF itself
    instead of having it passed through the Celery broker (Redis) as a
    base64 payload — keeps queue messages small regardless of file size.
    """
    return get_supabase_client().storage.from_(SUPABASE_BUCKET).download(storage_path)
def get_signed_url(storage_path: str, expires_in: int = 3600) -> str:
    """
    Generates a temporary signed URL so the frontend/browser can
    download or preview a private file without exposing the bucket publicly.
    """
    result = get_supabase_client().storage.from_(SUPABASE_BUCKET).create_signed_url(
        path=storage_path,
        expires_in=expires_in,
    )
    return result["signedURL"]
def delete_file_from_storage(storage_path: str) -> None:
    """
    Deletes a file from Supabase Storage.
    """
    get_supabase_client().storage.from_(SUPABASE_BUCKET).remove([storage_path])