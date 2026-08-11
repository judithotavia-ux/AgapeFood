import axios from 'axios';

const apiCliente = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
});

apiCliente.interceptors.request.use((config) => {
  const token = localStorage.getItem('agapefood_cliente_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiCliente.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agapefood_cliente_token');
    }
    return Promise.reject(error);
  }
);

export default apiCliente;
