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

  return res.json({
    escopo: 'empresa',
    totalUsuariosEmpresa,
    pedidosHoje: 0,
    faturamentoHoje: 0,
    aviso: 'Módulo de pedidos ainda será construído na Fase 3.'
  });
}

module.exports = { resumo };
