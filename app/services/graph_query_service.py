# app/services/graph_query_service.py

from typing import Optional

from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.user import User
from app.models.enums import SourceTypeEnum
from app.services.embedding_service import EmbeddingService
from app.services.graph_retrieval_service import GraphRetrievalService
from app.ai.graph_classifier import classify_query, GRAPH_TEMPLATES

# entity_type -> which id field to pull off an embedding search result
ENTITY_ID_FIELD = {
    "decision": "decision_id",
    "strategy": "strategy_id",
    "constraint": "constraint_id",
}


class GraphQueryService:
    """
    Orchestrates the full graph-query path: classify the question against
    known Cypher templates, resolve the mentioned entity name to a real
    ID, then call the matching GraphRetrievalService method.

    Returns None at any stage that doesn't resolve cleanly — a
    non-matching question, an entity name that can't be found, etc. —
    so the caller can simply fall back to vector-only retrieval rather
    than needing to handle a dozen distinct failure modes itself.
    """

    def __init__(self, db: Session):
        self.db = db
        self.embedding_service = EmbeddingService(db)
        self.graph_retrieval_service = GraphRetrievalService()

    def run(self, question: str, current_user: User) -> Optional[dict]:
        classification = classify_query(question)
        if classification is None:
            return None

        template = classification["template"]
        entity_name = classification["entity_name"]
        entity_type = GRAPH_TEMPLATES[template]["entity_type"]

        entity_id = self._resolve_entity(entity_type, entity_name, current_user)
        if entity_id is None:
            return None

        method = getattr(self.graph_retrieval_service, template)
        results = method(entity_id)

        if not results:
            return None

        return {
            "template": template,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "results": results,
        }

    def _resolve_entity(
        self, entity_type: str, entity_name: str, current_user: User
    ) -> Optional[int]:
        # Decision/Strategy/Constraint already have embeddings — reuse
        # vector search rather than building separate fuzzy-name lookup
        # logic. Top match wins; department/admin access filtering in
        # search() applies here too, same as it does for RAG retrieval.
        if entity_type in ("decision", "strategy", "constraint"):
            matches = self.embedding_service.search(
                query_text=entity_name,
                current_user=current_user,
                source_types=[SourceTypeEnum(entity_type)],
                top_k=1,
            )
            if not matches:
                return None
            return matches[0][ENTITY_ID_FIELD[entity_type]]

        # Department/User have no embeddings — direct case-insensitive
        # name match against Postgres. Simplification: takes the first
        # match, no ranking/disambiguation if multiple departments/users
        # share a similar name.
        if entity_type == "department":
            dept = (
                self.db.query(Department)
                .filter(Department.department_name.ilike(f"%{entity_name}%"))
                .first()
            )
            return dept.department_id if dept else None

        if entity_type == "user":
            user = (
                self.db.query(User)
                .filter(User.full_name.ilike(f"%{entity_name}%"))
                .first()
            )
            return user.user_id if user else None

        return None


def get_graph_query_service(db: Session) -> GraphQueryService:
    return GraphQueryService(db)