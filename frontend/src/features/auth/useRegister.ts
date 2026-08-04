import { useMutation } from "@tanstack/react-query";
import { register, type RegisterRequest } from "@services/index";

/**
 * Institutional account registration. Mirrors useLogin's shape
 * (mutation over the shared services surface) — calls the real
 * FastAPI /auth/register endpoint via services/index.ts.
 */
export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => register(payload),
  });
}
