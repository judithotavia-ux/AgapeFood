const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');

const STATUS_VALIDOS = ['ATIVO', 'INATIVO', 'FERIAS', 'AFASTADO'];

const CAMPOS_PUBLICOS = {
  id: true, nome: true, nomeExibicao: true, email: true, cpf: true, telefone: true, whatsapp: true,
  dataNascimento: true, dataAdmissao: true, matricula: true, fotoUrl: true, statusGarcom: true,
  ativo: true, observacoes: true, criadoEm: true, ultimoLoginEm: true,
  percentualRateioGorjeta: true, pontosGorjeta: true
};

async function listar(req, res) {
  const garcons = await prisma.usuario.findMany({
    where: { empresaId: req.usuario.empresaId, papel: 'GARCOM' },
    select: CAMPOS_PUBLICOS,
    orderBy: { nome: 'asc' }
  });
  res.json(garcons);
}

async function obter(req, res) {
  const { id } = req.params;
  const garcom = await prisma.usuario.findFirst({
    where: { id, empresaId: req.usuario.empresaId, papel: 'GARCOM' },
    select: CAMPOS_PUBLICOS
  });
  if (!garcom) return res.status(404).json({ erro: 'Garçom não encontrado.' });
  res.json(garcom);
}

async function criar(req, res) {
  const {
    nome, nomeExibicao, cpf, telefone, whatsapp, email, dataNascimento, dataAdmissao,
    matricula, fotoUrl, statusGarcom, observacoes, senha, percentualRateioGorjeta, pontosGorjeta
  } = req.body || {};

  if (!nome || !nome.trim()) return res.status(400).json({ erro: 'Informe o nome completo.' });
  if (!email || !email.trim()) return res.status(400).json({ erro: 'Informe o e-mail de acesso.' });
  if (!senha || senha.length < 6) return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });
  if (statusGarcom && !STATUS_VALIDOS.includes(statusGarcom)) return res.status(400).json({ erro: 'Status inválido.' });

  const emailLimpo = email.trim().toLowerCase();
  const existente = await prisma.usuario.findUnique({ where: { email: emailLimpo } });
  if (existente) return res.status(400).json({ erro: 'Já existe uma conta com esse e-mail.' });

  const senhaHash = await bcrypt.hash(senha, 10);

  const garcom = await prisma.usuario.create({
    data: {
      nome: nome.trim(),
      nomeExibicao: nomeExibicao?.trim() || null,
      email: emailLimpo,
      senhaHash,
      papel: 'GARCOM',
      cpf: cpf || null,
      telefone: telefone || null,
      whatsapp: whatsapp || null,
      dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
      dataAdmissao: dataAdmissao ? new Date(dataAdmissao) : null,
      matricula: matricula || null,
      fotoUrl: fotoUrl || null,
      statusGarcom: statusGarcom || 'ATIVO',
      observacoes: observacoes || null,
      percentualRateioGorjeta: percentualRateioGorjeta !== undefined && percentualRateioGorjeta !== '' ? Number(percentualRateioGorjeta) : null,
      pontosGorjeta: pontosGorjeta !== undefined && pontosGorjeta !== '' ? Number(pontosGorjeta) : null,
      empresaId: req.usuario.empresaId
    },
    select: CAMPOS_PUBLICOS
  });

  res.status(201).json(garcom);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const existente = await prisma.usuario.findFirst({ where: { id, empresaId: req.usuario.empresaId, papel: 'GARCOM' } });
  if (!existente) return res.status(404).json({ erro: 'Garçom não encontrado.' });

  const {
    nome, nomeExibicao, cpf, telefone, whatsapp, dataNascimento, dataAdmissao,
    matricula, fotoUrl, statusGarcom, observacoes, percentualRateioGorjeta, pontosGorjeta
  } = req.body || {};

  if (statusGarcom && !STATUS_VALIDOS.includes(statusGarcom)) return res.status(400).json({ erro: 'Status inválido.' });

  const garcom = await prisma.usuario.update({
    where: { id },
    data: {
      nome: nome !== undefined ? nome.trim() : existente.nome,
      nomeExibicao: nomeExibicao !== undefined ? (nomeExibicao?.trim() || null) : existente.nomeExibicao,
      cpf: cpf !== undefined ? cpf : existente.cpf,
      telefone: telefone !== undefined ? telefone : existente.telefone,
      whatsapp: whatsapp !== undefined ? whatsapp : existente.whatsapp,
      dataNascimento: dataNascimento !== undefined ? (dataNascimento ? new Date(dataNascimento) : null) : existente.dataNascimento,
      dataAdmissao: dataAdmissao !== undefined ? (dataAdmissao ? new Date(dataAdmissao) : null) : existente.dataAdmissao,
      matricula: matricula !== undefined ? matricula : existente.matricula,
      fotoUrl: fotoUrl !== undefined ? fotoUrl : existente.fotoUrl,
      statusGarcom: statusGarcom !== undefined ? statusGarcom : existente.statusGarcom,
      observacoes: observacoes !== undefined ? observacoes : existente.observacoes,
      percentualRateioGorjeta: percentualRateioGorjeta !== undefined ? (percentualRateioGorjeta === '' ? null : Number(percentualRateioGorjeta)) : existente.percentualRateioGorjeta,
      pontosGorjeta: pontosGorjeta !== undefined ? (pontosGorjeta === '' ? null : Number(pontosGorjeta)) : existente.pontosGorjeta,
      ativo: statusGarcom !== undefined ? statusGarcom !== 'INATIVO' : existente.ativo
    },
    select: CAMPOS_PUBLICOS
  });

  res.json(garcom);
}

