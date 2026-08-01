"""
Integration tests for Department routes.

Covers:
- Public department listing
- Admin-only department management
- Permission enforcement
- Validation errors
- Not-found handling
"""

from app.core.jwt import create_access_token


def get_headers(user):
    """
    Creates Authorization headers for a test user.
    Matches the JWT format expected by get_current_user().
    """
    token = create_access_token(
        {"sub": str(user.user_id)}
    )

    return {
        "Authorization": f"Bearer {token}"
    }


# -------------------------------------------------------
# GET /departments/
# -------------------------------------------------------

def test_list_active_departments(client):
    response = client.get("/departments/")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


# -------------------------------------------------------
# CREATE
# -------------------------------------------------------

def test_admin_can_create_department(
    client,
    admin_user,
):
    response = client.post(
        "/departments/",
        headers=get_headers(admin_user),
        json={
            "department_name": "Electrical Engineering",
            "department_type": "Academic",
            "description": "Computing and technology department.",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["department_name"] == "Electrical Engineering"
    assert data["department_type"] == "Academic"
    assert data["is_active"] is True


def test_non_admin_cannot_create_department(
    client,
    faculty_user,
):
    response = client.post(
        "/departments/",
        headers=get_headers(faculty_user),
        json={
            "department_name": "Physics",
            "department_type": "Academic",
        },
    )

    assert response.status_code == 403


def test_unauthenticated_user_cannot_create_department(
    client,
):
    response = client.post(
        "/departments/",
        json={
            "department_name": "Physics",
        },
    )

    assert response.status_code == 401


def test_create_department_validation_error(
    client,
    admin_user,
):
    response = client.post(
        "/departments/",
        headers=get_headers(admin_user),
        json={
            "department_name": "A",
        },
    )

    assert response.status_code == 422


# -------------------------------------------------------
# GET ALL
# -------------------------------------------------------

def test_admin_can_list_all_departments(
    client,
    admin_user,
):
    response = client.get(
        "/departments/all",
        headers=get_headers(admin_user),
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_non_admin_cannot_list_all_departments(
    client,
    faculty_user,
):
    response = client.get(
        "/departments/all",
        headers=get_headers(faculty_user),
    )

    assert response.status_code == 403


# -------------------------------------------------------
# UPDATE
# -------------------------------------------------------

def test_admin_can_update_department(
    client,
    admin_user,
):
    create_response = client.post(
        "/departments/",
        headers=get_headers(admin_user),
        json={
            "department_name": "Mathematics",
            "department_type": "Academic",
        },
    )

    assert create_response.status_code == 201

    department_id = create_response.json()["department_id"]

    response = client.patch(
        f"/departments/{department_id}",
        headers=get_headers(admin_user),
        json={
            "description": "Updated description.",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["description"] == "Updated description."
    assert data["department_name"] == "Mathematics"


def test_update_missing_department_returns_404(
    client,
    admin_user,
):
    response = client.patch(
        "/departments/999999",
        headers=get_headers(admin_user),
        json={
            "department_name": "Does Not Exist",
        },
    )

    assert response.status_code == 404


def test_non_admin_cannot_update_department(
    client,
    faculty_user,
):
    response = client.patch(
        "/departments/1",
        headers=get_headers(faculty_user),
        json={
            "department_name": "Blocked Update",
        },
    )

    assert response.status_code == 403


# -------------------------------------------------------
# TOGGLE ACTIVE
# -------------------------------------------------------

def test_admin_can_toggle_department_active(
    client,
    admin_user,
):
    create_response = client.post(
        "/departments/",
        headers=get_headers(admin_user),
        json={
            "department_name": "Temporary Department",
        },
    )

    assert create_response.status_code == 201

    department_id = create_response.json()["department_id"]

    response = client.patch(
        f"/departments/{department_id}/toggle-active",
        headers=get_headers(admin_user),
    )

    assert response.status_code == 200

    data = response.json()

    assert data["is_active"] is False


def test_non_admin_cannot_toggle_department(
    client,
    faculty_user,
):
    response = client.patch(
        "/departments/1/toggle-active",
        headers=get_headers(faculty_user),
    )

    assert response.status_code == 403


def test_toggle_missing_department_returns_404(
    client,
    admin_user,
):
    response = client.patch(
        "/departments/999999/toggle-active",
        headers=get_headers(admin_user),
    )

    assert response.status_code == 404