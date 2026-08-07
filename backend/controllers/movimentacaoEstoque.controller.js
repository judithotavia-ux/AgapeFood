const prisma = require('../prisma/client');

const TIPOS_ENTRADA = ['ENTRADA', 'PRODUCAO', 'COMPRA'];
const TIPOS_SAIDA = ['SAIDA', 'PERDA', 'QUEBRA', 'CONSUMO_INTERNO', 'VENDA', 'TRANSFERENCIA'];

async function listar(req, res) {
  const { produtoId, tipo } = req.query;
  const movimentacoes = await prisma.movimentacaoEstoque.findMany({
    where: {
      empresaId: req.usuario.empresaId,
      ...(produtoId ? { produtoId } : {}),
      ...(tipo ? { tipo } : {})
    },
    include: { produto: { select: { nome: true, unidade: true } }, usuario: { select: { nome: true } }, lote: true },
    orderBy: { criadoEm: 'desc' },
    take: 200
  });
  res.json(movimentacoes);
}

async function criar(req, res) {
  const { produtoId, tipo, quantidade, motivo, custoUnitario, loteId } = req.body || {};

  if (!produtoId) return res.status(400).json({ erro: 'Selecione o produto.' });
  if (!tipo) return res.status(400).json({ erro: 'Informe o tipo de movimentação.' });
  if (quantidade === undefined || isNaN(Number(quantidade))) return res.status(400).json({ erro: 'Informe a quantidade.' });

  const produto = await prisma.produto.findFirst({ where: { id: produtoId, empresaId: req.usuario.empresaId } });
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const qtd = Number(quantidade);
  let novoEstoque;
  let quantidadeMovimento = qtd;

  if (tipo === 'INVENTARIO') {
    novoEstoque = qtd;
    quantidadeMovimento = qtd - Number(produto.estoqueAtual);
  } else if (tipo === 'AJUSTE') {
    novoEstoque = Number(produto.estoqueAtual) + qtd;
  } else if (TIPOS_ENTRADA.includes(tipo)) {
    if (qtd <= 0) return res.status(400).json({ erro: 'A quantidade deve ser maior que zero.' });
    novoEstoque = Number(produto.estoqueAtual) + qtd;
  } else if (TIPOS_SAIDA.includes(tipo)) {
    if (qtd <= 0) return res.status(400).json({ erro: 'A quantidade deve ser maior que zero.' });
    if (qtd > Number(produto.estoqueAtual)) {
      return res.status(400).json({ erro: `Estoque insuficiente. Disponível: ${produto.estoqueAtual} ${produto.unidade || 'UN'}.` });
    }
    novoEstoque = Number(produto.estoqueAtual) - qtd;
    quantidadeMovimento = -qtd;
  } else {
    return res.status(400).json({ erro: 'Tipo de movimentação inválido.' });
  }

  if (novoEstoque < 0) novoEstoque = 0;

  const [movimentacao] = await prisma.$transaction([
    prisma.movimentacaoEstoque.create({
      data: {
        tipo,
        quantidade: quantidadeMovimento,
        custoUnitario: custoUnitario !== undefined ? Number(custoUnitario) : null,
        motivo: motivo || null,
        empresaId: req.usuario.empresaId,
        produtoId,
        loteId: loteId || null,
        usuarioId: req.usuario.id
      }
    }),
    prisma.produto.update({ where: { id: produtoId }, data: { estoqueAtual: novoEstoque } })
  ]);

  res.status(201).json(movimentacao);
}

module.exports = { listar, criar };
