const prisma = require('../prisma/client');

async function listar(req, res) {
  const logs = await prisma.logAuditoria.findMany({
    where: { empresaId: req.usuario.empresaId },
    include: { usuario: { select: { nome: true } } },
    orderBy: { criadoEm: 'desc' },
    take: 200
  });
  res.json(logs);
}

module.exports = { listar };
