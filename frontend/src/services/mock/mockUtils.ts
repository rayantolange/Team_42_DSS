/**
 * Shared helpers for mock services. Centralizing simulated latency
 * here means swapping a mock service for a real Axios call later is
 * a one-function change, not a search-and-replace across the app.
 */

/** Simulates network latency so loading states are visible/testable. */
export function mockDelay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Occasionally throws to exercise error-state UI in development.
 * Disabled by default; flip MOCK_ERROR_RATE > 0 locally to test.
 */
const MOCK_ERROR_RATE = 0;

export function maybeThrowMockError(context: string): void {
  if (MOCK_ERROR_RATE > 0 && Math.random() < MOCK_ERROR_RATE) {
    throw new Error(`Mock service error in ${context}`);
  }
}
