# Further Improvements Roadmap

Date: May 9, 2026

## Purpose

This roadmap covers the next improvement wave for the refactored `carpathian` app after the major refactoring jump. It focuses on missing feature implementation, UI/UX and style polish, map debugging and richer map behavior, flip-card quality, general debugging, code cleanup, and code splitting.

The operating principles are:

- KISS: keep each change small enough to understand, test, and revert.
- DRY: remove real duplication after the behavior is proven, not before.
- TDD: write or update the narrowest useful test before changing behavior.

Status labels used below:

- `[DONE]`: completed and covered by validation for the current app contract.
- `[PARTIAL]`: useful work is implemented, but follow-up remains.
- `[OPEN]`: not implemented yet.
- `[DEFERRED]`: intentionally postponed until there is a stronger need.
- `[BLOCKED]`: cannot be completed from the current workspace/session without an external service, reference app, or product decision.

## Current Baseline

The refactor is now a real product slice. Updated after the latest implementation pass on May 9, 2026:

- Vite 8 + React 18 + TypeScript strict
- Tailwind v4 plus shadcn/base-nova styling primitives
- Zustand + Immer as the central store
- Leaflet map with clustering, satellite/street modes, label overlay, selection, hover sync, and drawing support
- Supabase service layer plus mock data
- Add-project and volunteer modal flows
- 56 passing test files and 231 passing tests
- Production build passes with intentional chunks for `MapView`, `leaflet`, `leaflet-cluster`, `leaflet-draw`, `forms`, `vendor`, `AddProjectModal`, and `VolunteerModal`
- Browser smoke on `http://127.0.0.1:4173/` passes for app load, map controls, and add-project modal opening

Primary concerns now:

- Polygon drawing is covered for missing Leaflet Draw globals, draw-created events, draft polygon storage, clearing, minimum point validation, and submit payload.
- The current design now has shared app surface tokens for panel radius, panel shadow, panel border, and app background.
- The map needs a future comparison against the backup reference once `http://localhost:3020/` is available again.
- Map controls are icon-aware and expose pressed state; browser smoke also caught and verified a production-only Leaflet plugin chunk issue.
- Legacy `FilterBar` and `MapPlaceholder` are intentionally retained as compatibility/test surfaces, not active app-shell paths.
- Performance has meaningful code splitting and the main app chunk is below the agreed 300 kB minified budget.

## Progress Update: May 9, 2026

### Completed Since This Roadmap Was Written

- Phase 0 baseline reconfirmed: `npm run typecheck`, `npm run test:run`, and `npm run build` pass.
- Phase 1 runtime safety completed: Supabase no longer hard-crashes mock/demo mode, data loading ownership is clearer, duplicate Vite config was retired, and `highlightText` now has one production import path.
- Phase 2 map sync completed for the current scope: markers, polygons, sidebar hover, selected project state, popup card scroll, fitBounds, flyTo behavior, and production map plugin chunk order have focused tests.
- Phase 3 card schematic slice completed: project/expert front and back faces now cover schematic hierarchy where data exists, lead expert navigation, avatar fallback, internal back-face scroll areas, explicit flip controls, keyboard activation, and reduced-motion classes.
- Phase 4 workflow feedback completed for the current app contract: add-project and volunteer success/failure/offline states are visible and accessible.
- Phase 5 UX/style slice completed for the current roadmap: shared surface tokens, normalized map/sidebar panel treatment, and useful empty states are covered.
- Phase 6 hygiene completed for the current roadmap: ErrorBoundary test noise is silenced, production `any` scan is clean, and legacy layout components are explicitly retained.
- Phase 7 code splitting completed for the current roadmap: map, forms, modals, Leaflet base, Leaflet Draw, and markercluster chunks are intentional; main app chunk is under budget.
- Browser smoke found and verified a production-only `L is not defined` regression caused by Leaflet plugin chunk grouping.
- Phase 8 hardening completed for the current slice: full validation, smoke script, and browser smoke checks pass.

### Latest Validation Results

