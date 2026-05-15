# Design & Improvement Analysis

Date: May 14, 2026

Based on full codebase analysis across all components, styles, modals, and UX patterns.

---

## 1. Design Mismatch: Cards vs Rest of App

The cards are the visual crown jewels. The rest of the app uses the same tokens but applies them conservatively.

### Current State

| Component | Border Radius | Border Color | Background | Shadow | Visual Flair |
|-----------|--------------|-------------|------------|--------|-------------|
| **ProjectCard/ExpertCard** | `--radius-card` (0.75rem) + `.card-face.card` (26px overflow-hidden) | `--color-soft-border` | `--color-panel-surface` | `--shadow-card` + `--shadow-card-hover` | Gradient headers, 3D perspective, hover lift, status chips |
| **StatsSection** | `--radius-panel` | `--color-soft-border` | `--color-panel-surface` | `--shadow-panel` | Gradient accent bar, hover lift, animated counter |
| **FilterBar** | `--radius-panel` | `--color-panel-border` | `--color-panel-surface` | `--shadow-panel` | None |
| **FilterControls inputs** | `rounded-lg` | `--color-soft-border` | `--color-panel-surface` | None | Plain |
| **MapSidebar items** | `--radius-panel` | `--color-panel-border` | `--color-panel-surface` | `--shadow-panel` on hover | Left accent bar |
| **Modal inputs** | `rounded` (0.25rem) | `border-gray-300` (hardcoded) | White | None | Plain |
| **ThemeToggle** | `rounded-lg` | `--color-soft-border` | White | Default shadow | Mini segmented control |
| **AccessibilityControls** | `rounded` | `--color-soft-border` | `--color-panel-surface` | None | Trigger button only |

### Key Issues

**a) Inputs use hardcoded colors instead of design tokens**
All modal forms (AddProject, AddExpert, Volunteer) use `border-gray-300` instead of `border-[var(--color-soft-border)]`. This breaks dark mode and reduced-color mode.

**b) Modal form controls lack card-consistent styling**
- No `--radius-panel` on input groups
- No subtle background gradient
- No shadow

**c) FilterControls inputs could match card polish**
- Search input currently flat — no inner shadow, no focus glow matching card aesthetic
- Select dropdowns have no custom styling (browser default arrow)

**d) ThemeToggle and AccessibilityControls are visually isolated**
- `bg-white` hardcoded instead of `bg-[var(--color-panel-surface)]`
- No shadow matching the card family

### Recommended Fixes

```
Fix 1: Replace all hardcoded border-gray-300 in modals
  → border-[var(--color-soft-border)]
  Files: AddProjectModal.tsx, AddExpertModal.tsx, VolunteerModal.tsx
  Impact: Dark mode and reduced-color mode work consistently in forms

Fix 2: Add --radius-panel to modal input containers
  → Group related inputs in rounded-[var(--radius-panel)] containers
  Files: AddProjectModal.tsx (lines 131, 182, 238, 289)

Fix 3: ThemeToggle bg-white → bg-[var(--color-panel-surface)]
  File: ThemeToggle.tsx line 8

Fix 4: Add subtle hover/active states to filter inputs
  → Focus ring with primary-500 glow
  → Subtle background change on hover
  File: FilterControls.tsx controlClass

Fix 5: Modal header polish
  → Add gradient accent bar (like StatsSection) to modal headers
  File: Modal.tsx line 64-69
```

---

## 2. Copy Button Visual Feedback

**Current state:** `handleCopy` uses `navigator.clipboard.writeText()` with zero visual feedback. User clicks Copy — nothing visible happens.

**Files affected:**
- `ProjectCard.tsx` — 2 Copy buttons (front + back faces)
- `ExpertCard.tsx` — 2 Copy buttons (front + back faces)
- `useCardShare.ts` — the actual copy logic

**Recommended approach:** Add a brief "Copied!" state with inline feedback.

```tsx
// In useCardShare.ts — add copied state
const [copied, setCopied] = useState(false);

const copy = useCallback(async () => {
  await navigator.clipboard.writeText(url);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
}, [url]);

return { copy, copied, url };
```

Then in card components, show "Copied!" for 2s after clicking:

```tsx
<button onClick={handleCopy} className="button outline" data-testid="copy-project-link">
  {copied ? 'Copied!' : 'Copy'}
</button>
```

**Optional enhancement:** Add a small checkmark icon from `lucide-react`:
```tsx
{copied ? <Check size={14} className="text-green-600" /> : null}
```

---

