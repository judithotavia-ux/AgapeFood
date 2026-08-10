const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../prisma/client');
const { descriptografar } = require('../utils/criptografia');

async function obterClienteAnthropic(empresaId) {
  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId }, select: { iaChaveAnthropic: true } });
  if (!empresa?.iaChaveAnthropic) return null;

  let chave;
  try {
    chave = descriptografar(empresa.iaChaveAnthropic);
  } catch {
    return null;
  }
  if (!chave) return null;

  return new Anthropic({ apiKey: chave });
}

module.exports = { obterClienteAnthropic };