- `npm run typecheck`: passed.
- `npm run test:run`: passed, 56 files and 231 tests.
- `npm run build`: passed.
- `DEPLOY_URL=http://127.0.0.1:4173 npm run smoke:test`: passed, 3 checks.
- `DEPLOY_URL=http://127.0.0.1:4173 npm run perf:check`: passed with a safe Lighthouse skip because this sandbox cannot reach the preview URL through Node fetch.
- Browser smoke: app loaded, updated map controls were visible, the add-project modal opened, and no new Leaflet blank-page failure appeared after chunk splitting.

### Next Open Slice

No open implementation slice remains in this roadmap. The next meaningful work is a product/design decision: compare against the backup reference once `http://localhost:3020/` is available, or start a new feature roadmap.

### Phase Status Summary

| Phase | Status | Current Meaning |
| --- | --- | --- |
| Phase 0: Baseline | `[DONE]` | Validation baseline is green. |
| Phase 1: Runtime safety | `[DONE]` | Supabase fallback, data loading ownership, Vite config, and highlight utility cleanup are complete. |
| Phase 2: Map behavior | `[DONE]` | Core behavior, typing cleanup, and production Leaflet plugin chunk order are covered. |
| Phase 3: Flip cards | `[DONE]` | Current schematic, accessibility, and reduced-motion slice is complete. |
| Phase 4: Missing workflows | `[DONE]` | Current single-page app workflow scope is complete. |
| Phase 5: UX/UI style | `[DONE]` | Shared surface tokens, responsive map/sidebar treatment, and empty states are covered for this roadmap. |
| Phase 6: Code hygiene | `[DONE]` | Production `any` scan is clean and intentionally retained legacy components are documented. |
| Phase 7: Performance | `[DONE]` | Lazy loading, chunk boundaries, and main chunk budget are covered. |
| Phase 8: Hardening | `[DONE - REPEAT]` | Current slice is validated; repeat after every new slice. |

## Golden Rule For Every Ticket

Every ticket should follow this loop:

1. Add or update one focused test that describes the desired behavior.
2. Make the smallest implementation change that passes the test.
3. Run the relevant focused test.
4. Run `npm run typecheck`, `npm run test:run`, and `npm run build` before closing the ticket.
5. If the implementation becomes awkward, simplify before expanding scope.

## Phase 0: Reconfirm The Baseline `[DONE]`

### Goal

Make sure the current big refactor step is a stable starting point before adding more features.

Status: `[DONE]` Completed on May 9, 2026.

### Work

- `[DONE]` Run `npm run typecheck`.
- `[DONE]` Run `npm run test:run`.
- `[DONE]` Run `npm run build`.
- `[DONE]` Record current bundle output and any warnings.
- `[BLOCKED]` Confirm which app is actually served at `http://localhost:3020/`; latest check on May 9, 2026 could not connect to that port.

### Acceptance Criteria

- `[DONE]` The three main validation commands pass.
- `[DONE]` Known warnings are documented, not ignored.
- `[BLOCKED]` The backup reference URL is confirmed to be the intended unrefactored backup.

## Phase 1: Critical Debugging And Runtime Safety `[DONE]`

### Goal

Remove the most likely runtime breakpoints before deeper UX work.

Status: `[DONE]` Completed for the current refactor slice.

### Priority Tickets

1. `[DONE]` Supabase fallback safety
   - Problem: `src/lib/supabase.ts` throws during module import if env vars are missing.
   - Desired behavior: missing Supabase env should not crash local demo/mock mode.
   - TDD: add an `apiService` or startup test proving mock fallback works without Supabase env.
   - Implementation: lazy-create the Supabase client or gate Supabase calls behind env availability.

2. `[DONE]` Data loading ownership
   - Problem: `useRealtimeSync` now owns app loading, while `useDataFetch` still exists.
   - Desired behavior: one clear primary app-loading path.
   - TDD: store/data-flow test for initial load, API failure, and mock fallback.
   - Implementation: keep one primary hook for app startup and mark or remove the unused path.

