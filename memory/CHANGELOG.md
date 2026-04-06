# ApnaGhr Platform - Changelog

## April 6, 2026

### Seller Performance Management System - COMPLETE ✅

**New Features:**
- Complete Seller Tracking + Scoring + Earnings System
- Daily Start/End modals for mandatory reporting
- Performance scoring with bonuses/penalties
- Daily & Monthly Leaderboards
- Admin Performance Panel with tracking, leaderboard, earnings, quotes tabs
- Seller Performance Panel with stats, history, earnings view

**Files Created:**
- `/app/backend/routes/seller_performance.py` - 889 lines, 13 API endpoints
- `/app/frontend/src/components/DailyStartModal.jsx`
- `/app/frontend/src/components/DailyEndModal.jsx`
- `/app/frontend/src/components/SellerPerformancePanel.jsx`
- `/app/frontend/src/components/AdminPerformancePanel.jsx`

**Files Updated:**
- `/app/frontend/src/pages/AdminDashboard.js` - Added Seller Performance tab
- `/app/frontend/src/pages/SellerDashboard.js` - Added Performance tab + modals

**Bug Fixes:**
- Fixed timezone bug in daily-end endpoint (offset-naive vs offset-aware datetime)

**Testing:**
- 22/22 backend tests passed
- Frontend E2E tested via Playwright

---

## April 5, 2026

### Voice Search & AI Property Validator

**Features:**
- Voice search for property filters (Customers & Sellers)
- AI Property Validator using Emergent LLM (detects property type, enforces amenities)
- Seller Leads Panel with webhook receiving

---

## April 2-4, 2026

### Critical Bug Fixes

- Fixed "Track Rider Live" button missing for customers
- Fixed 500 error when riders complete visits (ObjectId serialization)
- Fixed riders not seeing admin-created manual visits
- Added GPS coordinate fields to properties
- Added pickup location to manual visits

---

## Previous Updates

See PRD.md for complete history.
