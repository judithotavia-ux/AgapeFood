const prisma = require('../prisma/client');

const TIPO_POR_ROTA = {
  ifood: 'IFOOD',
  ubereats: 'UBER_EATS',
  '99food': 'NOVENTA_NOVE_FOOD'
};

async function proximoNumeroPedido(empresaId) {
  const contador = await prisma.contadorPedido.upsert({
    where: { empresaId },
    update: { ultimoNumero: { increment: 1 } },
    create: { empresaId, ultimoNumero: 1 }
  });
  return contador.ultimoNumero;
}

// Endpoint generico que recebe pedidos de plataformas parceiras (iFood, Uber Eats, 99Food).
// Pronto para ser plugado assim que a empresa fechar parceria oficial com cada plataforma:
// o campo de mapeamento do payload (abaixo) pode precisar de ajuste conforme a documentacao
// oficial de cada uma, ja que cada plataforma tem seu proprio formato de webhook.
async function receberPedido(req, res) {
  const { rota, empresaSlug } = req.params;
  const tipo = TIPO_POR_ROTA[rota];
  if (!tipo) return res.status(404).json({ erro: 'Canal de entrega não reconhecido.' });

  const token = req.headers['x-webhook-token'] || req.query.token;
  if (!token) return res.status(401).json({ erro: 'Token do webhook não informado.' });

  const empresa = await prisma.empresa.findUnique({ where: { slug: empresaSlug } });
  if (!empresa) return res.status(404).json({ erro: 'Empresa não encontrada.' });

  const canal = await prisma.canalEntregaConfig.findFirst({ where: { empresaId: empresa.id, tipo } });
  if (!canal || canal.webhookToken !== token) return res.status(401).json({ erro: 'Token inválido.' });
  if (!canal.ativo) return res.status(400).json({ erro: `Canal ${tipo} está desativado nas configurações de delivery.` });

  const { idExterno, cliente, endereco, itens, taxaEntrega, observacoes } = req.body || {};

  if (!idExterno) return res.status(400).json({ erro: 'idExterno é obrigatório (identificador do pedido na plataforma de origem).' });
  if (!Array.isArray(itens) || !itens.length) return res.status(400).json({ erro: 'O pedido precisa ter ao menos um item.' });

  const existente = await prisma.pedido.findFirst({ where: { empresaId: empresa.id, canalEntrega: tipo, idExterno: String(idExterno) } });
  if (existente) return res.status(200).json({ ok: true, duplicado: true, pedidoId: existente.id });

  const itensParaCriar = itens.map((i) => ({
    nomeProduto: i.nome,
    precoUnitario: Number(i.precoUnitario) || 0,
    quantidade: Number(i.quantidade) || 1,
    observacoes: i.observacoes || null
  }));

  const totalItens = itensParaCriar.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  const taxa = Number(taxaEntrega) || 0;

  const numero = await proximoNumeroPedido(empresa.id);

  const pedido = await prisma.pedido.create({
    data: {
      numero,
      tipo: 'DELIVERY',
      canalEntrega: tipo,
      idExterno: String(idExterno),
      clienteNome: cliente?.nome || null,
      clienteTelefone: cliente?.telefone || null,
      clienteEndereco: endereco || null,
      taxaEntrega: taxa,
      valorTotal: totalItens + taxa,
      observacoes: observacoes || null,
      empresaId: empresa.id,
      itens: { create: itensParaCriar }
    },
    include: { itens: true }
  });

  res.status(201).json({ ok: true, pedidoId: pedido.id, numero: pedido.numero });
}

module.exports = { receberPedido };
