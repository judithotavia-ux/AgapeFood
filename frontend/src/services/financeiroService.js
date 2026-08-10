import api from './api';

// Dashboard
export const obterResumoFinanceiro = (mes) => api.get('/financeiro/resumo', { params: mes ? { mes } : {} }).then((r) => r.data);
export const obterFluxoCaixa = (mes) => api.get('/financeiro/fluxo-caixa', { params: mes ? { mes } : {} }).then((r) => r.data);

// Categorias financeiras
export const listarCategoriasFinanceiras = (tipo) => api.get('/categorias-financeiras', { params: tipo ? { tipo } : {} }).then((r) => r.data);
export const criarCategoriaFinanceira = (dados) => api.post('/categorias-financeiras', dados).then((r) => r.data);
export const atualizarCategoriaFinanceira = (id, dados) => api.put(`/categorias-financeiras/${id}`, dados).then((r) => r.data);
export const excluirCategoriaFinanceira = (id) => api.delete(`/categorias-financeiras/${id}`);

// Contas a pagar
export const listarContasPagar = (params) => api.get('/contas-pagar', { params }).then((r) => r.data);
export const criarContaPagar = (dados) => api.post('/contas-pagar', dados).then((r) => r.data);
export const atualizarContaPagar = (id, dados) => api.put(`/contas-pagar/${id}`, dados).then((r) => r.data);
export const pagarContaPagar = (id, dados) => api.post(`/contas-pagar/${id}/pagar`, dados).then((r) => r.data);
export const cancelarContaPagar = (id) => api.post(`/contas-pagar/${id}/cancelar`).then((r) => r.data);
export const excluirContaPagar = (id) => api.delete(`/contas-pagar/${id}`);

// Contas a receber
export const listarContasReceber = (params) => api.get('/contas-receber', { params }).then((r) => r.data);
export const criarContaReceber = (dados) => api.post('/contas-receber', dados).then((r) => r.data);
export const atualizarContaReceber = (id, dados) => api.put(`/contas-receber/${id}`, dados).then((r) => r.data);
export const receberContaReceber = (id, dados) => api.post(`/contas-receber/${id}/receber`, dados).then((r) => r.data);
export const cancelarContaReceber = (id) => api.post(`/contas-receber/${id}/cancelar`).then((r) => r.data);
export const excluirContaReceber = (id) => api.delete(`/contas-receber/${id}`);
