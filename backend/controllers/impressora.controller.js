const prisma = require('../prisma/client');
const { criarJobTeste, montarTeste } = require('../services/impressao.service');

const SETORES_VALIDOS = ['COZINHA', 'BAR', 'CONFEITARIA', 'PIZZARIA', 'ACAI', 'SALGADOS', 'BALCAO', 'GARCOM', 'CAIXA', 'DELIVERY', 'OUTRO'];
const CONEXOES_VALIDAS = ['USB', 'REDE', 'BLUETOOTH'];

async function listar(req, res) {
  const impressoras = await prisma.printer.findMany({
    where: { empresaId: req.usuario.empresaId },
    orderBy: { criadoEm: 'asc' }
  });
  res.json(impressoras);
}

async function obter(req, res) {
  const { id } = req.params;
  const impressora = await prisma.printer.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!impressora) return res.status(404).json({ erro: 'Impressora não encontrada.' });
  res.json(impressora);
}

async function criar(req, res) {
  const {
    nome, descricao, setor, fabricante, modelo, tipoConexao, identificadorLocal,
    larguraPapelMm, caracteresPorLinha, copias, padrao
  } = req.body || {};

  if (!nome || !nome.trim()) return res.status(400).json({ erro: 'Informe o nome da impressora.' });
  if (setor && !SETORES_VALIDOS.includes(setor)) return res.status(400).json({ erro: 'Setor inválido.' });
  if (tipoConexao && !CONEXOES_VALIDAS.includes(tipoConexao)) return res.status(400).json({ erro: 'Tipo de conexão inválido.' });

  if (padrao) {
    await prisma.printer.updateMany({ where: { empresaId: req.usuario.empresaId, padrao: true }, data: { padrao: false } });
  }

  const impressora = await prisma.printer.create({
    data: {
      nome: nome.trim(),
      descricao: descricao || null,
      setor: setor || 'COZINHA',
      fabricante: fabricante || null,
      modelo: modelo || null,
      tipoConexao: tipoConexao || 'USB',
      identificadorLocal: identificadorLocal || null,
      larguraPapelMm: larguraPapelMm ? Number(larguraPapelMm) : 80,
      caracteresPorLinha: caracteresPorLinha ? Number(caracteresPorLinha) : 48,
      copias: copias ? Number(copias) : 1,
      padrao: !!padrao,
      empresaId: req.usuario.empresaId
    }
  });
  res.status(201).json(impressora);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const impressora = await prisma.printer.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!impressora) return res.status(404).json({ erro: 'Impressora não encontrada.' });

  const {
    nome, descricao, setor, fabricante, modelo, tipoConexao, identificadorLocal,
    larguraPapelMm, caracteresPorLinha, copias, ativa, padrao
  } = req.body || {};

  if (setor && !SETORES_VALIDOS.includes(setor)) return res.status(400).json({ erro: 'Setor inválido.' });
  if (tipoConexao && !CONEXOES_VALIDAS.includes(tipoConexao)) return res.status(400).json({ erro: 'Tipo de conexão inválido.' });

  if (padrao === true) {
    await prisma.printer.updateMany({ where: { empresaId: req.usuario.empresaId, padrao: true, id: { not: id } }, data: { padrao: false } });
  }

  const atualizada = await prisma.printer.update({
    where: { id },
    data: {
      nome: nome !== undefined ? nome.trim() : impressora.nome,
      descricao: descricao !== undefined ? descricao : impressora.descricao,
      setor: setor || impressora.setor,
      fabricante: fabricante !== undefined ? fabricante : impressora.fabricante,
      modelo: modelo !== undefined ? modelo : impressora.modelo,
      tipoConexao: tipoConexao || impressora.tipoConexao,
      identificadorLocal: identificadorLocal !== undefined ? identificadorLocal : impressora.identificadorLocal,
      larguraPapelMm: larguraPapelMm !== undefined ? Number(larguraPapelMm) : impressora.larguraPapelMm,
      caracteresPorLinha: caracteresPorLinha !== undefined ? Number(caracteresPorLinha) : impressora.caracteresPorLinha,
      copias: copias !== undefined ? Number(copias) : impressora.copias,
      ativa: ativa !== undefined ? Boolean(ativa) : impressora.ativa,
      padrao: padrao !== undefined ? Boolean(padrao) : impressora.padrao
    }
  });
  res.json(atualizada);
}

async function remover(req, res) {
  const { id } = req.params;
  const impressora = await prisma.printer.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!impressora) return res.status(404).json({ erro: 'Impressora não encontrada.' });

  const totalJobs = await prisma.printJob.count({ where: { printerId: id } });
  if (totalJobs > 0) {
    return res.status(400).json({ erro: 'Esta impressora possui histórico de impressões e não pode ser excluída. Desative-a em vez disso.' });
  }

  await prisma.printer.delete({ where: { id } });
  res.status(204).send();
}

async function testarImpressao(req, res) {
  const { id } = req.params;
  const impressora = await prisma.printer.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!impressora) return res.status(404).json({ erro: 'Impressora não encontrada.' });

  const job = await criarJobTeste(impressora);
  res.status(201).json(job);
}

// So monta o conteudo (mesma funcao usada pelo job de teste de verdade) sem criar nenhum job -
// serve pra mostrar na tela como vai sair impresso antes de mandar de fato pro agente local.
async function preVisualizarTeste(req, res) {
  const { id } = req.params;
  const impressora = await prisma.printer.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!impressora) return res.status(404).json({ erro: 'Impressora não encontrada.' });

  res.json({ documento: montarTeste(impressora), larguraPapelMm: impressora.larguraPapelMm, caracteresPorLinha: impressora.caracteresPorLinha });
}

module.exports = { listar, obter, criar, atualizar, remover, testarImpressao, preVisualizarTeste };
