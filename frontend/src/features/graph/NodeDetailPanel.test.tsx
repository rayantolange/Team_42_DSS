import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NodeDetailPanel } from "./NodeDetailPanel";

// Mock useDecision hook
const mockUseDecision = vi.fn();

vi.mock("@features/decisions/useDecisions", () => ({
  useDecision: () => mockUseDecision(),
}));

beforeEach(() => {
  mockUseDecision.mockReturnValue({
    data: {
      decisionId: 42,
      status: "approved",
      decisionType: "Strategic",
      problemStatement: "Improve student retention",
      decisionDesc: "Introduce mentoring programme",
    },
    isLoading: false,
  });
});

describe("NodeDetailPanel", () => {
    it("renders strategy node details", () => {
  render(
    <MemoryRouter>
      <NodeDetailPanel
        node={{
          data: {
            entityId: "1",
            entityType: "strategy",
            label: "Student Support Strategy",
          },
        }}
        onClose={vi.fn()}
      />
    </MemoryRouter>
  );

  expect(
    screen.getByText(/this strategy is applied across/i)
  ).toBeInTheDocument();
});
    it("renders constraint node details", () => {
  render(
    <MemoryRouter>
      <NodeDetailPanel
        node={{
          data: {
            entityId: "2",
            entityType: "constraint",
            label: "Budget Constraint",
          },
        }}
        onClose={vi.fn()}
      />
    </MemoryRouter>
  );

  expect(
    screen.getByText(/this constraint limits/i)
  ).toBeInTheDocument();
});
it("renders outcome status badge", () => {
  render(
    <MemoryRouter>
      <NodeDetailPanel
        node={{
          data: {
            entityId: "3",
            entityType: "outcome",
            label: "Successful Outcome",
            status: "successful",
          },
        }}
        onClose={vi.fn()}
      />
    </MemoryRouter>
  );

  expect(screen.getByText("Status")).toBeInTheDocument();
  expect(screen.getByText("successful")).toBeInTheDocument();
});

  it("renders placeholder when no node is selected", () => {
    render(
      <MemoryRouter>
        <NodeDetailPanel node={null} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/select a node in the graph/i)
    ).toBeInTheDocument();
  });

  it("renders decision node details", () => {
    render(
      <MemoryRouter>
        <NodeDetailPanel
          node={{
            data: {
              entityId: "42",
              entityType: "decision",
              label: "Student Retention",
            },
          }}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Student Retention")).toBeInTheDocument();
    expect(screen.getByText("Strategic")).toBeInTheDocument();
    expect(
      screen.getByText("Improve student retention")
    ).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <MemoryRouter>
        <NodeDetailPanel
          node={{
            data: {
              entityId: "42",
              entityType: "decision",
              label: "Student Retention",
            },
          }}
          onClose={onClose}
        />
      </MemoryRouter>
    );

    await user.click(
      screen.getByRole("button", { name: /close detail panel/i })
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });
     it("uses fallback badge style for unknown decision status", () => {
  mockUseDecision.mockReturnValueOnce({
    data: {
      decisionId: 42,
      status: "unknown_status",
      decisionType: "Strategic",
      problemStatement: "Test problem",
      decisionDesc: "Test description",
    },
    isLoading: false,
  });

  render(
    <MemoryRouter>
      <NodeDetailPanel
        node={{
          data: {
            entityId: "42",
            entityType: "decision",
            label: "Unknown Status Decision",
          },
        }}
        onClose={vi.fn()}
      />
    </MemoryRouter>
  );

  expect(
    screen.getByText("unknown_status")
  ).toBeInTheDocument();
});
});