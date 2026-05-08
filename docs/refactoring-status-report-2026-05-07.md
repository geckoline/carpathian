# Refactoring Status Report: `carpathian` vs `carpathian-citizen-science-react18 Kopie`

Date: May 7, 2026

## Summary

This report compares the active original project at `/Users/esra/Documents/programming/react/carpathian-citizen-science-react18 Kopie` with the in-progress refactor at `/Users/esra/Documents/programming/react/carpathian`.

It is optimized for status plus next steps and answers three questions:

- what has already been migrated into `carpathian`
- what was intentionally simplified, dropped, or redesigned rather than migrated 1:1
- what currently blocks `carpathian` from becoming the new source of truth

Primary evidence comes from the live directories and current validation runs on May 7, 2026. The snapshot files and older documentation were used as supporting context, not as the sole source of truth:

- `/Users/esra/Documents/programming/react/carpathian/carpathian-complete.txt`
- `/Users/esra/Documents/programming/react/carpathian-citizen-science-react18 Kopie/carpathian-citizen-science-react18 Kopie-complete.txt`
- `/Users/esra/Documents/programming/react/carpathian-citizen-science-react18 Kopie/src/src-complete.txt`
- `/Users/esra/Documents/programming/react/carpathian/docs/refactoring-overview.csv`
- `/Users/esra/Documents/programming/react/carpathian/docs/execution-table.csv`
- `/Users/esra/Documents/programming/react/carpathian/docs/ui-components+hooks-strategy.csv`
- `/Users/esra/Documents/programming/react/carpathian-citizen-science-react18 Kopie/docs/analysis/project-status-report-2026-04-21.md`

## Executive Assessment

The refactor is real and substantial, but it is not yet a full replacement for the original project.

`carpathian` has already achieved a cleaner architecture, a smaller surface area, and clearer scope control. It narrows the app to a more maintainable React 18 + Vite + Zustand application with fewer moving parts, fewer legacy wrappers, and explicit refactor-planning documents that define what should be recreated, deferred, or dropped.

At the same time, the refactor is not yet build-green and does not yet cover the full functional breadth of the original project. The original project is still the more feature-complete runtime, but it is also weighed down by repository sprawl, mixed architectural directions, and a build that currently fails in CSS/PostCSS/Tailwind processing.

The most accurate current status is:

- the original project is more complete functionally, but build-broken
- the refactor is cleaner architecturally, but not yet build-green and not yet feature-complete

## Comparison Scope

This comparison was performed at four levels:

1. repository scope
2. runtime architecture
3. source-tree overlap
4. validation health

## Repository Scope

### Original project

The original repository contains the active application plus a large amount of adjacent material:

- extensive docs, audits, and recovery plans
- generated `build`, `dist`, and `coverage` output
- imported website assets and archived content
- multiple testing and utility scripts
- duplicated or parallel structures such as `store` and `stores`
- large style, asset, and integration surfaces

Representative top-level directories include:

- `assets`
- `build`
- `coverage`
- `dist`
- `docs`
- `documentation`
- `github_sources`
- `public`
- `scripts`
- `src`
- `tooling`
- `utils`

### Refactor project

The refactor repository is much narrower and app-focused:

- `docs`
- `src`
- `dist-types`

The refactor still has installed dependencies and build artifacts, but the tracked project shape is notably smaller and more deliberate.

### Structural delta

Current source counts from the live trees:

- `carpathian/src`: 81 files, 80 TS/TSX files
- original `src`: 425 files, 139 TS/TSX files

Key directory file counts also show the reduction in surface area:

Original:

- `components`: 75
- `hooks`: 12
- `services`: 2
- `store`: 2
- `stores`: 2
- `utils`: 17
- `data`: 38
- `contexts`: 1
- `constants`: 3
- `styles`: 52

Refactor:

- `components`: 34
- `hooks`: 21
- `services`: 5
- `store`: 2
- `utils`: 6
- `types`: 3

This is not a simple file move. The refactor deliberately compresses the repository into a smaller supported app contract and removes large amounts of passive material from the active implementation surface.

## Runtime Architecture

### Original runtime

The original runtime bootstraps through context:

- `src/main.tsx` mounts `<AppProvider><App /></AppProvider>`
- `src/App.tsx` lazy-loads `CitizenScienceSection`
- `CitizenScienceSection` and related wrappers carry much of the application shell

The original app exposes a broader runtime shell with more wrappers and more entrypoint-like UI layers:

- `CitizenScienceSection`
- `MapSidebarSection`
- `SearchDetailsWrapper`
- `ModalsSection`
- `ScrollDetailsSection`
- `TopicsSection`
- numerous search, map, modal, and banner components

