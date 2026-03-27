# ApnaGhr Visit Platform - Product Requirements Document

## Overview
ApnaGhr Visit Platform is a multi-role mobile and web platform for rental property discovery, paid visits, and centralized deal closing.

## User Roles

### 1. Customer
- Browse properties (exact location hidden until visit)
- Select multiple properties for visit cart
- Book paid visits using credit packages
- Track rider in real-time
- Contact support for deal negotiations

### 2. Rider (Field Executive)
- Online/Offline shift toggle
- Accept property visits (Uber Eats style multi-property routing)
- Accept ToLet board collection tasks
- Upload proof (selfie/video) at each location
- View wallet with pending/approved/paid earnings
- Bi-weekly payouts

### 3. Admin Panel
- **Live Tracking**: Real-time rider locations, active visits
- **Visit Approvals**: Review completed visits, verify proofs, approve/reject
- **ToLet Tasks**: Create board collection tasks, set rates, assign to riders
- **Payouts**: View rider wallets, process bi-weekly payouts
- **Notifications**: Real-time alerts for ride start/end, task completion
- **Customer Support**: Chat/call with customers
- **Inventory**: Manage properties
- **Settings**: Upload explainer video

## Pricing Packages
- 1 Visit: ₹200 (3 days validity)
- 3 Visits: ₹350 (7 days validity) - Popular
- 5 Visits: ₹500 (10 days validity) - Best Value
- Property Lock: ₹999

---

## Features Implemented

### ✅ Customer Flow
- Property browsing with filters
- Multi-property cart selection
- Visit booking with pickup location
- Visit tracking with OTP
- "How It Works" explainer section

### ✅ Rider Flow (Uber Eats Style)
- Shift toggle (Online/Offline)
- Accept batched visits
- Step-by-step navigation:
  1. Go to Customer → Verify OTP
  2. Navigate to Property 1 → Upload Proof → Complete
  3. Navigate to Property 2 → Upload Proof → Complete
  4. Finish Visit
- ToLet board task acceptance
- Wallet with earnings breakdown

### ✅ Admin Panel (NEW)
- **Live Tracking**: Online riders with GPS, active visits, call rider
- **Visit Approvals**: Review proofs, approve/reject, credit earnings
- **ToLet Tasks**: Create tasks with editable rates, assign riders
- **Payouts**: Summary cards, bi-weekly payout processing
- **Notifications**: Real-time alerts in header dropdown
- Settings with video upload

### ✅ Payment & Wallet System
- Stripe integration (test mode)
- Rider wallet with transaction history
- Pending → Approved → Paid earnings flow
- Bi-weekly payout dates (1st & 15th)

### ✅ Notifications
- Admin notified on: ride start, ride end, task completion
- Rider notified on: task assigned, visit approved, payout processed

---

## API Endpoints

### ToLet Tasks
- POST `/api/admin/tolet-tasks` - Create task
- GET `/api/admin/tolet-tasks` - List all
- PATCH `/api/admin/tolet-tasks/{id}` - Update rate
- POST `/api/admin/tolet-tasks/{id}/assign` - Assign to rider
- GET `/api/tolet-tasks/available` - Rider gets available
- POST `/api/tolet-tasks/{id}/accept` - Accept
- POST `/api/tolet-tasks/{id}/start` - Start
- POST `/api/tolet-tasks/{id}/complete` - Complete

### Visit Management
- GET `/api/admin/visits/all` - All visits
- GET `/api/admin/visits/pending-approval` - Needs review
- POST `/api/admin/visits/{id}/assign` - Assign rider
- POST `/api/admin/visits/{id}/approve` - Approve/Reject

### Rider Wallet
- GET `/api/rider/wallet` - Balance
- GET `/api/rider/wallet/transactions` - History
- GET `/api/admin/riders/wallets` - All wallets
- POST `/api/admin/payouts/process` - Bi-weekly payout

### Live Tracking
- GET `/api/admin/visits/{id}/tracking` - Visit tracking
- GET `/api/admin/riders/live-locations` - All online riders

### Notifications
- GET `/api/notifications` - User notifications
- POST `/api/notifications/mark-read` - Mark read

---

## Test Credentials
- Customer: 9999999999 / test123
- Rider: 8888888888 / test123
- Admin: 7777777777 / admin123

---

## Completed (March 27, 2025)

### Session 1: MVP
- Basic auth, property listing, Stripe payments

### Session 2: Multi-Property Visit Flow
- Uber Eats style routing
- Rider shift system
- Visit cart for customers

### Session 3: Admin Panel Overhaul (Current)
- ✅ Live Tracking panel with online riders
- ✅ Visit Approvals panel with proof review
- ✅ ToLet Board Tasks (create, assign, editable rates)
- ✅ Payouts panel with bi-weekly processing
- ✅ Notifications system with real-time alerts
- ✅ Rider wallet with transaction history
- ✅ Pricing updated (1/3/5 visits)
- ✅ "How It Works" video section

---

## Next Tasks (P1)
- [ ] Add wallet section to Rider Dashboard
- [ ] ToLet tasks section in Rider Dashboard
- [ ] Real-time WebSocket for tracking (currently polling)

## Future/Backlog (P2)
- SMS notifications (Twilio)
- Anti-fraud detection
- In-app calling
- Rating system
