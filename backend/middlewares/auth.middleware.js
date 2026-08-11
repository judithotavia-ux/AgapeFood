const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');
const { statusEfetivo } = require('../controllers/assinatura.controller');
const { sessaoValida } = require('../utils/sessoes');

// Rotas que continuam acessiveis mesmo com a assinatura vencida/cancelada - a empresa precisa
// conseguir ver e pagar a propria fatura mesmo estando bloqueada de usar o resto do sistema.
const PREFIXOS_LIVRES_DE_ASSINATURA = ['/api/assinatura', '/api/auth'];

async function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'Token não informado.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
  } catch (e) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }

  if (!(await sessaoValida(payload.jti))) {
    return res.status(401).json({ erro: 'Sessão encerrada. Faça login novamente.' });
  }

  if (PREFIXOS_LIVRES_DE_ASSINATURA.some((p) => req.baseUrl.startsWith(p)) || !payload.empresaId) {
    return next();
  }

  try {
    const assinatura = await prisma.assinatura.findUnique({ where: { empresaId: payload.empresaId } });
    const efetivo = statusEfetivo(assinatura);
    if (efetivo.bloqueado) {
      return res.status(402).json({ erro: efetivo.motivo || 'Assinatura inativa.', bloqueadoPorAssinatura: true });
    }
  } catch (e) {
    console.error('Erro ao verificar assinatura:', e);
  }

  next();
}

function exigirPapel(...papeisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !papeisPermitidos.includes(req.usuario.papel)) {
      return res.status(403).json({ erro: 'Você não tem permissão para esta ação.' });
    }
    next();
  };
}

module.exports = { autenticar, exigirPapel };
