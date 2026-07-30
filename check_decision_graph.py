# check_decision_2_graph.py

from app.ai.neo4j_client import run_query, close_driver

try:
    result = run_query(
        """
        MATCH (d:Decision {decision_id: 20})-[r]->(n)
        RETURN type(r) AS relationship, labels(n) AS node_labels, n
        """
    )
    for row in result:
        print(row)
finally:
    close_driver()