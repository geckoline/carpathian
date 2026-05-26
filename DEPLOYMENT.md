# Deployment Guide

## Environment Setup
1. Create `.env.local` in project root:
```bash
VITE_API_BASE_URL=https://your-api.com
```
2. Validate env on boot: `src/utils/envValidation.ts` warns if required vars are missing.

## Vercel (Recommended)
1. Connect GitHub repo → New Project
2. Environment Variables: Add `VITE_API_BASE_URL` (if applicable)
3. Build Settings:
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy: Push to `main` triggers auto-build. Preview URLs generated per PR.

## Netlify
1. "New site from Git" → connect repo
2. Build Settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Env Vars: Set `VITE_API_BASE_URL` under Site settings
4. Deploy: Auto-triggers on push. Branch deploys enabled by default.

## Local Production Preview
```bash
npm run build
npm run preview
```

## GitHub Pages Static Example

Use the static build when publishing a database-free example from `dist/`:

```bash
npm run build:static
npm run preview
```

This build uses the bundled mock dataset instead of Supabase, keeps project/expert additions local to the browser session, and rewrites the WordPress snapshot wrapper so `citizen-science-page.html`, `index.html`, `assets/`, `profile-pictures/`, and `wp-snapshot/` can be served from a GitHub project page such as `https://USER.github.io/REPO/`.

See [Publishing Audit](docs/publishing-audit.md) for what should be committed to the source repository, what should be published to GitHub Pages, and which generated/local files can be deleted or untracked.

## WordPress Embed (iframe)

The app runs standalone. WordPress embeds it via `<iframe>` on the target page.

### Paste this into the WordPress page (Text/HTML editor):

```html
<iframe
  src="https://citizenscience.carpathian.org/app"
  style="width: 100%; height: 100vh; border: none;"
  title="Carpathian Citizen Science App"
  loading="lazy"
></iframe>
```

Replace `src` with the actual deployed app URL after build & deploy.

### Notes
- `height: 100vh` — fills the viewport. Adjust to a fixed height (`800px`) if the WP theme crops the iframe.
- If the WP page has a sidebar or constrained content width, wrap the iframe in a full-width container or use `min-height: 600px` instead.
- Communication between WP and the app can be added via `postMessage` if needed (not implemented).

### 🔍 `src/utils/envValidation.ts` (M2W4 Gap Close)
```ts
// src/utils/envValidation.ts
/**
 * Validates critical environment variables at startup.
 * Prevents silent failures when API keys or base URLs are missing in prod.
 */
export const validateEnv = (): boolean => {
  const requiredVars: string[] = []; // Add mandatory keys here (e.g., 'VITE_API_BASE_URL')
  const missing = requiredVars.filter(v => !import.meta.env[v]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
};
```
