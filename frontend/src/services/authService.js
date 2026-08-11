import api from './api';

export async function login(email, senha) {
  const { data } = await api.post('/auth/login', { email, senha });
  localStorage.setItem('agapefood_token', data.token);
  return data;
}

export function salvarToken(token) {
  localStorage.setItem('agapefood_token', token);
}

export async function buscarUsuarioLogado() {
  const { data } = await api.get('/auth/me');
  return data;
}

export function logout() {
  localStorage.removeItem('agapefood_token');
}

export function estaAutenticado() {
  return !!localStorage.getItem('agapefood_token');
}

export async function esqueciSenha(email) {
  const { data } = await api.post('/auth/esqueci-senha', { email });
  return data;
}

export async function redefinirSenha(token, novaSenha) {
  const { data } = await api.post('/auth/redefinir-senha', { token, novaSenha });
  return data;
}
