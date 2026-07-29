# backfill_departments.py

from app.database import SessionLocal  # adjust to your actual session import
from app.models.department import Department
from app.services.graph_sync_service import GraphSyncService

def backfill_departments():
    db = SessionLocal()
    graph_sync_service = GraphSyncService()

    try:
        departments = db.query(Department).all()
        for department in departments:
            graph_sync_service.sync_department(department)
            print(f"Synced: {department.department_name}")
    finally:
        db.close()

if __name__ == "__main__":
    backfill_departments()