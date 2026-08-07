import api from './api';

export const listarMesas = () => api.get('/mesas').then((r) => r.data);
export const criarMesa = (dados) => api.post('/mesas', dados).then((r) => r.data);
export const excluirMesa = (id) => api.delete(`/mesas/${id}`);
