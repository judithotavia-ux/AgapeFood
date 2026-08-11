const prisma = require('../prisma/client');

// Cache curto em memoria pra nao bater no banco a cada request checando revogacao - o Railway
// MySQL desse projeto tem connection_limit=1 e uma query extra em toda rota autenticada deixaria
// o app inteiro mais lento. 60s de tolerancia entre "revogar" e "parar de funcionar de fato" e um
// custo aceitavel; a revogacao explicita (revogarSessao) invalida o cache na hora pra reduzir isso.
const TTL_CACHE_MS = 60 * 1000;
const cache = new Map();

async function sessaoValida(jti) {
  // Tokens emitidos antes desta fase nao tem jti - continuam validos ate expirar sozinhos (7 dias).
  if (!jti) return true;

  const agora = Date.now();
  const cacheado = cache.get(jti);
  if (cacheado && cacheado.expiraCacheEm > agora) return !cacheado.revogada;

  const sessao = await prisma.sessaoUsuario.findUnique({ where: { jti }, select: { revogadaEm: true } });
  const revogada = !sessao || !!sessao.revogadaEm;
  cache.set(jti, { revogada, expiraCacheEm: agora + TTL_CACHE_MS });

  if (sessao && !revogada) {
    prisma.sessaoUsuario.update({ where: { jti }, data: { ultimoAcessoEm: new Date() } }).catch(() => {});
  }
  return !revogada;
}

function invalidarCache(jti) {
  cache.delete(jti);
}

module.exports = { sessaoValida, invalidarCache };
