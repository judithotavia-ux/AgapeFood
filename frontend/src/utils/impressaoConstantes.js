export const SETOR_LABEL = {
  COZINHA: 'Cozinha', BAR: 'Bar', CONFEITARIA: 'Confeitaria', PIZZARIA: 'Pizzaria',
  ACAI: 'Açaí', SALGADOS: 'Salgados', BALCAO: 'Balcão', GARCOM: 'Garçom', CAIXA: 'Caixa', DELIVERY: 'Delivery', OUTRO: 'Outro'
};

export const SETOR_ICONE = {
  COZINHA: '🍳', BAR: '🍹', CONFEITARIA: '🍰', PIZZARIA: '🍕',
  ACAI: '🍇', SALGADOS: '🥟', BALCAO: '🛎️', GARCOM: '🧑‍🍳', CAIXA: '💳', DELIVERY: '🛵', OUTRO: '🖨️'
};

export const CONEXAO_LABEL = { USB: 'USB', REDE: 'Rede / TCP-IP', BLUETOOTH: 'Bluetooth (em breve)' };

export const STATUS_IMPRESSORA_LABEL = { ONLINE: 'Online', OFFLINE: 'Offline', ATENCAO: 'Atenção' };
export const STATUS_IMPRESSORA_COR = { ONLINE: '#7bc47f', OFFLINE: '#6b7280', ATENCAO: '#e0a020' };
export const STATUS_IMPRESSORA_ICONE = { ONLINE: '🟢', OFFLINE: '⚪', ATENCAO: '🟡' };

export const STATUS_JOB_LABEL = {
  PENDING: 'Pendente', PRINTING: 'Imprimindo', PRINTED: 'Impresso', FAILED: 'Falhou', RETRYING: 'Tentando novamente', CANCELLED: 'Cancelado'
};
export const STATUS_JOB_COR = {
  PENDING: '#e0a020', PRINTING: '#5b9bd5', PRINTED: '#7bc47f', FAILED: '#e06666', RETRYING: '#e0a020', CANCELLED: '#6b7280'
};

export const TIPO_DOCUMENTO_LABEL = {
  COMANDA_COZINHA: 'Comanda de produção', COMANDA_GARCOM: 'Comanda de garçom', COMANDA_DELIVERY: 'Comanda de delivery',
  COMANDA_CAIXA: 'Comanda de caixa', CANCELAMENTO: 'Aviso de cancelamento', ALTERACAO: 'Aviso de alteração', TESTE: 'Teste de impressão'
};

export const PRIORIDADE_LABEL = { NORMAL: 'Normal', ALTA: 'Alta', URGENTE: 'Urgente', VIP: 'VIP' };
export const PRIORIDADE_COR = { NORMAL: 'var(--texto2)', ALTA: '#e0a020', URGENTE: '#e06666', VIP: 'var(--dourado)' };

export const LOG_ACAO_LABEL = {
  CRIADO: 'Criado', IMPRESSO: 'Impresso', FALHOU: 'Falhou', RETRYING: 'Tentando novamente',
  RETRY: 'Nova tentativa solicitada', REIMPRESSAO: 'Reimpressão', CANCELADO: 'Cancelado'
};
