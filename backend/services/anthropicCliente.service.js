const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../prisma/client');
const { descriptografar } = require('../utils/criptografia');

// Prioridade: chave propria da empresa (se configurada e valida) primeiro - quem traz a propria
// chave paga direto pra Anthropic e por isso fica de fora do limite mensal da plataforma. Sem
// chave propria, cai pra ANTHROPIC_API_KEY da AgapeFood, sujeito ao limite do plano (ver
// utils/limiteIa.js).
async function obterClienteAnthropic(empresaId) {
  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId }, select: { iaChaveAnthropic: true } });

  if (empresa?.iaChaveAnthropic) {
    try {
      const chave = descriptografar(empresa.iaChaveAnthropic);
      if (chave) return new Anthropic({ apiKey: chave });
    } catch {
      // chave propria corrompida/ilegivel - segue pro fallback da plataforma abaixo
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  return null;
}

async function usaChavePropria(empresaId) {
  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId }, select: { iaChaveAnthropic: true } });
  return !!empresa?.iaChaveAnthropic;
}

module.exports = { obterClienteAnthropic, usaChavePropria };
