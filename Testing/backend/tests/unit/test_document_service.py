import app.services.embedding_service

"""
Tests for DocumentService's create/status workflow:
- PDF uploads default to 'pending' and enqueue a Celery task
- Non-PDF uploads default to 'completed' with no task enqueued
- No file_bytes provided -> no task enqueued (metadata-only path)
- Duplicate file name on the same decision is rejected
- reprocess_document clears old chunks/pages before re-extracting
- get_document raises for a missing ID
- delete_document removes the record
"""
import pytest
from datetime import date
from app.models.decision import Decision
from app.models.enums import DocumentStatusEnum, DecisionStatusEnum
from app.schemas.documents import DocumentCreate
from app.services.document_service import DocumentService


def make_decision(db_session, department_id, created_by):
    """
    Direct ORM creation (bypassing DecisionService) so these tests
    don't need to also mock embedding/graph-sync side effects that
    are irrelevant to document processing.
    """
    decision = Decision(
        department_id=department_id,
        created_by=created_by,
        title="Test Decision For Documents",
        problem_statement="A problem statement long enough to pass validation.",
        decision_desc="A decision description long enough to pass validation.",
        status=DecisionStatusEnum.draft,
    )
    db_session.add(decision)
    db_session.commit()
    db_session.refresh(decision)
    return decision


@pytest.fixture()
def decision(db_session, faculty_user):
    return make_decision(db_session, faculty_user.department_id, faculty_user.user_id)


def make_document_payload(file_name="report.pdf", **overrides):
    defaults = dict(
        file_name=file_name,
        file_path=f"/uploads/{file_name}",
        upload_date=date.today(),
    )
    defaults.update(overrides)
    return DocumentCreate(**defaults)


# -------------------------------------------------------
# CREATE — status defaults
# -------------------------------------------------------

def test_create_pdf_document_defaults_to_pending(db_session, decision, faculty_user):
    service = DocumentService(db_session)
    payload = make_document_payload("report.pdf")

    document = service.create_document(
        decision_id=decision.decision_id,
        uploaded_by=faculty_user.user_id,
        data=payload,
        file_bytes=b"%PDF-1.4 fake bytes",
    )

    assert document.status == DocumentStatusEnum.pending
    assert document.document_id is not None


def test_create_non_pdf_document_defaults_to_completed(db_session, decision, faculty_user):
    service = DocumentService(db_session)
    payload = make_document_payload("policy.docx")

    document = service.create_document(
        decision_id=decision.decision_id,
        uploaded_by=faculty_user.user_id,
        data=payload,
        file_bytes=b"irrelevant bytes for a non-pdf",
    )

    assert document.status == DocumentStatusEnum.completed


# -------------------------------------------------------
# CREATE — Celery task enqueueing
# -------------------------------------------------------

def test_create_pdf_document_enqueues_processing_task(db_session, decision, faculty_user, mocker):
    mock_task = mocker.patch("app.tasks.document_tasks.process_document_task")
    service = DocumentService(db_session)
    payload = make_document_payload("budget.pdf")

    document = service.create_document(
        decision_id=decision.decision_id,
        uploaded_by=faculty_user.user_id,
        data=payload,
        file_bytes=b"%PDF-1.4 fake bytes",
    )

    mock_task.delay.assert_called_once()
    call_args = mock_task.delay.call_args[0]
    assert call_args[0] == document.document_id
    # second arg is the base64-encoded bytes — just confirm it's a non-empty string
    assert isinstance(call_args[1], str) and len(call_args[1]) > 0


def test_create_non_pdf_document_does_not_enqueue_task(db_session, decision, faculty_user, mocker):
    mock_task = mocker.patch("app.tasks.document_tasks.process_document_task")
    service = DocumentService(db_session)
    payload = make_document_payload("notes.xlsx")

    service.create_document(
        decision_id=decision.decision_id,
        uploaded_by=faculty_user.user_id,
        data=payload,
        file_bytes=b"irrelevant bytes",
    )

    mock_task.delay.assert_not_called()


def test_create_pdf_document_without_file_bytes_does_not_enqueue_task(
    db_session, decision, faculty_user, mocker
):
    """
    Metadata-only creation path (file_bytes=None) — e.g. a record being
    created without actual file content available yet — must not try
    to enqueue processing on nothing.
    """
    mock_task = mocker.patch("app.tasks.document_tasks.process_document_task")
    service = DocumentService(db_session)
    payload = make_document_payload("no-bytes.pdf")

    document = service.create_document(
        decision_id=decision.decision_id,
        uploaded_by=faculty_user.user_id,
        data=payload,
        file_bytes=None,
    )

    assert document.status == DocumentStatusEnum.pending  # still marked pending...
    mock_task.delay.assert_not_called()  # ...but nothing was enqueued to process it


