# TGS HRMS — Frontend Architecture

## Stack

| Concern       | Technology                          |
| ------------- | ----------------------------------- |
| Framework     | React 18 + TypeScript (strict mode) |
| Build         | Vite 7                              |
| UI library    | Material UI v7                      |
| Server state  | TanStack Query v5                   |
| Forms         | React Hook Form + Zod               |
| Global state  | Zustand                             |
| Routing       | React Router v6                     |
| Testing       | Vitest + React Testing Library      |
| Component dev | Storybook 9                         |
| Linting       | ESLint + Prettier                   |
| Pre-commit    | Husky + lint-staged                 |

---

## Folder Structure

```
src/
├── api/              # All HTTP calls — one file per domain, shared axios instance
│   ├── axiosInstance.ts      # Configured axios with auth interceptors
│   ├── authService.ts        # Token management (refresh queue)
│   ├── axiosErrorHandler.ts  # Centralised Axios error handling
│   ├── employeeApi.ts        # Example domain file
│   └── index.ts              # Barrel export
│
├── components/
│   ├── common/       # Shared, reusable UI components (no business logic)
│   │   ├── AppButton.tsx
│   │   ├── AppButton.stories.tsx
│   │   └── index.ts          # Barrel export
│   └── <Feature>/    # Feature-scoped components + co-located hooks
│       └── useFeatureHook.ts
│
├── config/
│   ├── env.ts        # Typed env-var access (throws on missing required vars)
│   └── featureFlags.ts # Runtime feature toggles driven by VITE_* env vars
│
├── context/          # React contexts (UserContext, LanguageContext, …)
│
├── hooks/            # Shared hooks that span multiple features
│   └── index.ts      # Barrel export
│
├── pages/            # Route-level wrappers (thin — delegate to components)
│
├── store/            # Zustand global stores
│
├── theme/
│   ├── tokens.ts     # Design token definitions
│   ├── themeConfig.ts# MUI theme object (light + dark)
│   └── index.ts      # ThemeProvider + hooks re-export
│
├── types/
│   ├── index.ts      # Consolidated barrel export
│   ├── api.ts        # Existing generic API envelope types
│   ├── dto.ts        # Generic DTOs: ApiResponse<T>, PaginatedResponse<T>, …
│   └── <domain>.ts   # Domain-specific types (employee.ts, leave.ts, …)
│
└── utils/
    ├── reportWebVitals.ts  # Core Web Vitals reporter
    └── …
```

---

## Key Architectural Decisions

### 1. Route-based Code Splitting

Every route is loaded with `React.lazy()` inside a `<Suspense>` boundary in `App.tsx`. This keeps the initial JS bundle small and defers heavy feature bundles (charts, maps) until the user navigates there.

```tsx
const Dashboard = lazy(() => import('./components/DashboardContent/Dashboard'));
```

Vite's `rollupOptions.manualChunks` groups shared vendor code into stable long-cached chunks (`vendor`, `mui`, `charts`, `forms`, `utils`).

### 2. API Layer

All network calls live in `src/api/*.ts` files. Direct use of `axios` or `fetch` inside components or hooks is prohibited. The shared `axiosInstance` handles:

- Base URL injection via `VITE_API_BASE_URL`
- JWT `Authorization` header injection
- Transparent token refresh with a queue (no race conditions)
- Centralised error logging

### 3. Server State — TanStack Query

`useQuery` / `useMutation` are the only mechanisms for fetching/mutating server data. `useEffect` for data fetching is not permitted. This ensures consistent loading/error states and automatic background re-fetching.

### 4. Forms — React Hook Form + Zod

Every form is controlled by React Hook Form with a Zod schema wired through `@hookform/resolvers/zod`. Uncontrolled inputs (`useState` for form fields) are not used.

### 5. Co-located Feature Hooks

Hooks that are specific to a single feature component live _next to_ that component, not in `src/hooks/`. The shared `src/hooks/` directory is reserved for truly cross-cutting hooks (auth, language, error handling).

### 6. MUI Theme Tokens

Color references always use MUI's `theme.palette.*` tokens or the CSS variables declared in `src/theme/tokens.ts`. Raw hex literals in component code are a linting violation.

### 7. TypeScript — Strict Mode

`tsconfig.app.json` enables `strict: true`, `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, and `noUnusedParameters`. The `any` type is banned project-wide.

### 8. Feature Flags

Runtime toggles live in `src/config/featureFlags.ts`, driven by `VITE_*` environment variables. This allows Netlify preview environments to enable experimental features without code changes.

---

## Extending the System

### Adding a New Feature Module

1. Create `src/components/<FeatureName>/` directory.
2. Add the domain API file at `src/api/<featureName>Api.ts` — re-export from `src/api/index.ts`.
3. Add domain types to `src/types/<featureName>.ts` — re-export from `src/types/index.ts`.
4. Register the route in `App.tsx` using `React.lazy()`.
5. Add Storybook stories for any shared UI components.
6. Add Vitest unit tests for non-trivial logic.

### Adding a New Environment Variable

1. Add it to `.env.example` with a description.
2. If required: add to `REQUIRED_ENV_VARS` in `src/config/env.ts`.
3. If a feature flag: add to `src/config/featureFlags.ts`.
4. Update Netlify / CI environment settings.

### Analysing the Bundle

```bash
ANALYZE=true npm run build
```

This opens an interactive Rollup visualizer report (`stats.html`) showing chunk sizes, tree-shaking results, and duplicate module detection.

---

## CI/CD — Netlify

| Branch | Environment | Auto-deploy       |
| ------ | ----------- | ----------------- |
| `dev`  | Staging     | Yes               |
| `main` | Production  | Yes (requires PR) |

Pre-commit hooks (Husky + lint-staged) run ESLint and Prettier on staged `.ts`/`.tsx` files before every commit, preventing linting regressions from entering the repository.

---

## Performance Targets (Core Web Vitals)

| Metric | Target   |
| ------ | -------- |
| LCP    | < 2.5 s  |
| INP    | < 200 ms |
| CLS    | < 0.1    |
| FCP    | < 1.8 s  |
| TTFB   | < 800 ms |

Web Vitals are logged to the browser console in development mode via `src/utils/reportWebVitals.ts`. Wire `reportWebVitals` to your analytics provider in production to track real-user metrics.
