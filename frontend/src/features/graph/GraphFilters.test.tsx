import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphFilters } from "./GraphFilters";

describe("GraphFilters", () => {
  const onSearchTermChange = vi.fn();
  const onToggleEntityType = vi.fn();

  function renderComponent() {
    render(
      <GraphFilters
        searchTerm=""
        onSearchTermChange={onSearchTermChange}
        selectedEntityTypes={["decision", "strategy"]}
        onToggleEntityType={onToggleEntityType}
      />
    );
  }

  it("renders the search input", () => {
    renderComponent();

    expect(screen.getByLabelText(/search the graph/i)).toBeInTheDocument();
  });

  it("renders all filter buttons", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: "Decisions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Strategies" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Constraints" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Outcomes" })).toBeInTheDocument();
  });

  it("calls the search callback when typing", async () => {
    const user = userEvent.setup();

    renderComponent();

    const input = screen.getByLabelText(/search the graph/i);

    await user.type(input, "budget");

    expect(onSearchTermChange).toHaveBeenCalled();
  });

  it("calls the toggle callback when clicking a filter", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.click(
      screen.getByRole("button", { name: "Constraints" })
    );

    expect(onToggleEntityType).toHaveBeenCalledWith("constraint");
  });
});