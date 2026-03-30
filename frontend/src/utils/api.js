import axios from 'axios';

// In production, use relative URLs (same domain), in development use env variable
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

// Placeholder images for when uploads are missing
const PLACEHOLDER_IMAGES = {
  property: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
  ad: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80'
};

// Debug log for troubleshooting (only in development)
if (process.env.NODE_ENV === 'development' && !BACKEND_URL) {
  console.warn('REACT_APP_BACKEND_URL is not set, using relative URLs');
}

// Helper to fix image/video URLs - ensures full URL for uploaded files
// This handles all cases: external URLs, uploaded files, and relative paths
export const getMediaUrl = (url, type = 'default') => {
  if (!url) return PLACEHOLDER_IMAGES[type] || PLACEHOLDER_IMAGES.default;
  
  // If it's a data URL (base64), return as-is
  if (url.startsWith('data:')) {
    return url;
  }
  
  // If already a full URL (http/https)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Check if it's an upload URL that needs to be converted to /api/uploads/
    // This handles legacy URLs stored in database with /uploads/ path
    if (url.includes('/uploads/') && !url.includes('/api/uploads/')) {
      return url.replace('/uploads/', '/api/uploads/');
    }
    return url;
  }
  
  // If it's an upload path (handle both old /uploads/ and new /api/uploads/)
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    // Convert old /uploads/ path to /api/uploads/ for proper routing
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    const apiPath = cleanPath.replace('/uploads/', '/api/uploads/');
    return BACKEND_URL ? `${BACKEND_URL}${apiPath}` : apiPath;
  }
  
  // If it's already /api/uploads/ path
  if (url.startsWith('/api/uploads/') || url.startsWith('api/uploads/')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return BACKEND_URL ? `${BACKEND_URL}${cleanPath}` : cleanPath;
  }
  
  // For any other path, prefix with BACKEND_URL if available
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return BACKEND_URL ? `${BACKEND_URL}${cleanPath}` : cleanPath;
};

const api = axios.create({
  baseURL: API,
  timeout: 30000, // 30 second timeout
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized - clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (phone, password) => api.post('/auth/login', { phone, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const propertyAPI = {
  getProperties: (filters) => api.get('/properties', { params: filters }),
  getProperty: (id) => api.get(`/properties/${id}`),
  createProperty: (data) => api.post('/properties', data),
  updateProperty: (id, available) => api.patch(`/properties/${id}`, null, { params: { available } }),
  deleteProperty: (id) => api.delete(`/properties/${id}`),
};

export const paymentAPI = {
  // Cashfree checkout - supports visits, packers, and ads
  createCheckout: (packageId, originUrl, propertyId = null, bookingId = null, adId = null) => 
    api.post('/payments/checkout', { 
      package_id: packageId, 
      origin_url: originUrl, 
      property_id: propertyId,
      booking_id: bookingId,
      ad_id: adId
    }),
  getPaymentStatus: (orderId) => api.get(`/payments/status/${orderId}`),
};

export const packersAPI = {
  getPackages: () => api.get('/packers/packages'),
  book: (data) => api.post('/packers/book', data),
  getMyBookings: () => api.get('/packers/my-bookings'),
  getBooking: (id) => api.get(`/packers/booking/${id}`),
  cancelBooking: (id) => api.post(`/packers/booking/${id}/cancel`),
  pay: (bookingId, originUrl) => api.post('/packers/pay', { booking_id: bookingId, origin_url: originUrl }),
};

export const advertisingAPI = {
  getPackages: () => api.get('/advertising/packages'),
  createProfile: (data) => api.post('/advertising/profile', data),
  getProfile: () => api.get('/advertising/profile'),
  createAd: (data) => api.post('/advertising/ads', data),
  getMyAds: () => api.get('/advertising/ads'),
  getAd: (id) => api.get(`/advertising/ads/${id}`),
  pauseAd: (id) => api.post(`/advertising/ads/${id}/pause`),
  pay: (adId, originUrl) => api.post('/advertising/pay', { ad_id: adId, origin_url: originUrl }),
  getActiveAds: (placement) => api.get('/advertising/active', { params: { placement } }),
  // AI Ad Generation
  generateAd: (data) => api.post('/advertising/generate-ad', data),
  getGeneratedAds: () => api.get('/advertising/generated-ads'),
  deleteGeneratedAd: (adId) => api.delete(`/advertising/generated-ads/${adId}`),
};

export const visitAPI = {
  bookVisit: (data) => api.post('/visits/book', data),
  getMyBookings: () => api.get('/visits/my-bookings'),
  getAvailableVisits: () => api.get('/visits/available'),
  acceptVisit: (visitId) => api.post(`/visits/${visitId}/accept`),
  updateVisitStep: (visitId, action) => api.post(`/visits/${visitId}/update-step`, { action }),
  getVisitDetails: (visitId) => api.get(`/visits/${visitId}/details`),
  uploadProof: (visitId, formData) => api.post(`/visits/${visitId}/upload-proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const riderAPI = {
  // Shift management
  updateShift: (data) => api.post('/rider/shift', data),
  getShift: () => api.get('/rider/shift'),
  updateLocation: (lat, lng) => api.post('/rider/location', null, { params: { lat, lng } }),
  getActiveVisit: () => api.get('/rider/active-visit'),
  
  // Wallet
  getWallet: () => api.get('/rider/wallet'),
  getTransactions: () => api.get('/rider/wallet/transactions'),
  
  // ToLet Tasks
  getAvailableTasks: () => api.get('/tolet-tasks/available'),
  acceptTask: (taskId) => api.post(`/tolet-tasks/${taskId}/accept`),
  startTask: (taskId) => api.post(`/tolet-tasks/${taskId}/start`),
  completeTask: (taskId, data) => api.post(`/tolet-tasks/${taskId}/complete`, data),
};

export const toletAPI = {
  getAvailable: () => api.get('/tolet-tasks/available'),
  accept: (taskId) => api.post(`/tolet-tasks/${taskId}/accept`),
  start: (taskId) => api.post(`/tolet-tasks/${taskId}/start`),
  complete: (taskId, boardsCollected) => api.post(`/tolet-tasks/${taskId}/complete`, null, { params: { boards_collected: boardsCollected } }),
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markRead: (ids) => api.post('/notifications/mark-read', { notification_ids: ids }),
};

export const chatAPI = {
  sendMessage: (data) => api.post('/chat/send', data),
  getMessages: (otherUserId) => api.get(`/chat/messages/${otherUserId}`),
  getConversations: () => api.get('/chat/conversations'),
};

// AI Chatbot API
export const chatbotAPI = {
  sendMessage: (sessionId, message) => api.post('/chatbot/send', { session_id: sessionId, message }),
  getHistory: (sessionId) => api.get(`/chatbot/history/${sessionId}`),
  getSessions: () => api.get('/chatbot/sessions'),
  newSession: () => api.post('/chatbot/new-session'),
  deleteSession: (sessionId) => api.delete(`/chatbot/session/${sessionId}`),
};


export default api;