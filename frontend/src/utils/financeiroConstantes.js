export const STATUS_CONTA_LABEL = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  VENCIDO: 'Vencido',
  CANCELADO: 'Cancelado'
};

export const STATUS_CONTA_COR = {
  PENDENTE: '#e0a020',
  PAGO: '#7bc47f',
  VENCIDO: '#e06666',
  CANCELADO: '#6b7280'
};

export const FORMA_PAGAMENTO_LABEL = {
  PIX: 'PIX',
  CARTAO: 'Cartão',
  DINHEIRO: 'Dinheiro',
  VALE_ALIMENTACAO: 'Vale alimentação',
  BOLETO: 'Boleto',
  NAO_INFORMADO: 'Não informado'
};

export const SAUDE_FINANCEIRA_LABEL = {
  SAUDAVEL: '🟢 Saudável',
  ATENCAO: '🟡 Atenção',
  CRITICO: '🔴 Crítico'
};

export function fmtPrecoFin(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

export function fmtMes(chave) {
  const [ano, mes] = chave.split('-');
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${nomes[Number(mes) - 1]}/${ano.slice(2)}`;
}
