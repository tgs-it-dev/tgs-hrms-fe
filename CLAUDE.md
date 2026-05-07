# TGS HRMS Frontend

## Stack
- **Framework**: React 18 + TypeScript + Vite
- **UI**: Material UI v7 (MUI)
- **State**: TanStack Query v5 for server state
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **Testing**: Vitest (unit), Storybook (component)
- **Linting**: ESLint + Prettier

## Project Structure
```
src/
├── api/          # API layer (axios instances, per-feature files)
├── components/   # Feature components (co-located with their hooks)
├── hooks/        # Shared custom hooks
├── pages/        # Route-level page components
├── store/        # Zustand global state
├── theme/        # MUI theme tokens
├── types/        # Shared TypeScript types
└── utils/        # Pure utility functions
```

## Key Conventions
- Use MUI `theme.palette.*` tokens — never raw hex colors
- Co-locate feature hooks with their components
- Use TanStack Query for all API calls; no direct `useEffect` for fetching
- Forms use React Hook Form + Zod schemas
- All API files live in `src/api/` and use the shared axios instance

## Common Commands
```bash
npm run dev          # Start dev server (port 5173)
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix lint errors
npm run type-check   # TypeScript check
npm run format       # Prettier format
npm run test         # Run unit tests
npm run storybook    # Start Storybook (port 6006)
```

## Branch Naming
- `feat/<ticket>` — new feature
- `fix/<ticket>` — bug fix
- `style/<ticket>` — styling/formatting only
- `refactor/<ticket>` — refactoring

## PR Rules
- All PRs target `dev` branch (not `main`)
- PRs must pass: lint, type-check, and unit tests
- Use conventional commits: `feat:`, `fix:`, `style:`, `refactor:`, `chore:`
