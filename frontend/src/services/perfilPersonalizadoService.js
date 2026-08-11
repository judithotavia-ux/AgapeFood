import api from './api';

export const listarPerfis = () => api.get('/perfis-personalizados').then((r) => r.data);
export const criarPerfil = (dados) => api.post('/perfis-personalizados', dados).then((r) => r.data);
export const atualizarPerfil = (id, dados) => api.put(`/perfis-personalizados/${id}`, dados).then((r) => r.data);
export const removerPerfil = (id) => api.delete(`/perfis-personalizados/${id}`).then((r) => r.data);

export const listarUsuarios = () => api.get('/usuarios').then((r) => r.data);
export const atribuirPerfilAoUsuario = (usuarioId, perfilPersonalizadoId) =>
  api.put(`/usuarios/${usuarioId}/perfil-personalizado`, { perfilPersonalizadoId }).then((r) => r.data);
