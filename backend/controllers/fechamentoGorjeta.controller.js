const prisma = require('../prisma/client');

class ErroFechamento extends Error {
  constructor(status, erro) {
    super(erro);
    this.status = status;
    this.erro = erro;
  }
}

// Distribui fundoTotal entre pesos proporcionalmente, garantindo que a soma dos valores
// distribuidos bata exatamente com o fundo (resto do arredondamento vai pro ultimo item).
function distribuirComArredondamento(fundoTotal, itens) {
  const somaPesos = itens.reduce((s, i) => s + i.peso, 0);
  if (somaPesos <= 0) return itens.map((i) => ({ ...i, valor: 0 }));

  let somaDistribuida = 0;
  const resultado = itens.map((i) => {
    const valor = Math.round(fundoTotal * (i.peso / somaPesos) * 100) / 100;
    somaDistribuida += valor;
    return { ...i, valor };
  });

  const resto = Math.round((fundoTotal - somaDistribuida) * 100) / 100;
  if (resultado.length && resto !== 0) {
    resultado[resultado.length - 1].valor = Math.round((resultado[resultado.length - 1].valor + resto) * 100) / 100;
  }
  return resultado;
}

async function calcularDistribuicao(empresaId, { periodoInicio, periodoFim, horasPorGarcom = {}, pontosPorGarcom = {} }) {
  const config = await prisma.configuracaoGorjeta.findUnique({ where: { empresaId } });
  if (!config) throw new ErroFechamento(400, 'Configure a gorjeta antes de fechar.');

  const pedidosElegiveis = await prisma.pedido.findMany({
    where: {
      empresaId,
      criadoEm: { gte: periodoInicio, lte: periodoFim },
      status: { not: 'CANCELADO' },
      gorjetaValor: { gt: 0 },
      fechamentoGorjetaId: null,
      ...(config.modeloDistribuicao === 'INDIVIDUAL' ? { garcomId: { not: null } } : {})
    },
    select: { id: true, numero: true, valorTotal: true, gorjetaValor: true, garcomId: true }
  });

  const totalVendido = Math.round(pedidosElegiveis.reduce((s, p) => s + Number(p.valorTotal), 0) * 100) / 100;
  const totalGorjetas = Math.round(pedidosElegiveis.reduce((s, p) => s + Number(p.gorjetaValor), 0) * 100) / 100;

  if (pedidosElegiveis.length === 0) {
    throw new ErroFechamento(400, 'Nenhum pedido com gorjeta pendente de fechamento nesse período.');
  }

  let distribuicao = [];

  if (config.modeloDistribuicao === 'INDIVIDUAL') {
    const porGarcom = new Map();
    for (const p of pedidosElegiveis) {
      porGarcom.set(p.garcomId, (porGarcom.get(p.garcomId) || 0) + Number(p.gorjetaValor));
    }
    const garconsInfo = await prisma.usuario.findMany({ where: { id: { in: [...porGarcom.keys()] } }, select: { id: true, nome: true } });
    const nomeGarcom = new Map(garconsInfo.map((g) => [g.id, g.nome]));
    distribuicao = [...porGarcom.entries()].map(([garcomId, valor]) => ({
      garcomId,
      nome: nomeGarcom.get(garcomId),
      valor: Math.round(valor * 100) / 100,
      criterioTexto: 'Gorjeta dos próprios pedidos'
    }));
  } else {
    const garcons = await prisma.usuario.findMany({
      where: { empresaId, papel: 'GARCOM', statusGarcom: 'ATIVO' },
      select: { id: true, nome: true, percentualRateioGorjeta: true, pontosGorjeta: true }
    });
    if (!garcons.length) throw new ErroFechamento(400, 'Nenhum garçom ativo para receber o rateio.');

    let itens;
    if (config.regraRateio === 'IGUAL') {
      itens = garcons.map((g) => ({ garcomId: g.id, nome: g.nome, peso: 1, criterioTexto: 'Divisão igual' }));
    } else if (config.regraRateio === 'PERCENTUAL') {
      itens = garcons.map((g) => {
        const p = Number(g.percentualRateioGorjeta ?? 0);
        return { garcomId: g.id, nome: g.nome, peso: p, criterioTexto: `${p}% configurado` };
      });
      if (itens.every((i) => i.peso === 0)) throw new ErroFechamento(400, 'Nenhum garçom tem percentual de rateio configurado no cadastro.');
    } else if (config.regraRateio === 'HORAS') {
      itens = garcons.map((g) => {
        const h = Number(horasPorGarcom[g.id] ?? 0);
        return { garcomId: g.id, nome: g.nome, peso: h, criterioTexto: `${h}h trabalhadas` };
      });
      if (itens.every((i) => i.peso === 0)) throw new ErroFechamento(400, 'Informe as horas trabalhadas de cada garçom.');
    } else {
      itens = garcons.map((g) => {
        const pts = Number(pontosPorGarcom[g.id] ?? g.pontosGorjeta ?? 0);
        return { garcomId: g.id, nome: g.nome, peso: pts, criterioTexto: `${pts} pontos` };
      });
      if (itens.every((i) => i.peso === 0)) throw new ErroFechamento(400, 'Nenhum garçom tem pontos configurados no cadastro.');
    }

    distribuicao = distribuirComArredondamento(totalGorjetas, itens);
  }

  return { config, pedidosElegiveis, totalVendido, totalGorjetas, distribuicao };
}

