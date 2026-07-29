# app/ai/neo4j_client.py

import os
from dotenv import load_dotenv
from neo4j import GraphDatabase, Driver

load_dotenv()

_driver: Driver | None = None


def get_driver() -> Driver:
    global _driver
    if _driver is None:
        uri = os.getenv("NEO4J_URI")
        user = os.getenv("NEO4J_USERNAME")
        password = os.getenv("NEO4J_PASSWORD")

        if not uri or not user or not password:
            raise RuntimeError(
                "Missing Neo4j credentials — check that NEO4J_URI, "
                "NEO4J_USERNAME, and NEO4J_PASSWORD are set in .env"
            )

        _driver = GraphDatabase.driver(uri, auth=(user, password))
    return _driver


def close_driver() -> None:
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None


def run_query(query: str, parameters: dict | None = None) -> list[dict]:
    driver = get_driver()
    with driver.session() as session:
        result = session.run(query, parameters or {})
        return [dict(record) for record in result]