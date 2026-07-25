import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Logo } from "@components/ui/Logo";

export default function NotAuthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/20 p-6 text-center">
      <Logo className="mb-4" />
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10 text-warning">
        <ShieldAlert className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">You don't have access to this page</h1>
      <p className="max-w-md text-muted-foreground">
        Your account role doesn't include permission to view this section. If you believe this is
        a mistake, contact your system administrator.
      </p>
      <Button asChild size="lg">
        <Link to="/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
