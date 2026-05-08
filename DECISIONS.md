# Architecture Decisions Log

## Core Stack
- **Framework:** Vite 8 + React 18 + TypeScript (strict)
- **Styling:** Tailwind v4 (CSS-first `@import "tailwindcss"`, zero PostCSS conflicts)
- **State:** Zustand + Immer (single store, typed slices: `filters`, `ui`, `data`, `a11y`)
- **Testing:** Vitest + RTL + `userEvent` + `jest-dom` (TDD flow, `jsdom` env)
- **Map:** Leaflet + react-leaflet + react-leaflet-markercluster (clustering, tile toggle)

## Data Flow
- Mock API (`mockApi.ts`) → `useDataFetch` hook → Zustand `data` slice → UI
- Zod schemas validate all incoming data at the service boundary
- Filters computed via `useProjectFilters` & `useExpertFilters` (memoized, store-connected)
- Search highlighting via `highlightText` utility (DOMPurify sanitization)

## Component Strategy
- Unified `ProjectCard` & `ExpertCard` (no legacy variants)
- Local flip state via `useCardFlip` (KISS: micro-interactions stay local)
- Cross-component state (selection, filters, data) lifted to Zustand
- Map integration: `MapView` + `TileToggle` + `ProjectPolygon` + clustering
- Accessibility: ARIA labels, `aria-expanded`, `aria-pressed`, reduced-motion support
- `AccessibilityControls` panel (font size, high contrast, reduced motion)

## Build/Config
- Aliases: `@/*`, `@store/*`, `@hooks/*`, `@components/*`, `@services/*`
- No `react-router-dom` (single-page filter + grid + map layout)
- WordPress/Elementor shell remains external; app mounts to `#citizen-science-root`
- CI: GitHub Actions (typecheck → test:run → build)

## Completed Phases
- ✅ M1: Foundation (Vite 8, TS strict, Tailwind v4, Zustand)
- ✅ M2W1: Search + API (useExpertFilters, DOMPurify highlighting, retry logic)
- ✅ M2W2: Map Enhancements (MapView, clustering, tile toggle, polygon layers)
- ✅ M2W3: A11y + UI Polish (Modal, ErrorBoundary, AccessibilityControls)
- ✅ M2W4: CI/CD (ci.yml, DEPLOYMENT.md)
- ✅ M4W1: Direct Demo Entry (DemoEntry tests, demo mode wiring, AnimatedCounter mock)
- ✅ M4W2: Map & Polygon Polish (draftPolygon store sync, TileToggleWrapper caching, MapView smoke tests)
- ✅ M4W3: Performance + Lighthouse (smoke-test.mjs, lighthouse-check.mjs, bundleSanity.test.ts, bundle cap targets)

## Pacing & Workflow
- Layer-by-layer rebuild (Foundation → State/Hooks → Components → Integration)
- TDD enforced: tests written before implementation
- Energy-aware: ≤5 micro-steps/day, complex tasks PM, simple tasks AM
- RED protocol active: drop planning → care mode on sensory overload

## Key Dependencies Added
- `zustand`, `immer`, `zod` (state + validation)
- `leaflet`, `react-leaflet`, `react-leaflet-markercluster` (map)
- `lucide-react` (icons)
- `dompurify` (search highlighting sanitization)
- `@tailwindcss/vite` (v4 CSS-first)
