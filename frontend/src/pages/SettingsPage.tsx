import { useState } from "react";
import { Bell, Moon, Shield, User, Mail, Building2, Sun } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Badge } from "@components/ui/Badge";
import { useAuth } from "@hooks/useAuth";
import { useTheme } from "@hooks/useTheme";
import { useToast } from "@components/ui/Toast";
import { DEPARTMENTS } from "@services/index";
import { cn } from "@utils/cn";

const ROLE_LABELS: Record<string, string> = {
  admin: "System Administrator",
  principal: "Principal",
  hod: "Head of Department",
  faculty: "Faculty",
  staff: "Staff",
};

interface ToggleRowProps {
  icon: typeof Bell;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** A single labeled on/off row, styled as an animated pill switch. */
function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user, isAdmin, scopedDepartmentId } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [notifyDecisions, setNotifyDecisions] = useState(true);
  const [notifyDocuments, setNotifyDocuments] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);
  const [notifyConflicts, setNotifyConflicts] = useState(true);

  const departmentName = scopedDepartmentId
    ? DEPARTMENTS.find((d) => d.id === scopedDepartmentId)?.name
    : "All Departments";

  function handleSavePreferences() {
    showToast({
      title: "Preferences saved",
      description: "Your notification settings have been updated.",
      variant: "success",
    });
  }

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, notifications, and appearance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your institutional account details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-0">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {user.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{user.name}</p>
              <Badge variant="soft" className="mt-1">
                {ROLE_LABELS[user.role] ?? user.role}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
            <div className="flex items-center gap-2.5 text-sm">
              <Mail
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">Email</span>
              <span className="ml-auto font-medium">{user.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Building2
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">Department</span>
              <span className="ml-auto font-medium">{departmentName}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <User
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">User ID</span>
              <span className="ml-auto font-mono text-xs">{user.id}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Shield
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">Access level</span>
              <span className="ml-auto font-medium capitalize">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Profile details are managed by your institution's administrator and
            can't be edited here.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>
            Choose how Nirnaya looks on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                {theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {theme === "dark" ? "Dark mode" : "Light mode"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Switches instantly across the app.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              Switch to {theme === "dark" ? "Light" : "Dark"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription>
            Choose what shows up in your notification panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border pt-0">
          <ToggleRow
            icon={Bell}
            title="New decisions logged"
            description="Notify me when a decision is recorded in my department."
            checked={notifyDecisions}
            onCheckedChange={setNotifyDecisions}
          />
          <ToggleRow
            icon={Bell}
            title="Document processing"
            description="Notify me when an uploaded document finishes indexing."
            checked={notifyDocuments}
            onCheckedChange={setNotifyDocuments}
          />
          <ToggleRow
            icon={Shield}
            title="Policy conflict alerts"
            description="Notify me if a new document may conflict with existing policy."
            checked={notifyConflicts}
            onCheckedChange={setNotifyConflicts}
          />
          <ToggleRow
            icon={Bell}
            title="Weekly digest"
            description="A summary of decisions and documents added this week."
            checked={notifyDigest}
            onCheckedChange={setNotifyDigest}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSavePreferences}>Save preferences</Button>
      </div>
    </div>
  );
}
