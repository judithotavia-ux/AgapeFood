const prisma = require('../prisma/client');

const TIPOS_ENTRADA = ['ENTRADA', 'PRODUCAO', 'COMPRA'];
const TIPOS_SAIDA = ['SAIDA', 'PERDA', 'QUEBRA', 'CONSUMO_INTERNO', 'VENDA', 'TRANSFERENCIA'];

async function resumo(req, res) {
  const empresaId = req.usuario.empresaId;
  const hoje = new Date();
  const em7dias = new Date(hoje.getTime() + 7 * 86400000);
  const ha30dias = new Date(hoje.getTime() - 30 * 86400000);
  const ha7dias = new Date(hoje.getTime() - 7 * 86400000);

  const produtos = await prisma.produto.findMany({
    where: { empresaId, controlaEstoque: true },
    select: { id: true, nome: true, estoqueAtual: true, estoqueMinimo: true, pontoReposicao: true, custo: true, unidade: true }
  });

  const valorTotalEstoque = produtos.reduce((s, p) => s + Number(p.estoqueAtual) * Number(p.custo || 0), 0);
  const produtosCadastrados = produtos.length;
  const produtosEstoqueBaixo = produtos.filter((p) => Number(p.estoqueAtual) <= Number(p.estoqueMinimo) && Number(p.estoqueMinimo) > 0);

  const lotesVencidos = await prisma.lote.findMany({
    where: { produto: { empresaId }, dataValidade: { lt: hoje } },
    include: { produto: { select: { nome: true } } },
    orderBy: { dataValidade: 'asc' },
    take: 20
  });

  const lotesProximosVencer = await prisma.lote.findMany({
    where: { produto: { empresaId }, dataValidade: { gte: hoje, lte: em7dias } },
    include: { produto: { select: { nome: true } } },
    orderBy: { dataValidade: 'asc' },
    take: 20
  });

  const produtosComMovimentoRecente = await prisma.movimentacaoEstoque.findMany({
    where: { empresaId, criadoEm: { gte: ha30dias } },
    select: { produtoId: true },
    distinct: ['produtoId']
  });
  const idsComMovimento = new Set(produtosComMovimentoRecente.map((m) => m.produtoId));
  const produtosSemMovimentacao = produtos.filter((p) => !idsComMovimento.has(p.id));

  const ultimasEntradas = await prisma.movimentacaoEstoque.findMany({
    where: { empresaId, tipo: { in: TIPOS_ENTRADA } },
    include: { produto: { select: { nome: true, unidade: true } } },
    orderBy: { criadoEm: 'desc' },
    take: 8
  });

  const ultimasSaidas = await prisma.movimentacaoEstoque.findMany({
    where: { empresaId, tipo: { in: TIPOS_SAIDA } },
    include: { produto: { select: { nome: true, unidade: true } } },
    orderBy: { criadoEm: 'desc' },
    take: 8
  });

  const movimentacoes7dias = await prisma.movimentacaoEstoque.findMany({
    where: { empresaId, criadoEm: { gte: ha7dias } },
    select: { tipo: true, quantidade: true, custoUnitario: true, criadoEm: true }
  });

  const graficoPorDia = {};
  for (let i = 6; i >= 0; i--) {
    const dia = new Date(hoje.getTime() - i * 86400000).toISOString().slice(0, 10);
    graficoPorDia[dia] = { dia, entradas: 0, saidas: 0, valorEntradas: 0, valorSaidas: 0 };
  }
  movimentacoes7dias.forEach((m) => {
    const dia = m.criadoEm.toISOString().slice(0, 10);
    if (!graficoPorDia[dia]) return;
    const valor = Math.abs(Number(m.quantidade)) * Number(m.custoUnitario || 0);
    if (TIPOS_ENTRADA.includes(m.tipo)) {
      graficoPorDia[dia].entradas += Math.abs(Number(m.quantidade));
      graficoPorDia[dia].valorEntradas += valor;
    } else if (TIPOS_SAIDA.includes(m.tipo)) {
      graficoPorDia[dia].saidas += Math.abs(Number(m.quantidade));
      graficoPorDia[dia].valorSaidas += valor;
    }
  });

  res.json({
    valorTotalEstoque,
    produtosCadastrados,
    produtosEstoqueBaixo,
    lotesVencidos,
    lotesProximosVencer,
    produtosSemMovimentacao,
    ultimasEntradas,
    ultimasSaidas,
    grafico: Object.values(graficoPorDia)
  });
}

module.exports = { resumo };
