import api from './api';

// Canais de entrega (Motoboy Próprio / iFood / Uber Eats / 99Food)
export const listarCanaisEntrega = () => api.get('/canais-entrega').then((r) => r.data);
export const atualizarCanalEntrega = (id, ativo) => api.put(`/canais-entrega/${id}`, { ativo }).then((r) => r.data);
export const regenerarTokenCanal = (id) => api.post(`/canais-entrega/${id}/regenerar-token`).then((r) => r.data);

// Motoboys
export const listarMotoboys = () => api.get('/motoboys').then((r) => r.data);
export const resumoGanhosMotoboys = () => api.get('/motoboys/resumo').then((r) => r.data);
export const criarMotoboy = (dados) => api.post('/motoboys', dados).then((r) => r.data);
export const atualizarMotoboy = (id, dados) => api.put(`/motoboys/${id}`, dados).then((r) => r.data);
export const excluirMotoboy = (id) => api.delete(`/motoboys/${id}`);

// Zonas de entrega
export const listarZonasEntrega = () => api.get('/zonas-entrega').then((r) => r.data);
export const criarZonaEntrega = (dados) => api.post('/zonas-entrega', dados).then((r) => r.data);
export const atualizarZonaEntrega = (id, dados) => api.put(`/zonas-entrega/${id}`, dados).then((r) => r.data);
export const excluirZonaEntrega = (id) => api.delete(`/zonas-entrega/${id}`);
