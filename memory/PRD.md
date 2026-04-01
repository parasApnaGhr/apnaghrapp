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
- **Real-Time Agent Tracking System** - Live GPS tracking with WebSockets
- **🆕 Complete Customer Profile System** - Stats, Payment History, Notifications, Help, Privacy
- **🆕 Rider Bank Account Management** - Bank details for payouts
- **🆕 GPS Location Capture** - Use Current Location for pickup and address

## Latest Updates (April 1, 2026)

### 🆕 Customer Profile System (Complete)

**Features Implemented:**
- ✅ Profile stats: Visits count, Total spent, Properties viewed
- ✅ Address management with GPS location capture
- ✅ Payment History page (`/customer/payments`)
- ✅ Notifications page with unread count (`/customer/notifications`)
- ✅ Help & Support page with FAQ and contact options (`/customer/support`)
- ✅ Privacy & Security page with password change (`/customer/privacy`)

**API Endpoints:**
- `PUT /api/customer/profile` - Update profile with address/location
- `GET /api/customer/wallet` - Get stats (visits, spent, viewed)
- `GET /api/customer/payments` - Get payment history

### 🆕 Rider Profile & Bank Account System

**Features Implemented:**
- ✅ Profile editing (name, email, vehicle type/number, address)
- ✅ Bank account management (add/update)
- ✅ Account number masking for security
- ✅ UPI ID support
- ✅ Profile completion warning

**API Endpoints:**
- `GET /api/rider/profile` - Get profile with bank details
- `PUT /api/rider/profile` - Update profile
- `POST /api/rider/bank-account` - Add/update bank account
- `GET /api/rider/bank-account` - Get bank account (masked)

**Bank Account Fields:**
- Account Holder Name
- Account Number (stored securely, displayed masked)
- IFSC Code
- Bank Name
- UPI ID (optional)

### 🆕 GPS Location Capture

**Features Implemented:**
- ✅ "Use Current Location" button in Visit Cart for pickup
- ✅ Location capture in Customer Profile for address
- ✅ Reverse geocoding via OpenStreetMap Nominatim
- ✅ GPS coordinates stored (lat/lng) for route optimization

### 🆕 Customer Visit Modification

**Features Implemented:**
- ✅ Customers can modify admin-created visits
- ✅ Update date, time, and pickup location
- ✅ Confirmation tracking for modified visits

**API Endpoint:**
- `PUT /api/customer/visits/{visit_id}/modify`

## Deployment Status: ✅ READY

## Critical Bug Fixes (April 1, 2026 - Production)

### 1. Payment → Auto-Book Visit Fix
**Issue**: After payment, customer had to manually book visit - visits weren't created automatically.
**Fix**: PaymentSuccess.js now auto-creates visit booking from localStorage `pendingVisitBooking` after payment succeeds.
**Files**: `/app/frontend/src/pages/PaymentSuccess.js`

### 2. Rider GPS Tracking Stops Issue  
**Issue**: GPS tracking stopped after 1-2 seconds.
**Root Cause**: Component cleanup was calling `stopTracking()` on every re-render.
**Fix**: Changed cleanup to only clear intervals/watchers, not call API to stop tracking.
**Files**: `/app/frontend/src/components/RiderLocationTracker.js`

### 3. Customer Tracking Blank Page
**Issue**: Tracking page showed blank/black.
**Fix**: Added error boundary with user-friendly fallback UI.
**Files**: `/app/frontend/src/components/CustomerVisitTracker.js`

### Pre-deployment Optimizations Completed
- ✅ Fixed N+1 database queries (3 locations optimized with batch queries)
- ✅ Added .gitignore for sensitive files
- ✅ All API endpoints responding correctly
- ✅ Environment variables properly configured
- ✅ MongoDB GridFS for permanent image storage
- ✅ Production seed migration script

## Latest Updates (March 31, 2026)

### 🆕 Legal Policy & Terms Acceptance System (PERMANENT - DATABASE STORED ✅)

**Storage: MongoDB Database (Survives All Deployments)**
- ✅ `terms_accepted`: Boolean flag on user document
- ✅ `terms_accepted_date`: ISO timestamp when accepted
- ✅ `terms_version`: Version tracking for future policy updates

**API Endpoints:**
- `POST /api/auth/accept-terms` - Save acceptance to database
- `GET /api/auth/terms-status` - Check acceptance status
- Login response includes `terms_accepted` field