## 3. Social Link Buttons: Icons vs Text

**Current state:** ExpertCard renders social links as text-only pill buttons:
`[Mail] [LinkedIn] [Scopus] [Scholar] [ORCID]`

**Options:**

| Approach | Pros | Cons |
|----------|------|------|
| **Text-only (current)** | Clean, internationalization-friendly, accessible | Visually plain, hard to scan quickly |
| **Icons only** | Industry standard, compact, recognizable | Need fallback text for a11y |
| **Icons + text** | Best of both, professional look | More visual weight, more space |

**Recommendation:** Add lucide-react icons + keep text labels. Since `lucide-react` is already installed:

| Social Link | Lucide Icon |
|------------|-------------|
| Email | `Mail` |
| LinkedIn | `Globe` (or external icon) |
| Scopus | `BookOpen` |
| Google Scholar | `GraduationCap` |
| ORCID | `Fingerprint` (or custom SVG) |

Implementation: Add an `icon` field to the `SocialLink` type in `ExpertCard.tsx`:

```tsx
const socialLinks: SocialLink[] = [
  ...(email ? [{ href: `mailto:${email}`, label: 'Mail', icon: Mail, ... }] : []),
  ...(linkedin ? [{ href: linkedin, label: 'LinkedIn', icon: Globe, ... }] : []),
  // ...
];
```

Render:
```tsx
<a ... className="social-pill">
  <Icon size={14} />
  {link.label}
</a>
```

---

## 4. Modal Forms Optimization

### 4A — Add Expert should extend Add Project flow

**Current problem:** The modals are completely separate despite sharing:
- Same form library (react-hook-form + zod resolver)
- Same error/success/offline patterns
- Same Modal wrapper
- Same category options
- Same submit + close pattern

**Suggested architecture:**

Create a shared `FormModal` wrapper that provides:
- Consistent header with gradient accent bar
- Consistent error/offline/success display
- Consistent submit/cancel button styling
- Consistent input styling
- Loading state overlay

Each feature modal (AddProject, AddExpert, Volunteer) then only defines its specific fields.

**Implementation:**
```
src/components/modals/
├── FormModal.tsx          ← NEW: shared wrapper
├── AddProjectModal.tsx    ← simplified using FormModal
├── AddExpertModal.tsx     ← simplified using FormModal  
├── VolunteerModal.tsx     ← simplified using FormModal
└── ImportConflictDialog.tsx
```

`FormModal` props:
```tsx
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg';
  submitLabel: string;
  isSubmitting?: boolean;
  isOnline?: boolean;
  submitError?: string | null;
  onSubmit: () => void;
  children: React.ReactNode;
}
```

### 4B — Intuitive modal improvements

1. **Focus first field automatically** — currently Modal sets initial focus to first focusable element, but for AddProject the first field (Name) should auto-focus.

2. **Tab order audit** — ensure tab order follows visual order (currently does in AddProject, but checkbox fields in AddExpert might trap focus).

3. **Pre-filled defaults** — AddProject uses year range `currentYear - currentYear+4`; AddExpert could auto-detect institution from ORCID profile as soon as URL is entered (not just on button click).

4. **Form stepper for long forms** — AddExpertModal has 4 visual sections (Identity, Bio, Contact, Links). Could use a stepper/progress indicator.

5. **Inline validation on blur** — currently only validates on submit. Add `onBlur` validation for better UX.

---

## 5. Additional Styling Suggestions

### 5A — Card grid visual breathing

The card grid uses `gap-4 sm:gap-6` which is fine, but the section needs more top spacing from the view tabs:

```diff
- <section className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-8">
+ <section className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-8 mt-2">
```

### 5B — Empty states should match card design language

The empty state container uses dashed border but no shadow or gradient. Make it look intentional:

```diff
- <div className="col-span-full rounded-[var(--radius-panel)] border border-dashed border-[var(--color-panel-border)] bg-[var(--color-panel-surface)] shadow-[var(--shadow-panel)] px-6 py-12 text-center text-text-muted">
+ <div className="col-span-full rounded-[var(--radius-panel)] border-2 border-dashed border-[var(--color-soft-border)] bg-gradient-to-b from-[var(--color-panel-surface)] to-[var(--color-panel-surface-soft)] shadow-[var(--shadow-panel)] px-6 py-16 text-center text-text-muted">
```

### 5C — ThemeToggle segmented control

Replace the three separate buttons with a proper segmented control with active indicator animation:
```
[ Light | Dark | Reduced ]
```

