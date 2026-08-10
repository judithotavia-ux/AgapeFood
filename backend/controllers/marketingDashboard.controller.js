const prisma = require('../prisma/client');

async function resumo(req, res) {
  const empresaId = req.usuario.empresaId;
  const hoje = new Date();
  const ha30dias = new Date(hoje.getTime() - 30 * 86400000);
  const mesAtual = hoje.getMonth();

  const clientes = await prisma.cliente.findMany({
    where: { empresaId },
    include: { pedidos: { where: { status: { not: 'CANCELADO' } }, select: { valorTotal: true, criadoEm: true } } }
  });

  const clientesComStats = clientes.map((c) => {
    const totalGasto = c.pedidos.reduce((s, p) => s + Number(p.valorTotal), 0);
    const ultimoPedidoEm = c.pedidos.length
      ? c.pedidos.reduce((max, p) => (p.criadoEm > max ? p.criadoEm : max), c.pedidos[0].criadoEm)
      : null;
    return { id: c.id, totalPedidos: c.pedidos.length, totalGasto, ultimoPedidoEm, dataNascimento: c.dataNascimento };
  });

  const clientesAtivos = clientesComStats.filter((c) => c.ultimoPedidoEm && new Date(c.ultimoPedidoEm) >= ha30dias).length;
  const clientesInativos = clientesComStats.filter((c) => c.totalPedidos > 0 && (!c.ultimoPedidoEm || new Date(c.ultimoPedidoEm) < ha30dias)).length;
  const aniversariantesDoMes = clientesComStats.filter((c) => c.dataNascimento && new Date(c.dataNascimento).getMonth() === mesAtual).length;

  const [cupons, campanhas, avaliacoes, cashbackDistribuido] = await Promise.all([
    prisma.cupom.findMany({ where: { empresaId } }),
    prisma.campanha.findMany({ where: { empresaId }, include: { cupom: true } }),
    prisma.avaliacao.findMany({ where: { empresaId }, select: { nota: true } }),
    prisma.transacaoCashback.aggregate({
      where: { tipo: 'CREDITO', cliente: { empresaId } },
      _sum: { valor: true }
    })
  ]);

  const pedidosPorCupom = await prisma.pedido.groupBy({
    by: ['cupomId'],
    where: { empresaId, cupomId: { not: null }, status: { not: 'CANCELADO' } },
    _count: { id: true },
    _sum: { valorTotal: true }
  });
  const mapaConversao = new Map(pedidosPorCupom.map((p) => [p.cupomId, { conversoes: p._count.id, faturamento: Number(p._sum.valorTotal || 0) }]));

  const campanhasComMetricas = campanhas.map((c) => {
    const dados = c.cupomId ? mapaConversao.get(c.cupomId) : null;
    const faturamentoAtribuido = dados?.faturamento || 0;
    const custo = c.custo ? Number(c.custo) : 0;
    return {
      id: c.id, nome: c.nome, canal: c.canal, status: c.status,
      conversoes: dados?.conversoes || 0,
      faturamentoAtribuido,
      roi: custo > 0 ? ((faturamentoAtribuido - custo) / custo) * 100 : null
    };
  });

  const totalConversoesCampanhas = campanhasComMetricas.reduce((s, c) => s + c.conversoes, 0);
  const totalFaturamentoCampanhas = campanhasComMetricas.reduce((s, c) => s + c.faturamentoAtribuido, 0);
  const totalClientesAlcancados = clientes.length;
  const taxaConversao = totalClientesAlcancados > 0 ? (totalConversoesCampanhas / totalClientesAlcancados) * 100 : 0;

  const notaMedia = avaliacoes.length ? avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length : null;

  res.json({
    clientesAtivos,
    clientesInativos,
    totalClientes: clientes.length,
    aniversariantesDoMes,
    conversao: taxaConversao,
    faturamentoCampanhas: totalFaturamentoCampanhas,
    cupons: {
      total: cupons.length,
      ativos: cupons.filter((c) => c.ativo).length,
      totalUsos: cupons.reduce((s, c) => s + c.usosAtuais, 0)
    },
    campanhas: campanhasComMetricas,
    cashbackDistribuido: Number(cashbackDistribuido._sum.valor || 0),
    avaliacoes: { total: avaliacoes.length, notaMedia }
  });
}

async function horariosDePico(req, res) {
  const empresaId = req.usuario.empresaId;
  const ha90dias = new Date(Date.now() - 90 * 86400000);

  const pedidos = await prisma.pedido.findMany({
    where: { empresaId, criadoEm: { gte: ha90dias }, status: { not: 'CANCELADO' } },
    select: { criadoEm: true }
  });

  const porHora = Array.from({ length: 24 }, (_, h) => ({ hora: h, pedidos: 0 }));
  const porDiaSemana = Array.from({ length: 7 }, (_, d) => ({ diaSemana: d, pedidos: 0 }));
  pedidos.forEach((p) => {
    porHora[p.criadoEm.getHours()].pedidos += 1;
    porDiaSemana[p.criadoEm.getDay()].pedidos += 1;
  });

  res.json({ porHora, porDiaSemana, baseadoEm: `${pedidos.length} pedidos dos últimos 90 dias` });
}

module.exports = { resumo, horariosDePico };
