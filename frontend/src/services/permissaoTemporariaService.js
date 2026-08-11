import api from './api';

export const listarPermissoesTemporarias = () => api.get('/permissoes-temporarias').then((r) => r.data);
export const concederPermissaoTemporaria = (dados) => api.post('/permissoes-temporarias', dados).then((r) => r.data);
export const revogarPermissaoTemporaria = (id) => api.post(`/permissoes-temporarias/${id}/revogar`).then((r) => r.data);
