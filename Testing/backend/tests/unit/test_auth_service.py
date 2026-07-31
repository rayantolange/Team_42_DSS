"""
Tests for AuthService's core security-critical flows:
- register: creates user, hashes password, sends verification email
- login: correct/incorrect credentials, deactivated accounts, no
  user-enumeration leak between "wrong password" and "no such user"
- refresh: valid rotation, reuse-after-rotation is rejected, expired/
  invalid tokens rejected
- logout: revokes the refresh token so it can't be used again
- verify_email: valid token verifies, idempotent on already-verified,
  invalid token rejected
- resend_verification / request_password_reset: silently no-op when
  the account doesn't exist or (for verification) is already verified
- reset_password: valid token changes the password; old password stops
  working, new one works; invalid token rejected
"""
import pytest
from app.core.password import verify_password
from app.core.refresh_tokens import verify_refresh_token
from app.core.email_tokens import (
    create_email_verification_token,
    create_password_reset_token,
)
from app.schemas.auth import LoginRequest
from app.schemas.user import UserCreate
from app.models.enums import UserRoleEnum
from app.services.auth_services import AuthService


@pytest.fixture(autouse=True)
def mock_emails(mocker):
    """Every register/resend/forgot-password call sends a real email —
    mock both send functions globally for this file so tests never hit
    Gmail SMTP or depend on network access."""
    mock_verify = mocker.patch("app.services.auth_services.send_verification_email")
    mock_reset = mocker.patch("app.services.auth_services.send_password_reset_email")
    return {"verify": mock_verify, "reset": mock_reset}


def make_registration_payload(department_id, email="newuser@gmail.com", **overrides):
    defaults = dict(
        department_id=department_id,
        full_name="New User",
        email=email,
        role=UserRoleEnum.faculty,
        password="a-valid-password-123",
    )
    defaults.update(overrides)
    return UserCreate(**defaults)


# -------------------------------------------------------
# REGISTER
# -------------------------------------------------------

