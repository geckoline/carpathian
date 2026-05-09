# Further Improvements Roadmap

Date: May 9, 2026

## Purpose

This roadmap covers the next improvement wave for the refactored `carpathian` app after the major refactoring jump. It focuses on missing feature implementation, UI/UX and style polish, map debugging and richer map behavior, flip-card quality, general debugging, code cleanup, and code splitting.

The operating principles are:

- KISS: keep each change small enough to understand, test, and revert.
- DRY: remove real duplication after the behavior is proven, not before.
- TDD: write or update the narrowest useful test before changing behavior.

## Current Baseline

The refactor is now a real product slice:

- Vite 8 + React 18 + TypeScript strict
- Tailwind v4 plus shadcn/base-nova styling primitives
- Zustand + Immer as the central store
- Leaflet map with clustering, satellite/street modes, label overlay, selection, hover sync, and drawing support
- Supabase service layer plus mock data
- Add-project and volunteer modal flows
- 52 passing test files and 175 passing tests at the time of the latest audit
- Production build passes, with one bundle-size warning on the main app chunk

Primary concerns now:

- Some behavior is implemented but not fully product-hardened.
- Some duplicate code/config exists after rapid feature growth.
- The current design is stronger than before but visually mixed.
- The map needs debugging against the backup reference and real user flows.
- Flip cards need focused polish because they are a core interaction pattern.
- The card schematics in `docs/carpathian-card-shematics/` describe richer intended card layouts than the current implementation.

## Golden Rule For Every Ticket

Every ticket should follow this loop:

1. Add or update one focused test that describes the desired behavior.
2. Make the smallest implementation change that passes the test.
3. Run the relevant focused test.
4. Run `npm run typecheck`, `npm run test:run`, and `npm run build` before closing the ticket.
5. If the implementation becomes awkward, simplify before expanding scope.

## Phase 0: Reconfirm The Baseline

### Goal

Make sure the current big refactor step is a stable starting point before adding more features.

### Work

- Run `npm run typecheck`.
- Run `npm run test:run`.
- Run `npm run build`.
- Record current bundle output and any warnings.
- Confirm which app is actually served at `http://localhost:3020/`, because the latest terminal inspection showed that port as occupied by an existing process.

### Acceptance Criteria

- The three main validation commands pass.
- Known warnings are documented, not ignored.
- The backup reference URL is confirmed to be the intended unrefactored backup.

## Phase 1: Critical Debugging And Runtime Safety

### Goal

Remove the most likely runtime breakpoints before deeper UX work.

### Priority Tickets

1. Supabase fallback safety
   - Problem: `src/lib/supabase.ts` throws during module import if env vars are missing.
   - Desired behavior: missing Supabase env should not crash local demo/mock mode.
   - TDD: add an `apiService` or startup test proving mock fallback works without Supabase env.
   - Implementation: lazy-create the Supabase client or gate Supabase calls behind env availability.

2. Data loading ownership
   - Problem: `useRealtimeSync` now owns app loading, while `useDataFetch` still exists.
   - Desired behavior: one clear primary app-loading path.
   - TDD: store/data-flow test for initial load, API failure, and mock fallback.
   - Implementation: keep one primary hook for app startup and mark or remove the unused path.

3. Duplicate Vite config
   - Problem: both `vite.config.js` and `vite.config.ts` exist.
   - Desired behavior: one active Vite config source.
   - TDD: update `viteConfig.test.ts` to assert the intended config file and HMR/build settings.
   - Implementation: keep the TypeScript config if it is the richer active source, then remove or clearly retire the JS config.

4. Duplicate highlight utilities
   - Problem: `src/utils/highlightText.ts` and `src/utils/text/highlightText.ts` provide different APIs.
   - Desired behavior: one canonical text-highlight utility.
   - TDD: keep tests for sanitization, regex escaping, empty search, and repeated matches.
   - Implementation: preserve the DOMPurify-safe version for HTML injection paths and migrate imports.

### Acceptance Criteria

- App can boot in mock/demo mode without Supabase env.
- Only one canonical data-startup path is used by `App`.
- Only one Vite config is considered active.
- Only one highlight utility remains for production UI usage.

## Phase 2: Map Debugging And Improvement

### Goal

Make the map behavior match the intended backup-inspired UX while staying declarative and testable.

### Priority Tickets