3. `[DONE]` Duplicate Vite config
   - Problem: both `vite.config.js` and `vite.config.ts` exist.
   - Desired behavior: one active Vite config source.
   - TDD: update `viteConfig.test.ts` to assert the intended config file and HMR/build settings.
   - Implementation: keep the TypeScript config if it is the richer active source, then remove or clearly retire the JS config.

4. `[DONE]` Duplicate highlight utilities
   - Problem: `src/utils/highlightText.ts` and `src/utils/text/highlightText.ts` provide different APIs.
   - Desired behavior: one canonical text-highlight utility.
   - TDD: keep tests for sanitization, regex escaping, empty search, and repeated matches.
   - Implementation: preserve the DOMPurify-safe version for HTML injection paths and migrate imports.

### Acceptance Criteria

- `[DONE]` App can boot in mock/demo mode without Supabase env.
- `[DONE]` Only one canonical data-startup path is used by `App`.
- `[DONE]` Only one Vite config is considered active.
- `[DONE]` Only one highlight utility remains for production UI usage.

## Phase 2: Map Debugging And Improvement `[DONE]`

### Goal

Make the map behavior match the intended backup-inspired UX while staying declarative and testable.

Status: `[DONE]` Completed for the current roadmap scope, including production Leaflet plugin chunk ordering.

### Priority Tickets

1. `[DONE]` Align polygons with visible projects
   - Problem: `MapView` receives `projects`, but `usePolygonLayer` reads global store data.
   - Desired behavior: markers and polygons always represent the same filtered/dataset project list.
   - TDD: add a `usePolygonLayer` test where hidden projects do not produce visible polygons.
   - Implementation: pass projects into `usePolygonLayer(projects)` or derive polygons inside `MapView` from `displayProjects`.

2. `[DONE]` Decide polygon visibility policy
   - Current behavior: only selected polygons render.
   - Options: selected-only, all filtered polygons, or all filtered polygons with selected emphasis.
   - Recommended default: all filtered polygons at low opacity, selected polygon emphasized.
   - TDD: test selected and unselected polygon rendering counts and styles.

3. `[DONE]` Replace broad `any` map types
   - Problem: cluster and project map paths still use `any`.
   - Desired behavior: typed project input and typed cluster icon context.
   - TDD: typecheck plus a narrow MapView smoke test.
   - Implementation: introduce small local types instead of large abstractions.
   - Current note: production `any` scan is clean; test-only mocks retain local `any` where they model third-party libraries.

4. `[DONE]` Map resize and fitBounds stability
   - Problem: `setTimeout` and `ResizeObserver` are pragmatic but can create flaky behavior.
   - Desired behavior: map invalidates size when container is ready and does not over-fit during user selection.
   - TDD: mock `invalidateSize`, `fitBounds`, and selected-project transitions.
   - Implementation: isolate the behavior in `MapController` with clear conditions.

5. `[DONE]` Popup, sidebar, and card sync
   - Desired behavior: marker click selects sidebar/card, sidebar hover highlights marker/polygon, popup scroll target exists.
   - TDD: add tests for marker click -> selected project, sidebar hover -> hovered project, popup scroll button -> correct DOM target.
   - Implementation: avoid DOM queries except for final scroll behavior.

6. `[DONE]` Drawing flow hardening
   - Desired behavior: drawn polygon persists to modal form state, can be cleared, and validates minimum points.
   - TDD: add tests for draw-created event, draft polygon storage, modal submit with coordinates.
   - Implementation: keep Leaflet Draw isolated behind `MapDrawingControl`.
   - Current note: opening the add-project drawing map is guarded when Leaflet Draw globals are unavailable, and draw-created, draft storage, clear behavior, minimum point validation, and submit payload are covered.

### Acceptance Criteria

- `[DONE]` Map markers, polygons, sidebar, and cards stay in sync.
- `[DONE]` Filtering and dataset switching update the map predictably.
- `[DONE]` Drawing works in the add-project flow without leaking Leaflet details into app state.
- `[DONE]` Production build loads Leaflet base, markercluster, and Leaflet Draw as separate chunks so plugins do not execute before `L` exists.

## Phase 3: Flip Cards `[DONE]`

### Goal

