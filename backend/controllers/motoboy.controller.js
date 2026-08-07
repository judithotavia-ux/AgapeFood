const prisma = require('../prisma/client');

async function listar(req, res) {
  const motoboys = await prisma.motoboy.findMany({
    where: { empresaId: req.usuario.empresaId },
    orderBy: { nome: 'asc' }
  });
  res.json(motoboys);
}

async function criar(req, res) {
  const { nome, telefone, veiculo } = req.body || {};
  if (!nome || !nome.trim()) return res.status(400).json({ erro: 'Informe o nome do motoboy.' });

  const motoboy = await prisma.motoboy.create({
    data: { nome: nome.trim(), telefone: telefone || null, veiculo: veiculo || null, empresaId: req.usuario.empresaId }
  });
  res.status(201).json(motoboy);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const motoboy = await prisma.motoboy.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!motoboy) return res.status(404).json({ erro: 'Motoboy não encontrado.' });

  const { nome, telefone, veiculo, ativo } = req.body || {};
  const atualizado = await prisma.motoboy.update({
    where: { id },
    data: {
      nome: nome?.trim() ?? motoboy.nome,
      telefone: telefone !== undefined ? telefone : motoboy.telefone,
      veiculo: veiculo !== undefined ? veiculo : motoboy.veiculo,
      ativo: ativo !== undefined ? Boolean(ativo) : motoboy.ativo
    }
  });
  res.json(atualizado);
}

async function remover(req, res) {
  const { id } = req.params;
  const motoboy = await prisma.motoboy.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!motoboy) return res.status(404).json({ erro: 'Motoboy não encontrado.' });

  await prisma.motoboy.delete({ where: { id } });
  res.status(204).send();
}

async function resumoGanhos(req, res) {
  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);

  const motoboys = await prisma.motoboy.findMany({ where: { empresaId: req.usuario.empresaId } });

  const resultado = await Promise.all(motoboys.map(async (m) => {
    const entregas = await prisma.pedido.findMany({
      where: { motoboyId: m.id, criadoEm: { gte: inicioDoDia }, status: { not: 'CANCELADO' } },
      select: { taxaMotoboy: true }
    });
    return {
      motoboy: m,
      totalEntregasHoje: entregas.length,
      totalGanhosHoje: entregas.reduce((s, p) => s + Number(p.taxaMotoboy || 0), 0)
    };
  }));

  res.json(resultado);
}

module.exports = { listar, criar, atualizar, remover, resumoGanhos };