### Refactor runtime

The refactor mounts `App` directly:

- `src/main.tsx` renders `<App />` without `AppProvider`
- `src/App.tsx` is a flatter grid-based composition of:
  - header
  - accessibility controls
  - stats section
  - filter bar
  - tabbed cards
  - map pane

State has been pulled toward store-driven behavior via Zustand rather than a context-wrapped shell. This is a meaningful interface change, not only a directory cleanup.

### Interface changes introduced by the refactor

The refactor changes the public and internal working model in several ways:

- original runtime uses `AppProvider` context; refactor mounts `App` directly and leans on Zustand
- original app exposes a broader shell with many wrappers and UI entrypoints; refactor collapses this into a single grid-based app surface
- original package and tooling surface is broad and mixed; refactor intentionally narrows the supported app contract

## Source-Tree Overlap

Exact TS/TSX path overlap between the two `src` trees is small and concentrated in a handful of foundational files:

- `App.tsx`
- `components/cards/ExpertCard.tsx`
- `components/cards/ProjectCard.tsx`
- `components/cards/__tests__/ExpertCard.test.tsx`
- `components/cards/__tests__/ProjectCard.test.tsx`
- `components/common/ErrorBoundary.tsx`
- `components/common/Modal.tsx`
- `hooks/useCardFlip.ts`
- `hooks/useLocalStorage.ts`
- `main.tsx`
- `store/appStore.ts`
- `test-utils/setup.ts`
- `utils/text/highlightText.ts`
- `vite-env.d.ts`

This overlap pattern matters: the refactor is not carrying forward the old tree wholesale. It preserves a few key concepts and rewrites the rest around a smaller target architecture.

## What The Refactor Already Achieved

### 1. Reduced dependency surface and script surface

The refactor package is much leaner than the original package:

- fewer runtime dependencies
- fewer dev dependencies
- dramatically fewer npm scripts
- no broad matrix of specialized testing and analysis commands

The original package includes a wide mix of infrastructure and experimentation tools such as React Query, router, card-flip library, extra UI icon libraries, coverage UI, bundle analysis, and many specialized test commands. The refactor package reduces this to a small core set centered on React, Leaflet, Zustand, Zod, Tailwind, Vite, and Vitest.

Implication:

- the refactor already reduces cognitive load and maintenance overhead
- future stabilization work has fewer layers to keep in sync

### 2. Removal of `AppProvider` in favor of direct store-driven app state

The old app bootstraps through `AppProvider`, while the refactor renders the application directly and reads state from the app store.

Implication:

- the refactor has already crossed an architectural boundary from context-heavy app shell coordination toward a simpler store-driven runtime

### 3. Flatter layout in `App.tsx`

The old `App.tsx` acts mostly as a wrapper around a lazily loaded `CitizenScienceSection`.

The refactored `App.tsx` now assembles the app directly from the main feature surfaces:

- header
- accessibility controls
- stats
- filter bar
- project or expert cards
- map section

Implication:

- the new app is easier to reason about from the entrypoint downward
- there are fewer indirection layers hiding behavior

### 4. Consolidation of fragmented card and search UI

The original project contains many specialized and overlapping card-related and search-related components, including:

- enhanced card fronts and backs
- multiple flippable card helpers
- sidebar-specific card wrappers
- multiple search and filter control components
- detail wrappers and section wrappers

The refactor compresses this into fewer core building blocks:

- `ProjectCard`
- `ExpertCard`
- `FilterBar`
- simplified layout sections

Implication:

- the refactor has already removed a significant source of fragmentation and test maintenance pain

### 5. Cleaner app-focused directory structure

The refactor tree is organized around a simpler app shape:

- `components`
- `hooks`
- `services`
- `store`
- `types`
- `utils`

The original `src` contains a more mixed and less stable structure:

- `components`
- `constants`
- `contexts`
- `data`
- `hooks`
- `img`
- `json`
- `services`
- `shared`
- `store`
- `stores`
- `styles`
- `test-utils`
- `types`
- `utils`
- `webfonts`
- imported content under `carpathian-import`

Implication:

- the refactor has already carved out a more coherent app boundary

### 6. Explicit planning documents that mark some areas as dropped or deferred

The CSV files in `carpathian/docs` are especially important because they show intentional scope decisions, not just omissions.

Examples from the current docs:

- `react-router-dom`: explicitly avoided
- `react-card-flip`: explicitly dropped and replaced by `useCardFlip`
- `@tanstack/react-query`: explicitly dropped in favor of Zustand plus custom fetch
- forms and advanced map tooling: deferred
- i18n, auth, favorites, notifications, logging service: dropped or deferred for current scope
- many layout wrappers and card subcomponents: intentionally replaced by a smaller app surface