1. Align polygons with visible projects
   - Problem: `MapView` receives `projects`, but `usePolygonLayer` reads global store data.
   - Desired behavior: markers and polygons always represent the same filtered/dataset project list.
   - TDD: add a `usePolygonLayer` test where hidden projects do not produce visible polygons.
   - Implementation: pass projects into `usePolygonLayer(projects)` or derive polygons inside `MapView` from `displayProjects`.

2. Decide polygon visibility policy
   - Current behavior: only selected polygons render.
   - Options: selected-only, all filtered polygons, or all filtered polygons with selected emphasis.
   - Recommended default: all filtered polygons at low opacity, selected polygon emphasized.
   - TDD: test selected and unselected polygon rendering counts and styles.

3. Replace broad `any` map types
   - Problem: cluster and project map paths still use `any`.
   - Desired behavior: typed project input and typed cluster icon context.
   - TDD: typecheck plus a narrow MapView smoke test.
   - Implementation: introduce small local types instead of large abstractions.

4. Map resize and fitBounds stability
   - Problem: `setTimeout` and `ResizeObserver` are pragmatic but can create flaky behavior.
   - Desired behavior: map invalidates size when container is ready and does not over-fit during user selection.
   - TDD: mock `invalidateSize`, `fitBounds`, and selected-project transitions.
   - Implementation: isolate the behavior in `MapController` with clear conditions.

5. Popup, sidebar, and card sync
   - Desired behavior: marker click selects sidebar/card, sidebar hover highlights marker/polygon, popup scroll target exists.
   - TDD: add tests for marker click -> selected project, sidebar hover -> hovered project, popup scroll button -> correct DOM target.
   - Implementation: avoid DOM queries except for final scroll behavior.

6. Drawing flow hardening
   - Desired behavior: drawn polygon persists to modal form state, can be cleared, and validates minimum points.
   - TDD: add tests for draw-created event, draft polygon storage, modal submit with coordinates.
   - Implementation: keep Leaflet Draw isolated behind `MapDrawingControl`.

### Acceptance Criteria

- Map markers, polygons, sidebar, and cards stay in sync.
- Filtering and dataset switching update the map predictably.
- Drawing works in the add-project flow without leaking Leaflet details into app state.

## Phase 3: Flip Cards

### Goal

Make project and expert flip cards match the documented schematics where they improve clarity, while keeping the implementation small, accessible, and testable.

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

1. Project front schematic alignment
   - Desired behavior: project front matches the schematic hierarchy: title, right-corner status/field, metrics row, lead expert link, footer actions.
   - TDD: update `ProjectCard.test.tsx` to assert location, year range, status, field, website, copy, details, and lead expert link when provided.
   - Implementation: render `leadExpertName` and `leadExpertId` as an in-page action that selects or scrolls to the related expert card when possible.

2. Project back schematic alignment
   - Desired behavior: project back keeps title/status/field context, shows a readable clamped description, and keeps footer actions available.
   - TDD: add long-description tests proving the description can expand without hiding the back/copy controls.
   - Implementation: replace `overflow-hidden` body behavior with a stable scroll or max-height pattern.

3. Expert front schematic alignment
   - Desired behavior: expert front presents header/avatar, institution, country, degree, stats, contact/social actions, copy, and details in a consistent order.
   - TDD: update `ExpertCard.test.tsx` with avatar-present and avatar-missing cases.
   - Implementation: preserve optional avatar support; if no avatar exists, use a compact initials fallback rather than leaving the header visually unbalanced.

4. Expert back schematic alignment
   - Desired behavior: expert back shows matching header, expertise tags, full bio area, social/copy/back footer.
   - TDD: test long bio, many expertise tags, and footer actions remain reachable.
   - Implementation: use an internal scroll area for bio/tags and keep footer fixed inside the card.

5. Flip behavior audit
   - Desired behavior: cards flip only from explicit controls, not accidental card clicks.
   - TDD: click details button, back button, copy button, external link, and volunteer button.
   - Implementation: stop propagation only where needed.

6. Back-face layout polish
   - Desired behavior: no clipped important content, no awkward empty zones, no overlapping footer.
   - TDD: render long project and expert content and assert key actions remain present.
   - Implementation: prefer internal scroll areas with stable footer placement.

7. Keyboard and screen-reader support
   - Desired behavior: keyboard users can flip, read details, return, copy, and activate links.
   - TDD: keyboard navigation test for front and back faces.
   - Implementation: preserve button semantics and `aria-expanded`/labels.

