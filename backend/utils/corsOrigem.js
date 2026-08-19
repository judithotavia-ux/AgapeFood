// Origem "prod" fixa (CORS_ORIGIN), qualquer preview deploy da Vercel deste projeto e o dominio
// proprio (com/sem www) - compartilhado entre o CORS normal (Express) e o CORS do socket.io, pra
// nao ter duas listas que podem ficar dessincronizadas. Foi exatamente isso que quebrou o alarme
// de pedido novo: o socket.io tinha sua propria regra (so CORS_ORIGIN), mais restrita que a da
// API normal, entao um preview deploy da Vercel conseguia logar mas nunca conectava o tempo real.
const ORIGEM_PRODUCAO = process.env.CORS_ORIGIN;
const REGEX_PREVIEW_VERCEL = /^https:\/\/agape-food-[\w-]+\.vercel\.app$/;
const DOMINIOS_PROPRIOS = ['https://gratidaoagape.com.br', 'https://www.gratidaoagape.com.br'];

function origemPermitida(origin) {
  if (!origin) return true;
  if (!ORIGEM_PRODUCAO) return true;
  return origin === ORIGEM_PRODUCAO || origin === 'http://localhost:5173' || REGEX_PREVIEW_VERCEL.test(origin) || DOMINIOS_PROPRIOS.includes(origin);
}

module.exports = { origemPermitida };
