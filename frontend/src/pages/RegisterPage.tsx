import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@components/ui/Button";
import { AuthSplitLayout } from "@layouts/AuthSplitLayout";
import { useRegister } from "@features/auth/useRegister";
import { useQuery } from "@tanstack/react-query";
import { fetchDepartments } from "@services/index";
import {
  PasswordStrengthMeter,
  getPasswordErrors,
} from "@components/ui/PasswordStrengthMeter";

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [role, setRole] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const passwordErrors = getPasswordErrors(password);
    if (passwordErrors.length > 0) {
      setFormError(
        `Password needs: ${passwordErrors.join(", ").toLowerCase()}`,
      );
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setFormError(
        "You must agree to the Terms of Service and Privacy Policy to continue.",
      );
      return;
    }

    registerMutation.mutate(
      { fullName, email, password, departmentId, role },
      {
        onSuccess: () => {
          navigate("/login", { state: { registered: true } });
        },
      },
    );
  }

  const apiError =
    registerMutation.error instanceof Error
      ? registerMutation.error.message
      : undefined;

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
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Create Account
        </h2>
        <Link
          to="/login"
          className="mt-1.5 inline-block text-sm font-medium text-primary hover:underline"
        >
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
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          noValidate
        >
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
            <p className="text-xs text-muted-foreground">
              Must be a verified .edu or .gov domain.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reg-password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
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
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <PasswordStrengthMeter password={password} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-background px-3.5 pr-10 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
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
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="role" className="text-sm font-medium">
              Role
            </label>
            <select
              id="role"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-3.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" disabled>
                Select role
              </option>
              <option value="principal">Principal</option>
              <option value="hod">Head of Department</option>
              <option value="faculty">Faculty</option>
              <option value="staff">Staff</option>
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
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formError ?? apiError}</span>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            isLoading={registerMutation.isPending}
            className="mt-1"
          >
            {registerMutation.isPending
              ? "Creating account…"
              : "Create Account"}
            {!registerMutation.isPending && (
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            )}
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
