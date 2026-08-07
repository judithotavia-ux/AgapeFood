import api from './api';

export async function login(email, senha) {
  const { data } = await api.post('/auth/login', { email, senha });
  localStorage.setItem('agapefood_token', data.token);
  return data;
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
