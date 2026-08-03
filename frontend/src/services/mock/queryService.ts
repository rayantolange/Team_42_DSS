  import { POLICIES, getDepartmentById } from "@/data/datasetLoader";
  import { getDecisionsByPolicy } from "@/data/decisionGenerator";
  import type { Policy } from "@/types/domain";
  import type { QueryResult, QuerySource, ConfidenceLevel } from "@/types/api";
  import { mockDelay, maybeThrowMockError } from "./mockUtils";

  /**
   * Mock RAG pipeline standing in for the real FastAPI + LangGraph +
   * pgvector backend. Performs naive keyword scoring against policy
   * text fields to rank "retrieved" sources, then synthesizes a
   * templated answer. This is intentionally simple — its only job is
   * to give the Query Interface real, varied data to render (answer,
   * sources, confidence) so the UI's explainability features (source
   * cards, confidence indicator) can be built and reviewed against
   * realistic content before the real retrieval pipeline is wired in.
   */

  function scorePolicyAgainstQuery(policy: Policy, queryTerms: string[]): number {
    const haystack = [
      policy.title,
      policy.category,
      policy.description,
      policy.scope,
      policy.decisionContext,
      ...policy.constraints,
      ...policy.relatedEntities,
      ...policy.legalBasis,
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    for (const term of queryTerms) {
      if (term.length < 3) continue;
      const occurrences = haystack.split(term).length - 1;
      score += occurrences;
    }
    return score;
  }

  function buildSnippet(policy: Policy): string {
    return policy.description;
  }

  function confidenceFromScores(topScores: number[]): { score: number; level: ConfidenceLevel } {
    if (topScores.length === 0 || topScores[0] === 0) {
      return { score: 0.15, level: "low" };
    }
    const top = topScores[0] ?? 0;
    const second = topScores[1] ?? 0;
    // Confidence reflects both absolute match strength and how much the
    // top result "stands out" from the next-best one.
    const separation = top > 0 ? (top - second) / top : 0;
    const raw = Math.min(0.95, 0.4 + top * 0.05 + separation * 0.3);

    let level: ConfidenceLevel = "low";
    if (raw >= 0.75) level = "high";
    else if (raw >= 0.5) level = "medium";

    return { score: Math.round(raw * 100) / 100, level };
  }

  function synthesizeAnswer(queryText: string, topPolicies: Policy[]): string {
    if (topPolicies.length === 0) {
      return `I couldn't find a policy directly addressing "${queryText}". Try rephrasing your question, or browse Decision History to explore related institutional decisions.`;
    }

    const primary = topPolicies[0];
    if (!primary) {
      return `I couldn't find a policy directly addressing "${queryText}".`;
    }
    const dept = getDepartmentById(primary.departmentId);
    const deptName = dept?.name ?? primary.departmentId;

    const otherTitles = topPolicies
      .slice(1, 3)
      .map((p) => p.title)
      .join("; ");

    let answer = `Based on the ${deptName}'s "${primary.title}" (${primary.id}), ${primary.description.charAt(0).toLowerCase()}${primary.description.slice(1)}`;

    if (primary.constraints.length > 0) {
      answer += ` Key constraints include: ${primary.constraints[0]}`;
    }

    if (otherTitles) {
      answer += ` Related policies that may also be relevant: ${otherTitles}.`;
    }

    return answer;
  }

  export async function submitQuery(queryText: string, departmentId?: string): Promise<QueryResult> {
    await mockDelay(900); // RAG pipelines are slower than simple CRUD reads
    maybeThrowMockError("submitQuery");

    const queryTerms = queryText
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    let candidatePolicies = POLICIES;
    if (departmentId) {
      candidatePolicies = candidatePolicies.filter((p) => p.departmentId === departmentId);
    }

    const scored = candidatePolicies
      .map((policy) => ({ policy, score: scorePolicyAgainstQuery(policy, queryTerms) }))
      .sort((a, b) => b.score - a.score);

    const topMatches = scored.filter((s) => s.score > 0).slice(0, 4);
    const topPolicies = topMatches.map((m) => m.policy);

    const sources: QuerySource[] = topMatches.map((m, idx) => ({
      id: `${m.policy.id}-SRC`,
      title: `${m.policy.title} (${m.policy.id})`,
      snippet: buildSnippet(m.policy),
      policyId: m.policy.id,
      relevanceScore: Math.max(0.3, Math.min(0.98, 1 - idx * 0.18)),
    }));

    const { score: confidenceScore, level: confidenceLevel } = confidenceFromScores(
      topMatches.map((m) => m.score)
    );

    const relatedDecisions = topPolicies.flatMap((p) => getDecisionsByPolicy(p.id)).slice(0, 5);

    return {
      id: `QR-${Date.now()}`,
      queryText,
      answer: synthesizeAnswer(queryText, topPolicies),
      sources,
      confidenceScore,
      confidenceLevel,
      relatedDecisions,
      createdAt: new Date().toISOString(),
    };
  }
