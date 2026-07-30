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

export {
  fetchDepartments,
  fetchAllDepartments,
  createDepartment,
  updateDepartment,
  toggleDepartmentActive,
  type CreateDepartmentRequest,
  type UpdateDepartmentRequest,
} from "./departmentService";

export { fetchDepartmentById } from "./departmentService";

export {
  fetchDocuments,
  uploadDocument,
  deleteDocument,
  validateFile,
} from "./mock/uploadService";

export { login } from "./authService";
export { register, type RegisterRequest } from "./authService";

export { requestPasswordReset, resetPassword } from "./authService";

export {
  POLICIES,
  DEPARTMENTS,
  getPolicyById,
  getPoliciesByDepartment,
  getDepartmentById,
} from "@/data/datasetLoader";
export {
  DECISIONS,
  getDecisionsByPolicy,
  getDecisionById,
} from "@/data/decisionGenerator";

export {
  fetchAllUsers,
  updateUserRole,
  deleteUser,
  activateUser,
  permanentlyDeleteUser,
  fetchSystemStats,
  type AdminUser,
  type SystemStats,
} from "./adminService";

export {
  fetchDecisionPolicyContext,
} from "./mock/decisionService";

export {
  fetchDecisions,
  fetchDecisionById,
  createDecision,
  updateDecision,
  updateDecisionStatus,
  type DecisionFilters,
} from "./decisionService";

export {
  createThread,
  sendMessage,
  listThreads,
  getThreadMessages,
  deleteThreadRemote,
  type ChatMode,
  type SendMessageResult,
  type ThreadSummary,
} from "./chatService";
