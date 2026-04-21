# ApnaGhr Frontend Structure & Redesign Guide

This document provides a micro-detailed breakdown of all pages and components in the ApnaGhr frontend. It is designed to assist in redesigning the UI for a more aesthetic and premium user experience.

---

## 1. Overview
The ApnaGhr frontend is a React-based application built with TypeScript, TailwindCSS, and Vite. It serves multiple user roles including Customers, Riders, Sellers, Builders, and Administrative staff.

**Design System Goals:**
- Premium, modern aesthetics (Rich colors, sleek dark mode, glassmorphism).
- Smooth transitions and micro-animations.
- High-quality typography (Inter/Roboto/Outfit).
- Responsive across mobile and desktop.

---

## 2. Authentication & Onboarding

### 2.1 Login & Registration (`src/pages/Login.tsx`)
**Route:** `/login` or `/`
**Purpose:** Entry point for all users. Handles authentication, registration, password recovery, and terms of service acceptance.

#### **Form States & Micro-Details**
- **Login View (Default):**
  - **Inputs:**
    - Phone Number (Type: `tel`, Placeholder: "Enter mobile number", with `+91` prefix display).
    - Password (Type: `password`, Placeholder: "Enter your password", with Eye/EyeOff toggle).
  - **Buttons:**
    - Sign In (`submit`): Validates phone/password, calls `login`.
    - Forgot Password: Toggles `isForgotPassword` state.
    - Register: Toggles `isRegister` state.
- **Registration View:**
  - **Inputs:**
    - Full Name (Type: `text`, Placeholder: "Your full name").
    - Phone Number (Same as login).
    - Email (Optional) (Type: `email`, Placeholder: "your@email.com").
    - Password (Type: `password`, Placeholder: "Create a password").
    - Role Selector (Radio buttons for: Customer, Seller, Advertiser, Builder).
    - City (Only for Seller role) (Type: `text`, Placeholder: "Your city").
  - **Buttons:**
    - Create Account (`submit`): Calls `register`.
    - Back to Login: Toggles back to login view.
- **Forgot Password Flow:**
  - **Step 1 (OTP Request):** Phone input + Method selector (SMS/Email).
  - **Step 2 (OTP Verification):** 6-digit numeric input.
  - **Step 3 (Reset):** New Password + Confirm Password inputs.
- **Utility Modals:**
  - **TermsAcceptanceModal:** Triggered if `needsTerms` is true after login.

#### **Conditional UI Logic**
- **Desktop Showcase:** A gradient left-side banner with stats (₹2000 per day, 60+ Cities) and testimonials.
- **Pending Approval:** Shows an info toast if a seller account is awaiting admin approval.

---

### 2.2 Rider Onboarding (`src/pages/onboarding/RiderOnboarding.tsx`)
**Route:** `/join-as-rider`
**Purpose:** A 6-step application process for potential riders to join the platform.

#### **Multi-Step Form Layout**
- **Step 1: Basic Details**
  - **Fields:** Full Name, Mobile (with +91), WhatsApp (Opt), City (Searchable dropdown), Areas (Multi-select pills based on city).
- **Step 2: KYC Verification**
  - **Fields:** File Uploaders (Aadhaar, PAN, Selfie).
  - **Logic:** Real-time upload tracking (`uploadingFile` status).
- **Step 3: Work Details**
  - **Fields:** Vehicle checkbox, Driving License upload (conditional), Experience (textarea), Availability radio buttons (Full/Part/Weekends).
- **Step 4: Payment Details**
  - **Fields:** UPI ID (Primary), Bank Name, Account Number, IFSC, Account Holder Name.
- **Step 5: Legal Agreements**
  - **Fields:** 5 Mandatory Checkboxes for compliance and terms.
- **Step 6: Review & Submit**
  - **Fields:** A summary layout reflecting all gathered info for a final check.

#### **Interactive Elements**
- **Navigation:** "Next" (validates current step) and "Previous" buttons.
- **Submit:** Triggers final API call to `/rider-applications`.
- **Success State:** Full-page "Application Submitted!" view with navigation back home.

---

## 3. Customer Experience (B2C)

