# ApnaGhr Visit Platform - Product Requirements Document

## Overview
ApnaGhr Visit Platform is a multi-role mobile and web platform for rental property discovery, paid visits, and centralized deal closing. It functions as a combination of a property listing app, a ride-hailing system (like Uber Eats), and a centralized call center.

## User Roles

### 1. Customer
- Browse properties (exact location hidden until visit)
- Book paid visits (₹200 single, ₹500 for 5 visits)
- **Select multiple properties for single visit (Uber Eats style)**
- Track rider in real-time
- Connect to support for deal negotiation
- Lock property for exclusive access

### 2. Rider (Field Executive)
- **Online/Offline Shift System** - Toggle to receive visit requests
- Accept nearby visit requests (batched multi-property)
- **Uber Eats Style Navigation Flow**:
  1. Accept visit → Get customer pickup location
  2. Navigate to customer → Verify OTP
  3. Navigate to Property 1 → Complete visit proof
  4. Navigate to Property 2 → Complete visit proof
  5. ... repeat for all properties
  6. Complete entire visit
- Upload selfie/video proof at each property
- Earn ₹100 per property visited

### 3. Admin Panel
- **Customer Support**: Chat/call with customers, close deals
- **Inventory Management**: Add/delete properties, hide address, upload photos/videos
- **Rider Management**: Track online riders, approve applications, manage bonuses

## Core Features (Implemented)

### ✅ Authentication System
- Phone + password login
- JWT token-based authentication
- Role-based access control (customer/rider/admin)

### ✅ Property Management
- Property listing with images, videos, amenities
- Filters: city, rent range, BHK, furnishing
- Exact address hidden until paid visit
- Premium/Verified badges

### ✅ Payment Integration (Stripe)
- Single visit: ₹200
- 5-visit package: ₹500
- Property lock: ₹999
- Test mode enabled

### ✅ Multi-Property Visit Booking (NEW - Uber Eats Style)
- Customers add multiple properties to visit cart
- Set pickup location, date, and time
- Single booking for all selected properties
- Visit credits deducted from package

### ✅ Rider Shift System (NEW)
- Online/Offline toggle in Rider Dashboard
- Only online riders see and can accept visits
- Location tracking (GPS) when online

### ✅ Step-by-Step Visit Navigation (NEW)
Visit flow states:
1. `pending` - Waiting for rider
2. `rider_assigned` - Rider accepted, customer notified
3. `pickup_started` - Rider navigating to customer
4. `at_customer` - Rider arrived, verify OTP
5. `navigating` - En route to property
6. `at_property` - At property, show/upload proof
7. `completed` - All properties visited

### ✅ Visit Progress Tracking
- Customer sees real-time status updates
- Progress bar showing X/Y properties completed
- Property checkmarks for completed visits
- Estimated duration calculation

### ✅ Direct File Upload
- Property images and videos
- Visit proof (selfie + video) at each property
- Stored in /app/uploads directory

### ✅ Chat System
- Customer-Support messaging
- Message history and read receipts

## Technical Stack
- **Frontend**: React 19, TailwindCSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: Stripe (test mode)
- **Authentication**: JWT

## API Endpoints

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`

### Properties
- GET `/api/properties`
- GET `/api/properties/{id}`
- POST `/api/properties`
- PATCH `/api/properties/{id}`
- DELETE `/api/properties/{id}`

### Visits
- POST `/api/visits/book` - Book multi-property visit
- GET `/api/visits/available` - Get pending visits (riders only)
- POST `/api/visits/{id}/accept` - Accept visit
- POST `/api/visits/{id}/update-step` - Update visit progress
- GET `/api/visits/{id}/details` - Get full visit details
- GET `/api/visits/my-bookings` - Customer's bookings

### Rider
- POST `/api/rider/shift` - Toggle online/offline
- GET `/api/rider/shift` - Get current shift status
- POST `/api/rider/location` - Update GPS location
- GET `/api/rider/active-visit` - Get current active visit

### Payments
- POST `/api/payments/checkout`
- GET `/api/payments/status/{session_id}`

### Chat
- POST `/api/chat/send`
- GET `/api/chat/messages/{user_id}`
- GET `/api/chat/conversations`

## Data Models

### VisitBooking (Updated for Multi-Property)
```json
{
  "id": "string",
  "customer_id": "string",
  "property_ids": ["string"],  // Array of properties
  "scheduled_date": "string",
  "scheduled_time": "string",
  "status": "pending|rider_assigned|pickup_started|at_customer|navigating|at_property|completed",
  "current_step": "waiting|go_to_customer|at_customer|go_to_property_X|at_property_X|completed",
  "current_property_index": 0,  // Which property we're at
  "rider_id": "string",
  "otp": "string",
  "pickup_location": "string",
  "pickup_lat": "float",
  "pickup_lng": "float",
  "properties_completed": ["string"],  // Completed property IDs
  "total_earnings": "float",  // Rider earnings
  "estimated_duration": "string"
}
```

---

## Completed Work (March 27, 2025)

### Session 1: Initial MVP
- Basic auth, property listing, single visit booking
- Stripe payment integration
- Direct file upload

### Session 2: Multi-Property Visit Flow (Uber Eats Style)
- ✅ Updated VisitBooking model for multiple properties
- ✅ Created visit cart (VisitCart.js)
- ✅ Added "Add to Cart" button on PropertyDetail
- ✅ Implemented step-by-step navigation API
- ✅ Created Uber Eats style RiderDashboard
- ✅ Added rider shift toggle (Online/Offline)
- ✅ Updated CustomerBookings for multi-property tracking
- ✅ All tests passing (20/20 backend, all frontend flows)

---

## Upcoming Tasks (P1)

1. **Real-time WebSocket Tracking**
   - Live rider location updates
   - Push notifications for status changes

2. **SMS Notifications (Twilio)**
   - OTP delivery via SMS
   - Visit status updates

3. **Rider Management Panel Fixes**
   - Live tracking on admin map
   - Bonus system implementation

---

## Future/Backlog (P2)

1. Anti-Cheat & Fraud Detection
   - Flag short visits (<5 min)
   - Detect repeated patterns
   - Photo/video verification

2. Advanced Filters
   - Map-based property search
   - Distance-based sorting

3. In-App Voice/Video Call
   - Direct customer-rider communication

4. Rating & Review System
   - Rate properties after visit
   - Rate riders