### 5D — MapSidebar button consistency

The "+ Add Project" and "+ Add Expert" buttons use `bg-primary-500` but the "Volunteer alerts" button uses `bg-status-active`. Standardize to `bg-primary-500` for primary actions and use `bg-status-active` only for status indicators.

---

## 6. Additional Code Libraries

| Library | Purpose | Why |
|---------|---------|-----|
| **`framer-motion`** (v12) | Page/component animations | Adds mount animations for cards, modal transitions, stats counter ease. ~15 kB gzip |
| **`react-hot-toast`** | Toast notifications | Lightweight (~5 kB), replaces inline status messages with dismissible toasts |
| **`@tanstack/react-query`** | Server state management | If real API usage grows, caching + refetch + retry replaces manual fetch logic. Already discussed as deferred — reconsider when API is stable |
| **`date-fns`** | Date formatting | Only if date handling becomes more complex (year range parsing, relative dates). Currently one regex is sufficient |
| **`recharts`** or **`lightweight-charts`** | Data visualization | Only if charts/sparklines are planned for stats or project dashboards |

**Not recommended:**
- `react-router` — current URL param sync is sufficient for single-page app
- Material UI / shadcn components — project already has its own design language
- State management libraries — Zustand + Immer is sufficient

---

## 7. Code Optimization Suggestions

### 7A — Remove `@custom-variant dark` if unused

`index.css:30` defines `@custom-variant dark (&:is(.dark *))` which enables `dark:` Tailwind utilities. But no component uses `dark:` utilities — the project uses `html.theme-dark` CSS classes instead. Could remove, but keeping has no performance cost and enables future use.

### 7B — `lucide-react` tree-shaking

Check bundle: `lucide-react` v0.344.0 should tree-shake well. The project uses ~15 icons across all components. Verify with `vite-bundle-visualizer` that only used icons are bundled.

### 7C — Remove unused CSS

`index.css` has ~960 lines. The `.eyebrow` classes (lines 425-449) and `.button.primary` (lines 363-366) may be unused — check with grep.

---

## 8. Additional Functions

### 8A — Delete functionality (red X on cards)

**Request:** Add a small red X on cards whose data will be inserted via DB through the modal.

**This requires backend integration.** The current `addProject`/`addExpert` in `apiService.ts` submits to Supabase and adds to local store. A delete function needs:

1. **UI component:** Add a small red X / trash icon button on cards
2. **Store action:** `removeProject(id)` / `removeExpert(id)` in `appStore.ts`
3. **API method:** `deleteProject(id)` / `deleteExpert(id)` in `apiService.ts`
4. **Supabase permissions:** RLS policies for delete operations

The visual treatment should match the cards' design:
```tsx
<button
  onClick={() => handleDelete(project.id)}
  className="absolute top-2 left-2 z-10 rounded-full bg-red-500/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
  aria-label="Delete project"
>
  <X size={14} />
</button>
```

But **question for clarification:** Should delete be available for ALL cards or only for cards created through the modal? If only for modal-created cards, you need a way to track which were created locally (e.g., an `isLocal` flag or checking against server data).

### 8B — Image upload for expert avatars

Currently expert portraits are derived from `/profile-pictures/{expert_id}.{jpg|png|webp}` with generated SVG fallback. Adding image upload would require:
- File input in AddExpertModal
- Supabase Storage bucket for profile images
- Upload progress indicator

### 8C — CSV/JSON data export

Add a small "Export" button above the card grid that downloads the current filtered dataset as CSV or JSON. Useful for researchers.

### 8D — Print-friendly styles

Add `@media print` styles to index.css so card grids render cleanly when printed or saved as PDF.

---

## Prioritized Implementation Order

```
P0 — Modal inputs use design tokens (border-gray-300 → --color-soft-border)
    Fixes dark mode, takes 10 min, 3 files

P1 — Copy button visual feedback
    Add "Copied!" state to useCardShare, 15 min

P2 — Social link icons
    Add lucide icons to social pill buttons, 20 min

P3 — Empty state polish
    Gradient background + consistent shadow, 5 min

P4 — ThemeToggle uses panel tokens
    bg-white → bg-[var(--color-panel-surface)], 2 min

P5 — Create FormModal wrapper
    Extract shared modal pattern, 30 min

P6 — Delete functionality
    Requires backend: API + store + UI + RLS, 60+ min

P7 — framer-motion animations
    Mount animations + card grid stagger, 30 min

P8 — CSV/JSON export
    Export button + data serialization, 20 min
```
