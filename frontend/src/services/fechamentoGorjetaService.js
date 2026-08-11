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

export const obterDashboardGorjetas = () => api.get('/fechamentos-gorjeta/dashboard').then((r) => r.data);
export const obterRelatorioGorjetas = (periodoInicio, periodoFim) =>
  api.get('/fechamentos-gorjeta/relatorio', { params: { periodoInicio, periodoFim } }).then((r) => r.data);

export async function baixarRelatorioCsv(periodoInicio, periodoFim) {
  const resposta = await api.get('/fechamentos-gorjeta/relatorio', {
    params: { periodoInicio, periodoFim, formato: 'csv' },
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([resposta.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-gorjetas-${periodoInicio}-a-${periodoFim}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
