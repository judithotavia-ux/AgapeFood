// Ponto de entrada em modo linha de comando (sem interface grafica).
// Para a versao com bandeja do Windows, notificacoes e configuracao por tela, use "npm run electron".
require('dotenv').config();
const AgenteImpressao = require('./core/agente');

const agente = new AgenteImpressao({
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3333/api',
  email: process.env.AGAPEFOOD_EMAIL,
  senha: process.env.AGAPEFOOD_SENHA
});

agente.on('log', ({ mensagem, nivel }) => {
  if (nivel === 'erro') console.error('[Agente]', mensagem);
  else console.log('[Agente]', mensagem);
});

console.log('=========================================');
console.log('   ÁGAPE FOOD — Agente de Impressão Local');
console.log('=========================================');

if (!process.env.AGAPEFOOD_EMAIL || !process.env.AGAPEFOOD_SENHA) {
  console.error('Configure AGAPEFOOD_EMAIL e AGAPEFOOD_SENHA no arquivo .env antes de iniciar (veja .env.example).');
  process.exit(1);
}

agente.iniciar().catch((e) => {
  console.error('[Agente] erro fatal ao iniciar:', e.message);
  process.exit(1);
});
