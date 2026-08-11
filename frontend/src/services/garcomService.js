import api from './api';

export const listarGarcons = () => api.get('/garcons').then((r) => r.data);
export const obterGarcom = (id) => api.get(`/garcons/${id}`).then((r) => r.data);
export const criarGarcom = (dados) => api.post('/garcons', dados).then((r) => r.data);
export const atualizarGarcom = (id, dados) => api.put(`/garcons/${id}`, dados).then((r) => r.data);
export const redefinirSenhaGarcom = (id, novaSenha) => api.put(`/garcons/${id}/senha`, { novaSenha }).then((r) => r.data);
export const desativarGarcom = (id) => api.delete(`/garcons/${id}`).then((r) => r.data);
export const obterMeuDesempenho = () => api.get('/garcons/meu-desempenho').then((r) => r.data);
