# GitHub Pages Deployment Guide

## Overview

This repository is configured to automatically deploy to GitHub Pages whenever you push to the `main` branch. The site is built as a static SPA with bundled mock data and is available at: **https://geckoline.github.io/carpathian/**

## Prerequisites

- The `vite.config.ts` has been updated to set the correct base URL (`/carpathian/`) when `GITHUB_PAGES=true`
- A GitHub Actions workflow (`.github/workflows/deploy.yml`) handles automatic builds and deployments

## Setup (One-time)

1. **Go to Repository Settings**
   - Visit: https://github.com/geckoline/carpathian/settings/pages

2. **Configure GitHub Pages**
   - Under "Build and deployment" section:
     - **Source**: Select "GitHub Actions"
     - This tells GitHub to use the workflow defined in `.github/workflows/deploy.yml`

3. **That's it!** The workflow is now active.

## How It Works

Every time you push to `main`:

1. GitHub Actions triggers the `deploy.yml` workflow
2. The workflow runs:
   - `npm ci` (clean install dependencies)
   - `npm run build:static` with `GITHUB_PAGES=true` environment variable
   - Uploads the `dist/` folder to GitHub Pages

The site will be live at: https://geckoline.github.io/carpathian/

## Local Testing

To test the static build locally before pushing:

```bash
GITHUB_PAGES=true npm run build:static
cd dist
# Serve with any local server, e.g.:
npx http-server
```

Then visit `http://localhost:8080/carpathian/` to simulate the GitHub Pages deployment.

## Troubleshooting

### Module Loading Errors (MIME Type)
If you see errors like `Blocked loading module from "..." (MIME type: "text/html")`:
- This means the base URL is wrong
- Check that `GITHUB_PAGES=true` was set during build
- Verify `vite.config.ts` has the correct `/carpathian/` base path

### Workflow Not Running
1. Check `.github/workflows/deploy.yml` exists
2. Go to **Actions** tab in your repository
3. Verify "Deploy to GitHub Pages" workflow is enabled
4. Check workflow logs for errors

### Pages Site Not Updating
1. Wait 1-2 minutes (GitHub Pages deployment takes time)
2. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Check the **Deployments** tab to see deployment status

## Environment Variables

- `GITHUB_PAGES=true` – Enables GitHub Pages mode in Vite (sets base URL to `/carpathian/`)
- No other environment variables are required for the static build

## Customization

### Change Deployment Branch
Edit `.github/workflows/deploy.yml` and change:
```yaml
on:
  push:
    branches:
      - main  # Change this to another branch if desired
```

### Disable Auto-Deploy
Disable the workflow in the **Actions** tab of your repository.

### Custom Domain
If you want a custom domain:
1. In GitHub Pages settings, add your custom domain
2. Update DNS records for your domain to point to GitHub Pages
3. GitHub will auto-generate a CNAME file

## Support

For issues or questions, refer to:
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
