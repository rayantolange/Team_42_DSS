import rawData from "./policies.seed.json";
import type { Department, Policy, OutcomeSentiment } from "@/types/domain";

/**
 * Typed accessors for the seed dataset (policies.seed.json), which is
 * a structured transcription of the team's
 * "Simulated College Institutional Policy Dataset" (Nepal Higher
 * Education context, 8 departments, 30 policy records).
 *
 * Importing JSON directly gives us values typed as the JSON's
 * inferred shape; we re-assert against our domain types here so the
 * rest of the app gets properly typed Department/Policy objects in
 * one place.
 */

interface RawDataset {
  departments: Department[];
  policies: Array<Omit<Policy, "outcomes"> & {
    outcomes: Array<{ label: string; sentiment: OutcomeSentiment; action: string }>;
  }>;
}

const dataset = rawData as unknown as RawDataset;

export const DEPARTMENTS: Department[] = dataset.departments;
export const POLICIES: Policy[] = dataset.policies;

export function getDepartmentById(id: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}

export function getPolicyById(id: string): Policy | undefined {
  return POLICIES.find((p) => p.id === id);
}

export function getPoliciesByDepartment(departmentId: string): Policy[] {
  return POLICIES.filter((p) => p.departmentId === departmentId);
}

/** All distinct legal/regulatory references cited across the dataset. */
export function getAllRegulationNames(): string[] {
  const set = new Set<string>();
  for (const policy of POLICIES) {
    for (const basis of policy.legalBasis) {
      set.add(basis);
    }
  }
  return Array.from(set).sort();
}
