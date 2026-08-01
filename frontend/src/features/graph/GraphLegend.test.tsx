import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GraphLegend } from "./GraphLegend";
import { LEGEND_ENTRIES } from "./edgeStyles";

describe("GraphLegend", () => {
  it("renders the legend title", () => {
    render(<GraphLegend />);

    expect(screen.getByText("Relationship Legend")).toBeInTheDocument();
  });

  it("renders every legend category", () => {
    render(<GraphLegend />);

    LEGEND_ENTRIES.forEach((entry) => {
      expect(screen.getByText(entry.category)).toBeInTheDocument();
    });
  });

  it("renders the correct number of legend items", () => {
    render(<GraphLegend />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(LEGEND_ENTRIES.length);
  });
});