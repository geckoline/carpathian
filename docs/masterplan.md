# Master Plan — Carpathian Citizen Science Platform

**All phases include: `tsc --noEmit` + `vitest run` + `vite build` validation**

---

## ✅ Phase 1 — Round 3 Implementation (Complete)

| # | Item | Effort | Status |
|---|------|--------|--------|
| P0 | Dead code removal | 15m | ✅ `useLoadAppData.ts`, `geometry.ts` + tests deleted |
| P1 | FlippableCard wrapper (#62) | 3h | ✅ `CardShell.tsx` created, both cards refactored |
| P2 | Coverage gaps | 3h | ✅ Thresholds met: 91% statements, 80% branches |
| P3 | CSS maintenance | 1.5h | ✅ Colors clean. `index.css` split → `styles/a11y.css` + `styles/cards.css` |
| P4 | Missing component tests (#49) | 2h | ✅ `ExportButton`, `FilterControls`, `useCardShare` tests added |
| P5 | Integration tests (#52) | 1h | ✅ `FilterFlow` + extended `DatasetTabs` (5 new tests) |
| P6 | Infrastructure | 1h | ✅ CI exists, a11y checklist created |
| P7 | Quick cleanup (S1-S8) | 1.5h | ✅ All 8 items done |

**Baseline after Phase 1:**

| Check | Value |
|-------|-------|
| Test files | 69 |
| Tests | 426 |
| `tsc --noEmit` | 0 errors |
| `vite build` | passes |
| Statements | 91.03% |
| Branches | 79.92% |

---

## ✅ Phase 2 — Code Optimization & Cleanup (Complete)

All S1-S8 items done:
- **S1** — Modal `onSubmit` handlers extracted with `useCallback` in App.tsx
- **S2** — Stable `ProjectPolygon` event handlers in MapView.tsx
- **S3** — Fixed `any` → `ProjectData | ExpertData` in App.tsx
- **S4** — `React.memo` added to `ProjectCard`, `ExpertCard`, `StatsSection`, `ProjectPolygon`
- **S5** — `useModal` added to hooks barrel
- **S6** — `addProject` now logs warning instead of throw
- **S7** — Covered by P0 (file deleted)
- **S8** — `MapDrawingControl` simplified, type declaration for `leaflet-draw`
- **2.9** — Unused exports scan (cleaned up during P0)

---

## Phase 3 — Final DB Validation

**~3 hours · 5 work packages**

**Status:** Static validation complete. Local Supabase CLI is available via `npx supabase`; live local DB execution requires Docker to be running.

### 3.1 — Verify schema v3 matches current app types — 45 min

Status: ✅ Complete via schema/type review and focused contract tests.

Compare `supabase/schema-v3-draft.sql` with TypeScript types in `src/types/`:
- `expert.ts` — fields match `app_experts` table?
- `project.ts` — fields match `app_projects` table?
- `database.ts` — generated types match actual Supabase schema?
- Check `import_metadata` column exists (added by `migration-add-import-metadata.sql`)
- Check `institutions.website` and `experts.institution_id`
- Check `contact` column on projects

### 3.2 — Validate seed data — 30 min

Status: ✅ Complete. Local Supabase reset succeeded via `npx supabase db reset --debug`.

Run `supabase/seed-v3-adjusted-data.sql` against a local/test Supabase instance. Verify:
- 39 projects, 30 experts
- 10 CS projects, 9 CS-linked experts
- Foreign keys resolve (every `lead_expert_id` references an existing expert)
- Geometries are valid PostGIS

Local static checks added in `src/__tests__/seedDataSanity.test.ts`. `supabase/migrations/20260515205500_init_v3_schema.sql` now provides the local rebuild schema, and `supabase/config.toml` points `db.seed.sql_paths` at `seed-v3-adjusted-data.sql`.

Live validation result:
- 39 projects, 30 experts, 28 institutions
- 10 CS projects, 9 CS-linked experts
- 39 primary project locations
- 0 projects without existing lead experts
- 0 projects missing a matching `project_experts` lead assignment
- 0 invalid PostGIS geometries

### 3.3 — Verify API service type mapping — 45 min

Status: ✅ Complete via `apiService.test.ts` contract coverage.

Review `src/services/apiService.ts` row → type transformations:
- `AppProjectRow → ProjectData` — all fields mapped?
- `AppExpertRow → ExpertData` — all fields mapped?
- Null handling correct?
- Add contract tests if gaps found

### 3.4 — Migration path review — 30 min

Status: ✅ Complete. Institution migration slugging aligned with seed IDs, including names with diacritics.

Document the migration sequence:
1. Run `migration-add-import-metadata.sql` (adds columns)
2. Run `migration-drop-expert-avatar-url.sql` (drops redundant portrait URL storage)
3. Run `migration-add-institutions.sql` (normalizes expert institutions)
4. Run `seed-v3-adjusted-data.sql` (seed data; local portraits are derived from expert IDs)
5. Verify with `apiService.integration.test.ts`

### 3.5 — RLS policy audit — 30 min

Status: ✅ Static audit complete in `seedDataSanity.test.ts`.

Review Supabase RLS policies for `app_projects`, `app_experts`:
- Public read access for projects and experts
- Insert requires authentication (or is it public?)
- Delete/update restricted

**Validation checkpoint:** Integration test against test Supabase instance + typecheck

---

## Phase 4 — Modal Optimization, Finish, Polish & Cleanup

**~3 hours · 5 work packages**

Implementation direction:
- Change modal flows where it improves UX, not just styling.
- AddProject becomes a guided flow with `Basics → Expert → Location → Details → Review`.
- Review is a separate confirmation screen with Confirm/Back actions before final submit.
- AddProject expert picker always shows `Add new expert` at the top, followed by suggested/search entries.
- Inline expert creation includes all expert fields, validates before project submit, creates the expert first, then creates the project with that expert as lead.
- The standalone AddExpert button/modal remains; its dedicated tab redesign can follow after AddProject reuses the expert field sections.
- Draft autosave uses `localStorage`; reset clears the form and stored draft.
- Collapsing inline expert creation preserves its draft.
- Offline submissions keep the existing offline error behavior.
- Volunteer modal copy/alerts use “Volunteer” language.
- Project location becomes tabbed: `Simple location`, `Search and draw`, `Import geodata`.
- `Simple location` is required and creates one location with a fixed default 20 km area.
- `Search and draw` uses free-text OSM-style location search and may produce either a point or drawn geometry.
- `Import geodata` should support GeoJSON, KML, GPX, and Shapefile.

### 4.1 — Form field consistency — 30 min

Audit all form fields across `AddProjectModal`, `AddExpertModal`, `VolunteerModal`:
- Same input height, padding, border radius
- Same label styling (font size, weight, spacing)
- Same error message placement and styling
- Same focus ring style
- Same disabled state styling
- Visible `*` for required fields and accessible required labeling.

### 4.2 — Form behavior audit — 30 min

- Required field indicators consistent?
- Validation triggers: social/profile fetch first, dedicated email validation, submit validation for the full form.
- Submit button disabled during submission?
- Success/error feedback visible and accessible?
- Form drafts autosave to `localStorage`; reset clears both form state and stored draft.
- Draft polygon persists correctly in AddProject flow?

### 4.3 — Focus trap + keyboard — 30 min

- Modal open: focus moves to first field?
- Tab order: follows visual order?
- Escape: closes modal?
- Shift+Tab from first field: wraps to last?
- Focus restoration: returns to trigger element on close?

### 4.4 — ORCID integration polish — 45 min

- Fetch error handling: network failure, invalid ORCID, malformed response
- Loading state during fetch
- Auto-fill mapping: which fields are populated?
- Conflict detection: existing data vs imported data
- Conflict resolution UI: show/compare/merge flow clean?

### 4.5 — `FormModal` shared wrapper extraction — 45 min

Review `FormModal.tsx` — already extracted. Verify all three modals use it consistently.

**Validation checkpoint:** `tsc --noEmit` + `vitest run` + manual modal testing

---

## Phase 5 — Style Improvement, Finish & Polish

**~4 hours · 6 work packages**

### 5.1 — Hardcoded color audit — 30 min

Search for `#` color values in `src/**/*.tsx` and `src/**/*.css`:
- Replace remaining hardcoded colors with `var(--color-*)` tokens
- Focus on: modal inputs, ThemeToggle, any inline styles
- After: verify dark mode and reduced-color mode work

### 5.2 — Modal input styling consistency — 20 min

Update `AddProjectModal.tsx`, `AddExpertModal.tsx`, `VolunteerModal.tsx`:
- `border-gray-300` → `border-[var(--color-soft-border)]`
- Plain white bg → `bg-[var(--color-panel-surface)]`
- Add focus ring: `focus:ring-2 focus:ring-primary-500`

### 5.3 — Visual polish pass — 45 min

| Area | Check |
|------|-------|
| Empty states | Gradient bg, dashed border, clear action — consistent? |
| Status messages | Success/warning/error banners — readable at all viewports? |
| Map controls | Button alignment, icon spacing, active state |
| Card grid | Gap spacing at mobile, card hover states |
| Sidebar | Filter controls alignment, project list item spacing |
| Dataset tabs | Active state contrast, touch target size on mobile |
| View tabs | Active indicator, spacing |

### 5.4 — Animation & transition audit — 30 min

- Card flip animation: smooth? Works with reduced-motion?
- Map marker/polygon transitions: janky on filter change?
- Modal open/close: smooth? Focus management correct?
- Card grid entry animations (framer-motion): visible? Not overdone?

### 5.5 — Responsive review — 45 min

Check at breakpoints: 375px, 768px, 1024px, 1440px
- Map/sidebar layout: stacks correctly on mobile?
- Filter controls: grid collapses properly?
- Cards: single → double → triple column transitions?
- Modal forms: scrollable at small viewports?
- Header + controls: no overflow?

### 5.6 — Dark mode + high contrast review — 30 min

- `.theme-dark`: all surfaces readable? Borders visible?
- `.theme-reduced-color`: sufficient contrast without color?
- `.reduced-motion-forced`: animations disabled?
- Font size +1/+2 steps: no layout breakage?

**Validation checkpoint:** Visual manual pass at 3 viewports + dark mode + `vitest run`

---

## Phase 6 — Integration into Carpathian Convention Website

**~4 hours · 6 work packages**

### 6.1 — Build output alignment — 30 min

Current: `vite build` outputs to `dist/`
WP expects: `../build/static/` (relative to WP theme directory)

**Action:**
- Configure `vite.config.ts` `base`, `outDir`, and `assetsDir` to produce the paths the WP page expects
- Or create a deploy script that copies `dist/` to the correct WP theme location
- Verify asset paths in the built HTML match the WP page's expected paths

### 6.2 — CSS isolation — 45 min

WP page loads Elementor CSS, Hestia theme CSS, etc. Risk of style conflicts.
- Add CSS scoping wrapper at the React root
- Test Tailwind utilities aren't overridden by WP theme styles
- Verify map, cards, modals render correctly inside the WP page
- Check dark mode toggle works alongside WP theme

### 6.3 — Integration test page — 30 min

Create a local test HTML file that simulates the WP page structure:
- WP header HTML + navigation
- React mount div
- WP footer HTML
- Loads both WP assets and React build

### 6.4 — Deployment script — 30 min

Create `scripts/deploy-to-wp.sh` or `deploy-to-wp.mjs`:
1. `npm run build`
2. Copy `dist/` → WP theme `build/` directory
3. (Optional) Bust cache: append build hash

### 6.5 — Elementor page update — 60 min

In the WordPress admin (Citizen Science page via Elementor):
- Update build asset paths if changed
- Ensure no Elementor widgets conflict with the React mount area
- Remove any placeholder content between page title and React root

### 6.6 — Fallback/safety net — 30 min

- Verify app degrades gracefully if WP assets fail
- Verify WP page works if React app fails to mount

**Validation checkpoint:** Manual browser test on integration test page + WP staging

---

## Phase 7 — Final Validation & Handover

**~2 hours · 4 work packages**

### 7.1 — Full regression suite — 30 min

```
npm run typecheck && npm run test:run -- --coverage && npm run build
```

Verify:
- 0 TypeScript errors
- All tests pass (≥426)
- Coverage thresholds met (Statements ≥80%, Branches ≥70%, Functions ≥80%, Lines ≥80%)
- Build output within budget

### 7.2 — Browser smoke test — 30 min

- [ ] App loads without console errors
- [ ] Map renders with markers
- [ ] Satellite/street view toggle works
- [ ] Search filter works (no ErrorBoundary trigger)
- [ ] Status/field/country filter dropdowns work
- [ ] Clear filters works
- [ ] Project cards render, flip, copy link
- [ ] Expert cards render, flip, copy link
- [ ] Add Project modal opens, form works
- [ ] Add Expert modal opens, ORCID fetch works
- [ ] Volunteer modal opens, submit works
- [ ] Dataset toggle (CS ↔ All) works
- [ ] Dark mode toggle works
- [ ] Accessibility controls work
- [ ] Mobile layout (375px) functional
- [ ] Tablet layout (768px) functional

### 7.3 — Documentation — 30 min

- Update `README.md` with:
  - Build/deploy instructions
  - WP integration steps
  - Environment variables needed
  - Test coverage overview

**Final validation:** `tsc --noEmit` + `vitest run --coverage` + `vite build` + browser smoke pass

---

## Continuous Improvement Loop

After every phase:
1. **TypeScript:** `npx tsc --noEmit` — 0 errors required
2. **Tests:** `npx vitest run` — all tests pass
3. **Build:** `npx vite build` — must succeed
4. **Coverage:** enforce thresholds in `vitest.config.ts`

Run a fresh scan after each phase to identify new dead code, type issues, and optimization opportunities.

---

## Timeline Summary

| Phase | Effort | Status |
|-------|--------|--------|
| **1 — Round 3** | ~13h | ✅ Complete |
| **2 — Code Optimization** | ~4.5h | ✅ Complete |
| **3 — DB Validation** | ~3h | ⏳ Next |
| **4 — Style Polish** | ~4h | Pending |
| **5 — Modal Polish** | ~3h | Pending |
| **6 — WP Integration** | ~4h | Pending |
| **7 — Final Validation** | ~2h | Pending |
| **Total remaining** | **~16h** | |