Implication:

- some missing pieces are not unfinished migrations
- some are deliberate scope cuts made to keep the refactor maintainable

## What Has Been Redesigned, Simplified, Or Dropped

The refactor is not targeting one-to-one preservation of the original UI/component map.

### Intentionally redesigned

- app shell: from wrapper-heavy runtime to a flatter app composition
- state flow: from provider-based bootstrapping to direct Zustand usage
- card interactions: from multiple flip helpers and enhanced variants to fewer core card components
- search/filter surface: from many UI fragments to a smaller `FilterBar` plus focused hooks

### Intentionally dropped

- routing for now
- React Query for now
- external card-flip dependency
- custom logging and analytics service
- non-v1 scope items such as auth, i18n, favorites, notifications
- many banner, breadcrumb, and low-value decorative wrappers

### Intentionally deferred

- add-project modal
- volunteer modal
- advanced map drawing flows
- fullscreen and richer map controls
- some deeper accessibility polish
- deployment and CI integration work tracked in the execution table

## What Is Not Migrated Yet

The refactor still lacks major parts of the original breadth.

### 1. Modals and forms

The original contains dedicated modal components:

- `components/modals/AddProjectModal.tsx`
- `components/modals/VolunteerModal.tsx`

These are still absent as implemented feature surfaces in the refactor. The refactor docs explicitly defer this work until API stability improves.

Implication:

- the refactor cannot yet replace the original for create/volunteer-style flows

### 2. Much of the original search and filter surface

The original project has a larger search/filter ecosystem:

- `components/search/*`
- multiple filter and search control components
- specialized search utilities
- broader detail/sidebar coordination

The refactor has a smaller filter/search surface centered on `FilterBar`, `useProjectFilters`, `useExpertFilters`, `useDebounce`, and text highlighting.

Implication:

- core filtering logic exists in the refactor
- the richer original search/detail orchestration has not been fully migrated

### 3. Many layout wrappers and sidebar/search/detail components

The original contains dedicated wrappers and sections for:

- map sidebar
- search details
- scroll details
- modal sections
- topics sections
- enhanced sidebar project cards

Most of these do not exist in the refactor, either because they were intentionally collapsed or because they have not yet been replaced with equivalent functionality.

Implication:

- feature parity is partial even where architectural simplification is intentional

### 4. Most legacy utility, data, and style infrastructure

The original includes:

- a large `data` surface
- multiple utilities for search, avatars, dates, lazy loading, maps, and sanitization
- a large `styles` hierarchy with many subfolders
- additional constants and context infrastructure

The refactor retains only a focused subset and rebuilds around a smaller service/hooks/store model.

Implication:

- the refactor is cleaner, but many support capabilities are not yet rebuilt or are currently out of scope

### 5. Large asset, import, and archive surface

The original `src` and project root include imported website assets, generated artifacts, documentation sets, and archived material. The refactor does not reproduce most of this.

Implication:

- this is partly a healthy boundary cleanup
- but any still-needed runtime assets must be consciously reintroduced rather than assumed to exist

## Validation Health On May 7, 2026

Current command results were validated directly in both projects.

### `carpathian`

Command: `npm run build`

Result: failed during the TypeScript stage before Vite could complete the production build.

Observed errors included:

- unused declarations in `App.tsx`, `MapView.tsx`, tests, and utils
- implicit `any` in `MapView.tsx`
- polygon tuple type incompatibilities in `usePolygonLayer.ts` and polygon tests

Command: `npm run test:run`

Result:

- 32 test files passed
- 1 test file failed
- 125 tests passed
- 1 test failed

Current failing test:

- `src/components/layout/__tests__/FilterBar.test.tsx`

Failure summary:

- the debounce test expects the search setter not to be called yet, but it is called once with an empty string

Assessment:

- the refactor already has broad local test coverage relative to its smaller size
- but it is not yet validation-clean enough to become the default app

### Original project

Command: `npm run build`

Result: failed during CSS processing.

Observed failure:

- PostCSS and `postcss-import` attempted to process `tailwindcss/lib/index.js` as CSS from `src/index.css`
- Vite build stopped with an unknown word error

Command: `npm run test:run`

Result:

- 13 test files passed
- 2 test files skipped
- 190 tests passed
- 16 tests skipped

Warnings observed during the run included:

- stale Browserslist data
- Tailwind safelist pattern mismatch
- React `act(...)` warnings in card tests
- a real accessibility contrast failure was logged for input border contrast, even though the suite passed

Assessment:

- the original remains more operationally complete in terms of implemented features and testable flows
- but its build is currently broken, and its passing test suite should not be confused with overall architectural health

