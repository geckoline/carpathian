# Implementation Plan

Date: May 14, 2026

Based on codebase analysis covering 64 source files, 64 test files, `package.json`,
and all configurations. Improvements ordered by ROI (highest first).

---

## Phase 0: Remove Unused Dependencies

**ROI:** Instant bundle savings, no behavior change, no test updates needed.

| Package | Size (approx) | Action |
|---------|---------------|--------|
| `@base-ui/react` | ~130 KB | `npm uninstall` |
| `@supabase/ssr` | ~25 KB | `npm uninstall` |
| `bottleneck` | ~15 KB | `npm uninstall` |
| `class-variance-authority` | ~8 KB | `npm uninstall` |
| `uuid` + `@types/uuid` | ~15 KB | `npm uninstall` |
| `dotenv` | ~5 KB | `npm uninstall` |
| `shadcn` | move to devDeps | edit `package.json` |

**Steps:**
1. `npm uninstall @base-ui/react @supabase/ssr bottleneck class-variance-authority uuid @types/uuid dotenv`
2. Move `shadcn` from `dependencies` to `devDependencies` manually
3. Run `npm run typecheck && npm run test:run && npm run build` to confirm no breakage
4. Run `npx vite-bundle-visualizer` to confirm reduced output

---

## Phase 1: Dead Code Removal

### 1A — Remove unused store fields

**File:** `src/store/appStore.ts`

**Remove:**
- `ui.isMapVisible` (field) and `toggleMap` (action) — never referenced in any component
- `ui.isAddExpertOpen` (field) and `setAddExpertOpen` (action) — unused; modal uses local `useModal` hook
- Corresponding `toggleMap` action body and `setAddExpertOpen` action body

**Edit target:**
```diff
- isMapVisible: true,
- selectedExpertId: null,
  selectedProjectId: null,
  hoveredProjectId: null,
- isAddExpertOpen: false,
  expertImportDialog: null,
```
```diff
- toggleMap: () => set((s) => { s.ui.isMapVisible = !s.ui.isMapVisible; }),
```
```diff
- setAddExpertOpen: (open) => set((s) => { s.ui.isAddExpertOpen = open; }),
```

**Delete from type:**
```diff
- isMapVisible: boolean;
- isAddExpertOpen: boolean;
```

**Validation:** `npm run typecheck` (any import of removed fields will error immediately).

### 1B — Normalize setter placement

**File:** `src/store/appStore.ts`

`selectedProjectId` and `hoveredProjectId` lives in `ui` sub-object (consistent with `selectedExpertId`), but their setters are at the top level of the store (same as all others). This is _already_ the pattern for all setters in this store — actions are flat, state is nested. No change needed here since all actions follow the same convention.

**Decision:** Keep as-is. All actions are top-level, state is organized by slice. If the store grows, migrate to Zustand slices pattern (see Phase 6).

### 1C — Remove OfflineBanner

**File:** `src/components/ui/OfflineBanner.tsx` — delete the entire file.
**File:** `src/components/ui/index.ts` — remove export if present.

**Why:** Component is exported but never imported by `App.tsx` or any other production file.
Offline handling is done inline in modals (`!isOnline` checks in AddProjectModal,
AddExpertModal, VolunteerModal) and via `useRealtimeSync` event listeners.

**Validation:** `rg "OfflineBanner" src/ --include="*.ts" --include="*.tsx"` — should only
match the definition file itself.

---

## Phase 2: Consolidate Duplicated Card Logic

### 2A — Extract `handleSurfaceFlip` into shared utility

**Current:** Identical 6-line function in both `ProjectCard.tsx:109-115` and `ExpertCard.tsx:123-129`

```ts
const handleSurfaceFlip = (e: React.MouseEvent<HTMLElement>) => {
  const target = e.target as HTMLElement;
  if (target.closest('button, a, input, textarea, select, [role="button"], [data-no-card-flip="true"]')) return;
  toggle();
};
```