### 3.1 Customer Home (`src/pages/CustomerHome.tsx`)
**Route:** `/customer`
**Purpose:** Discovery and dashboard for property seekers.

#### **Micro-Details**
- **Search & Navigation:**
  - **Inputs:** Search bar (city/locality), Voice search (triggers `VoiceSearch` component).
  - **Filters:** Slide-out drawer with Min/Max Rent and BHK selection.
  - **Tabs:** Bottom navigation for Home, Visits (Cart), Packers, Advertise, and Profile.
- **Active Tracking (Uber-style):**
  - **Components:** `CustomerVisitTracker` context and progress cards.
  - **States:** Pending (Finding Rider), Assigned (Rider info + Phone link), Arrived, Tour in Progress.
- **Lead Tracking:** Automatically tracks `property_click` and `search` events via `/leads/track`.
- **Property Discovery:**
  - **Grid:** Infinite scroll style grid of property cards.
  - **Interactions:** "Add to Cart" button (hover state), Redirect to detail on click.

---

### 3.2 Property Detail (`src/pages/PropertyDetail.tsx`)
**Route:** `/customer/property/:id`
**Purpose:** Full property specs and booking hub.

#### **Interactive Sections**
- **Premium Gallery:** 
  - Main image with Zoom-in lightbox. 
  - Multiple thumbnails with selection state.
  - Badges for "Hot" or "Verified" status.
- **Locked Location Info:**
  - Map and address are blurred and "Locked". 
  - Text: "Exact address available after booking".
- **Booking & Monetization:**
  - **Action 1:** "Add to Visit Cart" (multi-select strategy).
  - **Action 2:** Direct credit purchase (1 Visit @ ₹200, 3 Visits @ ₹350, 5 Visits @ ₹500).
  - **Action 3:** "Lock Property" (₹999) - Exclusive holding.
- **Information:**
  - Amenity tags, property specs (BHK, Furnishing), and description.
  - Explainer video ("How ApnaGhr Works").

---

### 3.3 Public Property View (`src/pages/PublicPropertyDetail.tsx`)
**Route:** `/property/:id`
**Purpose:** Public landing page for shared links and SEO.

#### **Conversion Funnel Logic**
- **Auth Trigger:** Clicking "Book Visit" triggers an `AuthPromptModal` (Continue vs. Sign In).
- **Referral Capture:** Parses `?ref=` query param to store lead attribution in `localStorage`.
- **Social Sharing:** "Share" button using native browser share API or clipboard copy.

---

### 3.4 Visit Cart & Checkout (`src/pages/VisitCart.tsx`)
**Route:** `/customer/cart`
**Purpose:** Transition from selection to active visit.

#### **Form & Logic Details**
- **Cart Listing:** Vertical list of selected properties with quick remove.
- **Package Selection:** 
  - Radio-style selectors for 1 (₹200), 3 (₹350), or 5 (₹500) visits.
  - Automatic validation: Disables package if `visits < cart.length`.
- **Scheduling Form:** 
  - Date and Time (Select) inputs.
  - Pickup Location: Text input + **Current Location GPS fetch** with reverse geocoding.
- **Legal Compliance:** 
  - Mandatory T&C checkbox linked to `TermsAcceptanceModal`.
  - Focus on anti-circumvention agreement.
- **Payment Trigger:** Integrates Cashfree SDK via `initiateCashfreePayment`.

---

### 3.5 My Visits / Bookings (`src/pages/CustomerBookings.tsx`)
**Route:** `/customer/bookings`
**Purpose:** Real-time visit management and history.

#### **Micro-Details**
- **Tab Layout:** Toggle between "Active" and "Completed" visits.
- **Live Tracker Modal:** 
  - Full-screen "Uber-style" interface.
  - Displays Rider Name, Phone Link, and **Live ETA (Minutes/KM)**.
  - "Open in Google Maps" deep link for actual navigation.
- **Status Progression:** 
  - Real-time updates: Finding Rider → On Way → At Customer → Tour Started → Completed.
  - Pulse animations and progress bars for multi-property visits.
- **Timeline View:** 
  - Vertical list of properties in the tour with "Visited" checkmarks.

---

