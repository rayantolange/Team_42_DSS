# fix_decision_20_constraints.py

from app.database import SessionLocal
from app.services.constraint_service import ConstraintService
from app.services.graph_sync_service import GraphSyncService

db = SessionLocal()
graph_sync_service = GraphSyncService()

try:
    for constraint_id in (2, 3):
        graph_sync_service.link_decision_constraint(decision_id=20, constraint_id=constraint_id)
        print(f"Synced: decision 20 -> constraint {constraint_id}")
finally:
    db.close()