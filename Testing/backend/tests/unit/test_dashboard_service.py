"""
Tests for DashboardService.get_metrics — pure aggregation/arithmetic
logic, so repositories are mocked directly rather than seeding data
across five different tables. What's actually being verified:
- department_id=None (institution-wide) vs a specific department
  routes to the correct repo methods
- positive_outcome_rate and outcome_coverage_percent are calculated
  correctly, and safely return 0.0 instead of dividing by zero when
  there's no data yet
- department_comparison is only populated institution-wide
- recent_decisions correctly reshapes ORM-like objects into plain
  dicts, handling missing department/created_at gracefully
"""
import pytest
from types import SimpleNamespace
from app.services.dashboard_service import DashboardService


class FakeStatus:
    """Stand-in for a DecisionStatusEnum member — real enum members
    have a .value attribute, which is all get_metrics reads."""
    def __init__(self, value):
        self.value = value


def make_fake_decision(decision_id, title, department_name="Some Dept", status="draft", created_at=None):
    department = SimpleNamespace(department_name=department_name) if department_name is not None else None
    return SimpleNamespace(
        decision_id=decision_id,
        title=title,
        department=department,
        status=FakeStatus(status),
        created_at=created_at,
    )


@pytest.fixture()
def service(db_session):
    return DashboardService(db_session)


def _patch_common(mocker, service, *, total_decisions=0, breakdown=None, decisions_with_outcome=0,
                   recent=None, department_comparison=None):
    mocker.patch.object(service.decision_repo, "count_pending", return_value=0)
    mocker.patch.object(service.decision_repo, "get_monthly_status_counts", return_value=[])
    mocker.patch.object(service.decision_repo, "get_recent", return_value=recent or [])
    mocker.patch.object(service.outcome_repo, "get_status_breakdown", return_value=breakdown or [])
    mocker.patch.object(service.outcome_repo, "count_decisions_with_outcome", return_value=decisions_with_outcome)
    mocker.patch.object(service.outcome_repo, "get_department_breakdown", return_value=department_comparison or [])
    return total_decisions


# -------------------------------------------------------
# SCOPE ROUTING — institution-wide vs department-scoped
# -------------------------------------------------------

def test_institution_wide_uses_count_all(mocker, service):
    _patch_common(mocker, service)
    mock_count_all = mocker.patch.object(service.decision_repo, "count_all", return_value=42)
    mock_count_by_dept = mocker.patch.object(service.decision_repo, "count_by_department")
    mocker.patch.object(service.document_repo, "count_all", return_value=10)
    mocker.patch.object(service.document_repo, "count_by_department")

    metrics = service.get_metrics(department_id=None)

    mock_count_all.assert_called_once()
    mock_count_by_dept.assert_not_called()
    assert metrics["total_decisions"] == 42


def test_department_scoped_uses_count_by_department(mocker, service):
    _patch_common(mocker, service)
    mock_count_all = mocker.patch.object(service.decision_repo, "count_all")
    mock_count_by_dept = mocker.patch.object(service.decision_repo, "count_by_department", return_value=7)
    mocker.patch.object(service.document_repo, "count_all")
    mocker.patch.object(service.document_repo, "count_by_department", return_value=3)

    metrics = service.get_metrics(department_id=5)

    mock_count_all.assert_not_called()
    mock_count_by_dept.assert_called_once_with(5)
    assert metrics["total_decisions"] == 7
    assert metrics["documents_indexed"] == 3


# -------------------------------------------------------
# POSITIVE OUTCOME RATE
# -------------------------------------------------------

def test_positive_outcome_rate_calculated_correctly(mocker, service):
    breakdown = [
        {"status": "successful", "count": 3},
        {"status": "failed", "count": 5},
        {"status": "partially_successful", "count": 2},
    ]
    _patch_common(mocker, service, breakdown=breakdown)
    mocker.patch.object(service.decision_repo, "count_all", return_value=0)
    mocker.patch.object(service.document_repo, "count_all", return_value=0)

    metrics = service.get_metrics(department_id=None)

    assert metrics["positive_outcome_rate"] == 30.0  # 3 / 10 * 100


def test_positive_outcome_rate_is_zero_with_no_outcomes(mocker, service):
    _patch_common(mocker, service, breakdown=[])
    mocker.patch.object(service.decision_repo, "count_all", return_value=0)
    mocker.patch.object(service.document_repo, "count_all", return_value=0)

    metrics = service.get_metrics(department_id=None)

    assert metrics["positive_outcome_rate"] == 0.0  # must not raise ZeroDivisionError


