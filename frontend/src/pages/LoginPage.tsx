import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Database, ShieldCheck, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@components/ui/Button";
import { useLogin } from "@features/auth/useLogin";
import { getDemoAccounts } from "@services/index";
import { AuthSplitLayout } from "@layouts/AuthSplitLayout";

/**
 * Login page. Not wrapped by AppLayout (no nav needed pre-auth).
 * Demo accounts are listed since this prototype uses a mock auth
 * service rather than the team's real FastAPI JWT endpoint.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const loginMutation = useLogin();
  const demoAccounts = getDemoAccounts();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  }

  return (
    <AuthSplitLayout
      title="Powering Institutional Decision Support."
      description="Access real-time analytics, predictive modeling, and enterprise-grade data management in one secure environment."
      highlights={[
        {
          icon: Database,
          title: "Unified Data",
          description: "Cross-departmental semantic data integration.",
        },
        {
          icon: ShieldCheck,
          title: "Gov-Grade Security",
          description: "Encrypted institutional authentication protocols.",
        },
      ]}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Please enter your institutional credentials to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Institutional Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ruby@iimscollege.edu.np"
            className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm shadow-sm transition-shadow placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">Must be a verified .edu or .gov domain.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3.5 pr-10 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          Remember this device for 30 days
        </label>

        {loginMutation.isError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {loginMutation.error instanceof Error
                ? loginMutation.error.message
                : "Unable to sign in. Please try again."}
            </span>
          </div>
        )}

        <Button type="submit" size="lg" isLoading={loginMutation.isPending} className="mt-1">
          {loginMutation.isPending ? "Signing in…" : "Log in"}
          {!loginMutation.isPending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </Button>

        <div className="relative my-1 flex items-center">
          <div className="h-px flex-1 bg-border" />
          <span className="px-3 text-xs text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button type="button" variant="outline" size="lg" disabled>
          Continue with Enterprise SSO
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to the platform?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Register your institution
        </Link>
      </p>

      <details className="mt-6 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground [&_summary]:cursor-pointer [&_summary]:font-medium [&_summary]:text-foreground">
        <summary>Demo accounts (password123)</summary>
        <ul className="mt-2 flex flex-col gap-1">
          {demoAccounts.map((acc) => (
            <li key={acc.email}>
              <button
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword("password123");
                }}
                className="text-left hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                <span className="font-mono">{acc.email}</span> —{" "}
                {acc.role === "admin" ? "Administrator" : `${acc.departmentName} Head`}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </AuthSplitLayout>
  );
}
