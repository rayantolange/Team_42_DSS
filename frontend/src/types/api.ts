import type { Decision } from "./domain";

/**
 * Types describing the shape of API requests/responses, especially
 * the RAG query flow: Query -> AI Response -> Sources -> Confidence.
 */

export interface QuerySource {
  id: string;
  title: string;
  snippet: string;
  documentId?: string;
  decisionId?: string;
  policyId?: string;
  relevanceScore: number; // 0 - 1
}

export type ConfidenceLevel = "high" | "medium" | "low";

export interface QueryResult {
  id: string;
  queryText: string;
  answer: string;
  sources: QuerySource[];
  confidenceScore: number; // 0 - 1
  confidenceLevel: ConfidenceLevel;
  relatedDecisions: Decision[];
  createdAt: string;
}

export interface QueryRequest {
  queryText: string;
  departmentId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: unknown;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "department_head";
    departmentId?: string;
  };
}
