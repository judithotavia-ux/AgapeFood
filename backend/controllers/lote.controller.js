const prisma = require('../prisma/client');

async function listar(req, res) {
  const { produtoId, vencidos, proximosVencer } = req.query;
  const hoje = new Date();
  const em7dias = new Date(hoje.getTime() + 7 * 86400000);

  const lotes = await prisma.lote.findMany({
    where: {
      produto: { empresaId: req.usuario.empresaId },
      ...(produtoId ? { produtoId } : {}),
      ...(vencidos === 'true' ? { dataValidade: { lt: hoje } } : {}),
      ...(proximosVencer === 'true' ? { dataValidade: { gte: hoje, lte: em7dias } } : {})
    },
    include: { produto: { select: { nome: true, unidade: true } }, fornecedor: { select: { nome: true } } },
    orderBy: { dataValidade: 'asc' }
  });
  res.json(lotes);
}

async function criar(req, res) {
  const { produtoId, numeroLote, quantidade, dataFabricacao, dataValidade, fornecedorId, custoUnitario } = req.body || {};

  if (!produtoId) return res.status(400).json({ erro: 'Selecione o produto.' });
  if (!numeroLote || !numeroLote.trim()) return res.status(400).json({ erro: 'Informe o número do lote.' });
  if (!quantidade || isNaN(Number(quantidade)) || Number(quantidade) <= 0) return res.status(400).json({ erro: 'Informe uma quantidade válida.' });

  const produto = await prisma.produto.findFirst({ where: { id: produtoId, empresaId: req.usuario.empresaId } });
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

  if (fornecedorId) {
    const fornecedor = await prisma.fornecedor.findFirst({ where: { id: fornecedorId, empresaId: req.usuario.empresaId } });
    if (!fornecedor) return res.status(400).json({ erro: 'Fornecedor inválido.' });
  }

  const qtd = Number(quantidade);

  const [lote] = await prisma.$transaction([
    prisma.lote.create({
      data: {
        numeroLote: numeroLote.trim(),
        quantidade: qtd,
        custoUnitario: custoUnitario !== undefined ? Number(custoUnitario) : null,
        dataFabricacao: dataFabricacao ? new Date(dataFabricacao) : null,
        dataValidade: dataValidade ? new Date(dataValidade) : null,
        produtoId,
        fornecedorId: fornecedorId || null
      }
    }),
    prisma.produto.update({ where: { id: produtoId }, data: { estoqueAtual: { increment: qtd } } })
  ]);

  await prisma.movimentacaoEstoque.create({
    data: {
      tipo: 'ENTRADA',
      quantidade: qtd,
      custoUnitario: custoUnitario !== undefined ? Number(custoUnitario) : null,
      motivo: `Recebimento do lote ${lote.numeroLote}`,
      empresaId: req.usuario.empresaId,
      produtoId,
      loteId: lote.id,
      usuarioId: req.usuario.id
    }
  });

  res.status(201).json(lote);
}

module.exports = { listar, criar };
