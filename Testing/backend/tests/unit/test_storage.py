"""
Unit tests for app/core/storage.py. The Supabase client is mocked
entirely — no network access — since it's created at import time
from env vars that may not point anywhere real in CI.
"""
from unittest.mock import patch, MagicMock

import app.core.storage as storage_module


def test_upload_file_to_storage_uploads_with_correct_args():
    with patch.object(storage_module, "supabase") as mock_supabase:
        bucket = MagicMock()
        mock_supabase.storage.from_.return_value = bucket

        result = storage_module.upload_file_to_storage(
            file_bytes=b"hello world",
            storage_path="dept/1/doc.pdf",
            content_type="application/pdf",
        )

        mock_supabase.storage.from_.assert_called_once_with(storage_module.SUPABASE_BUCKET)
        bucket.upload.assert_called_once_with(
            path="dept/1/doc.pdf",
            file=b"hello world",
            file_options={"content-type": "application/pdf", "upsert": "true"},
        )
        assert result == "dept/1/doc.pdf"


def test_upload_file_to_storage_defaults_content_type():
    with patch.object(storage_module, "supabase") as mock_supabase:
        bucket = MagicMock()
        mock_supabase.storage.from_.return_value = bucket

        storage_module.upload_file_to_storage(
            file_bytes=b"data",
            storage_path="dept/1/doc.bin",
        )

        _, kwargs = bucket.upload.call_args
        assert kwargs["file_options"]["content-type"] == "application/octet-stream"


def test_get_signed_url_returns_signed_url():
    with patch.object(storage_module, "supabase") as mock_supabase:
        bucket = MagicMock()
        mock_supabase.storage.from_.return_value = bucket
        bucket.create_signed_url.return_value = {
            "signedURL": "https://example.com/signed/doc.pdf"
        }

        url = storage_module.get_signed_url("dept/1/doc.pdf", expires_in=120)

        bucket.create_signed_url.assert_called_once_with(
            path="dept/1/doc.pdf",
            expires_in=120,
        )
        assert url == "https://example.com/signed/doc.pdf"


def test_get_signed_url_default_expiry():
    with patch.object(storage_module, "supabase") as mock_supabase:
        bucket = MagicMock()
        mock_supabase.storage.from_.return_value = bucket
        bucket.create_signed_url.return_value = {"signedURL": "https://x"}

        storage_module.get_signed_url("dept/1/doc.pdf")

        _, kwargs = bucket.create_signed_url.call_args
        assert kwargs["expires_in"] == 3600


def test_get_signed_url_missing_key_raises():
    """
    Documents current behavior: if Supabase's response shape ever
    lacks "signedURL", get_signed_url raises KeyError rather than
    failing gracefully or logging something actionable.
    """
    with patch.object(storage_module, "supabase") as mock_supabase:
        bucket = MagicMock()
        mock_supabase.storage.from_.return_value = bucket
        bucket.create_signed_url.return_value = {}

        try:
            storage_module.get_signed_url("dept/1/doc.pdf")
            assert False, "expected KeyError"
        except KeyError:
            pass


def test_delete_file_from_storage_removes_by_path():
    with patch.object(storage_module, "supabase") as mock_supabase:
        bucket = MagicMock()
        mock_supabase.storage.from_.return_value = bucket

        storage_module.delete_file_from_storage("dept/1/doc.pdf")

        bucket.remove.assert_called_once_with(["dept/1/doc.pdf"])