Make project and expert flip cards match the documented schematics where they improve clarity, while keeping the implementation small, accessible, and testable.

Status: `[DONE]` Completed for the current schematic slice. Future work should be visual polish, not core behavior.

### Schematic Sources

- `docs/carpathian-card-shematics/project-front.txt`
- `docs/carpathian-card-shematics/project-back.txt`
- `docs/carpathian-card-shematics/expert-front.txt`
- `docs/carpathian-card-shematics/expert-back.txt`

### Current Schematic Analysis

The schematics are useful as layout intent, not as literal pixel specs. They define a clear front/back information hierarchy:

- Project front: gradient header, status and field in the right corner, metrics row with location, year range, and lead expert link, footer with website/copy/details.
- Project back: solid header with accent strip, repeated status and field context, clamped description, footer with copy/back.
- Expert front: gradient patterned header, overlapping avatar, institution/country/degree info block, publication/project stats, social/contact footer, details action.
- Expert back: matching expert header, expertise tags, full bio, footer with social/copy/back actions.

Current implementation already covers:

- Project and expert front/back faces.
- Explicit details/back controls.
- Copy actions.
- Project website action.
- Expert institution, country, degree, stats, expertise tags, contact/social links.
- Expand/collapse for longer project descriptions and expert bios.

Important gaps against the schematics:

- Project front does not currently show lead expert as an in-page link or pulse target.
- Project front is missing the full three-chip metrics row promised by the schematic.
- Project back has the description, but lacks a stronger section structure and may clip long content because the body uses `overflow-hidden`.
- Expert avatar behavior exists only when `avatarUrl` is present, but the schematic treats avatar placement as a core visual feature.
- Expert footer differs from the schematic naming: current implementation supports LinkedIn, Scopus, Google Scholar, and email, while the schematic mentions ResearchGate.
- Project and expert cards use different heights and slightly different visual systems, which makes the card family feel less unified.
- Some icons are custom inline SVGs instead of lucide or a shared local icon wrapper.

Recommended implementation stance:

- Keep the schematics as the card UX target.
- Implement card improvements in thin vertical slices: one card face at a time.
- Prefer content hierarchy and accessibility over decorative fidelity.
- Do not introduce a large card framework until repeated code causes real friction.

### Priority Tickets

1. `[DONE]` Project front schematic alignment
   - Desired behavior: project front matches the schematic hierarchy: title, right-corner status/field, metrics row, lead expert link, footer actions.
   - TDD: update `ProjectCard.test.tsx` to assert location, year range, status, field, website, copy, details, and lead expert link when provided.
   - Implementation: render `leadExpertName` and `leadExpertId` as an in-page action that selects or scrolls to the related expert card when possible.

2. `[DONE]` Project back schematic alignment
   - Desired behavior: project back keeps title/status/field context, shows a readable clamped description, and keeps footer actions available.
   - TDD: add long-description tests proving the description can expand without hiding the back/copy controls.
   - Implementation: replace `overflow-hidden` body behavior with a stable scroll or max-height pattern.

3. `[DONE]` Expert front schematic alignment
   - Desired behavior: expert front presents header/avatar, institution, country, degree, stats, contact/social actions, copy, and details in a consistent order.
   - TDD: update `ExpertCard.test.tsx` with avatar-present and avatar-missing cases.
   - Implementation: preserve optional avatar support; if no avatar exists, use a compact initials fallback rather than leaving the header visually unbalanced.

4. `[DONE]` Expert back schematic alignment
   - Desired behavior: expert back shows matching header, expertise tags, full bio area, social/copy/back footer.
   - TDD: test long bio, many expertise tags, and footer actions remain reachable.
   - Implementation: use an internal scroll area for bio/tags and keep footer fixed inside the card.

5. `[DONE]` Flip behavior audit
   - Desired behavior: cards flip only from explicit controls, not accidental card clicks.
   - TDD: click details button, back button, copy button, external link, and volunteer button.
   - Implementation: stop propagation only where needed.

