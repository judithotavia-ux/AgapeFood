const SETOR_LABEL = {
  COZINHA: 'Cozinha', BAR: 'Bar', CONFEITARIA: 'Confeitaria', PIZZARIA: 'Pizzaria',
  ACAI: 'Açaí', SALGADOS: 'Salgados', BALCAO: 'Balcão', GARCOM: 'Garçom', CAIXA: 'Caixa', DELIVERY: 'Delivery', OUTRO: 'Outro'
};
const STATUS_JOB_LABEL = {
  PENDING: 'Pendente', PRINTING: 'Imprimindo', PRINTED: 'Impresso', FAILED: 'Falhou', RETRYING: 'Tentando novamente', CANCELLED: 'Cancelado'
};
const TIPO_DOC_LABEL = {
  COMANDA_COZINHA: 'Comanda de produção', COMANDA_GARCOM: 'Comanda de garçom', COMANDA_DELIVERY: 'Comanda de delivery',
  COMANDA_CAIXA: 'Comanda de caixa', CANCELAMENTO: 'Aviso de cancelamento', ALTERACAO: 'Aviso de alteração', TESTE: 'Teste de impressão'
};

function $(sel) { return document.querySelector(sel); }

function trocarAba(aba) {
  document.querySelectorAll('nav#abas button').forEach((b) => b.classList.toggle('ativo', b.dataset.aba === aba));
  document.querySelectorAll('main .aba').forEach((s) => s.classList.toggle('ativo', s.id === `aba-${aba}`));
  if (aba === 'impressoras') carregarImpressoras();
  if (aba === 'fila') carregarFila();
}

document.querySelectorAll('nav#abas button').forEach((b) => b.addEventListener('click', () => trocarAba(b.dataset.aba)));
window.agapefood.aoNavegar((aba) => trocarAba(aba));

// --- Status ---

function formatarQuando(quando) {
  return new Date(quando).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function adicionarLog(entrada) {
  const div = document.createElement('div');
  div.className = `log-item ${entrada.nivel || ''}`.trim();
  div.innerHTML = `<span class="quando">${formatarQuando(entrada.quando)}</span>${entrada.mensagem}`;
  $('#lista-logs').appendChild(div);
  while ($('#lista-logs').children.length > 200) $('#lista-logs').removeChild($('#lista-logs').firstChild);
}

function atualizarBadge(status) {
  const badge = $('#status-badge');
  if (status.pausado) {
    badge.textContent = '🟡 Pausado';
    badge.className = 'badge badge-pausado';
  } else if (status.conectado) {
    badge.textContent = '🟢 Conectado';
    badge.className = 'badge badge-online';
  } else {
    badge.textContent = '🔴 Desconectado';
    badge.className = 'badge badge-offline';
  }
  $('#status-conexao').textContent = status.pausado ? 'Pausado' : status.conectado ? 'Online' : 'Offline';
  $('#status-usuario').textContent = status.usuario ? `${status.usuario.nome}` : '—';
  $('#btn-pausar-retomar').textContent = status.pausado ? 'Retomar' : 'Pausar';
}

window.agapefood.aoReceberLog(adicionarLog);
window.agapefood.aoAtualizarStatus(atualizarBadge);

$('#btn-pausar-retomar').addEventListener('click', async () => {
  const status = await window.agapefood.obterStatus();
  if (status.pausado) await window.agapefood.retomar();
  else await window.agapefood.pausar();
  atualizarBadge(await window.agapefood.obterStatus());
});

async function carregarStatusInicial() {
  const status = await window.agapefood.obterStatus();
  atualizarBadge(status);
  const logs = await window.agapefood.obterLogs();
  $('#lista-logs').innerHTML = '';
  logs.forEach(adicionarLog);
}

// --- Impressoras ---

async function carregarImpressoras() {
  const lista = $('#lista-impressoras');
  lista.innerHTML = '<p class="ajuda">Carregando…</p>';
  try {
    const impressoras = await window.agapefood.listarImpressoras();
    if (!impressoras.length) {
      lista.innerHTML = '<p class="ajuda">Nenhuma impressora cadastrada. Cadastre em Impressoras no painel web.</p>';
      return;
    }
    lista.innerHTML = '';
    impressoras.forEach((imp) => {
      const div = document.createElement('div');
      div.className = 'item-cartao';
      div.innerHTML = `
        <div class="titulo">${imp.nome} ${imp.padrao ? '⭐' : ''}</div>
        <div class="detalhe">${SETOR_LABEL[imp.setor] || imp.setor} · ${imp.status}</div>
        <div class="acoes"><button data-id="${imp.id}" class="btn-testar">Testar impressão</button></div>
      `;
      lista.appendChild(div);
    });
    lista.querySelectorAll('.btn-testar').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.textContent = 'Enviando…';
        try {
          await window.agapefood.testarImpressora(btn.dataset.id);
          btn.textContent = 'Enviado ✓';
        } catch (e) {
          btn.textContent = 'Erro';
        }
        setTimeout(() => { btn.textContent = 'Testar impressão'; }, 3000);
      });
    });
  } catch (e) {
    lista.innerHTML = `<p class="ajuda">Não foi possível carregar as impressoras: ${e.message}</p>`;
  }
}

