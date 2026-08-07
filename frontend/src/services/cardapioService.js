import api from './api';

// Categorias
export const listarCategorias = () => api.get('/categorias').then((r) => r.data);
export const criarCategoria = (dados) => api.post('/categorias', dados).then((r) => r.data);
export const atualizarCategoria = (id, dados) => api.put(`/categorias/${id}`, dados).then((r) => r.data);
export const excluirCategoria = (id) => api.delete(`/categorias/${id}`);

// Produtos
export const listarProdutos = (params) => api.get('/produtos', { params }).then((r) => r.data);
export const obterProduto = (id) => api.get(`/produtos/${id}`).then((r) => r.data);

export function salvarProduto(id, dadosFormData) {
  const config = { headers: { 'Content-Type': 'multipart/form-data' } };
  return id
    ? api.put(`/produtos/${id}`, dadosFormData, config).then((r) => r.data)
    : api.post('/produtos', dadosFormData, config).then((r) => r.data);
}

export const excluirProduto = (id) => api.delete(`/produtos/${id}`);

export const adicionarAdicional = (produtoId, dados) => api.post(`/produtos/${produtoId}/adicionais`, dados).then((r) => r.data);
export const removerAdicional = (produtoId, adicionalId) => api.delete(`/produtos/${produtoId}/adicionais/${adicionalId}`);

// Público
export const buscarCardapioPublico = (slug) => api.get(`/publico/cardapio/${slug}`).then((r) => r.data);
