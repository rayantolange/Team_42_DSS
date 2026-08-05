import sys
import os

# Ensures project root is in the Python path when executed directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.ai.neo4j_client import run_query
from app.models import Decision, Strategy, ConstraintMaster, Outcome, Department, User


def cleanup_orphaned_neo4j_nodes():
    """
    Queries PostgreSQL for active domain entity IDs and removes any nodes
    from Neo4j whose primary key is no longer present in PostgreSQL.
    """
    db = SessionLocal()

    try:
        # Map Neo4j node labels to their PostgreSQL model and ID attribute
        entity_mappings = [
            {"label": "Decision", "id_attr": "decision_id", "model": Decision},
            {"label": "Strategy", "id_attr": "strategy_id", "model": Strategy},
            {"label": "Constraint", "id_attr": "constraint_id", "model": ConstraintMaster},
            {"label": "Outcome", "id_attr": "outcome_id", "model": Outcome},
            {"label": "Department", "id_attr": "department_id", "model": Department},
            {"label": "User", "id_attr": "user_id", "model": User},
        ]

        total_deleted = 0

        for item in entity_mappings:
            label = item["label"]
            id_attr = item["id_attr"]
            model = item["model"]

            # 1. Fetch valid IDs from Postgres
            model_id_column = getattr(model, id_attr)
            valid_ids = [row[0] for row in db.query(model_id_column).all()]

            if not valid_ids:
                print(f"[{label}] No active records found in PostgreSQL.")
                continue

            # 2. Cypher query to delete orphaned nodes for this label
            cypher_query = f"""
            MATCH (n:{label})
            WHERE NOT (n.{id_attr} IN $valid_ids)
            DETACH DELETE n
            RETURN count(n) AS deleted_count
            """

            result = run_query(cypher_query, {"valid_ids": valid_ids})
            deleted = result[0].get("deleted_count", 0) if result else 0

            if deleted > 0:
                print(f"✅ Removed {deleted} orphaned :{label} node(s).")
            total_deleted += deleted

        print(
            f"\n✅ Cleanup Complete: Successfully removed {total_deleted} total orphaned nodes from Neo4j."
        )

    except Exception as e:
        print(f"❌ Cleanup failed with error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    cleanup_orphaned_neo4j_nodes()