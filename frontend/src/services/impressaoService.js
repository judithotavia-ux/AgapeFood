import api from './api';

// Impressoras
export const listarImpressoras = () => api.get('/impressoras').then((r) => r.data);
export const obterImpressora = (id) => api.get(`/impressoras/${id}`).then((r) => r.data);
export const criarImpressora = (dados) => api.post('/impressoras', dados).then((r) => r.data);
export const atualizarImpressora = (id, dados) => api.put(`/impressoras/${id}`, dados).then((r) => r.data);
export const excluirImpressora = (id) => api.delete(`/impressoras/${id}`);
export const testarImpressora = (id) => api.post(`/impressoras/${id}/testar`).then((r) => r.data);
export const preVisualizarImpressora = (id) => api.get(`/impressoras/${id}/pre-visualizar`).then((r) => r.data);

// Fila de impressão
export const listarPrintJobs = (params) => api.get('/print-jobs', { params }).then((r) => r.data);
export const obterPrintJob = (id) => api.get(`/print-jobs/${id}`).then((r) => r.data);
export const retryPrintJob = (id) => api.post(`/print-jobs/${id}/retry`).then((r) => r.data);
export const reimprimirPrintJob = (id) => api.post(`/print-jobs/${id}/reimprimir`).then((r) => r.data);
export const cancelarPrintJob = (id) => api.post(`/print-jobs/${id}/cancelar`).then((r) => r.data);
export const listarPrintLogs = () => api.get('/print-jobs/logs').then((r) => r.data);

// Dashboard de monitoramento
export const obterResumoImpressao = () => api.get('/impressao/resumo').then((r) => r.data);
