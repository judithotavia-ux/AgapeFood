const prisma = require('../prisma/client');

const PROXIMO_STATUS = {
  RECEBIDO: ['PREPARANDO', 'CANCELADO'],
  PREPARANDO: ['PRONTO', 'CANCELADO'],
  PRONTO: ['SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO'],
  SAIU_PARA_ENTREGA: ['ENTREGUE', 'CANCELADO'],
  ENTREGUE: [],
  CANCELADO: []
};

async function proximoNumeroPedido(empresaId) {
  const contador = await prisma.contadorPedido.upsert({
    where: { empresaId },
    update: { ultimoNumero: { increment: 1 } },
    create: { empresaId, ultimoNumero: 1 }
  });
  return contador.ultimoNumero;
}

async function listar(req, res) {
  const { status, tipo } = req.query;

  const pedidos = await prisma.pedido.findMany({
    where: {
      empresaId: req.usuario.empresaId,
      ...(status ? { status } : {}),
      ...(tipo ? { tipo } : {})
    },
    include: { itens: true, mesa: true },
    orderBy: { criadoEm: 'desc' },
    take: 200
  });

  res.json(pedidos);
}

async function obter(req, res) {
  const { id } = req.params;
  const pedido = await prisma.pedido.findFirst({
    where: { id, empresaId: req.usuario.empresaId },
    include: { itens: true, mesa: true }
  });
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });
  res.json(pedido);
}

async function criar(req, res) {
  const { tipo, itens, clienteNome, clienteTelefone, clienteEndereco, formaPagamento, taxaEntrega, observacoes, mesaId } = req.body || {};

  if (!tipo) return res.status(400).json({ erro: 'Informe o tipo do pedido.' });
  if (!Array.isArray(itens) || !itens.length) return res.status(400).json({ erro: 'O pedido precisa ter ao menos um item.' });
  if (tipo === 'DELIVERY' && !clienteEndereco) return res.status(400).json({ erro: 'Informe o endereço de entrega.' });
  if (tipo === 'MESA' && !mesaId) return res.status(400).json({ erro: 'Selecione a mesa.' });

  const produtoIds = itens.map((i) => i.produtoId).filter(Boolean);
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds }, empresaId: req.usuario.empresaId },
    include: { adicionais: true }
  });
  const mapaProdutos = new Map(produtos.map((p) => [p.id, p]));

  let valorTotal = 0;
  const itensParaCriar = [];

  for (const item of itens) {
    const produto = mapaProdutos.get(item.produtoId);
    if (!produto) return res.status(400).json({ erro: 'Um dos produtos selecionados não foi encontrado.' });

    const quantidade = Number(item.quantidade) || 1;
    const precoBase = Number(produto.precoPromocional ?? produto.preco);

    const adicionaisSelecionados = (item.adicionaisIds || [])
      .map((adId) => produto.adicionais.find((a) => a.id === adId))
      .filter(Boolean);
    const precoAdicionais = adicionaisSelecionados.reduce((soma, a) => soma + Number(a.preco), 0);

    const precoUnitario = precoBase + precoAdicionais;
    valorTotal += precoUnitario * quantidade;

    itensParaCriar.push({
      produtoId: produto.id,
      nomeProduto: produto.nome,
      precoUnitario,
      quantidade,
      observacoes: item.observacoes || null,
      adicionaisJson: adicionaisSelecionados.length
        ? JSON.stringify(adicionaisSelecionados.map((a) => ({ nome: a.nome, preco: Number(a.preco) })))
        : null
    });
  }

  const taxa = Number(taxaEntrega) || 0;
  valorTotal += taxa;

  const numero = await proximoNumeroPedido(req.usuario.empresaId);

  const pedido = await prisma.pedido.create({
    data: {
      numero,
      tipo,
      clienteNome: clienteNome || null,
      clienteTelefone: clienteTelefone || null,
      clienteEndereco: clienteEndereco || null,
      formaPagamento: formaPagamento || null,
      taxaEntrega: taxa,
      valorTotal,
      observacoes: observacoes || null,
      empresaId: req.usuario.empresaId,
      mesaId: tipo === 'MESA' ? mesaId : null,
      itens: { create: itensParaCriar }
    },
    include: { itens: true, mesa: true }
  });

  res.status(201).json(pedido);
}

async function atualizarStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body || {};

  const pedido = await prisma.pedido.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });

  const permitidos = PROXIMO_STATUS[pedido.status] || [];
  if (!permitidos.includes(status)) {
    return res.status(400).json({ erro: `Não é possível mudar de "${pedido.status}" para "${status}".` });
  }

  const atualizado = await prisma.pedido.update({ where: { id }, data: { status } });
  res.json(atualizado);
}

async function cancelar(req, res) {
  const { id } = req.params;
  const pedido = await prisma.pedido.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });
  if (['ENTREGUE', 'CANCELADO'].includes(pedido.status)) {
    return res.status(400).json({ erro: 'Este pedido não pode mais ser cancelado.' });
  }

  const atualizado = await prisma.pedido.update({ where: { id }, data: { status: 'CANCELADO' } });
  res.json(atualizado);
}

module.exports = { listar, obter, criar, atualizarStatus, cancelar };