function parsePeriodo(query) {
  const { periodoInicio, periodoFim } = query;
  if (!periodoInicio || !periodoFim) throw new ErroFechamento(400, 'Informe o período (início e fim).');
  const inicio = new Date(`${periodoInicio}T00:00:00`);
  const fim = new Date(`${periodoFim}T23:59:59.999`);
  if (isNaN(inicio) || isNaN(fim) || inicio > fim) throw new ErroFechamento(400, 'Período inválido.');
  return { inicio, fim };
}

async function preview(req, res) {
  try {
    const { inicio, fim } = parsePeriodo(req.query);
    const resultado = await calcularDistribuicao(req.usuario.empresaId, {
      periodoInicio: inicio, periodoFim: fim,
      horasPorGarcom: req.query.horas ? JSON.parse(req.query.horas) : {},
      pontosPorGarcom: req.query.pontos ? JSON.parse(req.query.pontos) : {}
    });
    res.json(resultado);
  } catch (erro) {
    if (erro instanceof ErroFechamento) return res.status(erro.status).json({ erro: erro.erro });
    throw erro;
  }
}

async function confirmar(req, res) {
  const { periodoInicio, periodoFim, horasPorGarcom = {}, pontosPorGarcom = {}, observacao } = req.body || {};
  if (!periodoInicio || !periodoFim) return res.status(400).json({ erro: 'Informe o período (início e fim).' });

  const inicio = new Date(`${periodoInicio}T00:00:00`);
  const fim = new Date(`${periodoFim}T23:59:59.999`);
  if (isNaN(inicio) || isNaN(fim) || inicio > fim) return res.status(400).json({ erro: 'Período inválido.' });

  try {
    const { config, pedidosElegiveis, totalVendido, totalGorjetas, distribuicao } = await calcularDistribuicao(req.usuario.empresaId, {
      periodoInicio: inicio, periodoFim: fim, horasPorGarcom, pontosPorGarcom
    });

    const fechamento = await prisma.$transaction(async (tx) => {
      const criado = await tx.fechamentoGorjeta.create({
        data: {
          empresaId: req.usuario.empresaId,
          periodoInicio: inicio,
          periodoFim: fim,
          modeloDistribuicao: config.modeloDistribuicao,
          regraRateio: config.modeloDistribuicao === 'COLETIVO' ? config.regraRateio : null,
          totalVendido,
          totalGorjetas,
          observacao: observacao || null,
          criadoPorId: req.usuario.id,
          distribuicoes: {
            create: distribuicao.map((d) => ({
              garcomId: d.garcomId,
              valor: d.valor,
              criterioTexto: d.criterioTexto
            }))
          }
        },
        include: { distribuicoes: { include: { garcom: { select: { id: true, nome: true, nomeExibicao: true } } } } }
      });

      await tx.pedido.updateMany({
        where: { id: { in: pedidosElegiveis.map((p) => p.id) } },
        data: { fechamentoGorjetaId: criado.id }
      });

      return criado;
    });

    res.status(201).json(fechamento);
  } catch (erro) {
    if (erro instanceof ErroFechamento) return res.status(erro.status).json({ erro: erro.erro });
    throw erro;
  }
}

async function listar(req, res) {
  const fechamentos = await prisma.fechamentoGorjeta.findMany({
    where: { empresaId: req.usuario.empresaId },
    orderBy: { criadoEm: 'desc' },
    take: 50,
    include: { criadoPor: { select: { nome: true } }, _count: { select: { distribuicoes: true, pedidos: true } } }
  });
  res.json(fechamentos);
}

async function obter(req, res) {
  const { id } = req.params;
  const fechamento = await prisma.fechamentoGorjeta.findFirst({
    where: { id, empresaId: req.usuario.empresaId },
    include: {
      distribuicoes: { include: { garcom: { select: { id: true, nome: true, nomeExibicao: true } } } },
      criadoPor: { select: { nome: true } },
      pedidos: { select: { id: true, numero: true, valorTotal: true, gorjetaValor: true } }
    }
  });
  if (!fechamento) return res.status(404).json({ erro: 'Fechamento não encontrado.' });
  res.json(fechamento);
}

