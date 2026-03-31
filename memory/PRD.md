# ApnaGhr Visit Platform - PRD

## Overview
ApnaGhr Visit Platform is a production-ready multi-role rental property platform with:
- Cashfree payment gateway (PRODUCTION)
- Packers & Movers service
- Advertising module with AI Ad Generation
- **Seller (Calling Agent) Module** - Commission-based referral system
- Multi-role authentication (Customer, Rider, Seller, Advertiser, Builder, Admin)
- **Premium Luxury UI design** (Updated March 2026)
- AI Chatbot for property assistance
- SMS/Email OTP system (ready for Twilio/Resend integration)
- **Public Property Links** - Share properties without requiring login
- **🆕 Real-Time Agent Tracking System** - Live GPS tracking with WebSockets

## Deployment Status: ✅ READY

### Pre-deployment Optimizations Completed
- ✅ Fixed N+1 database queries (3 locations optimized with batch queries)
- ✅ Added .gitignore for sensitive files
- ✅ All API endpoints responding correctly
- ✅ Environment variables properly configured
- ✅ MongoDB GridFS for permanent image storage
- ✅ Production seed migration script

## Latest Updates (March 31, 2026)

### 🆕 Real-Time Agent Tracking System (Phase 1-5 Complete)
**Backend:**
- WebSocket infrastructure for real-time location broadcasting
- `/api/tracking/rider/{id}` - Rider location WebSocket endpoint
- `/api/tracking/customer/{id}` - Customer tracking WebSocket endpoint
- `/api/tracking/admin` - Admin monitoring WebSocket endpoint
- `/api/tracking/calculate-eta` - Dynamic ETA using OSRM (free routing)
- `/api/tracking/optimize-route` - Multi-visit route optimization (nearest neighbor + 2-opt)
- `/api/tracking/check-reached` - Auto-detect when rider reaches destination (50m radius)
- `/api/tracking/online-riders` - Get all online riders

**Frontend Components:**
- `useTrackingWebSocket.js` - React hook for WebSocket connections
- `LiveTrackingMap.js` - Leaflet + OpenStreetMap real-time map
- `RiderLocationTracker.js` - GPS tracking with background support
- `CustomerVisitTracker.js` - Customer view with ETA countdown
- `AdminLiveTracking.js` - Admin dashboard with all riders

**Features:**
- ✅ GPS tracking every 5 seconds
- ✅ Smooth marker animation on map
- ✅ Smart ETA using OSRM (OpenStreetMap routing)
- ✅ Multi-visit route optimization
- ✅ Visit statuses: Assigned → Accepted → On the Way → Reached → Completed
- ✅ Auto "Reached" detection (50m radius)
- ✅ Customer notifications ("Agent arriving in 5 mins")

### ✅ Custom Domain CORS Fix
- Added `https://apnaghrapp.in` to CORS allowed origins
- Added `https://field-rider-ops.emergent.host` (production backend)
- Backend `.env` now includes all necessary origins
- **REQUIRES REDEPLOYMENT** for production to work

### ✅ Cashfree Payment Integration Updated
- Added Cashfree JavaScript SDK to frontend
- Polling-based payment verification (no webhook dependency)
- Payment status checked on return URL

## Previous Updates (March 30, 2026)

### ✅ Public Property Links (NEW)
- Added `/property/:id` public route for shared property links
- Customers can view property details WITHOUT logging in
- "Book Visit" button prompts auth modal with:
  - "Sign in to Book Visit" message
  - "SIGN IN / REGISTER" CTA button
  - "CONTINUE BROWSING" option
- Backend endpoint: `GET /api/public/property/:id` (no auth required)
- Seller share links now use public URL: `/property/:id?ref=CODE`

### ✅ Seller Property Click Fix
- Properties in Seller Dashboard now open in new tab correctly
- Changed from `/customer/property/:id` to `/property/:id` (public URL)
- Sellers can also access protected `/customer/property/:id` route now

### ✅ UI/UX Final Touches & Enhancements
Premium visual enhancements across all dashboards:

**Phone Input Fix:**
- Fixed overlapping +91 country code and placeholder text
- Redesigned phone input with proper flexbox layout and visual separator

**New Premium CSS Animations (index.css):**
- `shimmer-effect` - Loading shimmer animation
- `gold-shimmer` - Gold gradient text animation
- `float-animation` - Floating elements animation
- `pulse-glow` - CTA button glow effect
- `gradient-text` - Premium gradient text
- `earnings-banner` - Animated sliding background for earnings banners
- `hover-lift` - Card hover lift effect
- `breathe-glow` - Breathing glow for important elements
- `card-shine` - Shine effect on hover
- Premium scrollbar styling
- Custom selection colors

**CustomerHome.js Enhancements:**
- Enhanced testimonials section with real customer photos
- Animated star ratings with stagger effect
- Premium animated trust banner (teal gradient) with stats:
  - 1000+ Happy Customers
  - 500+ Verified Properties
  - 50+ Field Riders
  - 4.8★ Average Rating
- Location icons on testimonials

**RiderDashboard.js Enhancements:**
- Branded rider profile photo in header with:
  - Circular photo with gold border
  - "AG" ApnaGhr badge overlay
  - Online status indicator (pulsing green dot)
- Enhanced animated earnings banner with:
  - Decorative background elements
  - "10 visits = ₹2000" gold badge
  - Animated "Powered by ApnaGhr" dot

**SellerDashboard.js Enhancements:**
- Branded seller profile photo with "PRO" badge
- Gold earnings banner showing "₹500 - ₹10,000 per deal"
- "UNLIMITED EARNINGS" badge
- Improved referral code display