6. `[DONE]` Back-face layout polish
   - Desired behavior: no clipped important content, no awkward empty zones, no overlapping footer.
   - TDD: render long project and expert content and assert key actions remain present.
   - Implementation: prefer internal scroll areas with stable footer placement.

7. `[DONE]` Keyboard and screen-reader support
   - Desired behavior: keyboard users can flip, read details, return, copy, and activate links.
   - TDD: keyboard navigation test for front and back faces.
   - Implementation: preserve button semantics and `aria-expanded`/labels.

8. `[DONE]` Reduced-motion support
   - Desired behavior: flip animation is disabled or softened when reduced motion is enabled.
   - TDD: store `a11y.reducedMotion` test or CSS sanity test.
   - Implementation: use existing a11y state or media query, not a new animation system.

9. `[DEFERRED]` Shared card primitives only if duplication becomes painful
   - Desired behavior: project and expert cards may share tiny primitives for repeated footer/action patterns.
   - TDD: no separate test needed unless extracting behavior.
   - Implementation: extract after tests are green, keeping the public props stable.

### Acceptance Criteria

- `[DONE]` Flip cards are keyboard usable.
- `[DONE]` Copy/link/volunteer actions do not trigger unintended flips.
- `[DONE]` Front and back faces remain readable at desktop and mobile widths.
- `[DONE]` Reduced-motion users are respected.
- `[DONE]` Card content hierarchy matches the four schematic files where the schema data supports it.
- `[DONE]` Missing optional data has intentional fallbacks, not visual holes.

## Phase 4: Missing Feature Implementation `[DONE]`

### Goal

Fill the missing product gaps without regrowing the old app's complexity.

Status: `[DONE]` Workflow feedback and shareable URL sync are done for the current single-page app contract.

### Priority Tickets

1. `[DONE]` Project detail behavior for card-back scope
   - Decide whether details live on the card back, sidebar selection, or modal.
   - Recommended default: card back plus sidebar selected-state summary.
   - TDD: selected project exposes name, status, field, location, and volunteer action.

2. `[DONE]` Expert detail behavior for card-back scope
   - Decide whether expert details stay card-only or get a selected expert panel.
   - Recommended default: card back only for now.
   - TDD: expert card back includes expertise, bio, stats, and contact links.

3. `[DONE]` Add-project success/error UX
   - Desired behavior: submit success gives visible feedback; failure gives visible error, not only console output.
   - TDD: mock successful and failed submit in `AddProjectModal`/`App`.
   - Implementation: local modal status state or small store field, whichever is simpler.

4. `[DONE]` Volunteer success/error UX
   - Desired behavior: submit success/failure is visible and accessible.
   - TDD: mock submit states.
   - Implementation: match add-project status pattern.

5. `[DONE]` Offline behavior for submit blocking and accessible feedback
   - Desired behavior: offline users can browse cached/mock data but cannot submit.
   - TDD: offline state disables submit or shows clear message.
   - Implementation: use existing `isOnline` and `OfflineBanner`.

6. `[DONE]` URL sync completion
   - Desired behavior: filters and selected dataset can be shared/bookmarked.
   - TDD: URL -> store and store -> URL tests for search/status/field/country/dataset.
   - Implementation: keep sync in one hook, with debounced writes.

### Acceptance Criteria

- `[DONE]` Required missing workflows have visible success and failure states.
- `[DONE]` Feature scope stays inside the current single-page app architecture.
- `[DONE]` No new routing dependency is introduced unless there is a clear product decision.

## Phase 5: UX/UI And Style Improvement `[DONE]`

### Goal

Make the refactored app visually coherent while keeping the backup-inspired map/sidebar experience.

Status: `[DONE]` Completed for the current roadmap scope.

### Priority Tickets

1. `[DONE]` Establish one visual direction
   - Problem: current UI mixes custom green gradients, Tailwind tokens, shadcn neutral variables, rounded cards, and older backup styling.
   - Desired behavior: one consistent token and component style.
   - TDD: CSS sanity tests for required token names and no obsolete imports.
   - Implementation: keep Tailwind v4 tokens as source of truth.
   - Current note: shared app surface tokens now cover app background, panel border, panel radius, and panel shadow.

