import api from './api';

export const previewFechamento = (periodoInicio, periodoFim, extras = {}) =>
  api.get('/fechamentos-gorjeta/preview', {
    params: {
      periodoInicio, periodoFim,
      ...(extras.horas ? { horas: JSON.stringify(extras.horas) } : {}),
      ...(extras.pontos ? { pontos: JSON.stringify(extras.pontos) } : {})
    }
  }).then((r) => r.data);

export const confirmarFechamento = (dados) => api.post('/fechamentos-gorjeta', dados).then((r) => r.data);
export const listarFechamentos = () => api.get('/fechamentos-gorjeta').then((r) => r.data);
export const obterFechamento = (id) => api.get(`/fechamentos-gorjeta/${id}`).then((r) => r.data);
export const cancelarFechamento = (id) => api.post(`/fechamentos-gorjeta/${id}/cancelar`).then((r) => r.data);
export const marcarDistribuicaoPaga = (fechamentoId, distribuicaoId, dados) =>
  api.patch(`/fechamentos-gorjeta/${fechamentoId}/distribuicoes/${distribuicaoId}/pagar`, dados).then((r) => r.data);
