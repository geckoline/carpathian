# Round 3 — Implementation Plan

**Current baseline (2026-05-15): 66 test files, 417 tests, 0 tsc errors, build passes**

---

## Baseline

| Check | Status |
|-------|--------|
| `tsc --noEmit` | Pass |
| `npm run test:run` | 66 files, 417 tests — all passing |
| `npm run build` | Pass |
| Statement coverage | 89.93% |
| Branch coverage | 75.77% |
| Function coverage | 91.87% |
| Line coverage | 91.67% |

---

## 🔴 P0 — Dead Code Removal — ~15 min

| File | Reason | Action |
|------|--------|--------|
| `src/hooks/useLoadAppData.ts` | Defined but never imported in production (only in its own test) | Delete file + test |
| `src/utils/geometry.ts` | Defines `simplifyPolygon`, `generateAutoCircle` — only imported in `geometry.test.ts` | Delete file + test |

**Note:** The files flagged in the earlier overview (`useOnlineStatus.ts`, `TileToggle.tsx`, etc.) **no longer exist** — already cleaned up.

---

## 🔴 P1 — Extract `FlippableCard` Wrapper (#62) — ~3 hours

**Goal:** Extract shared card-flip boilerplate from ExpertCard + ProjectCard.

### Approach

Create `src/components/cards/CardShell.tsx` — a composition wrapper that accepts `front`/`back` as `ReactNode` + callbacks.

### Steps
1. Create `CardShell` with shared flip/share/keyboard logic
2. Update `ExpertCard` to use `CardShell`
3. Update `ProjectCard` to use `CardShell`
4. Remove `useCardFlip` + `useCardShare` + `handleSurfaceFlip` + `handleFlipKeyDown` from both cards
5. Run tests, fix regressions

**TDD:** Existing card tests (417 total) must still pass.

---

## 🟠 P2 — Coverage Gaps — ~3 hours

### P2a — AddExpertModal coverage (currently 29% statements)

Priority: Highest gap. Add tests for:
- Form validation paths (missing fields, invalid email)
- Conflict dialog triggering (imported data conflicts)
- Submit success/error paths
- ORCID fetch success/failure

**Target:** 80% statements, 60% branches

### P2b — Branch coverage fixes (<70%)

| File | Branches | Action |
|------|----------|--------|
| `apiService.ts` | 45.37% | Add tests for error handling, null field transforms |
| `AccessibilityControls.tsx` | 50.00% | Toggle state tests |
| `useVolunteerSubscription.ts` | 50.00% | Success/error path tests |
| `useRealtimeSync.ts` | 33.33% | Online/offline transitions, fetch errors |
| `VolunteerModal.tsx` | 62.50% | Consent validation, submit states |

### P2c — Coverage threshold enforcement

Add to `vitest.config.ts`:
| Metric | Target |
|--------|--------|
| Statements | 80% |
| Branches | 70% |
| Functions | 80% |
| Lines | 80% |

Start at current levels to prevent regression, ratchet up per cycle.

---

## 🟡 P3 — CSS Maintenance — ~1.5 hours

### P3a — Replace hardcoded CSS colors (#76) — ~30 min

| Current | Replace with | Lines |
|---------|-------------|-------|
| `#1f2a21` | `var(--color-text)` | 3 instances |
| `#236748` | `var(--color-primary-700)` | 2 instances |
| `#536057` | `var(--color-text-muted)` | 4 instances |
| `#1b4d35` | `var(--color-primary-800)` | 1 instance |

### P3b — Split `index.css` by domain (#48) — ~1 hour

Create:
- `src/styles/cards.css` — card-face, card-flip-stage, flip animations
- `src/styles/a11y.css` — high-contrast, reduced-motion, theme-dark, theme-reduced-color
- Keep in `index.css`: `@import "tailwindcss"`, font imports, `@theme` tokens, status pills, map styles (~300 lines)

**TDD:** Build must produce same output. Visual regression check.

---

## 🟢 P4 — Missing Tests (#49) — ~2 hours

1. **`ExportButton.test.tsx`** — render, CSV click, JSON click, disabled state
2. **`FilterControls.test.tsx`** — search input, dropdown selects, clear button, compact variant
3. **`useCardShare.test.ts`** — URL generation, clipboard write, copied state, error handling

Keep tests simple — behavior assertions only, no CSS class assertions.

---

## ⚪ P5 — Integration Tests (#52) — ~1 hour

1. **`FilterFlow.integration.test.tsx`** — render App with mock data, apply filters, verify card list updates
2. Extend `DatasetTabs.test.tsx` — test loading state, error state

---

## ⚪ P7 — Quick Code Cleanup (S1-S8) — ~1.5 hours

**S1 — Fix inline `onSubmit` handlers in `App.tsx`** — ~20 min
Move inline async arrow functions at lines 241, 251-270, 279 into named `useCallback` handlers.

**S2 — Stable `ProjectPolygon` event handlers in `MapView.tsx`** — ~15 min
Inline `() => setHoveredProjectId(p.projectId)` in `.map()` loop (lines 249-250) create new functions every render. Extract factory via `useCallback`.

**S3 — Fix production `any` types** — ~15 min
- `src/App.tsx:68`: `(item: any)` → `(item: ProjectData | ExpertData)`
- `src/hooks/useLoadAppData.ts:5`: `setProjects: any` etc. → proper types (if file survives P0)

**S4 — Add `React.memo` to high-churn components** — ~30 min
| Component | File |
|-----------|------|
| `ProjectCard` | `src/components/cards/ProjectCard.tsx:55` |
| `ExpertCard` | `src/components/cards/ExpertCard.tsx:41` |
| `StatsSection` | `src/components/layout/StatsSection.tsx:6` |
| `ProjectPolygon` | `src/components/map/ProjectPolygon.tsx:15` |

**S5 — Add `useModal` to hooks barrel** — ~5 min
Add `export { useModal } from './useModal'` to `src/hooks/index.ts`.

**S6 — Graceful error in `addProject` instead of throw** — ~10 min
`src/store/appStore.ts:92-94` — `throw new Error(...)` inside immer produce. Replace with return value / status.

**S7 — Covered by P0** (`useLoadAppData.ts` gets deleted, ref-in-render issue goes away).

**S8 — Clean up `MapDrawingControl` dynamic import casts** — ~10 min
`src/components/map/MapDrawingControl.tsx:41-51` — multiple `as` casts for `leaflet-draw`. Replace with strict types or inline module declaration.

---

## ⚪ P6 — Infrastructure — ~1 hour

### CI Pipeline

Create `.github/workflows/ci.yml` with:
- `tsc --noEmit`
- `vitest run --coverage`
- `vite build`

### Accessibility Audit

Manual audit for:
- Keyboard navigation (tab order, focus indicators, skip links)
- Screen reader (ARIA labels, roles, live regions)
- Color contrast (WCAG AA 4.5:1)

---

## Summary

| # | Item | Effort | Type | Risk |
|---|------|--------|------|------|
| P0 | Dead code removal | ~15m | Cleanup | Low |
| P1 | FlippableCard wrapper (#62) | ~3h | Refactor | Medium |
| P2 | Coverage gaps (tests) | ~3h | Testing | Low |
| P3 | CSS maintenance (#48, #76) | ~1.5h | Structure | Low |
| P4 | Missing component tests (#49) | ~2h | Testing | Low |
| P5 | Integration tests (#52) | ~1h | Testing | Low |
| P6 | Infrastructure (CI, a11y audit) | ~1h | Ops | Low |
| P7 | Quick code cleanup (S1-S8) | ~1.5h | Cleanup | Low |
| **Total** | | **~13h** | | |
