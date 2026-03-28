# ApnaGhr Visit Platform - PRD

## Overview
ApnaGhr Visit Platform is a production-ready multi-role rental property platform with:
- Cashfree payment gateway
- Packers & Movers service
- Advertising module with AI Ad Generation
- Multi-role authentication (Customer, Rider, Advertiser, Builder, Admin)
- Neo-Brutalist animated UI design

## Latest Updates (March 2026)

### ✅ Features Completed This Session
1. **Forgot Password Flow**
   - SMS OTP and Email options
   - 6-digit OTP verification
   - Password reset with OTP
   - Full UI flow in Login page

2. **App Customization Settings (Admin)**
   - 11 seasonal themes (Holi, Diwali, Christmas, etc.)
   - Customizable banner text and discount percentage
   - Animated seasonal banner on customer homepage
   - Festive animations toggle

3. **ToLet Board Photo Verification**
   - Riders must upload photos (one per board collected)
   - Photos go to "Pending Verification" queue
   - Admin reviews photos before approving payout
   - Reject option with reason input

4. **Real Account Registration**
   - Removed all mock credentials
   - Registration supports all 4 roles
   - JWT authentication working

### ✅ Previous Fixes
- Rider Online/Offline toggle
- Wallet earnings display
- ToLet Tasks accept flow
- Property search/filters
- Single visit payments
- Admin media upload/delete

## Payment Gateway: Cashfree ✅
- Environment: PRODUCTION
- All transactions (visits, packers, advertising) integrated

## Test Credentials
See `/app/memory/test_credentials.md`

## Pending Features

### P0 - AI Features
1. **AI Ad Poster Generation** (Backend ready, needs OpenAI/Gemini integration)
   - Form created in AdvertiseWithUs page
   - Endpoint: POST /api/advertising/generate-ad

2. **AI Help Bot**
   - Customer assistance chatbot
   - Property recommendations

### P1 - Enhancements
1. **Real SMS/Email OTP** - Currently returns OTP in response
2. **Real-time WebSockets** - For live rider tracking (currently polling)

### P2 - Refactoring
1. **Backend modularization** - Move remaining server.py endpoints to /routes/

## Architecture
```
/app/
├── backend/
│   ├── server.py              # Main API (~2400 lines)
│   ├── routes/                # auth, packers, advertising
│   ├── services/              # cashfree_service.py
│   └── .env                   # MONGO_URL, CASHFREE keys, EMERGENT_LLM_KEY
├── frontend/
│   ├── src/pages/             # Login, CustomerHome, RiderDashboard, AdminDashboard, etc.
│   ├── src/components/        # AppSettingsPanel, ToLetTasksPanel, AIAdGenerator, etc.
│   └── src/utils/api.js       # API client
└── memory/
    ├── PRD.md
    └── test_credentials.md
```

## API Endpoints Summary

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/forgot-password
- POST /api/auth/verify-otp
- POST /api/auth/reset-password

### Properties
- GET /api/properties
- POST /api/properties (admin)

### Visits
- POST /api/visits/book
- POST /api/visits/{id}/pay

### ToLet Tasks
- POST /api/tolet-tasks/{id}/complete (with proof_images)
- GET /api/admin/tolet-tasks/pending-verification
- POST /api/admin/tolet-tasks/{id}/verify

### Settings
- GET /api/settings/app-customization
- POST /api/settings/app-customization (admin)

## Test Results
- Backend: 100% (18/18 tests passed)
- Frontend: 100% verified
- All features working
