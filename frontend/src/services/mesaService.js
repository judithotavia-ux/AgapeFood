import api from './api';

export const listarMesas = () => api.get('/mesas').then((r) => r.data);
export const criarMesa = (dados) => api.post('/mesas', dados).then((r) => r.data);
export const atualizarMesa = (id, dados) => api.put(`/mesas/${id}`, dados).then((r) => r.data);
export const excluirMesa = (id) => api.delete(`/mesas/${id}`);
export const obterComanda = (id) => api.get(`/mesas/${id}/comanda`).then((r) => r.data);
export const transferirMesa = (id, mesaDestinoId) => api.post(`/mesas/${id}/transferir`, { mesaDestinoId }).then((r) => r.data);
export const fecharMesa = (id) => api.post(`/mesas/${id}/fechar`).then((r) => r.data);
