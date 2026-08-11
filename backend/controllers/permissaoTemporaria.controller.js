const prisma = require('../prisma/client');

const SELECAO = {
  id: true, validaAte: true, motivo: true, criadoEm: true, revogadaEm: true,
  usuario: { select: { id: true, nome: true } },
  permissao: { select: { chave: true, descricao: true } },
  concedidaPor: { select: { id: true, nome: true } }
};

async function listar(req, res) {
  const concessoes = await prisma.permissaoTemporaria.findMany({
    where: { empresaId: req.usuario.empresaId },
    select: SELECAO,
    orderBy: { criadoEm: 'desc' },
    take: 100
  });
  res.json(concessoes);
}

async function conceder(req, res) {
  const { usuarioId, permissaoChave, validaAte, motivo } = req.body || {};
  if (!usuarioId || !permissaoChave || !validaAte) {
    return res.status(400).json({ erro: 'Informe usuário, permissão e até quando ela vale.' });
  }

  const dataValidade = new Date(validaAte);
  if (isNaN(dataValidade.getTime()) || dataValidade <= new Date()) {
    return res.status(400).json({ erro: 'A validade precisa ser uma data/hora no futuro.' });
  }

  const usuario = await prisma.usuario.findFirst({ where: { id: usuarioId, empresaId: req.usuario.empresaId } });
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const permissao = await prisma.permissao.findUnique({ where: { chave: permissaoChave } });
  if (!permissao) return res.status(400).json({ erro: 'Permissão inválida.' });

  const concessao = await prisma.permissaoTemporaria.create({
    data: {
      empresaId: req.usuario.empresaId,
      usuarioId,
      permissaoId: permissao.id,
      concedidaPorId: req.usuario.id,
      validaAte: dataValidade,
      motivo: motivo || null
    },
    select: SELECAO
  });
  res.status(201).json(concessao);
}

async function revogar(req, res) {
  const { id } = req.params;
  const existente = await prisma.permissaoTemporaria.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!existente) return res.status(404).json({ erro: 'Concessão não encontrada.' });
  if (existente.revogadaEm) return res.status(400).json({ erro: 'Essa concessão já foi revogada.' });

  const atualizada = await prisma.permissaoTemporaria.update({ where: { id }, data: { revogadaEm: new Date() }, select: SELECAO });
  res.json(atualizada);
}

module.exports = { listar, conceder, revogar };
