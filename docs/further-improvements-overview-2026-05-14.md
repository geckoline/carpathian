# Further Improvements Overview

Date: May 14, 2026

## Current Baseline

| Check | Status |
|-------|--------|
| `tsc --noEmit` | Pass |
| `npm run test:run` | 64 files, 379 tests — all passing |
| `npm run build` | Pass (main chunk 292 kB gzip 76 kB) |
| Statement coverage | 89.93% |
| Branch coverage | 75.77% |
| Function coverage | 91.87% |
| Line coverage | 91.67% |
| Browser smoke | Verified |

All phases from `further-improvements-roadmap-2026-05-09.md` are marked `[DONE]`.

---

## Remaining Issues

### 1. Dead Code Removal

| File | Reason | Action |
|------|--------|--------|
| `src/hooks/useOnlineStatus.ts` | Not imported by any production code; redundant with online/offline handling in `useRealtimeSync.ts` | Delete |
| `src/components/map/TileToggle.tsx` | Not imported by any production code | Delete |
| `src/components/map/TileToggleWrapper.tsx` | Not imported by any production code | Delete |
| `src/components/map/index.ts` barrel | Exports `TileToggle` which is unused | Clean up export |

### 2. Coverage Gaps

**Files below 80% statement coverage:**

| File | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| `AddExpertModal.tsx` | 29.29% | 37.60% | 53.33% | 33.72% |
| `ThemeToggle.tsx` | 50.00% | 50.00% | 25.00% | 50.00% |
| `apiService.ts` | 76.31% | 45.37% | 94.11% | 84.61% |

**Files with low branch coverage (<70%):**

| File | Branches | Concern |
|------|----------|---------|
| `AddExpertModal.tsx` | 37.60% | Conflict dialog, form validation paths |
| `apiService.ts` | 45.37% | Error handling, null field transforms |
| `AccessibilityControls.tsx` | 50.00% | Toggle states |
| `useVolunteerSubscription.ts` | 50.00% | Success/error paths |
| `useRealtimeSync.ts` | 33.33% | Online/offline transitions, fetch errors |
| `VolunteerModal.tsx` | 62.50% | Consent validation, submit states |

### 3. Missing Coverage Threshold Enforcement

`vitest.config.ts` currently has **no coverage thresholds**. Without enforcement, coverage can regress. Recommended minimums:

| Metric | Target |
|--------|--------|
| Statements | 80% |
| Branches | 70% |
| Functions | 80% |
| Lines | 80% |

### 4. No CI Pipeline

The project has no CI configuration (no `.github/workflows/`). A CI pipeline should enforce:
- `tsc --noEmit`
- `vitest run --coverage`
- `vite build`

### 5. No Accessibility Audit

The May 9 roadmap references a blocked visual comparison with the backup reference app. An independent a11y audit (keyboard navigation, focus management, contrast, screen reader) would confirm whether the current implementation meets WCAG standards without relying on the backup.

---

## Recommended Prioritization

```
P0 — Dead code removal (low effort, high cleanliness impact)
  ├── Delete useOnlineStatus.ts + barrel cleanup
  ├── Delete TileToggle.tsx, TileToggleWrapper.tsx + barrel cleanup
  └── Run validation

P1 — AddExpertModal coverage gap (current coverage is critically low at 29%)
  ├── Add test coverage for form validation, conflict dialog, submit paths
  └── Minimum target: 80% statements

P2 — Enforce coverage thresholds in vitest.config.ts
  ├── Start at current levels to prevent regression
  └── Ratchet up per improvement cycle

P3 — Fix remaining branch coverage gaps
  ├── apiService.ts (45% branches)
  ├── useRealtimeSync.ts (33% branches)
  ├── ThemeToggle.tsx
  ├── AccessibilityControls.tsx
  ├── VolunteerModal.tsx
  └── useVolunteerSubscription.ts

P4 — Set up CI pipeline
  ├── GitHub Actions workflow
  └── typecheck + test + build gates

P5 — Accessibility audit
  ├── Keyboard navigation pass
  ├── Screen reader pass
  └── Contrast compliance check
```