2. `[DONE]` Map/sidebar layout responsiveness
   - Desired behavior: desktop uses map + right sidebar; mobile stacks map, filters, and list cleanly.
   - TDD: component tests for key content presence; visual/manual browser pass for layout.
   - Implementation: use CSS grid/flex breakpoints with stable dimensions.
   - Current note: the app keeps `flex-col lg:flex-row`, a fixed desktop sidebar width, and tokenized panel treatment.

3. `[DONE]` Replace text-only map controls with icon-aware controls where helpful
   - Desired behavior: mode controls are compact, understandable, and accessible.
   - TDD: button accessible names and selected state tests.
   - Implementation: use lucide icons plus text or tooltips where appropriate.

4. `[DONE]` Normalize radii, shadows, and spacing
   - Desired behavior: repeated cards use consistent radius, border, spacing, and hover behavior.
   - TDD: CSS/class sanity tests only for key design tokens.
   - Implementation: prefer utility composition over new component abstractions.
   - Current note: map container, sidebar, status message, dataset control, and empty states use shared panel tokens.

5. `[DONE]` Improve empty, loading, and error states
   - Desired behavior: map/sidebar/card grids have useful empty/loading/error states.
   - TDD: render each state from store or mocked data.
   - Implementation: small presentational components only if repeated.
   - Current note: project, expert, and map sidebar empty states now provide accessible headings, next steps, and clear-filter actions where useful.

### Acceptance Criteria

- `[DONE]` The app reads as one coherent product for the current roadmap scope.
- `[DONE]` Mobile and desktop layouts are both usable.
- `[DONE]` Loading, empty, and error states are visible and accessible.

## Phase 6: General Code Improvement `[DONE]`

### Goal

Reduce complexity and duplication after behavior is stable.

Status: `[DONE]` Completed for the current roadmap scope.

### Priority Tickets

1. `[DONE]` Remove stale components or mark them intentionally retained
   - Candidates: `MapPlaceholder`, old `FilterBar` if replaced by `MapSidebar`, unused hooks.
   - TDD: import/syntax tests should fail if deleted exports are still referenced.
   - Implementation: remove only after `rg` proves no production usage.
   - Current note: `FilterBar` and `MapPlaceholder` are explicitly retained as compatibility/test surfaces while the active shell uses `MapSidebar` and `MapView`.

2. `[DONE]` Replace broad `any`
   - Candidates: `App` form handlers, `MapSidebar`, `MapController`, cluster callbacks, modal tests.
   - TDD: `npm run typecheck`.
   - Implementation: use existing `ProjectData`, `ExpertData`, and small local form types.
   - Current note: production source has no `any` matches in the current scan; remaining `any` usage is limited to tests/mocks.

3. `[DEFERRED]` Store slice cleanup
   - Desired behavior: filters, UI state, data state, and draft polygon state remain clear.
   - TDD: store tests for add, select, hover, clear filters, and draft polygon.
   - Implementation: avoid splitting store files until the current store becomes genuinely hard to navigate.

4. `[DONE]` Service boundary cleanup
   - Desired behavior: API transforms and mock data produce the same app-facing types.
   - TDD: contract tests for Supabase row -> `ProjectData`/`ExpertData` mapping.
   - Implementation: create small pure mapper functions if duplication appears.
   - Current note: app loading and Supabase/mock fallback paths are covered by service and hook tests for the current data contract.

5. `[DONE]` Test noise cleanup
   - Problem: intentional ErrorBoundary crash tests log noisy jsdom errors.
   - Desired behavior: tests pass with less distracting output.
   - TDD: same tests, but silence expected console errors locally.
   - Implementation: spy on `console.error` inside the specific test only.

### Acceptance Criteria

- `[DONE]` Fewer duplicate utilities and configs.
- `[DONE]` Fewer `any` types in production code.
- `[DONE]` Test output is easier to scan.
- `[DONE]` No broad rewrites without user-visible benefit.

## Phase 7: Code Splitting And Performance `[DONE]`

### Goal

Keep the richer app fast enough after adding map drawing, forms, Supabase, and design tooling.

