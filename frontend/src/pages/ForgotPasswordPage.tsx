import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Database, ShieldCheck, MailCheck } from "lucide-react";
import { Button } from "@components/ui/Button";
import { AuthSplitLayout } from "@layouts/AuthSplitLayout";
import { useRequestPasswordReset } from "@features/auth/usePasswordReset";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const resetMutation = useRequestPasswordReset();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    resetMutation.mutate(email.trim());
  }

  return (
    <AuthSplitLayout
      title="Secure Access Recovery"
      description="Restoring institutional intelligence access through our encrypted recovery protocol. Enter your credentials to verify your identity and regain control of your decision support dashboard."
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
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your university email to receive a secure recovery link.
        </p>
      </div>

      {resetMutation.isSuccess ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-6 text-center">
          <MailCheck className="h-8 w-8 text-success" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Recovery link sent</p>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium">{email}</span>, a secure reset
            link is on its way. Check your inbox.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-email" className="text-sm font-medium">
              Institutional Email
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ruby@iimscollege.edu.np"
              className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <Button type="submit" size="lg" isLoading={resetMutation.isPending} className="mt-1">
            {resetMutation.isPending ? "Sending…" : "Send Reset Link"}
          </Button>
        </form>
      )}

      <Link
        to="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Login
      </Link>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Having trouble?{" "}
        <a href="#" className="font-medium text-foreground hover:underline">
          Contact System Administrator
        </a>
      </p>
    </AuthSplitLayout>
  );
}
