# test_neo4j_connection.py

from app.ai.neo4j_client import run_query, close_driver

try:
    result = run_query("RETURN 'Neo4j connection OK' AS message")
    print(result)
finally:
    close_driver()