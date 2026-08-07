const prisma = require('../prisma/client');

const FORMAS = ['PIX', 'CARTAO', 'DINHEIRO', 'VALE_ALIMENTACAO'];

async function calcularResumo(caixa) {
  const fim = caixa.status === 'ABERTO' ? new Date() : caixa.fechadoEm;

  const pedidos = await prisma.pedido.findMany({
    where: {
      empresaId: caixa.empresaId,
      criadoEm: { gte: caixa.abertoEm, lte: fim },
      status: { not: 'CANCELADO' }
    },
    select: { valorTotal: true, formaPagamento: true }
  });

  const vendasPorFormaPagamento = Object.fromEntries(FORMAS.map((f) => [f, 0]));
  let totalVendas = 0;
  for (const p of pedidos) {
    const forma = p.formaPagamento || 'DINHEIRO';
    const valor = Number(p.valorTotal);
    vendasPorFormaPagamento[forma] = (vendasPorFormaPagamento[forma] || 0) + valor;
    totalVendas += valor;
  }

  const movimentacoes = await prisma.movimentacaoCaixa.findMany({
    where: { caixaId: caixa.id },
    orderBy: { criadoEm: 'desc' }
  });

  const totalSangrias = movimentacoes.filter((m) => m.tipo === 'SANGRIA').reduce((s, m) => s + Number(m.valor), 0);
  const totalSuprimentos = movimentacoes.filter((m) => m.tipo === 'SUPRIMENTO').reduce((s, m) => s + Number(m.valor), 0);

  const saldoDinheiroEsperado = Number(caixa.valorAbertura) + vendasPorFormaPagamento.DINHEIRO + totalSuprimentos - totalSangrias;

  return {
    totalPedidos: pedidos.length,
    totalVendas,
    vendasPorFormaPagamento,
    totalSangrias,
    totalSuprimentos,
    saldoDinheiroEsperado,
    movimentacoes
  };
}

async function obterAtual(req, res) {
  const caixa = await prisma.caixa.findFirst({
    where: { empresaId: req.usuario.empresaId, status: 'ABERTO' },
    include: { usuarioAbertura: { select: { nome: true } } }
  });

  if (!caixa) return res.json({ aberto: false });

  const resumo = await calcularResumo(caixa);
  res.json({ aberto: true, caixa, resumo });
}

async function abrir(req, res) {
  const { valorAbertura, observacoes } = req.body || {};
  if (valorAbertura === undefined || isNaN(Number(valorAbertura)) || Number(valorAbertura) < 0) {
    return res.status(400).json({ erro: 'Informe um valor de abertura válido.' });
  }

  const jaAberto = await prisma.caixa.findFirst({ where: { empresaId: req.usuario.empresaId, status: 'ABERTO' } });
  if (jaAberto) return res.status(400).json({ erro: 'Já existe um caixa aberto.' });

  const caixa = await prisma.caixa.create({
    data: {
      valorAbertura: Number(valorAbertura),
      observacoesAbertura: observacoes || null,
      empresaId: req.usuario.empresaId,
      usuarioAberturaId: req.usuario.id
    }
  });

  res.status(201).json(caixa);
}

function registrarMovimentacao(tipo) {
  return async (req, res) => {
    const { id } = req.params;
    const { valor, motivo } = req.body || {};

    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) return res.status(400).json({ erro: 'Informe um valor válido.' });
    if (!motivo || !motivo.trim()) return res.status(400).json({ erro: 'Informe o motivo.' });

    const caixa = await prisma.caixa.findFirst({ where: { id, empresaId: req.usuario.empresaId, status: 'ABERTO' } });
    if (!caixa) return res.status(404).json({ erro: 'Caixa aberto não encontrado.' });

    const movimentacao = await prisma.movimentacaoCaixa.create({
      data: { tipo, valor: Number(valor), motivo: motivo.trim(), caixaId: id, usuarioId: req.usuario.id }
    });

    res.status(201).json(movimentacao);
  };
}

async function fechar(req, res) {
  const { id } = req.params;
  const { valorFechamento, observacoes } = req.body || {};

  if (valorFechamento === undefined || isNaN(Number(valorFechamento)) || Number(valorFechamento) < 0) {
    return res.status(400).json({ erro: 'Informe o valor contado no fechamento.' });
  }

  const caixa = await prisma.caixa.findFirst({ where: { id, empresaId: req.usuario.empresaId, status: 'ABERTO' } });
  if (!caixa) return res.status(404).json({ erro: 'Caixa aberto não encontrado.' });

  const atualizado = await prisma.caixa.update({
    where: { id },
    data: {
      status: 'FECHADO',
      valorFechamento: Number(valorFechamento),
      observacoesFechamento: observacoes || null,
      fechadoEm: new Date(),
      usuarioFechamentoId: req.usuario.id
    }
  });

  const resumo = await calcularResumo(atualizado);
  const diferenca = Number(valorFechamento) - resumo.saldoDinheiroEsperado;

  res.json({ caixa: atualizado, resumo, diferenca });
}

async function historico(req, res) {
  const caixas = await prisma.caixa.findMany({
    where: { empresaId: req.usuario.empresaId, status: 'FECHADO' },
    include: {
      usuarioAbertura: { select: { nome: true } },
      usuarioFechamento: { select: { nome: true } }
    },
    orderBy: { fechadoEm: 'desc' },
    take: 50
  });
  res.json(caixas);
}

module.exports = {
  obterAtual,
  abrir,
  sangria: registrarMovimentacao('SANGRIA'),
  suprimento: registrarMovimentacao('SUPRIMENTO'),
  fechar,
  historico
};
