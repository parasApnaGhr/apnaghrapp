# Frontend Changelog

## 2026-04-18

### Architecture Upgrade (Vite & TypeScript)

- Migrated build system from generic Create React App (CRA built on Webpack) and CRACO to **Vite**
- Achieved **fast-refresh** and vastly faster production builds
- Removed all legacy CRA and CRACO configurations (`craco.config.js`, `jsconfig.json`, Webpack custom plugins)
- Removed Emergent workaround scripts from `public/index.html` and `api.js` (now strictly using native XHR/fetch on custom domain)
- Converted all `.js` and `.jsx` generic React files (74 total files spanning core, context, hooks, pages, components, and SEO) into `.ts` and `.tsx`
- Added comprehensive shared TypeScript definitions in `src/types/index.ts` covering schemas for User, Property, Visit, Payment, Rider, Seller, Notification, and more
- Completely rewrote and typed the `src/utils/api.ts` file, updating all static REST endpoints
- Replaced generic wildcard `process.env.REACT_APP_*` usage with `import.meta.env.VITE_*` across the entire codebase
- Replaced the node `path` config injection with a proper Vite resolution implementation
- Added detailed environment resolution documentation in `ENV.md` and an `.env.example`
- Removed lingering Capacitor configurations and folders (`android/`, `ios/`, `capacitor.config.ts`) as per the roadmap priority handling
- Cleaned Tailwind configuration to remove unused shadcn UI keys and variables, keeping strictly the Apnaghr premium brand palette


### Cleanup

- Removed dead dashboard pages that were not routed and depended on missing API surface:
  - `src/pages/CallCenterDashboard.js`
  - `src/pages/CityManagerDashboard.js`
  - `src/pages/Leaderboard.js`
- Removed orphan frontend components with no active references:
  - `src/components/AdminLiveTracking.js`
  - `src/components/BrokerVisits.js`
  - `src/components/DutyControl.js`
  - `src/components/Earnings.js`
  - `src/components/SiteVisits.js`
  - `src/components/TaskOverview.js`
- Removed unused helper/barrel files:
  - `src/seo-pages/index.js`
  - `src/seo-pages/utils/contentCache.js`
  - `src/hooks/use-toast.js`
  - `src/lib/utils.js`
- Removed the unadopted generated UI wrapper layer under `src/components/ui/`
- Removed the unused shadcn metadata file `components.json`
- Removed temporary frontend dev log files generated during local startup checks
- Removed unused frontend dependencies tied to the deleted UI layer, form stack, dormant utilities, and stale toolchain metadata
- Standardized the frontend manifest on npm usage by removing the stale `yarn` `packageManager` declaration

### Documentation

- Added `FRONTEND_UPGRADE_AUDIT.md` with the upgrade roadmap, missing implementation areas, and cleanup guidance
- Added this `CHANGELOG.md` to track frontend cleanup and upgrade work

### Reliability

- Added `src/components/ErrorBoundary.jsx`
- Wrapped the app shell in an error boundary from `src/App.js` so an unexpected render failure falls back to a controlled recovery screen

### Verification

- Regenerated `package-lock.json` after dependency pruning
- Verified `npm.cmd run build` completes successfully after the cleanup
- Verified a final `npm.cmd run build` after the hook-stability pass and the frontend now compiles without ESLint hook warnings

### Hook Stability

- Stabilized effect-driven loaders across payments, property detail pages, customer home, seller dashboard, and builder dashboard with `useCallback` where effects were depending on recreated functions
- Reworked manual property search flows to read filters from refs so searches still run only when explicitly triggered by the user
- Removed smaller hook dependency warnings in voice search and manual visit creation without changing the visible user flow
