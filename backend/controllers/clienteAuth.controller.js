const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');
const { normalizarTelefone } = require('../utils/telefone');
const emailService = require('../services/email.service');

function mascararEmail(email) {
  const [usuario, dominio] = String(email).split('@');
  if (!dominio) return email;
  const visivel = usuario.slice(0, 2);
  return `${visivel}${'•'.repeat(Math.max(usuario.length - 2, 3))}@${dominio}`;
}

function gerarCodigo() {
  return String(crypto.randomInt(100000, 1000000));
}

function gerarTokenCliente(cliente) {
  return jwt.sign(
    { clienteId: cliente.id, empresaId: cliente.empresaId, tipo: 'CLIENTE', telefone: cliente.telefone },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

async function solicitarAcesso(req, res) {
  const { telefone, slugEmpresa, nome, email } = req.body || {};
  if (!telefone || !telefone.trim()) return res.status(400).json({ erro: 'Informe seu telefone.' });
  if (!slugEmpresa) return res.status(400).json({ erro: 'Restaurante inválido.' });

  const empresa = await prisma.empresa.findUnique({ where: { slug: slugEmpresa } });
  if (!empresa || !empresa.ativo) return res.status(404).json({ erro: 'Restaurante não encontrado.' });

  const telefoneNormalizado = normalizarTelefone(telefone);
  let cliente = await prisma.cliente.findUnique({
    where: { empresaId_telefone: { empresaId: empresa.id, telefone: telefoneNormalizado } }
  });

  if (!cliente) {
    if (!nome || !nome.trim() || !email || !email.trim()) {
      return res.json({ enviado: false, precisaCadastro: true });
    }
    cliente = await prisma.cliente.create({
      data: { empresaId: empresa.id, telefone: telefoneNormalizado, nome: nome.trim(), email: email.trim().toLowerCase() }
    });
  } else if (!cliente.email) {
    if (!email || !email.trim()) {
      return res.json({ enviado: false, precisaEmail: true });
    }
    cliente = await prisma.cliente.update({
      where: { id: cliente.id },
      data: { email: email.trim().toLowerCase(), nome: nome?.trim() || cliente.nome }
    });
  } else if (!cliente.ativo) {
    return res.status(403).json({ erro: 'Essa conta está desativada.' });
  }

  if (!emailService.configurado()) {
    return res.status(503).json({ erro: 'O envio de e-mail ainda não foi configurado nesta instalação. Fale com o restaurante.' });
  }

  const codigo = gerarCodigo();
  const codigoHash = await bcrypt.hash(codigo, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otpCliente.create({
    data: { telefone: telefoneNormalizado, codigoHash, expiresAt, empresaId: empresa.id }
  });

  try {
    await emailService.enviarEmailOtpCliente({ destinatario: cliente.email, nome: cliente.nome, codigo, empresaNome: empresa.nome });
  } catch (erro) {
    console.error('Falha ao enviar OTP de cliente:', erro.message);
    return res.status(500).json({ erro: 'Não foi possível enviar o código agora. Tente novamente.' });
  }

  res.json({ enviado: true, emailMascarado: mascararEmail(cliente.email) });
}

async function verificarOtp(req, res) {
  const { telefone, codigo, slugEmpresa } = req.body || {};
  if (!telefone || !codigo) return res.status(400).json({ erro: 'Informe o telefone e o código.' });

  const empresa = await prisma.empresa.findUnique({ where: { slug: slugEmpresa } });
  if (!empresa) return res.status(404).json({ erro: 'Restaurante não encontrado.' });

  const telefoneNormalizado = normalizarTelefone(telefone);

  const otp = await prisma.otpCliente.findFirst({
    where: { empresaId: empresa.id, telefone: telefoneNormalizado, verificadoEm: null },
    orderBy: { criadoEm: 'desc' }
  });

  if (!otp || otp.expiresAt < new Date()) {
    return res.status(400).json({ erro: 'Código inválido ou expirado. Peça um novo código.' });
  }
  if (otp.tentativas >= 5) {
    return res.status(400).json({ erro: 'Muitas tentativas erradas. Peça um novo código.' });
  }

  const valido = await bcrypt.compare(String(codigo), otp.codigoHash);
  if (!valido) {
    await prisma.otpCliente.update({ where: { id: otp.id }, data: { tentativas: { increment: 1 } } });
    return res.status(400).json({ erro: 'Código incorreto.' });
  }

  const cliente = await prisma.cliente.findUnique({
    where: { empresaId_telefone: { empresaId: empresa.id, telefone: telefoneNormalizado } }
  });
  if (!cliente || !cliente.ativo) return res.status(404).json({ erro: 'Conta não encontrada.' });

  await prisma.$transaction([
    prisma.otpCliente.update({ where: { id: otp.id }, data: { verificadoEm: new Date() } }),
    prisma.cliente.update({ where: { id: cliente.id }, data: { ultimoAcessoEm: new Date() } })
  ]);

  const token = gerarTokenCliente(cliente);
  res.json({
    token,
    cliente: { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone, email: cliente.email, saldoCashback: Number(cliente.saldoCashback) }
  });
}

module.exports = { solicitarAcesso, verificarOtp };
