const prisma = require('../prisma/client');

async function listar(req, res) {
  const { tipo } = req.query;
  const categorias = await prisma.categoriaFinanceira.findMany({
    where: { empresaId: req.usuario.empresaId, ...(tipo ? { tipo } : {}) },
    orderBy: { nome: 'asc' }
  });
  res.json(categorias);
}

async function criar(req, res) {
  const { nome, tipo } = req.body || {};
  if (!nome || !nome.trim()) return res.status(400).json({ erro: 'Informe o nome da categoria.' });
  if (!['RECEITA', 'DESPESA'].includes(tipo)) return res.status(400).json({ erro: 'Informe o tipo: RECEITA ou DESPESA.' });

  const categoria = await prisma.categoriaFinanceira.create({
    data: { nome: nome.trim(), tipo, empresaId: req.usuario.empresaId }
  });
  res.status(201).json(categoria);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const categoria = await prisma.categoriaFinanceira.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada.' });

  const { nome, tipo, ativo } = req.body || {};
  const atualizada = await prisma.categoriaFinanceira.update({
    where: { id },
    data: {
      nome: nome?.trim() ?? categoria.nome,
      tipo: tipo || categoria.tipo,
      ativo: ativo !== undefined ? Boolean(ativo) : categoria.ativo
    }
  });
  res.json(atualizada);
}

async function remover(req, res) {
  const { id } = req.params;
  const categoria = await prisma.categoriaFinanceira.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada.' });

  await prisma.categoriaFinanceira.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { listar, criar, atualizar, remover };
