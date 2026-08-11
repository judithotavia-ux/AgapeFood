const prisma = require('../prisma/client');
const { criarPedidoCore, ErroPedido } = require('./pedido.controller');

async function cardapio(req, res) {
  const { slug } = req.params;

  const empresa = await prisma.empresa.findUnique({ where: { slug } });
  if (!empresa || !empresa.ativo) return res.status(404).json({ erro: 'Restaurante não encontrado.' });

  const categorias = await prisma.categoria.findMany({
    where: { empresaId: empresa.id, ativo: true },
    orderBy: { ordem: 'asc' },
    include: {
      produtos: {
        where: { disponivel: true },
        orderBy: { ordem: 'asc' },
        include: { adicionais: { where: { ativo: true } } }
      }
    }
  });

  res.json({
    empresa: { nome: empresa.nome, slug: empresa.slug, logoUrl: empresa.logoUrl, corPrimaria: empresa.corPrimaria },
    categorias: categorias.filter((c) => c.produtos.length > 0)
  });
}

async function criarPedido(req, res) {
  const { slug } = req.params;
  const empresa = await prisma.empresa.findUnique({ where: { slug } });
  if (!empresa || !empresa.ativo) return res.status(404).json({ erro: 'Restaurante não encontrado.' });

  const dados = { ...(req.body || {}), origem: 'CARDAPIO_DIGITAL' };

  if (dados.tipo === 'MESA' && dados.mesaNumero) {
    const mesa = await prisma.mesa.findFirst({ where: { empresaId: empresa.id, numero: Number(dados.mesaNumero), ativo: true } });
    if (!mesa) return res.status(400).json({ erro: 'Mesa não encontrada.' });
    dados.mesaId = mesa.id;
  }

  try {
    const pedido = await criarPedidoCore(empresa.id, null, dados);
    res.status(201).json({ id: pedido.id, numero: pedido.numero, valorTotal: Number(pedido.valorTotal), status: pedido.status });
  } catch (erro) {
    if (erro instanceof ErroPedido) return res.status(erro.status).json({ erro: erro.erro });
    throw erro;
  }
}

module.exports = { cardapio, criarPedido };
