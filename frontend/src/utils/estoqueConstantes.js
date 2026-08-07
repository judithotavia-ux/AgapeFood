export const TIPO_MOVIMENTACAO_LABEL = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saída',
  TRANSFERENCIA: 'Transferência',
  INVENTARIO: 'Inventário (recontagem)',
  PERDA: 'Perda',
  QUEBRA: 'Quebra',
  CONSUMO_INTERNO: 'Consumo interno',
  PRODUCAO: 'Produção',
  COMPRA: 'Compra',
  VENDA: 'Venda',
  AJUSTE: 'Ajuste manual'
};

export const TIPOS_ENTRADA = ['ENTRADA', 'PRODUCAO', 'COMPRA'];
export const TIPOS_SAIDA = ['SAIDA', 'PERDA', 'QUEBRA', 'CONSUMO_INTERNO', 'VENDA', 'TRANSFERENCIA'];

export function fmtQtd(v, unidade) {
  const n = Number(v);
  const texto = Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return `${texto} ${unidade || 'UN'}`;
}
