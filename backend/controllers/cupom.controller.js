const prisma = require('../prisma/client');

async function listar(req, res) {
  const cupons = await prisma.cupom.findMany({
    where: { empresaId: req.usuario.empresaId },
    orderBy: { criadoEm: 'desc' }
  });
  res.json(cupons);
}

async function criar(req, res) {
  const { codigo, tipoDesconto, valor, usoMaximo, validoAte } = req.body || {};

  if (!codigo || !codigo.trim()) return res.status(400).json({ erro: 'Informe o código do cupom.' });
  if (!['PERCENTUAL', 'FIXO'].includes(tipoDesconto)) return res.status(400).json({ erro: 'Informe o tipo de desconto: PERCENTUAL ou FIXO.' });
  if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) return res.status(400).json({ erro: 'Informe um valor válido.' });
  if (tipoDesconto === 'PERCENTUAL' && Number(valor) > 100) return res.status(400).json({ erro: 'Desconto percentual não pode passar de 100%.' });

  const codigoNormalizado = codigo.trim().toUpperCase();
  const existente = await prisma.cupom.findFirst({ where: { empresaId: req.usuario.empresaId, codigo: codigoNormalizado } });
  if (existente) return res.status(400).json({ erro: 'Já existe um cupom com esse código.' });

  const cupom = await prisma.cupom.create({
    data: {
      codigo: codigoNormalizado,
      tipoDesconto,
      valor: Number(valor),
      usoMaximo: usoMaximo ? Number(usoMaximo) : null,
      validoAte: validoAte ? new Date(validoAte) : null,
      empresaId: req.usuario.empresaId
    }
  });
  res.status(201).json(cupom);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const cupom = await prisma.cupom.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!cupom) return res.status(404).json({ erro: 'Cupom não encontrado.' });

  const { ativo, usoMaximo, validoAte } = req.body || {};
  const atualizado = await prisma.cupom.update({
    where: { id },
    data: {
      ativo: ativo !== undefined ? Boolean(ativo) : cupom.ativo,
      usoMaximo: usoMaximo !== undefined ? (usoMaximo ? Number(usoMaximo) : null) : cupom.usoMaximo,
      validoAte: validoAte !== undefined ? (validoAte ? new Date(validoAte) : null) : cupom.validoAte
    }
  });
  res.json(atualizado);
}

async function remover(req, res) {
  const { id } = req.params;
  const cupom = await prisma.cupom.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!cupom) return res.status(404).json({ erro: 'Cupom não encontrado.' });

  await prisma.cupom.delete({ where: { id } });
  res.status(204).send();
}

async function validar(req, res) {
  const { codigo } = req.params;
  const { subtotal } = req.query;

  const cupom = await prisma.cupom.findFirst({ where: { empresaId: req.usuario.empresaId, codigo: String(codigo).toUpperCase() } });
  if (!cupom) return res.status(404).json({ erro: 'Cupom não encontrado.' });
  if (!cupom.ativo) return res.status(400).json({ erro: 'Esse cupom está inativo.' });
  if (cupom.validoAte && new Date(cupom.validoAte) < new Date()) return res.status(400).json({ erro: 'Esse cupom expirou.' });
  if (cupom.usoMaximo !== null && cupom.usosAtuais >= cupom.usoMaximo) return res.status(400).json({ erro: 'Esse cupom atingiu o limite de usos.' });

  const base = Number(subtotal) || 0;
  const desconto = cupom.tipoDesconto === 'PERCENTUAL' ? base * (Number(cupom.valor) / 100) : Number(cupom.valor);

  res.json({ valido: true, cupom, desconto: Math.min(desconto, base) });
}

module.exports = { listar, criar, atualizar, remover, validar };
