import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// ─── API Base URL ──────────────────────────────────────────────

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const getApiBase = (): string => {
  if (BACKEND_URL) return `${BACKEND_URL}/api`;
  return '/api';
};

const API = getApiBase();

// ─── Placeholder images ───────────────────────────────────────

const PLACEHOLDER_IMAGES: Record<string, string> = {
  property: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
  ad: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80'
};

// Debug log for troubleshooting (only in development)
if (import.meta.env.DEV && !BACKEND_URL) {
  console.warn('VITE_BACKEND_URL is not set, using relative URLs');
}

// ─── Media URL helper ─────────────────────────────────────────

/**
 * Ensures the correct full URL for uploaded files, external URLs, and relative paths.
 */
export const getMediaUrl = (url: string | null | undefined, type: string = 'default'): string => {
  if (!url) return PLACEHOLDER_IMAGES[type] || PLACEHOLDER_IMAGES.default;

  // If it's a data URL (base64), return as-is
  if (url.startsWith('data:')) {
    return url;
  }

  // If already a full URL (http/https)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Check if it's an upload URL that needs to be converted to /api/uploads/
    if (url.includes('/uploads/') && !url.includes('/api/uploads/')) {
      return url.replace('/uploads/', '/api/uploads/');
    }
    return url;
  }

  // If it's an upload path (handle both old /uploads/ and new /api/uploads/)
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    const apiPath = cleanPath.replace('/uploads/', '/api/uploads/');
    return BACKEND_URL ? `${BACKEND_URL}${apiPath}` : apiPath;
  }

  // If it's already /api/uploads/ path
  if (url.startsWith('/api/uploads/') || url.startsWith('api/uploads/')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return BACKEND_URL ? `${BACKEND_URL}${cleanPath}` : cleanPath;
  }

  // If it's a MongoDB image path (/api/images/)
  if (url.startsWith('/api/images/') || url.startsWith('api/images/')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return BACKEND_URL ? `${BACKEND_URL}${cleanPath}` : cleanPath;
  }

  // For any other path, prefix with BACKEND_URL if available
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return BACKEND_URL ? `${BACKEND_URL}${cleanPath}` : cleanPath;
};

// ─── Axios instance ───────────────────────────────────────────

interface RetryConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
}

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const api = axios.create({
  baseURL: API,
  timeout: 30000,
});

api.interceptors.request.use((config: RetryConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.retryCount = config.retryCount || 0;
  return config;
});

// Handle response errors globally with retry
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (!config) return Promise.reject(error);

    // Retry on network errors or 5xx errors (not 401, 403, 404)
    const shouldRetry = (
      (config.retryCount ?? 0) < MAX_RETRIES &&
      (error.code === 'ECONNABORTED' ||
       error.code === 'ERR_NETWORK' ||
       (error.response?.status && error.response.status >= 500 && error.response.status < 600))
    );

    if (shouldRetry) {
      config.retryCount = (config.retryCount ?? 0) + 1;
      console.log(`Retrying request (${config.retryCount}/${MAX_RETRIES}):`, config.url);
      await sleep(RETRY_DELAY * config.retryCount);
      return api(config);
    }

    // Handle 401 unauthorized - clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ─── API namespaces ───────────────────────────────────────────

export const authAPI = {
  login: (phone: string, password: string) => api.post('/auth/login', { phone, password }),
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  acceptTerms: (data: Record<string, unknown>) => api.post('/auth/accept-terms', data),
  getTermsStatus: () => api.get('/auth/terms-status'),
};

export const propertyAPI = {
  getProperties: (filters?: Record<string, unknown>) => api.get('/properties', { params: filters }),
  getProperty: (id: string) => api.get(`/properties/${id}`),
  createProperty: (data: Record<string, unknown>) => api.post('/properties', data),
  updateProperty: (id: string, available: boolean) => api.patch(`/properties/${id}`, null, { params: { available } }),
  deleteProperty: (id: string) => api.delete(`/properties/${id}`),
};

export const paymentAPI = {
  createCheckout: (packageId: string, originUrl: string, propertyId: string | null = null, bookingId: string | null = null, adId: string | null = null) =>
    api.post('/payments/checkout', {
      package_id: packageId,
      origin_url: originUrl,
      property_id: propertyId,
      booking_id: bookingId,
      ad_id: adId
    }),
  getPaymentStatus: (orderId: string) => api.get(`/payments/status/${orderId}`),
};

export const packersAPI = {
  getPackages: () => api.get('/packers/packages'),
  book: (data: Record<string, unknown>) => api.post('/packers/book', data),
  getMyBookings: () => api.get('/packers/my-bookings'),
  getBooking: (id: string) => api.get(`/packers/booking/${id}`),
  cancelBooking: (id: string) => api.post(`/packers/booking/${id}/cancel`),
  pay: (bookingId: string, originUrl: string) => api.post('/packers/pay', { booking_id: bookingId, origin_url: originUrl }),
};

