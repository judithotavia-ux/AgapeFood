import apiCliente from './apiCliente';

export const meuPerfil = () => apiCliente.get('/cliente-portal/perfil').then((r) => r.data);
export const atualizarPerfil = (dados) => apiCliente.put('/cliente-portal/perfil', dados).then((r) => r.data);

export const listarEnderecos = () => apiCliente.get('/cliente-portal/enderecos').then((r) => r.data);
export const criarEndereco = (dados) => apiCliente.post('/cliente-portal/enderecos', dados).then((r) => r.data);
export const atualizarEndereco = (id, dados) => apiCliente.put(`/cliente-portal/enderecos/${id}`, dados).then((r) => r.data);
export const removerEndereco = (id) => apiCliente.delete(`/cliente-portal/enderecos/${id}`);

export const listarFavoritos = () => apiCliente.get('/cliente-portal/favoritos').then((r) => r.data);
export const adicionarFavorito = (produtoId) => apiCliente.post('/cliente-portal/favoritos', { produtoId }).then((r) => r.data);
export const removerFavorito = (produtoId) => apiCliente.delete(`/cliente-portal/favoritos/${produtoId}`);

export const meusPedidos = () => apiCliente.get('/cliente-portal/pedidos').then((r) => r.data);
