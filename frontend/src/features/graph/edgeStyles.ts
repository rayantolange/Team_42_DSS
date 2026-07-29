/**
 * Maps the raw relationship labels produced by graphDataBuilder
 * ("applied via", "constrained by", "resulted in") onto a small,
 * consistent visual language of edge colors/styles, and gives each
 * a plain-language category name for the on-canvas legend. Kept
 * separate from graphDataBuilder so that file stays focused purely
 * on graph data, not presentation.
 */
export interface RelationshipStyle {
  category: string;
  stroke: string;
  dashed?: boolean;
}

export const RELATIONSHIP_STYLES: Record<string, RelationshipStyle> = {
  "applied via": { category: "Strategy Applied", stroke: "#7c3aed" },
  "constrained by": { category: "Constraint Imposed", stroke: "#b45309" },
  "resulted in": { category: "Outcome Recorded", stroke: "#059669" },
};

export const DEFAULT_RELATIONSHIP_STYLE: RelationshipStyle = {
  category: "Other",
  stroke: "#94a3b8",
  dashed: true,
};

export function getRelationshipStyle(relationship?: string): RelationshipStyle {
  if (!relationship) return DEFAULT_RELATIONSHIP_STYLE;
  return RELATIONSHIP_STYLES[relationship] ?? DEFAULT_RELATIONSHIP_STYLE;
}

/** De-duplicated list of legend entries, in a fixed, meaningful order. */
export const LEGEND_ENTRIES: RelationshipStyle[] = [
  RELATIONSHIP_STYLES["applied via"]!,
  RELATIONSHIP_STYLES["constrained by"]!,
  RELATIONSHIP_STYLES["resulted in"]!,
];
