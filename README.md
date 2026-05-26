# Carpathian Citizen Science Platform

This React/Vite web application is designed for presenting and exploring citizen science work connected to the Carpathian Convention and the wider Carpathian community.

The platform is designed for use on  [carpathianconvention.org]. It provides an interactive map, searchable project and expert cards, dataset filters, export tools, and contribution-oriented forms for a Carpathian citizen science catalogue.

## Project Goals

- Present citizen science projects in the Carpathian region in a clear, map-first interface.
- Connect projects with experts, institutions, countries, research categories, and contact paths.
- Support both a focused **Citizen Science** dataset and a broader **All Carpathian** research/network view.
- Currently providing sample data for static demos and public GitHub Pages examples.
- For current demonstaration state, the app is deployed inside a WordPress iframe to illustrate a implementation path for the Carpathian Convention website. (See the `citizen-science-page.html` shell and related tooling.)
- Standalone state or as a database-backed Supabase deployment are for closer inspection.
- **with an elsevier api (free for instututions) the profiles can be kept up to date **

## Main Features

- Interactive Leaflet map with project markers/polygons and sidebar navigation.
- Project and expert card views with responsive layouts and virtualized rendering for larger datasets.
- Mail and Social buttons for easy contact.
- Copy buttons enable seasy sharing of project/expert details and contact info.
- Search and filters by status, research/category field, and country.
- Statistics section for active/planned/past project counts and expert coverage.
- CSV and JSON export for the active project or expert list.
- Add-project, add-expert, and volunteer-alert modal flows.
- Expert enrichment workflow using Google Scholar and ORCID URLs where available. **this allows users to fetch (imprt) data directly from existing profiles**
- Local profile-picture support for seeded/mock experts.
- Accessibility controls for font size, contrast, and reduced motion.
- Static GitHub Pages build that uses bundled mock data and avoids database connections.

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite 8.
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite`, CSS-first setup.
- **State:** Zustand store with Immer middleware.
- **Map:** Leaflet, React Leaflet, marker clustering, lazy-loaded map bundle.
- **Forms and validation:** React Hook Form, Zod, service-boundary schemas.
- **Search:** Fuse.js and local filter utilities.
- **Backend option:** Supabase database views and inserts.
- **Testing:** Vitest, Testing Library, jest-dom, jsdom, vitest-axe.
- **Build verification:** TypeScript checks, Vitest, Vite build, smoke/performance scripts.

## Application Modes

### Static Demo Mode

Use this for GitHub Pages and public examples that must not rely on a database:

```bash
npm run build:static
```

This mode:

- Loads bundled mock data from `src/services/mockApi.ts`.
- Uses a static API stub instead of Supabase.
- Keeps project/expert additions local to the browser session.
- Keeps volunteer subscriptions demo-only.
- Rewrites the WordPress-shell HTML for GitHub project-page paths.

Publish only the generated `dist/` folder for GitHub Pages.

### Supabase Mode

Use this when the app should load real project and expert data from Supabase:

```bash
npm run build
```

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present, the app queries the `app_projects` and `app_experts` views. If those environment variables are missing, data loading falls back to the mock dataset.

### Local Development Mode

Use Vite directly:

```bash
npm run dev
```

Or use the full local dev startup flow:

```bash
npm run start
```

`npm run start` is intended for the local Docker/Supabase/Vite workflow described in the agent instructions.

## Quick Start

```bash
npm install
npm run dev
```

Then open the Vite URL printed in the terminal.

Useful commands:

```bash
npm run typecheck
npm run test:run
npm run build
npm run build:static
npm run preview
```

## Environment Variables

Create local environment files only for your machine or deployment provider. Do not commit them.

Supabase:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Google Scholar / SerpAPI helpers:

```bash
VITE_SERPAPI_KEY=your-serpapi-key
```

Optional:

```bash
VITE_API_BASE_URL=https://your-api.example
```

## Data Model

The app works with two primary records:

- **Projects:** name, status, category, description, location/geometry, countries, years, linked experts, contact and summary fields.
- **Experts:** name, institution, countries, degree/headline, bio, expertise categories, publications/projects counts, email, ORCID, LinkedIn, Scopus, Google Scholar, profile image, and import metadata.

Runtime validation uses Zod schemas in:

- `src/types/project.ts`
- `src/types/expert.ts`
- `src/types/volunteer.ts`

Data loading runs through:

- `src/services/loadAppData.ts`
- `src/services/apiService.ts`
- `src/services/mockApi.ts`
- `src/services/staticApiService.ts`

## Supabase

Local Supabase files live in `supabase/`:

- `supabase/config.toml`
- `supabase/migrations/`
- `supabase/schema-v3-draft.sql`
- `supabase/seed-v3-adjusted-data.sql`

Important app-facing views:

- `app_projects`
- `app_experts`

The app grants/selects are designed around public read access for these views and restricted insert paths for contribution workflows. Review RLS policies and grants before using a production database.

## Google Scholar and Expert Enrichment

As of May 9, 2026, the app uses `Tier 2: Scholar + manual enrichment` as the target expert-profile workflow.

- Google Scholar is treated as the primary import source for academic profile scaffolding.
- Scholar-derived data can prefill fields such as name, affiliation, profile image when available, research interests, and publication/citation-oriented metrics.
- ORCID can provide additional structured identity/profile data.
- Manual enrichment remains required for fields Scholar does not reliably expose, such as country, degree, bio, email, ORCID, LinkedIn, Scopus, and other curated profile actions.
- Expert cards are expected to degrade gracefully when only a partial profile exists.
- Local portraits are served from `public/profile-pictures/{expert.id}.jpg` for the current seeded/demo dataset.

This decision is reflected in the expert-card and import-modal flows: partial academic profiles should still produce usable cards, then improve as manual fields are added.

## WordPress Shell

The app can be embedded in a WordPress-like static shell:

- Source shell: `citizen-science-page.html`
- Static WordPress assets: `public/wp-snapshot/`
- Generated Pages shell: `dist/citizen-science-page.html`

The shell wraps `index.html` in an iframe and preserves enough of the Carpathian Convention page context for visual demos.

To rebuild the static shell for GitHub Pages:

```bash
npm run build:static
```

The helper script `scripts/prepare-github-pages-static.mjs` rewrites root-relative WordPress asset paths to project-page-safe relative paths.

## Publishing

For a database-free GitHub Pages example:

```bash
npm run build:static
npm run preview
```

Publish the generated `dist/` folder, not the full repository working tree.

The Pages artifact should include:

- `dist/index.html`
- `dist/citizen-science-page.html`
- `dist/assets/`
- `dist/profile-pictures/`
- `dist/wp-snapshot/`
- `dist/.nojekyll`

For full publish hygiene, see [docs/publishing-audit.md](docs/publishing-audit.md).

## Testing and Quality Checks

Common checks:

```bash
npm run typecheck
npm run test:run
npm run build
```

Focused data tests:

```bash
npm run test:data
```

Static publishing check:

```bash
npm run build:static
npm run preview
```

Bundle/performance helpers:

```bash
npm run build:analyze
npm run smoke:test
npm run perf:check
```

CI currently follows this order:

1. Typecheck.
2. Vitest with coverage.
3. Production build.

## Repository Layout

```text
src/
  components/       React UI components, cards, map, modals, layout, common UI
  hooks/            App hooks for data loading, filters, URL sync, submissions
  services/         Supabase API, mock API, static API, Scholar/ORCID helpers
  store/            Zustand app store
  styles/           Shared card and accessibility CSS
  test-utils/       Vitest and component-test helpers
  types/            Zod schemas and TypeScript data contracts
  utils/            Filtering, categories, geometry, export, sharing helpers

supabase/           Local Supabase config, schema, migrations, seed data
public/             Static runtime assets copied into Vite builds
scripts/            Build, shell preparation, scholar import, smoke/perf helpers
docs/               Architecture, publishing, accessibility, design notes
reference/          Source WordPress reference material used by shell tooling
```

## What Not To Commit

Do not commit:

- `.env`, `.env.local`, or any file containing API keys/secrets.
- `node_modules/`.
- Generated `dist/` output in the source branch unless intentionally using a Pages branch/workflow.
- `coverage/`.
- generated reports, local browser state, `.DS_Store`, `*.tsbuildinfo`, and `*.bak` files.

See [docs/publishing-audit.md](docs/publishing-audit.md) for tracked cleanup candidates and deletion guidance.

## Current Status

This project is an active prototype/application for Carpathian citizen science data presentation. It supports:

- Mock/static public examples.
- Supabase-backed data loading.
- A WordPress-shell presentation path.
- Local contribution flows that can be connected to production policies and moderation.

Before public release, validate:

- Official project naming and description.
- Carpathian Convention wording and URLs.
- Public data fields, contact details, and profile images.
- Supabase RLS policies and write permissions.
- Whether `.agents/`, historical docs, and development audit files should remain in the public source repo.

