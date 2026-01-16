/**
 * API service for backend communication
 */
import axios from 'axios';

// Use relative URL so it works with Vite proxy
const BASE_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

export const dataAPI = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/data/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  selectService: async (serviceNo) => {
    const response = await api.post('/api/data/select-service', {
      service_no: serviceNo,
    });
    return response.data;
  },

  getSynthese: async (year) => {
    const response = await api.get('/api/data/synthese', {
      params: { year },
    });
    return response.data;
  },

  getGraphiques: async (year) => {
    const response = await api.get('/api/data/graphiques', {
      params: { year },
    });
    return response.data;
  },
};

export const refacturationAPI = {
  getRefacturation: async (year) => {
    const response = await api.get('/api/refacturation', {
      params: { year },
    });
    return response.data;
  },
};

export const optimisationAPI = {
  getCurrentConfig: async () => {
    const response = await api.get('/api/optimisation/config-actuelle');
    return response.data;
  },

  simulate: async (nouvellePuissance) => {
    const response = await api.post('/api/optimisation/simulate', {
      nouvelle_puissance: nouvellePuissance,
    });
    return response.data;
  },
};

export const profilAPI = {
  getProfil: async () => {
    const response = await api.get('/api/data/profil');
    return response.data;
  },
};

export default api;
