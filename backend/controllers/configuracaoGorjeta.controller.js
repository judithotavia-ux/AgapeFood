const prisma = require('../prisma/client');

async function obterOuCriar(empresaId) {
  const existente = await prisma.configuracaoGorjeta.findUnique({ where: { empresaId } });
  if (existente) return existente;
  return prisma.configuracaoGorjeta.create({ data: { empresaId } });
}

function normalizarOpcoes(valor) {
  if (Array.isArray(valor)) {
    const numeros = valor.map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= 100);
    return JSON.stringify(numeros);
  }
  return null;
}

async function obter(req, res) {
  await obterOuCriar(req.usuario.empresaId);
  const config = await prisma.configuracaoGorjeta.findUnique({
    where: { empresaId: req.usuario.empresaId },
    include: { atualizadoPor: { select: { nome: true } } }
  });
  res.json({ ...config, opcoesPercentual: JSON.parse(config.opcoesPercentual) });
}

const MODELOS_VALIDOS = ['INDIVIDUAL', 'COLETIVO'];
const REGRAS_VALIDAS = ['IGUAL', 'PERCENTUAL', 'HORAS', 'PONTOS'];

async function atualizar(req, res) {
  const {
    ativa, percentualPadrao, permitirClienteEscolher, opcoesPercentual, permitirValorFixo,
    modeloDistribuicao, regraRateio
  } = req.body || {};

  if (percentualPadrao !== undefined && (isNaN(Number(percentualPadrao)) || Number(percentualPadrao) < 0 || Number(percentualPadrao) > 100)) {
    return res.status(400).json({ erro: 'Percentual padrão deve ser entre 0 e 100.' });
  }
  if (modeloDistribuicao !== undefined && !MODELOS_VALIDOS.includes(modeloDistribuicao)) {
    return res.status(400).json({ erro: 'Modelo de distribuição inválido.' });
  }
  if (regraRateio !== undefined && !REGRAS_VALIDAS.includes(regraRateio)) {
    return res.status(400).json({ erro: 'Regra de rateio inválida.' });
  }

  const opcoesJson = opcoesPercentual !== undefined ? normalizarOpcoes(opcoesPercentual) : undefined;
  if (opcoesPercentual !== undefined && opcoesJson === null) {
    return res.status(400).json({ erro: 'Lista de opções de percentual inválida.' });
  }

  await obterOuCriar(req.usuario.empresaId);

  const config = await prisma.configuracaoGorjeta.update({
    where: { empresaId: req.usuario.empresaId },
    data: {
      ativa: ativa !== undefined ? Boolean(ativa) : undefined,
      percentualPadrao: percentualPadrao !== undefined ? Number(percentualPadrao) : undefined,
      permitirClienteEscolher: permitirClienteEscolher !== undefined ? Boolean(permitirClienteEscolher) : undefined,
      opcoesPercentual: opcoesJson !== undefined ? opcoesJson : undefined,
      permitirValorFixo: permitirValorFixo !== undefined ? Boolean(permitirValorFixo) : undefined,
      modeloDistribuicao: modeloDistribuicao !== undefined ? modeloDistribuicao : undefined,
      regraRateio: regraRateio !== undefined ? regraRateio : undefined,
      atualizadoPorId: req.usuario.id
    }
  });

  res.json({ ...config, opcoesPercentual: JSON.parse(config.opcoesPercentual) });
}

module.exports = { obter, atualizar, obterOuCriar };
