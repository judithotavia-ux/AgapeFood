const prisma = require('../prisma/client');

async function listar(req, res) {
  const { status } = req.query;
  const reservas = await prisma.reserva.findMany({
    where: {
      empresaId: req.usuario.empresaId,
      ...(status ? { status } : {})
    },
    include: { mesa: true },
    orderBy: { dataHora: 'asc' }
  });
  res.json(reservas);
}

async function criar(req, res) {
  const { clienteNome, clienteTelefone, dataHora, pessoas, mesaId, observacoes } = req.body || {};

  if (!clienteNome || !clienteNome.trim()) return res.status(400).json({ erro: 'Informe o nome do cliente.' });
  if (!dataHora) return res.status(400).json({ erro: 'Informe a data e hora da reserva.' });

  if (mesaId) {
    const mesa = await prisma.mesa.findFirst({ where: { id: mesaId, empresaId: req.usuario.empresaId } });
    if (!mesa) return res.status(400).json({ erro: 'Mesa inválida.' });
  }

  const reserva = await prisma.reserva.create({
    data: {
      clienteNome: clienteNome.trim(),
      clienteTelefone: clienteTelefone || null,
      dataHora: new Date(dataHora),
      pessoas: Number(pessoas) || 1,
      mesaId: mesaId || null,
      observacoes: observacoes || null,
      empresaId: req.usuario.empresaId
    }
  });

  res.status(201).json(reserva);
}

async function atualizarStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!['CONFIRMADA', 'CANCELADA', 'CONCLUIDA'].includes(status)) return res.status(400).json({ erro: 'Status inválido.' });

  const reserva = await prisma.reserva.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!reserva) return res.status(404).json({ erro: 'Reserva não encontrada.' });

  const atualizada = await prisma.reserva.update({ where: { id }, data: { status } });
  res.json(atualizada);
}

module.exports = { listar, criar, atualizarStatus };