8. Reduced-motion support
   - Desired behavior: flip animation is disabled or softened when reduced motion is enabled.
   - TDD: store `a11y.reducedMotion` test or CSS sanity test.
   - Implementation: use existing a11y state or media query, not a new animation system.

9. Shared card primitives only if duplication becomes painful
   - Desired behavior: project and expert cards may share tiny primitives for repeated footer/action patterns.
   - TDD: no separate test needed unless extracting behavior.
   - Implementation: extract after tests are green, keeping the public props stable.

### Acceptance Criteria

- Flip cards are keyboard usable.
- Copy/link/volunteer actions do not trigger unintended flips.
- Front and back faces remain readable at desktop and mobile widths.
- Reduced-motion users are respected.
- Card content hierarchy matches the four schematic files where the schema data supports it.
- Missing optional data has intentional fallbacks, not visual holes.

## Phase 4: Missing Feature Implementation

### Goal

Fill the missing product gaps without regrowing the old app's complexity.

### Priority Tickets

1. Project detail behavior
   - Decide whether details live on the card back, sidebar selection, or modal.
   - Recommended default: card back plus sidebar selected-state summary.
   - TDD: selected project exposes name, status, field, location, and volunteer action.

2. Expert detail behavior
   - Decide whether expert details stay card-only or get a selected expert panel.
   - Recommended default: card back only for now.
   - TDD: expert card back includes expertise, bio, stats, and contact links.

3. Add-project success/error UX
   - Desired behavior: submit success gives visible feedback; failure gives visible error, not only console output.
   - TDD: mock successful and failed submit in `AddProjectModal`/`App`.
   - Implementation: local modal status state or small store field, whichever is simpler.

4. Volunteer success/error UX
   - Desired behavior: submit success/failure is visible and accessible.
   - TDD: mock submit states.
   - Implementation: match add-project status pattern.

5. Offline behavior
   - Desired behavior: offline users can browse cached/mock data but cannot submit.
   - TDD: offline state disables submit or shows clear message.
   - Implementation: use existing `isOnline` and `OfflineBanner`.

6. URL sync completion
   - Desired behavior: filters and selected dataset can be shared/bookmarked.
   - TDD: URL -> store and store -> URL tests for search/status/field/country/dataset.
   - Implementation: keep sync in one hook, with debounced writes.

### Acceptance Criteria

- Required missing workflows have visible success and failure states.
- Feature scope stays inside the current single-page app architecture.
- No new routing dependency is introduced unless there is a clear product decision.

## Phase 5: UX/UI And Style Improvement

### Goal

Make the refactored app visually coherent while keeping the backup-inspired map/sidebar experience.

### Priority Tickets

1. Establish one visual direction
   - Problem: current UI mixes custom green gradients, Tailwind tokens, shadcn neutral variables, rounded cards, and older backup styling.
   - Desired behavior: one consistent token and component style.
   - TDD: CSS sanity tests for required token names and no obsolete imports.
   - Implementation: keep Tailwind v4 tokens as source of truth.

2. Map/sidebar layout responsiveness
   - Desired behavior: desktop uses map + right sidebar; mobile stacks map, filters, and list cleanly.
   - TDD: component tests for key content presence; visual/manual browser pass for layout.
   - Implementation: use CSS grid/flex breakpoints with stable dimensions.

3. Replace text-only map controls with icon-aware controls where helpful
   - Desired behavior: mode controls are compact, understandable, and accessible.
   - TDD: button accessible names and selected state tests.
   - Implementation: use lucide icons plus text or tooltips where appropriate.

4. Normalize radii, shadows, and spacing
   - Desired behavior: repeated cards use consistent radius, border, spacing, and hover behavior.
   - TDD: CSS/class sanity tests only for key design tokens.
   - Implementation: prefer utility composition over new component abstractions.

5. Improve empty, loading, and error states
   - Desired behavior: map/sidebar/card grids have useful empty/loading/error states.
   - TDD: render each state from store or mocked data.
   - Implementation: small presentational components only if repeated.

### Acceptance Criteria

- The app reads as one coherent product, not a mix of old and new UI systems.
- Mobile and desktop layouts are both usable.
- Loading, empty, and error states are visible and accessible.

## Phase 6: General Code Improvement

### Goal

Reduce complexity and duplication after behavior is stable.

### Priority Tickets

