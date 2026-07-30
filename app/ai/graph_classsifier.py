# app/ai/graph_classifier.py

import json
from typing import Optional, TypedDict

from app.ai.llm_client import generate_json_completion


class GraphClassification(TypedDict):
    template: str
    entity_name: str


# Single source of truth: template name -> what kind of entity it needs
# resolved, and a plain-English description used to build the prompt.
GRAPH_TEMPLATES = {
    "decisions_by_strategy": {
        "entity_type": "strategy",
        "description": "Find decisions that used a specific strategy.",
    },
    "decisions_by_constraint": {
        "entity_type": "constraint",
        "description": "Find decisions affected by a specific constraint.",
    },
    "shared_constraint_decisions": {
        "entity_type": "decision",
        "description": "Find other decisions that share a constraint with a specific decision.",
    },
    "department_decisions_with_outcomes": {
        "entity_type": "department",
        "description": "Find decisions and their outcomes for a specific department.",
    },
    "user_decisions": {
        "entity_type": "user",
        "description": "Find decisions created by a specific user.",
    },
    "strategy_success_rate": {
        "entity_type": "strategy",
        "description": "Compute how successful decisions using a specific strategy have been.",
    },
}


def _build_system_prompt() -> str:
    template_lines = "\n".join(
        f'- "{name}": {info["description"]} (needs a {info["entity_type"]} name)'
        for name, info in GRAPH_TEMPLATES.items()
    )

    return f"""You classify user questions for a decision-support system that has
two ways to answer questions: semantic search over document/decision text,
and a knowledge graph for relationship questions.

Known relationship-question templates:
{template_lines}

If the question clearly matches one of these templates, respond with ONLY
this JSON (no markdown, no explanation):
{{"template": "<template_name>", "entity_name": "<name mentioned in the question>"}}

If the question does NOT match any template — e.g. it's a general question
best answered by searching document/decision text — respond with ONLY:
{{"template": "none"}}

entity_name should be the specific name/title mentioned in the question,
extracted as written (e.g. "Q3 travel budget decision", "remote work
strategy", "Finance Department") — not a database ID, just the natural
language name to be resolved separately."""


def classify_query(question: str) -> Optional[GraphClassification]:
    """
    Returns a GraphClassification if the question matches a known graph
    template, or None if it doesn't (meaning: fall back to vector search
    only, don't force a graph lookup that doesn't apply).
    """
    system_prompt = _build_system_prompt()

    raw = generate_json_completion(system_prompt, question)

    try:
        parsed = json.loads(raw.strip())
    except (json.JSONDecodeError, AttributeError):
        # Model didn't return valid JSON — fail safe to "no graph match"
        # rather than crashing the whole pipeline over a malformed reply.
        return None

    template = parsed.get("template")

    if template == "none" or template not in GRAPH_TEMPLATES:
        return None

    entity_name = parsed.get("entity_name")
    if not entity_name:
        return None

    return {"template": template, "entity_name": entity_name}