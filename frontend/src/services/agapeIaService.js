import api from './api';

export const enviarMensagem = (dados) => api.post('/agape-ia/chat', dados).then((r) => r.data);
export const listarConversasIA = () => api.get('/agape-ia/conversas').then((r) => r.data);
export const obterConversaIA = (id) => api.get(`/agape-ia/conversas/${id}`).then((r) => r.data);
export const excluirConversaIA = (id) => api.delete(`/agape-ia/conversas/${id}`);

export const obterDashboardIA = (dias) => api.get('/agape-ia/dashboard', { params: dias ? { dias } : {} }).then((r) => r.data);
export const obterUsoIA = () => api.get('/agape-ia/uso').then((r) => r.data);
export const atualizarTarefaIA = (id, status) => api.patch(`/agape-ia/tarefas/${id}`, { status }).then((r) => r.data);

// Configuração da chave da Anthropic (cada empresa configura e paga a própria)
export const obterConfigIA = () => api.get('/empresas/minha/ia-config').then((r) => r.data);
export const salvarConfigIA = (chaveAnthropic) => api.put('/empresas/minha/ia-config', { chaveAnthropic }).then((r) => r.data);
export const removerConfigIA = () => api.put('/empresas/minha/ia-config', { chaveAnthropic: '' }).then((r) => r.data);
