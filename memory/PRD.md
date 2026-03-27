# ApnaGhr Visit Platform - Production Ready

## Overview
ApnaGhr Visit Platform is a production-ready multi-role rental property platform for property discovery, paid visits, deal closing, **packers & movers services**, and **advertising platform**.

## User Roles

### Customer
- Browse properties with popularity badges (🔥 High Demand, 👀 X viewed this week)
- Add multiple properties to cart
- Book visits with pickup location
- Track visits with OTP verification
- **NEW: Book Packers & Movers services**
- **NEW: Advertise business on the platform**
- Contact support for negotiations

### Rider (Field Executive)
- Online/Offline shift toggle
- Accept multi-property visits (Uber Eats style)
- Accept ToLet board collection tasks
- Upload proof at each location
- View wallet (pending/approved/paid)
- Bi-weekly payouts

### Advertiser
- Create business profile
- Choose advertising packages
- Submit ad campaigns for approval
- Track impressions and clicks

### Admin
- **Live Tracking**: Online riders GPS, active visits
- **Visit Approvals**: Review proofs, approve/reject, credit wallet
- **ToLet Tasks**: Create tasks, editable rates (₹10-₹20/board), assign riders
- **Payouts**: Rider wallets, bi-weekly processing
- **Property Analytics**: Visit counts, daily verification, hot marking
- **Notifications**: Real-time alerts
- **Inventory**: Property management
- **Settings**: Explainer video upload
- **Manage shifting bookings**
- **Approve/reject advertisements**

## Payment Gateway: Cashfree ✅

### Integration Details
- **Environment**: PRODUCTION
- **App ID**: 924724a3da0d70cab4e9eddd52427429
- **Checkout URL**: https://payments.cashfree.com/order/#/{payment_session_id}
- **Webhook**: /api/webhook/cashfree
- **API Version**: 2023-08-01

### Supported Transactions
1. **Visit Packages**
   - Single Visit: ₹200
   - 3 Visits: ₹350
   - 5 Visits: ₹500
   - Property Lock: ₹999

2. **Packers & Movers** (Deposit payment)
   - Basic Shift: ₹2,999
   - Standard Shift: ₹5,999
   - Premium Shift: ₹10,999
   - Elite Shift: ₹18,999
   - Intercity Shift: ₹15,000

3. **Advertising** (Monthly subscription)
   - Starter Boost: ₹2,999/month
   - Growth Package: ₹7,999/month
   - Premium Visibility: ₹14,999/month
   - Elite Brand Partner: ₹29,999/month

## Pricing

### Visit Packages
- 1 Visit: ₹200 (3 days validity)
- 3 Visits: ₹350 (7 days validity) - Popular
- 5 Visits: ₹500 (10 days validity) - Best Value
- Property Lock: ₹999

### Packers & Movers Packages
- **Basic Shift**: ₹2,999 - ₹6,999 (Students, Bachelors, 1RK)
- **Standard Shift**: ₹5,999 - ₹12,999 (1BHK/2BHK) ⭐ Popular
- **Premium Shift**: ₹10,999 - ₹20,999 (2BHK/3BHK)
- **Elite Shift**: ₹18,999 - ₹35,000+ (3BHK/Villas)
- **Intercity Shift**: ₹15,000 - ₹60,000+ (City to City)

### Advertising Packages
- **Starter Boost**: ₹2,999/month (1 poster, home screen)
- **Growth Package**: ₹7,999/month (5 posters, priority listing) ⭐ Popular
- **Premium Visibility**: ₹14,999/month (10 creatives, push notifications)
- **Elite Brand Partner**: ₹29,999+/month (unlimited, lead sharing)

## UI/UX Design
- **Design System**: Neo-Brutalist with pastel accents
- **Colors**: Primary #FF5A5F, Secondary #4ECDC4, Accent #FFD166
- **Typography**: Outfit (headings), DM Sans (body)
- **Animations**: framer-motion for page transitions and interactions
- **Components**: Solid 2px black borders, 4px offset shadows, pill buttons

## Test Credentials
- Customer: 9999999999 / test123
- Rider: 8888888888 / test123
- Admin: 7777777777 / admin123

## API Summary

### Auth
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me

### Payments (Cashfree)
- POST /api/payments/checkout - Create checkout session
- GET /api/payments/status/{order_id} - Check payment status
- POST /api/webhook/cashfree - Handle webhooks

### Properties
- GET /api/properties
- GET /api/properties/{id}
- POST /api/properties
- PATCH /api/properties/{id}

### Visits
- POST /api/visits/book
- GET /api/visits/my-bookings
- POST /api/visits/{id}/accept

### Packers & Movers
- GET /api/packers/packages
- POST /api/packers/book
- POST /api/packers/pay
- GET /api/packers/my-bookings

### Advertising
- GET /api/advertising/packages
- POST /api/advertising/profile
- POST /api/advertising/ads
- POST /api/advertising/pay
- GET /api/advertising/active

## Test Results
- Backend: 100% tests passed (18/18)
- Cashfree Integration: ✅ PRODUCTION
- Payment Flows: All verified

## Architecture
```
/app/
├── backend/
│   ├── server.py (Main server)
│   ├── services/
│   │   └── cashfree_service.py (Payment gateway)
│   ├── routes/
│   │   ├── packers.py
│   │   └── advertising.py
│   └── .env (Cashfree credentials)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CustomerHome.js
│   │   │   ├── PackersMovers.js
│   │   │   ├── AdvertiseWithUs.js
│   │   │   └── PaymentSuccess.js
│   │   └── utils/api.js
│   └── package.json
└── memory/
    └── PRD.md
```

## What's Implemented (December 2025)
1. ✅ Multi-property visit booking (Uber Eats style)
2. ✅ Rider shift system with GPS tracking
3. ✅ Customer cart with pricing packages
4. ✅ Admin ToLet board task management
5. ✅ Visit approvals with proof verification
6. ✅ Rider wallet and bi-weekly payouts
7. ✅ Live tracking UI (polling-based)
8. ✅ Property analytics with hot badges
9. ✅ Neo-Brutalist UI redesign with animations
10. ✅ Packers & Movers module (5 packages)
11. ✅ Advertising platform (4 packages)
12. ✅ **Cashfree Payment Gateway Integration**

## Backlog / Future Tasks
- P1: Real WebSockets for live rider tracking
- P2: SMS notifications via Twilio
- P2: Anti-fraud system
- P3: Builders/Developers user roles
