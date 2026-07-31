"""
Regression tests for the orphaned-embedding citation bug: a citation
whose source_type doesn't match its actually-populated foreign key
(reference_id is None) must be silently skipped, not crash the whole
chat response with a pydantic ValidationError.
"""
from app.ai.graph.nodes import _build_citation, synthesize
from app.models.enums import SourceTypeEnum


def make_result(source_type, reference_id, **overrides):
    base = {
        "source_type": source_type,
        "embedding_id": 1,
        "content": "Some retrieved content that is long enough to slice.",
        "metadata": {},
        "decision_id": None,
        "document_id": None,
        "strategy_id": None,
        "constraint_id": None,
        "outcome_id": None,
    }
    id_field = {
        SourceTypeEnum.decision: "decision_id",
        SourceTypeEnum.strategy: "strategy_id",
        SourceTypeEnum.constraint: "constraint_id",
        SourceTypeEnum.outcome: "outcome_id",
        SourceTypeEnum.document_chunk: "document_id",
    }[source_type]
    base[id_field] = reference_id
    base.update(overrides)
    return base


def test_build_citation_returns_none_for_orphaned_row():
    """The exact bug we found: source_type=outcome but outcome_id=None."""
    orphaned = make_result(SourceTypeEnum.outcome, reference_id=None)
    assert _build_citation(orphaned) is None


def test_build_citation_returns_dict_for_valid_row():
    valid = make_result(SourceTypeEnum.decision, reference_id=42)
    citation = _build_citation(valid)
    assert citation is not None
    assert citation["reference_id"] == 42
    assert citation["source_type"] == SourceTypeEnum.decision


def test_synthesize_skips_orphaned_citations_without_crashing(mocker):
    """End-to-end through synthesize(): one good result, one orphaned
    result — should produce exactly one citation, not raise."""
    mocker.patch(
        "app.ai.graph.nodes.generate_answer",
        return_value="A generated answer.",
    )
    state = {
        "query": "What was decided about the budget?",
        "vector_results": [
            make_result(SourceTypeEnum.decision, reference_id=1, rerank_score=2.0),
            make_result(SourceTypeEnum.outcome, reference_id=None, rerank_score=1.0),
        ],
        "graph_result": None,
    }

    result = synthesize(state)

    assert result["answer"] == "A generated answer."
    assert len(result["citations"]) == 1
    assert result["citations"][0]["reference_id"] == 1


def test_synthesize_returns_fallback_answer_when_nothing_found():
    state = {"query": "Anything about aliens?", "vector_results": [], "graph_result": None}
    result = synthesize(state)
    assert "couldn't find" in result["answer"].lower()
    assert result["citations"] == []
    assert result["confidence_level"] == "low"