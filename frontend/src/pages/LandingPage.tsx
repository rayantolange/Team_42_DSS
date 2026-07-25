import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Network,
  FileSearch,
  ShieldCheck,
  GitBranch,
  CheckCircle2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@components/ui/Button";
import { Logo } from "@components/ui/Logo";
import lectureImg from "@/assets/classroom-lecture.jpg";
import libraryImg from "@/assets/campus-library.jpg";

const FEATURES = [
  {
    icon: BarChart3,
    tint: "bg-blue-100 text-blue-700",
    title: "Data-Driven Insights",
    description:
      "Transform raw administrative metrics into predictive models. Identify trends in student success and resource allocation before they become challenges.",
  },
  {
    icon: Network,
    tint: "bg-violet-100 text-violet-700",
    title: "Knowledge Graph Exploration",
    description:
      "Understand the complex web of academic relationships. Map faculty expertise, course dependencies, and research impact across the entire university ecosystem.",
  },
  {
    icon: FileSearch,
    tint: "bg-emerald-100 text-emerald-700",
    title: "Seamless Document Ingestion",
    description:
      "Upload policy documents, accreditation reports, and meeting minutes. Our RAG engine makes your institutional memory instantly searchable and conversational.",
  },
];

const EDGE_POINTS = [
  {
    icon: ShieldCheck,
    title: "Institutional Trust",
    description: "Secure, private, and compliant with academic data regulations.",
  },
  {
    icon: GitBranch,
    title: "Interdisciplinary Mapping",
    description: "Break down silos with cross-departmental knowledge graphs.",
  },
];

const NAV_LINKS = [
  { label: "Home", href: "#top" },
  { label: "Features", href: "#features" },
  { label: "Documentation", href: "#edge" },
];

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: ["Features", "Knowledge Graph", "Document Intelligence", "Security"],
  },
  {
    heading: "Company",
    links: ["About Nirnaya", "Careers", "Partner Institutions", "Contact"],
  },
  {
    heading: "Resources",
    links: ["Documentation", "API Reference", "Support Center", "Status"],
  },
];

export default function LandingPage() {
  return (
    <div id="top" className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-200 hover:after:w-full"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-spotlight">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Institutional Intelligence Platform
            </span>
            <h1 className="mt-6 text-[2.75rem] font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              <span className="text-primary">See Deeper.</span>{" "}
              <span className="text-foreground">Decide Better.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Advanced university decision support powered by Knowledge Graphs and
              Retrieval-Augmented Generation (RAG).
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="group">
                <Link to="/register">
                  Get Started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#features">Learn More</a>
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-6 border-t border-border/70 pt-6 text-sm text-muted-foreground">
              <div>
                <p className="text-xl font-bold text-foreground">12+</p>
                <p>Departments unified</p>
              </div>
              <div className="h-8 w-px bg-border" aria-hidden="true" />
              <div>
                <p className="text-xl font-bold text-foreground">1.2s</p>
                <p>Avg. query response</p>
              </div>
              <div className="h-8 w-px bg-border" aria-hidden="true" />
              <div>
                <p className="text-xl font-bold text-foreground">99.9%</p>
                <p>Platform uptime</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg animate-fade-in">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border shadow-popover">
              <img
                src={lectureImg}
                alt="A professor leading an engaged classroom discussion with university students"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Floating stat card overlapping the photo — signals a "designed", not templated, layout */}
            <div className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-popover sm:-left-10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                <TrendingUp className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">+18% positive outcomes</p>
                <p className="mt-1 text-xs text-muted-foreground">Since adopting Nirnaya</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="border-t border-border bg-muted/30 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center gap-2">
              <Badge>V2.4 Stable</Badge>
              <Badge>Enterprise Grade</Badge>
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-[2.25rem]">
              Engineered for Academic Rigor
            </h2>
            <p className="mt-3 text-muted-foreground">
              Nirnaya bridges the gap between massive institutional data silos and actionable
              leadership insights.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-card-hover"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-lg ${feature.tint} transition-transform duration-300 group-hover:scale-110`}
                >
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100"
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nirnaya Edge */}
      <section id="edge" className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              The Nirnaya Edge
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-[2.25rem]">
              Enlightened Intelligence for University Leaders
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Built alongside registrars, provosts, and department heads to fit how institutions
              actually make decisions — not a generic analytics dashboard.
            </p>
            <ul className="mt-8 flex flex-col gap-6">
              {EDGE_POINTS.map((point) => (
                <li key={point.title} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">{point.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{point.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-popover">
            <img
              src={libraryImg}
              alt="Students studying together in a bright university library"
              className="h-full w-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-900/40 to-transparent"
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-3 p-5">
              {EDGE_POINTS.map((point) => (
                <div key={point.title} className="glass-chip flex flex-col gap-2 p-4">
                  <point.icon className="h-5 w-5 text-white" aria-hidden="true" />
                  <p className="text-sm font-semibold text-white">{point.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Institutional intelligence for university leaders — knowledge graphs and
                retrieval-augmented decision support in one secure platform.
              </p>
            </div>
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="text-sm font-semibold">{col.heading}</p>
                <ul className="mt-3.5 flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Nirnaya University Systems. All rights reserved.
            </p>
            <div className="flex gap-5 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Badge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}
