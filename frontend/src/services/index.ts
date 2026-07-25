/**
 * Single import surface for all data-fetching functions used by the
 * app's hooks/components. Currently re-exports mock implementations
 * since the team's FastAPI endpoints aren't available yet.
 *
 * To switch a given resource to the real backend once its endpoint
 * is ready: replace that resource's export here with a real
 * apiClient-based implementation (see services/apiClient.ts for the
 * configured Axios instance with JWT injection + 401 handling). No
 * caller needs to change, since they all import from "@services/index"
 * rather than reaching into services/mock directly.
 */

export { fetchDepartments } from "./departmentService";
export { fetchDepartmentById } from "./mock/departmentService";

export {
  fetchDashboardMetrics,
  fetchDashboardTrends,
  type DashboardMetrics,
  type DepartmentComparisonRow,
  type TrendPoint,
} from "./mock/dashboardService";

export {
  fetchDecisions,
  fetchDecisionById,
  fetchDecisionPolicyContext,
  type DecisionFilters,
} from "./mock/decisionService";

export { submitQuery } from "./mock/queryService";

export {
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  validateFile,
} from "./mock/uploadService";

export { login } from "./authService";
export { register, type RegisterRequest } from "./authService";

export { requestPasswordReset, resetPassword } from "./authService";

export { POLICIES, DEPARTMENTS, getPolicyById, getPoliciesByDepartment, getDepartmentById } from "@/data/datasetLoader";
export { DECISIONS, getDecisionsByPolicy, getDecisionById } from "@/data/decisionGenerator";
