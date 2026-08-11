const prisma = require('../prisma/client');
const { DEFAULTS_POR_PAPEL } = require('./catalogoPermissoes');

// Fase 1: as permissoes efetivas de um usuario sao as do perfil padrao do seu papel.
// Fases futuras (perfis personalizados, permissoes temporarias) vao compor esse resultado
// em vez de substituir esta funcao.
async function permissoesDoPapel(papel) {
  const vinculos = await prisma.perfilPermissaoPadrao.findMany({
    where: { papel },
    select: { permissao: { select: { chave: true } } }
  });
  if (vinculos.length > 0) return new Set(vinculos.map((v) => v.permissao.chave));
  return new Set(DEFAULTS_POR_PAPEL[papel] || []);
}

async function permissoesEfetivas(usuario) {
  if (!usuario?.papel) return new Set();
  return permissoesDoPapel(usuario.papel);
}

async function temPermissao(usuario, chave) {
  const permissoes = await permissoesEfetivas(usuario);
  return permissoes.has(chave);
}

function exigirPermissao(chave) {
  return async (req, res, next) => {
    try {
      if (!req.usuario || !(await temPermissao(req.usuario, chave))) {
        return res.status(403).json({ erro: 'Você não tem permissão para esta ação.' });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { permissoesDoPapel, permissoesEfetivas, temPermissao, exigirPermissao };
