import api from './api';

export const registrarEmpresa = (dados) => api.post('/empresas/registrar', dados).then((r) => r.data);
export const buscarCnpj = (cnpj) => api.get(`/utilitarios/cnpj/${cnpj.replace(/\D/g, '')}`).then((r) => r.data);
export const buscarCep = (cep) => api.get(`/utilitarios/cep/${cep.replace(/\D/g, '')}`).then((r) => r.data);
