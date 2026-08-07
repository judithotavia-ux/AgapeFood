import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3333/api').replace(/\/api$/, '');

let socket = null;

export function conectarSocket() {
  const token = localStorage.getItem('agapefood_token');
  if (!token) return null;

  if (socket) {
    if (socket.connected) return socket;
    socket.disconnect();
  }

  // Fica só em long-polling: o upgrade pra websocket trava atrás do proxy do Railway
  // (a sessao HTTP funciona, mas o upgrade nunca fecha a conexao do lado do navegador).
  socket = io(SOCKET_URL, { auth: { token }, transports: ['polling'], upgrade: false });
  return socket;
}

export function obterSocket() {
  return socket;
}

export function desconectarSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
