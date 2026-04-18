# ApnaGhr Project Summary

## Project Idea

ApnaGhr is a multi-role property operations platform focused on rental discovery and the offline work needed to close real-estate transactions. Instead of stopping at listing properties, it manages the entire chain around them: customer discovery, seller referrals, visit scheduling, rider execution, location tracking, internal team performance, payments, and admin oversight.

In practical terms, the product behaves like a hybrid of:

- a rental/property marketplace,
- a field-ops platform for site visits,
- a CRM for sellers/calling agents,
- an internal admin console for operations teams,
- and a mobile-ready companion app for riders and internal staff.

## Core Business Flow

1. Properties are listed and managed in the system.
2. Customers or shared-link visitors browse property details.
3. Customers book site visits or related services.
4. Riders are assigned, tracked, and guided through visit completion.
5. Sellers/calling agents can share properties and track referral outcomes.
6. Admin users monitor performance, payouts, operational health, and role-specific workflows.

## Main User Roles

- Customer: browse properties, book visits, track riders, manage profile/payments/support.
- Rider: accept visits, update live location, complete tasks, upload proof, track earnings/workflow.
- Seller: share properties, create referrals, verify client status, see commissions and performance.
- Admin: manage users, visits, sellers, riders, inventory access, payouts, tracking, and settings.
- Inventory staff: operate under restricted inventory mode for property addition and session tracking.
- Builder: use dedicated builder flows and dashboards.
- Advertiser: create ads and use paid promotional features.

## Main Technical Components

### Frontend

The frontend lives in [frontend](/C:/Users/shaur/Documents/apnaghrapp/frontend) and is a React application with:

- route-based dashboards for each role,
- reusable UI components,
- SEO landing pages and blog pages,
- payment initiation flows,
- tracking and map-related UI,
- mobile packaging support through Capacitor for Android and iOS.

### Backend

The backend lives in [backend](/C:/Users/shaur/Documents/apnaghrapp/backend) and is a FastAPI application backed by MongoDB. It includes:

- authentication and JWT handling,
- property, booking, and user APIs,
- modular route files for seller, tracking, advertising, builder, packers, verification, uploads, and more,
- service modules for payments, notifications, and storage,
- a sizable automated test suite.

## Product Modules Present In The Codebase

- Property search and detail pages
- Public property share links
- Visit booking and tracking
- Rider operations and live location workflows
- Seller referral and commission system
- Seller performance scoring and admin payout flows
- Seller verification and lock/unlock logic
- Inventory session/access management
- Packers and movers service
- Advertising module with AI ad generation
- AI chatbot
- AI property validation
- Rider onboarding and policy/legal flows
- SEO landing pages, blogs, and sitemap generation

## Architecture Summary

- Frontend: React app under `frontend/`
- Backend API: FastAPI app under `backend/`
- Database: MongoDB via Motor
- Payments: Cashfree
- Notifications: Twilio and Resend hooks
- Mobile shell: Capacitor Android/iOS projects
- Documentation and operational notes: `memory/`
- Backup and export data: `production_backup/` and `backup_20260408_100649/`

## Current State Of The Repository

The repository appears to be a production-oriented application under active iteration. A few indicators:

- the PRD documents many feature deliveries and bug fixes through April 2026,
- the backend has already been partially modularized but still keeps a large `server.py`,
- there are extensive backend tests and stored test reports,
- there are migration, seeding, and export scripts,
- backups and production snapshots are checked into the repository.

## Practical Summary

If someone joins this project, the clearest mental model is:

ApnaGhr is a real-estate operations system that connects customer acquisition, property visits, field execution, seller incentives, and admin management in one codebase.

It is broader than a standard listing portal and narrower than a generic ERP. Its unique value is the workflow around property visits, human field operations, and commission/performance management layered on top of a rental marketplace.