def test_register_creates_user_with_hashed_password(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    payload = make_registration_payload(test_department.department_id)

    user = service.register(payload)

    assert user.user_id is not None
    assert user.email == "newuser@gmail.com"
    # The stored hash must never equal the plain password, and must
    # verify correctly against it via the real hashing scheme.
    assert user.password_hash != payload.password
    assert verify_password(payload.password, user.password_hash) is True


def test_register_sends_verification_email(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    payload = make_registration_payload(test_department.department_id)

    service.register(payload)

    mock_emails["verify"].assert_called_once()
    call_args = mock_emails["verify"].call_args[0]
    assert call_args[0] == "newuser@gmail.com"


def test_register_new_user_is_unverified_by_default(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    payload = make_registration_payload(test_department.department_id)

    user = service.register(payload)

    assert user.is_verified is False


def test_register_rejects_duplicate_email(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    payload = make_registration_payload(test_department.department_id, email="dupe@gmail.com")
    service.register(payload)

    with pytest.raises(Exception):
        # Whether this raises ValueError (app-level check) or an
        # IntegrityError (DB-level unique constraint) depends on
        # UserService's implementation — either is an acceptable
        # rejection of a duplicate email, so we assert broadly here.
        service.register(make_registration_payload(test_department.department_id, email="dupe@gmail.com"))


# -------------------------------------------------------
# LOGIN
# -------------------------------------------------------

def test_login_succeeds_with_correct_credentials(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    plain_password = "a-valid-password-123"
    payload = make_registration_payload(
        test_department.department_id, email="logintest@gmail.com", password=plain_password
    )
    service.register(payload)

    result = service.login(LoginRequest(email="logintest@gmail.com", password=plain_password))

    assert "access_token" in result
    assert "refresh_token" in result
    assert result["token_type"] == "bearer"
    assert result["full_name"] == "New User"


def test_login_rejects_wrong_password(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    payload = make_registration_payload(test_department.department_id, email="wrongpw@gmail.com")
    service.register(payload)

    with pytest.raises(ValueError, match="Invalid email or password"):
        service.login(LoginRequest(email="wrongpw@gmail.com", password="totally-wrong-password"))


def test_login_rejects_nonexistent_email(db_session):
    service = AuthService(db_session)

    with pytest.raises(ValueError, match="Invalid email or password"):
        service.login(LoginRequest(email="doesnotexist@gmail.com", password="whatever123"))


def test_login_error_message_does_not_leak_which_case_occurred(db_session, test_department, mock_emails):
    """
    Security property: "wrong password" and "no such user" must raise
    the exact same message, so an attacker probing the login endpoint
    can't use error text to enumerate valid registered emails.
    """
    service = AuthService(db_session)
    payload = make_registration_payload(test_department.department_id, email="realuser@gmail.com")
    service.register(payload)

    wrong_password_error = None
    no_such_user_error = None

    try:
        service.login(LoginRequest(email="realuser@gmail.com", password="wrong-one-123"))
    except ValueError as e:
        wrong_password_error = str(e)

    try:
        service.login(LoginRequest(email="ghost@gmail.com", password="wrong-one-123"))
    except ValueError as e:
        no_such_user_error = str(e)

    assert wrong_password_error == no_such_user_error


def test_login_rejects_deactivated_account(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    plain_password = "a-valid-password-123"
    payload = make_registration_payload(
        test_department.department_id, email="deactivated@gmail.com", password=plain_password
    )
    user = service.register(payload)
    user.is_active = False
    db_session.commit()

    with pytest.raises(ValueError, match="deactivated"):
        service.login(LoginRequest(email="deactivated@gmail.com", password=plain_password))


# -------------------------------------------------------
# REFRESH
# -------------------------------------------------------

def _register_and_login(service, department_id, email, password="a-valid-password-123"):
    payload = make_registration_payload(department_id, email=email, password=password)
    service.register(payload)
    return service.login(LoginRequest(email=email, password=password))


def test_refresh_issues_new_tokens_for_valid_refresh_token(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    login_result = _register_and_login(service, test_department.department_id, "refresh1@gmail.com")

    refreshed = service.refresh(login_result["refresh_token"])

    assert "access_token" in refreshed
    assert "refresh_token" in refreshed
    assert refreshed["user_id"] == login_result["user_id"]


def test_refresh_rejects_invalid_token(db_session):
    service = AuthService(db_session)

    with pytest.raises(ValueError, match="Invalid or expired refresh token"):
        service.refresh("not-a-real-token-at-all")


def test_old_refresh_token_cannot_be_reused_after_rotation(db_session, test_department, mock_emails):
    """
    Refresh token rotation must revoke the old token — reusing it
    after a successful refresh should fail, protecting against replay
    if a token is ever stolen.
    """
    service = AuthService(db_session)
    login_result = _register_and_login(service, test_department.department_id, "rotation@gmail.com")
    old_refresh_token = login_result["refresh_token"]

    service.refresh(old_refresh_token)  # rotates — old token now revoked

    with pytest.raises(ValueError, match="Invalid or expired refresh token"):
        service.refresh(old_refresh_token)


# -------------------------------------------------------
# LOGOUT
# -------------------------------------------------------

def test_logout_revokes_refresh_token(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    login_result = _register_and_login(service, test_department.department_id, "logout1@gmail.com")
    refresh_token = login_result["refresh_token"]

    service.logout(refresh_token)

    assert verify_refresh_token(db_session, refresh_token) is None


def test_logout_on_already_revoked_token_does_not_raise(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    login_result = _register_and_login(service, test_department.department_id, "logout2@gmail.com")
    refresh_token = login_result["refresh_token"]

    service.logout(refresh_token)
    service.logout(refresh_token)  # calling logout twice should be harmless, not raise


# -------------------------------------------------------
# EMAIL VERIFICATION
# -------------------------------------------------------

def test_verify_email_with_valid_token_marks_user_verified(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    payload = make_registration_payload(test_department.department_id, email="verifyme@gmail.com")
    user = service.register(payload)
    token = create_email_verification_token(user.user_id)

    verified_user = service.verify_email(token)

    assert verified_user.is_verified is True


def test_verify_email_is_idempotent_on_already_verified_user(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    payload = make_registration_payload(test_department.department_id, email="alreadyverified@gmail.com")
    user = service.register(payload)
    token = create_email_verification_token(user.user_id)

    service.verify_email(token)
    # Calling again with a fresh valid token for the same (now-verified)
    # user must succeed quietly, not raise.
    second_token = create_email_verification_token(user.user_id)
    result = service.verify_email(second_token)

    assert result.is_verified is True


def test_verify_email_rejects_invalid_token(db_session):
    service = AuthService(db_session)

    with pytest.raises(ValueError, match="Invalid or expired verification link"):
        service.verify_email("not-a-real-token")


def test_resend_verification_silently_noops_for_nonexistent_email(db_session, mock_emails):
    service = AuthService(db_session)

    service.resend_verification("ghost@gmail.com")  # must not raise

    mock_emails["verify"].assert_not_called()


def test_resend_verification_silently_noops_for_already_verified_user(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    payload = make_registration_payload(test_department.department_id, email="verified2@gmail.com")
    user = service.register(payload)
    token = create_email_verification_token(user.user_id)
    service.verify_email(token)
    mock_emails["verify"].reset_mock()  # clear the call from registration itself

    service.resend_verification("verified2@gmail.com")

    mock_emails["verify"].assert_not_called()


def test_resend_verification_sends_email_for_unverified_user(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    payload = make_registration_payload(test_department.department_id, email="stillunverified@gmail.com")
    service.register(payload)
    mock_emails["verify"].reset_mock()

    service.resend_verification("stillunverified@gmail.com")

    mock_emails["verify"].assert_called_once()


# -------------------------------------------------------
# PASSWORD RESET
# -------------------------------------------------------

def test_request_password_reset_silently_noops_for_nonexistent_email(db_session, mock_emails):
    service = AuthService(db_session)

    service.request_password_reset("ghost@gmail.com")  # must not raise

    mock_emails["reset"].assert_not_called()


def test_request_password_reset_sends_email_for_existing_user(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    payload = make_registration_payload(test_department.department_id, email="resetme@gmail.com")
    service.register(payload)

    service.request_password_reset("resetme@gmail.com")

    mock_emails["reset"].assert_called_once()


def test_reset_password_with_valid_token_changes_password(db_session, test_department, mock_emails):
    service = AuthService(db_session)
    old_password = "old-password-123"
    payload = make_registration_payload(
        test_department.department_id, email="changepw@gmail.com", password=old_password
    )
    user = service.register(payload)
    token = create_password_reset_token(user.user_id)
    new_password = "brand-new-password-456"

    service.reset_password(token, new_password)

    # Old password no longer works, new password does.
    with pytest.raises(ValueError, match="Invalid email or password"):
        service.login(LoginRequest(email="changepw@gmail.com", password=old_password))

    login_result = service.login(LoginRequest(email="changepw@gmail.com", password=new_password))
    assert "access_token" in login_result


def test_reset_password_rejects_invalid_token(db_session):
    service = AuthService(db_session)

    with pytest.raises(ValueError, match="Invalid or expired reset link"):
        service.reset_password("not-a-real-token", "some-new-password-123")