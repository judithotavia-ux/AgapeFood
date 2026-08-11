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

module.exports = { preview, confirmar, listar, obter, cancelar, marcarPago };
