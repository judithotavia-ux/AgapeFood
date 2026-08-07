export function mascaraCnpj(v) {
  return String(v || '').replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function mascaraCpf(v) {
  return String(v || '').replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function mascaraCep(v) {
  return String(v || '').replace(/\D/g, '').slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function mascaraTelefone(v) {
  const digitos = String(v || '').replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 10) {
    return digitos
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digitos
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export const TIPO_EMPRESA_LABEL = {
  RESTAURANTE: 'Restaurante',
  LANCHONETE: 'Lanchonete',
  PIZZARIA: 'Pizzaria',
  HAMBURGUERIA: 'Hamburgueria',
  CAFETERIA: 'Cafeteria',
  ACAITERIA: 'Açaiteria',
  PADARIA: 'Padaria',
  SORVETERIA: 'Sorveteria',
  FOOD_TRUCK: 'Food Truck',
  DOCERIA: 'Doceria',
  MARMITARIA: 'Marmitaria',
  OUTRO: 'Outro'
};
