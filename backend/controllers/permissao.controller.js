const prisma = require('../prisma/client');
const { permissoesEfetivas } = require('../utils/permissoes');

async function listarCatalogo(req, res) {
  const permissoes = await prisma.permissao.findMany({ orderBy: [{ modulo: 'asc' }, { acao: 'asc' }] });
  res.json(permissoes);
}

async function minhasPermissoes(req, res) {
  const permissoes = await permissoesEfetivas(req.usuario);
  res.json({ papel: req.usuario.papel, permissoes: [...permissoes].sort() });
}

module.exports = { listarCatalogo, minhasPermissoes };
