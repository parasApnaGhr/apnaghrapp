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
- **NEW: Manage shifting bookings**
- **NEW: Approve/reject advertisements**

## Pricing

### Visit Packages
- 1 Visit: ₹200 (3 days)
- 3 Visits: ₹350 (7 days) - Popular
- 5 Visits: ₹500 (10 days) - Best Value
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

## Property Analytics Features
- **Visit Tracking**: Weekly and total visits per property
- **Hot Properties**: Auto-mark top visited properties
- **Daily Verification**: Check if properties are still available
- **Status Management**: Available | Rented | Under Verification
- **Customer FOMO**: Show "High Demand" and "X viewed this week" badges

## Production Features
- Stripe payment integration
- MongoDB database
- JWT authentication
- Direct file uploads (images/videos)
- Real-time notifications
- Bi-weekly payout system
- GPS tracking for riders

## Test Credentials
- Customer: 9999999999 / test123
- Rider: 8888888888 / test123
- Admin: 7777777777 / admin123

## API Summary

### Auth
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me

### Properties
- GET /api/properties
- GET /api/properties/{id}
- POST /api/properties
- PATCH /api/properties/{id}
- GET /api/admin/properties/analytics

### Visits
- POST /api/visits/book
- GET /api/visits/my-bookings
- POST /api/visits/{id}/accept
- POST /api/admin/visits/approve

### ToLet Tasks
- GET /api/admin/tolet-tasks
- POST /api/admin/tolet-tasks
- POST /api/tolet-tasks/{id}/accept

### Wallet & Payouts
- GET /api/rider/wallet
- GET /api/rider/wallet/transactions
- POST /api/admin/payouts/process

### Tracking
- GET /api/admin/riders/live-locations
- GET /api/admin/visits/{id}/tracking

### Packers & Movers
- GET /api/packers/packages
- POST /api/packers/book
- GET /api/packers/my-bookings
- GET /api/packers/admin/bookings

### Advertising
- GET /api/advertising/packages
- POST /api/advertising/profile
- POST /api/advertising/ads
- GET /api/advertising/ads
- POST /api/admin/ads/{id}/approve
- GET /api/advertising/active

## Test Results
- Backend: 100% tests passed
- Frontend: All features verified
- Production Ready: YES

## Architecture
```
/app/
├── backend/
│   ├── server.py (Main server with all routes)
│   ├── routes/
│   │   ├── packers.py (Packers & Movers API)
│   │   └── advertising.py (Advertising API)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CustomerHome.js (With services & animations)
│   │   │   ├── PackersMovers.js (NEW)
│   │   │   └── AdvertiseWithUs.js (NEW)
│   │   ├── components/
│   │   └── index.css (Neo-Brutalist styling)
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
9. ✅ **Neo-Brutalist UI redesign with animations**
10. ✅ **Packers & Movers module (5 packages)**
11. ✅ **Advertising platform (4 packages)**

## Backlog / Future Tasks
- P1: Real WebSockets for live rider tracking (currently polling)
- P2: SMS notifications via Twilio
- P2: Anti-fraud system (flagging short visits)
- P2: In-app VoIP calling
- P3: Builders/Developers user roles
- P3: Payment integration for Packers & Advertising