def test_positive_outcome_rate_is_zero_with_no_successful_outcomes(mocker, service):
    breakdown = [{"status": "failed", "count": 4}]
    _patch_common(mocker, service, breakdown=breakdown)
    mocker.patch.object(service.decision_repo, "count_all", return_value=0)
    mocker.patch.object(service.document_repo, "count_all", return_value=0)

    metrics = service.get_metrics(department_id=None)

    assert metrics["positive_outcome_rate"] == 0.0


# -------------------------------------------------------
# OUTCOME COVERAGE PERCENT
# -------------------------------------------------------

def test_outcome_coverage_percent_calculated_correctly(mocker, service):
    _patch_common(mocker, service, decisions_with_outcome=4)
    mocker.patch.object(service.decision_repo, "count_all", return_value=8)
    mocker.patch.object(service.document_repo, "count_all", return_value=0)

    metrics = service.get_metrics(department_id=None)

    assert metrics["outcome_coverage_percent"] == 50.0  # 4 / 8 * 100


def test_outcome_coverage_percent_is_zero_with_no_decisions(mocker, service):
    _patch_common(mocker, service, decisions_with_outcome=0)
    mocker.patch.object(service.decision_repo, "count_all", return_value=0)
    mocker.patch.object(service.document_repo, "count_all", return_value=0)

    metrics = service.get_metrics(department_id=None)

    assert metrics["outcome_coverage_percent"] == 0.0  # must not raise ZeroDivisionError


# -------------------------------------------------------
# DEPARTMENT COMPARISON — institution-wide only
# -------------------------------------------------------

def test_department_comparison_populated_when_institution_wide(mocker, service):
    comparison_data = [{"department_name": "CS", "positive_rate": 80.0}]
    _patch_common(mocker, service, department_comparison=comparison_data)
    mocker.patch.object(service.decision_repo, "count_all", return_value=0)
    mocker.patch.object(service.document_repo, "count_all", return_value=0)

    metrics = service.get_metrics(department_id=None)

    assert metrics["department_comparison"] == comparison_data


def test_department_comparison_empty_when_department_scoped(mocker, service):
    mock_get_breakdown = mocker.patch.object(service.outcome_repo, "get_department_breakdown")
    _patch_common(mocker, service)
    mocker.patch.object(service.decision_repo, "count_by_department", return_value=0)
    mocker.patch.object(service.document_repo, "count_by_department", return_value=0)

    metrics = service.get_metrics(department_id=5)

    mock_get_breakdown.assert_not_called()
    assert metrics["department_comparison"] == []


# -------------------------------------------------------
# RECENT DECISIONS — shape transformation
# -------------------------------------------------------

def test_recent_decisions_reshapes_correctly(mocker, service):
    from datetime import datetime
    created = datetime(2026, 1, 15, 10, 30)
    recent = [make_fake_decision(1, "Budget Freeze", "Finance", "approved", created)]
    _patch_common(mocker, service, recent=recent)
    mocker.patch.object(service.decision_repo, "count_all", return_value=0)
    mocker.patch.object(service.document_repo, "count_all", return_value=0)

    metrics = service.get_metrics(department_id=None)

    assert metrics["recent_decisions"] == [
        {
            "decision_id": 1,
            "title": "Budget Freeze",
            "department_name": "Finance",
            "status": "approved",
            "created_at": created.isoformat(),
        }
    ]


def test_recent_decisions_handles_missing_department(mocker, service):
    recent = [make_fake_decision(2, "No Dept Decision", department_name=None)]
    _patch_common(mocker, service, recent=recent)
    mocker.patch.object(service.decision_repo, "count_all", return_value=0)
    mocker.patch.object(service.document_repo, "count_all", return_value=0)

    metrics = service.get_metrics(department_id=None)

    assert metrics["recent_decisions"][0]["department_name"] == ""


def test_recent_decisions_handles_missing_created_at(mocker, service):
    recent = [make_fake_decision(3, "No Date Decision", created_at=None)]
    _patch_common(mocker, service, recent=recent)
    mocker.patch.object(service.decision_repo, "count_all", return_value=0)
    mocker.patch.object(service.document_repo, "count_all", return_value=0)

    metrics = service.get_metrics(department_id=None)

    assert metrics["recent_decisions"][0]["created_at"] == ""