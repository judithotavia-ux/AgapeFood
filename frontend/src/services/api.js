import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agapefood_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agapefood_token');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    if (error.response?.status === 402 && error.response?.data?.bloqueadoPorAssinatura) {
      if (window.location.pathname !== '/assinatura') window.location.href = '/assinatura';
    }
    return Promise.reject(error);
  }
);

export default api;
