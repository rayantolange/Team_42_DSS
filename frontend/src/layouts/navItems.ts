import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  MessageCircleQuestion,
  Network,
  History,
  Vault,
  HelpCircle,
  Users,
  Building2,
  FileText,
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
    to: "/decisions",
    label: "Decisions",
    icon: FileText,
    description: "Create and manage institutional decisions",
  },
  {
    to: "/query",
    label: "Query",
    icon: MessageCircleQuestion,
    description: "Ask about past decisions and get sourced answers",
  },
  {
    to: "/documents",
    label: "My Vault",
    icon: Vault,
    description: "Browse documents, strategies, constraints, and outcomes",
  },
  {
    to: "/graph",
    label: "Graph Explorer",
    icon: Network,
    description:
      "Visually explore how decisions connect across the institution",
  },
  {
    to: "/history",
    label: "Decision History",
    icon: History,
    description: "Browse and filter past institutional decisions",
  },
];

/**
 * Primary navigation for the admin role — technical/system
 * administration only. Admins are not institutional stakeholders
 * and do not see decision, policy, or department analytics data.
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    to: "/admin/users",
    label: "User Management",
    icon: Users,
    description: "View accounts and manage role assignments",
  },
  {
    to: "/admin/departments",
    label: "Department Management",
    icon: Building2,
    description: "Add and edit institutional departments",
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
