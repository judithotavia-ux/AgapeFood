const path = require('path');
const { app, BrowserWindow, Tray, Menu, Notification, ipcMain } = require('electron');
const AgenteImpressao = require('../core/agente');
const configStore = require('./config-store');

const ICONE = path.join(__dirname, '..', 'assets', 'icon.png');
const MAX_LOGS = 300;

let mainWindow = null;
let tray = null;
let agente = null;
let logs = [];

function registrarLog(entrada) {
  logs.push(entrada);
  if (logs.length > MAX_LOGS) logs.shift();
  enviarParaRenderer('agente:log', entrada);
}

function enviarParaRenderer(canal, dados) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(canal, dados);
}

function criarJanela(aba) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    if (aba) enviarParaRenderer('agente:navegar', aba);
    return;
  }

  mainWindow = new BrowserWindow({
    width: 460,
    height: 680,
    minWidth: 400,
    minHeight: 480,
    icon: ICONE,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('close', (evento) => {
    if (!app.isQuitting) {
      evento.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (aba) enviarParaRenderer('agente:navegar', aba);
  });
}

function criarTray() {
  tray = new Tray(ICONE);
  tray.setToolTip('Ágape Food — Agente de Impressão (iniciando...)');
  tray.on('click', () => criarJanela());
  atualizarMenuTray();
}

function atualizarMenuTray() {
  if (!tray) return;
  const pausado = agente?.pausado || false;
  const template = [
    { label: 'Abrir Ágape Food', click: () => criarJanela() },
    { type: 'separator' },
    { label: 'Impressoras', click: () => criarJanela('impressoras') },
    { label: 'Fila de Impressão', click: () => criarJanela('fila') },
    { type: 'separator' },
    {
      label: pausado ? 'Retomar Impressão' : 'Pausar Impressão',
      click: () => {
        if (!agente) return;
        pausado ? agente.retomar() : agente.pausar();
        atualizarMenuTray();
      }
    },
    { label: 'Configurações', click: () => criarJanela('config') },
    { type: 'separator' },
    { label: 'Sair', click: () => { app.isQuitting = true; app.quit(); } }
  ];
  tray.setContextMenu(Menu.buildFromTemplate(template));
}

function atualizarTooltip() {
  if (!tray || !agente) return;
  const status = agente.pausado ? '🟡 Pausado' : agente.conectado ? '🟢 Conectado' : '🔴 Desconectado';
  tray.setToolTip(`Ágape Food — Agente de Impressão\n${status}`);
}

async function iniciarAgente() {
  const config = configStore.obter();

  if (agente) {
    agente.parar();
    agente.removeAllListeners();
  }

  if (!config.backendUrl || !config.email || !config.senha) {
    registrarLog({ mensagem: 'Configuração incompleta — abra Configurações para conectar sua conta AgapeFood.', nivel: 'aviso', quando: new Date() });
    criarJanela('config');
    return;
  }

  agente = new AgenteImpressao(config);

  agente.on('log', registrarLog);
  agente.on('conectado', () => { atualizarTooltip(); enviarParaRenderer('agente:status', obterStatus()); });
  agente.on('desconectado', () => { atualizarTooltip(); enviarParaRenderer('agente:status', obterStatus()); });
  agente.on('pausado', () => { atualizarTooltip(); atualizarMenuTray(); enviarParaRenderer('agente:status', obterStatus()); });
  agente.on('retomado', () => { atualizarTooltip(); atualizarMenuTray(); enviarParaRenderer('agente:status', obterStatus()); });
  agente.on('impressoras-atualizadas', (lista) => enviarParaRenderer('agente:impressoras', lista));

  agente.on('novo-pedido', (job) => {
    if (Notification.isSupported()) {
      new Notification({
        title: 'Novo pedido para impressão',
        body: `${job.tipoDocumento}${job.printer?.nome ? ' — ' + job.printer.nome : ''}${job.pedido ? ' · Pedido #' + job.pedido.numero : ''}`,
        icon: ICONE
      }).show();
    }
  });

  agente.on('job-falhou', ({ impressora, erro }) => {
    if (Notification.isSupported()) {
      new Notification({
        title: `⚠ Falha ao imprimir em "${impressora.nome}"`,
        body: erro,
        icon: ICONE
      }).show();
    }
  });

  try {
    await agente.iniciar();
  } catch (e) {
    registrarLog({ mensagem: `Erro ao iniciar: ${e.message}`, nivel: 'erro', quando: new Date() });
    criarJanela('config');
  }
  atualizarTooltip();
}

function obterStatus() {
  return {
    conectado: agente?.conectado || false,
    pausado: agente?.pausado || false,
    usuario: agente?.usuario || null
  };
}

// --- IPC ---

ipcMain.handle('config:obter', () => configStore.obter());

ipcMain.handle('config:salvar', async (event, novaConfig) => {
  configStore.salvar(novaConfig);
  await iniciarAgente();
  return true;
});

ipcMain.handle('config:iniciar-com-windows', (event, ativar) => {
  app.setLoginItemSettings({ openAtLogin: ativar, path: process.execPath });
  configStore.salvar({ iniciarComWindows: ativar });
  return true;
});

ipcMain.handle('agente:status', () => obterStatus());
ipcMain.handle('agente:logs', () => logs);
ipcMain.handle('agente:pausar', () => { agente?.pausar(); atualizarMenuTray(); return true; });
ipcMain.handle('agente:retomar', () => { agente?.retomar(); atualizarMenuTray(); return true; });

ipcMain.handle('agente:impressoras', async () => {
  if (!agente) return [];
  return agente.listarImpressoras();
});

ipcMain.handle('agente:fila', async (event, params) => {
  if (!agente) return [];
  return agente.listarFila(params);
});

ipcMain.handle('agente:testar-impressora', async (event, impressoraId) => {
  if (!agente) throw new Error('Agente não está conectado.');
  return agente.testarImpressora(impressoraId);
});

ipcMain.handle('agente:reimprimir', async (event, jobId) => {
  if (!agente) throw new Error('Agente não está conectado.');
  return agente.reimprimirJob(jobId);
});

ipcMain.handle('agente:retry-job', async (event, jobId) => {
  if (!agente) throw new Error('Agente não está conectado.');
  return agente.retryJob(jobId);
});

ipcMain.handle('agente:cancelar-job', async (event, jobId) => {
  if (!agente) throw new Error('Agente não está conectado.');
  return agente.cancelarJob(jobId);
});

// --- Ciclo de vida ---

app.whenReady().then(() => {
  criarTray();
  iniciarAgente();
});

app.on('window-all-closed', (evento) => {
  // O agente é feito pra ficar rodando em segundo plano - fechar a janela nunca fecha o programa,
  // só a bandeja (ícone Sair) ou app.quit() explícito fazem isso.
  evento.preventDefault();
});

app.on('before-quit', () => { app.isQuitting = true; });
