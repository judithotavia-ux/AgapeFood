import api from './api';

export const listarPlanos = () => api.get('/assinatura/planos').then((r) => r.data);
export const obterMinhaAssinatura = () => api.get('/assinatura/minha').then((r) => r.data);
export const assinarPlano = (dados) => api.post('/assinatura/assinar', dados).then((r) => r.data);
export const cancelarAssinatura = (motivo) => api.post('/assinatura/cancelar', { motivo }).then((r) => r.data);