**Frontend Integration:**
- ✅ **Login.js** - Checks terms after login, shows modal if not accepted
- ✅ **CustomerHome.js** - Shows modal on dashboard if terms not accepted
- ✅ **RiderDashboard.js** - Shows modal on dashboard if terms not accepted
- ✅ **VisitCart.js** - Requires terms before payment (checks from DB)

**User Flow:**
1. User logs in → Backend returns `terms_accepted: false`
2. Dashboard shows Terms Modal (blocks UI)
3. User accepts all checkboxes + clicks "I Accept All Terms"
4. Frontend calls `POST /api/auth/accept-terms`
5. Database updated with `terms_accepted: true`
6. Modal closes, user can continue
7. Next login → `terms_accepted: true` → No modal shown

**Anti-Circumvention Policy Displayed:**
- Customer: ₹50,000 or 2X deal value penalty
- Rider: ₹1,00,000 fine + termination

**Files Updated:**
- `/app/frontend/src/components/TermsAcceptanceModal.js` - Modal component
- `/app/frontend/src/pages/VisitCart.js` - Checkout integration
- `/app/frontend/src/pages/Login.js` - Login/Registration integration
- `/app/frontend/src/pages/LegalPolicies.js` - Full policy page

### 🆕 Real-Time Agent Tracking System (DATABASE-BACKED ✅)

**Performance Specifications:**
- ✅ **Real-time delay < 2 seconds** (batched broadcasts every 500ms)
- ✅ **Smooth marker movement** (cubic ease-out interpolation with velocity prediction)
- ✅ **Scales to 5000+ agents** (marker clustering, batched WebSocket updates)

**DATABASE STORAGE (Permanent - Survives Deployments):**

1. **Tracking Sessions Collection** (`tracking_sessions`):
   ```javascript
   {
     id: "track_xxx",
     rider_id: "uuid",
     visit_id: "visit_xxx",
     status: "active" | "completed",
     started_at: ISODate,
     ended_at: ISODate,
     locations: [{lat, lng, speed, heading, accuracy, timestamp}],
     total_distance_km: 7.5,
     duration_minutes: 45,
     total_locations: 150
   }
   ```

2. **User Location Updates** (`users` collection):
   ```javascript
   {
     current_lat: 30.7046,
     current_lng: 76.7179,
     current_speed: 35.0,
     current_heading: 180,
     last_location_update: ISODate,
     tracking_active: true,
     current_tracking_session: "track_xxx"
   }
   ```

3. **Visit Optimized Routes** (`visit_bookings` collection):
   ```javascript
   {
     optimized_route: {
       visits: [{id, lat, lng, order: 1}, ...],
       total_distance_km: 15.5,
       estimated_time_minutes: 90
     }
   }
   ```

**API Endpoints (Database-Backed):**
- `POST /api/tracking/session/start` - Start tracking session (saved to DB)
- `POST /api/tracking/session/{id}/location` - Update GPS location (saved to DB)
- `POST /api/tracking/session/{id}/stop` - Stop session (calculates totals)
- `GET /api/tracking/session/{id}` - Get session with all locations
- `GET /api/tracking/rider/{id}/sessions` - Get rider's session history
- `GET /api/tracking/rider/{id}/current-location` - Get from database
- `GET /api/tracking/visit/{id}/tracking` - Get visit tracking with rider location

**Frontend Integration:**
- ✅ **GPS Track Tab** in RiderDashboard.js - With database sync indicator
- ✅ **RiderLocationTracker Component** - Saves to both WebSocket AND database
- ✅ **"DB Synced" indicator** - Shows green when locations are saved to DB
- ✅ **Session ID display** - Shows active tracking session

**Backend Architecture:**
- High-performance WebSocket manager with connection pooling
- Batched location broadcasts (500ms intervals) for efficiency
- Message deduplication (only latest location per rider per batch)
- Async broadcasting with 1-second timeout protection
- `/api/tracking/metrics` - Real-time performance monitoring

**WebSocket Endpoints:**
- `/api/tracking/rider/{id}` - Rider location updates
- `/api/tracking/customer/{id}` - Customer tracking
- `/api/tracking/admin` - Admin monitoring (receives batch updates)

