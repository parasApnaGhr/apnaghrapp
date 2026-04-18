# Frontend Upgrade Audit

## Scope

This audit is based on the current frontend in `frontend/`:

- Build stack: `Create React App + CRACO`
- UI stack: React 19, React Router 7, Tailwind, Framer Motion, Radix/shadcn-style UI files
- Mobile wrapper: Capacitor (`android/`, `ios/`)
- Current state: app starts, but the stack has clear technical debt, unused files, and partially abandoned modules

## Executive Summary

The frontend is functional, but it is carrying three different kinds of debt:

1. Platform debt:
   The app is still on CRA/CRACO while using a newer React-era dependency set. This already required `npm install --legacy-peer-deps`, which is a sign the toolchain is no longer a clean fit.

2. Product debt:
   The app contains many role dashboards and admin panels, but several flows are only partially implemented, rely on hardcoded UI state, or appear abandoned.

3. Repo debt:
   There are multiple orphan pages, orphan components, generated UI helpers that are not used, and utility barrels that are not connected to the app.

The right approach is not “random cleanup.” The right approach is:

- stabilize the current app first,
- remove dead files next,
- then migrate the build system,
- then modularize by role/dashboard.

## What You Have To Do

### Phase 1: Stabilize the current frontend

Do these before any large refactor:

- Standardize the package manager. The repo declares `yarn` in `package.json` but currently uses `package-lock.json` and was started with `npm`. Pick one package manager and delete the other lockfile.
- Fix the React hooks warnings shown during compile. There are many `react-hooks/exhaustive-deps` warnings across admin, seller, rider, and customer modules. These are not cosmetic; they often hide stale data bugs and double-fetch bugs.
- Clean up text encoding issues. Several files display corrupted characters like `â€¢` and `â‚¹` in terminal output, which usually means mixed file encoding or copied content with inconsistent encoding.
- Add a frontend environment contract. Right now API behavior depends on `REACT_APP_BACKEND_URL`, hostname checks, and Emergent-specific runtime patches in [src/utils/api.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/utils/api.js:1) and [public/index.html](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/public/index.html:1). That needs a documented rule set.
- Add smoke tests for routing, auth bootstrap, and payment redirection. There are currently no frontend `*.test.*` or `*.spec.*` files in `src/`.
- Add an error boundary for the app shell. There is no visible `ErrorBoundary` implementation in `src/`.

### Phase 2: Clean the repo before deeper work

Do this after Phase 1 and before migration:

- Remove high-confidence dead pages and components listed in the “Waste Files” section.
- Remove unused UI-kit files that were generated but never adopted.
- Remove broken dormant pages that import missing APIs instead of keeping them around as misleading “future” code.
- Decide whether Capacitor mobile builds are still part of the roadmap. If not, remove `android/`, `ios/`, `capacitor.config.ts`, and Capacitor dependencies together in one cleanup. Yes, after the entire migration from CRACO to Vite, we will generate for android and ios, for that we will need Capacitor. But for now, you remove it, after finishing the frontend, then only we will create files for android and ios.

### Phase 3: Upgrade the build system

Recommended target:

- Migrate from CRA/CRACO to Vite

Why:

- CRA is legacy infrastructure at this point.
- CRACO is being used to patch around CRA limitations.
- The current dependency graph already needs legacy peer-dependency behavior.
- Dev startup and production build performance will improve.

- Migrate the entire frontend codebase from JavaScript to TypeScript during the Vite migration. Avoid partial adoption—ensure all components, hooks, API layers, and utilities are typed to establish a consistent, scalable, and maintainable codebase.
Migration steps:

1. Create a Vite branch and migrate entrypoints:
   - `src/index.js` -> Vite `main.jsx` or `main.js`
   - preserve the React root setup
2. Move HTML shell logic from [public/index.html](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/public/index.html:1) into Vite’s `index.html`
3. Recreate aliases from [craco.config.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/craco.config.js:1)
4. Recreate the dev proxy for `/api`
5. Re-test the Cashfree script, Leaflet CSS, and SEO routes
6. Drop CRACO and CRA packages after the Vite build is stable

### Phase 4: Modularize by domain

The current `src/` is flat and large. Reorganize by feature/domain:

- `features/auth`
- `features/customer`
- `features/rider`
- `features/seller`
- `features/admin`
- `features/seo`
- `shared/ui`
- `shared/api`
- `shared/hooks`

This is important because the current dashboard pages are too large and mix layout, state management, API calls, and domain logic in single files.

### Phase 5: Establish product-quality guardrails

Add the following:

- route-level code splitting
- role-based route config instead of a single expanding [src/App.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/App.js:1)
- React Query or equivalent data layer for caching and request state
- centralized form validation patterns
- shared loading/empty/error states
- role-specific layout shells
- bundle analysis
- lint + test + build CI

## What Is Left To Implement

This section is not “missing because code does not exist.” It means the repo suggests incomplete frontend product work or frontend architecture work still left to finish.

### 1. Replace hardcoded dashboard summaries with real data

[src/pages/AdminDashboard.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/pages/AdminDashboard.js:1) still shows hardcoded overview stats such as:

