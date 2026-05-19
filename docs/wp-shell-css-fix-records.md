# WP Shell CSS Fix Records

**Date:** 2026-05-19  
**Context:** Reset to `c8474d5` (pre-WP-integration baseline). Standalone app works correctly with map sidebar cards, all Tailwind preflight/theme/utilities loaded via `@import "tailwindcss"`.  
**Test:** `npm run build && npm run typecheck && npm run test:run`

---

## Why c8474d5?

Commit `c8474d5` is the last state before `e083451` (HTML integration start) introduced changes that regressed the standalone rendering:

| Commit | State | Map sidebar cards |
|--------|-------|-------------------|
| `c8474d5` | Pre-WP-integration. `@import "tailwindcss"` (includes preflight). A11y selectors use `html.xxx` globally. `body` has gradient background. `document.documentElement` targeted by a11y hook. No `citizen-science-page.html`. No `tailwind.config.ts`. Single Vite entry. | ✅ Working |
| `e083451` | HTML integration added. `@import "tailwindcss"` replaced with explicit layers — **preflight omitted**. A11y selectors changed to `#citizen-science-root.xxx`. `body` margin reset removed. `vite.config.ts` adds base path + dual entry. `useApplyAccessibility` targets `#citizen-science-root`. | ❌ Lost |

The root cause of the regression at `e083451` was the `index.css` restructuring:
1. **Preflight omitted** — `@import "tailwindcss"` was replaced with `@import "tailwindcss/theme.css"` + `@import "tailwindcss/utilities.css"`, skipping `preflight.css`. This removed `box-sizing: border-box` from `*, *::before, *::after`, default body resets, font smoothing, and other baseline CSS that components depend on.
2. **`body` margin reset removed** — `body { margin: 0 }` was deleted, shifting the entire app by 8px.
3. **A11y selector scope change** — `html.high-contrast` → `#citizen-science-root.high-contrast` required the a11y hook to target the root instead of `<html>`. In standalone mode where `#citizen-science-root` is the only container, these selectors should still work — but the combination of missing preflight + removed body margin + a11y hook change caused layout/compositing issues that broke sidebar card rendering.

---

## Full Project History

### Phase 1: Commit `c8474d5` — Clean Standalone Baseline
- Single-page Vite app with `index.html`
- `@import "tailwindcss"` (includes preflight, theme, utilities)
- `body { margin: 0; font-family: ...; background: ... }`
- `html.high-contrast`, `html.theme-dark` selectors in a11y.css/cards.css
- `useApplyAccessibility` targets `document.documentElement`
- Leaflet CSS loaded as side-effect import
- Map sidebar cards working

### Phase 2: Commit `e083451` — HTML Integration Start
- Added `citizen-science-page.html` (WP shell with Elementor)
- Added `public/wp-snapshot/` (WP static assets for shell)
- Added `scripts/prepare-wp-shell.mjs`, `scripts/deploy-to-wp.mjs`
- Added `reference/wp/` (original WP page backup)
- Added `tailwind.config.ts` (block `container` utility)
- Changed `vite.config.ts` (base path `/wp-content/themes/citizen-science-app/`, dual entries)
- **`index.css` restructured:**
  - `@import "tailwindcss"` → explicit `@import "tailwindcss/theme.css"` + `@import "tailwindcss/utilities.css"` (no preflight)
  - `body` styles → `#citizen-science-root` styles
  - `body { margin: 0 }` removed
  - Added explicit `#citizen-science-root { width: 100%; min-height: 100vh; max-width: none }`
  - Added `#citizen-science-root, #citizen-science-root * { box-sizing: border-box }` (but NOT `::before/::after`)
  - `@layer base { ... }` → `#citizen-science-root * { border-color }`
- **a11y.css/cards.css:** All `html.xxx` → `#citizen-science-root.xxx` selectors
- **useApplyAccessibility.ts:** Targets `#citizen-science-root` instead of `<html>`; cleans up `<html>` classes
- **Side effect:** Map sidebar cards stopped rendering correctly

### Phase 3: Commits `1895d42`→`e0b3747` — WP Shell Fix Overrides
- Phase 1-8 CSS overrides for WP shell (rem drift, cascade, generator, geometry, map, buttons, runtime assets, a11y)
- Then full override set (double-ID selectors, rem→px, gradient hard-codes, `!important`)
- Root `width: 100%` removed (critical fix — unblocked WP shell width)
- Pixel diff final: stats-grid **1.48%**, flipcard **80.45%** (Chrome gradient compositor bug)
- Commits: `1895d42` → `f9053ef` → `e0b3747`

### Phase 4: Shadow DOM Attempt (uncommitted)
- `attachShadow({ mode: 'open' })` on root, CSS via `?inline`, React mounted inside shadow
- Modal portal to shadow root, a11y hook targets shadow-internal mount point
- All selectors converted to shadow DOM scope (`:host`, no ID prefix)
- **Build and tests passed** (428 tests)
- **Problems:** Leaflet CSS not injected into shadow (fixed via `?inline`), Tailwind preflight missing, dev server crashed with Playwright
- **Decision: Rolled back** — Shadow DOM adds complexity across the stack without fixing the Chrome gradient compositor bug

---

## Root Causes Summary

| # | Problem | Fix | Status |
|---|---------|-----|--------|
| 1 | `body { margin: 0 }` removed at `e083451` | Re-add `body { margin: 0 }` or restore `@import "tailwindcss"` | Fixed at `c8474d5` |
| 2 | Preflight omitted at `e083451` | Restore `@import "tailwindcss"` which includes preflight | Fixed at `c8474d5` |
| 3 | A11y selectors scoped to root instead of `<html>` | Keep `html.xxx` for global a11y or ensure root always has the class | TBD |
| 4 | WP `html { font-size: 10px }` rem drift | Tailwind CSS variable overrides (`--spacing`, `--text-*` px values) | TBD |
| 5 | WP CSS cascade beats layered utilities | Double-ID selectors for critical overrides | TBD |
| 6 | Chrome gradient compositor bug | Not fixable via CSS (~55% of flipcard diff) | Accept |

---

## Key Files at c8474d5

| File | Role |
|------|------|
| `src/index.css` | `@import "tailwindcss"` — full preflight + theme + utilities |
| `src/styles/a11y.css` | `html.high-contrast`, `html.theme-dark` selectors |
| `src/styles/cards.css` | `html.theme-dark` selectors for card pills |
| `src/hooks/useApplyAccessibility.ts` | Modifies `document.documentElement` |
| `src/main.tsx` | Direct mount to `#citizen-science-root` (no shadow DOM) |
| `vite.config.ts` | Single entry point, no base path override |

**Note:** `citizen-science-page.html`, `scripts/prepare-wp-shell.mjs`, `scripts/deploy-to-wp.mjs`, `tailwind.config.ts`, `reference/wp/`, and `public/wp-snapshot/` do NOT exist at this commit. These were added at `e083451`.
