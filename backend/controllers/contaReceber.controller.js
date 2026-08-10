const prisma = require('../prisma/client');

// Compara por data (UTC, mesma convencao usada ao salvar "YYYY-MM-DD"), nunca por hora,
// pra uma conta vencendo hoje nao virar "vencida" so por causa do fuso do servidor.
function chaveDia(data) {
  return new Date(data).toISOString().slice(0, 10);
}

function comStatusEfetivo(conta) {
  const status = conta.status === 'PENDENTE' && chaveDia(conta.vencimento) < chaveDia(new Date()) ? 'VENCIDO' : conta.status;
  return { ...conta, statusEfetivo: status };
}

async function listar(req, res) {
  const { status, categoriaId } = req.query;
  const contas = await prisma.contaReceber.findMany({
    where: {
      empresaId: req.usuario.empresaId,
      ...(categoriaId ? { categoriaId } : {}),
      ...(status ? { status } : {})
    },
    include: { categoria: true },
    orderBy: { vencimento: 'asc' }
  });
  res.json(contas.map(comStatusEfetivo));
}

async function criar(req, res) {
  const { descricao, valor, vencimento, categoriaId, clienteNome, formaPagamento, observacoes } = req.body || {};

  if (!descricao || !descricao.trim()) return res.status(400).json({ erro: 'Informe a descrição.' });
  if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) return res.status(400).json({ erro: 'Informe um valor válido.' });
  if (!vencimento) return res.status(400).json({ erro: 'Informe a data de vencimento.' });

  if (categoriaId) {
    const categoria = await prisma.categoriaFinanceira.findFirst({ where: { id: categoriaId, empresaId: req.usuario.empresaId } });
    if (!categoria) return res.status(400).json({ erro: 'Categoria inválida.' });
  }

  const conta = await prisma.contaReceber.create({
    data: {
      descricao: descricao.trim(),
      valor: Number(valor),
      vencimento: new Date(vencimento),
      categoriaId: categoriaId || null,
      clienteNome: clienteNome || null,
      formaPagamento: formaPagamento || null,
      observacoes: observacoes || null,
      empresaId: req.usuario.empresaId
    }
  });
  res.status(201).json(conta);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const conta = await prisma.contaReceber.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!conta) return res.status(404).json({ erro: 'Conta não encontrada.' });
  if (conta.status !== 'PENDENTE') return res.status(400).json({ erro: 'Somente contas pendentes podem ser editadas.' });

  const { descricao, valor, vencimento, categoriaId, clienteNome, formaPagamento, observacoes } = req.body || {};

  const atualizada = await prisma.contaReceber.update({
    where: { id },
    data: {
      descricao: descricao?.trim() ?? conta.descricao,
      valor: valor !== undefined ? Number(valor) : conta.valor,
      vencimento: vencimento ? new Date(vencimento) : conta.vencimento,
      categoriaId: categoriaId !== undefined ? (categoriaId || null) : conta.categoriaId,
      clienteNome: clienteNome !== undefined ? clienteNome : conta.clienteNome,
      formaPagamento: formaPagamento !== undefined ? formaPagamento : conta.formaPagamento,
      observacoes: observacoes !== undefined ? observacoes : conta.observacoes
    }
  });
  res.json(atualizada);
}

async function marcarComoRecebido(req, res) {
  const { id } = req.params;
  const conta = await prisma.contaReceber.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!conta) return res.status(404).json({ erro: 'Conta não encontrada.' });
  if (conta.status === 'PAGO') return res.status(400).json({ erro: 'Essa conta já está recebida.' });

  const { valorRecebido, formaPagamento } = req.body || {};

  const atualizada = await prisma.contaReceber.update({
    where: { id },
    data: {
      status: 'PAGO',
      recebidoEm: new Date(),
      valorRecebido: valorRecebido !== undefined ? Number(valorRecebido) : conta.valor,
      formaPagamento: formaPagamento || conta.formaPagamento
    }
  });
  res.json(atualizada);
}

async function cancelar(req, res) {
  const { id } = req.params;
  const conta = await prisma.contaReceber.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!conta) return res.status(404).json({ erro: 'Conta não encontrada.' });
  if (conta.status === 'PAGO') return res.status(400).json({ erro: 'Não é possível cancelar uma conta já recebida.' });

  const atualizada = await prisma.contaReceber.update({ where: { id }, data: { status: 'CANCELADO' } });
  res.json(atualizada);
}

async function remover(req, res) {
  const { id } = req.params;
  const conta = await prisma.contaReceber.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!conta) return res.status(404).json({ erro: 'Conta não encontrada.' });

  await prisma.contaReceber.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { listar, criar, atualizar, marcarComoRecebido, cancelar, remover };
