import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppLayout } from "@layouts/AppLayout";
import { PageSkeleton } from "@components/ui/PageSkeleton";

// Route-based code splitting: each page is its own chunk, only
// fetched when the user navigates to it.
const LandingPage = lazy(() => import("@pages/LandingPage"));
const LoginPage = lazy(() => import("@pages/LoginPage"));
const RegisterPage = lazy(() => import("@pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@pages/ForgotPasswordPage"));
const DashboardPage = lazy(() => import("@pages/DashboardPage"));
const QueryPage = lazy(() => import("@pages/QueryPage"));
const GraphExplorerPage = lazy(() => import("@pages/GraphExplorerPage"));
const DecisionHistoryPage = lazy(() => import("@pages/DecisionHistoryPage"));
const MyVaultPage = lazy(() => import("@pages/MyVaultPage"));
const SettingsPage = lazy(() => import("@pages/SettingsPage"));
const HelpCenterPage = lazy(() => import("@pages/HelpCenterPage"));
const NotAuthorizedPage = lazy(() => import("@pages/NotAuthorizedPage"));
const NotFoundPage = lazy(() => import("@pages/NotFoundPage"));
const VerifyEmailPage = lazy(() => import("@pages/VerifyEmailPage"));
const ResetPasswordPage = lazy(() => import("@pages/ResetPasswordPage"));
const AdminUsersPage = lazy(() => import("@pages/AdminUsersPage"));
const AdminDepartmentsPage = lazy(() => import("@pages/AdminDepartmentsPage"));
const DecisionsListPage = lazy(() => import("@pages/DecisionsListPage"));
const DecisionFormPage = lazy(() => import("@pages/DecisionFormPage"));
const DecisionWizardDocumentsPage = lazy(
  () => import("@pages/DecisionWizardDocumentsPage"),
);
const DecisionWizardStrategiesPage = lazy(
  () => import("@pages/DecisionWizardStrategiesPage"),
);
const DecisionWizardConstraintsPage = lazy(
  () => import("@pages/DecisionWizardConstraintsPage"),
);
const DecisionDetailPage = lazy(() => import("@pages/DecisionDetailPage"));

/** Wraps a lazy page in Suspense with a consistent loading skeleton. */
function withSuspense(element: ReactNode) {
  return <Suspense fallback={<PageSkeleton />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(<LandingPage />),
  },
  {
    path: "/login",
    element: withSuspense(<LoginPage />),
  },
  {
    path: "/register",
    element: withSuspense(<RegisterPage />),
  },
  {
    path: "/verify-email",
    element: withSuspense(<VerifyEmailPage />),
  },
  {
    path: "/reset-password",
    element: withSuspense(<ResetPasswordPage />),
  },
  {
    path: "/forgot-password",
    element: withSuspense(<ForgotPasswordPage />),
  },
  {
    path: "/not-authorized",
    element: withSuspense(<NotAuthorizedPage />),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            element: (
              <ProtectedRoute
                allowedRoles={["principal", "hod", "faculty", "staff"]}
              />
            ),
            children: [
              { path: "/dashboard", element: withSuspense(<DashboardPage />) },
              { path: "/query", element: withSuspense(<QueryPage />) },
              { path: "/graph", element: withSuspense(<GraphExplorerPage />) },
              {
                path: "/history",
                element: withSuspense(<DecisionHistoryPage />),
              },
              {
                path: "/decisions/new",
                element: withSuspense(<DecisionFormPage />),
              },
              {
                path: "/decisions",
                element: withSuspense(<DecisionsListPage />),
              },
              {
                path: "/decisions/:id",
                element: withSuspense(<DecisionDetailPage />),
              },
              {
                path: "/decisions/:id/new/documents",
                element: withSuspense(<DecisionWizardDocumentsPage />),
              },
              {
                path: "/decisions/:id/new/strategies",
                element: withSuspense(<DecisionWizardStrategiesPage />),
              },
              {
                path: "/decisions/:id/new/constraints",
                element: withSuspense(<DecisionWizardConstraintsPage />),
              },
              {
                path: "/documents",
                element: withSuspense(<MyVaultPage />),
              },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={["admin"]} />,
            children: [
              {
                path: "/admin/users",
                element: withSuspense(<AdminUsersPage />),
              },
              {
                path: "/admin/departments",
                element: withSuspense(<AdminDepartmentsPage />),
              },
            ],
          },
          { path: "/help", element: withSuspense(<HelpCenterPage />) },
          { path: "/settings", element: withSuspense(<SettingsPage />) },
        ],
      },
    ],
  },
  { path: "/upload", element: <Navigate to="/documents" replace /> },
  { path: "*", element: withSuspense(<NotFoundPage />) },
]);
