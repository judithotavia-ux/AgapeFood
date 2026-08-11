const prisma = require('../prisma/client');
const { registrarAuditoria } = require('../utils/auditoria');
const { invalidarCache } = require('../utils/sessoes');

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

  registrarAuditoria({
    empresaId: req.usuario.empresaId, usuarioId: req.usuario.id, ip: req.ip,
    acao: 'usuario.atribuir_perfil_personalizado', entidade: 'Usuario', entidadeId: id,
    valorAntes: { perfilPersonalizadoId: usuario.perfilPersonalizadoId }, valorDepois: { perfilPersonalizadoId: atualizado.perfilPersonalizadoId }
  });

  res.json(atualizado);
}

async function listarSessoes(req, res) {
  const { id } = req.params;
  const usuario = await prisma.usuario.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const sessoes = await prisma.sessaoUsuario.findMany({ where: { usuarioId: id }, orderBy: { criadoEm: 'desc' }, take: 20 });
  res.json(sessoes);
}

async function revogarSessao(req, res) {
  const { id, sessaoId } = req.params;
  const usuario = await prisma.usuario.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const sessao = await prisma.sessaoUsuario.findFirst({ where: { id: sessaoId, usuarioId: id } });
  if (!sessao) return res.status(404).json({ erro: 'Sessão não encontrada.' });

  await prisma.sessaoUsuario.update({ where: { id: sessaoId }, data: { revogadaEm: new Date() } });
  invalidarCache(sessao.jti);

  registrarAuditoria({
    empresaId: req.usuario.empresaId, usuarioId: req.usuario.id, ip: req.ip,
    acao: 'usuario.revogar_sessao', entidade: 'SessaoUsuario', entidadeId: sessaoId,
    valorAntes: { usuarioAlvo: usuario.nome }
  });

  res.json({ mensagem: 'Sessão encerrada.' });
}

module.exports = { listar, atribuirPerfil, listarSessoes, revogarSessao };
