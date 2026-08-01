"""
Integration tests for Admin routes.
Covers:
- User listing (admin-only)
- System stats aggregation
- Role updates (including self-demotion guard)
- Reactivation
- Soft delete (deactivation)
- Permanent delete (anonymization)
- Permission enforcement (403) and not-found handling (404)
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
# GET /admin/users
# -------------------------------------------------------
def test_admin_can_list_all_users(
    client,
    admin_user,
    faculty_user,
):
    response = client.get(
        "/admin/users",
        headers=get_headers(admin_user),
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    emails = {u["email"] for u in data}
    assert admin_user.email in emails
    assert faculty_user.email in emails
    for user in data:
        assert "is_verified" in user
        assert "is_active" in user
        assert "password_hash" not in user


def test_non_admin_cannot_list_all_users(
    client,
    faculty_user,
):
    response = client.get(
        "/admin/users",
        headers=get_headers(faculty_user),
    )
    assert response.status_code == 403


def test_unauthenticated_user_cannot_list_all_users(
    client,
):
    response = client.get("/admin/users")
    assert response.status_code == 401


# -------------------------------------------------------
# GET /admin/stats
# -------------------------------------------------------
def test_admin_can_get_system_stats(
    client,
    admin_user,
    faculty_user,
    staff_user,
    other_dept_faculty_user,
):
    response = client.get(
        "/admin/stats",
        headers=get_headers(admin_user),
    )
    assert response.status_code == 200
    data = response.json()

    assert data["total_users"] == 4
    assert data["verified_users"] == 4
    assert data["unverified_users"] == 0
    assert data["active_users"] == 4
    assert data["deactivated_users"] == 0
    assert data["role_counts"]["admin"] == 1
    assert data["role_counts"]["faculty"] == 2
    assert data["role_counts"]["staff"] == 1


def test_non_admin_cannot_get_system_stats(
    client,
    faculty_user,
):
    response = client.get(
        "/admin/stats",
        headers=get_headers(faculty_user),
    )
    assert response.status_code == 403


def test_unauthenticated_user_cannot_get_system_stats(
    client,
):
    response = client.get("/admin/stats")
    assert response.status_code == 401


# -------------------------------------------------------
# PATCH /admin/users/{user_id}/role
# -------------------------------------------------------
def test_admin_can_update_user_role(
    client,
    admin_user,
    faculty_user,
):
    response = client.patch(
        f"/admin/users/{faculty_user.user_id}/role",
        headers=get_headers(admin_user),
        json={"role": "staff"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == faculty_user.user_id
    assert data["role"] == "staff"


def test_admin_cannot_change_own_role(
    client,
    admin_user,
):
    response = client.patch(
        f"/admin/users/{admin_user.user_id}/role",
        headers=get_headers(admin_user),
        json={"role": "staff"},
    )
    assert response.status_code == 400


def test_update_role_missing_user_returns_404(
    client,
    admin_user,
):
    response = client.patch(
        "/admin/users/999999/role",
        headers=get_headers(admin_user),
        json={"role": "staff"},
    )
    assert response.status_code == 404


def test_update_role_invalid_role_returns_422(
    client,
    admin_user,
    faculty_user,
):
    response = client.patch(
        f"/admin/users/{faculty_user.user_id}/role",
        headers=get_headers(admin_user),
        json={"role": "not_a_real_role"},
    )
    assert response.status_code == 422


def test_non_admin_cannot_update_user_role(
    client,
    faculty_user,
    staff_user,
):
    response = client.patch(
        f"/admin/users/{staff_user.user_id}/role",
        headers=get_headers(faculty_user),
        json={"role": "admin"},
    )
    assert response.status_code == 403


# -------------------------------------------------------
# PATCH /admin/users/{user_id}/activate
# -------------------------------------------------------
def test_admin_can_activate_deactivated_user(
    client,
    admin_user,
    faculty_user,
    db_session,
):
    faculty_user.is_active = False
    db_session.add(faculty_user)
    db_session.commit()

    response = client.patch(
        f"/admin/users/{faculty_user.user_id}/activate",
        headers=get_headers(admin_user),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_active"] is True


def test_activate_already_active_user_returns_400(
    client,
    admin_user,
    faculty_user,
):
    response = client.patch(
        f"/admin/users/{faculty_user.user_id}/activate",
        headers=get_headers(admin_user),
    )
    assert response.status_code == 400


def test_activate_missing_user_returns_404(
    client,
    admin_user,
):
    response = client.patch(
        "/admin/users/999999/activate",
        headers=get_headers(admin_user),
    )
    assert response.status_code == 404


def test_non_admin_cannot_activate_user(
    client,
    faculty_user,
    staff_user,
):
    response = client.patch(
        f"/admin/users/{staff_user.user_id}/activate",
        headers=get_headers(faculty_user),
    )
    assert response.status_code == 403


# -------------------------------------------------------
# DELETE /admin/users/{user_id}  (soft delete)
# -------------------------------------------------------
def test_admin_can_deactivate_user(
    client,
    admin_user,
    faculty_user,
):
    response = client.delete(
        f"/admin/users/{faculty_user.user_id}",
        headers=get_headers(admin_user),
    )
    assert response.status_code == 200
    assert response.json() == {"message": "User account deactivated."}

    list_response = client.get(
        "/admin/users",
        headers=get_headers(admin_user),
    )
    target = next(
        u for u in list_response.json()
        if u["user_id"] == faculty_user.user_id
    )
    assert target["is_active"] is False
    # Soft delete preserves identifying info.
    assert target["email"] == faculty_user.email
    assert target["full_name"] == faculty_user.full_name


def test_admin_cannot_delete_own_account(
    client,
    admin_user,
):
    response = client.delete(
        f"/admin/users/{admin_user.user_id}",
        headers=get_headers(admin_user),
    )
    assert response.status_code == 400


def test_deactivate_missing_user_returns_404(
    client,
    admin_user,
):
    response = client.delete(
        "/admin/users/999999",
        headers=get_headers(admin_user),
    )
    assert response.status_code == 404


def test_non_admin_cannot_deactivate_user(
    client,
    faculty_user,
    staff_user,
):
    response = client.delete(
        f"/admin/users/{staff_user.user_id}",
        headers=get_headers(faculty_user),
    )
    assert response.status_code == 403


def test_unauthenticated_user_cannot_deactivate_user(
    client,
    faculty_user,
):
    response = client.delete(f"/admin/users/{faculty_user.user_id}")
    assert response.status_code == 401


# -------------------------------------------------------
# DELETE /admin/users/{user_id}/permanent
# -------------------------------------------------------
def test_admin_can_permanently_delete_user(
    client,
    admin_user,
    faculty_user,
):
    user_id = faculty_user.user_id

    response = client.delete(
        f"/admin/users/{user_id}/permanent",
        headers=get_headers(admin_user),
    )
    assert response.status_code == 200
    assert response.json() == {
        "message": (
            "User account permanently anonymized. "
            "Historical records remain attributed to this account."
        )
    }

    list_response = client.get(
        "/admin/users",
        headers=get_headers(admin_user),
    )
    target = next(
        u for u in list_response.json()
        if u["user_id"] == user_id
    )
    assert target["is_active"] is False
    assert target["full_name"] == f"Deleted User #{user_id}"
    assert target["email"] == f"deleted-user-{user_id}@deactivated.local"


def test_admin_cannot_permanently_delete_own_account(
    client,
    admin_user,
):
    response = client.delete(
        f"/admin/users/{admin_user.user_id}/permanent",
        headers=get_headers(admin_user),
    )
    assert response.status_code == 400


def test_permanently_delete_missing_user_returns_404(
    client,
    admin_user,
):
    response = client.delete(
        "/admin/users/999999/permanent",
        headers=get_headers(admin_user),
    )
    assert response.status_code == 404


def test_non_admin_cannot_permanently_delete_user(
    client,
    faculty_user,
    staff_user,
):
    response = client.delete(
        f"/admin/users/{staff_user.user_id}/permanent",
        headers=get_headers(faculty_user),
    )
    assert response.status_code == 403