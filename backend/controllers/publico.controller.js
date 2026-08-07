const prisma = require('../prisma/client');

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

module.exports = { cardapio };
