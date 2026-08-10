const EventEmitter = require('events');
const axios = require('axios');
const { io } = require('socket.io-client');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const { renderizarComanda } = require('../renderizador');

const RETRY_DELAYS_MS = [2000, 5000, 10000];

// Motor do agente de impressao, independente de CLI ou Electron - quem usa esta classe
// escuta os eventos emitidos (log, conectado, novo-pedido, job-impresso, job-falhou, etc)
// e decide como mostrar isso (console, tray, notificacao nativa...).
class AgenteImpressao extends EventEmitter {
  constructor({ backendUrl, email, senha }) {
    super();
    this.backendUrl = (backendUrl || '').replace(/\/$/, '');
    this.socketUrl = this.backendUrl.replace(/\/api$/, '');
    this.email = email;
    this.senha = senha;
    this.token = null;
    this.usuario = null;
    this.impressorasPorId = new Map();
    this.socket = null;
    this.pausado = false;
    this.conectado = false;
    this.intervalId = null;
  }

  log(mensagem, nivel = 'info') {
    this.emit('log', { mensagem, nivel, quando: new Date() });
  }

  api() {
    return axios.create({ baseURL: this.backendUrl, headers: { Authorization: `Bearer ${this.token}` } });
  }

  async login() {
    const { data } = await axios.post(`${this.backendUrl}/auth/login`, { email: this.email, senha: this.senha });
    this.token = data.token;
    this.usuario = data.usuario;
    this.log(`Autenticado como ${data.usuario.nome} (${data.usuario.email}).`);
    this.emit('autenticado', data.usuario);
  }

  async atualizarImpressoras() {
    const { data } = await this.api().get('/impressoras');
    this.impressorasPorId = new Map(data.filter((p) => p.ativa).map((p) => [p.id, p]));
    this.log(`${this.impressorasPorId.size} impressora(s) ativa(s) carregada(s).`);
    this.emit('impressoras-atualizadas', Array.from(this.impressorasPorId.values()));
  }

