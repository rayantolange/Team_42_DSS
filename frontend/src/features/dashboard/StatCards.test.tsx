import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Activity } from "lucide-react";
import { StatCards } from "./StatCards";
import type { StatCardDef } from "./StatCards";

// Mock the animation hook so values don't animate during testing
vi.mock("@hooks/useCountUp", () => ({
  useCountUp: (value: number) => value,
}));

describe("StatCards", () => {
  const stats: StatCardDef[] = [
    {
      label: "Total Decisions",
      value: "15",
      numericValue: 15,
      icon: Activity,
      tint: "bg-blue-100",
      accent: "#2563eb",
    },
    {
      label: "Positive Outcome Rate",
      value: "100%",
      numericValue: 100,
      suffix: "%",
      icon: Activity,
      tint: "bg-green-100",
      accent: "#16a34a",
      trend: {
        direction: "up",
        label: "5%",
        isGood: true,
      },
    },
  ];

  it("renders statistic labels", () => {
    render(<StatCards stats={stats} />);

    expect(screen.getByText("Total Decisions")).toBeInTheDocument();
    expect(screen.getByText("Positive Outcome Rate")).toBeInTheDocument();
  });

  it("renders statistic values", () => {
    render(<StatCards stats={stats} />);

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("renders trend indicator", () => {
    render(<StatCards stats={stats} />);

    expect(screen.getByText("5%")).toBeInTheDocument();
  });
    it("renders fallback value when numericValue is missing", () => {
    const fallbackStat: StatCardDef[] = [
      {
        label: "Pending Decisions",
        value: "42",
        icon: Activity,
        tint: "bg-yellow-100",
        accent: "#eab308",
      },
    ];

    render(<StatCards stats={fallbackStat} />);

    expect(screen.getByText("42")).toBeInTheDocument();
  });


  it("renders live badge when stat is live", () => {
    const liveStat: StatCardDef[] = [
      {
        label: "Active Monitoring",
        value: "10",
        numericValue: 10,
        icon: Activity,
        tint: "bg-green-100",
        accent: "#16a34a",
        live: true,
      },
    ];

    render(<StatCards stats={liveStat} />);

    expect(screen.getByText("Live")).toBeInTheDocument();
  });


  it("renders downward trend indicator", () => {
    const negativeTrendStat: StatCardDef[] = [
      {
        label: "Failed Decisions",
        value: "3",
        numericValue: 3,
        icon: Activity,
        tint: "bg-red-100",
        accent: "#dc2626",
        trend: {
          direction: "down",
          label: "10%",
          isGood: false,
        },
      },
    ];

    render(<StatCards stats={negativeTrendStat} />);

    expect(screen.getByText("10%")).toBeInTheDocument();
  });
});