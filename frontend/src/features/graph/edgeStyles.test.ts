import { describe, expect, test } from "vitest";
import {
  getRelationshipStyle,
  DEFAULT_RELATIONSHIP_STYLE,
  RELATIONSHIP_STYLES,
  LEGEND_ENTRIES,
} from "./edgeStyles";

describe("edgeStyles", () => {

  test("returns correct style for applied via relationship", () => {
    const result = getRelationshipStyle("applied via");

    expect(result).toEqual(
      RELATIONSHIP_STYLES["applied via"]
    );
  });


  test("returns correct style for constrained by relationship", () => {
    const result = getRelationshipStyle("constrained by");

    expect(result).toEqual(
      RELATIONSHIP_STYLES["constrained by"]
    );
  });


  test("returns correct style for resulted in relationship", () => {
    const result = getRelationshipStyle("resulted in");

    expect(result).toEqual(
      RELATIONSHIP_STYLES["resulted in"]
    );
  });


  test("returns default style for unknown relationship", () => {
    const result = getRelationshipStyle("unknown");

    expect(result).toEqual(
      DEFAULT_RELATIONSHIP_STYLE
    );
  });


  test("returns default style when relationship is missing", () => {
    const result = getRelationshipStyle();

    expect(result).toEqual(
      DEFAULT_RELATIONSHIP_STYLE
    );
  });


  test("contains all legend entries in correct order", () => {
    expect(LEGEND_ENTRIES).toEqual([
      RELATIONSHIP_STYLES["applied via"],
      RELATIONSHIP_STYLES["constrained by"],
      RELATIONSHIP_STYLES["resulted in"],
    ]);
  });

});