- total properties
- active riders
- visits today
- revenue today

That is presentation, not a real dashboard. This needs a backend-backed dashboard summary API and proper loading/error handling.

### 2. Rebuild dormant dashboard work or delete it

These pages look like abandoned or incomplete feature branches:

- [src/pages/CityManagerDashboard.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/pages/CityManagerDashboard.js:1)
- [src/pages/Leaderboard.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/pages/Leaderboard.js:1)
- [src/pages/CallCenterDashboard.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/pages/CallCenterDashboard.js:1)

Problem:

- `CityManagerDashboard` and `Leaderboard` import `dashboardAPI` from `src/utils/api.js`
- `dashboardAPI` does not exist in `src/utils/api.js`
- these pages are not routed in `App.js`

So these are not “future-ready.” They are dead code with broken dependencies.

### 3. Formalize auth/session rules

Current auth is simple and works, but it is thin:

- token in `localStorage`
- user bootstrap on app mount in [src/context/AuthContext.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/context/AuthContext.js:1)
- route redirects embedded in [src/App.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/App.js:1)

Still left to implement:

- token expiry handling beyond `401`
- refresh-token strategy if the backend supports it
- route-level permission config instead of manual conditions in JSX
- better role fallback behavior when server-side role changes

### 4. Replace ad hoc API state with a real data layer

At present, components directly call axios helpers and manage request state locally everywhere. That increases duplication and race conditions.

Still left to implement:

- request caching
- stale/refresh behavior
- retry policy per query type
- invalidation after mutations
- shared optimistic update patterns

### 5. Finish frontend quality infrastructure

Still missing:

- automated unit/integration tests
- app-level error boundary
- route-level lazy loading
- standard analytics event map
- bundle budget / bundle regression checks

### 6. Decide whether SEO pages are a permanent product area

The SEO section is substantial and active, but it is split from the main app and mostly static-content oriented.

If SEO landing pages are strategic, keep and strengthen them:

- validate content freshness
- validate sitemap behavior
- consolidate data sources

If not, shrink them aggressively.

### 7. Decide whether the custom admin tooling is product or ops-only

Examples:

- image migration
- bulk image upload
- explainer video management
- seasonal theme configuration

These are legitimate tools only if the backend and operations team actually use them. Otherwise they should be moved out of the main customer-facing frontend and into a separate internal admin app or removed.

## Waste Files In The Repo

This is split into high-confidence removal candidates and conditional removal candidates.

### High-confidence waste files

These appear unused, unrouted, or disconnected from the active app.

#### Unrouted / broken pages

- [src/pages/CallCenterDashboard.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/pages/CallCenterDashboard.js:1)
  Not routed in `App.js`; no active references found.
- [src/pages/CityManagerDashboard.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/pages/CityManagerDashboard.js:1)
  Not routed; imports missing `dashboardAPI`.
- [src/pages/Leaderboard.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/pages/Leaderboard.js:1)
  Not routed; imports missing `dashboardAPI`.

#### Orphan components

- [src/components/AdminLiveTracking.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/components/AdminLiveTracking.js:1)
  Not used; `AdminDashboard` uses `LiveTrackingPanel` instead.
- [src/components/BrokerVisits.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/components/BrokerVisits.js:1)
  No active references found.
- [src/components/DutyControl.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/components/DutyControl.js:1)
  No active references found.
- [src/components/Earnings.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/components/Earnings.js:1)
  No active references found.
- [src/components/SiteVisits.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/components/SiteVisits.js:1)
  No active references found.
- [src/components/TaskOverview.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/components/TaskOverview.js:1)
  No active references found.

#### Orphan barrels / helper modules

- [src/seo-pages/index.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/seo-pages/index.js:1)
  Barrel file not used by the app.
- [src/seo-pages/utils/contentCache.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/seo-pages/utils/contentCache.js:1)
  Only re-exported by the unused SEO barrel.
- [src/hooks/use-toast.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/hooks/use-toast.js:1)
  Only referenced by unused `ui/toaster`.
- [src/components/ui/toaster.jsx](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/components/ui/toaster.jsx:1)
  Not used by the app shell.
- [src/components/ui/toast.jsx](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/components/ui/toast.jsx:1)
  Only used by unused `ui/toaster`.
- [src/components/ui/sonner.jsx](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/components/ui/sonner.jsx:1)
  Not used; app imports `Toaster` directly from `sonner`.

### Conditional waste files

These are removable only if you confirm the related product area is no longer needed.

#### Generated shadcn/Radix UI files not currently adopted

There is a large generated UI directory under `src/components/ui/`. Based on repo usage, many of these are not imported by active app code and appear to be generated scaffolding rather than integrated components.

Likely candidates include:

