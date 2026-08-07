const prisma = require('../prisma/client');

async function listar(req, res) {
  const categorias = await prisma.categoria.findMany({
    where: { empresaId: req.usuario.empresaId },
    orderBy: { ordem: 'asc' }
  });
  res.json(categorias);
}

async function criar(req, res) {
  const { nome, ordem } = req.body || {};
  if (!nome || !nome.trim()) return res.status(400).json({ erro: 'Informe o nome da categoria.' });

  const categoria = await prisma.categoria.create({
    data: {
      nome: nome.trim(),
      ordem: Number(ordem) || 0,
      empresaId: req.usuario.empresaId
    }
  });
  res.status(201).json(categoria);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const existente = await prisma.categoria.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!existente) return res.status(404).json({ erro: 'Categoria não encontrada.' });

  const { nome, ordem, ativo } = req.body || {};
  const categoria = await prisma.categoria.update({
    where: { id },
    data: {
      nome: nome?.trim() ?? existente.nome,
      ordem: ordem !== undefined ? Number(ordem) : existente.ordem,
      ativo: ativo !== undefined ? Boolean(ativo) : existente.ativo
    }
  });
  res.json(categoria);
}

async function remover(req, res) {
  const { id } = req.params;
  const existente = await prisma.categoria.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!existente) return res.status(404).json({ erro: 'Categoria não encontrada.' });

  const totalProdutos = await prisma.produto.count({ where: { categoriaId: id } });
  if (totalProdutos > 0) {
    return res.status(400).json({ erro: 'Não é possível excluir: existem produtos nesta categoria. Mova ou exclua os produtos primeiro.' });
  }

  await prisma.categoria.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { listar, criar, atualizar, remover };