// --- Fila ---

async function carregarFila() {
  const lista = $('#lista-fila');
  lista.innerHTML = '<p class="ajuda">Carregando…</p>';
  try {
    const jobs = await window.agapefood.listarFila({});
    if (!jobs.length) {
      lista.innerHTML = '<p class="ajuda">Nenhum job de impressão ainda.</p>';
      return;
    }
    lista.innerHTML = '';
    jobs.slice(0, 50).forEach((job) => {
      const div = document.createElement('div');
      div.className = 'item-cartao';
      div.innerHTML = `
        <div class="titulo">${TIPO_DOC_LABEL[job.tipoDocumento] || job.tipoDocumento}</div>
        <div class="detalhe">${job.printer?.nome || ''} · ${STATUS_JOB_LABEL[job.status] || job.status}${job.pedido ? ' · Pedido #' + job.pedido.numero : ''}</div>
        <div class="acoes">
          ${job.status === 'FAILED' ? `<button data-acao="retry" data-id="${job.id}">Tentar de novo</button>` : ''}
          ${job.status === 'PRINTED' ? `<button data-acao="reimprimir" data-id="${job.id}">Reimprimir</button>` : ''}
        </div>
      `;
      lista.appendChild(div);
    });
    lista.querySelectorAll('[data-acao="retry"]').forEach((btn) => btn.addEventListener('click', async () => {
      await window.agapefood.retryJob(btn.dataset.id);
      carregarFila();
    }));
    lista.querySelectorAll('[data-acao="reimprimir"]').forEach((btn) => btn.addEventListener('click', async () => {
      await window.agapefood.reimprimir(btn.dataset.id);
      carregarFila();
    }));
  } catch (e) {
    lista.innerHTML = `<p class="ajuda">Não foi possível carregar a fila: ${e.message}</p>`;
  }
}

// --- Configurações ---

async function carregarConfig() {
  const config = await window.agapefood.obterConfig();
  $('#cfg-backend').value = config.backendUrl || '';
  $('#cfg-email').value = config.email || '';
  $('#cfg-senha').value = config.senha || '';
  $('#cfg-iniciar-windows').checked = !!config.iniciarComWindows;
}

$('#form-config').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#config-erro').textContent = '';
  const backendUrl = $('#cfg-backend').value.trim();
  const email = $('#cfg-email').value.trim();
  const senha = $('#cfg-senha').value;
  const iniciarComWindows = $('#cfg-iniciar-windows').checked;

  if (!backendUrl || !email || !senha) {
    $('#config-erro').textContent = 'Preencha URL do backend, e-mail e senha.';
    return;
  }

  try {
    await window.agapefood.definirIniciarComWindows(iniciarComWindows);
    await window.agapefood.salvarConfig({ backendUrl, email, senha, iniciarComWindows });
    trocarAba('status');
  } catch (err) {
    $('#config-erro').textContent = 'Não foi possível salvar/conectar. Confira os dados e tente de novo.';
  }
});

carregarStatusInicial();
carregarConfig();
