/* ═══════════════════════════════════════════════════════════════
   APNAGHR SHARED TYPE DEFINITIONS
   Central type registry for the entire frontend application.
   ═══════════════════════════════════════════════════════════════ */

// ─── Auth & User ───────────────────────────────────────────────

export type UserRole =
  | 'customer'
  | 'advertiser'
  | 'builder'
  | 'rider'
  | 'seller'
  | 'admin'
  | 'support_admin'
  | 'inventory_admin'
  | 'rider_admin';

export interface User {
  _id: string;
  name: string;
  phone: string;
  role: UserRole;
  email?: string;
  avatar?: string;
  city?: string;
  terms_accepted?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<User>;
  register: (data: RegisterPayload) => Promise<{ message: string }>;
  logout: () => void;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  password: string;
  role?: UserRole;
  email?: string;
  city?: string;
  [key: string]: unknown;
}

// ─── Property ──────────────────────────────────────────────────

export interface Property {
  _id: string;
  title?: string;
  type: string;
  category?: string;
  price: number;
  deposit?: number;
  city: string;
  area: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: string;
  images: string[];
  videos?: string[];
  description?: string;
  amenities?: string[];
  available?: boolean;
  verified?: boolean;
  seller_id?: string;
  seller_name?: string;
  location?: {
    lat: number;
    lng: number;
  };
  created_at?: string;
  [key: string]: unknown;
}

export interface PropertyFilters {
  city?: string;
  type?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  furnishing?: string;
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

// ─── Visit ─────────────────────────────────────────────────────

export type VisitStatus =
  | 'pending'
  | 'accepted'
  | 'rider_assigned'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Visit {
  _id: string;
  property_id: string;
  customer_id: string;
  rider_id?: string;
  status: VisitStatus;
  scheduled_date?: string;
  scheduled_time?: string;
  property?: Property;
  rider?: Partial<User>;
  payment_status?: string;
  proof_images?: string[];
  proof_video?: string;
  created_at?: string;
  [key: string]: unknown;
}

// ─── Payment ───────────────────────────────────────────────────

export interface PaymentCheckoutPayload {
  package_id: string;
  origin_url: string;
  property_id?: string | null;
  booking_id?: string | null;
  ad_id?: string | null;
}

export interface PaymentStatus {
  order_id: string;
  status: string;
  amount?: number;
  [key: string]: unknown;
}

// ─── Rider ─────────────────────────────────────────────────────

export interface RiderShift {
  is_active: boolean;
  start_time?: string;
  end_time?: string;
  [key: string]: unknown;
}

export interface RiderWallet {
  balance: number;
  total_earnings: number;
  pending_amount: number;
  [key: string]: unknown;
}

export interface RiderTransaction {
  _id: string;
  amount: number;
  type: string;
  description?: string;
  created_at: string;
  [key: string]: unknown;
}

// ─── Seller ────────────────────────────────────────────────────

export interface SellerDashboardData {
  total_referrals: number;
  total_visits: number;
  total_earnings: number;
  pending_earnings: number;
  [key: string]: unknown;
}

// ─── Notification ──────────────────────────────────────────────

export interface Notification {
  _id: string;
  user_id: string;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  created_at: string;
  [key: string]: unknown;
}

// ─── Chat ──────────────────────────────────────────────────────

export interface ChatMessage {
  _id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  [key: string]: unknown;
}

export interface Conversation {
  user_id: string;
  user_name: string;
  last_message: string;
  unread_count: number;
  updated_at: string;
  [key: string]: unknown;
}

// ─── Advertising ───────────────────────────────────────────────

export interface AdPackage {
  _id: string;
  name: string;
  price: number;
  duration_days: number;
  impressions: number;
  features: string[];
  [key: string]: unknown;
}

export interface Ad {
  _id: string;
  advertiser_id: string;
  title: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  placement?: string;
  status: string;
  package_id?: string;
  created_at: string;
  [key: string]: unknown;
}

// ─── Packers & Movers ─────────────────────────────────────────

export interface PackersPackage {
  _id: string;
  name: string;
  price: number;
  description?: string;
  features: string[];
  [key: string]: unknown;
}

export interface PackersBooking {
  _id: string;
  customer_id: string;
  package_id: string;
  status: string;
  from_address?: string;
  to_address?: string;
  scheduled_date?: string;
  payment_status?: string;
  created_at: string;
  [key: string]: unknown;
}

// ─── ToLet Tasks ───────────────────────────────────────────────

export interface ToLetTask {
  _id: string;
  status: string;
  area?: string;
  city?: string;
  boards_count?: number;
  assigned_rider?: string;
  created_at: string;
  [key: string]: unknown;
}

// ─── API Response Helpers ──────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
}

// ─── Component Props Helpers ───────────────────────────────────

export interface ChildrenProps {
  children: React.ReactNode;
}

export interface ProtectedRouteProps extends ChildrenProps {
  allowedRoles?: UserRole[];
}
