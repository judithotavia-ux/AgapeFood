import api from './api';

// Dashboard
export const obterResumoMarketing = () => api.get('/marketing/resumo').then((r) => r.data);
export const obterHorariosDePico = () => api.get('/marketing/horarios-de-pico').then((r) => r.data);

// Configuração de cashback
export const obterMinhaEmpresa = () => api.get('/empresas/minha').then((r) => r.data);
export const atualizarCashback = (percentualCashback) => api.put('/empresas/minha/cashback', { percentualCashback }).then((r) => r.data);

// Clientes
export const listarClientes = (segmento) => api.get('/clientes', { params: segmento ? { segmento } : {} }).then((r) => r.data);
export const obterCliente = (id) => api.get(`/clientes/${id}`).then((r) => r.data);
export const atualizarCliente = (id, dados) => api.put(`/clientes/${id}`, dados).then((r) => r.data);

// Cupons
export const listarCupons = () => api.get('/cupons').then((r) => r.data);
export const criarCupom = (dados) => api.post('/cupons', dados).then((r) => r.data);
export const atualizarCupom = (id, dados) => api.put(`/cupons/${id}`, dados).then((r) => r.data);
export const excluirCupom = (id) => api.delete(`/cupons/${id}`);

// Campanhas
export const listarCampanhas = () => api.get('/campanhas').then((r) => r.data);
export const criarCampanha = (dados) => api.post('/campanhas', dados).then((r) => r.data);
export const atualizarCampanha = (id, dados) => api.put(`/campanhas/${id}`, dados).then((r) => r.data);
export const excluirCampanha = (id) => api.delete(`/campanhas/${id}`);

// Avaliações
export const listarAvaliacoes = () => api.get('/avaliacoes').then((r) => r.data);

// IA Marketing
export const gerarTextoIA = (dados) => api.post('/ia-marketing/gerar-texto', dados).then((r) => r.data);

// Avaliação pública (pós-pedido, sem login)
export const obterAvaliacaoPublica = (pedidoId) => api.get(`/avaliacoes/publica/${pedidoId}`).then((r) => r.data);
export const criarAvaliacaoPublica = (pedidoId, dados) => api.post(`/avaliacoes/publica/${pedidoId}`, dados).then((r) => r.data);
