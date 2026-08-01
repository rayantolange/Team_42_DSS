import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./apiClient";
import {
  login,
  register,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from "./authService";

vi.mock("./apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("sends form-encoded credentials and combines token + user info", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          access_token: "abc123",
          token_type: "bearer",
          user_id: 5,
          full_name: "Ruby Shrestha",
          role: "faculty",
        },
      });

      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          user_id: 5,
          department_id: 2,
          full_name: "Ruby Shrestha",
          email: "ruby@example.com",
          role: "faculty",
          created_at: "2026-07-01T00:00:00Z",
        },
      });

      const result = await login({
        email: "ruby@example.com",
        password: "secret123",
        rememberMe: true,
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        "/auth/login",
        expect.any(URLSearchParams),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      expect(apiClient.get).toHaveBeenCalledWith("/auth/me", {
        headers: { Authorization: "Bearer abc123" },
      });

      expect(result).toEqual({
        accessToken: "abc123",
        user: {
          id: "5",
          name: "Ruby Shrestha",
          email: "ruby@example.com",
          role: "faculty",
          departmentId: "2",
        },
      });
    });

    it("defaults rememberMe to false when not provided", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          access_token: "tok",
          token_type: "bearer",
          user_id: 1,
          full_name: "Test User",
          role: "staff",
        },
      });
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          user_id: 1,
          department_id: 1,
          full_name: "Test User",
          email: "test@example.com",
          role: "staff",
          created_at: "2026-07-01T00:00:00Z",
        },
      });

      await login({ email: "test@example.com", password: "pw" });

      const sentBody = vi.mocked(apiClient.post).mock.calls[0][1] as URLSearchParams;
      expect(sentBody.get("remember_me")).toBe("false");
    });
  });

  describe("register", () => {
    it("sends camelCase input as snake_case and returns pending_verification status", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          user_id: 10,
          department_id: 4,
          full_name: "New User",
          email: "new@example.com",
          role: "faculty",
          created_at: "2026-07-01T00:00:00Z",
        },
      });

      const result = await register({
        fullName: "New User",
        email: "new@example.com",
        password: "pw123",
        departmentId: "4",
        role: "faculty",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/auth/register", {
        full_name: "New User",
        email: "new@example.com",
        password: "pw123",
        department_id: 4,
        role: "faculty",
      });

      expect(result).toEqual({
        id: "10",
        fullName: "New User",
        email: "new@example.com",
        departmentId: "4",
        status: "pending_verification",
      });
    });
  });

  describe("requestPasswordReset", () => {
    it("sends email and returns message", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { message: "Reset link sent" },
      });

      const result = await requestPasswordReset("ruby@example.com");

      expect(apiClient.post).toHaveBeenCalledWith("/auth/forgot-password", {
        email: "ruby@example.com",
      });
      expect(result).toEqual({ message: "Reset link sent" });
    });
  });

  describe("resetPassword", () => {
    it("sends token and new_password, returns message", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { message: "Password updated" },
      });

      const result = await resetPassword("reset-token-xyz", "newPassword123");

      expect(apiClient.post).toHaveBeenCalledWith("/auth/reset-password", {
        token: "reset-token-xyz",
        new_password: "newPassword123",
      });
      expect(result).toEqual({ message: "Password updated" });
    });
  });

  describe("verifyEmail", () => {
    it("sends token as query param, returns message", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { message: "Email verified" },
      });

      const result = await verifyEmail("verify-token-abc");

      expect(apiClient.get).toHaveBeenCalledWith("/auth/verify-email", {
        params: { token: "verify-token-abc" },
      });
      expect(result).toEqual({ message: "Email verified" });
    });
  });
});