const path = require('path');

// Local: backend/uploads. Producao: aponta pra um volume persistente via UPLOADS_DIR - o
// Railway reinicia o container a cada deploy, e sem um volume montado ali, todo arquivo salvo
// por multer.diskStorage some, mesmo com a URL continuando salva no banco (foi o que apagou a
// logo da empresa depois dos deploys de hoje).
const BASE = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');

function caminhoUploads(...segmentos) {
  return path.join(BASE, ...segmentos);
}

module.exports = { caminhoUploads, UPLOADS_BASE: BASE };
