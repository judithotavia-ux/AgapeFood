const prisma = require('../prisma/client');
const { emitirParaEmpresa } = require('../realtime/socket');
const { criarJobsParaPedido, criarJobCancelamento } = require('../services/impressao.service');
const { normalizarTelefone } = require('../utils/telefone');

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

class ErroPedido extends Error {
  constructor(status, erro) {
    super(erro);
    this.status = status;
    this.erro = erro;
  }
}

async function criarPedidoCore(empresaId, garcom, dados) {
  const {
    tipo, itens, clienteNome, clienteTelefone, clienteEndereco, formaPagamento, taxaEntrega, observacoes, mesaId,
    canalEntrega, motoboyId, taxaMotoboy, cupomCodigo, origem
  } = dados || {};

  if (!tipo) throw new ErroPedido(400, 'Informe o tipo do pedido.');
  if (!Array.isArray(itens) || !itens.length) throw new ErroPedido(400, 'O pedido precisa ter ao menos um item.');
  if (tipo === 'DELIVERY' && !clienteEndereco) throw new ErroPedido(400, 'Informe o endereço de entrega.');
  if (tipo === 'MESA' && !mesaId) throw new ErroPedido(400, 'Selecione a mesa.');

  if (motoboyId) {
    const motoboy = await prisma.motoboy.findFirst({ where: { id: motoboyId, empresaId } });
    if (!motoboy) throw new ErroPedido(400, 'Motoboy inválido.');
  }

  const produtoIds = itens.map((i) => i.produtoId).filter(Boolean);
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds }, empresaId },
    include: { adicionais: true }
  });
  const mapaProdutos = new Map(produtos.map((p) => [p.id, p]));

  let valorTotal = 0;
  const itensParaCriar = [];

  for (const item of itens) {
    const produto = mapaProdutos.get(item.produtoId);
    if (!produto) throw new ErroPedido(400, 'Um dos produtos selecionados não foi encontrado.');

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
    cupom = await prisma.cupom.findFirst({ where: { empresaId, codigo: String(cupomCodigo).toUpperCase() } });
    if (!cupom) throw new ErroPedido(400, 'Cupom não encontrado.');
    if (!cupom.ativo) throw new ErroPedido(400, 'Esse cupom está inativo.');
    if (cupom.validoAte && new Date(cupom.validoAte) < new Date()) throw new ErroPedido(400, 'Esse cupom expirou.');
    if (cupom.usoMaximo !== null && cupom.usosAtuais >= cupom.usoMaximo) throw new ErroPedido(400, 'Esse cupom atingiu o limite de usos.');

    valorDesconto = cupom.tipoDesconto === 'PERCENTUAL' ? valorTotal * (Number(cupom.valor) / 100) : Number(cupom.valor);
    valorDesconto = Math.min(valorDesconto, valorTotal);
    valorTotal -= valorDesconto;
  }

  let clienteId = null;
  if (clienteTelefone && clienteTelefone.trim()) {
    const telefoneNormalizado = normalizarTelefone(clienteTelefone);
    const cliente = await prisma.cliente.upsert({
      where: { empresaId_telefone: { empresaId, telefone: telefoneNormalizado } },
      update: { nome: clienteNome || undefined },
      create: { empresaId, telefone: telefoneNormalizado, nome: clienteNome || null }
    });
    clienteId = cliente.id;
  }

  const numero = await proximoNumeroPedido(empresaId);

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
        empresaId,
        mesaId: tipo === 'MESA' ? mesaId : null,
        canalEntrega: tipo === 'DELIVERY' ? (canalEntrega || 'MOTOBOY_PROPRIO') : null,
        motoboyId: tipo === 'DELIVERY' && motoboyId ? motoboyId : null,
        taxaMotoboy: tipo === 'DELIVERY' && taxaMotoboy !== undefined ? Number(taxaMotoboy) : null,
        clienteId,
        cupomId: cupom?.id || null,
        garcomNome: tipo === 'MESA' ? garcom?.nome || null : null,
        garcomId: tipo === 'MESA' ? garcom?.id || null : null,
        origemPedido: origem || 'PAINEL',
        itens: { create: itensParaCriar }
      },
      include: { itens: true, mesa: true, motoboy: true }
    }),
    ...(cupom ? [prisma.cupom.update({ where: { id: cupom.id }, data: { usosAtuais: { increment: 1 } } })] : [])
  ]);

  emitirParaEmpresa(empresaId, 'pedido:novo', pedido);

  criarJobsParaPedido(pedido).catch((erro) => console.error('Falha ao criar jobs de impressão:', erro));

  return pedido;
}

async function criar(req, res) {
  try {
    const pedido = await criarPedidoCore(req.usuario.empresaId, { id: req.usuario.id, nome: req.usuario.nome }, req.body || {});
    res.status(201).json(pedido);
  } catch (erro) {
    if (erro instanceof ErroPedido) return res.status(erro.status).json({ erro: erro.erro });
    throw erro;
  }
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

module.exports = { listar, obter, criar, atualizarStatus, cancelar, criarPedidoCore, ErroPedido };
