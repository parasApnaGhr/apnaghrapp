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
};

export const paymentAPI = {
  createCheckout: (packageId, originUrl, propertyId) => 
    api.post('/payments/checkout', { package_id: packageId, origin_url: originUrl, property_id: propertyId }),
  getPaymentStatus: (sessionId) => api.get(`/payments/status/${sessionId}`),
};

export const visitAPI = {
  bookVisit: (data) => api.post('/visits/book', data),
  getMyBookings: () => api.get('/visits/my-bookings'),
  getAvailableVisits: () => api.get('/visits/available'),
  acceptVisit: (visitId) => api.post(`/visits/${visitId}/accept`),
};

export default api;