from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.department import Department
from app.repositories.base import BaseRepository
from app.schemas.department import DepartmentCreateRequest, DepartmentUpdateRequest
from app.services.graph_sync_service import GraphSyncService


class DepartmentService:
    def __init__(self, db: Session):
        self.db = db
        self.department_repo = BaseRepository(Department, db)
        self.graph_sync_service = GraphSyncService()

    def list_active_departments(self) -> List[Department]:
        return self.db.query(Department).filter(Department.is_active == True).all()

    def list_all_departments(self) -> List[Department]:
        return self.department_repo.get_all()

    def get_department(self, department_id: int) -> Department:
        department = self.department_repo.get_by_id(department_id)
        if department is None:
            raise ValueError("Department not found.")
        return department

    def create_department(self, data: DepartmentCreateRequest) -> Department:
        new_department = Department(
            department_name=data.department_name,
            department_type=data.department_type,
            description=data.description,
        )
        saved_department = self.department_repo.save(new_department)
        self.graph_sync_service.sync_department(saved_department)

        return saved_department

    def update_department(self, department_id: int, data: DepartmentUpdateRequest) -> Department:
        department = self.get_department(department_id)

        if data.department_name is not None:
            department.department_name = data.department_name
        if data.department_type is not None:
            department.department_type = data.department_type
        if data.description is not None:
            department.description = data.description

        updated_department = self.department_repo.save(department)
        self.graph_sync_service.sync_department(updated_department)

        return updated_department

    def toggle_department_active(self, department_id: int) -> Department:
        department = self.get_department(department_id)
        department.is_active = not department.is_active
        # No graph sync here — is_active isn't a synced node property.
        return self.department_repo.save(department)


def get_department_service(db: Session) -> DepartmentService:
    return DepartmentService(db)