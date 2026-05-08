# Refactoring Roadmap: Remaining Work For `carpathian`

Date: May 7, 2026

## Purpose

This roadmap covers the remaining work needed to move `/Users/esra/Documents/programming/react/carpathian` from a promising partial successor to the primary source of truth for the Carpathian Citizen Science app.

It is based on the current live state of both projects, the current validation results, and the existing planning documents in `/Users/esra/Documents/programming/react/carpathian/docs`.

This roadmap deliberately avoids a parity-at-all-costs mindset. The goal is not to rebuild every legacy surface from `/Users/esra/Documents/programming/react/carpathian-citizen-science-react18 Kopie`. The goal is to:

- make the current refactor green and trustworthy
- finish the highest-value missing workflows
- keep the narrower, cleaner architecture intact
- only reintroduce complexity when it clearly earns its place

## Guiding Rules

1. No new breadth before `typecheck + test + build` are green in `carpathian`.
2. Treat `carpathian` as the successor architecture, not as a temporary clone.
3. Rebuild missing features only when they are still product-relevant.
4. Prefer vertical slices over big-bang migration.
5. Keep scope decisions explicit: `migrated`, `redesigned`, `deferred`, or `dropped`.

## Current Baseline

As of May 7, 2026:

- `carpathian` has a cleaner app shell, smaller dependency surface, focused docs, and a strong architectural direction
- `carpathian` is not yet validation-clean:
  - `npm run build` fails at the TypeScript stage
  - `npm run test:run` has 1 failing test in `src/components/layout/__tests__/FilterBar.test.tsx`
- the original project remains more feature-complete, but its build also fails and its broader shape should not be copied forward blindly

The immediate roadmap priority is therefore stabilization, not expansion.

## End State

The refactor should be considered complete when all of the following are true:

- `carpathian` passes `npm run build`
- `carpathian` passes `npm run test:run`
- core app flows are present and reliable:
  - project browsing
  - expert browsing
  - filtering and search
  - map interaction
  - accessibility controls
- any missing legacy feature is either intentionally rebuilt, explicitly deferred, or explicitly dropped
- the team can stop using the original project as the runtime reference for day-to-day work

## Phase 1: Stabilize The Current Refactor

### Goal

Make the existing `carpathian` slice fully green before adding more surface area.

### Work

- fix current TypeScript blockers in:
  - `src/App.tsx`
  - `src/components/map/MapView.tsx`
  - `src/hooks/usePolygonLayer.ts`
  - `src/utils/polygonDrawing.ts`
  - `src/utils/text/highlightText.ts`
  - polygon-related tests
- resolve the failing debounce test in `src/components/layout/__tests__/FilterBar.test.tsx`
- confirm whether the `FilterBar` issue is:
  - a test expectation mismatch
  - an unwanted initial store write
  - a real debounce behavior bug
- remove obvious dead code and unused declarations that currently block the build
- tighten map typing where `LatLngTuple` and `[number, number]` expectations currently disagree

### Deliverables

- `npm run build` passes in `carpathian`
- `npm run test:run` passes in `carpathian`
- no known failing foundational tests in cards, filters, map, or accessibility hooks

### Exit Criteria

- the refactor is build-green
- the refactor is test-green
- the app is stable enough that new work does not start from a broken baseline

## Phase 2: Lock The Successor Contract

### Goal

Decide what the new app is actually responsible for so the refactor does not regrow the original repository’s sprawl.

### Work

- convert the current CSV planning decisions into one explicit contract for:
  - migrated features
  - redesigned features
  - deferred features
  - dropped features
- confirm the intended v1 surface for `carpathian`
- define which original areas are permanently out of scope for the successor app, especially:
  - router
  - React Query
  - logging/analytics service
  - low-value wrappers and banner surfaces
  - auth, favorites, notifications, i18n unless product needs changed
- define which missing areas must come back before the refactor can replace the original:
  - richer search/detail coordination
  - missing map affordances
  - modal workflows, if they are still required

### Deliverables

- one concise successor-scope document in `carpathian/docs`
- a clear list of must-have vs. nice-to-have remaining work

### Exit Criteria

- future implementation can evaluate every missing legacy feature against an agreed scope rule instead of reintroducing it by default

## Phase 3: Finish The Map Slice

### Goal

Make the map a trustworthy part of the refactor rather than a partially wired placeholder with unstable edges.

### Work

- complete polygon handling and typing
- finish cluster behavior so it is both correct and testable
- wire selected-project synchronization cleanly through Zustand instead of imperative DOM behavior
- finish tile toggle and selected-project auto-focus behavior
- confirm the intended map behavior for:
  - no results
  - invalid coordinates
  - missing polygons
  - selected project not currently visible in filtered state
- strengthen map test coverage around:
  - marker rendering
  - clustering behavior
  - polygon layer creation
  - map-to-card synchronization
  - tile switching

### Deliverables

- map behavior is functional and deterministic
- map tests cover the primary interaction model

### Exit Criteria

- the map is no longer a known blocker for using `carpathian` as the main app slice

## Phase 4: Complete Core Filtering And Search

### Goal

Bring the refactor’s project and expert discovery flows to product-usable completeness without recreating the original search surface wholesale.

### Work

- harden `FilterBar` and related hooks:
  - `useDebounce`
  - `useProjectFilters`
  - `useExpertFilters`
  - sorting behavior where applicable
- confirm the intended search behavior for:
  - empty input
  - initial mount
  - fast typing
  - tab switching between projects and experts
  - zero-result states
