import { useState, type FormEvent } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, XCircle, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@components/ui/Button";
import { AuthSplitLayout } from "@layouts/AuthSplitLayout";
import { resetPassword } from "@services/index";
import {
  PasswordStrengthMeter,
  getPasswordErrors,
} from "@components/ui/PasswordStrengthMeter";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [apiMessage, setApiMessage] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!token) {
      setFormError("This reset link is invalid or missing a token.");
      return;
    }

    const passwordErrors = getPasswordErrors(password);
    if (passwordErrors.length > 0) {
      setFormError(`Password needs: ${passwordErrors.join(", ").toLowerCase()}`);
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setStatus("loading");
    resetPassword(token, password)
      .then((res) => {
        setStatus("success");
        setApiMessage(res.message);
        setTimeout(() => navigate("/login"), 2500);
      })
      .catch((err) => {
        setStatus("error");
        setApiMessage(
          err?.response?.data?.detail ?? "Something went wrong. The link may have expired."
        );
      });
  }

  return (
    <AuthSplitLayout
      title="Reset Your Password"
      description="Choose a new password to regain access to your Nirnaya account."
      highlights={[
        {
          icon: CheckCircle2,
          title: "Secure Reset",
          description: "Your reset link is single-use and time-limited.",
        },
        {
          icon: AlertCircle,
          title: "Stay Alert",
          description: "Never share this link — it grants account access.",
        },
      ]}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Set a New Password
        </h2>
      </div>

      {status === "success" ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-success" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Password reset</p>
          <p className="text-sm text-muted-foreground">{apiMessage}</p>
        </div>
      ) : status === "error" && !token ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
          <XCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Invalid link</p>
          <p className="text-sm text-muted-foreground">{apiMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="text-sm font-medium">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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
            <PasswordStrengthMeter password={password} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-new-password" className="text-sm font-medium">
              Confirm New Password
            </label>
            <input
              id="confirm-new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-background px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {(formError ?? (status === "error" ? apiMessage : null)) && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formError ?? apiMessage}</span>
            </div>
          )}

          <Button type="submit" size="lg" isLoading={status === "loading"} className="mt-1">
            {status === "loading" ? "Resetting…" : "Reset Password"}
            {status !== "loading" && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </AuthSplitLayout>
  );
}