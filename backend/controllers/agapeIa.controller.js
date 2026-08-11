const prisma = require('../prisma/client');
const { processarMensagem, ErroAgapeIA } = require('../services/agapeIa.service');
const { verificarLimiteIA } = require('../utils/limiteIa');

// Estimativa usada para "Tempo Economizado" e "Economia Gerada" no dashboard — não são valores
// medidos, são uma suposição documentada (minutos que uma interação levaria se feita manualmente
// por um atendente, e o custo médio da hora desse atendente). Ajustável aqui se necessário.
const MINUTOS_POR_PERGUNTA = 3;
const MINUTOS_POR_ACAO = 6;
const CUSTO_HORA_ATENDIMENTO = 20;

const TIPOS_ACAO_ESCRITA = ['PEDIDO_CRIADO', 'PROMOCAO_CRIADA', 'CAMPANHA_CRIADA', 'RELATORIO_GERADO', 'TAREFA_CRIADA'];

async function conversar(req, res) {
  const { texto, conversaId } = req.body || {};
  if (!texto || !texto.trim()) return res.status(400).json({ erro: 'Escreva uma mensagem.' });

  const statusLimite = await verificarLimiteIA(req.usuario.empresaId);
  if (!statusLimite.permitido) {
    return res.status(429).json({
      erro: `Limite mensal de ${statusLimite.limite} mensagens da Ágape IA atingido. Ele é renovado no início do próximo mês.`,
      limiteIaAtingido: true,
      limite: statusLimite.limite,
      usadas: statusLimite.usadas
    });
  }

  let conversa;
  if (conversaId) {
    conversa = await prisma.conversaIA.findFirst({ where: { id: conversaId, empresaId: req.usuario.empresaId } });
    if (!conversa) return res.status(404).json({ erro: 'Conversa não encontrada.' });
  } else {
    conversa = await prisma.conversaIA.create({
      data: {
        empresaId: req.usuario.empresaId,
        usuarioId: req.usuario.id,
        canal: 'PAINEL_ADMIN',
        titulo: texto.trim().slice(0, 60)
      }
    });
  }

  try {
    const resultado = await processarMensagem({
      empresaId: req.usuario.empresaId,
      usuario: req.usuario,
      conversaId: conversa.id,
      texto: texto.trim()
    });
    res.json({ conversaId: conversa.id, ...resultado });
  } catch (erro) {
    if (erro instanceof ErroAgapeIA) return res.status(erro.status).json({ erro: erro.erro });
    throw erro;
  }
}

async function listarConversas(req, res) {
  const conversas = await prisma.conversaIA.findMany({
    where: { empresaId: req.usuario.empresaId, usuarioId: req.usuario.id, canal: 'PAINEL_ADMIN' },
    orderBy: { atualizadoEm: 'desc' },
    take: 50,
    select: { id: true, titulo: true, criadoEm: true, atualizadoEm: true }
  });
  res.json(conversas);
}

async function obterConversa(req, res) {
  const { id } = req.params;
  const conversa = await prisma.conversaIA.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!conversa) return res.status(404).json({ erro: 'Conversa não encontrada.' });

  const mensagens = await prisma.mensagemIA.findMany({
    where: { conversaId: id, papel: { in: ['USUARIO', 'ASSISTENTE'] } },
    orderBy: { criadoEm: 'asc' }
  });

  res.json({ conversa, mensagens });
}

async function removerConversa(req, res) {
  const { id } = req.params;
  const conversa = await prisma.conversaIA.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!conversa) return res.status(404).json({ erro: 'Conversa não encontrada.' });

  await prisma.conversaIA.delete({ where: { id } });
  res.status(204).send();
}

async function dashboard(req, res) {
  const empresaId = req.usuario.empresaId;
  const dias = Number(req.query.dias) > 0 ? Number(req.query.dias) : 30;
  const desde = new Date(Date.now() - dias * 86400000);

  const [perguntasRespondidas, pedidosCriados, promocoesCriadas, campanhasCriadas, tarefasCriadas, relatoriosGerados, clientesUnicos, ultimasAcoes, tarefasPendentes] = await Promise.all([
    prisma.acaoIA.count({ where: { empresaId, tipo: 'PERGUNTA_RESPONDIDA', criadoEm: { gte: desde } } }),
    prisma.acaoIA.count({ where: { empresaId, tipo: 'PEDIDO_CRIADO', criadoEm: { gte: desde } } }),
    prisma.acaoIA.count({ where: { empresaId, tipo: 'PROMOCAO_CRIADA', criadoEm: { gte: desde } } }),
    prisma.acaoIA.count({ where: { empresaId, tipo: 'CAMPANHA_CRIADA', criadoEm: { gte: desde } } }),
    prisma.acaoIA.count({ where: { empresaId, tipo: 'TAREFA_CRIADA', criadoEm: { gte: desde } } }),
    prisma.acaoIA.count({ where: { empresaId, tipo: 'RELATORIO_GERADO', criadoEm: { gte: desde } } }),
    prisma.acaoIA.findMany({
      where: { empresaId, clienteId: { not: null }, criadoEm: { gte: desde } },
      select: { clienteId: true },
      distinct: ['clienteId']
    }),
    prisma.acaoIA.findMany({
      where: { empresaId, criadoEm: { gte: desde } },
      orderBy: { criadoEm: 'desc' },
      take: 15
    }),
    prisma.tarefaIA.findMany({
      where: { empresaId, status: { not: 'CONCLUIDA' } },
      orderBy: { criadoEm: 'desc' },
      take: 10
    })
  ]);

  const acoesEscrita = pedidosCriados + promocoesCriadas + campanhasCriadas + tarefasCriadas + relatoriosGerados;
  const tempoEconomizadoMinutos = perguntasRespondidas * MINUTOS_POR_PERGUNTA + acoesEscrita * MINUTOS_POR_ACAO;
  const economiaGerada = (tempoEconomizadoMinutos / 60) * CUSTO_HORA_ATENDIMENTO;

  res.json({
    periodo: { dias, desde },
    perguntasRespondidas,
    pedidosCriados,
    promocoesCriadas: promocoesCriadas + campanhasCriadas,
    clientesAtendidos: clientesUnicos.length,
    tempoEconomizadoMinutos,
    economiaGerada,
    estimativa: {
      minutosPorPergunta: MINUTOS_POR_PERGUNTA,
      minutosPorAcao: MINUTOS_POR_ACAO,
      custoHoraAtendimento: CUSTO_HORA_ATENDIMENTO,
      aviso: 'Tempo Economizado e Economia Gerada são estimativas baseadas nesses parâmetros, não valores medidos.'
    },
    ultimasAcoes,
    tarefasPendentes
  });
}

async function atualizarTarefa(req, res) {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA'].includes(status)) return res.status(400).json({ erro: 'Status inválido.' });

  const tarefa = await prisma.tarefaIA.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!tarefa) return res.status(404).json({ erro: 'Tarefa não encontrada.' });

  const atualizada = await prisma.tarefaIA.update({
    where: { id },
    data: { status, concluidaEm: status === 'CONCLUIDA' ? new Date() : null }
  });
  res.json(atualizada);
}

async function uso(req, res) {
  const status = await verificarLimiteIA(req.usuario.empresaId);
  res.json({
    limite: status.limite,
    usadas: status.usadas,
    restantes: status.limite === null ? null : Math.max(0, status.limite - status.usadas)
  });
}

module.exports = { conversar, listarConversas, obterConversa, removerConversa, dashboard, atualizarTarefa, uso };
