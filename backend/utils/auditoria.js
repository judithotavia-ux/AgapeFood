const prisma = require('../prisma/client');

// Auditoria e best-effort: uma falha aqui nunca deve derrubar a acao que estava sendo registrada.
async function registrarAuditoria({ empresaId, usuarioId, acao, entidade, entidadeId, valorAntes, valorDepois, ip }) {
  try {
    await prisma.logAuditoria.create({
      data: {
        empresaId,
        usuarioId: usuarioId || null,
        acao,
        entidade,
        entidadeId: entidadeId || null,
        valorAntes: valorAntes ?? undefined,
        valorDepois: valorDepois ?? undefined,
        ip: ip || null
      }
    });
  } catch (e) {
    console.error('Falha ao registrar auditoria:', e.message);
  }
}

module.exports = { registrarAuditoria };