### 3.6 Customer Profile & Wallet (`src/pages/CustomerProfile.tsx`)
**Route:** `/customer/profile`
**Purpose:** Account management and usage statistics.

#### **Micro-Details**
- **Stats Dashboard:** 3-column grid showing Total Visits, Total Spent (₹), and Properties Viewed.
- **Editable Profile:** Toggles fields for Name, Email, and Location (GPS enabled).
- **Navigation Menu:** Icon-based links to Payment History, Notifications, Support, and Privacy.
- **Notification Badge:** Displays unread count (e.g., "3").

---

### 3.7 Payment Success (`src/pages/PaymentSuccess.tsx`)
**Route:** `/payment-success`
**Purpose:** Verification and automated post-payment workflows.

#### **Micro-Details**
- **Verification Polling:** Backend polling for 20 attempts to verify "PAID" status.
- **Auto-Booking Logic:** Upon success, automatically calls `visitAPI.bookVisit` using data from `localStorage`.
- **Dynamic Messaging:** Tailored success UI for "Property Lock", "Visits", or "Advertising".

---

## 4. Rider Operations (B2R)

### 4.1 Rider Dashboard & Shift Management (`src/pages/RiderDashboard.tsx`)
**Route:** `/rider`
**Purpose:** Daily operations, request management, and earnings tracking.

#### **Core Logic & Micro-Details**
- **Shift Toggle:** 
  - Giant "Go Online/Offline" button. 
  - Captures current GPS coordinates on state change.
  - **Status Pulse:** Green breathing indicator when online.
- **Earning Banner:** Visual display of potential: "₹150/visit • 10 visits = ₹2000".
- **Acceptance Animation:** 
  - Multi-stage full-screen animation: Accepting → Earnings Display → Customer Details → Navigate.
  - Triggers automatic redirect to Google Maps for pickup.

---

### 4.2 Visit Workflow & Navigation
**Component Context:** `RiderDashboard.tsx`
**Purpose:** Guiding the rider through the property tour process.

#### **Workflow Steps**
1. **Pickup:** 
   - Displays Customer Name and Phone.
   - **Primary Action:** Large Blue "NAVIGATE TO PICKUP" button.
2. **At Customer:** 
   - Displays 4-digit OTP provided by customer.
   - Rider inputs OTP to proceed.
3. **At Property:** 
   - Displays "Exact Address" found only in rider view.
   - **Action:** "Upload Proof" (Selfie/Video at property gate).
4. **Multi-Property Logic:** Vertical progress list if cart contains >1 property.

---

### 4.3 Compliance & Proof (`components/VisitProofUpload.tsx` & `RiderDashboard.tsx`)
**Purpose:** Verification and anti-circumvention enforcement.

#### **Form Details**
- **Media Proof:** Requires 1 Selfie and 1 Video to be uploaded per property.
- **Compliance Modal (Mandatory):** 
  - Show after "Complete Property" or "Complete Visit".
  - **Questions:** 
    1. Were you with the client at all times?
    2. Did the client share their contact with the owner?
    3. Did you help in negotiations?
  - **Termination Logic:** Answering "Yes" to shared contact or negotiations flags a violation and terminates the visit immediately.

---

### 4.4 ToLet Tasks (Secondary Revenue)
**Purpose:** Paid tasks for board collection and property verification.

#### **Form Details**
- **Board Collection:**
  - Input: Number of boards collected.
  - Upload: Photos of boards as proof.
  - Result: Admin reviews and credits wallet.

---

### 4.5 Rider Profile & Settlements (`src/pages/RiderProfile.tsx`)
**Route:** `/rider/profile`
**Purpose:** KyC and Payment info.

#### **Micro-Details**
- **Profile Completion Meter:** Shows progress of KYC/Vehicle info.
- **Vehicle Info:** Fields for Type (Bike/Car) and plate number.
- **Bank Account Setup:** 
  - Form: Account Holder, Number, IFSC, UPI ID.
  - Verification: Masked display for security.
- **Payout Display:** Static or dynamic link to transition from wallet to bank.

---

## 5. Seller Operations (B2S)

### 5.1 Seller Dashboard & Work-From-Home Portal (`src/pages/SellerDashboard.tsx`)
**Route:** `/seller`
**Purpose:** Enabling independent agents to earn commissions by sharing properties and managing leads.

