# Testing/backend/tests/unit/test_document_tasks.py
"""
Unit tests for process_document_task — the Celery background task that
extracts text from a PDF, splits it into paragraphs, and embeds each
page's chunks.

Everything that touches a real resource is mocked:
  - SessionLocal      -> fake DB session (no real Postgres connection)
  - DocumentRepository -> fake repo, no real queries
  - EmbeddingService   -> fake service, no real embedding model calls
  - fitz (PyMuPDF)     -> fake PDF object, no real file parsing

This lets the test suite verify task LOGIC (status transitions, which
pages get created, which paragraphs survive filtering, error handling)
without needing Postgres, Redis, or the embedding model — pure unit
level, runs in milliseconds, no Docker required.
"""
import base64
from unittest.mock import MagicMock, patch

import pytest

from app.models.enums import DocumentStatusEnum
from app.tasks.document_tasks import _split_paragraphs, process_document_task


# ---------------------------------------------------------------------
# _split_paragraphs — pure function, no mocking needed
# ---------------------------------------------------------------------

class TestSplitParagraphs:
    def test_splits_on_blank_lines(self):
        text = "First paragraph is long enough.\n\nSecond paragraph also long enough."
        result = _split_paragraphs(text)
        assert result == [
            "First paragraph is long enough.",
            "Second paragraph also long enough.",
        ]

    def test_drops_fragments_under_20_chars(self):
        # "Page 3" and "Header" are typical stray headers/footers/page
        # numbers this filter is meant to catch.
        text = "Page 3\n\nHeader\n\nThis paragraph is long enough to survive filtering."
        result = _split_paragraphs(text)
        assert result == ["This paragraph is long enough to survive filtering."]

    def test_empty_text_returns_empty_list(self):
        assert _split_paragraphs("") == []

    def test_only_short_fragments_returns_empty_list(self):
        text = "Hi\n\nOk\n\nNo"
        assert _split_paragraphs(text) == []

    def test_strips_whitespace_from_surviving_paragraphs(self):
        text = "   Padded paragraph with enough length to survive.   \n\n"
        result = _split_paragraphs(text)
        assert result == ["Padded paragraph with enough length to survive."]


# ---------------------------------------------------------------------
# process_document_task — the full task, everything mocked
# ---------------------------------------------------------------------

@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def mock_document():
    doc = MagicMock()
    doc.document_id = 1
    doc.file_name = "policy.pdf"
    doc.status = DocumentStatusEnum.pending
    return doc


def make_pdf_bytes_b64() -> str:
    # Task only cares about the base64 string it receives — fitz.open
    # is mocked, so the actual bytes content never gets parsed for real.
    return base64.b64encode(b"fake-pdf-bytes").decode()


