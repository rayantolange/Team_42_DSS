from unittest.mock import patch

from app.core.password import hash_password
from app.models.user import User
from app.models.enums import UserRoleEnum


# -------------------------------------------------------
# REGISTER
# -------------------------------------------------------

@patch("app.services.auth_services.send_verification_email")
def test_register_success(mock_send_email, client, test_department):
    response = client.post(
        "/auth/register",
        json={
            "department_id": test_department.department_id,
            "full_name": "New User",
            "email": "newuser@gmail.com",
            "role": "faculty",
            "password": "Password123!"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@gmail.com"
    assert data["full_name"] == "New User"
    assert "password" not in data
    mock_send_email.assert_called_once()


@patch("app.services.auth_services.send_verification_email")
def test_register_duplicate_user(mock_send_email, client, test_department):
    payload = {
        "department_id": test_department.department_id,
        "full_name": "Existing User",
        "email": "existing@gmail.com",
        "role": "faculty",
        "password": "Password123!"
    }
    first_response = client.post(
        "/auth/register",
        json=payload
    )
    assert first_response.status_code == 201

    second_response = client.post(
        "/auth/register",
        json=payload
    )
    assert second_response.status_code == 400


# -------------------------------------------------------
# LOGIN
# -------------------------------------------------------

def test_login_success(client, db_session, test_department):
    user = User(
        department_id=test_department.department_id,
        full_name="Test Faculty",
        email="faculty.login@gmail.com",
        role=UserRoleEnum.faculty,
        password_hash=hash_password("Password123!"),
        is_verified=True,
        is_active=True,
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    response = client.post(
        "/auth/login",
        data={
            "username": user.email,
            "password": "Password123!"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"

    assert "refresh_token" in response.cookies


def test_login_invalid_password(client, db_session, test_department):
    user = User(
        department_id=test_department.department_id,
        full_name="Test Faculty",
        email="faculty.invalid@gmail.com",
        role=UserRoleEnum.faculty,
        password_hash=hash_password("Password123!"),
        is_verified=True,
        is_active=True,
    )

    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/auth/login",
        data={
            "username": user.email,
            "password": "WrongPassword!"
        }
    )

    assert response.status_code == 401


def test_login_missing_password(client):

    response = client.post(
        "/auth/login",
        data={
            "username": "faculty@gmail.com"
        }
    )

    assert response.status_code == 422


# -------------------------------------------------------
# REFRESH
# -------------------------------------------------------

def test_refresh_success(client, db_session, test_department):

    user = User(
        department_id=test_department.department_id,
        full_name="Refresh User",
        email="refresh@gmail.com",
        role=UserRoleEnum.faculty,
        password_hash=hash_password("Password123!"),
        is_verified=True,
        is_active=True,
    )

    db_session.add(user)
    db_session.commit()

    login_response = client.post(
        "/auth/login",
        data={
            "username": user.email,
            "password": "Password123!"
        }
    )

    assert login_response.status_code == 200

    response = client.post(
        "/auth/refresh"
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data


def test_refresh_without_cookie(client):

    response = client.post(
        "/auth/refresh"
    )

    assert response.status_code == 401


# -------------------------------------------------------
# LOGOUT
# -------------------------------------------------------

def test_logout(client):

    client.cookies.set(
        "refresh_token",
        "dummy_token"
    )

    response = client.post(
        "/auth/logout"
    )

    assert response.status_code == 200

    assert response.json()["message"] == "Logged out."


def test_logout_without_cookie(client):

    response = client.post(
        "/auth/logout"
    )

    assert response.status_code == 200


# -------------------------------------------------------
# CURRENT USER
# -------------------------------------------------------

def test_get_me_without_token(client):

    response = client.get(
        "/auth/me"
    )

    assert response.status_code == 401


# -------------------------------------------------------
# EMAIL VERIFICATION
# -------------------------------------------------------

def test_verify_email_invalid_token(client):

    response = client.get(
        "/auth/verify-email",
        params={
            "token": "invalid_token"
        }
    )

    assert response.status_code == 400


def test_resend_verification(client):

    response = client.post(
        "/auth/resend-verification",
        params={
            "email": "unknown@gmail.com"
        }
    )

    assert response.status_code == 200

    assert "message" in response.json()


# -------------------------------------------------------
# PASSWORD RESET
# -------------------------------------------------------

def test_forgot_password(client):

    response = client.post(
        "/auth/forgot-password",
        json={
            "email": "unknown@gmail.com"
        }
    )

    assert response.status_code == 200

    assert "message" in response.json()


def test_reset_password_invalid_token(client):

    response = client.post(
        "/auth/reset-password",
        json={
            "token": "invalid_token",
            "new_password": "NewPassword123!"
        }
    )

    assert response.status_code == 400