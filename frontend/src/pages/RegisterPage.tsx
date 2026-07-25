import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Lock, Layers, ArrowRight } from "lucide-react";
import { Button } from "@components/ui/Button";
import { AuthSplitLayout } from "@layouts/AuthSplitLayout";
import { useRegister } from "@features/auth/useRegister";
import { DEPARTMENTS } from "@services/index";

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setFormError("You must agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    registerMutation.mutate(
      { fullName, email, password, departmentId },
      {
        onSuccess: () => {
          navigate("/login", { state: { registered: true } });
        },
      }
    );
  }

  const apiError =
    registerMutation.error instanceof Error ? registerMutation.error.message : undefined;

  return (
    <AuthSplitLayout
      title="Enterprise Intelligence Reimagined"
      description="Access our state-of-the-art Knowledge Graphs and RAG-powered analytics. Securely register to begin making data-driven decisions backed by machine-assisted precision."
      highlights={[
        {
          icon: Layers,
          title: "Unified Data",
          description: "Cross-departmental semantic data integration.",
        },
        {
          icon: Lock,
          title: "Gov-Grade Security",
          description: "Encrypted institutional authentication protocols.",
        },
      ]}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Create Account</h2>
        <Link to="/login" className="mt-1.5 inline-block text-sm font-medium text-primary hover:underline">
          Join into Nirnaya
        </Link>
      </div>

      {registerMutation.isSuccess ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-success" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Account created</p>
          <p className="text-sm text-muted-foreground">
            Redirecting you to sign in with your new credentials…
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ruby Bhuju"
              className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-email" className="text-sm font-medium">
              Institutional Email
            </label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ruby@iimscollege.edu.np"
              className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Must be a verified .edu or .gov domain.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="department" className="text-sm font-medium">
              Department
            </label>
            <select
              id="department"
              required
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>
                Select department
              </option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span>
              I agree to the{" "}
              <a href="#" className="font-medium text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="font-medium text-primary hover:underline">
                Privacy Policy
              </a>
              . I understand this system is for institutional use only.
            </span>
          </label>

          {(formError ?? apiError) && (
            <div role="alert" className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formError ?? apiError}</span>
            </div>
          )}

          <Button type="submit" size="lg" isLoading={registerMutation.isPending} className="mt-1">
            {registerMutation.isPending ? "Creating account…" : "Create Account"}
            {!registerMutation.isPending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
