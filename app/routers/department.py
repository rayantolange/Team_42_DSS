from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.dependencies import get_db, require_admin
from app.models.department import Department
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.department import (
    DepartmentResponse,
    DepartmentCreateRequest,
    DepartmentUpdateRequest,
)

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("/", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    """
    Returns all active departments. Used to populate department
    selection dropdowns (e.g. on the registration form). Inactive
    departments are excluded since new registrants shouldn't be
    able to select them.
    """
    return db.query(Department).filter(Department.is_active == True).all()

@router.get("/all", response_model=List[DepartmentResponse])
def list_all_departments(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    Returns every department, including inactive ones. Admin-only —
    used for department management, where admins need visibility
    into deactivated departments to potentially reactivate them.
    """
    repo = BaseRepository(Department, db)
    return repo.get_all()


@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    Creates a new department. Admin-only.
    """
    repo = BaseRepository(Department, db)
    new_department = Department(
        department_name=data.department_name,
        department_type=data.department_type,
        description=data.description,
    )
    return repo.save(new_department)


@router.patch("/{department_id}", response_model=DepartmentResponse)
def update_department(
    department_id: int,
    data: DepartmentUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    Edits an existing department. Only provided fields are updated.
    Admin-only.
    """
    repo = BaseRepository(Department, db)
    department = repo.get_by_id(department_id)
    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found."
        )

    if data.department_name is not None:
        department.department_name = data.department_name
    if data.department_type is not None:
        department.department_type = data.department_type
    if data.description is not None:
        department.description = data.description

    return repo.save(department)

@router.patch("/{department_id}/toggle-active", response_model=DepartmentResponse)
def toggle_department_active(
    department_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    Flips a department's active status. Admin-only.
    """
    repo = BaseRepository(Department, db)
    department = repo.get_by_id(department_id)
    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found."
        )

    department.is_active = not department.is_active
    return repo.save(department)


# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from typing import List

# from app.core.dependencies import get_db, require_admin
# from app.models.user import User
# from app.schemas.department import (
#     DepartmentResponse,
#     DepartmentCreateRequest,
#     DepartmentUpdateRequest,
# )
# from app.services.department_service import DepartmentService, get_department_service

# router = APIRouter(prefix="/departments", tags=["Departments"])


# @router.get("/", response_model=List[DepartmentResponse])
# def list_departments(service: DepartmentService = Depends(get_department_service)):
#     return service.list_active_departments()


# @router.get("/all", response_model=List[DepartmentResponse])
# def list_all_departments(
#     service: DepartmentService = Depends(get_department_service),
#     _: User = Depends(require_admin),
# ):
#     return service.list_all_departments()


# @router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
# def create_department(
#     data: DepartmentCreateRequest,
#     service: DepartmentService = Depends(get_department_service),
#     _: User = Depends(require_admin),
# ):
#     return service.create_department(data)


# @router.patch("/{department_id}", response_model=DepartmentResponse)
# def update_department(
#     department_id: int,
#     data: DepartmentUpdateRequest,
#     service: DepartmentService = Depends(get_department_service),
#     _: User = Depends(require_admin),
# ):
#     try:
#         return service.update_department(department_id, data)
#     except ValueError:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")


# @router.patch("/{department_id}/toggle-active", response_model=DepartmentResponse)
# def toggle_department_active(
#     department_id: int,
#     service: DepartmentService = Depends(get_department_service),
#     _: User = Depends(require_admin),
# ):
#     try:
#         return service.toggle_department_active(department_id)
#     except ValueError:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")