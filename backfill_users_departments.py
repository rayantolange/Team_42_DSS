# backfill_users_departments.py

from app.database import SessionLocal
from app.models.user import User
from app.models.department import Department
from app.services.graph_sync_service import GraphSyncService

db = SessionLocal()
graph_sync_service = GraphSyncService()

try:
    for department in db.query(Department).all():
        graph_sync_service.sync_department(department)
        print(f"Synced department {department.department_id}: {department.department_name}")

    for user in db.query(User).all():
        graph_sync_service.sync_user(user)
        print(f"Synced user {user.user_id}: {user.full_name}")
finally:
    db.close()