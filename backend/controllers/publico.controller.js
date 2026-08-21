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

  const configGorjeta = await prisma.configuracaoGorjeta.findUnique({ where: { empresaId: empresa.id } });

  // Cupons ativos e ainda validos, com o texto da campanha ativa vinculada a cada um (se tiver) -
  // mostrado no rodape do cardapio publico, junto das redes sociais.
  const cuponsAtivos = await prisma.cupom.findMany({
    where: {
      empresaId: empresa.id, ativo: true,
      OR: [{ validoAte: null }, { validoAte: { gte: new Date() } }]
    },
    include: { campanhas: { where: { status: 'ATIVA' }, orderBy: { criadoEm: 'desc' }, take: 1 } },
    orderBy: { criadoEm: 'desc' },
    take: 3
  });
  const promocoes = cuponsAtivos.map((c) => ({
    codigo: c.codigo, tipoDesconto: c.tipoDesconto, valor: Number(c.valor), texto: c.campanhas[0]?.texto || null
  }));

  res.json({
    empresa: {
      nome: empresa.nome, slug: empresa.slug,
      logoUrl: empresa.exibirLogoCardapio ? (empresa.logoCardapioUrl || empresa.logoUrl) : null,
      slogan: empresa.exibirSloganCardapio ? empresa.slogan : null,
      corPrimaria: empresa.corPrimaria, corSecundaria: empresa.corSecundaria, corDestaque: empresa.corDestaque, corTexto: empresa.corTexto,
      exibirMarcaAgapeFood: empresa.exibirMarcaAgapeFood,
      whatsapp: empresa.whatsapp, telefone: empresa.telefone, instagram: empresa.instagram, facebook: empresa.facebook,
      tiktok: empresa.tiktok, youtube: empresa.youtube, site: empresa.site
    },
    categorias: categorias.filter((c) => c.produtos.length > 0),
    promocoes,
    gorjeta: configGorjeta?.ativa
      ? {
          ativa: true,
          percentualPadrao: Number(configGorjeta.percentualPadrao),
          permitirClienteEscolher: configGorjeta.permitirClienteEscolher,
          opcoesPercentual: JSON.parse(configGorjeta.opcoesPercentual),
          permitirValorFixo: configGorjeta.permitirValorFixo
        }
      : { ativa: false }
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
    res.status(201).json({
      id: pedido.id, numero: pedido.numero, valorTotal: Number(pedido.valorTotal), status: pedido.status,
      gorjetaValor: Number(pedido.gorjetaValor), totalComGorjeta: Number(pedido.valorTotal) + Number(pedido.gorjetaValor)
    });
  } catch (erro) {
    if (erro instanceof ErroPedido) return res.status(erro.status).json({ erro: erro.erro });
    throw erro;
  }
}

module.exports = { cardapio, criarPedido };
