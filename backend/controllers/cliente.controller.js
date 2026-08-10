const prisma = require('../prisma/client');

function comEstatisticas(cliente) {
  const pedidosValidos = cliente.pedidos;
  const totalPedidos = pedidosValidos.length;
  const totalGasto = pedidosValidos.reduce((s, p) => s + Number(p.valorTotal), 0);
  const ultimoPedidoEm = pedidosValidos.length
    ? pedidosValidos.reduce((max, p) => (p.criadoEm > max ? p.criadoEm : max), pedidosValidos[0].criadoEm)
    : null;
  const { pedidos, ...resto } = cliente;
  return { ...resto, totalPedidos, totalGasto, ultimoPedidoEm };
}

async function listar(req, res) {
  const { segmento } = req.query;
  const empresaId = req.usuario.empresaId;

  const clientes = await prisma.cliente.findMany({
    where: { empresaId },
    include: { pedidos: { where: { status: { not: 'CANCELADO' } }, select: { valorTotal: true, criadoEm: true } } },
    orderBy: { criadoEm: 'desc' }
  });

  let resultado = clientes.map(comEstatisticas);

  const hoje = new Date();
  const ha30dias = new Date(hoje.getTime() - 30 * 86400000);
  const mesAtual = hoje.getMonth();

  if (segmento === 'ATIVOS') {
    resultado = resultado.filter((c) => c.ultimoPedidoEm && new Date(c.ultimoPedidoEm) >= ha30dias);
  } else if (segmento === 'INATIVOS') {
    resultado = resultado.filter((c) => c.totalPedidos > 0 && (!c.ultimoPedidoEm || new Date(c.ultimoPedidoEm) < ha30dias));
  } else if (segmento === 'VIP') {
    resultado = resultado.filter((c) => c.totalPedidos > 0).sort((a, b) => b.totalGasto - a.totalGasto).slice(0, 20);
  } else if (segmento === 'ANIVERSARIANTES') {
    resultado = resultado.filter((c) => c.dataNascimento && new Date(c.dataNascimento).getMonth() === mesAtual);
  } else {
    resultado = resultado.sort((a, b) => b.totalGasto - a.totalGasto);
  }

  res.json(resultado);
}

async function obter(req, res) {
  const { id } = req.params;
  const cliente = await prisma.cliente.findFirst({
    where: { id, empresaId: req.usuario.empresaId },
    include: {
      pedidos: { where: { status: { not: 'CANCELADO' } }, select: { valorTotal: true, criadoEm: true } },
      transacoesCashback: { orderBy: { criadoEm: 'desc' }, take: 20 },
      avaliacoes: { orderBy: { criadoEm: 'desc' }, take: 10 }
    }
  });
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado.' });
  res.json(comEstatisticas(cliente));
}

async function atualizar(req, res) {
  const { id } = req.params;
  const cliente = await prisma.cliente.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado.' });

  const { nome, email, dataNascimento } = req.body || {};
  const atualizado = await prisma.cliente.update({
    where: { id },
    data: {
      nome: nome !== undefined ? nome : cliente.nome,
      email: email !== undefined ? email : cliente.email,
      dataNascimento: dataNascimento !== undefined ? (dataNascimento ? new Date(dataNascimento) : null) : cliente.dataNascimento
    }
  });
  res.json(atualizado);
}

module.exports = { listar, obter, atualizar };
