import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

interface Rule {
  label: string;
  test: (pw: string) => boolean;
}

const RULES: Rule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "At least 1 number", test: (pw) => /[0-9]/.test(pw) },
  {
    label: "At least 1 special character",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

export function getPasswordErrors(password: string): string[] {
  return RULES.filter((rule) => !rule.test(password)).map((rule) => rule.label);
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const passedCount = RULES.filter((rule) => rule.test(password)).length;
  const strengthPercent = password ? (passedCount / RULES.length) * 100 : 0;
  const strengthColor =
    passedCount === RULES.length
      ? "bg-success"
      : passedCount === 0
        ? "bg-destructive"
        : "bg-amber-500";

  return (
    <div
      className="grid transition-[grid-template-rows] duration-200 ease-out"
      style={{ gridTemplateRows: password ? "1fr" : "0fr" }}
      aria-hidden={!password}
    >
      <div className="overflow-hidden">
        <div className="flex flex-col gap-2 pt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${strengthColor}`}
              style={{ width: `${strengthPercent}%` }}
            />
          </div>
          <ul className="flex flex-col gap-1">
            {RULES.map((rule) => {
              const passed = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                    passed ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full transition-all duration-200 ${
                      passed ? "bg-success/20 scale-100" : "bg-destructive/10 scale-90"
                    }`}
                  >
                    {passed ? (
                      <Check className="h-2.5 w-2.5 text-success" />
                    ) : (
                      <X className="h-2.5 w-2.5 text-destructive/70" />
                    )}
                  </span>
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}