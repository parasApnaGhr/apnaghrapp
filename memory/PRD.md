# ApnaGhr Visit Platform - PRD

## Overview
ApnaGhr Visit Platform is a production-ready multi-role rental property platform with Cashfree payments, packers & movers, and advertising features.

## Recent Bug Fixes (December 2025)
All 7 reported bugs have been fixed and verified:
1. ✅ Rider Online/Offline toggle - Working
2. ✅ Wallet showing earnings (Total, Pending, Approved, Paid) - Working
3. ✅ ToLet Tasks with Accept button - Working
4. ✅ Properties displaying for customers - Working
5. ✅ Search/Filters with partial match - Working
6. ✅ Payment required before visit booking - Working
7. ✅ Admin video upload & image deletion - Working

## Payment Gateway: Cashfree ✅
- Environment: PRODUCTION
- Checkout URL: https://payments.cashfree.com/order/#/{payment_session_id}
- All transactions (visits, packers, advertising) integrated

## Test Credentials
- Customer: 9999999999 / test123
- Rider: 8888888888 / test123
- Admin: 7777777777 / admin123

## Pending Feature Requests

### 1. Advertising Enhancement
- Ask for logos and business pictures
- AI poster/video generation using Claude Sonnet + Sora 2
- Auto-generate creatives based on package

### 2. Admin App Settings
- Customization options (Holi offers, festival themes)
- Modify ads and promotions
- Admin-only access

### 3. AI Help Bot
- Customer assistance using Claude Sonnet
- Help with property selection
- Answer general queries

## Architecture
```
/app/
├── backend/
│   ├── server.py
│   ├── services/cashfree_service.py
│   └── routes/
├── frontend/
│   ├── src/pages/
│   └── src/components/
└── memory/PRD.md
```

## Test Results
- Backend: 100% (18/18 tests passed)
- Frontend: 100% verified
- All 7 bugs fixed
