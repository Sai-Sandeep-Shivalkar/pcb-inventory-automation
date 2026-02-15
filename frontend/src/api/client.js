import axios from 'axios';

const defaultApiBase = (() => {
  if (typeof window === 'undefined') return 'http://127.0.0.1:5001/api';
  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  return `http://${host}:5001/api`;
})();

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiBase,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
