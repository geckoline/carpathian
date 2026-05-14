# Carpathian App — Improvement Plan

## Guiding Principles

| Principle | Meaning for this project |
|-----------|--------------------------|
| **KISS** | Remove dead code, simplify over-engineered abstractions, reduce wrapper hierarchy |
| **DRY** | Eliminate duplicated logic (fetching, sorting, validation, constants), consolidate barrels |
| **TDD** | Write tests BEFORE refactoring each module. Never refactor untested code. |
| **Coverage** | Target **≥80%** line/branch coverage. Enforced via vitest config threshold. |

---

## Pre-Plan: Coverage Baseline Estimation

Current state (approx. 45%) broken down:

| Module | Files | Current Coverage | Gap |
|--------|-------|-----------------|-----|
| **Types/schemas** (3 files) | `expert.ts`, `project.ts`, `volunteer.ts` | ~33% (only expert tested) | Missing `project.ts`, `volunteer.ts` |
| **Store** (1 file) | `appStore.ts` | ~70% | Missing edge cases in addProject/addExpert |
| **Services** (6 files) | `apiService`, `loadAppData`, `mockApi`, `importValidator`, `orcidService`, `serpapiService` | ~65% | Mostly covered, need edge cases |
| **Hooks** (13 files) | all in `src/hooks/` | ~35% | 8 tested, 5 untested |
| **Utils** (11 files) | all in `src/utils/` | ~5% | Only geometry tested |
| **Components** (~17 files) | cards, layout, map, modals, common, ui | ~20% | Only map components have tests |
| **App entry** (2 files) | `App.tsx`, `main.tsx` | 0% | Completely untested |
| **Lib** (2 files) | `supabase.ts`, `utils.ts` | ~30% | supabase tested, cn() not |

**80% target requires: every module ≥75%, with pure modules (utils, types, store) at ≥90%.**

### Coverage Threshold Configuration

Update `vitest.config.ts`:
```typescript
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html', 'lcov'],
    reportsDirectory: './reports/coverage',
    thresholds: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
}
```

---

## Phase 0: Baseline & Safety Net

**Goal**: Establish measurement, add coverage enforcement, fix critical bugs with tests first.

### Step 0.1 — Run baseline & enable coverage thresholds
```bash
npm run test:run -- --coverage
npm run typecheck
```
- Save `reports/baseline-coverage.txt`
- Add coverage thresholds to `vitest.config.ts` (start at 50% then ratchet up per phase)
- Add `reports/coverage/` to `.gitignore`

### Step 0.2 — Fix `useAppStore()` no-selector bug (CRITICAL — write test first)
**File**: `src/hooks/useExpertFilters.ts:7`
**Problem**: `const store = useAppStore()` subscribes to entire store — every zustand update re-renders.
**Fix**: Replace with individual selectors matching `useProjectFilters.ts:8`.
**Test**: `useExpertFilters.test.ts` — assert no re-render when unrelated store keys change.

### Step 0.3 — Fix `loadAppData.ts` bare parse throw
**File**: `src/services/loadAppData.ts:33-34`
**Fix**: Replace `.parse()` with `.safeParse()`, log warnings, skip invalid items.
**Test**: `loadAppData.test.ts` — add case with malformed data, assert partial load.

---

## Phase 1: Eliminate Dead Code (KISS)

**Goal**: Remove unused files before writing tests for them.

### Step 1.1 — Remove unused hooks (4 files)

| File | Reason | Action |
|------|--------|--------|
| `src/hooks/useSorting.ts` | Logic duplicated in `useProjectFilters.ts:21-26` | Delete |
| `src/hooks/useDataFetch.ts` | Superseded by `useRealtimeSync.ts` | Delete |
| `src/hooks/useOnlineStatus.ts` | Duplicated in `useRealtimeSync.ts:30-38` | Delete |
| `src/hooks/useMapSync.ts` | Trivial store wrapper, never imported | Delete |

### Step 1.2 — Remove unused components (5 files)