class TestProcessDocumentTask:
    @patch("app.tasks.document_tasks.fitz")
    @patch("app.tasks.document_tasks.EmbeddingService")
    @patch("app.tasks.document_tasks.DocumentRepository")
    @patch("app.tasks.document_tasks.SessionLocal")
    def test_document_not_found_returns_early(
        self, mock_session_local, mock_repo_cls, mock_embed_cls, mock_fitz, mock_db
    ):
        mock_session_local.return_value = mock_db
        mock_repo = mock_repo_cls.return_value
        mock_repo.get_by_id.return_value = None

        process_document_task(document_id=999, file_bytes_b64=make_pdf_bytes_b64())

        mock_repo.get_by_id.assert_called_once_with(999)
        # Nothing else should happen — no status set, no PDF opened
        mock_fitz.open.assert_not_called()
        mock_db.close.assert_called_once()

    @patch("app.tasks.document_tasks.fitz")
    @patch("app.tasks.document_tasks.EmbeddingService")
    @patch("app.tasks.document_tasks.DocumentRepository")
    @patch("app.tasks.document_tasks.SessionLocal")
    def test_non_pdf_file_marks_completed_without_processing(
        self, mock_session_local, mock_repo_cls, mock_embed_cls, mock_fitz,
        mock_db, mock_document,
    ):
        mock_session_local.return_value = mock_db
        mock_document.file_name = "notes.docx"
        mock_repo = mock_repo_cls.return_value
        mock_repo.get_by_id.return_value = mock_document

        process_document_task(document_id=1, file_bytes_b64=make_pdf_bytes_b64())

        assert mock_document.status == DocumentStatusEnum.completed
        mock_fitz.open.assert_not_called()
        mock_repo.create_page.assert_not_called()

    @patch("app.tasks.document_tasks.fitz")
    @patch("app.tasks.document_tasks.EmbeddingService")
    @patch("app.tasks.document_tasks.DocumentRepository")
    @patch("app.tasks.document_tasks.SessionLocal")
    def test_successful_processing_creates_pages_and_embeds_chunks(
        self, mock_session_local, mock_repo_cls, mock_embed_cls, mock_fitz,
        mock_db, mock_document,
    ):
        mock_session_local.return_value = mock_db
        mock_repo = mock_repo_cls.return_value
        mock_repo.get_by_id.return_value = mock_document
        mock_embed_service = mock_embed_cls.return_value

        # Two fake pages: one with real paragraph text, one blank.
        page_1 = MagicMock()
        page_1.get_text.return_value = (
            "This is the first paragraph, long enough to survive.\n\n"
            "This is the second paragraph, also long enough to survive."
        )
        page_2 = MagicMock()
        page_2.get_text.return_value = ""  # blank page — should be skipped entirely

        mock_pdf = MagicMock()
        mock_pdf.__iter__.return_value = iter([page_1, page_2])
        mock_fitz.open.return_value = mock_pdf

        mock_page_row = MagicMock()
        mock_repo.create_page.return_value = mock_page_row

        process_document_task(document_id=1, file_bytes_b64=make_pdf_bytes_b64())

        # Page 1 created (page_number=1); page 2 skipped (blank text)
        mock_repo.create_page.assert_called_once_with(
            document_id=1,
            page_number=1,
            page_content=(
                "This is the first paragraph, long enough to survive.\n\n"
                "This is the second paragraph, also long enough to survive."
            ),
        )

        # Embedding called once for page 1's two paragraphs, batched
        mock_embed_service.embed_document_chunks_batch.assert_called_once_with(
            page=mock_page_row,
            chunk_texts=[
                "This is the first paragraph, long enough to survive.",
                "This is the second paragraph, also long enough to survive.",
            ],
        )

        assert mock_document.status == DocumentStatusEnum.completed
        mock_pdf.close.assert_called_once()
        mock_db.close.assert_called_once()

    @patch("app.tasks.document_tasks.fitz")
    @patch("app.tasks.document_tasks.EmbeddingService")
    @patch("app.tasks.document_tasks.DocumentRepository")
    @patch("app.tasks.document_tasks.SessionLocal")
    def test_page_with_no_surviving_paragraphs_skips_embedding(
        self, mock_session_local, mock_repo_cls, mock_embed_cls, mock_fitz,
        mock_db, mock_document,
    ):
        mock_session_local.return_value = mock_db
        mock_repo = mock_repo_cls.return_value
        mock_repo.get_by_id.return_value = mock_document
        mock_embed_service = mock_embed_cls.return_value

        # Page has text, but every fragment is under the 20-char filter
        page = MagicMock()
        page.get_text.return_value = "Pg 1\n\nHdr"
        mock_pdf = MagicMock()
        mock_pdf.__iter__.return_value = iter([page])
        mock_fitz.open.return_value = mock_pdf
        mock_repo.create_page.return_value = MagicMock()

        process_document_task(document_id=1, file_bytes_b64=make_pdf_bytes_b64())

        # Page row still created (there was text)...
        mock_repo.create_page.assert_called_once()
        # ...but embedding never called, since no paragraphs survived filtering
        mock_embed_service.embed_document_chunks_batch.assert_not_called()
        assert mock_document.status == DocumentStatusEnum.completed

    @patch("app.tasks.document_tasks.fitz")
    @patch("app.tasks.document_tasks.EmbeddingService")
    @patch("app.tasks.document_tasks.DocumentRepository")
    @patch("app.tasks.document_tasks.SessionLocal")
    def test_exception_marks_failed_with_truncated_message(
        self, mock_session_local, mock_repo_cls, mock_embed_cls, mock_fitz,
        mock_db, mock_document,
    ):
        mock_session_local.return_value = mock_db
        mock_repo = mock_repo_cls.return_value
        mock_repo.get_by_id.return_value = mock_document

        long_error = "x" * 600  # deliberately over the 500-char truncation limit
        mock_fitz.open.side_effect = RuntimeError(long_error)

        with pytest.raises(RuntimeError):
            process_document_task(document_id=1, file_bytes_b64=make_pdf_bytes_b64())

        assert mock_document.status == DocumentStatusEnum.failed
        assert mock_document.status_message == long_error[:500]
        assert len(mock_document.status_message) == 500
        mock_db.rollback.assert_called_once()
        mock_db.close.assert_called_once()

    @patch("app.tasks.document_tasks.fitz")
    @patch("app.tasks.document_tasks.EmbeddingService")
    @patch("app.tasks.document_tasks.DocumentRepository")
    @patch("app.tasks.document_tasks.SessionLocal")
    def test_exception_when_document_deleted_mid_processing_does_not_crash(
        self, mock_session_local, mock_repo_cls, mock_embed_cls, mock_fitz,
        mock_db, mock_document,
    ):
        """
        If the document gets deleted between the initial get_by_id and the
        exception handler's re-fetch, get_by_id returns None the second
        time. The handler must not blow up trying to set .status on None.
        """
        mock_session_local.return_value = mock_db
        mock_repo = mock_repo_cls.return_value
        # First call (before processing) finds it; second call (in the
        # except block) simulates it having been deleted meanwhile.
        mock_repo.get_by_id.side_effect = [mock_document, None]
        mock_fitz.open.side_effect = RuntimeError("boom")

        with pytest.raises(RuntimeError):
            process_document_task(document_id=1, file_bytes_b64=make_pdf_bytes_b64())

        assert mock_repo.get_by_id.call_count == 2
        mock_db.rollback.assert_called_once()
        mock_db.close.assert_called_once()

    @patch("app.tasks.document_tasks.fitz")
    @patch("app.tasks.document_tasks.EmbeddingService")
    @patch("app.tasks.document_tasks.DocumentRepository")
    @patch("app.tasks.document_tasks.SessionLocal")
    def test_status_set_to_processing_before_extraction_begins(
        self, mock_session_local, mock_repo_cls, mock_embed_cls, mock_fitz,
        mock_db, mock_document,
    ):
        """
        Confirms the processing -> completed transition actually happens
        in order, not just that the final state is completed. We check
        this by inspecting status at the moment fitz.open is called.
        """
        mock_session_local.return_value = mock_db
        mock_repo = mock_repo_cls.return_value
        mock_repo.get_by_id.return_value = mock_document

        status_when_pdf_opened = {}

        def capture_status(*args, **kwargs):
            status_when_pdf_opened["value"] = mock_document.status
            mock_pdf = MagicMock()
            mock_pdf.__iter__.return_value = iter([])
            return mock_pdf

        mock_fitz.open.side_effect = capture_status

        process_document_task(document_id=1, file_bytes_b64=make_pdf_bytes_b64())

        assert status_when_pdf_opened["value"] == DocumentStatusEnum.processing
        assert mock_document.status == DocumentStatusEnum.completed