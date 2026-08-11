const jwt = require('jsonwebtoken');

function autenticarCliente(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ erro: 'Faça login para continuar.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.tipo !== 'CLIENTE') return res.status(401).json({ erro: 'Sessão inválida.' });
    req.cliente = payload;
  } catch (e) {
    return res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
  }

  next();
}

module.exports = { autenticarCliente };
