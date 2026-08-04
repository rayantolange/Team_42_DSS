import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  HelpCircle,
  Sparkles,
  Menu,
  X,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import {
  NAV_ITEMS,
  ADMIN_NAV_ITEMS,
  SUPPORT_NAV_ITEMS,
  type NavItem,
} from "./navItems";
import { Logo } from "@components/ui/Logo";
import { Button } from "@components/ui/Button";
import { ProfileMenu } from "./ProfileMenu";
import { NotificationPanel } from "./NotificationPanel";
import { HeaderSearch } from "./HeaderSearch";
import { ThemeToggle } from "@components/ui/ThemeToggle";
import { cn } from "@utils/cn";

function navLinkClass({ isActive }: { isActive: boolean }, collapsed: boolean) {
  return cn(
    "group/nav flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
    collapsed && "justify-center px-0",
    isActive
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-foreground/80 hover:translate-x-0.5 hover:bg-accent hover:text-accent-foreground",
    collapsed && !isActive && "hover:translate-x-0",
  );
}

function NavList({
  items,
  onNavigate,
  collapsed = false,
}: {
  items: NavItem[];
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            title={collapsed ? item.label : item.description}
            className={(state) => navLinkClass(state, collapsed)}
            end
            onClick={onNavigate}
          >
            <item.icon
              className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover/nav:scale-110"
              aria-hidden="true"
            />
            {!collapsed && (
              <span className="animate-fade-in">{item.label}</span>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const primaryNavItems = isAdmin ? ADMIN_NAV_ITEMS : NAV_ITEMS;
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem("nirnaya-sidebar-collapsed") === "1",
  );
  useEffect(() => {
    window.localStorage.setItem(
      "nirnaya-sidebar-collapsed",
      isCollapsed ? "1" : "0",
    );
  }, [isCollapsed]);
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!isMobileNavOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileNavOpen]);

  const desktopSidebarBody: ReactNode = (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavList items={primaryNavItems} collapsed={isCollapsed} />
        {!isAdmin && (
          <Button
            onClick={() => navigate("/query")}
            className={cn(
              "mt-5 w-full",
              isCollapsed ? "justify-center px-0" : "justify-start",
            )}
            size="default"
            title={isCollapsed ? "New Analysis" : undefined}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {!isCollapsed && (
              <span className="animate-fade-in">New Analysis</span>
            )}
          </Button>
        )}
      </div>
      <div className="border-t border-border px-3 py-4">
        <NavList items={SUPPORT_NAV_ITEMS} collapsed={isCollapsed} />
        <button
          onClick={logout}
          title={isCollapsed ? "Log out" : undefined}
          className={cn(
            "mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-destructive/10 hover:text-destructive",
            isCollapsed && "justify-center px-0",
          )}
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!isCollapsed && <span className="animate-fade-in">Log out</span>}
        </button>
      </div>
    </>
  );

  const mobileSidebarBody: ReactNode = (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavList
          items={primaryNavItems}
          onNavigate={() => setMobileNavOpen(false)}
        />
        {!isAdmin && (
          <Button
            onClick={() => {
              navigate("/query");
              setMobileNavOpen(false);
            }}
            className="mt-5 w-full justify-start"
            size="default"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            New Analysis
          </Button>
        )}
      </div>
      <div className="border-t border-border px-3 py-4">
        <NavList
          items={SUPPORT_NAV_ITEMS}
          onNavigate={() => setMobileNavOpen(false)}
        />
        <button
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <nav
          aria-label="Primary navigation"
          className={cn(
            "hidden shrink-0 flex-col border-r border-border bg-muted/30 transition-[width] duration-300 ease-in-out md:flex",
            isCollapsed ? "w-[76px]" : "w-64",
          )}
        >
          <div
            className={cn(
              "flex h-16 shrink-0 items-center border-b border-border",
              isCollapsed
                ? "flex-col justify-center gap-2 px-2 py-2"
                : "justify-between px-5",
            )}
          >
            <Logo iconOnly={isCollapsed} />
            <button
              type="button"
              onClick={() => setIsCollapsed((c) => !c)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {desktopSidebarBody}
        </nav>
        {/* Mobile drawer + backdrop */}
        <div
          className={cn(
            "fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-[2px] transition-opacity duration-200 md:hidden",
            isMobileNavOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
          onClick={() => setMobileNavOpen(false)}
          aria-hidden={!isMobileNavOpen}
        />
        <nav
          aria-label="Primary navigation"
          aria-hidden={!isMobileNavOpen}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col border-r border-border bg-card shadow-popover transition-transform duration-300 ease-out md:hidden",
            isMobileNavOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <Logo />
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {mobileSidebarBody}
        </nav>
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {/* Top header */}
          <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <HeaderSearch />
            <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
              <ThemeToggle />
              <NotificationPanel />
              <NavLink
                to="/help"
                aria-label="Help center"
                className="hidden h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
              >
                <HelpCircle className="h-[18px] w-[18px]" aria-hidden="true" />
              </NavLink>
              {user && (
                <div className="border-l border-border pl-2.5 sm:pl-3">
                  <ProfileMenu
                    user={user}
                    onLogout={logout}
                  />
                </div>
              )}
            </div>
          </header>
          <main
            id="main-content"
            key={location.pathname}
            tabIndex={-1}
            className="min-w-0 flex-1 animate-fade-in bg-muted/20 p-4 sm:p-6 lg:p-8"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
