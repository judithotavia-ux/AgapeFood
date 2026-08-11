import apiCliente from './apiCliente';

const CHAVE_TOKEN = 'agapefood_cliente_token';

export const solicitarAcesso = (dados) => apiCliente.post('/cliente-auth/solicitar-acesso', dados).then((r) => r.data);

export async function verificarOtp(dados) {
  const { data } = await apiCliente.post('/cliente-auth/verificar-otp', dados);
  localStorage.setItem(CHAVE_TOKEN, data.token);
  return data;
}

export function logoutCliente() {
  localStorage.removeItem(CHAVE_TOKEN);
}

export function estaAutenticadoCliente() {
  return !!localStorage.getItem(CHAVE_TOKEN);
}
