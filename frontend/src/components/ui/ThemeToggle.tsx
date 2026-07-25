import { Sun, Moon } from "lucide-react";
import { useTheme } from "@hooks/useTheme";
import { cn } from "@utils/cn";

interface ThemeToggleProps {
  className?: string;
}

/** Animated light/dark toggle: the sun/moon icons cross-fade and rotate. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <Sun
        className={cn(
          "absolute h-[18px] w-[18px] transition-all duration-300",
          isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        )}
        aria-hidden="true"
      />
      <Moon
        className={cn(
          "absolute h-[18px] w-[18px] transition-all duration-300",
          isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
        )}
        aria-hidden="true"
      />
    </button>
  );
}