| File | Reason | Action |
|------|--------|--------|
| `src/components/map/TileToggle.tsx` | Built inline in `MapView.tsx` | Delete |
| `src/components/map/TileToggleWrapper.tsx` | Never imported | Delete |
| `src/components/map/MapPerformanceWrapper.tsx` | Never imported | Delete |
| `src/components/map/MapErrorBoundary.tsx` | Never imported | Delete |
| `src/components/map/MapDrawingWrapper.tsx` | Never imported | Delete |

### Step 1.3 — Remove unused utils (4 files)

| File | Reason | Action |
|------|--------|--------|
| `src/utils/polygonDrawing.ts` | Zero imports | Delete |
| `src/utils/envValidation.ts` | Never called | Delete |
| `src/utils/externalApi.ts` | Zero imports | Delete |
| `src/utils/text/` | Empty directory | Delete |

### Step 1.4 — Remove unused services (3 files)

| File | Reason | Action |
|------|--------|--------|
| `src/services/scholarService.ts` | 100% passthrough to `serpapiService` | Delete, redirect `importValidator.ts` imports |
| `src/lib/supabase/client.ts` | Unused (`src/lib/supabase.ts` creates client) | Delete |
| `src/lib/supabase/server.ts` | Server context unused in this Vite SPA | Delete |

### Step 1.5 — Consolidate barrels
- Remove `src/components/map/index.ts`
- Remove `src/components/index.ts`
- Update `src/hooks/index.ts` to export all remaining hooks
- Update `src/services/index.ts`

---

## Phase 2: Exhaustive Test Coverage (TDD — target 80%+)

**Goal**: Every single source file has a corresponding test file with ≥80% coverage.

> **Strategy**: Pure functions first (easy wins), then hooks, then components, then integration.

### Step 2.1 — Utils: all pure functions → ≥95% coverage

Pure functions are the easiest to test and contribute significant line count. Every util gets a dedicated test file.

| # | Source File | Test File | Key Scenarios |
|---|-------------|-----------|---------------|
| 2.1.1 | `src/utils/categories.ts` | `src/utils/__tests__/categories.test.ts` | `normalizeCategoryId` with IDs, labels, aliases, casing, null/undefined; `getCategoryLabel` with fallback; `getCategoryOptions` ordering |
| 2.1.2 | `src/utils/datasetScope.ts` | `src/utils/__tests__/datasetScope.test.ts` | `getDatasetProjects('cs')` filters CS only; `'all'` returns all; `getCitizenScienceProjectExperts` by leadExpertId, linkedExpertIds, contact email; edge: empty projects, no matching experts |
| 2.1.3 | `src/utils/projectFilterOptions.ts` | `src/utils/__tests__/projectFilterOptions.test.ts` | Returns correct facet counts; respects ignored axis; empty projects edge case |
| 2.1.4 | `src/utils/projectBadges.ts` | `src/utils/__tests__/projectBadges.test.ts` | All status labels; compact category mappings; unknown status/field fallback |
| 2.1.5 | `src/utils/cardShare.ts` | `src/utils/__tests__/cardShare.test.ts` | `buildCardShareUrl` produces correct URL with params and hash; `getShareTab`; `getCardAnchorId` |
| 2.1.6 | `src/utils/fuzzySearch.ts` | `src/utils/__tests__/fuzzySearch.test.ts` | Empty search returns all; partial name match; multi-key search; threshold behavior |
| 2.1.7 | `src/utils/geometry.ts` | `src/utils/__tests__/geometry.test.ts` *(exists already)* | Enhance: simplifyPolygon edge cases (≤2 points, already small); generateAutoCircle with positive/zero/negative radius |
| 2.1.8 | `src/utils/geometryUtils.ts` | `src/utils/__tests__/geometryUtils.test.ts` | `parseGeometryString` with POINT, POLYGON, malformed WKT; `getPolygonCoords`; `isPointGeometry` |
| 2.1.9 | `src/utils/polygonUtils.ts` | `src/utils/__tests__/polygonUtils.test.ts` | `getPolygonStyle` for each status + each field override; `generateMockPolygon`; `generateRealisticPolygonWKT`; `normalizeCoords`; `STATUS_COLORS` |
| 2.1.10 | `src/utils/highlightText.ts` | `src/utils/__tests__/highlightText.test.ts` | No search term; single match; multiple matches; regex special chars; empty text |
| 2.1.11 | `src/lib/utils.ts` | `src/utils/__tests__/cn.test.ts` | `cn` merges clsx + tailwind-merge correctly |

