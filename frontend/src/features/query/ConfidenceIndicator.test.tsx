import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfidenceIndicator } from "./ConfidenceIndicator";

describe("ConfidenceIndicator", () => {
  it("renders the high confidence label", () => {
    render(<ConfidenceIndicator score={0.92} level="high" />);

    expect(screen.getByText("High Confidence")).toBeInTheDocument();
  });

  it("renders the correct confidence percentage", () => {
    render(<ConfidenceIndicator score={0.92} level="high" />);

    expect(screen.getByText("92%")).toBeInTheDocument();
  });

  it("sets the correct progress bar value", () => {
    render(<ConfidenceIndicator score={0.92} level="high" />);

    const progressBar = screen.getByRole("progressbar");

    expect(progressBar).toHaveAttribute("aria-valuenow", "92");
  });

  it("renders the confidence description", () => {
    render(<ConfidenceIndicator score={0.92} level="high" />);

    expect(
      screen.getByText(
        "This answer is well-supported by closely matching policy records."
      )
    ).toBeInTheDocument();
  });
});