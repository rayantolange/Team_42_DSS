import { cn } from "@utils/cn";
import logoMark from "@/assets/logo.png";

interface LogoProps {
  className?: string;
  /** Size of the mark itself, in Tailwind height units. Defaults to h-8. */
  markClassName?: string;
  /** Hide the wordmark and show only the icon (used in collapsed sidebars). */
  iconOnly?: boolean;
  /** Use light text, for placement on dark/navy backgrounds. */
  variant?: "light" | "dark";
}

/**
 * Nirnaya brand mark: the product icon plus wordmark. Reused across the
 * marketing site, auth screens, and the authenticated app shell so the
 * brand presentation stays perfectly consistent everywhere it appears.
 */
export function Logo({ className, markClassName, iconOnly = false, variant = "dark" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src={logoMark}
        alt=""
        aria-hidden="true"
        className={cn("h-8 w-8 shrink-0 select-none object-contain", markClassName)}
      />
      {!iconOnly && (
        <span
          className={cn(
            "text-lg font-bold tracking-tight",
            variant === "light" ? "text-white" : "text-foreground"
          )}
        >
          Nirnaya
        </span>
      )}
    </div>
  );
}
