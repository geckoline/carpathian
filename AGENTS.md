# Carpathian – Agent Instructions

## Quick start
```bash
npm install
npm run dev            # Vite dev server
npm run start          # Full: Docker → supabase start → vite
npm run build          # tsc --noEmit && vite build
npm run typecheck      # tsc --noEmit
npm run test:run       # vitest run (no watch)
npm run test           # vitest (watch mode)
npm run test:data      # Focused: services/hooks/store/utils tests
```

CI order (GitHub Actions): `typecheck` → `test:run --coverage` → `build`.

## Architecture
- **Framework:** Vite 8 + React 18 + TypeScript strict (`noUnusedLocals`, `noUncheckedIndexedAccess`).
- **Styling:** Tailwind v4 CSS-first (`@import "tailwindcss"`, `@tailwindcss/vite` plugin). No PostCSS config.
- **State:** Single Zustand store with Immer middleware. Slices: `filters`, `ui`, `data`, `a11y`.
- **Validation:** Zod schemas at every service boundary (`ExpertSchema`, `ProjectSchema`).
- **Routing:** None — single-page layout with tab toggle (`projects`/`experts`). Mounts to `#citizen-science-root`. WordPress embeds via `<iframe>` (see `DEPLOYMENT.md`).
- **Map:** Leaflet + react-leaflet, lazy-loaded via `React.lazy`. `touchleave` event filtered at mount (`src/main.tsx:28-40` — Leaflet bug workaround).
- **Data flow:** Supabase (`apiService`) or mock (`mockApi`) → `loadAppData` → Zustand → UI. Falls back to mock when Supabase env vars missing.

## Path aliases (vitest + vite config)
`@/` → `src/`, plus `@store/`, `@hooks/`, `@components/`, `@services/`, `@test-utils/`.

## Testing
- Vitest + `@testing-library/react` + `userEvent` + `jest-dom` + `vitest-axe` (a11y matchers). jsdom environment.
- `focus-trap-react` auto-mocked in `src/test-utils/setup.ts`.
- Global mock store helper: `__createMockAppStore(overrides?)` — use in component tests instead of wiring real store.
- Coverage thresholds: statements 80%, branches 75%, functions 80%, lines 80%.
- Run focused: `npm run test:data src/services/__tests__/specific.test.ts`.

## Supabase
- Local dev: `supabase start` (project ID: `carpathian`). DB v17, seed: `seed-v3-adjusted-data.sql`.
- Views: `app_projects`, `app_experts`. Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Supabase skills auto-load from `.agents/skills/` — use them for schema/auth/RLS work.

## Environment variables
`VITE_SERPAPI_KEY` (or aliases via vite.config.ts) for Google Scholar. `VITE_API_BASE_URL` optional.

## Key files
| Purpose | Path |
|---------|------|
| App entry | `src/main.tsx` |
| App component | `src/App.tsx` |
| Zustand store | `src/store/appStore.ts` |
| API layer | `src/services/apiService.ts` |
| Mock data | `src/services/mockApi.ts` |
| Data loader | `src/services/loadAppData.ts` |
| Supabase client | `src/lib/supabase.ts` |
| Test setup | `src/test-utils/setup.ts` |
| CI workflow | `.github/workflows/ci.yml` |
| Deployment docs | `DEPLOYMENT.md` |
| Architecture decisions | `DECISIONS.md` |
| Expert data model | `IMPLEMENTATION_PLAN.md` (Phase 1-3 for schema/types/services detail) |

## Profile data
Tier 2 (Scholar + manual enrichment). Google Scholar is primary import source; manual fields (country, degree, bio, email, ORCID, LinkedIn, Scopus) remain required. Expert cards must degrade gracefully for partial profiles.

## Bundle verification
`npm run build:analyze` (Vite visualizer) + `npm run smoke:test` (300KB cap). Target: ≤150KB gzip initial JS.
