import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  MessageCircleQuestion,
  Network,
  History,
  Upload,
  HelpCircle,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Short description for screen readers / tooltips. */
  description: string;
}

/**
 * Primary navigation, ordered to match the intended UX flow:
 * Dashboard -> Query -> Graph -> History, with Upload and Help
 * as supporting destinations.
 *
 * Labels intentionally avoid technical/graph jargon — this is
 * read by department heads and academic administrators, not
 * engineers.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview of decisions, departments, and outcomes",
  },
  {
    to: "/query",
    label: "Query",
    icon: MessageCircleQuestion,
    description: "Ask about past decisions and get sourced answers",
  },
  {
    to: "/documents",
    label: "Documents",
    icon: Upload,
    description: "Add supporting documents for decision context",
  },
  {
    to: "/graph",
    label: "Graph Explorer",
    icon: Network,
    description: "Visually explore how decisions connect across the institution",
  },
  {
    to: "/history",
    label: "Decision History",
    icon: History,
    description: "Browse and filter past institutional decisions",
  },
];

/** Secondary/support navigation, rendered below the primary list. */
export const SUPPORT_NAV_ITEMS: NavItem[] = [
  {
    to: "/help",
    label: "Help Center",
    icon: HelpCircle,
    description: "Guidance, FAQs, and accessibility information",
  },
];
