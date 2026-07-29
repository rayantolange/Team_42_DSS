# fix_department_graph.py

from app.database import SessionLocal
from app.models.department import Department
from app.services.graph_sync_service import GraphSyncService
from app.ai.neo4j_client import run_query, close_driver

db = SessionLocal()
graph_sync_service = GraphSyncService()

try:
    # Re-sync the corrected department — MERGE matches on department_id,
    # so this updates the existing node's name rather than creating a new one
    business_admin = db.query(Department).filter(
        Department.department_name == "Business Administration Department"
    ).first()
    if business_admin:
        graph_sync_service.sync_department(business_admin)
        print(f"Re-synced: {business_admin.department_name}")

    # Delete the genuine junk nodes
    for name in ["ram", "test"]:
        run_query(
            "MATCH (dp:Department {department_name: $name}) DETACH DELETE dp",
            {"name": name},
        )
        print(f"Deleted from Neo4j: {name}")
finally:
    db.close()
    close_driver()