  montarInterface(impressora) {
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

  montarPrinter(impressora) {
    const opcoes = {
      type: PrinterTypes.EPSON,
      interface: this.montarInterface(impressora),
      width: impressora.caracteresPorLinha || 48,
      characterSet: CharacterSet.PC860_PORTUGUESE,
      removeSpecialCharacters: false,
      options: { timeout: 5000 }
    };

    if (impressora.tipoConexao === 'USB') {
      try {
        // eslint-disable-next-line global-require
        opcoes.driver = require('printer');
      } catch (e) {
        throw new Error('Pacote "printer" não instalado - necessário para impressoras USB. Rode "npm install printer" na pasta do agente (veja o README).');
      }
    }

    return new ThermalPrinter(opcoes);
  }

  async reportarResultado(jobId, status, erro, tentativas) {
    try {
      await this.api().post(`/print-jobs/${jobId}/resultado`, { status, erro: erro || undefined, tentativas });
    } catch (e) {
      this.log(`Não foi possível reportar o resultado do job ${jobId} ao servidor: ${e.message}`, 'erro');
    }
  }

  async processarJob(job) {
    if (this.pausado) {
      this.log(`Impressão pausada - job ${job.id} (${job.tipoDocumento}) ficará pendente até você retomar.`, 'aviso');
      return;
    }

    this.emit('job-recebido', job);
    const impressora = this.impressorasPorId.get(job.printerId) || job.printer;
    if (!impressora) {
      this.log(`Job ${job.id}: impressora não encontrada na configuração local deste agente.`, 'erro');
      return this.reportarResultado(job.id, 'FAILED', 'Impressora não está configurada/ativa neste agente.', 0);
    }

    let payload;
    try {
      payload = JSON.parse(job.payload);
    } catch (e) {
      return this.reportarResultado(job.id, 'FAILED', 'Payload da comanda inválido (não é um JSON válido).', 0);
    }

    for (let tentativa = 1; tentativa <= RETRY_DELAYS_MS.length + 1; tentativa++) {
      try {
        const printer = this.montarPrinter(impressora);
        renderizarComanda(printer, payload, impressora.copias);
        await printer.execute();
        this.log(`✓ impresso: ${job.tipoDocumento} em "${impressora.nome}" (tentativa ${tentativa})`);
        this.emit('job-impresso', { job, impressora, tentativas: tentativa });
        return this.reportarResultado(job.id, 'PRINTED', null, tentativa);
      } catch (erro) {
        const mensagemErro = String(erro.message || erro);
        this.log(`✗ falha ao imprimir "${impressora.nome}" (tentativa ${tentativa}): ${mensagemErro}`, 'erro');
        const ultimaTentativa = tentativa > RETRY_DELAYS_MS.length;
        if (ultimaTentativa) {
          this.emit('job-falhou', { job, impressora, erro: mensagemErro });
          return this.reportarResultado(job.id, 'FAILED', mensagemErro, tentativa);
        }
        await this.reportarResultado(job.id, 'RETRYING', mensagemErro, tentativa);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[tentativa - 1]));
      }
    }
  }

  async buscarFilaPendente() {
    try {
      const [{ data: pendentes }, { data: retentando }] = await Promise.all([
        this.api().get('/print-jobs', { params: { status: 'PENDING' } }),
        this.api().get('/print-jobs', { params: { status: 'RETRYING' } })
      ]);
      const jobs = [...pendentes, ...retentando];
      if (jobs.length) this.log(`${jobs.length} job(s) pendente(s) encontrados na fila - processando agora.`);
      for (const job of jobs) await this.processarJob(job);
    } catch (e) {
      this.log(`Erro ao consultar a fila pendente: ${e.message}`, 'erro');
    }
  }

  async listarImpressoras() {
    const { data } = await this.api().get('/impressoras');
    return data;
  }

  async listarFila(params) {
    const { data } = await this.api().get('/print-jobs', { params });
    return data;
  }

  async testarImpressora(impressoraId) {
    const { data } = await this.api().post(`/impressoras/${impressoraId}/testar`);
    return data;
  }

  async reimprimirJob(jobId) {
    const { data } = await this.api().post(`/print-jobs/${jobId}/reimprimir`);
    return data;
  }

  async retryJob(jobId) {
    const { data } = await this.api().post(`/print-jobs/${jobId}/retry`);
    return data;
  }

  async cancelarJob(jobId) {
    const { data } = await this.api().post(`/print-jobs/${jobId}/cancelar`);
    return data;
  }

  pausar() {
    this.pausado = true;
    this.log('Impressão pausada.', 'aviso');
    this.emit('pausado');
  }

  retomar() {
    this.pausado = false;
    this.log('Impressão retomada.');
    this.emit('retomado');
    this.buscarFilaPendente();
  }

  async iniciar() {
    if (!this.backendUrl || !this.email || !this.senha) {
      throw new Error('Configuração incompleta: informe a URL do backend, e-mail e senha.');
    }

    await this.login();
    await this.atualizarImpressoras();
    await this.buscarFilaPendente();

    this.socket = io(this.socketUrl, { auth: { token: this.token }, transports: ['polling'], upgrade: false });

    this.socket.on('connect', () => {
      this.conectado = true;
      this.log('Conectado em tempo real ao AgapeFood. Aguardando novos pedidos...');
      this.emit('conectado');
      this.buscarFilaPendente();
    });

    this.socket.on('disconnect', () => {
      this.conectado = false;
      this.log('Desconectado do AgapeFood, tentando reconectar automaticamente...', 'aviso');
      this.emit('desconectado');
    });

    this.socket.on('impressao:novo-job', (job) => {
      this.log(`Novo pedido de impressão recebido: ${job.tipoDocumento} para "${job.printer?.nome || job.printerId}".`);
      this.emit('novo-pedido', job);
      this.processarJob(job);
    });

    this.intervalId = setInterval(() => {
      this.atualizarImpressoras().catch((e) => this.log(`Erro ao atualizar impressoras: ${e.message}`, 'erro'));
    }, 60000);
  }

  parar() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.conectado = false;
  }
}

module.exports = AgenteImpressao;
