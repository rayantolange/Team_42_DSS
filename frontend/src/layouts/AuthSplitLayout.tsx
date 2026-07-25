import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@components/ui/Logo";
import campusPhoto from "@/assets/campus-library.jpg";

export interface AuthHighlight {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface AuthSplitLayoutProps {
  /** Large headline on the dark panel, e.g. "Enterprise Intelligence Reimagined". */
  title: string;
  /** Supporting copy under the headline. */
  description: string;
  /** Two short feature callouts rendered as glass chips. */
  highlights: [AuthHighlight, AuthHighlight];
  /** The form/content for the right-hand panel. */
  children: ReactNode;
}

/**
 * Shared split-screen shell for every unauthenticated auth screen
 * (login, registration, password recovery). Keeping this in one place
 * means the brand panel, copy rhythm, and footer stay pixel-consistent
 * across all three flows instead of drifting apart over time.
 */
export function AuthSplitLayout({ title, description, highlights, children }: AuthSplitLayoutProps) {
  return (
    <div className="grid h-screen overflow-hidden lg:grid-cols-2">
      {/* Brand / narrative panel — hidden on small screens to keep the form the focus on mobile */}
      <div className="relative h-screen hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <img
          src={campusPhoto}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Navy scrim so the photo reads as a backdrop, not competing with the copy */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-navy-950/95 via-navy-900/90 to-navy-800/80"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-grid-overlay opacity-40" aria-hidden="true" />
        <div
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-violet/20 blur-3xl"
          aria-hidden="true"
        />

        <Link to="/" className="relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-md">
          <Logo variant="light" />
        </Link>

        <div className="relative z-10 flex max-w-md flex-col gap-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">{title}</h1>
          <p className="text-base leading-relaxed text-white/70">{description}</p>

          <div className="mt-2 grid grid-cols-2 gap-3">
            {highlights.map((highlight) => (
              <div
                key={highlight.title}
                className="glass-chip flex flex-col gap-2 p-4 transition-colors duration-200 hover:bg-white/[0.14]"
              >
                <highlight.icon className="h-5 w-5 text-white/90" aria-hidden="true" />
                <p className="text-sm font-semibold text-white">{highlight.title}</p>
                <p className="text-xs leading-snug text-white/60">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/40">
          AES-256 bit encrypted connection · Institutional-grade data protection
        </p>
      </div>

      {/* Form panel */}
      <div className="flex h-screen flex-col overflow-y-auto bg-background">
        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-sm animate-fade-in-up">
            <div className="mb-8 flex justify-center lg:hidden">
              <Logo />
            </div>
            {children}
          </div>
        </div>

        <footer className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nirnaya University Systems. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
