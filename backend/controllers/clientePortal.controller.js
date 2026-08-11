const prisma = require('../prisma/client');

async function meuPerfil(req, res) {
  const cliente = await prisma.cliente.findUnique({ where: { id: req.cliente.clienteId } });
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado.' });
  res.json({
    id: cliente.id, nome: cliente.nome, telefone: cliente.telefone, email: cliente.email,
    dataNascimento: cliente.dataNascimento, saldoCashback: Number(cliente.saldoCashback),
    aceitaComunicacoes: cliente.aceitaComunicacoes
  });
}

async function atualizarPerfil(req, res) {
  const { nome, dataNascimento, aceitaComunicacoes } = req.body || {};
  const cliente = await prisma.cliente.update({
    where: { id: req.cliente.clienteId },
    data: {
      nome: nome !== undefined ? nome : undefined,
      dataNascimento: dataNascimento !== undefined ? (dataNascimento ? new Date(dataNascimento) : null) : undefined,
      aceitaComunicacoes: aceitaComunicacoes !== undefined ? Boolean(aceitaComunicacoes) : undefined
    }
  });
  res.json({ id: cliente.id, nome: cliente.nome, telefone: cliente.telefone, email: cliente.email });
}

async function listarEnderecos(req, res) {
  const enderecos = await prisma.enderecoCliente.findMany({
    where: { clienteId: req.cliente.clienteId },
    orderBy: [{ principal: 'desc' }, { criadoEm: 'desc' }]
  });
  res.json(enderecos);
}

async function criarEndereco(req, res) {
  const { apelido, cep, endereco, numero, complemento, bairro, cidade, estado, pontoReferencia, principal } = req.body || {};
  if (!endereco || !endereco.trim()) return res.status(400).json({ erro: 'Informe o endereço.' });

  if (principal) {
    await prisma.enderecoCliente.updateMany({ where: { clienteId: req.cliente.clienteId }, data: { principal: false } });
  }

  const novo = await prisma.enderecoCliente.create({
    data: {
      clienteId: req.cliente.clienteId,
      apelido: apelido?.trim() || 'Casa',
      cep: cep || null, endereco: endereco.trim(), numero: numero || null, complemento: complemento || null,
      bairro: bairro || null, cidade: cidade || null, estado: estado || null, pontoReferencia: pontoReferencia || null,
      principal: !!principal
    }
  });
  res.status(201).json(novo);
}

async function atualizarEndereco(req, res) {
  const { id } = req.params;
  const existente = await prisma.enderecoCliente.findFirst({ where: { id, clienteId: req.cliente.clienteId } });
  if (!existente) return res.status(404).json({ erro: 'Endereço não encontrado.' });

  const { apelido, cep, endereco, numero, complemento, bairro, cidade, estado, pontoReferencia, principal } = req.body || {};

  if (principal) {
    await prisma.enderecoCliente.updateMany({ where: { clienteId: req.cliente.clienteId }, data: { principal: false } });
  }

  const atualizado = await prisma.enderecoCliente.update({
    where: { id },
    data: {
      apelido: apelido !== undefined ? apelido : existente.apelido,
      cep: cep !== undefined ? cep : existente.cep,
      endereco: endereco !== undefined ? endereco : existente.endereco,
      numero: numero !== undefined ? numero : existente.numero,
      complemento: complemento !== undefined ? complemento : existente.complemento,
      bairro: bairro !== undefined ? bairro : existente.bairro,
      cidade: cidade !== undefined ? cidade : existente.cidade,
      estado: estado !== undefined ? estado : existente.estado,
      pontoReferencia: pontoReferencia !== undefined ? pontoReferencia : existente.pontoReferencia,
      principal: principal !== undefined ? Boolean(principal) : existente.principal
    }
  });
  res.json(atualizado);
}

async function removerEndereco(req, res) {
  const { id } = req.params;
  const existente = await prisma.enderecoCliente.findFirst({ where: { id, clienteId: req.cliente.clienteId } });
  if (!existente) return res.status(404).json({ erro: 'Endereço não encontrado.' });

  await prisma.enderecoCliente.delete({ where: { id } });
  res.status(204).send();
}

async function listarFavoritos(req, res) {
  const favoritos = await prisma.favorito.findMany({
    where: { clienteId: req.cliente.clienteId },
    include: { produto: { select: { id: true, nome: true, preco: true, precoPromocional: true, imagemUrl: true, disponivel: true } } },
    orderBy: { criadoEm: 'desc' }
  });
  res.json(favoritos.map((f) => f.produto));
}

async function adicionarFavorito(req, res) {
  const { produtoId } = req.body || {};
  if (!produtoId) return res.status(400).json({ erro: 'Informe o produto.' });

  const produto = await prisma.produto.findFirst({ where: { id: produtoId, empresaId: req.cliente.empresaId } });
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

  await prisma.favorito.upsert({
    where: { clienteId_produtoId: { clienteId: req.cliente.clienteId, produtoId } },
    update: {},
    create: { clienteId: req.cliente.clienteId, produtoId }
  });
  res.status(201).json({ ok: true });
}

async function removerFavorito(req, res) {
  const { produtoId } = req.params;
  await prisma.favorito.deleteMany({ where: { clienteId: req.cliente.clienteId, produtoId } });
  res.status(204).send();
}

async function meusPedidos(req, res) {
  const pedidos = await prisma.pedido.findMany({
    where: { clienteId: req.cliente.clienteId },
    include: { itens: true },
    orderBy: { criadoEm: 'desc' },
    take: 50
  });
  res.json(pedidos.map((p) => ({
    id: p.id, numero: p.numero, tipo: p.tipo, status: p.status, valorTotal: Number(p.valorTotal),
    criadoEm: p.criadoEm, itens: p.itens.map((i) => ({ nome: i.nomeProduto, quantidade: i.quantidade, precoUnitario: Number(i.precoUnitario) }))
  })));
}

module.exports = {
  meuPerfil, atualizarPerfil,
  listarEnderecos, criarEndereco, atualizarEndereco, removerEndereco,
  listarFavoritos, adicionarFavorito, removerFavorito,
  meusPedidos
};
