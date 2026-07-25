import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { verifyEmail } from "@services/authService";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token was provided.");
      return;
    }

    verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err?.response?.data?.detail ?? "Verification failed. The link may have expired."
        );
      });
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      {status === "loading" && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying your email…</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle2 className="h-10 w-10 text-success" />
          <h1 className="text-xl font-bold">Email verified</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Link to="/login" className="mt-2 font-medium text-primary hover:underline">
            Go to login
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="h-10 w-10 text-destructive" />
          <h1 className="text-xl font-bold">Verification failed</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          <Link to="/login" className="mt-2 font-medium text-primary hover:underline">
            Back to login
          </Link>
        </>
      )}
    </div>
  );
}