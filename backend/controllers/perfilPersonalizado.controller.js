const prisma = require('../prisma/client');
const { registrarAuditoria } = require('../utils/auditoria');

const SELECAO = {
  id: true, nome: true, descricao: true, criadoEm: true, atualizadoEm: true,
  permissoes: { select: { permissao: { select: { chave: true } } } },
  _count: { select: { usuarios: true } }
};

function formatar(perfil) {
  return {
    id: perfil.id,
    nome: perfil.nome,
    descricao: perfil.descricao,
    criadoEm: perfil.criadoEm,
    atualizadoEm: perfil.atualizadoEm,
    permissoes: perfil.permissoes.map((p) => p.permissao.chave),
    usuariosVinculados: perfil._count.usuarios
  };
}

async function listar(req, res) {
  const perfis = await prisma.perfilPersonalizado.findMany({
    where: { empresaId: req.usuario.empresaId },
    select: SELECAO,
    orderBy: { nome: 'asc' }
  });
  res.json(perfis.map(formatar));
}

async function validarChaves(chaves) {
  if (!Array.isArray(chaves) || chaves.length === 0) return [];
  const encontradas = await prisma.permissao.findMany({ where: { chave: { in: chaves } }, select: { id: true, chave: true } });
  const validas = new Set(encontradas.map((p) => p.chave));
  const invalidas = chaves.filter((c) => !validas.has(c));
  if (invalidas.length) throw Object.assign(new Error('Permissões inválidas: ' + invalidas.join(', ')), { status: 400 });
  return encontradas;
}

async function criar(req, res) {
  const { nome, descricao, permissoes } = req.body || {};
  if (!nome || !nome.trim()) return res.status(400).json({ erro: 'Informe o nome do perfil.' });

  let permissoesValidas;
  try {
    permissoesValidas = await validarChaves(permissoes);
  } catch (e) {
    return res.status(e.status || 400).json({ erro: e.message });
  }

  const existente = await prisma.perfilPersonalizado.findUnique({ where: { empresaId_nome: { empresaId: req.usuario.empresaId, nome: nome.trim() } } });
  if (existente) return res.status(400).json({ erro: 'Já existe um perfil com esse nome.' });

  const perfil = await prisma.perfilPersonalizado.create({
    data: {
      nome: nome.trim(),
      descricao: descricao || null,
      empresaId: req.usuario.empresaId,
      permissoes: { create: permissoesValidas.map((p) => ({ permissaoId: p.id })) }
    },
    select: SELECAO
  });

  registrarAuditoria({
    empresaId: req.usuario.empresaId, usuarioId: req.usuario.id, ip: req.ip,
    acao: 'perfil_personalizado.criar', entidade: 'PerfilPersonalizado', entidadeId: perfil.id,
    valorDepois: formatar(perfil)
  });

  res.status(201).json(formatar(perfil));
}

async function atualizar(req, res) {
  const { id } = req.params;
  const existente = await prisma.perfilPersonalizado.findFirst({ where: { id, empresaId: req.usuario.empresaId }, select: SELECAO });
  if (!existente) return res.status(404).json({ erro: 'Perfil não encontrado.' });

  const { nome, descricao, permissoes } = req.body || {};

  let permissoesValidas;
  try {
    permissoesValidas = await validarChaves(permissoes);
  } catch (e) {
    return res.status(e.status || 400).json({ erro: e.message });
  }

  await prisma.$transaction([
    prisma.perfilPersonalizadoPermissao.deleteMany({ where: { perfilId: id } }),
    prisma.perfilPersonalizado.update({
      where: { id },
      data: {
        nome: nome !== undefined ? nome.trim() : existente.nome,
        descricao: descricao !== undefined ? (descricao || null) : existente.descricao,
        permissoes: { create: permissoesValidas.map((p) => ({ permissaoId: p.id })) }
      }
    })
  ]);

  const atualizado = await prisma.perfilPersonalizado.findUnique({ where: { id }, select: SELECAO });

  registrarAuditoria({
    empresaId: req.usuario.empresaId, usuarioId: req.usuario.id, ip: req.ip,
    acao: 'perfil_personalizado.atualizar', entidade: 'PerfilPersonalizado', entidadeId: id,
    valorAntes: formatar(existente), valorDepois: formatar(atualizado)
  });

  res.json(formatar(atualizado));
}

async function remover(req, res) {
  const { id } = req.params;
  const existente = await prisma.perfilPersonalizado.findFirst({ where: { id, empresaId: req.usuario.empresaId }, select: SELECAO });
  if (!existente) return res.status(404).json({ erro: 'Perfil não encontrado.' });

  // Usuarios com esse perfil voltam pro comportamento padrao do papel (FK e ON DELETE SET NULL).
  await prisma.perfilPersonalizado.delete({ where: { id } });

  registrarAuditoria({
    empresaId: req.usuario.empresaId, usuarioId: req.usuario.id, ip: req.ip,
    acao: 'perfil_personalizado.remover', entidade: 'PerfilPersonalizado', entidadeId: id,
    valorAntes: formatar(existente)
  });

  res.json({ mensagem: 'Perfil removido. Usuários que tinham esse perfil voltaram ao padrão do papel deles.' });
}

module.exports = { listar, criar, atualizar, remover };
