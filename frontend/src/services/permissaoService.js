import api from './api';

export const listarCatalogoPermissoes = () => api.get('/permissoes').then((r) => r.data);
export const obterMinhasPermissoes = () => api.get('/permissoes/minhas').then((r) => r.data);