async function cancelar(req, res) {
  const { id } = req.params;
  const fechamento = await prisma.fechamentoGorjeta.findFirst({
    where: { id, empresaId: req.usuario.empresaId },
    include: { distribuicoes: true }
  });
  if (!fechamento) return res.status(404).json({ erro: 'Fechamento não encontrado.' });
  if (fechamento.status === 'CANCELADO') return res.status(400).json({ erro: 'Esse fechamento já está cancelado.' });
  if (fechamento.distribuicoes.some((d) => d.status === 'PAGO')) {
    return res.status(400).json({ erro: 'Não é possível cancelar: já existem pagamentos registrados nesse fechamento.' });
  }

  await prisma.$transaction([
    prisma.fechamentoGorjeta.update({ where: { id }, data: { status: 'CANCELADO', canceladoEm: new Date() } }),
    prisma.distribuicaoGorjeta.updateMany({ where: { fechamentoId: id }, data: { status: 'CANCELADO' } }),
    prisma.pedido.updateMany({ where: { fechamentoGorjetaId: id }, data: { fechamentoGorjetaId: null } })
  ]);

  res.json({ mensagem: 'Fechamento cancelado. Os pedidos voltaram a ficar disponíveis para um novo fechamento.' });
}

async function marcarPago(req, res) {
  const { id, distribuicaoId } = req.params;
  const { formaPagamento, observacao } = req.body || {};

  const distribuicao = await prisma.distribuicaoGorjeta.findFirst({
    where: { id: distribuicaoId, fechamentoId: id, fechamento: { empresaId: req.usuario.empresaId } }
  });
  if (!distribuicao) return res.status(404).json({ erro: 'Distribuição não encontrada.' });
  if (distribuicao.status === 'PAGO') return res.status(400).json({ erro: 'Essa distribuição já foi paga.' });
  if (distribuicao.status === 'CANCELADO') return res.status(400).json({ erro: 'Essa distribuição foi cancelada.' });

  const atualizada = await prisma.distribuicaoGorjeta.update({
    where: { id: distribuicaoId },
    data: { status: 'PAGO', pagoEm: new Date(), formaPagamento: formaPagamento || null, observacao: observacao || null }
  });
  res.json(atualizada);
}

async function dashboard(req, res) {
  const empresaId = req.usuario.empresaId;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicioSemana = new Date(Date.now() - 7 * 86400000);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [pedidosHoje, pedidosSemana, pedidosMes, distribuicoes] = await Promise.all([
    prisma.pedido.findMany({ where: { empresaId, criadoEm: { gte: hoje }, status: { not: 'CANCELADO' } }, select: { gorjetaValor: true } }),
    prisma.pedido.findMany({ where: { empresaId, criadoEm: { gte: inicioSemana }, status: { not: 'CANCELADO' } }, select: { gorjetaValor: true } }),
    prisma.pedido.findMany({ where: { empresaId, criadoEm: { gte: inicioMes }, status: { not: 'CANCELADO' } }, select: { valorTotal: true, gorjetaValor: true, garcomId: true } }),
    prisma.distribuicaoGorjeta.findMany({
      where: { fechamento: { empresaId } },
      select: { valor: true, status: true, garcomId: true, garcom: { select: { nome: true, nomeExibicao: true } } }
    })
  ]);

  const somar = (lista, campo) => lista.reduce((s, i) => s + Number(i[campo]), 0);

  const porGarcomVendas = new Map();
  const porGarcomGorjeta = new Map();
  const nomesGarcom = new Map();
  for (const p of pedidosMes) {
    if (!p.garcomId) continue;
    porGarcomVendas.set(p.garcomId, (porGarcomVendas.get(p.garcomId) || 0) + Number(p.valorTotal));
    porGarcomGorjeta.set(p.garcomId, (porGarcomGorjeta.get(p.garcomId) || 0) + Number(p.gorjetaValor));
  }
  for (const d of distribuicoes) nomesGarcom.set(d.garcomId, d.garcom.nomeExibicao || d.garcom.nome);

  const idsSemNome = new Set([...porGarcomVendas.keys(), ...porGarcomGorjeta.keys()].filter((id) => !nomesGarcom.has(id)));
  if (idsSemNome.size > 0) {
    const garcons = await prisma.usuario.findMany({
      where: { id: { in: [...idsSemNome] } },
      select: { id: true, nome: true, nomeExibicao: true }
    });
    for (const g of garcons) nomesGarcom.set(g.id, g.nomeExibicao || g.nome);
  }

  function topDe(mapa) {
    let melhorId = null, melhorValor = -1;
    for (const [id, valor] of mapa) {
      if (valor > melhorValor) { melhorValor = valor; melhorId = id; }
    }
    return melhorId ? { garcomId: melhorId, nome: nomesGarcom.get(melhorId) || null, valor: Math.round(melhorValor * 100) / 100 } : null;
  }

  res.json({
    gorjetasHoje: Math.round(somar(pedidosHoje, 'gorjetaValor') * 100) / 100,
    gorjetasSemana: Math.round(somar(pedidosSemana, 'gorjetaValor') * 100) / 100,
    gorjetasMes: Math.round(somar(pedidosMes, 'gorjetaValor') * 100) / 100,
    totalPendente: Math.round(distribuicoes.filter((d) => d.status === 'PENDENTE').reduce((s, d) => s + Number(d.valor), 0) * 100) / 100,
    totalPago: Math.round(distribuicoes.filter((d) => d.status === 'PAGO').reduce((s, d) => s + Number(d.valor), 0) * 100) / 100,
    ticketMedioMes: pedidosMes.length ? Math.round((somar(pedidosMes, 'valorTotal') / pedidosMes.length) * 100) / 100 : 0,
    topVendedorMes: topDe(porGarcomVendas),
    topGorjetaMes: topDe(porGarcomGorjeta)
  });
}

