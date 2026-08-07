const prisma = require('../prisma/client');

async function listar(req, res) {
  const fornecedores = await prisma.fornecedor.findMany({
    where: { empresaId: req.usuario.empresaId },
    orderBy: { nome: 'asc' }
  });
  res.json(fornecedores);
}

async function criar(req, res) {
  const { nome, cnpjCpf, telefone, email, endereco, contato } = req.body || {};
  if (!nome || !nome.trim()) return res.status(400).json({ erro: 'Informe o nome do fornecedor.' });

  const fornecedor = await prisma.fornecedor.create({
    data: { nome: nome.trim(), cnpjCpf: cnpjCpf || null, telefone: telefone || null, email: email || null, endereco: endereco || null, contato: contato || null, empresaId: req.usuario.empresaId }
  });
  res.status(201).json(fornecedor);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const fornecedor = await prisma.fornecedor.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!fornecedor) return res.status(404).json({ erro: 'Fornecedor não encontrado.' });

  const { nome, cnpjCpf, telefone, email, endereco, contato, ativo } = req.body || {};
  const atualizado = await prisma.fornecedor.update({
    where: { id },
    data: {
      nome: nome?.trim() ?? fornecedor.nome,
      cnpjCpf: cnpjCpf !== undefined ? cnpjCpf : fornecedor.cnpjCpf,
      telefone: telefone !== undefined ? telefone : fornecedor.telefone,
      email: email !== undefined ? email : fornecedor.email,
      endereco: endereco !== undefined ? endereco : fornecedor.endereco,
      contato: contato !== undefined ? contato : fornecedor.contato,
      ativo: ativo !== undefined ? Boolean(ativo) : fornecedor.ativo
    }
  });
  res.json(atualizado);
}

async function remover(req, res) {
  const { id } = req.params;
  const fornecedor = await prisma.fornecedor.findFirst({ where: { id, empresaId: req.usuario.empresaId } });
  if (!fornecedor) return res.status(404).json({ erro: 'Fornecedor não encontrado.' });

  await prisma.fornecedor.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { listar, criar, atualizar, remover };
