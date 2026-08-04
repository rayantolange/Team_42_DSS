# Decision Support System — Frontend

Frontend for **Development of a Web-Based Decision Support System for a
Simulated College Using Knowledge Graphs and Retrieval-Augmented
Generation (RAG)**.

This is the Frontend & Graph Visualization layer: dashboards, an
explainable AI query interface, a knowledge graph explorer, decision
history browsing, and document upload — built against a realistic
mock data layer derived from the team's actual policy dataset, ready
to be pointed at the FastAPI + Neo4j + pgvector backend once it's
available.

## Getting Started

```bash
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL when the backend is ready
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

### Demo accounts (mock auth)

All mock accounts use the password `password123`.

| Email | Role | Department |
| --- | --- | --- |
| `admin@college.edu.np` | Administrator | All departments |
| `head.bad@college.edu.np` | Department Head | Business Administration |
| `head.itd@college.edu.np` | Department Head | Information Technology |

## Tech Stack

React 18 · TypeScript (strict) · Vite · Tailwind CSS · shadcn/ui
(Radix-based primitives) · React Router · Zustand · TanStack Query ·
React Flow · Recharts · Axios

## Project Structure

```tree
src/
├── app/            # App shell, QueryClient config
├── routes/         # Router config, ProtectedRoute
├── layouts/         # AppLayout (nav, header), nav config
├── pages/           # One file per route (composes features/)
├── features/        # Feature modules (dashboard, query, graph, history, upload, auth)
│   └── <feature>/    # Components + hooks scoped to that feature
├── components/ui/   # Reusable shadcn/ui-style primitives
├── hooks/           # Cross-cutting hooks (useAuth)
├── services/        # Axios client + service barrel (mock/ subfolder)
├── store/           # Zustand slices (auth, query, dashboard, graph)
├── types/           # Domain + API TypeScript types
├── data/            # Seed dataset (policies.seed.json) + loaders/generators
└── utils/           # Small helpers (cn for Tailwind class merging)
```

Pages compose feature components; feature components compose UI
primitives. No page reaches directly into another feature's
internals.

## The Mock Data Layer

The team's real backend (FastAPI + PostgreSQL + Neo4j + pgvector +
LangGraph) isn't available yet, so this frontend ships with a
self-contained mock data layer built from the actual
**Simulated College Institutional Policy Dataset** (8 departments, 30
policy records, Nepal Higher Education context) supplied for this
project:

- **`src/data/policies.seed.json`** — the dataset itself, transcribed
  from the source document into structured JSON (departments +
  policies, each with category, scope, responsibilities, related
  entities, decision context, legal basis, constraints, and
  outcomes).
- **`src/data/datasetLoader.ts`** — typed accessors over the seed
  data (`getPolicyById`, `getPoliciesByDepartment`, etc).
- **`src/data/decisionGenerator.ts`** — since the dataset describes
  *policies* (the rules) rather than a log of individual historical
  decisions, this deterministically generates 2–4 simulated decision
  events per policy (each sampling one of that policy's real defined
  outcomes), so Dashboard/History/Graph have enough realistic volume
  to filter, sort, and chart. Generation uses a seeded PRNG, so the
  same data renders on every reload — it's not random per session.
- **`src/services/mock/*`** — mock service functions
  (`fetchDashboardMetrics`, `submitQuery`, `uploadDocument`, etc) that
  simulate the real API surface, including artificial network delay
  so loading states are visible and testable.
- **`src/services/index.ts`** — the single import surface every
  hook/component uses. This is the file to edit when a real backend
  endpoint becomes available (see below).

### The Query Interface's "RAG" is a mock, not a real pipeline

`src/services/mock/queryService.ts` does naive keyword-overlap
scoring against policy text fields to rank "retrieved" sources, then
fills an answer template. It exists to give the Query Interface real,
varied content (answers, sources, confidence scores) so the UI's
explainability features — source cards, confidence indicator, loading
and error states — can be built and demoed convincingly. It is **not**
a substitute for the team's actual LangGraph/pgvector retrieval
pipeline and should be the first thing swapped out.

## Connecting the Real Backend

Each resource is mocked independently, so they can be migrated one at
a time without touching calling code. For each resource:

1. Open `src/services/index.ts`.
2. Replace the mock export with a real implementation using the
   configured Axios instance from `src/services/apiClient.ts` (it
   already injects the JWT bearer token and handles 401 auto-logout).
3. Leave the exported function name and return type identical — every
   hook in `src/features/*/use*.ts` imports from this barrel file and
   doesn't need to change.

Example — swapping `fetchDepartments`:

```ts

// Before (services/index.ts)
export { fetchDepartments } from "./mock/departmentService";

// After
import { apiClient } from "./apiClient";
import type { Department } from "@/types/domain";