### Step 2.2 — Types/zod schemas → 100% coverage

| # | Source File | Test File | Key Scenarios |
|---|-------------|-----------|---------------|
| 2.2.1 | `src/types/project.ts` | `src/__tests__/projectSchema.test.ts` | `ProjectSchema` valid data; missing required fields; invalid lat/lng; invalid yearRange; optional field handling |
| 2.2.2 | `src/types/volunteer.ts` | `src/__tests__/volunteerSchema.test.ts` | `VolunteerSubscriptionSchema` valid; missing consent=false rejected; invalid email; radius boundaries |
| 2.2.3 | `src/types/expert.ts` | `src/__tests__/expertSchema.test.ts` *(exists)* | Enhance: ExpertFormSchema superRefine (both orcid+scholar missing); ProfileImageUrlSchema |

### Step 2.3 — Hooks: all hooks → ≥80% coverage

| # | Hook | Test File | Key Scenarios |
|---|------|-----------|---------------|
| 2.3.1 | `useRealtimeSync.ts` | `src/hooks/__tests__/useRealtimeSync.test.ts` | Fetch succeeds → sets projects/experts; fetch fails → sets error; online/offline events; cleanup on unmount |
| 2.3.2 | `useUrlSync.ts` | `src/hooks/__tests__/useUrlSync.test.ts` | URL params hydrate store correctly; scrollToTarget with retry; debounced URL write; pulse cleanup; share card links |
| 2.3.3 | `useApplyAccessibility.ts` | `src/hooks/__tests__/useApplyAccessibility.test.ts` *(exists)* | Enhance: localStorage restore; font-size/contrast/motion class toggling; theme class toggling |
| 2.3.4 | `useCardFlip.ts` | `src/hooks/__tests__/useCardFlip.test.ts` *(exists)* | Enhance: flip toggles state; isFlipping guard; durationMs; onFlip callback; timer cleanup on unmount |
| 2.3.5 | `useDebounce.ts` | `src/hooks/__tests__/useDebounce.test.ts` *(exists)* | Enhance: Value updates after delay; leading edge behavior; unmount cancels |
| 2.3.6 | `useLocalStorage.ts` | `src/hooks/__tests__/useLocalStorage.test.ts` *(exists)* | Enhance: reads existing value; writes new value; cross-tab sync via storage event; JSON parse error fallback |
| 2.3.7 | `useExpertFilters.ts` | `src/hooks/__tests__/useExpertFilters.test.ts` *(exists)* | Enhance: field filter matching (case-insensitive); country filter; combined filters; empty search |
| 2.3.8 | `useProjectFilters.ts` | `src/hooks/__tests__/useProjectFilters.test.ts` *(exists)* | Enhance: sorting by each key (name, status, field, yearRange); asc/desc; combined filter + sort |
| 2.3.9 | `useProjectSubmission.ts` | `src/hooks/__tests__/useProjectSubmission.test.ts` | Submit success → statusMessage success; offline → throws; missing leadExpert → throws; API failure → warning message |
| 2.3.10 | `useVolunteerSubscription.ts` | `src/hooks/__tests__/useVolunteerSubscription.test.ts` | Submit success; offline throws; API error → error status message |
| 2.3.11 | `usePolygonLayer.ts` | `src/hooks/__tests__/usePolygonLayer.test.ts` *(exists)* | No selectedProjectId → []; selected project found → returns polygon; fallback to mock polygon; style matches status/field |
| 2.3.12 | `useCardShare.ts` | `src/hooks/__tests__/useCardShare.test.ts` | Builds share URL; copy calls clipboard API; clipboard fallback to execCommand |
| 2.3.13 | `useModal.ts` (new in Phase 3) | `src/hooks/__tests__/useModal.test.ts` | Initial state; open/close toggle |

