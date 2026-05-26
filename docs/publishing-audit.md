# Publishing Audit

This repository has two publishing targets:

- **Source repository on GitHub:** the application source, tests, scripts, documentation, Supabase schema/migrations, and required public static assets.
- **GitHub Pages static example:** the generated `dist/` folder from `npm run build:static`.

Do not publish the working tree as-is to GitHub Pages. Publish only `dist/` for the live example.

## Publish To GitHub Pages

Run:

```bash
npm run build:static
```

Publish the generated `dist/` folder. It should include:

- `index.html` — standalone Vite app entry.
- `citizen-science-page.html` — static WordPress-shell example wrapping `index.html` in an iframe.
- `assets/` — bundled JS, CSS, fonts, and lazy chunks.
- `profile-pictures/` — local demo profile portraits used by the mock dataset.
- `wp-snapshot/` — static WordPress theme/plugin assets required by `citizen-science-page.html`.
- `.nojekyll` — prevents GitHub Pages from treating folders with underscores specially.

The static build is database-free: it uses `mockApi`, does not need `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`, and keeps form writes local/demo-only.

## Keep In The Source Repository

These are appropriate to publish in the GitHub source repo:

- `src/`, `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `tailwind.config.ts`.
- `.github/workflows/ci.yml`.
- `scripts/`, including build, WordPress-shell, smoke-test, and data helper scripts.
- `supabase/`, including local config, migrations, schema drafts, and seed SQL.
- `public/profile-pictures/`, because the mock/demo dataset depends on these assets.
- `public/wp-snapshot/`, because the static WordPress-shell example depends on these assets.
- `citizen-science-page.html`, because it is the source shell copied and rewritten into `dist/`.
- Project docs such as `README.md`, `DEPLOYMENT.md`, `DECISIONS.md`, `IMPLEMENTATION_PLAN.md`, and `docs/`.

The `.agents/` skill files are optional. Keep them if future agent work in this repo should auto-load local Supabase guidance. They are not needed for the running website or GitHub Pages artifact.

## Do Not Publish

These should not be committed or published:

- `.env`, `.env.local`, `.env.*.local` — can contain Supabase URLs, anon keys, service-role keys, SerpAPI keys, or local-only configuration.
- `node_modules/` — dependency install output.
- `dist/` in the source repo, unless using a dedicated Pages branch or a separate publishing workflow.
- `coverage/` — generated test coverage HTML and JSON.
- `reports/` output other than `reports/.gitkeep`.
- `.playwright-mcp/` and browser automation state.
- `.DS_Store` files.
- `tsconfig.tsbuildinfo`.
- `*.bak` files.
- Generated audit screenshots such as `audit-final.png` and `audit-fullpage.png`, unless a specific report links to them.

## Already Tracked Cleanup Candidates

Some generated/local files are currently tracked. They can be removed from Git tracking without deleting the local copies by using:

```bash
git rm --cached .DS_Store docs/.DS_Store docs/carpathian-card-shematics/.DS_Store
git rm -r --cached coverage
git rm --cached tsconfig.tsbuildinfo vitest.config.js.bak
git rm --cached audit-final.png audit-fullpage.png
```

After confirming the files are not needed in docs or releases, commit the cleanup with the updated `.gitignore`.

`vite.config.d.ts` and `vitest.config.d.ts` look generated or editor-derived. They are small, but if no workflow imports them, they can also be removed from Git tracking:

```bash
git rm --cached vite.config.d.ts vitest.config.d.ts
```

## Can Be Deleted Locally

The following can be deleted locally at any time because they are reproducible:

- `node_modules/` — recreate with `npm install`.
- `dist/` — recreate with `npm run build` or `npm run build:static`.
- `coverage/` — recreate with coverage test runs.
- `reports/` generated contents — recreate with audit scripts.
- `.playwright-mcp/` — recreate when browser tooling runs.
- `tsconfig.tsbuildinfo`.
- `.DS_Store`.

Keep `public/wp-snapshot/` and `public/profile-pictures/` unless you intentionally remove the WordPress-shell example or change the mock portrait contract.

## Pre-Publish Checklist

Before pushing publicly:

1. Run `npm run typecheck`.
2. Run `npm run test:run`.
3. Run `npm run build:static`.
4. Confirm `dist/index.html` and `dist/citizen-science-page.html` load through `npm run preview`.
5. Check that no secrets are staged:

```bash
git diff --cached -- . ':!.env*'
git status --short
```

6. If publishing the static site, upload only `dist/` or configure GitHub Pages to deploy that folder from the chosen branch/workflow.
