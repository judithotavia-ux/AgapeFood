const prisma = require('../prisma/client');
const { emitirParaEmpresa } = require('../realtime/socket');
const { criarJobsParaPedido, criarJobCancelamento } = require('../services/impressao.service');

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
    include: { itens: true, mesa: true, motoboy: true },
    orderBy: { criadoEm: 'desc' },
    take: 200
  });

  res.json(pedidos);
}

async function obter(req, res) {
  const { id } = req.params;
  const pedido = await prisma.pedido.findFirst({
    where: { id, empresaId: req.usuario.empresaId },
    include: { itens: true, mesa: true, motoboy: true }
  });
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });
  res.json(pedido);
}

async function criar(req, res) {
  const {
    tipo, itens, clienteNome, clienteTelefone, clienteEndereco, formaPagamento, taxaEntrega, observacoes, mesaId,
    canalEntrega, motoboyId, taxaMotoboy, cupomCodigo, origem
  } = req.body || {};

  if (!tipo) return res.status(400).json({ erro: 'Informe o tipo do pedido.' });
  if (!Array.isArray(itens) || !itens.length) return res.status(400).json({ erro: 'O pedido precisa ter ao menos um item.' });
  if (tipo === 'DELIVERY' && !clienteEndereco) return res.status(400).json({ erro: 'Informe o endereço de entrega.' });
  if (tipo === 'MESA' && !mesaId) return res.status(400).json({ erro: 'Selecione a mesa.' });

  if (motoboyId) {
    const motoboy = await prisma.motoboy.findFirst({ where: { id: motoboyId, empresaId: req.usuario.empresaId } });
    if (!motoboy) return res.status(400).json({ erro: 'Motoboy inválido.' });
  }

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
      setorProducao: produto.setorProducao,
      adicionaisJson: adicionaisSelecionados.length
        ? JSON.stringify(adicionaisSelecionados.map((a) => ({ nome: a.nome, preco: Number(a.preco) })))
        : null
    });
  }

  const taxa = Number(taxaEntrega) || 0;
  valorTotal += taxa;

  let cupom = null;
  let valorDesconto = 0;
  if (cupomCodigo) {
    cupom = await prisma.cupom.findFirst({ where: { empresaId: req.usuario.empresaId, codigo: String(cupomCodigo).toUpperCase() } });
    if (!cupom) return res.status(400).json({ erro: 'Cupom não encontrado.' });
    if (!cupom.ativo) return res.status(400).json({ erro: 'Esse cupom está inativo.' });
    if (cupom.validoAte && new Date(cupom.validoAte) < new Date()) return res.status(400).json({ erro: 'Esse cupom expirou.' });
    if (cupom.usoMaximo !== null && cupom.usosAtuais >= cupom.usoMaximo) return res.status(400).json({ erro: 'Esse cupom atingiu o limite de usos.' });

    valorDesconto = cupom.tipoDesconto === 'PERCENTUAL' ? valorTotal * (Number(cupom.valor) / 100) : Number(cupom.valor);
    valorDesconto = Math.min(valorDesconto, valorTotal);
    valorTotal -= valorDesconto;
  }

  let clienteId = null;
  if (clienteTelefone && clienteTelefone.trim()) {
    const cliente = await prisma.cliente.upsert({
      where: { empresaId_telefone: { empresaId: req.usuario.empresaId, telefone: clienteTelefone.trim() } },
      update: { nome: clienteNome || undefined },
      create: { empresaId: req.usuario.empresaId, telefone: clienteTelefone.trim(), nome: clienteNome || null }
    });
    clienteId = cliente.id;
  }

  const numero = await proximoNumeroPedido(req.usuario.empresaId);

  const [pedido] = await prisma.$transaction([
    prisma.pedido.create({
      data: {
        numero,
        tipo,
        clienteNome: clienteNome || null,
        clienteTelefone: clienteTelefone || null,
        clienteEndereco: clienteEndereco || null,
        formaPagamento: formaPagamento || null,
        taxaEntrega: taxa,
        valorTotal,
        valorDesconto,
        observacoes: observacoes || null,
        empresaId: req.usuario.empresaId,
        mesaId: tipo === 'MESA' ? mesaId : null,
        canalEntrega: tipo === 'DELIVERY' ? (canalEntrega || 'MOTOBOY_PROPRIO') : null,
        motoboyId: tipo === 'DELIVERY' && motoboyId ? motoboyId : null,
        taxaMotoboy: tipo === 'DELIVERY' && taxaMotoboy !== undefined ? Number(taxaMotoboy) : null,
        clienteId,
        cupomId: cupom?.id || null,
        garcomNome: tipo === 'MESA' ? req.usuario.nome : null,
        origemPedido: origem || 'PAINEL',
        itens: { create: itensParaCriar }
      },
      include: { itens: true, mesa: true, motoboy: true }
    }),
    ...(cupom ? [prisma.cupom.update({ where: { id: cupom.id }, data: { usosAtuais: { increment: 1 } } })] : [])
  ]);

  emitirParaEmpresa(req.usuario.empresaId, 'pedido:novo', pedido);
  res.status(201).json(pedido);

  console.log('[DEBUG] chamando criarJobsParaPedido para pedido', pedido.id, 'com', pedido.itens.length, 'itens');
  criarJobsParaPedido(pedido)
    .then((jobs) => console.log('[DEBUG] criarJobsParaPedido retornou', jobs.length, 'jobs'))
    .catch((erro) => console.error('Falha ao criar jobs de impressão:', erro));
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

  if (status === 'ENTREGUE' && pedido.clienteId) {
    const empresa = await prisma.empresa.findUnique({ where: { id: req.usuario.empresaId }, select: { percentualCashback: true } });
    const percentual = Number(empresa.percentualCashback);
    if (percentual > 0) {
      const valorCashback = Number(atualizado.valorTotal) * (percentual / 100);
      await prisma.$transaction([
        prisma.transacaoCashback.create({
          data: { clienteId: pedido.clienteId, tipo: 'CREDITO', valor: valorCashback, motivo: `Pedido #${atualizado.numero}` }
        }),
        prisma.cliente.update({ where: { id: pedido.clienteId }, data: { saldoCashback: { increment: valorCashback } } })
      ]);
    }
  }

  emitirParaEmpresa(req.usuario.empresaId, 'pedido:atualizado', atualizado);
  res.json(atualizado);

  if (status === 'CANCELADO') {
    criarJobCancelamento(atualizado, 'Pedido cancelado.').catch((erro) => console.error('Falha ao criar job de cancelamento:', erro));
  }
}

async function cancelar(req, res) {
  const { id } = req.params;
  const { motivo } = req.body || {};
  const pedido = await prisma.pedido.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });
  if (['ENTREGUE', 'CANCELADO'].includes(pedido.status)) {
    return res.status(400).json({ erro: 'Este pedido não pode mais ser cancelado.' });
  }

  const atualizado = await prisma.pedido.update({ where: { id }, data: { status: 'CANCELADO' } });
  emitirParaEmpresa(req.usuario.empresaId, 'pedido:atualizado', atualizado);
  res.json(atualizado);

  criarJobCancelamento(atualizado, motivo).catch((erro) => console.error('Falha ao criar job de cancelamento:', erro));
}

module.exports = { listar, obter, criar, atualizarStatus, cancelar };