### Step 2.4 — Store: appStore → ≥90% coverage

| # | Test File | Key Scenarios |
|---|-----------|---------------|
| 2.4.1 | `src/store/__tests__/appStore.dataFlow.test.ts` *(exists)* | Enhance: `addProject` with defaults; `addProject` missing leadExpertId throws; `addExpert` with partial data; `clearFilters` resets all; `setA11y` partial update; `setDraftPolygon`; all filter setters |

### Step 2.5 — Services: edge case coverage

| # | Service | Test | Key Additions |
|---|---------|------|---------------|
| 2.5.1 | `apiService.ts` | `apiService.test.ts` *(exists)* | `toProjectData` with null fields; `toExpertData` with null fields; `parseYearRange` edge cases |
| 2.5.2 | `loadAppData.ts` | `loadAppData.test.ts` *(exists)* | Malformed data → safeParse still returns partial results |

### Step 2.6 — Components: all components → ≥75% coverage

#### 2.6.1 — Common components

| # | Component | Test File | Key Scenarios |
|---|-----------|-----------|---------------|
| 2.6.1.1 | `Modal.tsx` | `src/components/common/__tests__/Modal.test.tsx` | Renders when open; closes on Escape; overlay click closes; trap focus cycles Tab; restores focus on unmount; portal renders to body; `size` prop applies correct class; aria attributes |
| 2.6.1.2 | `ErrorBoundary.tsx` | `src/components/common/__tests__/ErrorBoundary.test.tsx` | Renders children normally; catches error → shows fallback; "Try Again" resets state; custom fallback prop |

#### 2.6.2 — Card components

| # | Component | Test File | Key Scenarios |
|---|-----------|-----------|---------------|
| 2.6.2.1 | `ProjectCard` | `src/components/cards/__tests__/ProjectCard.test.tsx` | Renders project data; status badge; category badge; flip interaction (if card flip used); share button |
| 2.6.2.2 | `ExpertCard` | `src/components/cards/__tests__/ExpertCard.test.tsx` | Renders expert data; expertise list; institution; card flip; share link |

#### 2.6.3 — Layout components

| # | Component | Test File | Key Scenarios |
|---|-----------|-----------|---------------|
| 2.6.3.1 | `StatsSection` | `src/components/layout/__tests__/StatsSection.test.tsx` | Renders project/expert counts; handles zero; handles large numbers |
| 2.6.3.2 | `FilterBar` | `src/components/layout/__tests__/FilterBar.test.tsx` | Search input updates store; status/field/country filter dropdowns; clear filters button |
| 2.6.3.3 | `FilterControls` | `src/components/layout/__tests__/FilterControls.test.tsx` | Compact variant rendering; filter change callbacks |
| 2.6.3.4 | `AccessibilityControls` | `src/components/layout/__tests__/AccessibilityControls.test.tsx` | Font size +/-; high contrast toggle; reduced motion toggle |

#### 2.6.4 — Map components (existing tests enhanced)

| # | Component | Test | Key Additions |
|---|-----------|------|---------------|
| 2.6.4.1 | `MapView.tsx` | `MapView.test.tsx` *(exists)* | Marker rendering for each project; cluster group; polygon layer; map type toggle; label toggle |
| 2.6.4.2 | `MapSidebar.tsx` | `MapSidebar.test.tsx` *(exists)* | Project list rendering; selection highlighting; pulse animation; empty state; add/volunteer buttons |
| 2.6.4.3 | `ProjectPolygon.tsx` | `ProjectPolygon.test.tsx` *(exists)* | Style props applied; click → setSelectedProjectId; hover events; tooltip |
| 2.6.4.4 | `MapDrawingControl.tsx` | `MapDrawingControl.test.tsx` *(exists)* | Polygon created → coordinates callback; cleanup on unmount |

