const prisma = require('../prisma/client');

function inicioDoMes() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1);
}

async function limiteMensagensIA(empresaId) {
  const assinatura = await prisma.assinatura.findUnique({
    where: { empresaId },
    select: { plano: { select: { limiteMensagensIA: true } } }
  });
  return assinatura?.plano?.limiteMensagensIA ?? null;
}

// Conta so mensagens do USUARIO (cada uma dispara uma chamada pra Anthropic) - respostas do
// assistente e chamadas de ferramenta nao contam pro limite.
async function mensagensUsadasNoMes(empresaId) {
  return prisma.mensagemIA.count({
    where: { papel: 'USUARIO', conversa: { empresaId }, criadoEm: { gte: inicioDoMes() } }
  });
}

async function verificarLimiteIA(empresaId) {
  const limite = await limiteMensagensIA(empresaId);
  if (limite === null) return { permitido: true, limite: null, usadas: null };

  const usadas = await mensagensUsadasNoMes(empresaId);
  return { permitido: usadas < limite, limite, usadas };
}

module.exports = { verificarLimiteIA, mensagensUsadasNoMes, limiteMensagensIA };