export async function fetchDepartments(): Promise<Department[]> {
  const { data } = await apiClient.get<Department[]>("/departments");
  return data;
}
```

Also set `VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL` to the
FastAPI server's URL in `.env`.

### Auth

`src/services/mock/authService.ts` simulates `POST /auth/login` with
the three demo accounts above. Replace `login()` with a real Axios
call returning `{ accessToken, user }` matching the `LoginResponse`
type in `src/types/api.ts` — `useAuthStore` and `ProtectedRoute`
require no changes.

## State Management

Zustand stores are split into slices, each with a single
responsibility, to minimize re-renders:

- **`authStore`** — user, token, isAuthenticated (persisted to
  localStorage so refresh doesn't log the user out)
- **`queryStore`** — current query/result, query history
- **`dashboardStore`** — selected department, dashboard filters
- **`graphStore`** — selected node, viewport, graph filters

## TanStack Query Configuration

Per-resource `staleTime` is centralized in `src/app/queryClient.ts`:

| Resource | staleTime |
| --- | --- |
| Dashboard metrics | 5 minutes |
| Decision details | 1 hour |
| Query results | 0 (always fresh; modeled as a mutation, not a query) |

Query keys are produced by the `queryKeys` factory in the same file —
always use it rather than inlining key arrays, so cache invalidation
reliably hits the right entries.

## Roles & Access Control

Two roles: `admin` and `department_head`.

- Admins see all departments and can filter Dashboard/Query/Graph/
  History by department.
- Department Heads are automatically scoped to their own department;
  the department filter controls are hidden for this role rather than
  shown-but-disabled, since they offer no choice to make.
- `ProtectedRoute` (`src/routes/ProtectedRoute.tsx`) guards all
  authenticated routes and additionally supports an `allowedRoles`
  prop for role-restricted routes if any are added later.
- A 401 response from the real backend will automatically clear auth
  state and redirect to `/login` (see `apiClient.ts`).

## Accessibility

Targets WCAG 2.1 AA. Notable implementation points:

- Skip-to-content link in `AppLayout`.
- Every icon-only button has an `aria-label`; every form control has
  an associated `<label>`.
- Active nav link gets `aria-current="page"` automatically via
  React Router's `NavLink`.
- Loading states use `role="status"` + `aria-busy` + a visually
  hidden description, not just a visual spinner.
- Charts and the graph canvas have descriptive `aria-label`s since
  their content can't be conveyed visually to screen reader users.
- `prefers-reduced-motion` is respected globally (see `index.css`).
- A full Accessibility Statement lives in the Help Center page.

This is a starting point, not a final audit — run a real screen
reader pass and an automated checker (e.g. axe) before considering
any page complete.

## Performance

- Every route is lazy-loaded (`React.lazy` + route-based code
  splitting in `src/routes/router.tsx`), each wrapped in `Suspense`
  with a shared `PageSkeleton` fallback.
- `vite.config.ts` manually chunks heavy vendor libraries (React Flow,
  Recharts, TanStack Query) so they don't bloat the main bundle for
  users who never visit the Graph Explorer or Dashboard.
- Apply `React.memo` to expensive list/chart components as they grow;
  none are memoized yet since the mock dataset is small enough that
  it wasn't yet necessary — revisit once real data volumes are known.

## Known Gaps / Next Steps

- Real backend integration (see above) — currently 100% mocked.
- The RAG query mock is a keyword-overlap heuristic, not a real
  retrieval pipeline — replace first.
- No automated tests yet (no Vitest/Testing Library setup).
- `npm install` could not be run in the environment this was authored
  in (no network access to the npm registry), so dependency versions
  in `package.json` have not been installed-and-verified end-to-end.
  Run `npm install` and `npm run typecheck` as your first step and
  fix any version mismatches that surface.
- This project pins **Recharts v2** (`^2.12.7`), not v3. Recharts v2
  is now deprecated upstream in favor of v3, but v3 removes/changes
  several props (e.g. `Cell` is deprecated in favor of `shape`/
  `content`, `activeIndex` was removed). The charts in
  `features/dashboard/ChartPanel.tsx` use the stable v2-era API.
  Upgrading to v3 is reasonable but will require revisiting that file
  against the [v3 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide)
  — it's not a drop-in version bump.
- Similarly, this project uses the **`reactflow` package (v11)**, not
  its successor **`@xyflow/react` (v12+)**. The graph library was
  renamed starting at v12; `reactflow` v11 still installs and works
  fine (it's frozen, not removed), but isn't where new features land.
  `features/graph/*` uses the stable v11 API (`useNodesState`,
  `NodeProps`, etc). Migrating to `@xyflow/react` mainly means a
  package + import rename, but check the
  [v12 migration guide](https://reactflow.dev/learn/troubleshooting/migrate-to-v12)
  for the handful of behavioral changes (e.g. `node.measured` for
  dimensions) before doing so.