async function relatorio(req, res) {
  const { periodoInicio, periodoFim, formato } = req.query;
  if (!periodoInicio || !periodoFim) return res.status(400).json({ erro: 'Informe o período.' });

  const inicio = new Date(`${periodoInicio}T00:00:00`);
  const fim = new Date(`${periodoFim}T23:59:59.999`);

  const [pedidos, distribuicoes] = await Promise.all([
    prisma.pedido.findMany({
      where: { empresaId: req.usuario.empresaId, criadoEm: { gte: inicio, lte: fim }, status: { not: 'CANCELADO' }, garcomId: { not: null } },
      select: { valorTotal: true, gorjetaValor: true, garcomId: true, garcom: { select: { nome: true, nomeExibicao: true } } }
    }),
    prisma.distribuicaoGorjeta.findMany({
      where: { fechamento: { empresaId: req.usuario.empresaId, periodoInicio: { gte: inicio }, periodoFim: { lte: fim } } },
      select: { valor: true, status: true, garcomId: true, garcom: { select: { nome: true, nomeExibicao: true } } }
    })
  ]);

  const linhas = new Map();
  function linha(garcomId, nome) {
    if (!linhas.has(garcomId)) linhas.set(garcomId, { garcom: nome, vendas: 0, gorjetaGerada: 0, gorjetaRateada: 0, gorjetaPaga: 0, gorjetaPendente: 0 });
    return linhas.get(garcomId);
  }
  for (const p of pedidos) {
    const l = linha(p.garcomId, p.garcom.nomeExibicao || p.garcom.nome);
    l.vendas += Number(p.valorTotal);
    l.gorjetaGerada += Number(p.gorjetaValor);
  }
  for (const d of distribuicoes) {
    const l = linha(d.garcomId, d.garcom.nomeExibicao || d.garcom.nome);
    l.gorjetaRateada += Number(d.valor);
    if (d.status === 'PAGO') l.gorjetaPaga += Number(d.valor);
    if (d.status === 'PENDENTE') l.gorjetaPendente += Number(d.valor);
  }

  const resultado = [...linhas.values()].map((l) => ({
    garcom: l.garcom,
    vendas: Math.round(l.vendas * 100) / 100,
    gorjetaGerada: Math.round(l.gorjetaGerada * 100) / 100,
    gorjetaRateada: Math.round(l.gorjetaRateada * 100) / 100,
    gorjetaPaga: Math.round(l.gorjetaPaga * 100) / 100,
    gorjetaPendente: Math.round(l.gorjetaPendente * 100) / 100
  }));

  if (formato === 'csv') {
    const cabecalho = 'Garcom;Vendas;Gorjeta Gerada;Gorjeta Rateada;Gorjeta Paga;Gorjeta Pendente';
    const linhasCsv = resultado.map((l) => [l.garcom, l.vendas, l.gorjetaGerada, l.gorjetaRateada, l.gorjetaPaga, l.gorjetaPendente].join(';'));
    const csv = [cabecalho, ...linhasCsv].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-gorjetas-${periodoInicio}-a-${periodoFim}.csv"`);
    return res.send('﻿' + csv);
  }

  res.json(resultado);
}

module.exports = { preview, confirmar, listar, obter, cancelar, marcarPago, dashboard, relatorio };
