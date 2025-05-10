import axios from 'axios';

// Create an axios instance with the base URL
export const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 10000
});

// Add a request interceptor to handle authentication
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  response => {
    // If response contains info about email verification being disabled
    if (response.data?.message?.includes('email verification is currently disabled')) {
      console.info('Email verification is disabled on the server');
    }
    return response;
  },
  error => {
    // Log detailed error information for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default api;
