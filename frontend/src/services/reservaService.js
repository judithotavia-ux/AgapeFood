import api from './api';

export const listarReservas = (params) => api.get('/reservas', { params }).then((r) => r.data);
export const criarReserva = (dados) => api.post('/reservas', dados).then((r) => r.data);
export const atualizarStatusReserva = (id, status) => api.patch(`/reservas/${id}/status`, { status }).then((r) => r.data);
