# app/services/graph_retrieval_service.py

from typing import Optional

from app.ai.neo4j_client import run_query


class GraphRetrievalService:
    """
    Read-only Cypher templates answering multi-hop relationship
    questions the vector store can't. Mirrors GraphSyncService's
    shape (no db Session, wraps run_query), but never writes —
    every method here is a MATCH/RETURN, never MERGE/SET/DELETE.
    """

    # -------------------------------------------------------
    # STRATEGY -> DECISIONS
    # -------------------------------------------------------

    def decisions_by_strategy(self, strategy_id: int) -> list[dict]:
        return run_query(
            """
            MATCH (d:Decision)-[:USES_STRATEGY]->(s:Strategy {strategy_id: $strategy_id})
            RETURN d.decision_id AS decision_id, d.title AS title, d.status AS status
            """,
            {"strategy_id": strategy_id},
        )

    # -------------------------------------------------------
    # CONSTRAINT -> DECISIONS
    # -------------------------------------------------------

    def decisions_by_constraint(self, constraint_id: int) -> list[dict]:
        return run_query(
            """
            MATCH (d:Decision)-[:HAS_CONSTRAINT]->(c:Constraint {constraint_id: $constraint_id})
            RETURN d.decision_id AS decision_id, d.title AS title, d.status AS status
            """,
            {"constraint_id": constraint_id},
        )

    # -------------------------------------------------------
    # SHARED CONSTRAINT -> OTHER DECISIONS
    # -------------------------------------------------------

    def shared_constraint_decisions(self, decision_id: int) -> list[dict]:
        return run_query(
            """
            MATCH (d1:Decision {decision_id: $decision_id})-[:HAS_CONSTRAINT]->(c:Constraint)
                  <-[:HAS_CONSTRAINT]-(d2:Decision)
            WHERE d2.decision_id <> $decision_id
            RETURN DISTINCT d2.decision_id AS decision_id, d2.title AS title,
                   c.constraint_id AS shared_constraint_id, c.constraint_type AS shared_constraint_type
            """,
            {"decision_id": decision_id},
        )

    # -------------------------------------------------------
    # DEPARTMENT -> DECISIONS + OUTCOMES
    # -------------------------------------------------------

    def department_decisions_with_outcomes(self, department_id: int) -> list[dict]:
        return run_query(
            """
            MATCH (d:Decision)-[:BELONGS_TO]->(dp:Department {department_id: $department_id})
            OPTIONAL MATCH (d)-[:HAS_OUTCOME]->(o:Outcome)
            RETURN d.decision_id AS decision_id, d.title AS title,
                   o.outcome_id AS outcome_id, o.outcome_status AS outcome_status,
                   o.success_score AS success_score
            """,
            {"department_id": department_id},
        )

    # -------------------------------------------------------
    # USER -> DECISIONS
    # -------------------------------------------------------

    def user_decisions(self, user_id: int) -> list[dict]:
        return run_query(
            """
            MATCH (d:Decision)-[:CREATED_BY]->(u:User {user_id: $user_id})
            RETURN d.decision_id AS decision_id, d.title AS title, d.status AS status
            """,
            {"user_id": user_id},
        )

    # -------------------------------------------------------
    # STRATEGY -> SUCCESS RATE (aggregate)
    # -------------------------------------------------------

    def strategy_success_rate(self, strategy_id: int) -> Optional[dict]:
        result = run_query(
            """
            MATCH (d:Decision)-[:USES_STRATEGY]->(s:Strategy {strategy_id: $strategy_id})
            MATCH (d)-[:HAS_OUTCOME]->(o:Outcome)
            RETURN s.strategy_name AS strategy_name,
                   count(o) AS total_outcomes,
                   sum(CASE WHEN o.outcome_status = 'successful' THEN 1 ELSE 0 END) AS successful_count,
                   avg(o.success_score) AS avg_success_score
            """,
            {"strategy_id": strategy_id},
        )
        return result[0] if result else None


def get_graph_retrieval_service() -> GraphRetrievalService:
    return GraphRetrievalService()