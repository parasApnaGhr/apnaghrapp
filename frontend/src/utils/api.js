import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
  updateShift: (isOnline, lat, lng) => api.post('/rider/shift', { 
    is_online: isOnline, 
    current_lat: lat, 
    current_lng: lng 
  }),
  getShift: () => api.get('/rider/shift'),
  updateLocation: (lat, lng) => api.post('/rider/location', null, { params: { lat, lng } }),
  getActiveVisit: () => api.get('/rider/active-visit'),
  getWallet: () => api.get('/rider/wallet'),
  getTransactions: () => api.get('/rider/wallet/transactions'),
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


export default api;