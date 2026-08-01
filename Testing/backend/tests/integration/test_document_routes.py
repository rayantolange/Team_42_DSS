"""
Integration tests for document routes.

Covers:
- upload document
- duplicate upload rejection
- list documents under decision
- list all scoped documents
- get document
- download URL generation
- delete document
- access control between departments

External services mocked:
- Supabase storage upload
- Supabase signed URL generation
- Celery document processing
"""

import pytest

from app.main import app
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.decision import Decision
from app.models.enums import (
    UserRoleEnum,
    DecisionStatusEnum,
)


# -------------------------------------------------------
# Helpers
# -------------------------------------------------------

def create_decision(db_session, user: User):
    decision = Decision(
        department_id=user.department_id,
        created_by=user.user_id,
        title="Test Decision",
        problem_statement="A problem statement long enough for validation.",
        decision_desc="A decision description long enough for validation.",
        status=DecisionStatusEnum.draft,
    )

    db_session.add(decision)
    db_session.commit()
    db_session.refresh(decision)

    return decision


@pytest.fixture()
def authenticated_client(client, faculty_user):
    """
    Overrides JWT authentication with a known faculty user.
    """

    app.dependency_overrides[get_current_user] = (
        lambda: faculty_user
    )

    yield client

    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def mock_external_services(mocker):
    """
    Prevent real storage uploads and Celery execution.
    """

    mocker.patch(
        "app.routers.document.upload_file_to_storage",
        return_value="1/test.pdf",
    )

    mocker.patch(
        "app.routers.document.get_signed_url",
        return_value="https://signed-url.test/file.pdf",
    )

    mocker.patch(
        "app.tasks.document_tasks.process_document_task.delay"
    )


# -------------------------------------------------------
# UPLOAD
# -------------------------------------------------------

def test_upload_document_success(
    authenticated_client,
    db_session,
    faculty_user,
):
    decision = create_decision(
        db_session,
        faculty_user,
    )

    response = authenticated_client.post(
        f"/decisions/{decision.decision_id}/documents",
        files={
            "file": (
                "test.pdf",
                b"%PDF fake content",
                "application/pdf",
            )
        },
    )

    assert response.status_code == 201

    body = response.json()

    assert body["file_name"] == "test.pdf"
    assert body["decision_id"] == decision.decision_id
    assert body["uploaded_by"] == faculty_user.user_id


def test_upload_document_rejects_duplicate(
    authenticated_client,
    db_session,
    faculty_user,
):
    decision = create_decision(
        db_session,
        faculty_user,
    )

    files = {
        "file": (
            "duplicate.pdf",
            b"%PDF fake content",
            "application/pdf",
        )
    }

    first = authenticated_client.post(
        f"/decisions/{decision.decision_id}/documents",
        files=files,
    )

    assert first.status_code == 201

    second = authenticated_client.post(
        f"/decisions/{decision.decision_id}/documents",
        files=files,
    )

    assert second.status_code == 400


# -------------------------------------------------------
# LIST
# -------------------------------------------------------

def test_list_documents_for_decision(
    authenticated_client,
    db_session,
    faculty_user,
):
    decision = create_decision(
        db_session,
        faculty_user,
    )

    authenticated_client.post(
        f"/decisions/{decision.decision_id}/documents",
        files={
            "file": (
                "policy.docx",
                b"document",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )

    response = authenticated_client.get(
        f"/decisions/{decision.decision_id}/documents"
    )

    assert response.status_code == 200

    body = response.json()

    assert len(body) == 1
    assert body[0]["file_name"] == "policy.docx"


def test_list_all_documents(
    authenticated_client,
    db_session,
    faculty_user,
):
    decision = create_decision(
        db_session,
        faculty_user,
    )

    authenticated_client.post(
        f"/decisions/{decision.decision_id}/documents",
        files={
            "file": (
                "document.pdf",
                b"%PDF",
                "application/pdf",
            )
        },
    )

    response = authenticated_client.get(
        "/documents"
    )

    assert response.status_code == 200

    assert len(response.json()) == 1


# -------------------------------------------------------
# GET
# -------------------------------------------------------

def test_get_document_success(
    authenticated_client,
    db_session,
    faculty_user,
):
    decision = create_decision(
        db_session,
        faculty_user,
    )

    upload = authenticated_client.post(
        f"/decisions/{decision.decision_id}/documents",
        files={
            "file": (
                "report.pdf",
                b"%PDF",
                "application/pdf",
            )
        },
    )

    document_id = upload.json()["document_id"]

    response = authenticated_client.get(
        f"/documents/{document_id}"
    )

    assert response.status_code == 200

    body = response.json()

    assert body["document_id"] == document_id
    assert body["file_path"] == "1/test.pdf"


def test_get_missing_document_returns_404(
    authenticated_client,
):
    response = authenticated_client.get(
        "/documents/999999"
    )

    assert response.status_code == 404


# -------------------------------------------------------
# DOWNLOAD URL
# -------------------------------------------------------

def test_get_download_url(
    authenticated_client,
    db_session,
    faculty_user,
):
    decision = create_decision(
        db_session,
        faculty_user,
    )

    upload = authenticated_client.post(
        f"/decisions/{decision.decision_id}/documents",
        files={
            "file": (
                "download.pdf",
                b"%PDF",
                "application/pdf",
            )
        },
    )

    document_id = upload.json()["document_id"]

    response = authenticated_client.get(
        f"/documents/{document_id}/download-url"
    )

    assert response.status_code == 200
    assert response.json()["url"] == (
        "https://signed-url.test/file.pdf"
    )


# -------------------------------------------------------
# DELETE
# -------------------------------------------------------

def test_delete_document(
    authenticated_client,
    db_session,
    faculty_user,
):
    decision = create_decision(
        db_session,
        faculty_user,
    )

    upload = authenticated_client.post(
        f"/decisions/{decision.decision_id}/documents",
        files={
            "file": (
                "delete.pdf",
                b"%PDF",
                "application/pdf",
            )
        },
    )

    document_id = upload.json()["document_id"]

    response = authenticated_client.delete(
        f"/documents/{document_id}"
    )

    assert response.status_code == 204

    missing = authenticated_client.get(
        f"/documents/{document_id}"
    )

    assert missing.status_code == 404


# -------------------------------------------------------
# ACCESS CONTROL
# -------------------------------------------------------

def test_user_cannot_access_other_department_document(
    client,
    db_session,
    faculty_user,
    other_dept_faculty_user,
):
    decision = create_decision(
        db_session,
        faculty_user,
    )

    app.dependency_overrides[get_current_user] = (
        lambda: other_dept_faculty_user
    )

    response = client.get(
        f"/decisions/{decision.decision_id}/documents"
    )

    app.dependency_overrides.clear()

    assert response.status_code == 403