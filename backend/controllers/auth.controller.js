const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

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

module.exports = { login, me, gerarToken };
