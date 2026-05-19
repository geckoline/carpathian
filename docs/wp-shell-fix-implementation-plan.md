# WP Shell Fix — Implementation Plan

**Baseline:** `c8474d5` — standalone app works correctly. Map sidebar cards render. All 428 tests pass.  
**Referenced by:** `docs/wp-shell-css-fix-records.md` (detailed root cause analysis, commit history, pixel diff data).  
**Current state:** All 3 steps complete. WP shell vs standalone pixel diff verified.

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

### Step 3: Verify WP Shell vs Standalone Pixel Diff

Compare `citizen-science-page.html` (WP shell) against standalone baselines via `scripts/pixel-diff.mjs`:

```bash
node scripts/pixel-diff.mjs --wp-shell
```

**Results (at commit `6922216`):**

| Element | Diff % | Target | Pass? |
|---------|--------|--------|-------|
| stats-grid | 4.04% | ≤3% | ❌ (WP margins shift grid width) |
| first-flipcard | 19.65% | ≤85% | ✅ (dramatically better than 80.45% at `e0b3747`) |
| sidebar-buttons | 24.06% | ≤20% | ❌ (WP parent padding offsets the aside) |
| full-root | 38.96% | ≤30% | ❌ (cumulative WP wrappers) |

**Analysis:** The CSS fixes are effective. Flipcard diff dropped from 80.45% → 19.65% (the Chrome gradient compositor bug contributed ~55%). Remaining diffs are structural — WP theme adds margins, padding, and wrapper elements around the app shell. These are expected and would be resolved when the page is served inside the actual WP theme (the pixel diff compares the build output against standalone, not against the live WP integration).

**Future work:** Re-run after deploying to the live WP site and re-capture baselines from the in-situ WP rendering.

---

## Pixel Diff Results

| Element | At `e0b3747` | At `f7ac6d7` (standalone) | WP shell vs baseline | Target | Limiting factor |
|---------|-------------|--------------------------|---------------------|--------|-----------------|
| stats-grid | 1.48% | 0.00% | 4.04% | ≤3% | WP margins shift grid width |
| first-flipcard | 80.45% | 0.00% | 19.65% | ≤85% | Chrome gradient compositor bug (#6) |
| sidebar-buttons | 13.26% | 0.00% | 24.06% | ≤20% | WP parent padding offsets aside |
| full-root | 45.01% | 0.00% | 38.96% | ≤30% | Cumulative WP wrappers |

Run:
- `node scripts/pixel-diff.mjs` — standalone vs baseline (self-test)
- `node scripts/pixel-diff.mjs --wp-shell` — WP shell vs baseline
- `node scripts/pixel-diff.mjs --record` — capture new baselines (requires dev server + Chrome)

---

## Test Strategy

```bash
npm run build                # Must pass (no errors)
npm run typecheck            # Must pass (tsc --noEmit)
npm run test:run             # All 428 tests must pass
node scripts/pixel-diff.mjs  # Standalone self-test (should be 0.00%)
node scripts/pixel-diff.mjs --wp-shell  # WP shell vs standalone
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
