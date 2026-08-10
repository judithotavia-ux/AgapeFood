const axios = require('axios');

const BASE_URL = process.env.ASAAS_BASE_URL || 'https://api-sandbox.asaas.com/v3';
const API_KEY = process.env.ASAAS_API_KEY;

const CICLO_PARA_ASAAS = { MENSAL: 'MONTHLY', TRIMESTRAL: 'QUARTERLY', SEMESTRAL: 'SEMIANNUALLY', ANUAL: 'YEARLY' };
const FORMA_PARA_ASAAS = { PIX: 'PIX', BOLETO: 'BOLETO', CARTAO: 'CREDIT_CARD', INDEFINIDO: 'UNDEFINED' };

function configurada() {
  return !!API_KEY;
}

function cliente() {
  if (!API_KEY) throw new Error('ASAAS_API_KEY não configurada no servidor.');
  return axios.create({
    baseURL: BASE_URL,
    headers: { access_token: API_KEY, 'Content-Type': 'application/json' }
  });
}

async function criarOuAtualizarCliente({ asaasCustomerId, nome, cpfCnpj, email, telefone }) {
  const api = cliente();
  const payload = {
    name: nome,
    cpfCnpj: cpfCnpj || undefined,
    email: email || undefined,
    mobilePhone: telefone || undefined
  };
  if (asaasCustomerId) {
    const { data } = await api.put(`/customers/${asaasCustomerId}`, payload);
    return data;
  }
  const { data } = await api.post('/customers', payload);
  return data;
}

async function atualizarValorAssinatura(asaasSubscriptionId, novoValor) {
  const api = cliente();
  const { data } = await api.put(`/subscriptions/${asaasSubscriptionId}`, { value: novoValor });
  return data;
}

async function criarAssinatura({ asaasCustomerId, valor, ciclo, formaPagamento, dataPrimeiroVencimento, descricao, externalReference }) {
  const api = cliente();
  const { data } = await api.post('/subscriptions', {
    customer: asaasCustomerId,
    billingType: FORMA_PARA_ASAAS[formaPagamento] || 'UNDEFINED',
    value: valor,
    nextDueDate: dataPrimeiroVencimento,
    cycle: CICLO_PARA_ASAAS[ciclo] || 'MONTHLY',
    description: descricao || undefined,
    externalReference: externalReference || undefined
  });
  return data;
}

async function cancelarAssinatura(asaasSubscriptionId) {
  const api = cliente();
  const { data } = await api.delete(`/subscriptions/${asaasSubscriptionId}`);
  return data;
}

async function obterCobrancasDaAssinatura(asaasSubscriptionId) {
  const api = cliente();
  const { data } = await api.get(`/subscriptions/${asaasSubscriptionId}/payments`);
  return data.data || [];
}

module.exports = { configurada, criarOuAtualizarCliente, criarAssinatura, atualizarValorAssinatura, cancelarAssinatura, obterCobrancasDaAssinatura };
