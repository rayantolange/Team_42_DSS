import { POLICIES } from "./datasetLoader";
import type { Decision, DecisionStatus, OutcomeSentiment } from "@/types/domain";

/**
 * Simple deterministic PRNG (mulberry32) so mock data is stable across
 * reloads/tests instead of regenerating random values on every call.
 */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260101);

function pick<T>(arr: T[]): T {
  const item = arr[Math.floor(rng() * arr.length)];
  if (item === undefined) {
    throw new Error("pick() called on empty array");
  }
  return item;
}

function sentimentToStatus(sentiment: OutcomeSentiment): DecisionStatus {
  switch (sentiment) {
    case "positive":
      return rng() > 0.5 ? "approved" : "implemented";
    case "negative":
      return rng() > 0.5 ? "rejected" : "under_review";
    case "neutral":
      return "deferred";
  }
}

function randomDateWithinLastYears(years: number): Date {
  const now = new Date("2026-06-19T00:00:00Z").getTime();
  const past = now - years * 365 * 24 * 60 * 60 * 1000;
  const t = past + rng() * (now - past);
  return new Date(t);
}

/**
 * Generates a pool of simulated historical "decision" events by
 * sampling each policy's defined outcomes. Each policy gets 2-4
 * generated decisions so Dashboard/History/Graph have enough volume
 * to filter, sort, and chart meaningfully.
 *
 * This is mock data standing in for what would, in the real system,
 * come from the Neo4j-backed decision log. Generation is
 * deterministic (seeded RNG) so the same dataset renders consistently
 * across reloads.
 */
function generateDecisions(): Decision[] {
  const decisions: Decision[] = [];

  for (const policy of POLICIES) {
    const count = 2 + Math.floor(rng() * 3); // 2-4 decisions per policy

    for (let i = 0; i < count; i++) {
      const outcome = pick(policy.outcomes);
      const status = sentimentToStatus(outcome.sentiment);
      const dateCreated = randomDateWithinLastYears(3);
      const resolvesAfterDays = 3 + Math.floor(rng() * 45);
      const dateResolved = new Date(
        dateCreated.getTime() + resolvesAfterDays * 24 * 60 * 60 * 1000
      );

      decisions.push({
        id: `${policy.id}-DEC-${String(i + 1).padStart(3, "0")}`,
        policyId: policy.id,
        departmentId: policy.departmentId,
        title: `${policy.title} — ${outcome.label}`,
        summary: outcome.action,
        status,
        dateCreated: dateCreated.toISOString(),
        dateResolved:
          dateResolved.getTime() <= Date.now() ? dateResolved.toISOString() : undefined,
        outcomeLabel: outcome.label,
        outcomeSentiment: outcome.sentiment,
        tags: [policy.category],
        documentIds: [],
      });
    }
  }

  // Stable sort, most recent first
  return decisions.sort(
    (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
  );
}

export const DECISIONS: Decision[] = generateDecisions();

export function getDecisionById(id: string): Decision | undefined {
  return DECISIONS.find((d) => d.id === id);
}

export function getDecisionsByDepartment(departmentId: string): Decision[] {
  return DECISIONS.filter((d) => d.departmentId === departmentId);
}

export function getDecisionsByPolicy(policyId: string): Decision[] {
  return DECISIONS.filter((d) => d.policyId === policyId);
}
