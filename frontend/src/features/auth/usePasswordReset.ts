import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset } from "@services/index";

/** Requests a password-recovery email for the given institutional address. */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });
}
