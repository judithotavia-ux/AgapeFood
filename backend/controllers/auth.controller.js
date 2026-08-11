const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../prisma/client');
const emailService = require('../services/email.service');

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, empresaId: usuario.empresaId, papel: usuario.papel, nome: usuario.nome, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function login(req, res) {
  const { email, senha } = req.body || {};

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email: String(email).toLowerCase().trim() } });

  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }

  await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoLoginEm: new Date() } });

  const token = gerarToken(usuario);

  return res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      empresaId: usuario.empresaId
    }
  });
}

async function me(req, res) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario.id },
    include: { empresa: true }
  });

  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado.' });
  }

  return res.json({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    empresa: usuario.empresa ? { id: usuario.empresa.id, nome: usuario.empresa.nome, slug: usuario.empresa.slug } : null
  });
}

async function esqueciSenha(req, res) {
  const { email } = req.body || {};
  if (!email || !email.trim()) return res.status(400).json({ erro: 'Informe seu e-mail.' });

  const mensagemGenerica = { mensagem: 'Se esse e-mail estiver cadastrado, você vai receber um link para redefinir a senha em instantes.' };

  const usuario = await prisma.usuario.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!usuario || !usuario.ativo) return res.json(mensagemGenerica);

  if (!emailService.configurado()) {
    return res.status(503).json({ erro: 'O envio de e-mail ainda não foi configurado nesta instalação. Fale com o suporte AgapeFood.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiraEm = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.tokenResetSenha.create({ data: { token, expiraEm, usuarioId: usuario.id } });

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${baseUrl}/redefinir-senha?token=${token}`;

  try {
    await emailService.enviarEmailResetSenha({ destinatario: usuario.email, nome: usuario.nome, link });
  } catch (erro) {
    console.error('Falha ao enviar e-mail de reset de senha:', erro.message);
    return res.status(500).json({ erro: 'Não foi possível enviar o e-mail agora. Tente novamente em instantes.' });
  }

  res.json(mensagemGenerica);
}

async function redefinirSenha(req, res) {
  const { token, novaSenha } = req.body || {};
  if (!token) return res.status(400).json({ erro: 'Link inválido.' });
  if (!novaSenha || novaSenha.length < 6) return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });

  const registro = await prisma.tokenResetSenha.findUnique({ where: { token } });
  if (!registro || registro.usadoEm || registro.expiraEm < new Date()) {
    return res.status(400).json({ erro: 'Esse link é inválido ou já expirou. Peça um novo link de redefinição.' });
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);

  await prisma.$transaction([
    prisma.usuario.update({ where: { id: registro.usuarioId }, data: { senhaHash } }),
    prisma.tokenResetSenha.update({ where: { id: registro.id }, data: { usadoEm: new Date() } })
  ]);

  res.json({ mensagem: 'Senha redefinida com sucesso. Você já pode entrar com a nova senha.' });
}

async function definirPin(req, res) {
  const { pin, senhaAtual } = req.body || {};
  if (!pin || !/^\d{4,6}$/.test(String(pin))) return res.status(400).json({ erro: 'O PIN deve ter de 4 a 6 dígitos numéricos.' });
  if (!senhaAtual) return res.status(400).json({ erro: 'Informe sua senha atual para confirmar.' });

  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
  const senhaValida = await bcrypt.compare(senhaAtual, usuario.senhaHash);
  if (!senhaValida) return res.status(401).json({ erro: 'Senha atual incorreta.' });

  const pinHash = await bcrypt.hash(String(pin), 10);
  await prisma.usuario.update({ where: { id: usuario.id }, data: { pinHash } });
  res.json({ mensagem: 'PIN definido com sucesso.' });
}

async function removerPin(req, res) {
  await prisma.usuario.update({ where: { id: req.usuario.id }, data: { pinHash: null } });
  res.json({ mensagem: 'PIN removido.' });
}

async function statusPin(req, res) {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id }, select: { pinHash: true } });
  res.json({ pinDefinido: !!usuario.pinHash });
}

module.exports = { login, me, gerarToken, esqueciSenha, redefinirSenha, definirPin, removerPin, statusPin };