**Action:**
1. Create `src/utils/cardInteraction.ts`
2. Export `handleSurfaceFlip` as a factory: `(toggle: () => void) => (e: React.MouseEvent<HTMLElement>) => void`
3. Replace both inline definitions with `const handleSurfaceFlip = makeSurfaceFlipHandler(toggle);`
4. Write a unit test in `src/utils/__tests__/cardInteraction.test.ts`

**Test coverage:**
- Click on a button inside card → does NOT flip
- Click on plain card surface → DOES flip
- Click on element with `[data-no-card-flip]` → does NOT flip

### 2B — Extract summary extraction into shared utility

**Current:** `getProjectSummary` (ProjectCard.tsx:28-32) and `getExpertSummary` (ExpertCard.tsx:38-45) are
near-identical: both do first-sentence extraction with different max lengths.

**Action:**
1. Add `extractFirstSentence(text: string, maxLength: number): string` to `src/utils/cardInteraction.ts`
2. Replace both inline definitions
3. Write tests for: empty string, short sentence, long sentence, sentence with ! and ?, no punctuation

---

## Phase 3: Zustand devtools Middleware

**File:** `src/store/appStore.ts`

**Goal:** Enable Redux DevTools inspection of store state and actions during development.

```diff
- import { create } from 'zustand';
- import { immer } from 'zustand/middleware/immer';
+ import { create } from 'zustand';
+ import { devtools } from 'zustand/middleware';
+ import { immer } from 'zustand/middleware/immer';

  export const useAppStore = create<AppState>()(
+   devtools(
      immer((set) => ({
        // ... existing store
      })),
+     { name: 'carpathian-store', enabled: process.env.NODE_ENV === 'development' }
+   )
  );
```

**Note:** Middleware order matters — `devtools` wraps `immer` so the Redux DevTools see each named action, not the internal Immer mutation. The `enabled` flag limits to dev mode only (zero production overhead).

**Validation:** Open Redux DevTools in browser dev mode → inspect `carpathian-store` state and action log.

---

## Phase 4: Add focus-trap-react to Modal

**File:** `src/components/common/Modal.tsx`

**Goal:** Replace custom focus trap (50+ lines, self-rolled) with battle-tested library.

**Before:** Custom `useEffect` saves `previousFocusRef`, queries focusable elements, calls `.focus()` on first, handles `Tab`/`Shift+Tab` wrapping manually, restores focus on unmount. Current implementation has a known bug: `previousFocusRef.current?.focus()` is called in the `useEffect` cleanup but doesn't check if the element is still in the DOM.

**After:**

```tsx
import FocusTrap from 'focus-trap-react';

// Inside the returned JSX:
<FocusTrap focusTrapOptions={{ initialFocus: false }}>
  <div ref={overlayRef} ...>
    <div ref={contentRef} ...>
      {/* existing header + content */}
    </div>
  </div>
</FocusTrap>
```

**Details:**
- Remove custom `handleKeyDown` entirely (FocusTrap handles Tab/Shift+Tab)
- Keep the Escape handler separate (FocusTrap doesn't handle Escape — that's app logic)
- Keep `previousFocusRef` and the `useEffect` restore logic (FocusTrap handles in-trap focus, not focus restoration on close)
- `npm install focus-trap-react`

**Test updates:** `src/components/common/__tests__/Modal.test.tsx` — the focus trap tests should still pass since FocusTrap manages the same behavior. Update the mock if needed.

---

## Phase 5: Add vitest-axe for Automated Accessibility Testing

### 5A — Install and configure

```bash
npm install --save-dev vitest-axe
```

**File:** `src/test-utils/setup.ts`
```ts
import 'vitest-axe/extend-expect';
```

**File:** `tsconfig.json` — ensure setup file is included:
```json
"include": ["src", "./src/test-utils/setup.ts"]
```

### 5B — Add axe checks to 10 key test suites

Add one `it('has no accessibility violations')` test per component suite.
Start with the most user-facing components:

| Component | Test File |
|-----------|-----------|
| Modal | `Modal.test.tsx` |
| ProjectCard | `ProjectCard.test.tsx` |
| ExpertCard | `ExpertCard.test.tsx` |
| FilterBar | `FilterBar.test.tsx` |
| ThemeToggle | `ThemeToggle.test.tsx` |
| AccessibilityControls | `AccessibilityControls.test.tsx` |
| MapSidebar | `MapSidebar.test.tsx` |
| AddProjectModal | `AddProjectModal.test.tsx` |
| AddExpertModal | `AddExpertModal.test.tsx` |
| VolunteerModal | `VolunteerModal.test.tsx` |

