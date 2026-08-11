const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');
const { temPermissao } = require('./permissoes');

const PAPEIS_SEM_LIMITE = ['ADMIN', 'SUPER_ADMIN', 'GERENTE'];

// ADMIN/SUPER_ADMIN/GERENTE ja sao quem aprova excecao - nao faz sentido eles pedirem aprovacao
// pra si mesmos. Os demais papeis dependem do limite configurado pra empresa (sem limite
// cadastrado = qualquer desconto exige aprovacao, nunca "sem limite" por omissao).
async function descontoDentroDoLimite(usuario, { percentual, valor }) {
  if (PAPEIS_SEM_LIMITE.includes(usuario.papel)) return true;

  const limite = await prisma.limiteAprovacao.findUnique({
    where: { empresaId_papel: { empresaId: usuario.empresaId, papel: usuario.papel } }
  });
  if (!limite) return false;

  if (percentual !== undefined && limite.limiteDescontoPercentual !== null) {
    if (percentual <= Number(limite.limiteDescontoPercentual)) return true;
  }
  if (valor !== undefined && limite.limiteDescontoValor !== null) {
    if (valor <= Number(limite.limiteDescontoValor)) return true;
  }
  return false;
}

// Procura, entre os usuarios da empresa com permissao de aprovar excecao, algum cujo PIN bata.
// O caixa so pede "digite o PIN" - nao pede pra escolher o aprovador - entao precisa varrer os
// candidatos e comparar hash a hash (lista pequena em qualquer restaurante real).
async function encontrarAprovadorPeloPin(empresaId, pin) {
  if (!pin) return null;

  const candidatos = await prisma.usuario.findMany({
    where: { empresaId, ativo: true, pinHash: { not: null } },
    select: { id: true, nome: true, papel: true, pinHash: true }
  });

  for (const candidato of candidatos) {
    if (!(await temPermissao(candidato, 'caixa.aprovar_excecao'))) continue;
    if (await bcrypt.compare(String(pin), candidato.pinHash)) {
      return { id: candidato.id, nome: candidato.nome };
    }
  }
  return null;
}

async function registrarAprovacao({ empresaId, pedidoId, solicitanteId, aprovadorId, tipo, valorAntes, valorDepois, percentual, motivo }) {
  return prisma.aprovacaoGerencial.create({
    data: { empresaId, pedidoId, solicitanteId, aprovadorId, tipo, valorAntes, valorDepois, percentual, motivo: motivo || null }
  });
}

module.exports = { descontoDentroDoLimite, encontrarAprovadorPeloPin, registrarAprovacao, PAPEIS_SEM_LIMITE };
