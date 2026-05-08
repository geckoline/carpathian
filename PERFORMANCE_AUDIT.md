# Performance & Accessibility Audit (M4W3)

## Baseline Targets
| Metric | Target | Tool |
|--------|--------|------|
| Lighthouse Performance | ≥90 | `lighthouse:audit` |
| Lighthouse Accessibility | ≥95 | `lighthouse:audit` |
| Initial JS Bundle | ≤150KB (gzip) | `build:analyze` |
| First Contentful Paint | <1.5s | Lighthouse |
| Time to Interactive | <2.5s | Lighthouse |

## Verification Steps
1. `npm run build`
2. `npm run preview` (starts server on `:4173`)
3. `npm run smoke:test` → validates routes & bundle cap
4. `npm run lighthouse:audit` → opens interactive report
5. `npm run test:run src/__tests__/bundleSanity.test.ts` → TDD chunk checks

## Optimizations Applied
- ✅ `react-leaflet` lazy-loaded via `React.lazy` + `Suspense`
- ✅ Zustand slices selectively subscribed (`useAppStore(s => s.filters)`)
- ✅ Tailwind v4 purge enabled by default (zero unused CSS)
- ✅ Map markers use `chunkedLoading` + `MarkerClusterGroup`
- ✅ `prefers-reduced-motion` respected across all animations

## Known Trade-offs
- Puppeteer required for CI Lighthouse (adds ~200MB to dev deps, optional)
- Mock API delay (300ms) kept in dev for realistic UX simulation
- No SSR/SSG (single-page app mounted to WordPress shell)