## Refactoring Strategy Assessment

### Successful simplification decisions

The refactor is strongest where it intentionally reduces complexity:

- smaller package surface
- smaller app shell
- fewer cross-cutting wrappers
- more direct state flow
- fewer overlapping UI abstractions
- explicit acceptance of deferred scope

These are good decisions for long-term maintainability.

### Partial feature parity

The refactor already covers several important core surfaces:

- app bootstrap
- basic project and expert cards
- filter bar
- stats section
- accessibility controls
- basic map surface
- mock and API service scaffolding

But the refactor does not yet cover the broader original surface around search detail flows, modals, richer map behaviors, and the larger legacy UI ecosystem.

### Regressions introduced during refactoring

The refactor currently introduces its own breakages:

- it is not build-green
- it has at least one failing test in a foundational UI path
- some map and polygon typing work is incomplete

This means the refactor is ahead on architecture intent, but not yet ahead on day-to-day runtime stability.

### Where the refactor is ahead only on intent, not yet on runtime completeness

Examples:

- map behavior: planning docs describe clustering, polygon handling, tile toggle, and card-to-map sync, but implementation and typing are still incomplete
- data/API boundary: the refactor has a cleaner direction, but the original still represents the broader behavior set
- accessibility/UI polish: the refactor has dedicated controls and a cleaner shape, but some deeper coverage remains unfinished

## Migration Status Matrix

| Subsystem | Status | Rationale |
| --- | --- | --- |
| App shell | redesigned | The refactor replaces the original provider-wrapped, section-heavy shell with a flatter single-page grid composed directly in `App.tsx`. |
| State management | redesigned | The original boots through `AppProvider`; the refactor leans on Zustand and direct store access, which is a deliberate state model shift. |
| Cards | partial | `ProjectCard` and `ExpertCard` are present in both trees, but the many enhanced variants and sidebar/detail card surfaces from the original are not fully carried over. |
| Filtering/search | partial | Core filtering hooks and a shared `FilterBar` exist in the refactor, but much of the original search UI and result orchestration has not been rebuilt. |
| Map | partial | The refactor has a map surface and related hooks, but planned capabilities such as fuller clustering, popup sync, and polygon completeness are still incomplete or unstable. |
| Accessibility | partial | The refactor includes accessibility controls and related hooks, but the original has additional test history and unresolved a11y warnings still inform future work. |
| Modals/forms | deferred | Add-project and volunteer flows exist in the original but are intentionally deferred in the refactor docs until the API boundary is more stable. |
| Data/API | partial | The refactor has `apiService`, `mockApi`, env validation, and a cleaner service direction, but it does not yet replace the broader original behavior set. |
| Styling | redesigned | The refactor narrows styling around a smaller Tailwind-based app surface, while the original carries a much larger and more mixed style/import ecosystem. |
| Tests/tooling | partial | The refactor has broad localized tests for its smaller surface, but is not yet build-green; the original has more test history but a broken build and noisy tooling warnings. |
| Documentation/hygiene | redesigned | The refactor’s docs clearly define current migration intent and scope cuts, while the original contains richer history but also more documentation drift and repository sprawl. |

## Next Steps To Make `carpathian` The Source Of Truth

1. Make `carpathian` build-green by fixing the current TypeScript blockers in `App.tsx`, `MapView.tsx`, `usePolygonLayer.ts`, polygon tests, and related utility files.
2. Fix the failing debounce test in `src/components/layout/__tests__/FilterBar.test.tsx` and confirm whether the bug is in component behavior or only in the test expectation.
3. Stabilize the map slice before expanding scope further, especially polygon typing, cluster behavior, and selected-project synchronization.
4. Decide which original features are truly required for the successor app and which should remain intentionally dropped. The docs already suggest avoiding a big-bang parity chase.
5. Rebuild only the highest-value missing flows next, likely:
   - search/detail coordination
   - modal workflows
   - missing map affordances
6. Keep using the CSV planning docs as the scope contract so the refactor does not quietly regrow original complexity.

## Final Conclusion

`carpathian` is already a meaningful refactor, not just a renamed copy. It has successfully established a smaller, clearer target architecture and has already replaced several legacy concepts with simpler equivalents.

However, it is still best described as a partial successor with an intentionally narrowed scope and a few active regressions. The project is closest to a controlled rewrite-in-place: enough core pieces have been migrated or rebuilt to validate the direction, but enough functionality and validation issues remain that it should not yet be treated as the definitive replacement for the original.

If the goal is to make `carpathian` the new source of truth, the immediate priority is not adding more breadth. The immediate priority is to make the current narrowed slice fully green, then bring back only the missing flows that still matter.
