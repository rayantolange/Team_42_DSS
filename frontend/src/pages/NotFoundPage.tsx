import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Logo } from "@components/ui/Logo";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/20 p-6 text-center">
      <Logo className="mb-4" />
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
        <FileQuestion className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Button asChild size="lg">
        <Link to="/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
