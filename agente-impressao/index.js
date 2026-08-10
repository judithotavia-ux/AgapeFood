require('dotenv').config();
const axios = require('axios');
const { io } = require('socket.io-client');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const { renderizarComanda } = require('./renderizador');

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:3333/api').replace(/\/$/, '');
const SOCKET_URL = BACKEND_URL.replace(/\/api$/, '');
const EMAIL = process.env.AGAPEFOOD_EMAIL;
const SENHA = process.env.AGAPEFOOD_SENHA;
const RETRY_DELAYS_MS = [2000, 5000, 10000];

let token = null;
let impressorasPorId = new Map();

function api() {
  return axios.create({ baseURL: BACKEND_URL, headers: { Authorization: `Bearer ${token}` } });
}

async function login() {
  const { data } = await axios.post(`${BACKEND_URL}/auth/login`, { email: EMAIL, senha: SENHA });
  token = data.token;
  console.log(`[Agente] autenticado como ${data.usuario.nome} (${data.usuario.email}).`);
}

async function atualizarImpressoras() {
  const { data } = await api().get('/impressoras');
  impressorasPorId = new Map(data.filter((p) => p.ativa).map((p) => [p.id, p]));
  console.log(`[Agente] ${impressorasPorId.size} impressora(s) ativa(s) carregada(s) da configuração.`);
}

function montarInterface(impressora) {
  if (impressora.tipoConexao === 'REDE') {
    const alvo = (impressora.identificadorLocal || '').trim();
    if (!alvo) throw new Error('Impressora de rede sem IP/porta configurado (campo "Endereço de rede" em Impressoras).');
    return alvo.startsWith('tcp://') ? alvo : `tcp://${alvo}`;
  }
  if (impressora.tipoConexao === 'USB') {
    const nome = (impressora.identificadorLocal || '').trim();
    if (!nome) throw new Error('Impressora USB sem nome configurado (campo "Identificador USB" em Impressoras) - use o nome exato da impressora instalada no Windows.');
    return `printer:${nome}`;
  }
  throw new Error(`Tipo de conexão "${impressora.tipoConexao}" ainda não é suportado por este agente (Bluetooth está preparado no cadastro, mas a impressão em si chega numa fase futura).`);
}

function montarPrinter(impressora) {
  const opcoes = {
    type: PrinterTypes.EPSON,
    interface: montarInterface(impressora),
    width: impressora.caracteresPorLinha || 48,
    characterSet: CharacterSet.PC860_PORTUGUESE,
    removeSpecialCharacters: false,
    options: { timeout: 5000 }
  };

  if (impressora.tipoConexao === 'USB') {
    // Driver nativo, so exigido para impressoras USB - ver README para instalacao
    // eslint-disable-next-line global-require
    opcoes.driver = require('printer');
  }

  return new ThermalPrinter(opcoes);
}

async function reportarResultado(jobId, status, erro, tentativas) {
  try {
    await api().post(`/print-jobs/${jobId}/resultado`, { status, erro: erro || undefined, tentativas });
  } catch (e) {
    console.error(`[Agente] não foi possível reportar o resultado do job ${jobId} ao servidor:`, e.message);
  }
}

async function processarJob(job) {
  const impressora = impressorasPorId.get(job.printerId) || job.printer;
  if (!impressora) {
    console.error(`[Agente] job ${job.id}: impressora não encontrada na configuração local deste agente.`);
    return reportarResultado(job.id, 'FAILED', 'Impressora não está configurada/ativa neste agente.', 0);
  }

  let payload;
  try {
    payload = JSON.parse(job.payload);
  } catch (e) {
    return reportarResultado(job.id, 'FAILED', 'Payload da comanda inválido (não é um JSON válido).', 0);
  }

  for (let tentativa = 1; tentativa <= RETRY_DELAYS_MS.length + 1; tentativa++) {
    try {
      const printer = montarPrinter(impressora);
      renderizarComanda(printer, payload, impressora.copias);
      await printer.execute();
      console.log(`[Agente] ✓ impresso: ${job.tipoDocumento} em "${impressora.nome}" (tentativa ${tentativa})`);
      return reportarResultado(job.id, 'PRINTED', null, tentativa);
    } catch (erro) {
      console.error(`[Agente] ✗ falha ao imprimir "${impressora.nome}" (tentativa ${tentativa}):`, erro.message || erro);
      const ultimaTentativa = tentativa > RETRY_DELAYS_MS.length;
      if (ultimaTentativa) {
        return reportarResultado(job.id, 'FAILED', String(erro.message || erro), tentativa);
      }
      await reportarResultado(job.id, 'RETRYING', String(erro.message || erro), tentativa);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[tentativa - 1]));
    }
  }
}

async function buscarFilaPendente() {
  try {
    const [{ data: pendentes }, { data: retentando }] = await Promise.all([
      api().get('/print-jobs', { params: { status: 'PENDING' } }),
      api().get('/print-jobs', { params: { status: 'RETRYING' } })
    ]);
    const jobs = [...pendentes, ...retentando];
    if (jobs.length) console.log(`[Agente] ${jobs.length} job(s) pendente(s) encontrados na fila - imprimindo agora.`);
    for (const job of jobs) await processarJob(job);
  } catch (e) {
    console.error('[Agente] erro ao consultar a fila pendente:', e.message);
  }
}

async function iniciar() {
  console.log('=========================================');
  console.log('   ÁGAPE FOOD — Agente de Impressão Local');
  console.log('=========================================');

  if (!EMAIL || !SENHA) {
    console.error('Configure AGAPEFOOD_EMAIL e AGAPEFOOD_SENHA no arquivo .env antes de iniciar (veja .env.example).');
    process.exit(1);
  }

  await login();
  await atualizarImpressoras();
  await buscarFilaPendente();

  const socket = io(SOCKET_URL, { auth: { token }, transports: ['polling'], upgrade: false });

  socket.on('connect', () => {
    console.log('[Agente] conectado em tempo real ao AgapeFood. Aguardando novos pedidos...');
    buscarFilaPendente();
  });

  socket.on('disconnect', () => console.log('[Agente] desconectado do AgapeFood, tentando reconectar automaticamente...'));

  socket.on('impressao:novo-job', (job) => {
    console.log(`[Agente] novo pedido de impressão recebido: ${job.tipoDocumento} para "${job.printer?.nome || job.printerId}".`);
    processarJob(job);
  });

  // Recarrega a lista de impressoras periodicamente (novas impressoras cadastradas, mudanças de endereço/setor)
  setInterval(() => atualizarImpressoras().catch((e) => console.error('[Agente] erro ao atualizar impressoras:', e.message)), 60000);
}

iniciar().catch((e) => {
  console.error('[Agente] erro fatal ao iniciar:', e.message);
  process.exit(1);
});
