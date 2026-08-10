export const CANAL_LABEL = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  SMS: 'SMS',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  PUSH: 'Notificação push',
  OUTRO: 'Outro'
};

export const CANAL_ICONE = {
  WHATSAPP: '💬',
  EMAIL: '✉️',
  SMS: '📱',
  INSTAGRAM: '📸',
  FACEBOOK: '👍',
  PUSH: '🔔',
  OUTRO: '📣'
};

export const STATUS_CAMPANHA_LABEL = {
  RASCUNHO: 'Rascunho',
  ATIVA: 'Enviada',
  CONCLUIDA: 'Concluída'
};

export const SEGMENTO_CLIENTE_LABEL = {
  TODOS: 'Todos',
  ATIVOS: 'Ativos',
  INATIVOS: 'Inativos',
  VIP: 'VIP',
  ANIVERSARIANTES: 'Aniversariantes do mês'
};

export function fmtPrecoMkt(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

export function fmtDataMkt(data) {
  return new Date(data).toLocaleDateString('pt-BR');
}
