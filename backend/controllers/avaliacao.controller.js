const prisma = require('../prisma/client');

async function listar(req, res) {
  const avaliacoes = await prisma.avaliacao.findMany({
    where: { empresaId: req.usuario.empresaId },
    include: { pedido: { select: { numero: true } }, cliente: { select: { nome: true, telefone: true } } },
    orderBy: { criadoEm: 'desc' },
    take: 200
  });
  res.json(avaliacoes);
}

// Publico: usado na tela de avaliacao pos-pedido (sem autenticacao, so com o id do pedido)
async function criarPublica(req, res) {
  const { pedidoId } = req.params;
  const { nota, comentario } = req.body || {};

  if (!nota || isNaN(Number(nota)) || Number(nota) < 1 || Number(nota) > 5) {
    return res.status(400).json({ erro: 'Informe uma nota de 1 a 5.' });
  }

  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId } });
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });

  const existente = await prisma.avaliacao.findUnique({ where: { pedidoId } });
  if (existente) return res.status(400).json({ erro: 'Esse pedido já foi avaliado.' });

  const avaliacao = await prisma.avaliacao.create({
    data: {
      nota: Number(nota),
      comentario: comentario || null,
      empresaId: pedido.empresaId,
      pedidoId,
      clienteId: pedido.clienteId || null
    }
  });
  res.status(201).json(avaliacao);
}

async function obterPublica(req, res) {
  const { pedidoId } = req.params;
  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId }, select: { id: true, numero: true, valorTotal: true } });
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });

  const avaliacao = await prisma.avaliacao.findUnique({ where: { pedidoId } });
  res.json({ pedido, jaAvaliado: !!avaliacao });
}

module.exports = { listar, criarPublica, obterPublica };