**REST API:**
- `/api/tracking/calculate-eta` - Dynamic ETA using OSRM
- `/api/tracking/optimize-route` - Multi-visit route optimization
- `/api/tracking/check-reached` - Auto-detect arrival (50m radius)
- `/api/tracking/online-riders` - Get all online riders

**Multi-Visit Route Optimization:**
- When customer books 5 properties → ONE rider gets assigned to ALL
- Nearest neighbor + 2-opt algorithm for shortest path
- Shows: Visit 1 → Visit 2 → Visit 3 → Visit 4 → Visit 5
- Total distance and estimated time calculated

**Frontend Components:**
- `useTrackingWebSocket.js` - High-performance WebSocket hook with interpolation
- `LiveTrackingMap.js` - Leaflet + MarkerCluster for 5000+ markers
- `RiderLocationTracker.js` - GPS tracking with background support
- `CustomerVisitTracker.js` - Customer view with ETA countdown
- `AdminLiveTracking.js` - Admin dashboard with all riders
- `MultiVisitRoute.js` - Optimized route display

**Features:**
- ✅ GPS tracking every 2-5 seconds
- ✅ Smooth marker animation (1.5s cubic ease-out interpolation)
- ✅ Velocity-based position prediction
- ✅ Marker clustering at 50+ riders
- ✅ Smart ETA using OSRM (OpenStreetMap routing)
- ✅ Multi-visit route optimization
- ✅ Visit statuses: Assigned → Accepted → On the Way → Reached → Completed
- ✅ Auto "Reached" detection (50m radius)
- ✅ Customer notifications
- ✅ Heartbeat for connection health (30s intervals)
- ✅ Auto-reconnect with exponential backoff

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
11. ✅ **Legal Policy Terms Acceptance at Login & Checkout** (Database-stored)
12. ✅ **Real-time Agent Tracking with WebSockets** (Database-stored)
13. ✅ **Multi-Visit Route Optimization** (Database-stored)
14. ✅ **Seller Client Follow-up System** (NEW - Database-stored)

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

## Latest Bug Fixes (April 1, 2026)

### P0 - Rider Available Visits Fix ✅ (PROPERLY FIXED)
**Issue**: Admin-created visits (with or without assigned rider) were not appearing correctly for riders.

**Root Cause**: 
1. The MongoDB `$or` logic was incorrect - it checked if ANY field was null, not if BOTH were null
2. Visits assigned to a specific rider weren't included in that rider's available visits

**Fix Applied**:
1. Changed query logic to use `$and` to ensure BOTH `rider_id` AND `assigned_rider_id` are null for unassigned visits
2. Added a second query to include visits specifically assigned to the current rider
3. Updated active visit query to check BOTH `rider_id` and `assigned_rider_id`

**Code Changes** (`/app/backend/server.py`):
```python
# Query for unassigned visits (available to all riders)
unassigned_query = {
    "status": {"$in": ["pending", "confirmed"]},
    "$and": [
        {"$or": [{"rider_id": None}, {"rider_id": {"$exists": False}}]},
        {"$or": [{"assigned_rider_id": None}, {"assigned_rider_id": {"$exists": False}}]}
    ]
}

# Query for visits assigned to this rider but not yet started
assigned_to_me_query = {
    "status": {"$in": ["pending", "confirmed", "assigned"]},
    "$or": [
        {"rider_id": current_user['id']},
        {"assigned_rider_id": current_user['id']}
    ]
}
```

### P1 - Customer Visibility for Admin-Booked Visits ✅ (PROPERLY FIXED)
**Issue**: Customers couldn't see visits booked on their behalf by Admin.

**Root Cause**: The my-bookings query only checked `customer_id` and `user_id`, but admin might create visits with just phone number.

**Fix Applied**: Added `customer_phone` to the query to match by phone number as fallback.

**Code Changes** (`/app/backend/server.py`):
```python
bookings = await db.visit_bookings.find(
    {"$or": [
        {"customer_id": current_user['id']}, 
        {"user_id": current_user['id']},
        {"customer_phone": current_user.get('phone')}
    ]}, 
    {"_id": 0}
).sort("created_at", -1).to_list(50)
```

## Known Environment Note
⚠️ **Preview vs Production Database**: The preview environment (`field-rider-ops.preview.emergentagent.com`) uses a separate MongoDB database from production (`apnaghrapp.in`). Test users created on production won't appear in preview. Always test with preview-specific data or recreate test scenarios on preview.
