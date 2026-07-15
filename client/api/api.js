import axios from 'axios';

// Use relative path for API - works when frontend is served from same domain as backend
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Get stored token
export const getToken = () => localStorage.getItem('sahabat_token');
export const setToken = (token) => localStorage.setItem('sahabat_token', token);
export const removeToken = () => localStorage.removeItem('sahabat_token');

// Get stored user
export const getStoredUser = () => {
  const user = localStorage.getItem('sahabat_user');
  return user ? JSON.parse(user) : null;
};
export const setStoredUser = (user) => localStorage.setItem('sahabat_user', JSON.stringify(user));
export const removeStoredUser = () => localStorage.removeItem('sahabat_user');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add interceptor to handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout
      removeToken();
      removeStoredUser();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username, password) => api.post('/auth/login', { username, password });
export const getCurrentUser = () => api.get('/auth/me');
export const getUsers = () => api.get('/auth/users');
export const createUser = (data) => api.post('/auth/register', data);
export const updateUser = (id, data) => api.put(`/auth/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/auth/users/${id}`);

// Monitoring Points
export const getMonitoringPoints = () => api.get('/monitoring-points');
export const createMonitoringPoint = (data) => api.post('/monitoring-points', data);

// Reports
export const getReports = (params) => api.get('/reports', { params });
export const createReport = (formData) => api.post('/reports', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const getReportsByRW = (rw) => api.get(`/reports/rw/${rw}`);
export const getReportsAnnual = (year) => api.get(`/reports/annual/${year}`);

// Statistics
export const getFrequencyStats = () => api.get('/statistics/frequency');
export const getMonthlyStats = (year) => api.get(`/statistics/monthly/${year}`);
export const getRiskAreas = () => api.get('/statistics/risk-areas');
export const getStatisticsSummary = () => api.get('/statistics/summary');
export const getStatisticsCategories = () => api.get('/statistics/categories');

// Evacuation Centers
export const getEvacuationCenters = (params) => api.get('/evacuation-centers', { params });
export const getEvacuationCenter = (id) => api.get(`/evacuation-centers/${id}`);
export const createEvacuationCenter = (data) => api.post('/evacuation-centers', data);
export const updateEvacuationCenter = (id, data) => api.put(`/evacuation-centers/${id}`, data);
export const deleteEvacuationCenter = (id) => api.delete(`/evacuation-centers/${id}`);

// Evacuees
export const getEvacuees = (params) => api.get('/evacuees', { params });
export const getEvacuee = (id) => api.get(`/evacuees/${id}`);
export const createEvacuee = (data) => api.post('/evacuees', data);
export const updateEvacuee = (id, data) => api.put(`/evacuees/${id}`, data);
export const deleteEvacuee = (id) => api.delete(`/evacuees/${id}`);
export const getEvacueeStats = () => api.get('/evacuees/stats/summary');
export const getNeedsByCenter = () => api.get('/evacuees/needs-by-center');

// Population
export const getPopulationData = (params) => api.get('/population', { params });
export const getPopulationSummary = () => api.get('/population/summary');
export const createPopulationData = (data) => api.post('/population', data);
export const updatePopulationData = (id, data) => api.put(`/population/${id}`, data);
export const deletePopulationData = (id) => api.delete(`/population/${id}`);
export const seedPopulationData = () => api.post('/population/seed');

// Sensor Readings
export const getSensorReadings = (pointId) => api.get(`/sensor-readings/${pointId}`);
export const createSensorReading = (data) => api.post('/sensor-readings', data);

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);

export default api;
