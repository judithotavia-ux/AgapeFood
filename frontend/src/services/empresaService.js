import api from './api';

export const registrarEmpresa = (dados) => api.post('/empresas/registrar', dados).then((r) => r.data);
export const buscarCnpj = (cnpj) => api.get(`/utilitarios/cnpj/${cnpj.replace(/\D/g, '')}`).then((r) => r.data);
export const buscarCep = (cep) => api.get(`/utilitarios/cep/${cep.replace(/\D/g, '')}`).then((r) => r.data);

export const obterIdentidadeVisual = () => api.get('/empresas/minha/identidade-visual').then((r) => r.data);
export const atualizarIdentidadeVisual = (formData) =>
  api.put('/empresas/minha/identidade-visual', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
