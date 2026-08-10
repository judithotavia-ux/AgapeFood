const prisma = require('../prisma/client');

const EVENTOS_ATIVAM = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'];
const EVENTOS_INADIMPLENCIA = ['PAYMENT_OVERDUE'];

async function receberEvento(req, res) {
  const tokenRecebido = req.headers['asaas-access-token'];
  if (!process.env.ASAAS_WEBHOOK_TOKEN || tokenRecebido !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).json({ erro: 'Token inválido.' });
  }

  const { event, payment } = req.body || {};
  if (!payment) return res.status(200).json({ ok: true });

  const assinatura = await prisma.assinatura.findFirst({ where: { asaasSubscriptionId: payment.subscription || undefined } });
  if (!assinatura) return res.status(200).json({ ok: true });

  const pago = EVENTOS_ATIVAM.includes(event);

  await prisma.cobranca.upsert({
    where: { asaasPaymentId: payment.id },
    update: {
      status: payment.status || event,
      valor: payment.value,
      vencimento: payment.dueDate ? new Date(payment.dueDate) : undefined,
      pagoEm: pago ? new Date() : undefined,
      linkPagamento: payment.invoiceUrl || undefined
    },
    create: {
      assinaturaId: assinatura.id,
      asaasPaymentId: payment.id,
      valor: payment.value,
      status: payment.status || event,
      vencimento: payment.dueDate ? new Date(payment.dueDate) : new Date(),
      pagoEm: pago ? new Date() : null,
      linkPagamento: payment.invoiceUrl || null
    }
  });

  if (pago) {
    await prisma.assinatura.update({ where: { id: assinatura.id }, data: { status: 'ATIVA' } });
  } else if (EVENTOS_INADIMPLENCIA.includes(event)) {
    await prisma.assinatura.update({ where: { id: assinatura.id }, data: { status: 'INADIMPLENTE' } });
  }

  res.status(200).json({ ok: true });
}

module.exports = { receberEvento };
