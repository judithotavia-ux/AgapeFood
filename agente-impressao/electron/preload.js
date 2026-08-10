const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('agapefood', {
  obterConfig: () => ipcRenderer.invoke('config:obter'),
  salvarConfig: (config) => ipcRenderer.invoke('config:salvar', config),
  definirIniciarComWindows: (ativar) => ipcRenderer.invoke('config:iniciar-com-windows', ativar),

  obterStatus: () => ipcRenderer.invoke('agente:status'),
  obterLogs: () => ipcRenderer.invoke('agente:logs'),
  pausar: () => ipcRenderer.invoke('agente:pausar'),
  retomar: () => ipcRenderer.invoke('agente:retomar'),

  listarImpressoras: () => ipcRenderer.invoke('agente:impressoras'),
  listarFila: (params) => ipcRenderer.invoke('agente:fila', params),
  testarImpressora: (id) => ipcRenderer.invoke('agente:testar-impressora', id),
  reimprimir: (jobId) => ipcRenderer.invoke('agente:reimprimir', jobId),
  retryJob: (jobId) => ipcRenderer.invoke('agente:retry-job', jobId),
  cancelarJob: (jobId) => ipcRenderer.invoke('agente:cancelar-job', jobId),

  aoReceberLog: (callback) => ipcRenderer.on('agente:log', (event, entrada) => callback(entrada)),
  aoAtualizarStatus: (callback) => ipcRenderer.on('agente:status', (event, status) => callback(status)),
  aoAtualizarImpressoras: (callback) => ipcRenderer.on('agente:impressoras', (event, lista) => callback(lista)),
  aoNavegar: (callback) => ipcRenderer.on('agente:navegar', (event, aba) => callback(aba))
});