#### 2.6.5 — Modal components

| # | Component | Test File | Key Scenarios |
|---|-----------|-----------|---------------|
| 2.6.5.1 | `AddProjectModal` | `src/components/modals/__tests__/AddProjectModal.test.tsx` | Form renders; validation errors; submit calls handler; offline state |
| 2.6.5.2 | `AddExpertModal` | `src/components/modals/__tests__/AddExpertModal.test.tsx` | ORCID/scholar validation; form submit; conflict dialog |
| 2.6.5.3 | `VolunteerModal` | `src/components/modals/__tests__/VolunteerModal.test.tsx` | Consent checkbox required; category selection; submit |

#### 2.6.6 — UI components

| # | Component | Test File | Key Scenarios |
|---|-----------|-----------|---------------|
| 2.6.6.1 | `ThemeToggle` | `src/components/ui/__tests__/ThemeToggle.test.tsx` | Toggles between theme modes; icon changes |
| 2.6.6.2 | `SkeletonCard` | `src/components/ui/__tests__/SkeletonCard.test.tsx` | Renders for both project/expert types |

### Step 2.7 — App integration tests → 80% paths

| # | Test File | Key Scenarios |
|---|-----------|---------------|
| 2.7.1 | `src/__tests__/App.integration.test.tsx` | Full render with mock store; loading → data; error state; dataset tab switching; filter bar interaction; modal open/close flow; cross-pane selection sync (map ↔ sidebar ↔ cards) |
| 2.7.2 | `src/__tests__/main.test.tsx` | Throws when mount point missing; renders App in StrictMode |

---

## Phase 3: Eliminate Duplication (DRY)

**Goal**: Extract shared logic, eliminate repeated patterns — with tests covering all new code BEFORE extraction.

### Step 3.1 — Extract shared constants

**New file**: `src/utils/constants.ts`

```typescript
export const DEFAULT_CENTER = { lat: 47.5, lng: 25 } as const;
export const MAP_ZOOM = { default: 6, selected: 9, fitBounds: 12 } as const;
export const CATEGORY_FALLBACK = 'biodiversity' as const;
```

**Test**: `src/utils/__tests__/constants.test.ts` — values are correct, not mutated.

Replace all inline occurrences (verify with grep):
- `useProjectSubmission.ts:9` → `DEFAULT_CENTER`
- `MapView.tsx:212` (46.5, 25.0 is different! Align with DEFAULT_CENTER)

### Step 3.2 — Extract `normalizeCategoryWithFallback` helper

**File**: `src/utils/categories.ts`
```typescript
export const normalizeCategoryWithFallback = (
  categoryId?: string | null,
  field?: string | null,
  fallback: CategoryId = CATEGORY_FALLBACK
): CategoryId => normalizeCategoryId(categoryId ?? field) ?? fallback;
```

Replace in 4 files (same pattern, grep for `?? 'biodiversity'`):
- `apiService.ts:52`, `apiService.ts:129`
- `store/appStore.ts:124`
- `useProjectSubmission.ts:31`

### Step 3.3 — Extract `useModal` hook

**New file**: `src/hooks/useModal.ts`
```typescript
export const useModal = (initial = false) => {
  const [isOpen, setIsOpen] = useState(initial);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  return { isOpen, open, close };
};
```

**Test**: Written in Phase 2.3.13.

Replace 3 identical `useState` + handlers in `App.tsx:40-42`.

### Step 3.4 — Remove duplicated polygon validation

Both `usePolygonDraw.ts` and `polygonDrawing.ts` are already marked for deletion in Phase 1.

### Step 3.5 — Consolidate ErrorBoundary

Delete `MapErrorBoundary.tsx`. Add `variant` prop to `ErrorBoundary.tsx`:
```typescript
interface Props { children: ReactNode; fallback?: ReactNode; variant?: 'default' | 'map'; }
```

### Step 3.6 — Remove duplicate online/offline logic

