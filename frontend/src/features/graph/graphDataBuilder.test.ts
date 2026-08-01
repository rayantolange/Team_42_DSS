import { describe, it, expect } from "vitest";
import { buildGraphData } from "./graphDataBuilder";

describe("buildGraphData", () => {
  const mockData = {
    decisions: [
      {
        decisionId: 1,
        title: "Improve Student Retention",
        decisionType: "Strategic",
        status: "approved",
      },
    ],

    linksByDecision: {
      1: {
        strategies: [
          {
            strategyId: 10,
            strategyName: "Mentorship Programme",
          },
        ],

        constraints: [
          {
            constraintId: 20,
            constraintType: "budget_limit",
          },
        ],

        outcomes: [
          {
            outcomeId: 30,
            outcomeStatus: "successful",
          },
        ],
      },
    },
  };

  it("creates the correct number of nodes", () => {
    const graph = buildGraphData(mockData);

    expect(graph.nodes).toHaveLength(4);
  });

  it("creates the correct number of edges", () => {
    const graph = buildGraphData(mockData);

    expect(graph.edges).toHaveLength(3);
  });

  it("creates a decision node", () => {
    const graph = buildGraphData(mockData);

    expect(
      graph.nodes.find((n) => n.id === "decision-1")
    ).toBeDefined();
  });

  it("creates a strategy node", () => {
    const graph = buildGraphData(mockData);

    expect(
      graph.nodes.find((n) => n.id === "strategy-10")
    ).toBeDefined();
  });

  it("creates a constraint node", () => {
    const graph = buildGraphData(mockData);

    expect(
      graph.nodes.find((n) => n.id === "constraint-20")
    ).toBeDefined();
  });

  it("creates an outcome node", () => {
    const graph = buildGraphData(mockData);

    expect(
      graph.nodes.find((n) => n.id === "outcome-30")
    ).toBeDefined();
  });

  it("creates relationships between nodes", () => {
    const graph = buildGraphData(mockData);

    expect(graph.edges[0].data?.relationship).toBe("applied via");
    expect(graph.edges[1].data?.relationship).toBe("constrained by");
    expect(graph.edges[2].data?.relationship).toBe("resulted in");
  });
});

