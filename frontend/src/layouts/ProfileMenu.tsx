import { Link } from "react-router-dom";
import { Settings, HelpCircle, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@components/ui/DropdownMenu";
import { ROLE_LABELS } from "@/types/domain";
import type { AuthUser } from "@store/authStore";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface ProfileMenuProps {
  user: AuthUser;
  isAdmin: boolean;
  onLogout: () => void;
}

/**
 * Header avatar + animated profile dropdown. Clicking the avatar
 * (or the chevron next to it) opens the menu; there's no backend
 * profile-editing endpoint yet, so this links to Settings/Help and
 * exposes Log out — everything a real profile menu needs before a
 * dedicated "edit profile" flow exists.
 */
export function ProfileMenu({ user, isAdmin, onLogout }: ProfileMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Open profile menu for ${user.name}`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials(user.name)}
          </div>
          <div className="hidden text-left leading-tight sm:block">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
          <ChevronDown
            className="hidden h-3.5 w-3.5 text-muted-foreground sm:block"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-2.5 py-2">
          <span className="text-sm font-semibold text-foreground">
            {user.name}
          </span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/help">
            <HelpCircle
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            Help Center
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={onLogout}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
