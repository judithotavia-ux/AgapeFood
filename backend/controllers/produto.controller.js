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

const SETORES_PRODUCAO_VALIDOS = ['COZINHA', 'BAR', 'CONFEITARIA', 'PIZZARIA', 'ACAI', 'SALGADOS', 'BALCAO', 'GARCOM', 'CAIXA', 'DELIVERY', 'OUTRO'];

async function criar(req, res) {
  const { nome, descricao, preco, precoPromocional, categoriaId, ingredientes, alergenos, disponivel, destaque, ordem, setorProducao } = req.body || {};

  if (!nome || !nome.trim()) return res.status(400).json({ erro: 'Informe o nome do produto.' });
  if (!preco || isNaN(Number(preco))) return res.status(400).json({ erro: 'Informe um preço válido.' });
  if (!categoriaId) return res.status(400).json({ erro: 'Selecione uma categoria.' });
  if (setorProducao && !SETORES_PRODUCAO_VALIDOS.includes(setorProducao)) return res.status(400).json({ erro: 'Setor de produção inválido.' });

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
      setorProducao: setorProducao || 'COZINHA',
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

  const { nome, descricao, preco, precoPromocional, categoriaId, ingredientes, alergenos, disponivel, destaque, ordem, removerImagem, setorProducao } = req.body || {};

  if (categoriaId) {
    const categoria = await prisma.categoria.findFirst({ where: { id: categoriaId, empresaId: req.usuario.empresaId } });
    if (!categoria) return res.status(400).json({ erro: 'Categoria inválida.' });
  }
  if (setorProducao && !SETORES_PRODUCAO_VALIDOS.includes(setorProducao)) return res.status(400).json({ erro: 'Setor de produção inválido.' });

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
      setorProducao: setorProducao || existente.setorProducao,
      categoriaId: categoriaId || existente.categoriaId
    }
  });

  res.json(produto);
}

async function atualizarEstoqueConfig(req, res) {
  const { id } = req.params;
  const existente = await prisma.produto.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!existente) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const {
    sku, codigoBarras, ncm, cest, unidade, marca, fabricante, localizacao,
    controlaEstoque, controlaLote, controlaValidade,
    estoqueMinimo, estoqueMaximo, pontoReposicao,
    custo, peso, volume
  } = req.body || {};

  const produto = await prisma.produto.update({
    where: { id },
    data: {
      sku: sku !== undefined ? sku : existente.sku,
      codigoBarras: codigoBarras !== undefined ? codigoBarras : existente.codigoBarras,
      ncm: ncm !== undefined ? ncm : existente.ncm,
      cest: cest !== undefined ? cest : existente.cest,
      unidade: unidade !== undefined ? unidade : existente.unidade,
      marca: marca !== undefined ? marca : existente.marca,
      fabricante: fabricante !== undefined ? fabricante : existente.fabricante,
      localizacao: localizacao !== undefined ? localizacao : existente.localizacao,
      controlaEstoque: controlaEstoque !== undefined ? Boolean(controlaEstoque) : existente.controlaEstoque,
      controlaLote: controlaLote !== undefined ? Boolean(controlaLote) : existente.controlaLote,
      controlaValidade: controlaValidade !== undefined ? Boolean(controlaValidade) : existente.controlaValidade,
      estoqueMinimo: estoqueMinimo !== undefined ? Number(estoqueMinimo) : existente.estoqueMinimo,
      estoqueMaximo: estoqueMaximo !== undefined ? Number(estoqueMaximo) : existente.estoqueMaximo,
      pontoReposicao: pontoReposicao !== undefined ? Number(pontoReposicao) : existente.pontoReposicao,
      custo: custo !== undefined ? (custo === '' ? null : Number(custo)) : existente.custo,
      peso: peso !== undefined ? (peso === '' ? null : Number(peso)) : existente.peso,
      volume: volume !== undefined ? (volume === '' ? null : Number(volume)) : existente.volume
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

module.exports = { listar, obter, criar, atualizar, atualizarEstoqueConfig, remover, adicionarAdicional, removerAdicional };
