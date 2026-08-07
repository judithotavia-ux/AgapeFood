import api from './api';

export const obterCaixaAtual = () => api.get('/caixa/atual').then((r) => r.data);
export const listarHistoricoCaixa = () => api.get('/caixa/historico').then((r) => r.data);
export const abrirCaixa = (dados) => api.post('/caixa/abrir', dados).then((r) => r.data);
export const registrarSangria = (caixaId, dados) => api.post(`/caixa/${caixaId}/sangria`, dados).then((r) => r.data);
export const registrarSuprimento = (caixaId, dados) => api.post(`/caixa/${caixaId}/suprimento`, dados).then((r) => r.data);
export const fecharCaixa = (caixaId, dados) => api.post(`/caixa/${caixaId}/fechar`, dados).then((r) => r.data);
