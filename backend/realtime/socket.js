const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || '*' }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Token não informado.'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.usuario = payload;
      next();
    } catch (e) {
      next(new Error('Token inválido ou expirado.'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`empresa:${socket.usuario.empresaId}`);
  });

  return io;
}

function emitirParaEmpresa(empresaId, evento, dados) {
  if (!io) return;
  io.to(`empresa:${empresaId}`).emit(evento, dados);
}

module.exports = { initSocket, emitirParaEmpresa };
