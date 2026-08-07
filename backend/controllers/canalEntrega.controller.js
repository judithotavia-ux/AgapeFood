const prisma = require('../prisma/client');

const TIPOS = ['MOTOBOY_PROPRIO', 'IFOOD', 'UBER_EATS', 'NOVENTA_NOVE_FOOD'];

async function garantirCanais(empresaId) {
  for (const tipo of TIPOS) {
    await prisma.canalEntregaConfig.upsert({
      where: { empresaId_tipo: { empresaId, tipo } },
      update: {},
      create: { empresaId, tipo, ativo: tipo === 'MOTOBOY_PROPRIO' }
    });
  }
}

async function listar(req, res) {
  await garantirCanais(req.usuario.empresaId);
  const canais = await prisma.canalEntregaConfig.findMany({ where: { empresaId: req.usuario.empresaId } });
  res.json(canais);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { ativo } = req.body || {};

  const canal = await prisma.canalEntregaConfig.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!canal) return res.status(404).json({ erro: 'Canal não encontrado.' });

  const atualizado = await prisma.canalEntregaConfig.update({ where: { id }, data: { ativo: Boolean(ativo) } });
  res.json(atualizado);
}

async function regenerarToken(req, res) {
  const { id } = req.params;
  const canal = await prisma.canalEntregaConfig.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!canal) return res.status(404).json({ erro: 'Canal não encontrado.' });

  const { randomUUID } = require('crypto');
  const atualizado = await prisma.canalEntregaConfig.update({ where: { id }, data: { webhookToken: randomUUID() } });
  res.json(atualizado);
}

module.exports = { listar, atualizar, regenerarToken };
