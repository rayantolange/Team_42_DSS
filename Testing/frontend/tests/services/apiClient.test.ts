import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@store/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

describe("apiClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("is configured with credentials and JSON content-type", async () => {
    const { useAuthStore } = await import("@store/authStore");
    vi.mocked(useAuthStore.getState).mockReturnValue({
      token: null,
      logout: vi.fn(),
    } as any);

    const { apiClient } = await import("./apiClient");

    expect(apiClient.defaults.withCredentials).toBe(true);
    expect(apiClient.defaults.headers["Content-Type"]).toBe("application/json");
    expect(apiClient.defaults.timeout).toBe(30000);
  });

  it("attaches Authorization header when a token exists in the auth store", async () => {
    const { useAuthStore } = await import("@store/authStore");
    vi.mocked(useAuthStore.getState).mockReturnValue({
      token: "my-test-token",
      logout: vi.fn(),
    } as any);

    const { apiClient } = await import("./apiClient");

    const config = await apiClient.interceptors.request.handlers[0].fulfilled({
      headers: {},
    } as any);

    expect(config.headers.Authorization).toBe("Bearer my-test-token");
  });

  it("does not attach Authorization header when there is no token", async () => {
    const { useAuthStore } = await import("@store/authStore");
    vi.mocked(useAuthStore.getState).mockReturnValue({
      token: null,
      logout: vi.fn(),
    } as any);

    const { apiClient } = await import("./apiClient");

    const config = await apiClient.interceptors.request.handlers[0].fulfilled({
      headers: {},
    } as any);

    expect(config.headers.Authorization).toBeUndefined();
  });

  it("calls logout on a 401 response error", async () => {
    const logoutMock = vi.fn();
    const { useAuthStore } = await import("@store/authStore");
    vi.mocked(useAuthStore.getState).mockReturnValue({
      token: "tok",
      logout: logoutMock,
    } as any);

    const { apiClient } = await import("./apiClient");

    const errorHandler = apiClient.interceptors.response.handlers[0].rejected;

    await expect(
      errorHandler({
        response: { status: 401 },
      } as any)
    ).rejects.toBeTruthy();

    expect(logoutMock).toHaveBeenCalled();
  });

  it("does not call logout on a non-401 response error", async () => {
    const logoutMock = vi.fn();
    const { useAuthStore } = await import("@store/authStore");
    vi.mocked(useAuthStore.getState).mockReturnValue({
      token: "tok",
      logout: logoutMock,
    } as any);

    const { apiClient } = await import("./apiClient");

    const errorHandler = apiClient.interceptors.response.handlers[0].rejected;

    await expect(
      errorHandler({
        response: { status: 500 },
      } as any)
    ).rejects.toBeTruthy();

    expect(logoutMock).not.toHaveBeenCalled();
  });
});