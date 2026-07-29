# setup_neo4j_constraints.py

from app.ai.neo4j_client import run_query, close_driver

CONSTRAINTS = [
    "CREATE CONSTRAINT decision_id_unique IF NOT EXISTS FOR (d:Decision) REQUIRE d.decision_id IS UNIQUE",
    "CREATE CONSTRAINT strategy_id_unique IF NOT EXISTS FOR (s:Strategy) REQUIRE s.strategy_id IS UNIQUE",
    "CREATE CONSTRAINT constraint_id_unique IF NOT EXISTS FOR (c:Constraint) REQUIRE c.constraint_id IS UNIQUE",
    "CREATE CONSTRAINT outcome_id_unique IF NOT EXISTS FOR (o:Outcome) REQUIRE o.outcome_id IS UNIQUE",
    "CREATE CONSTRAINT department_id_unique IF NOT EXISTS FOR (dp:Department) REQUIRE dp.department_id IS UNIQUE",
    "CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.user_id IS UNIQUE",
]

try:
    for stmt in CONSTRAINTS:
        run_query(stmt)
        print(f"Applied: {stmt}")
finally:
    close_driver()