- rebuild only the high-value parts of the original search/detail flow
- preserve safe text highlighting and XSS-safe rendering
- decide whether any sidebar/detail behavior from the original should return as:
  - inline expansion
  - modal detail
  - map-linked selection
  - or not at all

### Deliverables

- stable, predictable search/filter behavior for both projects and experts
- clear UX for viewing filtered results and selected items

### Exit Criteria

- the refactor can support day-to-day browsing and discovery without needing the original project’s search scaffolding

## Phase 5: Reintroduce Only The Required Missing Workflows

### Goal

Add back the missing flows that are still necessary for the successor app, without reopening every legacy branch.

### Priority order

1. Project and expert detail coordination
2. Modal infrastructure and required modal flows
3. Only then any additional advanced workflows

### Work

- decide whether `Modal.tsx` is sufficient as the base for all future modal work
- if product still requires them, rebuild:
  - add-project flow
  - volunteer flow
- keep forms tied to the refactor’s data/API direction rather than porting old imperative flows
- validate form requirements before implementation:
  - field list
  - validation rules
  - success/error handling
  - mock vs. real API behavior
- do not revive complex form or drawing behavior until the service boundary is stable

### Deliverables

- required modal workflows exist in the refactor
- no unnecessary revival of abandoned legacy UI

### Exit Criteria

- the app covers the must-have user actions still expected from the original

## Phase 6: Harden Data And Service Boundaries

### Goal

Make the refactor’s API and mock-data layer trustworthy enough that feature work does not leak data-shape assumptions everywhere.

### Work

- finish the intended `apiService` contract
- keep `mockApi` aligned with the production-facing types
- validate incoming data consistently with Zod
- make environment handling explicit and safe
- define expected behavior for:
  - missing API base URL
  - invalid payloads
  - partial records
  - retry behavior
  - fallback behavior
- ensure cards, filters, and map consume normalized data, not ad hoc raw shapes

### Deliverables

- one stable data contract for the refactor
- predictable fallback behavior in local development

### Exit Criteria

- the app can switch between mock and real service boundaries without component-level contract drift

## Phase 7: Accessibility, UX, And Visual Completion

### Goal

Polish the narrower app until it feels intentionally finished, not just technically cleaned up.

### Work

- finish accessibility checks for:
  - keyboard navigation
  - focus visibility
  - modal focus handling
  - reduced-motion behavior where applicable
  - contrast compliance
- verify map accessibility expectations and document known limits where Leaflet imposes them
- refine empty states, loading states, and error states
- make sure the simplified layout works well on:
  - desktop
  - tablet
  - mobile
- keep the new visual system consistent rather than drifting back into mixed legacy styling

### Deliverables

- app-level accessibility passes for the supported surface
- responsive layout confidence across the main user paths

### Exit Criteria

- the refactor feels product-ready for its intended scope, not just technically operational

## Phase 8: Tooling, CI, And Release Readiness

### Goal

Turn the green local refactor into a reliable team baseline.

### Work

- add or finish CI so it enforces:
  - build
  - tests
  - type safety
- add any missing lightweight checks that protect the new architecture
- document the standard development workflow in the refactor project
- add a deployment checklist if the refactor is expected to replace the original runtime
- consider smoke-test coverage for the main happy path

### Deliverables

- reproducible validation pipeline for `carpathian`
- contributor guidance that matches the actual project shape

### Exit Criteria

- new changes are evaluated against the successor app’s real quality bar, not just local convenience

## Phase 9: Decommission The Original As The Working Reference

### Goal

Move the team’s day-to-day focus fully onto `carpathian`.

### Work

- identify the last remaining reason anyone still needs the original project
- either migrate that need or document it as intentionally obsolete
- update docs so the refactor becomes the default development entrypoint
- archive or clearly mark older roadmap and status documents that no longer represent the active direction
- define how to use the original project afterward:
  - historical reference only
  - asset source only
  - behavior comparison only

### Deliverables

- `carpathian` becomes the default engineering target
- the original no longer acts as the main implementation source

### Exit Criteria

- new work begins in `carpathian` by default

## Suggested Sequence

If the work is done incrementally, use this order:

1. Phase 1: Stabilize the current refactor
2. Phase 2: Lock the successor contract
3. Phase 3: Finish the map slice
4. Phase 4: Complete core filtering and search
5. Phase 5: Reintroduce only the required missing workflows
6. Phase 6: Harden data and service boundaries
7. Phase 7: Accessibility, UX, and visual completion
8. Phase 8: Tooling, CI, and release readiness
9. Phase 9: Decommission the original as the working reference

## Suggested Milestones

### Milestone A: Green Core

- build passes
- tests pass
- map typing is stable
- `FilterBar` behavior is correct

### Milestone B: Usable Successor

- map works reliably
- filtering/search is complete for current scope
- key detail flows are present

### Milestone C: Product-Ready Narrowed App

- required workflows are restored
- accessibility and responsive polish are complete
- API boundary is trustworthy

### Milestone D: Team Default

- CI and docs are in place
- `carpathian` becomes the default app for ongoing work

## What Not To Do

- do not chase 100% file-for-file parity with the original
- do not reintroduce wrappers just because they existed before
- do not revive dropped dependencies without a current need
- do not add advanced workflows before the narrowed core is green
- do not treat old roadmap assumptions as still valid unless the live refactor still supports them

## Recommended Immediate Next Actions

1. Fix the current `carpathian` build errors and the `FilterBar` test failure.
2. Turn the current CSV planning notes into one explicit successor-scope document.
3. Complete the map slice before rebuilding modals or extra feature breadth.
4. Decide which original search/detail behaviors are truly required in the successor.
5. Only after that, rebuild the minimum missing workflows needed to retire the original project.
