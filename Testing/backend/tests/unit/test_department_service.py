"""
Tests for DepartmentService:
- create_department persists correctly and triggers graph sync
- get_department raises for a missing ID
- list_active_departments only returns active departments
- list_all_departments returns everything regardless of active status
- update_department only changes provided fields, leaves others intact,
  and triggers graph sync
- toggle_department_active flips the flag and does NOT trigger graph
  sync (is_active is explicitly not a synced node property)
"""
import pytest
from app.schemas.department import DepartmentCreateRequest, DepartmentUpdateRequest
from app.services.department_service import DepartmentService


@pytest.fixture(autouse=True)
def mock_graph_sync(mocker):
    """create/update trigger a Neo4j sync — mock it out globally for
    this file since Neo4j connectivity is irrelevant to the business
    rules being tested here."""
    return mocker.patch("app.services.department_service.GraphSyncService.sync_department")


def test_create_department_persists_correctly(db_session):
    service = DepartmentService(db_session)
    payload = DepartmentCreateRequest(
        department_name="Physics",
        department_type="Academic",
        description="Studies matter and energy.",
    )

    department = service.create_department(payload)

    assert department.department_id is not None
    assert department.department_name == "Physics"
    assert department.department_type == "Academic"
    assert department.description == "Studies matter and energy."


def test_create_department_defaults_to_active(db_session):
    service = DepartmentService(db_session)
    payload = DepartmentCreateRequest(department_name="Chemistry")

    department = service.create_department(payload)

    assert department.is_active is True


def test_create_department_triggers_graph_sync(db_session, mock_graph_sync):
    service = DepartmentService(db_session)
    payload = DepartmentCreateRequest(department_name="Mathematics")

    department = service.create_department(payload)

    mock_graph_sync.assert_called_once_with(department)


def test_get_department_raises_for_missing_id(db_session):
    service = DepartmentService(db_session)

    with pytest.raises(ValueError, match="Department not found"):
        service.get_department(999999)


def test_get_department_returns_existing(db_session):
    service = DepartmentService(db_session)
    created = service.create_department(DepartmentCreateRequest(department_name="Biology"))

    fetched = service.get_department(created.department_id)

    assert fetched.department_id == created.department_id
    assert fetched.department_name == "Biology"


def test_list_active_departments_excludes_deactivated(db_session):
    service = DepartmentService(db_session)
    active_dept = service.create_department(DepartmentCreateRequest(department_name="Active Dept"))
    inactive_dept = service.create_department(DepartmentCreateRequest(department_name="Inactive Dept"))
    service.toggle_department_active(inactive_dept.department_id)

    active_list = service.list_active_departments()
    active_ids = {d.department_id for d in active_list}

    assert active_dept.department_id in active_ids
    assert inactive_dept.department_id not in active_ids


def test_list_all_departments_includes_inactive(db_session):
    service = DepartmentService(db_session)
    active_dept = service.create_department(DepartmentCreateRequest(department_name="Still Active"))
    inactive_dept = service.create_department(DepartmentCreateRequest(department_name="Now Inactive"))
    service.toggle_department_active(inactive_dept.department_id)

    all_list = service.list_all_departments()
    all_ids = {d.department_id for d in all_list}

    assert active_dept.department_id in all_ids
    assert inactive_dept.department_id in all_ids


# -------------------------------------------------------
# UPDATE
# -------------------------------------------------------

def test_update_department_changes_only_provided_fields(db_session):
    service = DepartmentService(db_session)
    department = service.create_department(
        DepartmentCreateRequest(
            department_name="Original Name",
            department_type="Academic",
            description="Original description.",
        )
    )

    updated = service.update_department(
        department.department_id,
        DepartmentUpdateRequest(description="Updated description only."),
    )

    assert updated.department_name == "Original Name"  # unchanged
    assert updated.department_type == "Academic"  # unchanged
    assert updated.description == "Updated description only."  # changed


def test_update_department_can_change_multiple_fields(db_session):
    service = DepartmentService(db_session)
    department = service.create_department(DepartmentCreateRequest(department_name="Old Name"))

    updated = service.update_department(
        department.department_id,
        DepartmentUpdateRequest(department_name="New Name", department_type="Administrative"),
    )

    assert updated.department_name == "New Name"
    assert updated.department_type == "Administrative"


def test_update_department_raises_for_missing_id(db_session):
    service = DepartmentService(db_session)

    with pytest.raises(ValueError, match="Department not found"):
        service.update_department(999999, DepartmentUpdateRequest(department_name="Doesn't Matter"))


def test_update_department_triggers_graph_sync(db_session, mock_graph_sync):
    service = DepartmentService(db_session)
    department = service.create_department(DepartmentCreateRequest(department_name="Sync Test"))
    mock_graph_sync.reset_mock()  # clear the call from creation itself

    updated = service.update_department(
        department.department_id, DepartmentUpdateRequest(department_name="Sync Test Updated")
    )

    mock_graph_sync.assert_called_once_with(updated)


# -------------------------------------------------------
# TOGGLE ACTIVE
# -------------------------------------------------------

def test_toggle_department_active_flips_the_flag(db_session):
    service = DepartmentService(db_session)
    department = service.create_department(DepartmentCreateRequest(department_name="Toggle Test"))
    assert department.is_active is True

    toggled_off = service.toggle_department_active(department.department_id)
    assert toggled_off.is_active is False

    toggled_on = service.toggle_department_active(department.department_id)
    assert toggled_on.is_active is True


def test_toggle_department_active_does_not_trigger_graph_sync(db_session, mock_graph_sync):
    service = DepartmentService(db_session)
    department = service.create_department(DepartmentCreateRequest(department_name="No Sync On Toggle"))
    mock_graph_sync.reset_mock()  # clear the call from creation itself

    service.toggle_department_active(department.department_id)

    mock_graph_sync.assert_not_called()


def test_toggle_department_active_raises_for_missing_id(db_session):
    service = DepartmentService(db_session)

    with pytest.raises(ValueError, match="Department not found"):
        service.toggle_department_active(999999)