const prisma = require('../prisma/client');

async function listar(req, res) {
  const mesas = await prisma.mesa.findMany({
    where: { empresaId: req.usuario.empresaId },
    orderBy: { numero: 'asc' }
  });
  res.json(mesas);
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

async function remover(req, res) {
  const { id } = req.params;
  const mesa = await prisma.mesa.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!mesa) return res.status(404).json({ erro: 'Mesa não encontrada.' });

  await prisma.mesa.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { listar, criar, remover };
