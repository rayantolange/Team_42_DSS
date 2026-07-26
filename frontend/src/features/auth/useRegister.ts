import { useMutation } from "@tanstack/react-query";
import { register, type RegisterRequest } from "@services/index";

/**
 * Institutional account registration. Mirrors useLogin's shape
 * (mutation over the shared services surface) so swapping the mock
 * for a real FastAPI /auth/register endpoint later requires no
 * changes to the page or this hook — only to services/index.ts.
 */
export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => register(payload),
  });
}