Pattern:
```ts
import { axe } from 'vitest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(<Component ... />);
  expect(await axe(container)).toHaveNoViolations();
});
```

---

## Phase 6: Fix ARIA Patterns in App.tsx

### 6A — Card grid redundant roles

**File:** `src/App.tsx:160`

**Current:**
```tsx
<section aria-live="polite" ... role="status">
```

**Problem:** `role="status"` implies `aria-live="polite"` — both together is redundant.
Also, the card grid is not a live region; it's the content area.

**Fix:** Remove `role="status"` from the grid container. Move `aria-live="polite"` to a
small status region above the grid that announces result counts on filter change.

```diff
- <section aria-live="polite" ... role="status">
+ <section ...>
```

### 6B — Dataset tabs missing aria-controls

**File:** `src/App.tsx:113-130`

**Current:** `role="tab"` and `aria-selected` are correct, but `aria-controls` is missing.
Add `aria-controls` pointing to the content panel.

```diff
- role="tab" aria-selected={dataset === 'cs'} onClick={() => setDataset('cs')}
+ role="tab" aria-selected={dataset === 'cs'} aria-controls="dataset-panel" onClick={() => setDataset('cs')}
```

Add `id="dataset-panel"` and `role="tabpanel"` to the section below the tabs (line 152).

### 6C — View tabs should use role="tab" not aria-pressed

**File:** `src/App.tsx:155-157`

**Current:** `aria-pressed` on buttons — this is toggle button semantics, not tab semantics.

**Fix:** Convert to `role="tab"` / `aria-selected` / `aria-controls` matching the dataset tabs pattern.

```diff
- <div className="flex gap-2 mb-4" aria-label="View tabs">
+ <div className="flex gap-2 mb-4" role="tablist" aria-label="Content view">
    <button
      onClick={() => setActiveTab('projects')}
-     aria-pressed={filters.activeTab === 'projects'}
+     role="tab" aria-selected={filters.activeTab === 'projects'} aria-controls="view-panel"
    >
      Projects
    </button>
```

Add `id="view-panel"` and `role="tabpanel"` on the grid section.

---

## Phase 7: Add @tanstack/react-virtual for Card Grid

### 7A — Install

```bash
npm install @tanstack/react-virtual
```

### 7B — Virtualize card grid in App.tsx

**File:** `src/App.tsx` (lines 152-189)

Wrap the card grid with `useVirtualizer`:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// Inside App component:
const parentRef = useRef<HTMLDivElement>(null);
const virtualizer = useVirtualizer({
  count: activeItems.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 320, // average card height in px
  overscan: 4,
});

