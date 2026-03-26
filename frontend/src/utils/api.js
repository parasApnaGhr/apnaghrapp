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

export const riderAPI = {
  getRiders: (city) => api.get('/riders', { params: { city } }),
  getRider: (riderId) => api.get(`/riders/${riderId}`),
  createRider: (data) => api.post('/riders', data),
  toggleDuty: (riderId, data) => api.post(`/riders/${riderId}/duty`, data),
  updateLocation: (riderId, data) => api.post(`/riders/${riderId}/location`, data),
  getStats: (riderId) => api.get(`/riders/${riderId}/stats`),
};

export const siteVisitAPI = {
  getSiteVisits: (params) => api.get('/site-visits', { params }),
  createSiteVisit: (data) => api.post('/site-visits', data),
  updateSiteVisit: (visitId, data) => api.patch(`/site-visits/${visitId}`, data),
};

export const boardAPI = {
  getBoards: (city) => api.get('/tolet-boards', { params: { city } }),
  createBoard: (data) => api.post('/tolet-boards', data),
};

export const brokerAPI = {
  getBrokerVisits: (city) => api.get('/broker-visits', { params: { city } }),
  createBrokerVisit: (data) => api.post('/broker-visits', data),
};

export const dashboardAPI = {
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getCityManagerDashboard: () => api.get('/dashboard/city-manager'),
  getLeaderboard: () => api.get('/leaderboard'),
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markRead: (notifId) => api.patch(`/notifications/${notifId}/read`),
};

export default api;