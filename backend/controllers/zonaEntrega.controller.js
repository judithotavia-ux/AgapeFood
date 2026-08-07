const prisma = require('../prisma/client');

async function listar(req, res) {
  const zonas = await prisma.zonaEntrega.findMany({
    where: { empresaId: req.usuario.empresaId },
    orderBy: { bairro: 'asc' }
  });
  res.json(zonas);
}

async function criar(req, res) {
  const { bairro, taxaEntrega, tempoEstimadoMin } = req.body || {};
  if (!bairro || !bairro.trim()) return res.status(400).json({ erro: 'Informe o bairro.' });
  if (taxaEntrega === undefined || isNaN(Number(taxaEntrega)) || Number(taxaEntrega) < 0) {
    return res.status(400).json({ erro: 'Informe uma taxa de entrega válida (pode ser 0 para grátis).' });
  }

  const existente = await prisma.zonaEntrega.findFirst({ where: { empresaId: req.usuario.empresaId, bairro: bairro.trim() } });
  if (existente) return res.status(400).json({ erro: 'Já existe uma zona cadastrada para esse bairro.' });

  const zona = await prisma.zonaEntrega.create({
    data: {
      bairro: bairro.trim(),
      taxaEntrega: Number(taxaEntrega),
      tempoEstimadoMin: tempoEstimadoMin ? Number(tempoEstimadoMin) : null,
      empresaId: req.usuario.empresaId
    }
  });
  res.status(201).json(zona);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const zona = await prisma.zonaEntrega.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!zona) return res.status(404).json({ erro: 'Zona não encontrada.' });

  const { taxaEntrega, tempoEstimadoMin, ativo } = req.body || {};
  const atualizada = await prisma.zonaEntrega.update({
    where: { id },
    data: {
      taxaEntrega: taxaEntrega !== undefined ? Number(taxaEntrega) : zona.taxaEntrega,
      tempoEstimadoMin: tempoEstimadoMin !== undefined ? (tempoEstimadoMin ? Number(tempoEstimadoMin) : null) : zona.tempoEstimadoMin,
      ativo: ativo !== undefined ? Boolean(ativo) : zona.ativo
    }
  });
  res.json(atualizada);
}

async function remover(req, res) {
  const { id } = req.params;
  const zona = await prisma.zonaEntrega.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!zona) return res.status(404).json({ erro: 'Zona não encontrada.' });

  await prisma.zonaEntrega.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { listar, criar, atualizar, remover };