// Render:
<div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
  <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
    {virtualizer.getVirtualItems().map((virtualItem) => {
      const item = activeItems[virtualItem.index];
      return (
        <div
          key={item.id}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualItem.start}px)`,
          }}
        >
          {filters.activeTab === 'projects'
            ? <ProjectCard key={item.id} {...(item as ProjectData)} />
            : <ExpertCard key={item.id} {...(item as ExpertData)} />
          }
        </div>
      );
    })}
  </div>
</div>
```

**Important:** The grid layout changes from CSS grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) to a manual virtualized approach. For multi-column grid support, use `useVirtualizer` with `horizontal: true` for columns or use the `grid` mode available in newer versions. Simpler alternative: keep the 1-column virtualized list and let CSS `columns` or media queries handle multi-column.

**Alternative approach (simpler):** Virtualize only the rows while keeping the CSS grid. Each "row" is a logical row of cards. Detect column count via `useMemo` + `useRef` width. This preserves existing layout.

**Recommendation:** Start with the simpler per-row virtualization and only move to full grid virtualization if there's a measurable perf issue. The current dataset (~12-40 items) likely doesn't need virtualization yet — but the user confirmed data is expected to grow.

**Performance baseline before implementing:** Measure DOM node count with 200+ items. If <500 nodes, virtualize. If >1000 nodes, definitely virtualize.

---

## Phase 8: Batched Selectors in App.tsx

**File:** `src/App.tsx`

**Current:** 15+ individual `useAppStore` calls:
```tsx
const { dataset, isOnline, filters, data, setActiveTab, setDataset, clearFilters } = useAppStore();
const addExpert = useAppStore(s => s.addExpert);
```

Each individual selector causes a separate subscription + re-render check. With Zustand v5's `useShallow`, we can batch them:

```tsx
import { useShallow } from 'zustand/react';

const { dataset, isOnline, filters, data, setActiveTab, setDataset, clearFilters } = useAppStore(
  useShallow(s => ({
    dataset: s.dataset,
    isOnline: s.isOnline,
    filters: s.filters,
    data: s.data,
    setActiveTab: s.setActiveTab,
    setDataset: s.setDataset,
    clearFilters: s.clearFilters,
  }))
);
```

**Why:** Without `useShallow`, every call to `useAppStore()` with an inline object `s => ({ ... })` creates a new object reference every render, causing a re-render even when no relevant state changed. `useShallow` does a shallow comparison and only triggers re-render when values actually change.

**Note:** Functions (actions) are stable references from Zustand, so they don't cause re-renders.
The concern is `filters` and `data` objects — if they're new references each time, components re-render.
`useShallow` fixes this by comparing object contents rather than reference identity.

---

## Phase 9: Zustand Slices Pattern (Future)

**When:** When `appStore.ts` exceeds ~250 lines or when you add more domains (e.g., notifications, user preferences).

**Recommended structure:**
```
src/store/
├── index.ts              // combined create() call
├── slices/
│   ├── dataSlice.ts      // projects, experts, loading, error
│   ├── filterSlice.ts    // searchTerm, statusFilter, fieldFilter, etc.
│   ├── uiSlice.ts        // selectedProjectId, hoveredProjectId, expertImportDialog
│   ├── a11ySlice.ts      // fontSize, highContrast, reducedMotion
│   └── appSlice.ts       // dataset, theme, isOnline, draftPolygon
```

Each slice exports a `StateCreator` function. The combined store spreads them:

```ts
export const useAppStore = create<AppState>()(
  devtools(
    immer((...args) => ({
      ...createDataSlice(...args),
      ...createFilterSlice(...args),
      ...createUiSlice(...args),
      ...createA11ySlice(...args),
      ...createAppSlice(...args),
    })),
    { name: 'carpathian-store' }
  )
);
```

**Not recommended now** — the store is 161 lines and well-organized with Immer. Revisit if it grows past 300 lines.

---

## Implementation Order (Recommended Sequence)

```
Phase 0: Uninstall unused deps          ─ 5 min, instant win
    ↓
Phase 1A/1B: Clean up store fields      ─ 10 min
    ↓
Phase 1C: Delete OfflineBanner          ─ 2 min
    ↓
Phase 2A/2B: Consolidate card logic     ─ 20 min (incl tests)
    ↓
Phase 3: Add devtools middleware        ─ 5 min
    ↓
Phase 4: Install focus-trap-react       ─ 15 min (incl test update)
    ↓
Phase 5: Install vitest-axe + tests     ─ 30 min (10 test suites)
    ↓
Phase 6: Fix ARIA patterns              ─ 15 min
    ↓
Phase 7: Add virtualization             ─ 45 min (if needed; measure first)
    ↓
Phase 8: Batched selectors              ─ 10 min
```

Each phase has its own validation step (`typecheck && test:run && build`) before moving to the next.

---

## Risk Register

| Change | Risk | Mitigation |
|--------|------|------------|
| Uninstall deps | One might be used transitively | `typecheck + build` catches |
| Delete store fields | Some component might reference it | `typecheck` catches immediately |
| focus-trap-react | Tests may need mock update | Run Modal.test.tsx first |
| Virtualization | Layout breakage at edge cases | Gate behind feature flag; test at 200+ items |
| vitest-axe | False positives (known aXe issues) | Use `disabledRules` option for known false positives |
