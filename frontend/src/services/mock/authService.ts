import type { LoginRequest, LoginResponse } from "@/types/api";
import { DEPARTMENTS } from "@/data/datasetLoader";
import { mockDelay } from "./mockUtils";

/**
 * Seed accounts for local development / demo purposes.
 * Password for every mock account is "password123".
 *
 * Replace with a real POST /auth/login call against FastAPI +
 * JWT once the backend endpoint is available.
 */
const MOCK_USERS: Array<{
  email: string;
  password: string;
  id: string;
  name: string;
  role: "admin" | "department_head";
  departmentId?: string;
}> = [
  {
    email: "admin@college.edu.np",
    password: "password123",
    id: "USR-001",
    name: "Dr. Anjali Shrestha",
    role: "admin",
  },
  {
    email: "head.bad@college.edu.np",
    password: "password123",
    id: "USR-002",
    name: "Prakash Adhikari",
    role: "department_head",
    departmentId: "BAD",
  },
  {
    email: "head.itd@college.edu.np",
    password: "password123",
    id: "USR-003",
    name: "Sunita Gurung",
    role: "department_head",
    departmentId: "ITD",
  },
];

export async function login({ email, password }: LoginRequest): Promise<LoginResponse> {
  await mockDelay(500);

  const user = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  return {
    accessToken: `mock-jwt-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    },
  };
}

/** Exposed so the login page can show available demo accounts. */
export function getDemoAccounts() {
  return MOCK_USERS.map((u) => ({
    email: u.email,
    role: u.role,
    departmentName: u.departmentId
      ? DEPARTMENTS.find((d) => d.id === u.departmentId)?.name
      : "All Departments",
  }));
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  departmentId: string;
}

/**
 * Mock institutional registration. A real implementation would POST
 * to /auth/register and likely trigger an email-verification step
 * before the account is usable; this mock simulates the request
 * latency and basic validation so the Register screen has a real
 * flow to submit against.
 */
export async function register({ fullName, email, password, departmentId }: RegisterRequest) {
  await mockDelay(700);

  if (MOCK_USERS.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with this institutional email already exists.");
  }
  if (!/^[^\s@]+@[^\s@]+\.(edu|gov)(\.[a-z]{2})?$/i.test(email)) {
    throw new Error("Please use a verified .edu or .gov institutional email address.");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  return {
    id: `USR-${Math.floor(Math.random() * 9000 + 1000)}`,
    fullName,
    email,
    departmentId,
    status: "pending_verification" as const,
  };
}

/**
 * Mock password-reset request. Always resolves (never reveals
 * whether an email exists in the system) after a simulated delay,
 * matching how real account-recovery flows avoid leaking account
 * existence to an unauthenticated caller.
 */
export async function requestPasswordReset(email: string) {
  await mockDelay(600);
  return { email, sent: true };
}
