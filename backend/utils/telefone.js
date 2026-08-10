// Normaliza telefones brasileiros para um formato consistente: apenas dígitos, com DDI 55.
// Aceita entradas como "(92) 99490-6859", "92994906859", "+55 92 99490-6859" etc.
function normalizarTelefone(valor) {
  const digitos = String(valor || '').replace(/\D/g, '');
  if (!digitos) return '';

  // Remove DDI 55 se já presente, pra evitar duplicar
  const semDDI = digitos.startsWith('55') && digitos.length > 11 ? digitos.slice(2) : digitos;

  if (semDDI.length < 10 || semDDI.length > 11) {
    return `55${semDDI}`; // formato inesperado - devolve como veio, so com DDI, sem tentar adivinhar
  }

  return `55${semDDI}`;
}

function apenasDigitos(v) {
  return String(v || '').replace(/\D/g, '');
}

function formatarTelefoneExibicao(valorNormalizado) {
  const digitos = apenasDigitos(valorNormalizado);
  const semDDI = digitos.startsWith('55') ? digitos.slice(2) : digitos;
  if (semDDI.length === 11) return `(${semDDI.slice(0, 2)}) ${semDDI.slice(2, 7)}-${semDDI.slice(7)}`;
  if (semDDI.length === 10) return `(${semDDI.slice(0, 2)}) ${semDDI.slice(2, 6)}-${semDDI.slice(6)}`;
  return valorNormalizado;
}

module.exports = { normalizarTelefone, apenasDigitos, formatarTelefoneExibicao };
