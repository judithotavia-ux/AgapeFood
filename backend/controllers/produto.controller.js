const fs = require('fs');
const path = require('path');
const prisma = require('../prisma/client');

function montarUrlImagem(req, nomeArquivo) {
  if (!nomeArquivo) return null;
  return `${req.protocol}://${req.get('host')}/uploads/produtos/${nomeArquivo}`;
}

function extrairNomeArquivo(imagemUrl) {
  if (!imagemUrl) return null;
  return imagemUrl.split('/uploads/produtos/')[1] || null;
}

async function listar(req, res) {
  const { categoriaId, busca } = req.query;

  const produtos = await prisma.produto.findMany({
    where: {
      empresaId: req.usuario.empresaId,
      ...(categoriaId ? { categoriaId } : {}),
      ...(busca ? { nome: { contains: busca } } : {})
    },
    include: { categoria: true, adicionais: true },
    orderBy: [{ categoriaId: 'asc' }, { ordem: 'asc' }]
  });

  res.json(produtos);
}

async function obter(req, res) {
  const { id } = req.params;
  const produto = await prisma.produto.findFirst({
    where: { id, empresaId: req.usuario.empresaId },
    include: { categoria: true, adicionais: true }
  });
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });
  res.json(produto);
}

async function criar(req, res) {
  const { nome, descricao, preco, precoPromocional, categoriaId, ingredientes, alergenos, disponivel, destaque, ordem } = req.body || {};

  if (!nome || !nome.trim()) return res.status(400).json({ erro: 'Informe o nome do produto.' });
  if (!preco || isNaN(Number(preco))) return res.status(400).json({ erro: 'Informe um preço válido.' });
  if (!categoriaId) return res.status(400).json({ erro: 'Selecione uma categoria.' });

  const categoria = await prisma.categoria.findFirst({ where: { id: categoriaId, empresaId: req.usuario.empresaId } });
  if (!categoria) return res.status(400).json({ erro: 'Categoria inválida.' });

  const produto = await prisma.produto.create({
    data: {
      nome: nome.trim(),
      descricao: descricao || null,
      preco: Number(preco),
      precoPromocional: precoPromocional ? Number(precoPromocional) : null,
      imagemUrl: montarUrlImagem(req, req.file?.filename),
      ingredientes: ingredientes || null,
      alergenos: alergenos || null,
      disponivel: disponivel !== undefined ? disponivel === 'true' || disponivel === true : true,
      destaque: destaque === 'true' || destaque === true,
      ordem: Number(ordem) || 0,
      empresaId: req.usuario.empresaId,
      categoriaId
    }
  });

  res.status(201).json(produto);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const existente = await prisma.produto.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!existente) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const { nome, descricao, preco, precoPromocional, categoriaId, ingredientes, alergenos, disponivel, destaque, ordem, removerImagem } = req.body || {};

  if (categoriaId) {
    const categoria = await prisma.categoria.findFirst({ where: { id: categoriaId, empresaId: req.usuario.empresaId } });
    if (!categoria) return res.status(400).json({ erro: 'Categoria inválida.' });
  }

  let imagemUrl = existente.imagemUrl;
  if (req.file) {
    const arquivoAntigo = extrairNomeArquivo(existente.imagemUrl);
    if (arquivoAntigo) fs.unlink(path.join(__dirname, '..', 'uploads', 'produtos', arquivoAntigo), () => {});
    imagemUrl = montarUrlImagem(req, req.file.filename);
  } else if (removerImagem === 'true' || removerImagem === true) {
    const arquivoAntigo = extrairNomeArquivo(existente.imagemUrl);
    if (arquivoAntigo) fs.unlink(path.join(__dirname, '..', 'uploads', 'produtos', arquivoAntigo), () => {});
    imagemUrl = null;
  }

  const produto = await prisma.produto.update({
    where: { id },
    data: {
      nome: nome?.trim() ?? existente.nome,
      descricao: descricao !== undefined ? descricao : existente.descricao,
      preco: preco !== undefined ? Number(preco) : existente.preco,
      precoPromocional: precoPromocional !== undefined ? (precoPromocional ? Number(precoPromocional) : null) : existente.precoPromocional,
      imagemUrl,
      ingredientes: ingredientes !== undefined ? ingredientes : existente.ingredientes,
      alergenos: alergenos !== undefined ? alergenos : existente.alergenos,
      disponivel: disponivel !== undefined ? (disponivel === 'true' || disponivel === true) : existente.disponivel,
      destaque: destaque !== undefined ? (destaque === 'true' || destaque === true) : existente.destaque,
      ordem: ordem !== undefined ? Number(ordem) : existente.ordem,
      categoriaId: categoriaId || existente.categoriaId
    }
  });

  res.json(produto);
}

async function remover(req, res) {
  const { id } = req.params;
  const existente = await prisma.produto.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!existente) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const arquivo = extrairNomeArquivo(existente.imagemUrl);
  if (arquivo) fs.unlink(path.join(__dirname, '..', 'uploads', 'produtos', arquivo), () => {});

  await prisma.produto.delete({ where: { id } });
  res.status(204).send();
}

async function adicionarAdicional(req, res) {
  const { id } = req.params;
  const produto = await prisma.produto.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const { nome, preco } = req.body || {};
  if (!nome || !nome.trim()) return res.status(400).json({ erro: 'Informe o nome do adicional.' });
  if (preco === undefined || isNaN(Number(preco))) return res.status(400).json({ erro: 'Informe um preço válido.' });

  const adicional = await prisma.adicional.create({
    data: { nome: nome.trim(), preco: Number(preco), produtoId: id }
  });
  res.status(201).json(adicional);
}

async function removerAdicional(req, res) {
  const { id, adicionalId } = req.params;
  const adicional = await prisma.adicional.findFirst({ where: { id: adicionalId, produtoId: id } });
  if (!adicional) return res.status(404).json({ erro: 'Adicional não encontrado.' });

  await prisma.adicional.delete({ where: { id: adicionalId } });
  res.status(204).send();
}

module.exports = { listar, obter, criar, atualizar, remover, adicionarAdicional, removerAdicional };