async function redefinirSenha(req, res) {
  const { id } = req.params;
  const { novaSenha } = req.body || {};
  if (!novaSenha || novaSenha.length < 6) return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });

  const existente = await prisma.usuario.findFirst({ where: { id, empresaId: req.usuario.empresaId, papel: 'GARCOM' } });
  if (!existente) return res.status(404).json({ erro: 'Garçom não encontrado.' });

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await prisma.usuario.update({ where: { id }, data: { senhaHash } });
  res.json({ mensagem: 'Senha redefinida com sucesso.' });
}

async function meuDesempenho(req, res) {
  const garcomId = req.usuario.id;
  const empresaId = req.usuario.empresaId;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [pedidosHoje, pedidosMes, distribuicoes] = await Promise.all([
    prisma.pedido.findMany({
      where: { garcomId, empresaId, criadoEm: { gte: hoje }, status: { not: 'CANCELADO' } },
      select: { valorTotal: true }
    }),
    prisma.pedido.findMany({
      where: { garcomId, empresaId, criadoEm: { gte: inicioMes }, status: { not: 'CANCELADO' } },
      select: { id: true, valorTotal: true, gorjetaValor: true, mesaId: true }
    }),
    prisma.distribuicaoGorjeta.findMany({
      where: { garcomId, fechamento: { empresaId } },
      select: { valor: true, status: true, fechamento: { select: { periodoFim: true } } },
      orderBy: { criadoEm: 'desc' }
    })
  ]);

  const vendasHoje = pedidosHoje.reduce((s, p) => s + Number(p.valorTotal), 0);
  const vendasMes = pedidosMes.reduce((s, p) => s + Number(p.valorTotal), 0);
  const mesasAtendidasMes = new Set(pedidosMes.map((p) => p.mesaId).filter(Boolean)).size;
  const ticketMedioMes = pedidosMes.length ? vendasMes / pedidosMes.length : 0;
  const gorjetaGeradaMes = pedidosMes.reduce((s, p) => s + Number(p.gorjetaValor), 0);
  const gorjetaPaga = distribuicoes.filter((d) => d.status === 'PAGO').reduce((s, d) => s + Number(d.valor), 0);
  const gorjetaPendente = distribuicoes.filter((d) => d.status === 'PENDENTE').reduce((s, d) => s + Number(d.valor), 0);
  const ultimoFechamento = distribuicoes[0]?.fechamento?.periodoFim || null;

  res.json({
    vendasHoje, pedidosHoje: pedidosHoje.length,
    vendasMes, pedidosMes: pedidosMes.length,
    mesasAtendidasMes, ticketMedioMes,
    gorjetaGeradaMes, gorjetaPaga, gorjetaPendente,
    ultimoFechamento
  });
}

async function desativar(req, res) {
  const { id } = req.params;
  const existente = await prisma.usuario.findFirst({ where: { id, empresaId: req.usuario.empresaId, papel: 'GARCOM' } });
  if (!existente) return res.status(404).json({ erro: 'Garçom não encontrado.' });

  const garcom = await prisma.usuario.update({
    where: { id },
    data: { ativo: false, statusGarcom: 'INATIVO' },
    select: CAMPOS_PUBLICOS
  });
  res.json(garcom);
}

module.exports = { listar, obter, criar, atualizar, redefinirSenha, desativar, meuDesempenho };
