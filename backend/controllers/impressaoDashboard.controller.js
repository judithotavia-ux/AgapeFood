const prisma = require('../prisma/client');

function inicioDoDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function resumo(req, res) {
  const empresaId = req.usuario.empresaId;
  const hoje = inicioDoDia();

  const [impressoras, filaPendente, impressoesHoje, comErro, ultimaImpressao] = await Promise.all([
    prisma.printer.findMany({ where: { empresaId }, orderBy: { nome: 'asc' } }),
    prisma.printJob.count({ where: { empresaId, status: { in: ['PENDING', 'RETRYING', 'PRINTING'] } } }),
    prisma.printJob.findMany({ where: { empresaId, status: 'PRINTED', impressoEm: { gte: hoje } }, select: { criadoEm: true, impressoEm: true } }),
    prisma.printJob.count({ where: { empresaId, status: 'FAILED' } }),
    prisma.printJob.findFirst({ where: { empresaId, status: 'PRINTED' }, orderBy: { impressoEm: 'desc' }, include: { printer: true, pedido: { select: { numero: true } } } })
  ]);

  const tempos = impressoesHoje
    .filter((j) => j.impressoEm)
    .map((j) => (new Date(j.impressoEm).getTime() - new Date(j.criadoEm).getTime()) / 1000);
  const tempoMedioSegundos = tempos.length ? tempos.reduce((s, t) => s + t, 0) / tempos.length : null;

  res.json({
    impressorasOnline: impressoras.filter((p) => p.status === 'ONLINE').length,
    impressorasOffline: impressoras.filter((p) => p.status === 'OFFLINE').length,
    impressorasAtencao: impressoras.filter((p) => p.status === 'ATENCAO').length,
    totalImpressoras: impressoras.length,
    filaPendente,
    impressoesHoje: impressoesHoje.length,
    impressoesComErro: comErro,
    tempoMedioSegundos,
    ultimaImpressao,
    impressoras: impressoras.map((p) => ({
      id: p.id, nome: p.nome, setor: p.setor, ativa: p.ativa, padrao: p.padrao,
      status: p.status, ultimaImpressaoEm: p.ultimaImpressaoEm, ultimoErro: p.ultimoErro
    }))
  });
}

module.exports = { resumo };
