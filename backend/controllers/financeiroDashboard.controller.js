const prisma = require('../prisma/client');

function inicioFimMes(referencia) {
  const inicio = new Date(referencia.getFullYear(), referencia.getMonth(), 1, 0, 0, 0, 0);
  const fim = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0, 23, 59, 59, 999);
  return { inicio, fim };
}

function chaveMes(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

// Compara por data (UTC, mesma convencao usada ao salvar "YYYY-MM-DD"), nunca por hora,
// pra uma conta vencendo hoje nao virar "vencida" so por causa do fuso do servidor.
function chaveDia(data) {
  return new Date(data).toISOString().slice(0, 10);
}

async function calcularPeriodo(empresaId, inicio, fim) {
  const [pedidos, contasPagas, contasRecebidas] = await Promise.all([
    prisma.pedido.findMany({
      where: { empresaId, criadoEm: { gte: inicio, lte: fim }, status: { not: 'CANCELADO' } },
      select: { valorTotal: true, formaPagamento: true }
    }),
    prisma.contaPagar.findMany({
      where: { empresaId, status: 'PAGO', pagoEm: { gte: inicio, lte: fim } },
      select: { valor: true, valorPago: true, categoria: { select: { nome: true } } }
    }),
    prisma.contaReceber.findMany({
      where: { empresaId, status: 'PAGO', recebidoEm: { gte: inicio, lte: fim } },
      select: { valor: true, valorRecebido: true }
    })
  ]);

  const entradasPedidos = pedidos.reduce((s, p) => s + Number(p.valorTotal), 0);
  const entradasContasReceber = contasRecebidas.reduce((s, c) => s + Number(c.valorRecebido ?? c.valor), 0);
  const entradas = entradasPedidos + entradasContasReceber;
  const saidas = contasPagas.reduce((s, c) => s + Number(c.valorPago ?? c.valor), 0);

  const despesasPorCategoria = {};
  contasPagas.forEach((c) => {
    const nome = c.categoria?.nome || 'Sem categoria';
    despesasPorCategoria[nome] = (despesasPorCategoria[nome] || 0) + Number(c.valorPago ?? c.valor);
  });

  return {
    entradas, saidas, lucro: entradas - saidas,
    entradasPedidos, entradasContasReceber,
    totalPedidos: pedidos.length,
    ticketMedio: pedidos.length ? entradasPedidos / pedidos.length : 0,
    despesasPorCategoria,
    porFormaPagamento: pedidos.reduce((acc, p) => {
      const chave = p.formaPagamento || 'NAO_INFORMADO';
      acc[chave] = (acc[chave] || 0) + Number(p.valorTotal);
      return acc;
    }, {})
  };
}

async function resumo(req, res) {
  const empresaId = req.usuario.empresaId;
  const referencia = req.query.mes ? new Date(`${req.query.mes}-01T00:00:00`) : new Date();
  const { inicio, fim } = inicioFimMes(referencia);

  const periodoAtual = await calcularPeriodo(empresaId, inicio, fim);

  // Saldo atual = todo o historico de entradas menos saidas (posicao acumulada, nao so do periodo)
  const inicioDosTempos = new Date(2000, 0, 1);
  const historicoCompleto = await calcularPeriodo(empresaId, inicioDosTempos, fim);
  const saldoAtual = historicoCompleto.entradas - historicoCompleto.saidas;

  const [contasPagarPendentes, contasReceberPendentes] = await Promise.all([
    prisma.contaPagar.findMany({ where: { empresaId, status: 'PENDENTE' }, select: { valor: true, vencimento: true } }),
    prisma.contaReceber.findMany({ where: { empresaId, status: 'PENDENTE' }, select: { valor: true, vencimento: true } })
  ]);

  const hojeChave = chaveDia(new Date());
  const em7diasChave = chaveDia(new Date(Date.now() + 7 * 86400000));

  const contasPagarResumo = {
    total: contasPagarPendentes.reduce((s, c) => s + Number(c.valor), 0),
    quantidade: contasPagarPendentes.length,
    vencidas: contasPagarPendentes.filter((c) => chaveDia(c.vencimento) < hojeChave).length,
    vencendoEm7Dias: contasPagarPendentes.filter((c) => chaveDia(c.vencimento) >= hojeChave && chaveDia(c.vencimento) <= em7diasChave).length
  };
  const contasReceberResumo = {
    total: contasReceberPendentes.reduce((s, c) => s + Number(c.valor), 0),
    quantidade: contasReceberPendentes.length,
    vencidas: contasReceberPendentes.filter((c) => chaveDia(c.vencimento) < hojeChave).length,
    vencendoEm7Dias: contasReceberPendentes.filter((c) => chaveDia(c.vencimento) >= hojeChave && chaveDia(c.vencimento) <= em7diasChave).length
  };

  // Comparativo dos ultimos 12 meses
  const grafico = [];
  for (let i = 11; i >= 0; i--) {
    const dataRef = new Date(referencia.getFullYear(), referencia.getMonth() - i, 1);
    const { inicio: ini, fim: f } = inicioFimMes(dataRef);
    const dadosMes = await calcularPeriodo(empresaId, ini, f);
    grafico.push({ mes: chaveMes(dataRef), entradas: dadosMes.entradas, saidas: dadosMes.saidas, lucro: dadosMes.lucro });
  }

  // Projecao (estatistica simples sobre historico real, NAO e machine learning)
  const ultimos3 = grafico.slice(-3);
  const mediaEntradas = ultimos3.reduce((s, m) => s + m.entradas, 0) / (ultimos3.length || 1);
  const mediaSaidas = ultimos3.reduce((s, m) => s + m.saidas, 0) / (ultimos3.length || 1);
  const tendenciaEntradas = ultimos3.length >= 2 ? (ultimos3[ultimos3.length - 1].entradas - ultimos3[0].entradas) / (ultimos3.length - 1) : 0;
  const tendenciaSaidas = ultimos3.length >= 2 ? (ultimos3[ultimos3.length - 1].saidas - ultimos3[0].saidas) / (ultimos3.length - 1) : 0;

  const projecaoProximoMes = {
    entradas: Math.max(0, mediaEntradas + tendenciaEntradas),
    saidas: Math.max(0, mediaSaidas + tendenciaSaidas),
    metodo: 'Média e tendência dos últimos 3 meses (projeção estatística sobre dados reais, não é IA preditiva)'
  };

  // Alertas de despesa (regra: categoria cresceu mais de 30% vs mes anterior)
  const mesAnterior = grafico[grafico.length - 2];
  const mesAtualGrafico = grafico[grafico.length - 1];
  const dataMesAnterior = new Date(referencia.getFullYear(), referencia.getMonth() - 1, 1);
  const { inicio: iniAnt, fim: fimAnt } = inicioFimMes(dataMesAnterior);
  const dadosMesAnterior = await calcularPeriodo(empresaId, iniAnt, fimAnt);

  const alertasDespesa = [];
  Object.entries(periodoAtual.despesasPorCategoria).forEach(([categoria, valorAtual]) => {
    const valorAnterior = dadosMesAnterior.despesasPorCategoria[categoria] || 0;
    if (valorAnterior > 0 && valorAtual > valorAnterior * 1.3) {
      alertasDespesa.push({
        categoria, valorAtual, valorAnterior,
        variacaoPercentual: ((valorAtual - valorAnterior) / valorAnterior) * 100
      });
    }
  });

  const margemLucro = periodoAtual.entradas > 0 ? (periodoAtual.lucro / periodoAtual.entradas) * 100 : 0;
  const saudeFinanceira = {
    margemLucro,
    classificacao: margemLucro >= 15 ? 'SAUDAVEL' : margemLucro >= 0 ? 'ATENCAO' : 'CRITICO'
  };

  res.json({
    periodo: { mes: chaveMes(referencia) },
    saldoAtual,
    entradas: periodoAtual.entradas,
    saidas: periodoAtual.saidas,
    lucro: periodoAtual.lucro,
    ticketMedio: periodoAtual.ticketMedio,
    totalPedidos: periodoAtual.totalPedidos,
    porFormaPagamento: periodoAtual.porFormaPagamento,
    dre: {
      receita: periodoAtual.entradas,
      despesasPorCategoria: Object.entries(periodoAtual.despesasPorCategoria).map(([categoria, valor]) => ({ categoria, valor })),
      totalDespesas: periodoAtual.saidas,
      resultado: periodoAtual.lucro
    },
    contasPagar: contasPagarResumo,
    contasReceber: contasReceberResumo,
    grafico,
    projecaoProximoMes,
    alertasDespesa,
    saudeFinanceira
  });
}

async function fluxoCaixa(req, res) {
  const empresaId = req.usuario.empresaId;
  const referencia = req.query.mes ? new Date(`${req.query.mes}-01T00:00:00`) : new Date();
  const { inicio, fim } = inicioFimMes(referencia);

  const [pedidos, contasPagas, contasRecebidas, movimentacoesCaixa] = await Promise.all([
    prisma.pedido.findMany({
      where: { empresaId, criadoEm: { gte: inicio, lte: fim }, status: { not: 'CANCELADO' } },
      select: { id: true, numero: true, valorTotal: true, criadoEm: true }
    }),
    prisma.contaPagar.findMany({
      where: { empresaId, status: 'PAGO', pagoEm: { gte: inicio, lte: fim } },
      select: { id: true, descricao: true, valor: true, valorPago: true, pagoEm: true }
    }),
    prisma.contaReceber.findMany({
      where: { empresaId, status: 'PAGO', recebidoEm: { gte: inicio, lte: fim } },
      select: { id: true, descricao: true, valor: true, valorRecebido: true, recebidoEm: true }
    }),
    prisma.movimentacaoCaixa.findMany({
      where: { caixa: { empresaId }, criadoEm: { gte: inicio, lte: fim } },
      select: { id: true, tipo: true, valor: true, motivo: true, criadoEm: true }
    })
  ]);

  const lancamentos = [
    ...pedidos.map((p) => ({ tipo: 'ENTRADA', origem: `Pedido #${p.numero}`, valor: Number(p.valorTotal), data: p.criadoEm })),
    ...contasRecebidas.map((c) => ({ tipo: 'ENTRADA', origem: c.descricao, valor: Number(c.valorRecebido ?? c.valor), data: c.recebidoEm })),
    ...contasPagas.map((c) => ({ tipo: 'SAIDA', origem: c.descricao, valor: Number(c.valorPago ?? c.valor), data: c.pagoEm })),
    ...movimentacoesCaixa.map((m) => ({
      tipo: m.tipo === 'SUPRIMENTO' ? 'ENTRADA' : 'SAIDA',
      origem: `${m.tipo === 'SUPRIMENTO' ? 'Suprimento' : 'Sangria'} de caixa — ${m.motivo}`,
      valor: Number(m.valor),
      data: m.criadoEm
    }))
  ].sort((a, b) => new Date(a.data) - new Date(b.data));

  let saldo = 0;
  const lancamentosComSaldo = lancamentos.map((l) => {
    saldo += l.tipo === 'ENTRADA' ? l.valor : -l.valor;
    return { ...l, saldoAcumulado: saldo };
  });

  res.json({
    periodo: { mes: chaveMes(referencia) },
    totalEntradas: lancamentos.filter((l) => l.tipo === 'ENTRADA').reduce((s, l) => s + l.valor, 0),
    totalSaidas: lancamentos.filter((l) => l.tipo === 'SAIDA').reduce((s, l) => s + l.valor, 0),
    lancamentos: lancamentosComSaldo.reverse()
  });
}

module.exports = { resumo, fluxoCaixa };