1. Remove stale components or mark them intentionally retained
   - Candidates: `MapPlaceholder`, old `FilterBar` if replaced by `MapSidebar`, unused hooks.
   - TDD: import/syntax tests should fail if deleted exports are still referenced.
   - Implementation: remove only after `rg` proves no production usage.

2. Replace broad `any`
   - Candidates: `App` form handlers, `MapSidebar`, `MapController`, cluster callbacks, modal tests.
   - TDD: `npm run typecheck`.
   - Implementation: use existing `ProjectData`, `ExpertData`, and small local form types.

3. Store slice cleanup
   - Desired behavior: filters, UI state, data state, and draft polygon state remain clear.
   - TDD: store tests for add, select, hover, clear filters, and draft polygon.
   - Implementation: avoid splitting store files until the current store becomes genuinely hard to navigate.

4. Service boundary cleanup
   - Desired behavior: API transforms and mock data produce the same app-facing types.
   - TDD: contract tests for Supabase row -> `ProjectData`/`ExpertData` mapping.
   - Implementation: create small pure mapper functions if duplication appears.

5. Test noise cleanup
   - Problem: intentional ErrorBoundary crash tests log noisy jsdom errors.
   - Desired behavior: tests pass with less distracting output.
   - TDD: same tests, but silence expected console errors locally.
   - Implementation: spy on `console.error` inside the specific test only.

### Acceptance Criteria

- Fewer duplicate utilities and configs.
- Fewer `any` types in production code.
- Test output is easier to scan.
- No broad rewrites without user-visible benefit.

## Phase 7: Code Splitting And Performance

### Goal

Keep the richer app fast enough after adding map drawing, forms, Supabase, and design tooling.

### Priority Tickets

1. Fix main chunk warning
   - Current issue: main app chunk is over the 500 kB minified warning threshold.
   - Desired behavior: map, drawing, forms, and Supabase are split into meaningful chunks.
   - TDD: update `bundleSanity.test.ts` to reflect realistic gzip budgets.
   - Implementation: lazy-load modal/form code and keep map lazy-loaded.

2. Confirm Rolldown chunk config
   - Desired behavior: `manualChunks` works in Vite 8/Rolldown and produces intended chunk boundaries.
   - TDD: bundle sanity test inspects generated assets.
   - Implementation: keep chunk logic in `vite.config.ts` only.

3. Lazy-load rarely used modals
   - Candidates: `AddProjectModal`, `VolunteerModal`, drawing wrapper.
   - TDD: app render test proves modals open after lazy load.
   - Implementation: use `React.lazy` and local suspense fallback only around modal content.

4. Avoid loading Leaflet Draw until needed
   - Desired behavior: drawing library loads only inside add-project drawing flow.
   - TDD: bundle sanity or module mock test.
   - Implementation: keep dynamic import isolated in `MapDrawingControl`.

5. Run smoke and lighthouse scripts
   - Desired behavior: scripts match current app routes and performance budgets.
   - TDD: script-level smoke test where possible.
   - Implementation: adjust budgets only after measuring.

### Acceptance Criteria

- Production build has intentional chunks.
- Main app chunk drops below the agreed budget or the budget is consciously revised.
- Map and forms still open reliably after lazy loading.

## Phase 8: Final Hardening Before Feature Expansion

### Goal

Make the current refactor dependable before adding another wave of features.

### Work

- Run `npm run typecheck`.
- Run `npm run test:run`.
- Run `npm run build`.
- Run `npm run smoke:test` if the preview server is available.
- Run performance check if Lighthouse dependencies are installed and stable.
- Review browser behavior against the backup reference:
  - desktop map/sidebar
  - mobile stacked layout
  - map mode toggles
  - sidebar filters
  - project card flip
  - expert card flip
  - add-project modal with polygon drawing
  - volunteer modal

### Acceptance Criteria

- The app is validation-green.
- The known roadmap risks are either fixed or documented.
- The next feature can start from a clean, understandable baseline.

## Suggested Implementation Order

1. Supabase fallback safety.
2. Polygon/list dataset alignment.
3. Flip-card behavior and accessibility.
4. Card schematic alignment for project and expert fronts/backs.
5. Add-project and volunteer success/error UX.
6. Visual direction and responsive layout pass.
7. Duplicate config/utility cleanup.
8. Code splitting and bundle budget cleanup.
9. Final browser comparison against the backup reference.

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