Status: `[DONE]` Completed for the current roadmap scope.

### Priority Tickets

1. `[DONE]` Fix main chunk warning
   - Current issue: main app chunk is over the 500 kB minified warning threshold.
   - Desired behavior: map, drawing, forms, and Supabase are split into meaningful chunks.
   - TDD: update `bundleSanity.test.ts` to reflect realistic gzip budgets.
   - Implementation: lazy-load modal/form code and keep map lazy-loaded.
   - Current note: main app chunk is 275.75 kB minified, under the agreed 300 kB budget.

2. `[DONE]` Confirm Rolldown chunk config
   - Desired behavior: `manualChunks` works in Vite 8/Rolldown and produces intended chunk boundaries.
   - TDD: bundle sanity test inspects generated assets.
   - Implementation: keep chunk logic in `vite.config.ts` only.

3. `[DONE]` Lazy-load rarely used modals
   - Candidates: `AddProjectModal`, `VolunteerModal`, drawing wrapper.
   - TDD: app render test proves modals open after lazy load.
   - Implementation: use `React.lazy` and local suspense fallback only around modal content.

4. `[DONE]` Avoid loading Leaflet Draw until needed
   - Desired behavior: drawing library loads only inside add-project drawing flow.
   - TDD: bundle sanity or module mock test.
   - Implementation: keep dynamic import isolated in `MapDrawingControl`.

5. `[DONE]` Run smoke and lighthouse scripts
   - Desired behavior: scripts match current app routes and performance budgets.
   - TDD: script-level smoke test where possible.
   - Implementation: adjust budgets only after measuring.
   - Current note: smoke passes against preview; Lighthouse script respects `DEPLOY_URL` and exits safely when the local browser/preview check is unavailable in the sandbox.

### Acceptance Criteria

- `[DONE]` Production build has intentional chunks.
- `[DONE]` Main app chunk drops below the agreed budget or the budget is consciously revised.
- `[DONE]` Map and forms still open reliably after lazy loading.

## Phase 8: Final Hardening Before Feature Expansion `[DONE - REPEAT]`

### Goal

Make the current refactor dependable before adding another wave of features.

Status: `[DONE - REPEAT]` Completed for the latest implementation slice; repeat after each new slice.

### Work

- `[DONE]` Run `npm run typecheck`.
- `[DONE]` Run `npm run test:run`.
- `[DONE]` Run `npm run build`.
- `[DONE]` Run `npm run smoke:test` if the preview server is available.
- `[DONE]` Run performance check if Lighthouse dependencies are installed and stable.
- `[BLOCKED]` Review browser behavior against the backup reference:
  - desktop map/sidebar
  - mobile stacked layout
  - map mode toggles
  - sidebar filters
  - project card flip
  - expert card flip
  - add-project modal with polygon drawing
  - volunteer modal
  - Current note: current refactored preview was smoke-checked in Browser; backup-reference comparison remains blocked because `http://localhost:3020/` was unavailable.

### Acceptance Criteria

- `[DONE]` The app is validation-green.
- `[DONE]` The known roadmap risks are either fixed or documented.
- `[DONE]` The next feature can start from a clean, understandable baseline.

## Suggested Implementation Order

1. Restore or confirm the backup reference app on `http://localhost:3020/` if visual parity remains a goal.
2. Run a fresh browser comparison against the backup reference once it is available.
3. Start a new feature roadmap for work beyond this cleanup pass, such as richer map tools, deeper card visual polish, or new data workflows.
4. Keep repeating Phase 8 validation after each future slice.

## Ticket Template

Use this template for each implementation ticket:

```md
## Ticket: <short name>

Goal:
- <one user-visible or maintainability outcome>

Test first:
- <focused test file and behavior>

Implementation:
- <smallest code path to change>

Acceptance:
- `npm run typecheck`
- `npm run test:run`
- `npm run build`
- <feature-specific acceptance check>

KISS/DRY check:
- Did this add only the minimum needed behavior?
- Did this remove or avoid meaningful duplication?
- Is the test describing behavior rather than implementation trivia?
```
