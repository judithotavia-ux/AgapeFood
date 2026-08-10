const prisma = require('../prisma/client');
const asaas = require('../services/asaas.service');
const { apenasDigitos } = require('../utils/telefone');

function chaveDia(data) {
  return new Date(data).toISOString().slice(0, 10);
}

// Calcula o status "efetivo" (ex: TRIAL vencido sem conversão vira bloqueado) sem depender de cron job
function statusEfetivo(assinatura) {
  if (!assinatura) return { bloqueado: true, motivo: 'Nenhuma assinatura encontrada.' };
  if (assinatura.status === 'CANCELADA') return { bloqueado: true, motivo: 'Assinatura cancelada.' };
  if (assinatura.status === 'INADIMPLENTE') return { bloqueado: true, motivo: 'Pagamento em atraso.' };
  if (assinatura.status === 'TRIAL') {
    const expirou = assinatura.fimTrialEm && chaveDia(new Date()) > chaveDia(assinatura.fimTrialEm);
    return { bloqueado: !!expirou, motivo: expirou ? 'Período de teste encerrado.' : null };
  }
  return { bloqueado: false, motivo: null };
}

async function listarPlanos(req, res) {
  const planos = await prisma.plano.findMany({ where: { ativo: true }, orderBy: { ordem: 'asc' } });
  res.json(planos);
}

async function obterMinhaAssinatura(req, res) {
  const assinatura = await prisma.assinatura.findUnique({
    where: { empresaId: req.usuario.empresaId },
    include: { plano: true, cobrancas: { orderBy: { criadoEm: 'desc' }, take: 12 } }
  });

  if (!assinatura) return res.json({ assinatura: null, efetivo: statusEfetivo(null) });

  const efetivo = statusEfetivo(assinatura);
  const diasRestantesTrial = assinatura.status === 'TRIAL' && assinatura.fimTrialEm
    ? Math.max(0, Math.ceil((new Date(assinatura.fimTrialEm).getTime() - Date.now()) / 86400000))
    : null;

  res.json({ ...assinatura, efetivo, diasRestantesTrial, pagamentoConfigurado: asaas.configurada() });
}

async function assinar(req, res) {
  if (!asaas.configurada()) {
    return res.status(503).json({ erro: 'A cobrança ainda não foi configurada nesta instalação. Fale com o suporte AgapeFood.' });
  }

  const { planoId, formaPagamento, cpfCnpj } = req.body || {};
  if (!planoId) return res.status(400).json({ erro: 'Selecione um plano.' });
  if (!['PIX', 'BOLETO', 'CARTAO'].includes(formaPagamento)) return res.status(400).json({ erro: 'Selecione a forma de pagamento.' });
  if (!cpfCnpj || apenasDigitos(cpfCnpj).length < 11) return res.status(400).json({ erro: 'Informe um CPF ou CNPJ válido para a cobrança.' });

  const plano = await prisma.plano.findFirst({ where: { id: planoId, ativo: true } });
  if (!plano) return res.status(400).json({ erro: 'Plano inválido.' });

  const empresa = await prisma.empresa.findUnique({ where: { id: req.usuario.empresaId } });
  const assinaturaAtual = await prisma.assinatura.findUnique({ where: { empresaId: empresa.id } });

  const clienteAsaas = await asaas.criarOuAtualizarCliente({
    asaasCustomerId: assinaturaAtual?.asaasCustomerId || null,
    nome: empresa.nome,
    cpfCnpj: apenasDigitos(cpfCnpj),
    email: empresa.emailContato || req.usuario.email,
    telefone: empresa.whatsapp || empresa.telefone
  });

  const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const assinaturaAsaas = await asaas.criarAssinatura({
    asaasCustomerId: clienteAsaas.id,
    valor: Number(plano.preco),
    ciclo: plano.ciclo,
    formaPagamento,
    dataPrimeiroVencimento: amanha,
    descricao: `AgapeFood - Plano ${plano.nome}`,
    externalReference: empresa.id
  });

  const dadosAssinatura = {
    empresaId: empresa.id,
    planoId: plano.id,
    status: 'PENDENTE',
    formaPagamento,
    proximaCobrancaEm: new Date(amanha),
    asaasCustomerId: clienteAsaas.id,
    asaasSubscriptionId: assinaturaAsaas.id
  };

  const assinatura = assinaturaAtual
    ? await prisma.assinatura.update({ where: { empresaId: empresa.id }, data: dadosAssinatura })
    : await prisma.assinatura.create({ data: dadosAssinatura });

  res.status(201).json(assinatura);
}

async function cancelar(req, res) {
  const assinatura = await prisma.assinatura.findUnique({ where: { empresaId: req.usuario.empresaId } });
  if (!assinatura) return res.status(404).json({ erro: 'Nenhuma assinatura encontrada.' });

  if (assinatura.asaasSubscriptionId && asaas.configurada()) {
    await asaas.cancelarAssinatura(assinatura.asaasSubscriptionId).catch(() => {});
  }

  const atualizada = await prisma.assinatura.update({
    where: { empresaId: req.usuario.empresaId },
    data: { status: 'CANCELADA', canceladaEm: new Date(), motivoCancelamento: req.body?.motivo || null }
  });
  res.json(atualizada);
}

module.exports = { listarPlanos, obterMinhaAssinatura, assinar, cancelar, statusEfetivo };
