# app/services/graph_sync_service.py

from typing import Optional

from app.ai.neo4j_client import run_query
from app.models.decision import Decision
from app.models.strategy import Strategy, ConstraintMaster
from app.models.outcome import Outcome
from app.models.department import Department
from app.models.user import User


class GraphSyncService:
    """
    Pushes structured entities into Neo4j as nodes, and their
    relationships as edges. Mirrors EmbeddingService's pattern: called
    inline from each entity service's create/update methods, using
    MERGE for idempotent upserts (create-if-missing, overwrite
    properties if it already exists) rather than blind CREATE, which
    would duplicate nodes on every sync call.

    No db Session needed here — this only talks to Neo4j, never to
    Postgres directly. Callers pass in the already-loaded ORM object.
    """

    # -------------------------------------------------------
    # DECISION
    # -------------------------------------------------------

    def sync_decision(self, decision: Decision) -> None:
        run_query(
            """
            MERGE (d:Decision {decision_id: $decision_id})
            SET d.title = $title,
                d.decision_type = $decision_type,
                d.status = $status,
                d.decision_date = $decision_date
            """,
            {
                "decision_id": decision.decision_id,
                "title": decision.title,
                "decision_type": decision.decision_type,
                "status": decision.status.value,
                "decision_date": (
                    decision.decision_date.isoformat() if decision.decision_date else None
                ),
            },
        )

        # BELONGS_TO — Decision -> Department. Department node is assumed
        # to already exist (synced separately, on department create) —
        # MERGE here matches on department_id only, without a SET clause,
        # so it won't overwrite Department properties if it does exist,
        # and creates a bare placeholder node if it somehow doesn't.
        run_query(
            """
            MATCH (d:Decision {decision_id: $decision_id})
            MERGE (dp:Department {department_id: $department_id})
            MERGE (d)-[:BELONGS_TO]->(dp)
            """,
            {"decision_id": decision.decision_id, "department_id": decision.department_id},
        )

        # CREATED_BY — Decision -> User
        run_query(
            """
            MATCH (d:Decision {decision_id: $decision_id})
            MERGE (u:User {user_id: $user_id})
            MERGE (d)-[:CREATED_BY]->(u)
            """,
            {"decision_id": decision.decision_id, "user_id": decision.created_by},
        )

    def delete_decision(self, decision_id: int) -> None:
        """
        DETACH DELETE removes the node and every relationship touching
        it in one go — needed since Decision is the most connected node
        type (Strategy, Constraint, Outcome, Department, User all link
        to it), and a bare DELETE would fail if any relationship remains.
        """
        run_query(
            "MATCH (d:Decision {decision_id: $decision_id}) DETACH DELETE d",
            {"decision_id": decision_id},
        )

    # -------------------------------------------------------
    # STRATEGY
    # -------------------------------------------------------

    def sync_strategy(self, strategy: Strategy) -> None:
        run_query(
            """
            MERGE (s:Strategy {strategy_id: $strategy_id})
            SET s.strategy_name = $strategy_name
            """,
            {"strategy_id": strategy.strategy_id, "strategy_name": strategy.strategy_name},
        )

    def delete_strategy(self, strategy_id: int) -> None:
        run_query(
            "MATCH (s:Strategy {strategy_id: $strategy_id}) DETACH DELETE s",
            {"strategy_id": strategy_id},
        )

    # -------------------------------------------------------
    # CONSTRAINT
    # -------------------------------------------------------

    def sync_constraint(self, constraint: ConstraintMaster) -> None:
        run_query(
            """
            MERGE (c:Constraint {constraint_id: $constraint_id})
            SET c.constraint_type = $constraint_type
            """,
            {"constraint_id": constraint.constraint_id, "constraint_type": constraint.constraint_type},
        )

    def delete_constraint(self, constraint_id: int) -> None:
        run_query(
            "MATCH (c:Constraint {constraint_id: $constraint_id}) DETACH DELETE c",
            {"constraint_id": constraint_id},
        )

    # -------------------------------------------------------
    # OUTCOME
    # -------------------------------------------------------

    def sync_outcome(self, outcome: Outcome) -> None:
        run_query(
            """
            MERGE (o:Outcome {outcome_id: $outcome_id})
            SET o.outcome_status = $outcome_status,
                o.success_score = $success_score
            """,
            {
                "outcome_id": outcome.outcome_id,
                "outcome_status": outcome.outcome_status.value,
                "success_score": float(outcome.success_score) if outcome.success_score is not None else None,
            },
        )

        # HAS_OUTCOME — Decision -> Outcome
        run_query(
            """
            MATCH (o:Outcome {outcome_id: $outcome_id})
            MATCH (d:Decision {decision_id: $decision_id})
            MERGE (d)-[:HAS_OUTCOME]->(o)
            """,
            {"outcome_id": outcome.outcome_id, "decision_id": outcome.decision_id},
        )

    def delete_outcome(self, outcome_id: int) -> None:
        run_query(
            "MATCH (o:Outcome {outcome_id: $outcome_id}) DETACH DELETE o",
            {"outcome_id": outcome_id},
        )

    # -------------------------------------------------------
    # DEPARTMENT
    # -------------------------------------------------------

    def sync_department(self, department: Department) -> None:
        run_query(
            """
            MERGE (dp:Department {department_id: $department_id})
            SET dp.department_name = $department_name
            """,
            {"department_id": department.department_id, "department_name": department.department_name},
        )

    # -------------------------------------------------------
    # USER
    # -------------------------------------------------------

    def sync_user(self, user: User) -> None:
        run_query(
            """
            MERGE (u:User {user_id: $user_id})
            SET u.full_name = $full_name,
                u.role = $role
            """,
            {"user_id": user.user_id, "full_name": user.full_name, "role": user.role.value},
        )

        # MEMBER_OF — User -> Department
        run_query(
            """
            MATCH (u:User {user_id: $user_id})
            MERGE (dp:Department {department_id: $department_id})
            MERGE (u)-[:MEMBER_OF]->(dp)
            """,
            {"user_id": user.user_id, "department_id": user.department_id},
        )

    # -------------------------------------------------------
    # LINK / UNLINK — junction table edges
    # -------------------------------------------------------

    def link_decision_strategy(self, decision_id: int, strategy_id: int) -> None:
        run_query(
            """
            MATCH (d:Decision {decision_id: $decision_id})
            MATCH (s:Strategy {strategy_id: $strategy_id})
            MERGE (d)-[:USES_STRATEGY]->(s)
            """,
            {"decision_id": decision_id, "strategy_id": strategy_id},
        )

    def unlink_decision_strategy(self, decision_id: int, strategy_id: int) -> None:
        run_query(
            """
            MATCH (d:Decision {decision_id: $decision_id})-[r:USES_STRATEGY]->(s:Strategy {strategy_id: $strategy_id})
            DELETE r
            """,
            {"decision_id": decision_id, "strategy_id": strategy_id},
        )

    def link_decision_constraint(self, decision_id: int, constraint_id: int) -> None:
        run_query(
            """
            MATCH (d:Decision {decision_id: $decision_id})
            MATCH (c:Constraint {constraint_id: $constraint_id})
            MERGE (d)-[:HAS_CONSTRAINT]->(c)
            """,
            {"decision_id": decision_id, "constraint_id": constraint_id},
        )

    def unlink_decision_constraint(self, decision_id: int, constraint_id: int) -> None:
        run_query(
            """
            MATCH (d:Decision {decision_id: $decision_id})-[r:HAS_CONSTRAINT]->(c:Constraint {constraint_id: $constraint_id})
            DELETE r
            """,
            {"decision_id": decision_id, "constraint_id": constraint_id},
        )


def get_graph_sync_service() -> GraphSyncService:
    return GraphSyncService()