The online/offline listener in `useRealtimeSync.ts:30-38` is the canonical version. Delete `useOnlineStatus.ts` (Phase 1.1) and ensure no remaining code imports it.

---

## Phase 4: Simplify Architecture (KISS)

**Goal**: Reduce unnecessary layers with TDD — refactor only modules that already have ≥80% test coverage.

### Step 4.1 — Consolidate data fetching

Rename `useRealtimeSync.ts` → `useDataLoader.ts`:
- Same interface, clearer name
- Update `App.tsx` import

### Step 4.2 — Simplify `useCardFlip.ts`

Remove `isFlippingRef` (redundant with `isFlipping` state):
```typescript
const toggle = useCallback(() => {
  if (isFlipping) return;
  setIsFlipped(prev => { const next = !prev; onFlip?.(next); return next; });
  setIsFlipping(true);
  clearTimer();
  timerRef.current = window.setTimeout(() => {
    setIsFlipping(false);
    timerRef.current = null;
  }, durationMs);
}, [durationMs, onFlip, clearTimer, isFlipping]);
```

### Step 4.3 — Simplify `highlightText.ts`

Sanitize once, not per loop iteration:
```typescript
export const highlightText = (text: string, searchTerm: string): { __html: string } => {
  if (!searchTerm.trim()) return { __html: DOMPurify.sanitize(text, { ALLOWED_TAGS: [] }) };
  const safeText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const html = safeText.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>'
  );
  return { __html: html };
};
```

### Step 4.4 — Extract `useScrollToElement` from `useUrlSync.ts`

Move scroll logic to its own hook:
```typescript
export const useScrollToElement = (options?: { maxRetries?: number; retryDelay?: number }) => {
  // scrollToTarget with retry, pulse animation, cleanup
};
```
This reduces `useUrlSync.ts` from ~151 lines to ~80.

### Step 4.5 — Remove unused default exports

Several components export both named and default (e.g., `MapView`, `Modal`, `ErrorBoundary`). Pick one convention — named only — and update lazy imports in `App.tsx`.

```typescript
// Before
const MapView = lazy(() => import('@/components/map/MapView'));
// After (if named export becomes default)
const MapView = lazy(() => import('@/components/map/MapView'));
```

Check `App.tsx:20-23` — all use `lazy(() => import(...))` which resolves the module default. Ensure all lazy-loaded components have a `export default`.

---

## Phase 5: Performance Optimization

**Goal**: Fix rendering hot spots.

### Step 5.1 — Memoize computed data in `App.tsx`

```typescript
const projectsToFilter = useMemo(
  () => getDatasetProjects(dataset, data.projects),
  [dataset, data.projects]
);
const expertsToFilter = useMemo(
  () => getDatasetExperts(dataset, data.projects, data.experts),
  [dataset, data.projects, data.experts]
);
const emptyState = useMemo(
  () => ({
    title: filters.activeTab === 'projects' ? 'No projects found' : '...',
    description: '...',
  }),
  [dataset, filters.activeTab]
);
```

### Step 5.2 — Fix `usePolygonLayer.ts` memoization

Change deps from `[sourceProjects, selectedProjectId]` to `[selectedProjectId]` — the component returns `[]` when no project is selected anyway, and the find is O(n) on tiny datasets:

```typescript
return useMemo(() => {
  if (!selectedProjectId) return [];
  const project = sourceProjects.find(p => p.id === selectedProjectId);
  // ...
}, [selectedProjectId]);
// Also include sourceProjects if it's stable by reference
// But since useAppStore selects array, it IS stable
```

### Step 5.3 — Memoize `MapSidebar` list items

Wrap the project button in `React.memo` to prevent re-rendering all sidebar items when only one selection changes:
```typescript
const SidebarProjectItem = React.memo(({ project, isSelected, ... }) => { ... });
```

---

## Phase 6: Verification & Coverage Gate

**Goal**: Confirm ≥80% coverage, zero type errors, clean build.

### Step 6.1 — Run full typecheck
```bash
npm run typecheck
```

