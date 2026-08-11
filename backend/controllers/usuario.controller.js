const prisma = require('../prisma/client');

// Diretorio minimo de usuarios da empresa - existe so pra dar suporte a atribuicao de perfil
// personalizado. Nao substitui o cadastro de garcons (garcom.controller.js) nem cria/edita conta.
async function listar(req, res) {
  const usuarios = await prisma.usuario.findMany({
    where: { empresaId: req.usuario.empresaId, ativo: true },
    select: { id: true, nome: true, email: true, papel: true, perfilPersonalizadoId: true },
    orderBy: { nome: 'asc' }
  });
  res.json(usuarios);
}

async function atribuirPerfil(req, res) {
  const { id } = req.params;
  const { perfilPersonalizadoId } = req.body || {};

  const usuario = await prisma.usuario.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  if (perfilPersonalizadoId) {
    const perfil = await prisma.perfilPersonalizado.findFirst({ where: { id: perfilPersonalizadoId, empresaId: req.usuario.empresaId } });
    if (!perfil) return res.status(400).json({ erro: 'Perfil personalizado inválido.' });
  }

  const atualizado = await prisma.usuario.update({
    where: { id },
    data: { perfilPersonalizadoId: perfilPersonalizadoId || null },
    select: { id: true, nome: true, papel: true, perfilPersonalizadoId: true }
  });
  res.json(atualizado);
}

module.exports = { listar, atribuirPerfil };
