import api from './api';

export const listarPedidos = (params) => api.get('/pedidos', { params }).then((r) => r.data);
export const obterPedido = (id) => api.get(`/pedidos/${id}`).then((r) => r.data);
export const criarPedido = (dados) => api.post('/pedidos', dados).then((r) => r.data);
export const atualizarStatusPedido = (id, status) => api.patch(`/pedidos/${id}/status`, { status }).then((r) => r.data);
export const cancelarPedido = (id, dados) => api.patch(`/pedidos/${id}/cancelar`, dados).then((r) => r.data);
export const aplicarDescontoPedido = (id, dados) => api.patch(`/pedidos/${id}/desconto`, dados).then((r) => r.data);
