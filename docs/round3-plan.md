# Round 3 — Remaining Tasks Implementation Plan

**5 items · ~6-8 hours · KIS approach**

---

## 🔴 1 — Extract `FlippableCard` Wrapper (#62) — ~3 hours

**Goal:** Extract shared card-flip boilerplate from ExpertCard + ProjectCard.

### KIS Approach (NOT render props)

Instead of a complex `FlippableCard` with render props / slots API, use a simple **composition approach**: create a `CardShell` component that wraps the common structure and accepts `front` and `back` as `ReactNode` children.

### Implementation

Create `src/components/cards/CardShell.tsx`:

```tsx
import { useCallback, type ReactNode } from 'react';
import { useCardFlip } from '@/hooks/useCardFlip';
import { useCardShare } from '@/hooks/useCardShare';
import { makeSurfaceFlipHandler } from '@/utils/cardInteraction';

type CardShellProps = {
  id: string;
  shareUrl: string;
  cardType: 'project' | 'expert';
  reducedMotion: boolean;
  front: (toggle: () => void, handleFlipKeyDown: (e: React.KeyboardEvent) => void, handleSurfaceFlip: (e: React.MouseEvent) => void) => ReactNode;
  back: (toggle: () => void, handleFlipKeyDown: (e: React.KeyboardEvent) => void, handleSurfaceFlip: (e: React.MouseEvent) => void) => ReactNode;
};

export const CardShell = ({ id, shareUrl, cardType, reducedMotion, front, back }: CardShellProps) => {
  const { isFlipped, isFlipping, toggle } = useCardFlip({ durationMs: 600 });
  const { copy: handleCopy, copied } = useCardShare({ kind: cardType, id, dataset: 'cs' });

  const handleSurfaceFlip = useCallback(makeSurfaceFlipHandler(toggle), [toggle]);
  const handleFlipKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
      e.preventDefault();
      toggle();
    }
  }, [toggle]);

  // Card shell article, card-flip-stage, front/back face sections, footer buttons
  // ...common JSX
};
```

**Steps:**
1. Create `CardShell` with the shared flip/share/keyboard logic
2. Update `ExpertCard` to use `CardShell` — pass front/back as callbacks
3. Update `ProjectCard` to use `CardShell` — pass front/back as callbacks
4. Remove `useCardFlip` + `useCardShare` + `handleSurfaceFlip` + `handleFlipKeyDown` from both cards
5. Run tests, fix any regressions

**TDD:** Existing card tests (406 total) must still pass.

---

## 🟡 2 — Replace Hardcoded CSS Colors (#76) — ~30 min

**Goal:** Replace hardcoded colors with `var(--color-*)` variables for consistency.

### Implementation

| Current | Replace with | Lines |
|---------|-------------|-------|
| `#1f2a21` | `var(--color-text)` | 3 instances |
| `#236748` | `var(--color-primary-700)` | 2 instances |
| `#536057` | `var(--color-text-muted)` | 4 instances |
| `#1b4d35` | `var(--color-primary-800)` | 1 instance |

**TDD:** Visual check — no behavior change expected. Run tests.

---

## 🟠 3 — Split `index.css` by Domain (#48) — ~1 hour

**Goal:** Split the 883-line CSS into domain files for maintainability.

### Plan

Create:
- `src/styles/cards.css` — card-face, card-flip-stage, flip animations
- `src/styles/notebook.css` — notebook-panel, notebook-detail, paper styles
- `src/styles/a11y.css` — high-contrast, reduced-motion, theme-dark, theme-reduced-color
- Keep in `index.css`: `@import "tailwindcss"`, font imports, `@theme` tokens, status pills, map styles (~300 lines)

**TDD:** Build must produce same output. Visual regression check.

---

## 🟢 4 — Add Missing Component Tests (#49) — ~2 hours

### Tests to add

1. **`ExportButton.test.tsx`** — test render, CSV export click, JSON export click, disabled state
2. **`FilterControls.test.tsx`** — test search input, status/field/country selects, clear button, compact variant
3. **`useCardShare.test.ts`** — test URL generation, clipboard write, copied state, error handling

Keep tests simple — behavior assertions only, no CSS class assertions.

---

## ⚪ 5 — Integration Test Improvements (#52) — ~1 hour

### Current gaps
- No integration test for the full filter → card render flow
- No integration test for URL sync → tab/dataset persistence

### Add

1. **`FilterFlow.integration.test.tsx`** — render App with mock data, apply filters, verify card list updates
2. Extend `DatasetTabs.test.tsx` — test loading state, error state

---

## Summary

| # | Item | Effort | Type | Risk |
|---|------|--------|------|------|
| 1 | FlippableCard wrapper (#62) | ~3h | Refactor | Medium |
| 2 | CSS color variables (#76) | ~30m | Polish | Low |
| 3 | Split index.css (#48) | ~1h | Structure | Low |
| 4 | Missing tests (#49) | ~2h | Testing | Low |
| 5 | Integration tests (#52) | ~1h | Testing | Low |
| **Total** | | **~7.5h** | | |
