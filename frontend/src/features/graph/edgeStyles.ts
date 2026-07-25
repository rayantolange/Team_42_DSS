/**
 * Maps the raw relationship labels produced by graphDataBuilder
 * ("governs", "required by", …) onto a small, consistent visual
 * language of edge colors/styles, and gives each a plain-language
 * category name for the on-canvas legend. Kept separate from
 * graphDataBuilder so that file stays focused purely on graph data,
 * not presentation.
 */
export interface RelationshipStyle {
  category: string;
  stroke: string;
  dashed?: boolean;
}

export const RELATIONSHIP_STYLES: Record<string, RelationshipStyle> = {
  governs: { category: "Primary Authority", stroke: "#2563eb" },
  "applied in": { category: "Active Collaboration", stroke: "#059669" },
  "required by": { category: "Regulatory Oversight", stroke: "#b45309" },
  "resulted in": { category: "Implicit Link", stroke: "#94a3b8", dashed: true },
};

export const DEFAULT_RELATIONSHIP_STYLE: RelationshipStyle = {
  category: "Implicit Link",
  stroke: "#94a3b8",
  dashed: true,
};

export function getRelationshipStyle(relationship?: string): RelationshipStyle {
  if (!relationship) return DEFAULT_RELATIONSHIP_STYLE;
  return RELATIONSHIP_STYLES[relationship] ?? DEFAULT_RELATIONSHIP_STYLE;
}

/** De-duplicated list of legend entries, in a fixed, meaningful order. */
export const LEGEND_ENTRIES: RelationshipStyle[] = [
  RELATIONSHIP_STYLES.governs!,
  RELATIONSHIP_STYLES["applied in"]!,
  RELATIONSHIP_STYLES["required by"]!,
  RELATIONSHIP_STYLES["resulted in"]!,
];
