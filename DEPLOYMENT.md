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