**AdminDashboard.js Enhancements:**
- Admin avatar with initial and "ADMIN" badge
- "CONTROL CENTER" branding badge
- Premium gradient welcome banner with personalized greeting
- Enhanced stat cards with hover effects and green activity dots
- Decorative background elements

**AIChatbot.js Enhancements:**
- Breathing glow effect on chat button (`breathe-glow` class)
- Spring animation on initial load
- Enhanced pulsing notification dot
- Hover tooltip showing "AI Property Assistant"

### ✅ NEW: Seller (Calling Agent) Module Complete
Complete calling team/sales agent management system:

**Features:**
1. **Seller Registration** - Self-registration with admin approval OR admin-created accounts
2. **Property Sharing** - WhatsApp share with referral tracking
3. **Referral Tracking** - Track client journey: shared → registered → booked → visited → deal_closed
4. **Commission System** - Tiered commission structure based on brokerage amount:
   - ₹10k-15k brokerage → ₹500 commission
   - ₹15k-20k → ₹780
   - ₹20k-25k → ₹1,000
   - ₹25k-30k → ₹1,300
   - ₹31k-35k → ₹2,000
   - ₹35k-40k → ₹2,200
   - ₹41k-45k → ₹2,500
   - ₹46k-49k → ₹2,700
   - ₹50k-70k → ₹5,000
   - ₹71k-1L → ₹8,000
   - ₹1.05L-1.5L → ₹10,000
5. **Client Visit Tracking** - See which rider is handling their client's visit
6. **In-App Chat** - Chat with rider (text only, no phone number exposed)
7. **Earnings Wallet** - Track pending, approved, and paid commissions

**Admin Features:**
- Create sellers directly (pre-approved)
- Approve/reject seller registrations
- View seller stats and referrals
- Close deals and credit commissions
- Process seller payouts

**New Files:**
- `/app/backend/routes/seller.py` - All seller API endpoints
- `/app/frontend/src/pages/SellerDashboard.js` - Seller dashboard
- `/app/frontend/src/components/SellerManagementPanel.js` - Admin seller management

### ✅ Premium UI Redesign Complete
Complete visual overhaul from Neo-Brutalist to Premium Luxury aesthetic:

**Updated Pages:**
1. **Login.js** - Premium teal/gold color scheme, Playfair Display typography
2. **CustomerHome.js** - Glass header, elegant property cards, premium search
3. **PropertyDetail.js** - Luxury image gallery, premium booking options
4. **VisitCart.js** - Clean cart items, premium package selection
5. **AdminDashboard.js** - Professional stat cards, navigation tabs + Sellers tab
6. **RiderDashboard.js** - Premium toggle, wallet, tasks styling
7. **SellerDashboard.js** - NEW - Seller portal with 5 tabs
8. **AIChatbot.js** - Teal header, gold accents, clean bubbles
9. **PaymentSuccess.js** - Premium success/error states
10. **PackersMovers.js** - Premium forms and package selection

**Design System:**
- Primary: #04473C (Deep Teal)
- Gold Accent: #C6A87C
- Background: #FDFCFB (Off White)
- Text: #1A1C20 (Deep Charcoal)
- Fonts: Playfair Display (headings), Outfit (body)
- Borders: Subtle #E5E1DB

### ✅ Bug Fixes This Session
1. Fixed Admin Panel Rider Status - Added missing `/api/admin/riders` endpoint and `getRiders()` API function
2. Fixed `propertyAPI.getAll()` → `propertyAPI.getProperties()` call
3. Fixed empty filter params causing 422 errors on properties endpoint

## Payment Gateway: Cashfree ✅
- Environment: PRODUCTION
- All transactions (visits, packers, advertising) integrated
- Checkout URL generation working
- Webhook handling for payment status updates

## Test Credentials
See `/app/memory/test_credentials.md`

## Database Status
- **Users:** 25+ accounts (including sellers)
- **Properties:** 14 listings (9 available)
- **Riders:** 5 registered
- **Sellers:** 1+ active
- **Notifications:** 37
- **Chat Sessions:** 32

## Verified Working Features
1. ✅ User authentication (login/register) - All roles
2. ✅ Property listing and search
3. ✅ Property images loading (external URLs)
4. ✅ Cashfree payment checkout generation
5. ✅ AI Chatbot sessions
6. ✅ Customer wallet
7. ✅ Admin dashboard with Seller Management
8. ✅ Rider dashboard
9. ✅ **Seller dashboard with commission tracking**
10. ✅ Premium UI across all pages

## Pending Features

### P1 - Mobile App
1. **iOS/Android Packaging** - User requested Capacitor wrapper for App Store/Play Store

### P2 - Enhancements
1. **Real SMS/Email OTP** - Currently returns OTP in response (Dev Mode)
2. **Live WebSockets** - Real-time rider tracking (currently polling)
3. **Backend Refactoring** - Break down monolithic server.py

## Architecture

```
/app/
├── backend/
│   ├── server.py          # Main API server (~2900 lines)
│   ├── routes/            # Auth, packers, advertising, chatbot, seller (NEW)
│   ├── services/          # Cashfree, notifications, image storage
│   └── seed_production.py # Production data migration
├── frontend/
│   ├── src/
│   │   ├── pages/         # All pages (Premium styled) + SellerDashboard
│   │   ├── components/    # Reusable components + SellerManagementPanel
│   │   ├── index.css      # Premium design system
│   │   └── utils/api.js   # API utilities
└── memory/
    ├── PRD.md
    └── test_credentials.md
```

## Key Integrations
- **Cashfree** - Payment processing
- **Emergent LLM** - AI Chatbot
- **MongoDB GridFS** - File storage
- **Unsplash/Pexels** - Property images
