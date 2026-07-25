from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db
from app.models.department import Department
from app.repositories.base import BaseRepository
from app.schemas.department import DepartmentResponse

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("/", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    """
    Returns all departments. Used to populate department
    selection dropdowns (e.g. on the registration form).
    """
    repo = BaseRepository(Department, db)
    return repo.get_all()