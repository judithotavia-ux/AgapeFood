const prisma = require('../prisma/client');

async function resumo(req, res) {
  const { empresaId, papel } = req.usuario;

  if (papel === 'SUPER_ADMIN') {
    const totalEmpresas = await prisma.empresa.count();
    const totalUsuarios = await prisma.usuario.count();
    return res.json({
      escopo: 'saas',
      totalEmpresas,
      totalUsuarios
    });
  }

  const totalUsuariosEmpresa = empresaId
    ? await prisma.usuario.count({ where: { empresaId } })
    : 0;

  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);

  const pedidosHojeLista = empresaId
    ? await prisma.pedido.findMany({
        where: { empresaId, criadoEm: { gte: inicioDoDia }, status: { not: 'CANCELADO' } },
        select: { valorTotal: true, status: true }
      })
    : [];

  const pedidosHoje = pedidosHojeLista.length;
  const faturamentoHoje = pedidosHojeLista.reduce((soma, p) => soma + Number(p.valorTotal), 0);
  const pedidosPendentes = pedidosHojeLista.filter((p) => !['ENTREGUE', 'CANCELADO'].includes(p.status)).length;

  return res.json({
    escopo: 'empresa',
    totalUsuariosEmpresa,
    pedidosHoje,
    faturamentoHoje,
    pedidosPendentes
  });
}

module.exports = { resumo };
