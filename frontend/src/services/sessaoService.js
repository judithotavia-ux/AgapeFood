import api from './api';

export const listarMinhasSessoes = () => api.get('/auth/minhas-sessoes').then((r) => r.data);
export const revogarMinhaSessao = (id) => api.post(`/auth/minhas-sessoes/${id}/revogar`).then((r) => r.data);
