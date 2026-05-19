# WP Shell Fix — Implementation Plan

**Baseline:** `c8474d5` — standalone app works correctly. Map sidebar cards render. All 428 tests pass.  
**Referenced by:** `docs/wp-shell-css-fix-records.md` (detailed root cause analysis, commit history, pixel diff data).

---

## ✅ Already Fixed at `c8474d5`

These root causes (from the records doc) are resolved by the reset:

| # | Problem | Status |
|---|---------|--------|
| 1 | `body { margin: 0 }` removed at `e083451` | ✅ Restored — preflight includes `body { margin: 0 }` |
| 2 | Preflight omitted at `e083451` | ✅ Restored — `@import "tailwindcss"` includes preflight |

**Rule for the future:** If `index.css` is restructured for WP shell, keep `@import "tailwindcss"` (or add `@import "tailwindcss/preflight.css" layer(base)` alongside theme + utilities). Never omit preflight.

---

## 📋 Work Required

### Step 1: Add WP Shell Files

Migrate forward from `e083451` (selectively):

- `citizen-science-page.html` — WP shell HTML
- `scripts/prepare-wp-shell.mjs` — generator
- `scripts/deploy-to-wp.mjs` — deploy script
- `reference/wp/` — reference WP page (for testing)
- `public/wp-snapshot/` — WP static assets
- `tailwind.config.ts` — blocks `container` utility
- `vite.config.ts` changes — dual entry points, base path

**Critical:** Verify standalone build still works after each file addition. The `index.css` must keep `@import "tailwindcss"` — do NOT restructure it unless all layers (theme + preflight + utilities) are included.

---

### Step 2: Apply Minimal CSS Fixes

Address remaining root causes #3–#6 (from records doc). Apply incrementally, testing after each:

| # | Problem | Fix |
|---|---------|-----|
| 3 | A11y selectors scoped to root instead of `<html>` | Keep `html.xxx` for global a11y or ensure root always has the class |
| 4 | WP `html { font-size: 10px }` rem drift | Tailwind CSS variable overrides (`--spacing`, `--text-*` px values) via `@theme` |
| 5 | WP CSS cascade beats layered utilities | Double-ID `#citizen-science-root#citizen-science-root` for critical overrides |
| 6 | Chrome gradient compositor bug | **Not fixable** via CSS (~55% of flipcard diff) — accept |

Specific CSS changes:

1. **A11y scoping** (root cause #3) — If `useApplyAccessibility` targets `#citizen-science-root`, ensure the root element always receives a11y classes, or revert selectors to `html.xxx`
2. **Rem drift** (root cause #4) — `--spacing`, `--text-*`, `--radius-*`, `--container-*` px overrides inside `@theme`
3. **Cascade** (root cause #5) — double-ID for buttons, cards, stats where WP theme overrides Tailwind utilities
4. **Gradient extent** (root cause #6) — `rem`→`px` for gradient `background-image` values (partial fix only)

**Not doing:**
- Shadow DOM (adds complexity across 8+ files, doesn't fix #6)
- `?inline` CSS imports (dev server compatibility issues)
- Brute-force override spiral (Phase 3 at `1895d42`–`e0b3747` had 37 overrides — fragile)

---

## Pixel Diff Targets

Actual values from `e0b3747` (last overridden state before reset). Aim to match or improve:

| Element | At `e0b3747` | Target | Limiting factor |
|---------|-------------|--------|-----------------|
| stats-grid | 1.48% | <3% | Line-height wrapping |
| first-flipcard | 80.45% | <85% | Chrome gradient compositor bug (#6) |
| sidebar-buttons | 13.26% | <20% | Overflow/button content |
| full-root | 45.01% | <30% | Cumulative |

Run: `node scripts/pixel-diff.mjs` (requires dev server + Chrome).

---

## Test Strategy

```bash
npm run build          # Must pass (no errors)
npm run typecheck      # Must pass (tsc --noEmit)
npm run test:run       # All 428 tests must pass
node scripts/pixel-diff.mjs  # Compare standalone vs WP shell
```

---

## Key Files at `c8474d5`

See `docs/wp-shell-css-fix-records.md` § "Key Files at c8474d5" for the complete reference. Summary:
- `src/index.css` — `@import "tailwindcss"` with full preflight
- `src/styles/a11y.css` — `html.high-contrast` selectors
- `src/styles/cards.css` — `html.theme-dark` selectors
- `src/hooks/useApplyAccessibility.ts` — targets `document.documentElement`
- `src/main.tsx` — direct mount, no shadow DOM
- `vite.config.ts` — single entry, no base path override

WP shell files (`citizen-science-page.html`, scripts, config) do NOT exist at this commit — they will be re-added in Step 1.

---

## Guiding Principle

> Only overrides with clear ROI. Accept what can't be fixed in CSS (Chrome gradient compositor bug). Test pixel diff against `e0b3747` as the comparison point, not perfection.
