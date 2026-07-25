import { mockDelay } from "./mockUtils";

/**
 * Mock password-reset request. Always resolves (never reveals
 * whether an email exists in the system) after a simulated delay,
 * matching how real account-recovery flows avoid leaking account
 * existence to an unauthenticated caller.
 *
 * TODO: replace with a real POST /auth/forgot-password call once
 * that backend flow is built (see AuthService in the backend for
 * the equivalent verify-email/reset pattern to follow).
 */
export async function requestPasswordReset(email: string) {
  await mockDelay(600);
  return { email, sent: true };
}