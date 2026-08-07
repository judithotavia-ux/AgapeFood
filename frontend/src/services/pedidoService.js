import api from './api';

export const listarPedidos = (params) => api.get('/pedidos', { params }).then((r) => r.data);
export const obterPedido = (id) => api.get(`/pedidos/${id}`).then((r) => r.data);
export const criarPedido = (dados) => api.post('/pedidos', dados).then((r) => r.data);
export const atualizarStatusPedido = (id, status) => api.patch(`/pedidos/${id}/status`, { status }).then((r) => r.data);
export const cancelarPedido = (id) => api.patch(`/pedidos/${id}/cancelar`).then((r) => r.data);