export const advertisingAPI = {
  getPackages: () => api.get('/advertising/packages'),
  createProfile: (data: Record<string, unknown>) => api.post('/advertising/profile', data),
  getProfile: () => api.get('/advertising/profile'),
  createAd: (data: Record<string, unknown>) => api.post('/advertising/ads', data),
  getMyAds: () => api.get('/advertising/ads'),
  getAd: (id: string) => api.get(`/advertising/ads/${id}`),
  pauseAd: (id: string) => api.post(`/advertising/ads/${id}/pause`),
  pay: (adId: string, originUrl: string) => api.post('/advertising/pay', { ad_id: adId, origin_url: originUrl }),
  getActiveAds: (placement?: string) => api.get('/advertising/active', { params: { placement } }),
  generateAd: (data: Record<string, unknown>) => api.post('/advertising/generate-ad', data),
  getGeneratedAds: () => api.get('/advertising/generated-ads'),
  deleteGeneratedAd: (adId: string) => api.delete(`/advertising/generated-ads/${adId}`),
};

export const visitAPI = {
  bookVisit: (data: Record<string, unknown>) => api.post('/visits/book', data),
  getMyBookings: () => api.get('/visits/my-bookings'),
  getAvailableVisits: () => api.get('/visits/available'),
  acceptVisit: (visitId: string) => api.post(`/visits/${visitId}/accept`),
  updateVisitStep: (visitId: string, action: string) => api.post(`/visits/${visitId}/update-step`, { action }),
  getVisitDetails: (visitId: string) => api.get(`/visits/${visitId}/details`),
  uploadProof: (visitId: string, formData: FormData) => api.post(`/visits/${visitId}/upload-proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  trackVisit: (visitId: string) => api.get(`/visits/${visitId}/track`),
};

export const riderAPI = {
  getRiders: () => api.get('/admin/riders'),
  updateShift: (data: Record<string, unknown>) => api.post('/rider/shift', data),
  getShift: () => api.get('/rider/shift'),
  updateLocation: (lat: number, lng: number) => api.post('/rider/location', null, { params: { lat, lng } }),
  getActiveVisit: () => api.get('/rider/active-visit'),
  getWallet: () => api.get('/rider/wallet'),
  getTransactions: () => api.get('/rider/wallet/transactions'),
  getAvailableTasks: () => api.get('/tolet-tasks/available'),
  acceptTask: (taskId: string) => api.post(`/tolet-tasks/${taskId}/accept`),
  startTask: (taskId: string) => api.post(`/tolet-tasks/${taskId}/start`),
  completeTask: (taskId: string, data: Record<string, unknown>) => api.post(`/tolet-tasks/${taskId}/complete`, data),
};

export const toletAPI = {
  getAvailable: () => api.get('/tolet-tasks/available'),
  accept: (taskId: string) => api.post(`/tolet-tasks/${taskId}/accept`),
  start: (taskId: string) => api.post(`/tolet-tasks/${taskId}/start`),
  complete: (taskId: string, boardsCollected: number) => api.post(`/tolet-tasks/${taskId}/complete`, null, { params: { boards_collected: boardsCollected } }),
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markRead: (ids: string[]) => api.post('/notifications/mark-read', { notification_ids: ids }),
};

export const chatAPI = {
  sendMessage: (data: Record<string, unknown>) => api.post('/chat/send', data),
  getMessages: (otherUserId: string) => api.get(`/chat/messages/${otherUserId}`),
  getConversations: () => api.get('/chat/conversations'),
};

export const chatbotAPI = {
  sendMessage: (sessionId: string, message: string) => api.post('/chatbot/send', { session_id: sessionId, message }),
  getHistory: (sessionId: string) => api.get(`/chatbot/history/${sessionId}`),
  getSessions: () => api.get('/chatbot/sessions'),
  newSession: () => api.post('/chatbot/new-session'),
  deleteSession: (sessionId: string) => api.delete(`/chatbot/session/${sessionId}`),
};

export const sellerAPI = {
  register: (data: Record<string, unknown>) => api.post('/seller/register', data),
  getDashboard: () => api.get('/seller/dashboard'),
  getProperties: (filters?: Record<string, unknown>) => api.get('/seller/properties', { params: filters }),
  shareProperty: (data: Record<string, unknown>) => api.post('/seller/share-property', data),
  getReferrals: (status?: string) => api.get('/seller/referrals', { params: { status } }),
  getVisits: () => api.get('/seller/visits'),
  trackVisit: (visitId: string) => api.get(`/seller/visit/${visitId}/track`),
  sendChatMessage: (visitId: string, message: string) => api.post('/seller/chat/send', { visit_id: visitId, message }),
  getChatMessages: (visitId: string) => api.get(`/seller/chat/${visitId}`),
  getWallet: () => api.get('/seller/wallet'),
  getCommissions: () => api.get('/seller/commissions'),
};

export const adminSellerAPI = {
  getAllSellers: (status?: string) => api.get('/admin/sellers', { params: { status } }),
  getPendingSellers: () => api.get('/admin/sellers/pending'),
  approveSeller: (sellerId: string, approved: boolean, reason?: string) => api.post(`/admin/sellers/${sellerId}/approve`, { approved, rejection_reason: reason }),
  createSeller: (data: Record<string, unknown>) => api.post('/admin/sellers/create', data),
  closeDeal: (visitId: string, brokerageAmount: number, notes?: string) => api.post(`/admin/deals/${visitId}/close`, { visit_id: visitId, brokerage_amount: brokerageAmount, notes }),
  processSellerPayout: (sellerId: string, amount: number) => api.post(`/admin/sellers/${sellerId}/payout`, null, { params: { amount } }),
};

export default api;
