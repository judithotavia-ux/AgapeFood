const prisma = require('../prisma/client');

const STATUS_ATIVOS = ['RECEBIDO', 'PREPARANDO', 'PRONTO', 'SAIU_PARA_ENTREGA'];

async function listar(req, res) {
  const mesas = await prisma.mesa.findMany({
    where: { empresaId: req.usuario.empresaId },
    include: { pedidos: { where: { status: { in: STATUS_ATIVOS } }, select: { id: true, valorTotal: true } } },
    orderBy: { numero: 'asc' }
  });

  const resultado = mesas.map((m) => ({
    id: m.id,
    numero: m.numero,
    capacidade: m.capacidade,
    ativo: m.ativo,
    status: m.pedidos.length ? 'OCUPADA' : 'LIVRE',
    totalComanda: m.pedidos.reduce((s, p) => s + Number(p.valorTotal), 0)
  }));

  res.json(resultado);
}

async function criar(req, res) {
  const { numero, capacidade } = req.body || {};
  if (!numero) return res.status(400).json({ erro: 'Informe o número da mesa.' });

  const existente = await prisma.mesa.findFirst({ where: { empresaId: req.usuario.empresaId, numero: Number(numero) } });
  if (existente) return res.status(400).json({ erro: 'Já existe uma mesa com esse número.' });

  const mesa = await prisma.mesa.create({
    data: { numero: Number(numero), capacidade: Number(capacidade) || 4, empresaId: req.usuario.empresaId }
  });
  res.status(201).json(mesa);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const mesa = await prisma.mesa.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!mesa) return res.status(404).json({ erro: 'Mesa não encontrada.' });

  const { capacidade, ativo } = req.body || {};
  const atualizada = await prisma.mesa.update({
    where: { id },
    data: {
      capacidade: capacidade !== undefined ? Number(capacidade) : mesa.capacidade,
      ativo: ativo !== undefined ? Boolean(ativo) : mesa.ativo
    }
  });
  res.json(atualizada);
}

async function remover(req, res) {
  const { id } = req.params;
  const mesa = await prisma.mesa.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!mesa) return res.status(404).json({ erro: 'Mesa não encontrada.' });

  const ativos = await prisma.pedido.count({ where: { mesaId: id, status: { in: STATUS_ATIVOS } } });
  if (ativos > 0) return res.status(400).json({ erro: 'Não é possível excluir: a mesa tem pedidos em aberto.' });

  await prisma.mesa.delete({ where: { id } });
  res.status(204).send();
}

async function comanda(req, res) {
  const { id } = req.params;
  const mesa = await prisma.mesa.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!mesa) return res.status(404).json({ erro: 'Mesa não encontrada.' });

  const pedidos = await prisma.pedido.findMany({
    where: { mesaId: id, status: { in: STATUS_ATIVOS } },
    include: { itens: true },
    orderBy: { criadoEm: 'asc' }
  });

  const total = pedidos.reduce((s, p) => s + Number(p.valorTotal), 0);
  res.json({ mesa, pedidos, total });
}

async function transferir(req, res) {
  const { id } = req.params;
  const { mesaDestinoId } = req.body || {};
  if (!mesaDestinoId) return res.status(400).json({ erro: 'Selecione a mesa de destino.' });
  if (mesaDestinoId === id) return res.status(400).json({ erro: 'A mesa de destino deve ser diferente da atual.' });

  const [origem, destino] = await Promise.all([
    prisma.mesa.findFirst({ where: { id, empresaId: req.usuario.empresaId } }),
    prisma.mesa.findFirst({ where: { id: mesaDestinoId, empresaId: req.usuario.empresaId } })
  ]);
  if (!origem || !destino) return res.status(404).json({ erro: 'Mesa não encontrada.' });

  const destinoOcupada = await prisma.pedido.count({ where: { mesaId: mesaDestinoId, status: { in: STATUS_ATIVOS } } });
  if (destinoOcupada > 0) return res.status(400).json({ erro: 'A mesa de destino já está ocupada.' });

  await prisma.pedido.updateMany({
    where: { mesaId: id, status: { in: STATUS_ATIVOS } },
    data: { mesaId: mesaDestinoId }
  });

  res.json({ ok: true });
}

async function fechar(req, res) {
  const { id } = req.params;
  const mesa = await prisma.mesa.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!mesa) return res.status(404).json({ erro: 'Mesa não encontrada.' });

  await prisma.pedido.updateMany({
    where: { mesaId: id, status: { in: STATUS_ATIVOS } },
    data: { status: 'ENTREGUE' }
  });

  res.json({ ok: true });
}

module.exports = { listar, criar, atualizar, remover, comanda, transferir, fechar };
