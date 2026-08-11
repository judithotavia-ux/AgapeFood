import api from './api';

export const obterStatusPin = () => api.get('/auth/meu-pin').then((r) => r.data);
export const definirPin = (pin, senhaAtual) => api.put('/auth/meu-pin', { pin, senhaAtual }).then((r) => r.data);
export const removerPin = () => api.delete('/auth/meu-pin').then((r) => r.data);

export const listarLimitesAprovacao = () => api.get('/limites-aprovacao').then((r) => r.data);
export const atualizarLimiteAprovacao = (papel, dados) => api.put(`/limites-aprovacao/${papel}`, dados).then((r) => r.data);