- `accordion.jsx`
- `alert.jsx`
- `alert-dialog.jsx`
- `aspect-ratio.jsx`
- `avatar.jsx`
- `badge.jsx`
- `breadcrumb.jsx`
- `button.jsx`
- `calendar.jsx`
- `card.jsx`
- `carousel.jsx`
- `checkbox.jsx`
- `collapsible.jsx`
- `command.jsx`
- `context-menu.jsx`
- `dialog.jsx`
- `drawer.jsx`
- `dropdown-menu.jsx`
- `form.jsx`
- `hover-card.jsx`
- `input.jsx`
- `input-otp.jsx`
- `label.jsx`
- `menubar.jsx`
- `navigation-menu.jsx`
- `pagination.jsx`
- `popover.jsx`
- `progress.jsx`
- `radio-group.jsx`
- `resizable.jsx`
- `scroll-area.jsx`
- `select.jsx`
- `separator.jsx`
- `sheet.jsx`
- `skeleton.jsx`
- `slider.jsx`
- `switch.jsx`
- `table.jsx`
- `tabs.jsx`
- `textarea.jsx`
- `toggle.jsx`
- `toggle-group.jsx`
- `tooltip.jsx`

Important:

- do not delete the whole UI directory blindly
- first confirm import usage file-by-file
- remove the dependent packages only after deleting the unused UI wrappers

#### Capacitor mobile folders

Keep these only if Android/iOS app packaging is still required:

- [android](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/android:1)
- [ios](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/ios:1)
- [capacitor.config.ts](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/capacitor.config.ts:1)

If mobile packaging is abandoned, these are removable together with Capacitor dependencies.

#### Google verification file

- [public/googled9862d7a6380eeaa.html](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/public/googled9862d7a6380eeaa.html:1)

Keep it only if that Search Console verification is still active and needed.

#### Emergent-specific shell code and badge

[public/index.html](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/public/index.html:1) contains:

- Emergent request-router workarounds
- service worker unregister logic
- “Made with Emergent” badge
- PostHog embed

This is not automatically waste, but it should be reviewed. If you are no longer dependent on Emergent hosting/runtime behavior, simplify this file.
Remove data of emergent.

## Package Cleanup Candidates

### High-confidence package cleanup candidates

- `cra-template`
  This should not be a runtime dependency for an existing app.

### Likely cleanup candidates after file cleanup

- `next-themes`
  Only seen in unused `src/components/ui/sonner.jsx`.
- `cmdk`
  Only seen in UI wrapper code.
- `vaul`
  Only seen in UI wrapper code.
- `react-resizable-panels`
  Only seen in UI wrapper code.
- `react-day-picker`
  Only seen in UI wrapper code.
- `typescript`
  Present as a dev dependency, but this app is not using a TypeScript source tree.
- `@eslint/js`
  Looks unused in the current CRA/CRACO setup.
- `globals`
  Looks unused in the current CRA/CRACO setup.

### Conditional package cleanup candidates

- Capacitor packages:
  `@capacitor/android`, `@capacitor/cli`, `@capacitor/core`, `@capacitor/ios`, `@capacitor/keyboard`, `@capacitor/splash-screen`, `@capacitor/status-bar`

Remove these only if you are dropping mobile app packaging.

## Key Technical Problems Found

### 1. Outdated build stack with forced compatibility mode

- CRA/CRACO is carrying the app
- dependency install required `--legacy-peer-deps`
- this is not a stable long-term foundation

### 2. Broken dormant code exists in the repo

- `CityManagerDashboard` and `Leaderboard` depend on missing `dashboardAPI`
- dead files like this make the repo look more complete than it is

### 3. Too much logic in large page files

Large files include:

- [src/pages/RiderDashboard.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/pages/RiderDashboard.js:1)
- [src/pages/SellerDashboard.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/pages/SellerDashboard.js:1)
- [src/pages/AdminDashboard.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/pages/AdminDashboard.js:1)
- [src/pages/BuilderDashboard.js](/abs/path/c:/Users/shaur/Documents/apnaghrapp/frontend/src/pages/BuilderDashboard.js:1)

These should be split into:

- route shell
- feature panels
- hooks
- request hooks / data access
- presentational components

### 4. API behavior is environment-patched in multiple layers

The frontend has special handling for:

- custom domains
- localhost
- Emergent routing behavior
- service workers
- runtime XHR replacement

This works, but it is fragile and should be reduced to a simpler environment strategy.

### 5. Frontend quality baseline is missing

- no frontend tests
- no error boundary
- many compile-time hook warnings
- no visible route splitting

## Recommended Order Of Work

1. Fix compile warnings and environment config clarity.
2. Delete the high-confidence waste files.
3. Remove dead dependencies tied to deleted files.
4. Decide on Capacitor: keep or fully remove.
5. Migrate CRA/CRACO to Vite.
6. Split large dashboards into feature modules.
7. Add tests, error boundaries, and CI checks.

## Definition Of Done For The Upgrade

The frontend upgrade should be considered complete only when all of the following are true:

- app runs without `--legacy-peer-deps`
- CRA/CRACO is removed
- unused files listed above are deleted
- broken dormant pages are either rebuilt or removed
- hook warnings are fixed
- one package manager is standardized
- auth and API environment rules are documented
- tests exist for core routes and auth bootstrap
- admin, rider, seller, and customer code is split into maintainable feature modules

- Migrate the entire frontend codebase from JavaScript to TypeScript during the Vite migration. Avoid partial adoption—ensure all components, hooks, API layers, and utilities are typed to establish a consistent, scalable, and maintainable codebase.