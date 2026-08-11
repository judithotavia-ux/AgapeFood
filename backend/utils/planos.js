const prisma = require('../prisma/client');

async function planoAtualDaEmpresa(empresaId) {
  const assinatura = await prisma.assinatura.findUnique({ where: { empresaId }, select: { plano: true } });
  return assinatura?.plano || null;
}

// Usa Plano.ordem como nivel (0 = Basico, 1 = Profissional, 2 = Completo, e assim por diante se
// novos planos forem criados entre os atuais). Bloqueio de assinatura vencida/cancelada ja e
// tratado antes disso, no autenticar - aqui so decide se o PLANO contratado inclui o recurso.
function exigirPlano(ordemMinima) {
  return async (req, res, next) => {
    try {
      const plano = await planoAtualDaEmpresa(req.usuario.empresaId);
      if (!plano || plano.ordem < ordemMinima) {
        return res.status(402).json({
          erro: 'Esse recurso não está disponível no seu plano atual. Faça upgrade para continuar.',
          precisaUpgrade: true,
          planoAtual: plano?.nome || null
        });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { exigirPlano, planoAtualDaEmpresa };
