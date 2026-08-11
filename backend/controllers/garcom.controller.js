const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');

const STATUS_VALIDOS = ['ATIVO', 'INATIVO', 'FERIAS', 'AFASTADO'];

const CAMPOS_PUBLICOS = {
  id: true, nome: true, nomeExibicao: true, email: true, cpf: true, telefone: true, whatsapp: true,
  dataNascimento: true, dataAdmissao: true, matricula: true, fotoUrl: true, statusGarcom: true,
  ativo: true, observacoes: true, criadoEm: true, ultimoLoginEm: true
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
    matricula, fotoUrl, statusGarcom, observacoes, senha
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
    matricula, fotoUrl, statusGarcom, observacoes
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

module.exports = { listar, obter, criar, atualizar, redefinirSenha, desativar };
