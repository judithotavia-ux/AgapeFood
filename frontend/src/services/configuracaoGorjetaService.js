import api from './api';

export const obterConfiguracaoGorjeta = () => api.get('/configuracao-gorjeta').then((r) => r.data);
export const atualizarConfiguracaoGorjeta = (dados) => api.put('/configuracao-gorjeta', dados).then((r) => r.data);
