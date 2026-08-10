export const STATUS_ASSINATURA_LABEL = {
  TRIAL: 'Período de teste',
  ATIVA: 'Ativa',
  INADIMPLENTE: 'Pagamento em atraso',
  CANCELADA: 'Cancelada',
  PENDENTE: 'Aguardando confirmação do pagamento'
};

export const STATUS_ASSINATURA_COR = {
  TRIAL: '#e0a020',
  ATIVA: '#7bc47f',
  INADIMPLENTE: '#e06666',
  CANCELADA: '#6b7280',
  PENDENTE: '#5b9bd5'
};

export const CICLO_LABEL = { MENSAL: '/mês', TRIMESTRAL: '/trimestre', SEMESTRAL: '/semestre', ANUAL: '/ano' };

export const FORMA_PAGAMENTO_ASSINATURA_LABEL = { PIX: 'Pix', BOLETO: 'Boleto', CARTAO: 'Cartão de crédito' };

export function fmtPrecoAssinatura(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}