### Step 6.2 — Run full test suite with threshold enforcement
```bash
npm run test:run -- --coverage
```
Coverage thresholds are now in `vitest.config.ts` — the build **fails** if below 80%.

### Step 6.3 — Run build
```bash
npm run build
```

### Step 6.4 — Merge plan into `.github/workflows` or CI config
- Add a CI step: `npm run typecheck && npm run test:run -- --coverage`
- Coverage reports go to `reports/coverage/`

---

## Execution Order

```
Phase 0 (Baseline + critical bugfixes)
  ├── 0.1 Run baseline, add coverage thresholds
  ├── 0.2 Fix useExpertFilters selector (test first)
  └── 0.3 SafeParse in loadAppData (test first)
        │
Phase 1 (Dead code removal — no tests needed for deleted files)
  ├── 1.1 Delete 4 unused hooks
  ├── 1.2 Delete 5 unused components
  ├── 1.3 Delete 3 unused utils + empty dir
  ├── 1.4 Delete 3 unused services
  └── 1.5 Consolidate barrels
        │
Phase 2 (Test coverage — write tests for everything remaining)
  ├── 2.1 Utils: 11 test files (easiest, high line count)
  ├── 2.2 Types: 3 schema test files (100% coverage target)
  ├── 2.3 Hooks: 12 test files
  ├── 2.4 Store: 1 enhanced test file
  ├── 2.5 Services: 2 enhanced test files
  ├── 2.6 Components: ~17 test files across 6 subdirs
  └── 2.7 App integration: 2 test files
        │
Phase 3 (DRY — extract shared code)
  ├── 3.1 Shared constants + test
  ├── 3.2 normalizeCategoryWithFallback + test
  ├── 3.3 useModal hook + test
  ├── 3.4 Remove polygon duplication
  ├── 3.5 Consolidate ErrorBoundary
  └── 3.6 Remove duplicate online/offline
        │
Phase 4 (KISS — simplify existing code)
  ├── 4.1 Rename useRealtimeSync → useDataLoader
  ├── 4.2 Simplify useCardFlip
  ├── 4.3 Simplify highlightText
  ├── 4.4 Extract useScrollToElement
  └── 4.5 Remove unused default exports
        │
Phase 5 (Optimization)
  ├── 5.1 Memoize App.tsx computed data
  ├── 5.2 Fix usePolygonLayer deps
  └── 5.3 Memoize MapSidebar list items
        │
Phase 6 (Verification gate)
  ├── 6.1 TypeScript check
  ├── 6.2 Test suite + coverage (80% threshold enforced)
  ├── 6.3 Build
  └── 6.4 CI config update
```

---

## Coverage Target Matrix

| Module | Files | Lines Est. | Min Target | Test Files |
|--------|-------|-----------|------------|------------|
| Types | 3 | ~120 | **100%** | 4 (inc. enhancements) |
| Utils | 11 | ~550 | **95%** | 12 (inc. constants + cn) |
| Store | 1 | ~160 | **90%** | 1 (enhanced) |
| Services | 4*(after cleanup)* | ~450 | **80%** | 6 (enhanced) |
| Hooks | 13 | ~500 | **80%** | 15 (inc. new hooks) |
| Components | ~17 | ~1200 | **75%** | 17 (new) |
| App entry | 2 | ~240 | **75%** | 2 (new) |
| Lib | 2 | ~30 | **90%** | 2 |
| **Total** | **~53** | **~3250** | **≥80%** | **~55** |

---

## Quick Stats

| Metric | Before | Target After |
|--------|--------|--------------|
| Source files | ~65 | ~53 (-12 dead) |
| Test files | ~30 | ~55 (+25 new, +5 enhanced) |
| Line coverage | ~45% | **≥80%** (enforced) |
| Branch coverage | ~35% | ≥75% (enforced) |
| Function coverage | ~40% | ≥80% (enforced) |
| Dead code files | ~17 | 0 |
| `tsc --noEmit` errors | unknown | 0 |
