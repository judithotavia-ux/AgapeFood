const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function arquivoConfig() {
  return path.join(app.getPath('userData'), 'config.json');
}

const PADRAO = {
  backendUrl: '',
  email: '',
  senha: '',
  iniciarComWindows: false
};

function obter() {
  try {
    const conteudo = fs.readFileSync(arquivoConfig(), 'utf-8');
    return { ...PADRAO, ...JSON.parse(conteudo) };
  } catch (e) {
    return { ...PADRAO };
  }
}

function salvar(config) {
  const atual = obter();
  const novo = { ...atual, ...config };
  fs.writeFileSync(arquivoConfig(), JSON.stringify(novo, null, 2), 'utf-8');
  return novo;
}

module.exports = { obter, salvar };
