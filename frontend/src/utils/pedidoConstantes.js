export const STATUS_LABEL = {
  RECEBIDO: 'Recebido',
  PREPARANDO: 'Preparando',
  PRONTO: 'Pronto',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado'
};

export const STATUS_COR = {
  RECEBIDO: '#5b9bd5',
  PREPARANDO: '#e0a020',
  PRONTO: '#7bc47f',
  SAIU_PARA_ENTREGA: '#b57bd6',
  ENTREGUE: '#6b7280',
  CANCELADO: '#e06666'
};

export const PROXIMO_STATUS = {
  RECEBIDO: ['PREPARANDO'],
  PREPARANDO: ['PRONTO'],
  PRONTO: ['SAIU_PARA_ENTREGA', 'ENTREGUE'],
  SAIU_PARA_ENTREGA: ['ENTREGUE'],
  ENTREGUE: [],
  CANCELADO: []
};

export const TIPO_LABEL = {
  DELIVERY: '🚚 Delivery',
  RETIRADA: '🏃 Retirada',
  BALCAO: '🧾 Balcão',
  MESA: '🍽️ Mesa'
};

export const PAGAMENTO_LABEL = {
  PIX: 'PIX',
  CARTAO: 'Cartão',
  DINHEIRO: 'Dinheiro',
  VALE_ALIMENTACAO: 'Vale alimentação'
};

export function fmtPreco(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}
