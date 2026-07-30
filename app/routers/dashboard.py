from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.enums import UserRoleEnum
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import DashboardMetricsResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns aggregated decision/outcome/document metrics.
    Principals see institution-wide data (department_id=None);
    everyone else is scoped to their own department. Admins never
    reach this route on the frontend, but if they did, they'd be
    treated as department-scoped like any non-principal role.
    """
    service = DashboardService(db)
    department_id = (
        None if current_user.role == UserRoleEnum.principal else current_user.department_id
    )
    return service.get_metrics(department_id)