# -------------------------------------------------------
# CREATE — duplicate filename rejection
# -------------------------------------------------------

def test_create_document_rejects_duplicate_filename_on_same_decision(
    db_session, decision, faculty_user, mocker
):
    mocker.patch("app.tasks.document_tasks.process_document_task")
    service = DocumentService(db_session)
    payload = make_document_payload("duplicate.pdf")

    service.create_document(
        decision_id=decision.decision_id,
        uploaded_by=faculty_user.user_id,
        data=payload,
        file_bytes=b"%PDF-1.4 fake bytes",
    )

    with pytest.raises(ValueError, match="already exists"):
        service.create_document(
            decision_id=decision.decision_id,
            uploaded_by=faculty_user.user_id,
            data=make_document_payload("duplicate.pdf"),
            file_bytes=b"%PDF-1.4 different fake bytes",
        )


def test_same_filename_allowed_on_different_decisions(
    db_session, decision, faculty_user, mocker
):
    """
    Duplicate-name protection is scoped per-decision, not global —
    the same file name should be fine attached to two different
    decisions.
    """
    mocker.patch("app.tasks.document_tasks.process_document_task")
    other_decision = make_decision(db_session, faculty_user.department_id, faculty_user.user_id)
    service = DocumentService(db_session)

    doc1 = service.create_document(
        decision_id=decision.decision_id,
        uploaded_by=faculty_user.user_id,
        data=make_document_payload("shared-name.pdf"),
        file_bytes=b"%PDF-1.4 fake bytes",
    )
    doc2 = service.create_document(
        decision_id=other_decision.decision_id,
        uploaded_by=faculty_user.user_id,
        data=make_document_payload("shared-name.pdf"),
        file_bytes=b"%PDF-1.4 fake bytes",
    )

    assert doc1.document_id != doc2.document_id


# -------------------------------------------------------
# REPROCESS
# -------------------------------------------------------

def test_reprocess_document_clears_old_chunks_and_pages_before_re_extracting(
    db_session, decision, faculty_user, mocker
):
    mocker.patch("app.tasks.document_tasks.process_document_task")
    service = DocumentService(db_session)
    document = service.create_document(
        decision_id=decision.decision_id,
        uploaded_by=faculty_user.user_id,
        data=make_document_payload("reprocess-me.pdf"),
        file_bytes=b"%PDF-1.4 fake bytes",
    )

    mock_clear_chunks = mocker.patch(
        "app.services.embedding_service.EmbeddingService.clear_document_chunks"
    )
    mock_delete_pages = mocker.patch.object(service.document_repo, "delete_pages_for_document")
    mock_extract = mocker.patch.object(service, "_extract_and_embed")

    result = service.reprocess_document(document.document_id, file_bytes=b"%PDF-1.4 new bytes")

    mock_clear_chunks.assert_called_once_with(document.document_id)
    mock_delete_pages.assert_called_once_with(document.document_id)
    mock_extract.assert_called_once()
    assert result.document_id == document.document_id


def test_reprocess_document_raises_for_nonexistent_document(db_session):
    service = DocumentService(db_session)

    with pytest.raises(ValueError, match="Document not found"):
        service.reprocess_document(999999, file_bytes=b"whatever")


# -------------------------------------------------------
# READ / DELETE
# -------------------------------------------------------

def test_get_document_raises_for_missing_id(db_session):
    service = DocumentService(db_session)

    with pytest.raises(ValueError, match="Document not found"):
        service.get_document(999999)


def test_delete_document_removes_the_record(db_session, decision, faculty_user, mocker):
    mocker.patch("app.tasks.document_tasks.process_document_task")
    service = DocumentService(db_session)
    document = service.create_document(
        decision_id=decision.decision_id,
        uploaded_by=faculty_user.user_id,
        data=make_document_payload("deleteme.pdf"),
        file_bytes=b"%PDF-1.4 fake bytes",
    )

    service.delete_document(document.document_id)

    with pytest.raises(ValueError, match="Document not found"):
        service.get_document(document.document_id)


def test_list_documents_for_decision_returns_attached_documents(
    db_session, decision, faculty_user, mocker
):
    mocker.patch("app.tasks.document_tasks.process_document_task")
    service = DocumentService(db_session)
    service.create_document(
        decision_id=decision.decision_id,
        uploaded_by=faculty_user.user_id,
        data=make_document_payload("listed-doc.pdf"),
        file_bytes=b"%PDF-1.4 fake bytes",
    )

    documents = service.list_documents_for_decision(decision.decision_id)

    assert len(documents) == 1
    assert documents[0].file_name == "listed-doc.pdf"