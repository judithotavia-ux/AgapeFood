const prisma = require('../prisma/client');
const { registrarAuditoria } = require('../utils/auditoria');

const PAPEIS_COM_LIMITE = ['FUNCIONARIO', 'GARCOM'];

async function listar(req, res) {
  const registros = await prisma.limiteAprovacao.findMany({ where: { empresaId: req.usuario.empresaId } });
  const porPapel = new Map(registros.map((r) => [r.papel, r]));

  const resultado = PAPEIS_COM_LIMITE.map((papel) => ({
    papel,
    limiteDescontoPercentual: porPapel.get(papel)?.limiteDescontoPercentual ?? null,
    limiteDescontoValor: porPapel.get(papel)?.limiteDescontoValor ?? null
  }));
  res.json(resultado);
}

async function atualizar(req, res) {
  const { papel } = req.params;
  if (!PAPEIS_COM_LIMITE.includes(papel)) return res.status(400).json({ erro: 'Papel inválido para limite de aprovação.' });

  const { limiteDescontoPercentual, limiteDescontoValor } = req.body || {};
  if (limiteDescontoPercentual !== null && limiteDescontoPercentual !== undefined) {
    const p = Number(limiteDescontoPercentual);
    if (isNaN(p) || p < 0 || p > 100) return res.status(400).json({ erro: 'Limite percentual deve estar entre 0 e 100.' });
  }
  if (limiteDescontoValor !== null && limiteDescontoValor !== undefined) {
    const v = Number(limiteDescontoValor);
    if (isNaN(v) || v < 0) return res.status(400).json({ erro: 'Limite em valor deve ser positivo.' });
  }

  const antes = await prisma.limiteAprovacao.findUnique({ where: { empresaId_papel: { empresaId: req.usuario.empresaId, papel } } });

  const registro = await prisma.limiteAprovacao.upsert({
    where: { empresaId_papel: { empresaId: req.usuario.empresaId, papel } },
    update: {
      limiteDescontoPercentual: limiteDescontoPercentual === '' || limiteDescontoPercentual === undefined ? undefined : limiteDescontoPercentual,
      limiteDescontoValor: limiteDescontoValor === '' || limiteDescontoValor === undefined ? undefined : limiteDescontoValor
    },
    create: {
      empresaId: req.usuario.empresaId,
      papel,
      limiteDescontoPercentual: limiteDescontoPercentual || null,
      limiteDescontoValor: limiteDescontoValor || null
    }
  });

  registrarAuditoria({
    empresaId: req.usuario.empresaId, usuarioId: req.usuario.id, ip: req.ip,
    acao: 'limite_aprovacao.atualizar', entidade: 'LimiteAprovacao', entidadeId: registro.id,
    valorAntes: antes, valorDepois: registro
  });

  res.json(registro);
}

module.exports = { listar, atualizar };
