"""
Tests for UserService.create_user:
- persists a new user correctly
- rejects duplicate emails
- triggers Neo4j graph sync (mocked)
- stores the password hash as-given (hashing itself is AuthService's
  responsibility, not this service's — so we pass in a pre-hashed
  string and confirm it's stored verbatim, not re-hashed or mutated)
"""
import pytest
from app.models.enums import UserRoleEnum
from app.schemas.user import UserCreate
from app.services.user_service import UserService


@pytest.fixture(autouse=True)
def mock_graph_sync(mocker):
    """create_user always triggers a Neo4j sync — mock it out globally
    for this file since Neo4j connectivity is irrelevant to the
    business rules being tested here."""
    return mocker.patch("app.services.user_service.GraphSyncService.sync_user")


def make_user_payload(department_id, email="newuser@gmail.com", **overrides):
    defaults = dict(
        department_id=department_id,
        full_name="New User",
        email=email,
        role=UserRoleEnum.faculty,
        password="a-valid-password-123",
    )
    defaults.update(overrides)
    return UserCreate(**defaults)


def test_create_user_persists_correctly(db_session, test_department):
    service = UserService(db_session)
    payload = make_user_payload(test_department.department_id, email="persisted@gmail.com")

    user = service.create_user(payload, password_hash="already-hashed-value")

    assert user.user_id is not None
    assert user.email == "persisted@gmail.com"
    assert user.full_name == "New User"
    assert user.department_id == test_department.department_id
    assert user.role == UserRoleEnum.faculty


def test_create_user_stores_password_hash_verbatim(db_session, test_department):
    """
    Hashing is AuthService's job, not UserService's — this confirms
    UserService doesn't double-hash or otherwise alter whatever hash
    it's given.
    """
    service = UserService(db_session)
    payload = make_user_payload(test_department.department_id, email="hashcheck@gmail.com")

    user = service.create_user(payload, password_hash="already-hashed-value")

    assert user.password_hash == "already-hashed-value"


def test_create_user_rejects_duplicate_email(db_session, test_department):
    service = UserService(db_session)
    payload = make_user_payload(test_department.department_id, email="dupe@gmail.com")
    service.create_user(payload, password_hash="hash-one")

    with pytest.raises(ValueError, match="already exists"):
        service.create_user(
            make_user_payload(test_department.department_id, email="dupe@gmail.com"),
            password_hash="hash-two",
        )


def test_create_user_triggers_graph_sync(db_session, test_department, mock_graph_sync):
    service = UserService(db_session)
    payload = make_user_payload(test_department.department_id, email="graphsynced@gmail.com")

    user = service.create_user(payload, password_hash="already-hashed-value")

    mock_graph_sync.assert_called_once_with(user)


def test_create_user_with_different_roles(db_session, test_department):
    service = UserService(db_session)

    staff_user = service.create_user(
        make_user_payload(test_department.department_id, email="staffmember@gmail.com", role=UserRoleEnum.staff),
        password_hash="hash-staff",
    )
    hod_user = service.create_user(
        make_user_payload(test_department.department_id, email="hodmember@gmail.com", role=UserRoleEnum.hod),
        password_hash="hash-hod",
    )

    assert staff_user.role == UserRoleEnum.staff
    assert hod_user.role == UserRoleEnum.hod