const prisma = require('../prisma/client');

const CANAIS = ['WHATSAPP', 'EMAIL', 'SMS', 'INSTAGRAM', 'FACEBOOK', 'PUSH', 'OUTRO'];

async function comMetricas(campanha) {
  let conversoes = 0;
  let faturamentoAtribuido = 0;

  if (campanha.cupomId) {
    const pedidos = await prisma.pedido.findMany({
      where: { cupomId: campanha.cupomId, status: { not: 'CANCELADO' } },
      select: { valorTotal: true }
    });
    conversoes = pedidos.length;
    faturamentoAtribuido = pedidos.reduce((s, p) => s + Number(p.valorTotal), 0);
  }

  const custo = campanha.custo ? Number(campanha.custo) : 0;
  const roi = custo > 0 ? ((faturamentoAtribuido - custo) / custo) * 100 : null;

  return { ...campanha, conversoes, faturamentoAtribuido, roi };
}

async function listar(req, res) {
  const campanhas = await prisma.campanha.findMany({
    where: { empresaId: req.usuario.empresaId },
    include: { cupom: true },
    orderBy: { criadoEm: 'desc' }
  });
  const comDados = await Promise.all(campanhas.map(comMetricas));
  res.json(comDados);
}

async function obter(req, res) {
  const { id } = req.params;
  const campanha = await prisma.campanha.findFirst({ where: { id, empresaId: req.usuario.empresaId }, include: { cupom: true } });
  if (!campanha) return res.status(404).json({ erro: 'Campanha não encontrada.' });
  res.json(await comMetricas(campanha));
}

async function criar(req, res) {
  const { nome, canal, segmento, texto, cupomId, custo } = req.body || {};

  if (!nome || !nome.trim()) return res.status(400).json({ erro: 'Informe o nome da campanha.' });
  if (!CANAIS.includes(canal)) return res.status(400).json({ erro: 'Canal inválido.' });
  if (!segmento || !segmento.trim()) return res.status(400).json({ erro: 'Informe o público-alvo.' });

  if (cupomId) {
    const cupom = await prisma.cupom.findFirst({ where: { id: cupomId, empresaId: req.usuario.empresaId } });
    if (!cupom) return res.status(400).json({ erro: 'Cupom inválido.' });
  }

  const campanha = await prisma.campanha.create({
    data: {
      nome: nome.trim(),
      canal,
      segmento: segmento.trim(),
      texto: texto || null,
      cupomId: cupomId || null,
      custo: custo !== undefined && custo !== '' ? Number(custo) : null,
      empresaId: req.usuario.empresaId
    }
  });
  res.status(201).json(campanha);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const campanha = await prisma.campanha.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!campanha) return res.status(404).json({ erro: 'Campanha não encontrada.' });

  const { nome, texto, status, cupomId, custo } = req.body || {};
  const atualizada = await prisma.campanha.update({
    where: { id },
    data: {
      nome: nome?.trim() ?? campanha.nome,
      texto: texto !== undefined ? texto : campanha.texto,
      status: status || campanha.status,
      cupomId: cupomId !== undefined ? (cupomId || null) : campanha.cupomId,
      custo: custo !== undefined ? (custo === '' ? null : Number(custo)) : campanha.custo,
      enviadaEm: status === 'ATIVA' && campanha.status !== 'ATIVA' ? new Date() : campanha.enviadaEm
    }
  });
  res.json(atualizada);
}

async function remover(req, res) {
  const { id } = req.params;
  const campanha = await prisma.campanha.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!campanha) return res.status(404).json({ erro: 'Campanha não encontrada.' });

  await prisma.campanha.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { listar, obter, criar, atualizar, remover };
