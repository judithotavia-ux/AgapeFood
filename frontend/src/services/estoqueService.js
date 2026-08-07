import api from './api';

// Dashboard
export const obterResumoEstoque = () => api.get('/estoque/resumo').then((r) => r.data);

// Fornecedores
export const listarFornecedores = () => api.get('/fornecedores').then((r) => r.data);
export const criarFornecedor = (dados) => api.post('/fornecedores', dados).then((r) => r.data);
export const atualizarFornecedor = (id, dados) => api.put(`/fornecedores/${id}`, dados).then((r) => r.data);
export const excluirFornecedor = (id) => api.delete(`/fornecedores/${id}`);

// Lotes
export const listarLotes = (params) => api.get('/lotes', { params }).then((r) => r.data);
export const criarLote = (dados) => api.post('/lotes', dados).then((r) => r.data);

// Movimentações
export const listarMovimentacoes = (params) => api.get('/movimentacoes-estoque', { params }).then((r) => r.data);
export const criarMovimentacao = (dados) => api.post('/movimentacoes-estoque', dados).then((r) => r.data);

// Configuração de estoque do produto
export const atualizarEstoqueConfigProduto = (produtoId, dados) => api.put(`/produtos/${produtoId}/estoque-config`, dados).then((r) => r.data);
