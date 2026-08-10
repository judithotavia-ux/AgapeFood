const prisma = require('../prisma/client');
const { emitirParaEmpresa } = require('../realtime/socket');

async function listar(req, res) {
  const { status, setor, printerId, pedidoId } = req.query;
  const jobs = await prisma.printJob.findMany({
    where: {
      empresaId: req.usuario.empresaId,
      ...(status ? { status } : {}),
      ...(setor ? { setor } : {}),
      ...(printerId ? { printerId } : {}),
      ...(pedidoId ? { pedidoId } : {})
    },
    include: { printer: true, pedido: { select: { numero: true } } },
    orderBy: { criadoEm: 'desc' },
    take: 200
  });
  res.json(jobs);
}

async function obter(req, res) {
  const { id } = req.params;
  const job = await prisma.printJob.findFirst({
    where: { id, empresaId: req.usuario.empresaId },
    include: { printer: true, pedido: { select: { numero: true } }, logs: { orderBy: { criadoEm: 'desc' } } }
  });
  if (!job) return res.status(404).json({ erro: 'Job de impressão não encontrado.' });
  res.json(job);
}

// Chamado pelo agente local apos tentar imprimir de verdade
async function reportarResultado(req, res) {
  const { id } = req.params;
  const { status, erro, tentativas } = req.body || {};

  if (!['PRINTED', 'FAILED', 'RETRYING'].includes(status)) {
    return res.status(400).json({ erro: 'Status inválido. Use PRINTED, FAILED ou RETRYING.' });
  }

  const job = await prisma.printJob.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!job) return res.status(404).json({ erro: 'Job de impressão não encontrado.' });

  const atualizado = await prisma.printJob.update({
    where: { id },
    data: {
      status,
      tentativas: tentativas !== undefined ? Number(tentativas) : job.tentativas + 1,
      erro: status === 'FAILED' ? (erro || 'Falha não especificada.') : null,
      impressoEm: status === 'PRINTED' ? new Date() : job.impressoEm
    }
  });

  await prisma.printLog.create({
    data: { printJobId: id, acao: status === 'PRINTED' ? 'IMPRESSO' : status === 'FAILED' ? 'FALHOU' : 'RETRYING', detalhe: erro || null }
  });

  await prisma.printer.update({
    where: { id: job.printerId },
    data: {
      status: status === 'PRINTED' ? 'ONLINE' : status === 'FAILED' ? 'ATENCAO' : undefined,
      ultimaImpressaoEm: status === 'PRINTED' ? new Date() : undefined,
      ultimoErro: status === 'FAILED' ? (erro || 'Falha não especificada.') : null
    }
  });

  emitirParaEmpresa(req.usuario.empresaId, 'impressao:job-atualizado', atualizado);
  res.json(atualizado);
}

async function retry(req, res) {
  const { id } = req.params;
  const job = await prisma.printJob.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!job) return res.status(404).json({ erro: 'Job de impressão não encontrado.' });
  if (job.status === 'PRINTED') return res.status(400).json({ erro: 'Esse job já foi impresso com sucesso.' });
  if (job.status === 'CANCELLED') return res.status(400).json({ erro: 'Esse job foi cancelado.' });

  const atualizado = await prisma.printJob.update({
    where: { id },
    data: { status: 'PENDING', erro: null }
  });
  await prisma.printLog.create({ data: { printJobId: id, acao: 'RETRY', usuarioId: req.usuario.id } });
  emitirParaEmpresa(req.usuario.empresaId, 'impressao:novo-job', atualizado);
  res.json(atualizado);
}

// Cria um NOVO job identico (para reimprimir uma comanda ja impressa, ex: papel perdido)
async function reimprimir(req, res) {
  const { id } = req.params;
  const job = await prisma.printJob.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!job) return res.status(404).json({ erro: 'Job de impressão não encontrado.' });

  const novoJob = await prisma.$transaction(async (tx) => {
    const criado = await tx.printJob.create({
      data: {
        empresaId: job.empresaId,
        printerId: job.printerId,
        pedidoId: job.pedidoId,
        setor: job.setor,
        tipoDocumento: job.tipoDocumento,
        prioridade: job.prioridade,
        payload: job.payload
      },
      include: { printer: true }
    });
    await tx.printLog.create({ data: { printJobId: criado.id, acao: 'REIMPRESSAO', detalhe: `Reimpressão do job ${job.id}`, usuarioId: req.usuario.id } });
    return criado;
  });
  emitirParaEmpresa(req.usuario.empresaId, 'impressao:novo-job', novoJob);
  res.status(201).json(novoJob);
}

async function cancelar(req, res) {
  const { id } = req.params;
  const job = await prisma.printJob.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!job) return res.status(404).json({ erro: 'Job de impressão não encontrado.' });
  if (job.status === 'PRINTED') return res.status(400).json({ erro: 'Esse job já foi impresso e não pode ser cancelado.' });

  const atualizado = await prisma.printJob.update({ where: { id }, data: { status: 'CANCELLED' } });
  await prisma.printLog.create({ data: { printJobId: id, acao: 'CANCELADO', usuarioId: req.usuario.id } });
  emitirParaEmpresa(req.usuario.empresaId, 'impressao:job-atualizado', atualizado);
  res.json(atualizado);
}

async function listarLogs(req, res) {
  const logs = await prisma.printLog.findMany({
    where: { printJob: { empresaId: req.usuario.empresaId } },
    include: { printJob: { include: { printer: true, pedido: { select: { numero: true } } } }, usuario: { select: { nome: true } } },
    orderBy: { criadoEm: 'desc' },
    take: 200
  });
  res.json(logs);
}

module.exports = { listar, obter, reportarResultado, retry, reimprimir, cancelar, listarLogs };
