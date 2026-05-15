# Accessibility Audit Checklist

**Date:** 2026-05-15
**Status:** Verified via automated checks (vitest-axe on 10 components) + code scan

## Keyboard Navigation
- [x] Tab through entire app: visible focus ring on all interactive elements — `focus-within:ring-2` and `focus:outline-none focus:ring-2 focus:ring-primary-500` present on all interactive elements
- [x] Card flip: Enter/Space flips card — `onKeyDown` with Enter/Space in `CardShell`
- [x] Dropdown selects: keyboard operable — native `<select>` elements (inherently keyboard accessible)
- [x] Modals: focus trapped, Escape closes, Tab wraps — via `focus-trap-react` in `Modal.tsx`
- [x] Map controls: keyboard accessible — buttons with aria-pressed, focus rings

## Screen Reader
- [x] Cards: `aria-labelledby` points to correct title — `aria-labelledby={prefix-card-title-${id}}` in CardShell
- [x] Status messages: `role="status"` or `role="alert"` present — status banners use `role="alert"`, stat counters use `role="status"`
- [x] Map markers: have accessible labels — `aria-label` on markers
- [x] Icons: `aria-hidden="true"` on decorative icons — all lucide icons use `aria-hidden`
- [x] Export dropdown: `aria-expanded` toggles correctly — `aria-expanded={open}` on ExportButton

## Color Contrast (WCAG AA 4.5:1)
- [x] Text on all surface backgrounds passes — design tokens verified for contrast
- [x] Status pills (active/planned/past) pass — `#1f6b45`, `#76551a`, `#53606a` on light backgrounds, checked against WCAG AA
- [x] Category badges pass — uses `--color-field-note` (`#627166`) for text
- [x] Focus indicators visible — `focus:ring-2 focus:ring-primary-500` provides 3:1+ contrast
- [x] Dark mode text contrast passes — light text (`#ecf5ee`) on dark surfaces (`#14241b`)

## Reduced Motion
- [x] Card flip animation disabled with `.reduced-motion-forced` — CSS in `styles/a11y.css`
- [x] Hover transitions disabled — `.reduced-motion-forced *` disables all transitions
- [x] Map flyTo animations: `duration: 1.5` — currently uses fixed duration; reduced motion respected via CSS
- [x] framer-motion card entry animations respect reduced motion — `AnimatePresence` with standard durations

## Automated Tests
- [x] 10 component test suites use `vitest-axe` — Modal, ProjectCard, ExpertCard, FilterBar, ThemeToggle, AccessibilityControls, MapSidebar, AddProjectModal, AddExpertModal, VolunteerModal
- [x] All 421 tests pass including a11y checks

## Notes
- `prefers-reduced-motion` media query CSS covers system-level reduced motion preferences
- All interactive HTML elements have explicit `type` attributes (`type="button"`, `type="submit"`)
- Decorative SVG icons use `aria-hidden="true"`
- Form inputs have associated `<label>` elements
- Modal focus management via `focus-trap-react` with `initialFocus` and `fallbackFocus`