#### **Core Logic & Micro-Details**
- **Dual Reporting:**
  - **Daily Start:** Forced modal on first login to capture intent/task for the day.
  - **Daily End:** Forced modal on logout/exit to report activity summary.
- **Share Lock System:**
  - Account is automatically locked from sharing if > N client verifications are pending.
  - Users must verify previous referrals' visits before generating new links.
- **Referral Generation:**
  - Appends `?ref=[seller_id]` to property URLs.
  - Integrated "Native Share" API for WhatsApp/SMS.
- **Follow-up CRM:**
  - Status Timeline: `New Lead` → `Contacted` → `Interested` → `Negotiating` → `Closed Won/Lost`.
  - Field: `Brokerage Amount` (captured only on `Closed Won`).
  - Field: `Loss Reason` (captured only on `Closed Lost`).
- **Wallet Breakdown:** 4-tier display (Total, Pending, Approved, Paid).

---

## 6. Builder Operations (B2B)

### 6.1 Builder Dashboard (`src/pages/BuilderDashboard.tsx`)
**Route:** `/builder`
**Purpose:** Project management, lead attribution, and investor relations for developers.

#### **Form & Feature Details**
- **Project Phases (Strategic Tiers):**
  - **Pre-Pre Launch:** High-yield land investment phase. Focuses on ROI percentages and CLU dates. (Cost: ₹35,000).
  - **Pre-Launch:** Early booking phase. Focuses on booking amounts and RERA. (Cost: ₹16,799).
  - **Launched:** Standard sales phase. Focuses on site visits and unit availability.
- **Financial Tools:** Integrated EMI Calculator for calculating monthly payments based on loan tenure and interest.
- **Lead Attribution:** Detailed analytics per project (Views vs. Clicks vs. Inquiries vs. Site Visits).
- **Event Management:** Specialized tab for managing "Investor Events" for early-stage projects.

---

## 7. Advertiser Operations

### 7.1 "Advertise With Us" Portal (`src/pages/AdvertiseWithUs.tsx`)
**Route:** `/advertise`
**Purpose:** Self-serve ad placement for ecosystem partners (Packers, Furniture, etc.).

#### **Workflow Details**
1. **Tier Selection:** 4 Packages (Starter, Growth, Premium, Elite) with varying impression guarantees.
2. **AI Ad Generator (`components/AIAdGenerator`):** Form that uses AI to generate ad copy and design suggestions based on business type.
3. **Placement Map:** Interactive selection of ad locations (Home Page, Property Detail, Search Results).
4. **Checkout:** Direct integration with Cashfree for instant package activation.

---

## 8. Admin Control Center

### 8.1 Unified Admin Dashboard (`src/pages/AdminDashboard.tsx`)
**Route:** `/admin`
**Purpose:** Platform-wide oversight and operational control.

#### **Operational Panels**
- **Live Tracking:** Leaflet/Google Maps view showing real-time GPS locations of all "Online" Riders.
- **Visit Approvals:** Review queue for Rider-uploaded selfies/videos. Approving releases rider payment.
- **Inventory Mode:** Restricted access mode for data entry teams to only manage property listings.
- **Manual Operations:**
  - Create manual visits/visits via QR.
  - Process bulk payouts.
  - App settings control (Commission rates, Toggle features).
- **Lead Management:** Master lead board to reassign leads from Seller A to Seller B.
- **Support Panel:** Ticketing system for Customer/Rider/Seller queries.

---

## 9. Common Components & Design Tokens

### 9.1 Branding & UI Elements
- **Logo:** `Apna<span class="text-[#04473C]">Ghr</span>`.
- **Primary Color:** `#04473C` (Emerald).
- **Accent Color:** `#C6A87C` (Champagne Gold).
- **Typography:** 
  - Headings: `Playfair Display`.
  - Body: `Inter` / `Outfit`.
- **Component Patterns:**
  - `Neo-Card`: White background, subtle border, no shadow (clean premium).
  - `Kinetic-Loader`: Custom animated CSS loader.
  - `Glass-Header`: `backdrop-blur-xl` with semi-transparent white background.

---
